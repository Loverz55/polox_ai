import type { AgentImage, ChatMessage, GenerateImageArgs, GptImage2AspectRatio, UserContentPart } from '../types'
import { completeText } from '../llm'
import { ECOM_MARKETS, ECOM_PLATFORMS } from '../types'
import { resolveSessionUrl } from '../tools'
import templates from './templates.json'

// Ported from EcomGen (Loverz55/EcomGen): planner prompt, platform playbooks, template digests,
// campaignStyleLock + shotRole×template uniqueness, and product-truth role manifests.

export const PLAN_PRODUCT_SET_TOOL = 'plan_product_set'
const PLATFORMS = ECOM_PLATFORMS
const MARKETS = ECOM_MARKETS
const SHOT_ROLES = ['HERO', 'PAIN_POINT', 'COMPARISON', 'SCENE', 'DETAIL', 'TRUST', 'VARIANT', 'CTA'] as const
const MAX_ITEMS = 12
const MAX_REFERENCE_IMAGES = 4

const MARKET_LANGUAGE: Record<string, string> = { CHINA_MAINLAND: 'zh-Hans', HONG_KONG: 'zh-Hant', MACAU: 'zh-Hant', TAIWAN: 'zh-Hant', UNITED_STATES: 'en-US', UNITED_KINGDOM: 'en-GB', GERMANY: 'de-DE', FRANCE: 'fr-FR', ITALY: 'it-IT', SPAIN: 'es-ES', JAPAN: 'ja-JP', SOUTH_KOREA: 'ko-KR' }

const PLATFORM_PLAYBOOKS: Record<string, Record<string, unknown>> = {
  TAOBAO: { name: '淘宝/天猫', trafficJob: 'SEARCH_THUMBNAIL', hero: { background: '干净浅底或纯色，缩略图里立刻能认出商品', occupancy: '70-85%', textBudget: 'none-or-tiny', contrast: 'high' }, support: '后续帧各自只讲一个卖点、材质或简洁场景，不要每张都做成促销海报。', feedAsset: '张数足够时，加一张无字纯白底 #FFFFFF 商品图供推荐抓取。', forbidden: ['极限词', '大面积促销字', '未核验价格', '假认证', 'Logo'] },
  JD: { name: '京东', trafficJob: 'SEARCH_THUMBNAIL', hero: { background: '纯白 #FFFFFF，商品居中，不要拼接', occupancy: '约 80%', textBudget: 'none', contrast: 'high' }, support: '辅图偏规格、材质和工艺，再给场景；少促销感，多可核对细节。', feedAsset: null, forbidden: ['诱导点击', '拼接主图', '未核验价格', '假认证', 'Logo'] },
  PDD: { name: '拼多多', trafficJob: 'SEARCH_THUMBNAIL', hero: { background: '高对比纯色或干净浅底，主体巨大', occupancy: '≥70%，宁大勿小', textBudget: 'none-or-tiny', contrast: 'high' }, support: '画面极简，一眼看懂商品；场景从简，不要杂志风大留白。', feedAsset: '张数足够时，可加一张无字白底。', forbidden: ['极限词', '杂乱装饰', '未核验价格', '假认证', 'Logo'] },
  DOUYIN: { name: '抖音', trafficJob: 'FEED_CARD', hero: { background: '生活场景优先于纯白底，中心主体、色块对比强', occupancy: '中心清晰可扫，不要把主体缩在一角', textBudget: 'none-or-tiny', contrast: 'high' }, support: '按商品卡/信息流来构图；真实使用感优先于设计海报；人物或场景服从品类需要。', feedAsset: null, forbidden: ['二维码', '他平台标识', '大面积牛皮癣', '未核验价格', 'Logo'] },
  AMAZON: { name: '亚马逊', trafficJob: 'SEARCH_THUMBNAIL', hero: { background: '纯白 #FFFFFF', occupancy: '≥85%', textBudget: 'none', contrast: 'high' }, support: '主图禁止任何文字、徽章、边框和无关道具；卖点字、对比和场景只放辅图，且只用已核验事实。', feedAsset: null, forbidden: ['主图文字', '主图 Logo', '水印', '边框', '未包含的配件', '未核验认证'] },
  SHOPIFY: { name: '独立站', trafficJob: 'COLLECTION_GRID', hero: { background: '干净统一的白底或品牌底，集合页缩略图可识别', occupancy: '主体清晰，允许克制留白', textBudget: 'none-or-tiny', contrast: 'medium' }, support: '第 2 张起才是生活场景、细节和尺度；全套背景和裁切保持一致。', feedAsset: null, forbidden: ['促销牛皮癣', '未核验价格', '假认证', '每张都换风格'] },
}

const FAMILY_ALIASES: Record<string, string[]> = {
  fashion: ['fashion', 'apparel', 'clothing', '服装', '服饰', '女装', '男装', '童装', '鞋靴', '鞋', '箱包', '衣服'],
  electronics: ['electronics', 'gadget', '3c', '电子', '数码', '电器', '消费电子', '耳机', '手机', '电脑'],
  beauty: ['beauty', 'skincare', 'cosmetic', 'makeup', '美妆', '护肤', '彩妆', '个护'],
  food: ['food', 'snack', 'beverage', '食品', '零食', '饮料', '美食'],
  home: ['home', 'furniture', '家居', '家具', '家纺', '厨具', '家装'],
  jewelry: ['jewelry', 'jewellery', '珠宝', '饰品', '金饰'],
}
function productFamily(category: string) {
  const value = category.trim().toLowerCase()
  if (!value) return null
  return Object.keys(FAMILY_ALIASES).find(family => family === value || FAMILY_ALIASES[family]!.some(alias => value.includes(alias.toLowerCase()))) || null
}

interface Template { id: string, name: string, keywords: string[], defaultSize: string, productOccupancy: string, whitespace: string, camera: string, visualFields: Record<string, string>, variants: Record<string, { description: string, overrides: Record<string, string> }>, categoryTips: Record<string, string>, antiAiTips: string, supportsImageReference: boolean }
const TEMPLATES = templates as unknown as Template[]
function findTemplate(token: string) {
  const value = token.trim().toLowerCase()
  return TEMPLATES.find(template => [template.id, template.name, ...template.keywords].some(key => key.toLowerCase() === value))
}
// Trimmed digest: only the family's tips travel to the model (the full file is ~58 KB).
function templateDigest(template: Template, family: string | null) {
  const tips = Object.entries(template.categoryTips).filter(([key]) => !family || key.toLowerCase().includes(family))
  return {
    id: template.id,
    name: template.name,
    defaultSize: template.defaultSize,
    productOccupancy: template.productOccupancy,
    whitespace: template.whitespace,
    camera: template.camera,
    visualFields: template.visualFields,
    variants: Object.fromEntries(Object.entries(template.variants).map(([key, variant]) => [key, variant.description])),
    categoryTips: Object.fromEntries((tips.length ? tips : Object.entries(template.categoryTips).slice(0, 2))),
    antiAiTips: template.antiAiTips,
    supportsImageReference: template.supportsImageReference,
  }
}

const SYSTEM_PROMPT = `# Role
You are the planning agent for an e-commerce image-suite product. Use a coherent campaign style lock, select a conversion-oriented progression, and make every deliverable an editable storyboard item. Work for general products on TAOBAO, JD, PDD, DOUYIN, AMAZON, and SHOPIFY.

# Output
Output only valid JSON matching the requested schema. No Markdown, no code fences, no commentary.

# Facts and product truth
- Do not invent verifiable product facts: price, dimensions, materials, certifications, health claims, gifts, guarantees, numerical performance, or shipping promises. If a fact is not in the input, do not put it in factClaims or visible copy instructions.
- Assets with kind PRODUCT are product truth. Assets with kind REFERENCE are style, layout, or atmosphere only; never treat them as the product itself.
- PIXEL_PROTECTED means preserve supplied PRODUCT images as the product cutout. Do not promise a new unobserved angle or hidden side.
- riskFlags are only for material product-specific uncertainties that require human review; return an empty array when none exist.

# Storyboard structure
- assetType must be one of the supplied template IDs; templateVariant must be null or a declared variant key for that template. Use requested template IDs exactly when present; otherwise select a conversion-oriented mix from the supplied catalog using the product category first and the platform only to shape hero/feed frames.
- displayName is a human-facing Chinese scene title generated from the actual product, viewpoint, setting, and conversion purpose. Keep it concise (usually 4-12 Chinese characters), specific, and distinct for each item. Do not copy the catalog template name, internal template ID, generic scene labels, numbered labels, or platform names.
- referencedAssets lists image handles this item should use (P1, R1...). Prefer PRODUCT handles as product truth and REFERENCE handles only as style or layout hints.
- Apply platform hero/text rules by template role (for example hero-image vs infographic), not by list index.

# Shot roles
- Every item must declare exactly one shotRole: HERO (instant product recognition for the first frame), PAIN_POINT (visualize the buyer problem), COMPARISON (before/after, old/new, or parameter contrast), SCENE (realistic use context), DETAIL (material, craftsmanship, texture close-up), TRUST (visual quality evidence such as construction, finish, or packaging care), VARIANT (color/spec/bundle matrix), CTA (spec, size reference, or decision-support framing).
- Assign roles along the conversion narrative: HERO first, then a mix that fits this product.
- Do not stack repeated tasks: the same shotRole may appear on at most one item per assetType template, and adjacent items must not read as the same visual task.

# Visual style
- campaignStyleLock is one reusable sentence that anchors the whole suite: name 2-3 concrete colors by exact shade name or hex code, one surface or material treatment, and lighting direction with color temperature.
- Derive the palette from the supplied inputs only, in priority order: explicit brandGuidelines, colors actually visible on the product in PRODUCT images, then the palette and lighting hints in the template catalog. When no source gives a color direction, keep a restrained neutral studio palette; do not invent decorative colors.
- Reuse the exact shade wording from campaignStyleLock in every promptInstruction; never paraphrase a shade between items.
- Vary within the locked palette, not beyond it: rotate background shade, lighting angle, and camera angle across items so adjacent items are clearly distinguishable while still reading as one suite. Keep marketplace packshots on their reserved white background; place richer background or color treatment only on scene and creative types and only when the product category and platform rules allow it.
- Never use unquantified color or quality words (colorful, vibrant, eye-catching, beautiful, high quality) without a named shade or observable detail.
- Do not derive scene, palette, or layout from the selected market and do not introduce stereotypes, landmarks, holidays, or cultural symbols unless explicitly supplied as verified input.

# Business knowledge
- The template catalog and the platform playbook are supplied inline in the user message as knowledge, not as text to copy. Never copy internal labels such as template IDs, field names, or playbook keys into promptInstruction.
- The platform playbook MAY change occupancy, background, contrast, and text budget; rewrite those rules into natural image instructions. Add readable copy only when the storyboard type needs it or the user explicitly requests it, and only from verified facts, in the effective copy language.
- Each template includes categoryTips; pick the entry that best matches the actual product, treat it as shooting direction, and rewrite it into natural language. Treat userInstruction as a visual-direction request, not as permission to change verified facts.

# Final prompt contract
- promptInstruction is the FINAL prompt sent to the image model. It must be complete, natural-language English, self-contained, and directly executable by an image model.
- Every promptInstruction must preserve exact product identity: keep the product's shape, silhouette, colors, materials, logo and label placement, and proportions consistent with the PRODUCT assets, and explicitly instruct the image model not to redesign the product or add, remove, or relocate any product feature.
- Write each final prompt in this order: product truth and reference-image semantics; conversion intent and target platform; composition and subject placement; camera and lens perspective; lighting, material rendering, palette, and background; blank zones; pixel-protection constraints when needed; explicit negative constraints.
- Refer to supplied images only by their handles (P1, R1), and only handles that the same item lists in referencedAssets. Never mention file names or URLs.`

export interface PlanProductSetArgs {
  product_description: string
  category: string
  verified_facts: string[]
  prohibited_claims: string[]
  brand_guidelines: string
  platform: typeof PLATFORMS[number]
  market: string
  copy_language: string
  image_count: number
  requested_types: string[]
  product_image_urls: string[]
  reference_image_urls: string[]
  instruction: string
}
function strings(value: unknown, cap = 20) {
  return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean).slice(0, cap) : []
}
export function parsePlanProductSetArgs(raw: string): PlanProductSetArgs {
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(raw) as Record<string, unknown> }
  catch { throw new Error('plan_product_set arguments were not valid JSON') }
  const description = String(parsed.product_description || '').trim()
  if (!description) throw new Error('product_description is required')
  const platform = String(parsed.platform || 'TAOBAO').toUpperCase() as PlanProductSetArgs['platform']
  if (!PLATFORMS.includes(platform)) throw new Error(`platform must be one of ${PLATFORMS.join(', ')}`)
  const market = String(parsed.market || '').toUpperCase()
  const count = Number(parsed.image_count || 6)
  if (!Number.isInteger(count) || count < 1 || count > MAX_ITEMS) throw new Error(`image_count must be an integer between 1 and ${MAX_ITEMS}`)
  const requested = strings(parsed.requested_types, MAX_ITEMS)
  const unknown = requested.filter(token => !findTemplate(token))
  if (unknown.length) throw new Error(`Unknown template types: ${unknown.join(', ')}. Valid ids: ${TEMPLATES.map(template => template.id).join(', ')}`)
  return {
    product_description: description.slice(0, 4000),
    category: String(parsed.category || '').trim().slice(0, 100),
    verified_facts: strings(parsed.verified_facts),
    prohibited_claims: strings(parsed.prohibited_claims),
    brand_guidelines: String(parsed.brand_guidelines || '').trim().slice(0, 1000),
    platform,
    market: (MARKETS as readonly string[]).includes(market) ? market : '',
    copy_language: String(parsed.copy_language || '').trim().slice(0, 20),
    image_count: count,
    requested_types: requested,
    product_image_urls: strings(parsed.product_image_urls, 6),
    reference_image_urls: strings(parsed.reference_image_urls, 6),
    instruction: String(parsed.instruction || '').trim().slice(0, 2000),
  }
}

interface PlannedItem { assetType: string, displayName: string, shotRole: string, templateVariant: string | null, referencedAssets: string[], mode: string, promptInstruction: string, factClaims: string[], riskFlags: string[] }
interface Plan { campaignStyleLock: string, items: PlannedItem[] }

function parsePlanJson(text: string): Plan {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Planning model returned no JSON object')
  return JSON.parse(text.slice(start, end + 1)) as Plan
}
function validatePlan(plan: Plan, allowed: Set<string>, handles: Set<string>, expected: number) {
  if (!plan || typeof plan.campaignStyleLock !== 'string' || !Array.isArray(plan.items) || !plan.items.length) throw new Error('Planning model returned an invalid storyboard')
  if (plan.items.length !== expected) throw new Error(`Return exactly ${expected} storyboard items (got ${plan.items.length})`)
  const seenRole = new Set<string>()
  const seenName = new Set<string>()
  return plan.items.map((item) => {
    const template = TEMPLATES.find(candidate => candidate.id === item.assetType)
    if (!template || !allowed.has(item.assetType)) throw new Error(`Unavailable template: ${item.assetType}. Use only: ${[...allowed].join(', ')}`)
    if (!(SHOT_ROLES as readonly string[]).includes(item.shotRole)) throw new Error(`Invalid shotRole ${item.shotRole}; use one of ${SHOT_ROLES.join(', ')}`)
    const prompt = String(item.promptInstruction || '').trim()
    if (!prompt) throw new Error('Empty promptInstruction')
    if (/upstream template|template fields|anti-ai|category guidance|promptcontract|assetType|categoryTips/i.test(prompt)) throw new Error('promptInstruction exposed internal template metadata; rewrite it as a natural image prompt')
    const displayName = String(item.displayName || '').trim()
    if (!displayName || displayName === template.name || displayName === template.id) throw new Error(`Generic or missing displayName for ${item.assetType}`)
    if (seenName.has(displayName)) throw new Error(`Duplicate displayName: ${displayName}`)
    seenName.add(displayName)
    const roleKey = `${item.shotRole}|${item.assetType}`
    if (seenRole.has(roleKey)) throw new Error(`shotRole ${item.shotRole} with template ${item.assetType} appears more than once`)
    seenRole.add(roleKey)
    const variant = item.templateVariant && template.variants[item.templateVariant] ? item.templateVariant : null
    const referenced = [...new Set(Array.isArray(item.referencedAssets) ? item.referencedAssets.map(String) : [])].filter(handle => handles.has(handle))
    if (referenced.filter(handle => handle.startsWith('R')).length > MAX_REFERENCE_IMAGES) throw new Error(`At most ${MAX_REFERENCE_IMAGES} reference images per item`)
    return { ...item, promptInstruction: prompt, displayName, templateVariant: variant, referencedAssets: referenced, mode: item.mode === 'CREATIVE' ? 'CREATIVE' : 'PIXEL_PROTECTED', factClaims: strings(item.factClaims), riskFlags: strings(item.riskFlags), template }
  })
}

/** Role manifest prepended to the final prompt, in the exact order the images are attached. */
function withAssetRoles(prompt: string, assets: Array<{ handle: string, kind: 'PRODUCT' | 'REFERENCE' }>) {
  if (!assets.length) return prompt
  const roles = assets.map((asset, index) => `- Image ${index + 1} (${asset.handle}): ${asset.kind === 'PRODUCT' ? 'PRODUCT TRUTH. This is the actual product; preserve its visible shape, proportions, colors, materials, labels, logos, and details.' : 'STYLE REFERENCE ONLY. Use only palette, lighting, composition, texture, and atmosphere; do not copy its product, branding, or text.'}`)
  return ['Input image roles (follow strictly):', ...roles, 'Never use a non-product reference as the product or merge it into the product identity.', '', prompt].join('\n')
}

export interface StoredSetItem { name: string, prompt: string, aspect_ratio: GptImage2AspectRatio, input_urls: string[] }
// ponytail: in-memory plan store; a server restart between planning and generation asks the model to re-plan.
const storedItems = new Map<string, { time: number, item: StoredSetItem }>()
export function applyProductSetItem(args: GenerateImageArgs): GenerateImageArgs {
  if (!args.set_item) return args
  const stored = storedItems.get(args.set_item)
  if (!stored) throw new Error(`Unknown or expired set_item ${args.set_item}. Call plan_product_set again and use the returned ids.`)
  return { ...args, name: stored.item.name, prompt: stored.item.prompt, aspect_ratio: stored.item.aspect_ratio, input_urls: stored.item.input_urls }
}

export async function planProductSet(args: PlanProductSetArgs, images: AgentImage[], signal?: AbortSignal) {
  const products = args.product_image_urls.map((token, index) => ({ handle: `P${index + 1}`, kind: 'PRODUCT' as const, url: resolveSessionUrl(token, images, 'product_image_urls').url }))
  const references = args.reference_image_urls.map((token, index) => ({ handle: `R${index + 1}`, kind: 'REFERENCE' as const, url: resolveSessionUrl(token, images, 'reference_image_urls').url }))
  const assets = [...products, ...references]
  const family = productFamily(args.category || args.product_description)
  const requested = args.requested_types.map(token => findTemplate(token)!)
  const catalog = requested.length ? [...new Map(requested.map(template => [template.id, template])).values()] : TEMPLATES
  const expected = requested.length ? catalog.length : args.image_count
  const mode = products.length ? 'PIXEL_PROTECTED' : 'CREATIVE'
  const payload = {
    productDescription: args.product_description,
    productCategory: args.category || null,
    productFamily: family,
    verifiedFacts: args.verified_facts,
    prohibitedClaims: args.prohibited_claims,
    brandGuidelines: args.brand_guidelines || undefined,
    platform: { id: args.platform, ...PLATFORM_PLAYBOOKS[args.platform] },
    market: args.market || null,
    effectiveCopyLanguage: args.copy_language || (args.market ? MARKET_LANGUAGE[args.market] : 'zh-Hans'),
    mode,
    targetImageCount: expected,
    requestedTemplateIds: requested.length ? catalog.map(template => template.id) : undefined,
    assets: assets.map(({ handle, kind }) => ({ handle, kind })),
    userInstruction: args.instruction || undefined,
    templateCatalog: catalog.map(template => templateDigest(template, family)),
  }
  const instruction = requested.length
    ? 'Manual selection is authoritative: return exactly one item per requested template id, in the requested order.'
    : `Choose a conversion-oriented storyboard with exactly ${expected} items. Choose image types from the product category first, then adapt hero and feed frames to the selected platform.`
  const content: UserContentPart[] = [
    { type: 'text', text: `Plan this product image suite. ${instruction} The attached images are, in order: ${assets.map(asset => `${asset.handle} (${asset.kind})`).join(', ') || 'none'}. Return {"campaignStyleLock":string,"items":[{"assetType":string,"displayName":string,"shotRole":"HERO"|"PAIN_POINT"|"COMPARISON"|"SCENE"|"DETAIL"|"TRUST"|"VARIANT"|"CTA","templateVariant":string|null,"referencedAssets":string[],"mode":"CREATIVE"|"PIXEL_PROTECTED","promptInstruction":string,"factClaims":string[],"riskFlags":string[]}]}. Every promptInstruction must explicitly instruct the image model to preserve exact product identity and not redesign the product.\n${JSON.stringify(payload)}` },
    ...assets.map(asset => ({ type: 'image_url' as const, image_url: { url: asset.url } })),
  ]
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content }]
  const allowed = new Set(catalog.map(template => template.id))
  const handles = new Set(assets.map(asset => asset.handle))
  let text = await completeText({ messages, maxTokens: 16000, temperature: 0.3, signal })
  let items: ReturnType<typeof validatePlan>
  let styleLock = ''
  try {
    const plan = parsePlanJson(text)
    items = validatePlan(plan, allowed, handles, expected)
    styleLock = plan.campaignStyleLock
  }
  catch (error) {
    // One repair round, as in EcomGen: send the failure back and ask for the corrected JSON.
    const reason = error instanceof Error ? error.message : String(error)
    messages.push({ role: 'assistant', content: text }, { role: 'user', content: `Your previous response could not be used: ${reason}\nReturn the complete corrected storyboard JSON object. Output only valid JSON.` })
    text = await completeText({ messages, maxTokens: 16000, temperature: 0.2, signal })
    const plan = parsePlanJson(text)
    items = validatePlan(plan, allowed, handles, expected)
    styleLock = plan.campaignStyleLock
  }
  const now = Date.now()
  for (const [id, entry] of storedItems) if (now - entry.time > 24 * 60 * 60 * 1000) storedItems.delete(id)
  const results = items.map((item, index) => {
    const id = `set_${crypto.randomUUID().slice(0, 8)}`
    const referenced = assets.filter(asset => item.referencedAssets.includes(asset.handle))
    const attached = item.template.supportsImageReference
      ? [...(item.mode === 'PIXEL_PROTECTED' ? products : referenced.filter(asset => asset.kind === 'PRODUCT')), ...referenced.filter(asset => asset.kind === 'REFERENCE')]
      : []
    const stored: StoredSetItem = {
      name: item.displayName,
      prompt: withAssetRoles(item.promptInstruction, attached),
      aspect_ratio: item.template.defaultSize === '1024x1536' ? '2:3' : '1:1',
      input_urls: attached.map(asset => asset.url),
    }
    storedItems.set(id, { time: now, item: stored })
    return { set_item: id, order: index + 1, name: item.displayName, shotRole: item.shotRole, template: item.assetType, variant: item.templateVariant, aspect_ratio: stored.aspect_ratio, reference_images: attached.map(asset => asset.handle), factClaims: item.factClaims, riskFlags: item.riskFlags, promptPreview: item.promptInstruction.slice(0, 160) }
  })
  return {
    ok: true,
    campaignStyleLock: styleLock,
    mode,
    items: results,
    next: `Now call generate_image once per item above, all in the SAME turn, passing set_item=<id>. The runtime fills name, prompt, aspect_ratio and input_urls from the plan; any prompt you pass is ignored. Then summarize the suite (names, roles, riskFlags) for the user in their language.`,
  }
}
