import sharp from 'sharp'
import { readErrorMessage } from '~~/shared/utils/apiError'
import { readStoredMedia, saveMediaFile } from './localMedia'
import { readServiceSettings } from './serviceSettings'

export type ImageRelayFormat = 'openai' | 'gemini' | 'task'
const IMAGE_TIMEOUT_MS = 8 * 60 * 1000

// ponytail: app-id family → relay model name per API format. Edit here if your relay names differ.
const GEMINI_MODELS: Record<string, string> = {
  'nano-banana-pro': 'gemini-3-pro-image-preview',
  'nano-banana-2': 'gemini-3.1-flash-image-preview',
  'nano-banana-2-lite': 'gemini-3.1-flash-lite-image',
}
// Task-style relays (new-api "/v1/videos" job API, e.g. 521xxz): verified 2026-09-14.
const TASK_MODELS: Record<string, string> = {
  'gpt-image-2': 'gpt-image-2',
  'gpt-image-2-5': 'gpt-image-2.5-flare',
  'nano-banana-pro': 'nano-banana-pro',
  'nano-banana-2': 'nano-banana2',
  'nano-banana-2-lite': 'Nano Banana 2 Lite',
  'seedream/5-pro': 'seedream-5-pro',
}

function family(model: string) {
  return model.replace(/^(openai|fal-ai|google)\//, '').replace(/\/edit$/, '').replace(/-(text|image)-to-image$/, '')
}
function relayFormat(settings = readServiceSettings()): ImageRelayFormat {
  if (settings.imageFormat && settings.imageFormat !== 'auto')
    return settings.imageFormat
  const name = settings.imageModel || ''
  return /async$/i.test(name) ? 'task' : /gemini|banana/i.test(name) ? 'gemini' : 'openai'
}
export function relayImageTarget(model: string) {
  const settings = readServiceSettings()
  if (!settings.imageBaseUrl || !settings.imageKey)
    return null
  const key = family(model)
  const format = relayFormat(settings)
  if (format === 'task') {
    // The configured default model overrides the GPT family so "gpt-image-2.5-*" can be the agent default.
    const name = key === 'gpt-image-2' && settings.imageModel && !/^gpt-image-2(-async)?$/i.test(settings.imageModel) ? settings.imageModel : TASK_MODELS[key]
    return name ? { model: name, format } : null
  }
  if (key === 'gpt-image-2')
    return { model: settings.imageModel || 'gpt-image-2', format }
  if (GEMINI_MODELS[key])
    return { model: GEMINI_MODELS[key], format: 'gemini' as const }
  return null
}
export function isRelayImageModel(model: string) {
  return relayImageTarget(model) !== null
}

function base() {
  return readServiceSettings().imageBaseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')
}
function authHeaders() {
  return { Authorization: `Bearer ${readServiceSettings().imageKey}` }
}
async function imageBytes(url: string) {
  const local = await readStoredMedia(url, 30 * 1024 * 1024)
  if (local)
    return local
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok)
    throw new Error(`Failed to fetch reference image (${response.status})`)
  return { bytes: new Uint8Array(await response.arrayBuffer()), mime: response.headers.get('content-type')?.split(';')[0] || 'image/png' }
}
// Relays choke on multi-MB inline references (a 4 MB PNG timed out; 150 KB went through in seconds).
async function compactReference(file: { bytes: Uint8Array, mime: string }) {
  if (file.bytes.byteLength <= 700 * 1024)
    return file
  const bytes = await sharp(Buffer.from(file.bytes)).rotate().resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer()
  return { bytes: new Uint8Array(bytes), mime: 'image/jpeg' }
}
async function referenceDataUrl(url: string) {
  const file = await compactReference(await imageBytes(url))
  return `data:${file.mime};base64,${Buffer.from(file.bytes).toString('base64')}`
}
function referenceUrls(input: Record<string, unknown>) {
  const list = [input.image_urls, input.input_urls, input.image_url].flat().filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url))
  return [...new Set(list)].slice(0, 8)
}
// Aspect ratio as "w:h" from either fal-style image_size or aspect_ratio.
function aspectOf(input: Record<string, unknown>) {
  const size = input.image_size
  if (size && typeof size === 'object') {
    const { width, height } = size as { width?: number, height?: number }
    if (width && height)
      return reduceRatio(width, height)
  }
  if (typeof size === 'string') {
    if (size.startsWith('square')) return '1:1'
    if (size.startsWith('landscape')) return size.endsWith('16_9') ? '16:9' : '4:3'
    if (size.startsWith('portrait')) return size.endsWith('16_9') ? '9:16' : '3:4'
  }
  const ratio = String(input.aspect_ratio || '')
  return /^\d+:\d+$/.test(ratio) ? ratio : 'auto'
}
function reduceRatio(width: number, height: number) {
  const value = width / height
  const options = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', '9:21', '2:1', '1:2', '3:1', '1:3']
  return options.sort((a, b) => Math.abs(ratioValue(a) - value) - Math.abs(ratioValue(b) - value))[0]!
}
function ratioValue(ratio: string) {
  const [w, h] = ratio.split(':').map(Number)
  return w && h ? w / h : 1
}
// "1K" | "2K" | "4K" from either an explicit resolution or a fal-style pixel size.
function resolutionTag(input: Record<string, unknown>) {
  const explicit = String(input.resolution || '').toUpperCase()
  if (['1K', '2K', '4K'].includes(explicit))
    return explicit as '1K' | '2K' | '4K'
  const size = input.image_size
  const edge = size && typeof size === 'object' ? Math.max(Number((size as any).width) || 0, Number((size as any).height) || 0) : 0
  return edge >= 3000 ? '4K' : edge >= 1800 ? '2K' : '1K'
}
function openaiSize(ratio: string) {
  if (ratio === 'auto') return 'auto'
  const value = ratioValue(ratio)
  return value > 1.2 ? '1536x1024' : value < 0.83 ? '1024x1536' : '1024x1024'
}
function geminiAspect(ratio: string) {
  if (ratio === 'auto') return undefined
  const value = ratioValue(ratio)
  const options = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']
  return options.sort((a, b) => Math.abs(ratioValue(a) - value) - Math.abs(ratioValue(b) - value))[0]
}

type ImagePart = { base64: string, mime: string } | { url: string }
function withTimeout(signal: AbortSignal | undefined, ms: number) {
  return signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms)
}

async function callOpenai(model: string, input: Record<string, unknown>, refs: string[], signal?: AbortSignal) {
  const size = openaiSize(aspectOf(input))
  const headers = authHeaders()
  const init: RequestInit = { method: 'POST', headers, signal: withTimeout(signal, IMAGE_TIMEOUT_MS) }
  let response: Response
  if (refs.length) {
    const form = new FormData()
    form.set('model', model)
    form.set('prompt', String(input.prompt || ''))
    form.set('n', '1')
    form.set('size', size)
    for (const [index, url] of refs.entries()) {
      const file = await compactReference(await imageBytes(url))
      form.append('image[]', new File([file.bytes as BlobPart], `ref-${index}.${file.mime.split('/')[1] || 'png'}`, { type: file.mime }))
    }
    response = await fetch(`${base()}/v1/images/edits`, { ...init, body: form })
  }
  else {
    response = await fetch(`${base()}/v1/images/generations`, { ...init, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, prompt: input.prompt, n: 1, size }) })
  }
  const payload = await response.json().catch(() => ({})) as Record<string, any>
  if (!response.ok || payload.error)
    throw new Error(readErrorMessage(payload, `Image relay request failed (${response.status})`))
  const data = Array.isArray(payload.data) ? payload.data : []
  return data.map((item: any) => item?.b64_json ? { base64: String(item.b64_json), mime: 'image/png' } : item?.url ? { url: String(item.url) } : null).filter(Boolean) as ImagePart[]
}

async function callGemini(model: string, input: Record<string, unknown>, refs: string[], signal?: AbortSignal) {
  const parts: any[] = [{ text: String(input.prompt || '') }]
  for (const url of refs) {
    const file = await compactReference(await imageBytes(url))
    parts.push({ inlineData: { mimeType: file.mime, data: Buffer.from(file.bytes).toString('base64') } })
  }
  const aspectRatio = geminiAspect(aspectOf(input))
  const response = await fetch(`${base()}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': readServiceSettings().imageKey, 'Content-Type': 'application/json' },
    signal: withTimeout(signal, IMAGE_TIMEOUT_MS),
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { ...(aspectRatio ? { aspectRatio } : {}), imageSize: resolutionTag(input) } },
    }),
  })
  const payload = await response.json().catch(() => ({})) as Record<string, any>
  if (!response.ok || payload.error)
    throw new Error(readErrorMessage(payload, `Image relay request failed (${response.status})`))
  const out: ImagePart[] = []
  for (const part of payload.candidates?.[0]?.content?.parts || []) {
    const inline = part.inlineData || part.inline_data
    if (inline?.data)
      out.push({ base64: String(inline.data), mime: String(inline.mimeType || inline.mime_type || 'image/png') })
    const text = String(part.text || '')
    for (const match of text.matchAll(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/g)) out.push({ base64: match[2]!, mime: match[1]! })
    for (const match of text.matchAll(/https?:\/\/[^\s)"'<>]+\.(?:png|jpe?g|webp)(?:\?[^\s)"'<>]*)?/gi)) out.push({ url: match[0] })
  }
  if (!out.length && payload.candidates?.[0]?.finishReason)
    throw new Error(`Image relay returned no image (${payload.candidates[0].finishReason})`)
  return out
}

/** Task-style relay (new-api job API): POST /v1/videos, then poll /v1/videos/{task_id}. Same shape Banana's gpt_xxz adapter uses. */
async function callTask(model: string, input: Record<string, unknown>, refs: string[], signal?: AbortSignal) {
  const headers = { ...authHeaders(), 'Content-Type': 'application/json' }
  const ratio = aspectOf(input)
  const prompt = String(input.prompt || '')
  const tag = resolutionTag(input)
  const isGpt25 = /gpt-image-2\.5/i.test(model)
  // "gpt-image-2" carries its resolution in the model name on these relays.
  const resolved = /^gpt-image-2$/i.test(model) ? `gpt-image-2-${tag}` : model
  const body: Record<string, unknown> = { model: resolved, prompt, ...(ratio === 'auto' ? {} : { aspect_ratio: ratio }) }
  if (isGpt25)
    body.quality = tag === '1K' ? '1080P' : tag
  if (refs.length) {
    const inline = await Promise.all(refs.map(referenceDataUrl))
    if (isGpt25 && inline.length === 1)
      body.input_reference = inline[0]
    else if (isGpt25) {
      delete body.prompt
      body.content = [{ type: 'text', text: prompt }, ...inline.map(url => ({ type: 'image_url', role: 'reference_image', image_url: { url } }))]
    }
    else
      body.image_urls = inline
  }
  const submit = await fetch(`${base()}/v1/videos`, { method: 'POST', headers, body: JSON.stringify(body), signal: withTimeout(signal, 5 * 60_000) })
  const created = await submit.json().catch(() => ({})) as Record<string, any>
  if (!submit.ok || created.error || !created.task_id)
    throw new Error(readErrorMessage(created, `Image relay task submit failed (${submit.status})`))
  const deadline = Date.now() + IMAGE_TIMEOUT_MS
  while (Date.now() < deadline) {
    signal?.throwIfAborted()
    await new Promise(resolve => setTimeout(resolve, 4000))
    const poll = await fetch(`${base()}/v1/videos/${encodeURIComponent(String(created.task_id))}`, { headers, signal: AbortSignal.timeout(60_000) })
    const task = await poll.json().catch(() => ({})) as Record<string, any>
    const status = String(task.status || '').toLowerCase()
    if (['success', 'succeeded', 'completed'].includes(status)) {
      const urls: string[] = [task.video_url, task.image_url, task.url, ...(Array.isArray(task.image_urls) ? task.image_urls : []), ...(Array.isArray(task.data) ? task.data.map((item: any) => item?.url) : [])].filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url))
      const b64: string[] = [task.b64_json, ...(Array.isArray(task.data) ? task.data.map((item: any) => item?.b64_json) : [])].filter((value): value is string => typeof value === 'string' && value.length > 0)
      return [...urls.map(url => ({ url })), ...b64.map(base64 => ({ base64, mime: 'image/png' }))] as ImagePart[]
    }
    if (['failed', 'error', 'cancelled', 'canceled'].includes(status))
      throw new Error(readErrorMessage(task.error || task, 'Image relay task failed'))
  }
  throw new Error('Image relay task timed out')
}

/** Generate through the configured image relay and store results in .data/media. Returns local media URLs. */
export async function generateRelayImage(model: string, input: Record<string, unknown>, taskId: string, signal?: AbortSignal) {
  const target = relayImageTarget(model)
  if (!target)
    throw new Error('Image relay is not configured for this model')
  const refs = referenceUrls(input)
  const parts = target.format === 'task'
    ? await callTask(target.model, input, refs, signal)
    : target.format === 'gemini' ? await callGemini(target.model, input, refs, signal) : await callOpenai(target.model, input, refs, signal)
  if (!parts.length)
    throw new Error('Image relay returned no image')
  const urls: string[] = []
  for (const [index, part] of parts.entries()) {
    const file = 'base64' in part ? { bytes: new Uint8Array(Buffer.from(part.base64, 'base64')), mime: part.mime } : await imageBytes(part.url)
    const extension = file.mime === 'image/jpeg' ? 'jpg' : file.mime === 'image/webp' ? 'webp' : 'png'
    urls.push(await saveMediaFile(`generator/results/${taskId}/${index}.${extension}`, file.bytes, file.mime))
  }
  return urls
}
