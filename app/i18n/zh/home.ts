// Chinese translations keyed by the English source text.
export default {
  // index.vue (hero copy from runtimeConfig.public)
  'Open-source. Agent-native.': '开源 · Agent 原生',
  'creative platform.': '创意生成平台',
  'Create images, videos, music, and more with leading generative AI models through the Polox Studio Agent. Just describe your vision and bring it to life through conversation.': '通过 Polox Studio Agent 调用顶尖生成式 AI 模型，创作图片、视频、音乐等内容。只需描述你的想法，在对话中把它变为现实。',
  'Featured on There\'s An AI For That': '已入选 There\'s An AI For That',

  // FrontierModels.vue (task labels come from shared/constants/aiModels.ts)
  'Frontier AI models': '前沿 AI 模型',
  'The latest AI image and video models in one workspace.': '最新的 AI 图片与视频模型，尽在一个工作区。',
  'By {company}': '{company} 出品',
  'Text to Image': '文生图',
  'Image to Image': '图生图',
  'Text to Video': '文生视频',
  'Image to Video': '图生视频',
  'Reference to Video': '参考生视频',
  'Remove Background': '去除背景',
  'Split Image Layers': '拆分图层',
  'Edit Image Text': '编辑图片文字',

  // ModelTaskLinks.vue
  'Model tasks': '模型任务',
  'Use {name} · {task} in Agent': '在 Agent 中使用 {name} · {task}',

  // RecentProjects.vue
  'Recent projects': '最近项目',
  'View all projects': '查看全部项目',

  // UpcomingFeatures.vue
  'Coming soon': '即将推出',
  'Stay tuned. Next we give the agent more tools, then longer video with an edit pass.': '敬请期待。接下来我们会为 Agent 接入更多工具，随后支持更长的视频并自动剪辑。',
  'More tools in the thread': '在对话中调用更多工具',
  'Studio Agent will call more studio tools from chat—starting with image enhancement and video editing—so fewer steps leave the conversation.': 'Studio Agent 将直接在对话中调用更多工作室工具——从图片增强和视频编辑开始——让你无需离开对话就能完成更多操作。',
  'Longer video, then a cut': '更长的视频，再自动剪辑',
  'We are tuning long-form generation and automatic editing. Short clips work today. Longer pieces and an edit pass are still in the lab.': '我们正在打磨长视频生成与自动剪辑。目前已支持短片段，更长的作品和剪辑环节仍在实验中。',

  // UsefulTools.vue (labels come from app/constants/usefulTools.ts)
  'Useful tools': '实用工具',
  'Image Text Editor': '图片文字编辑',
  'Image Background Removal': '图片去背景',
  'Remove the background and keep a transparent PNG.': '去除背景，输出透明 PNG。',
  'AI Image Editor': 'AI 图片编辑器',
  'AI Video Editor': 'AI 视频编辑器',

  // HomeAgentComposer.vue
  'Could not load project assets. Close and reopen @ to retry.': '无法加载项目素材。关闭后重新输入 @ 重试。',
  'Could not create the project': '无法创建项目',
  'Default': '默认',
  'Project': '项目',
  'Creating…': '创建中…',
  'New project': '新建项目',
  'Open in project': '在项目中打开',

  // agentComposerPlaceholder.ts
  'Type @ to choose a model, or share your idea and I’ll help you plan it.': '输入 @ 选择模型，或直接说出你的想法，我来帮你规划。',
  'What do you want to create next?': '接下来想创作什么？',

  // useAgentWorkspaceNav.ts
  'Could not open this project': '无法打开该项目',
} satisfies Record<string, string>
