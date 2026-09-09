// Chinese translations keyed by the English source text.
export default {
  // Header.vue
  'Home': '首页',
  'Projects': '项目',
  'Project': '项目',
  'Useful tools': '实用工具',
  'Image Text Editor': '图片文字编辑',
  'Image Background Removal': '图片去背景',

  // AppSidebar.vue
  'Join Discord': '加入 Discord',
  'Visit PoloX Official Website': '访问 PoloX 官网',
  'Visit PoloX Website': '访问 PoloX 官网',

  // PageFooter.vue
  'All rights reserved.': '保留所有权利。',

  // SidebarNavGenerator.vue
  'Generator': '生成器',
  'Soon': '即将推出',
  'Coming soon': '即将推出',
  'Text to Image': '文生图',
  'Image to Image': '图生图',
  'Text to Video': '文生视频',
  'Image to Video': '图生视频',
  'Reference to Video': '参考生视频',
  'Remove Background': '去除背景',
  'Split Image Layers': '拆分图层',
  'Edit Image Text': '编辑图片文字',

  // SidebarNavGroup.vue / SidebarNavLink.vue

  // SidebarNavHeader.vue
  'Open Source Edition': '开源版',

  // SidebarNavRecentProjects.vue
  'Recent projects': '最近项目',
  'New project': '新建项目',
  'Creating…': '创建中…',
  'Loading projects…': '正在加载项目…',
  'No recent projects yet': '暂无最近项目',
  'View all': '查看全部',
  'Could not create the project': '无法创建项目',

  // DarkToggle.vue
  'Toggle Color Scheme': '切换配色方案',
  'Toggle Sidebar': '切换侧边栏',
  'Light': '浅色',
  'Dark': '深色',
  'System': '跟随系统',

  // LangToggle.vue
  'Switch language': '切换语言',

  // ServiceConnection.vue
  'Service connection': '服务连接',
  'Text and image providers tested successfully': '文本与图片服务已测试通过',
  'Configure and test your text and image providers': '配置并测试你的文本与图片服务',
  'Services connected': '服务已连接',
  'API keys not configured': '尚未配置 API 密钥',
  'Connect a text model (OpenRouter or any OpenAI-compatible relay) plus an image provider (OpenAI-compatible / Gemini relay, or fal). Keys are stored locally on this computer.': '连接一个文本模型（OpenRouter 或任意 OpenAI 兼容中转）和一个图片服务（OpenAI 兼容 / Gemini 中转，或 fal）。密钥仅保存在本机。',
  'Text API base URL': '文本 API 地址',
  'Text API key': '文本 API 密钥',
  'Get OpenRouter API key (opens in a new tab)': '获取 OpenRouter API 密钥（在新标签页打开）',
  'Get API key ↗': '获取 API 密钥 ↗',
  'Enter your text API key': '输入你的文本 API 密钥',
  'Text model': '文本模型',
  'Image API base URL (OpenAI-compatible / Gemini relay)': '图片 API 地址（OpenAI 兼容 / Gemini 中转）',
  'Image API key': '图片 API 密钥',
  'Enter your image relay API key': '输入你的图片中转 API 密钥',
  'Default image model (gpt-image-2 or a gemini image model)': '默认图片模型（gpt-image-2 或 gemini 图片模型）',
  'fal API key (optional)': 'fal API 密钥（可选）',
  'Get fal API key (opens in a new tab)': '获取 fal API 密钥（在新标签页打开）',
  'Enter your fal API key': '输入你的 fal API 密钥',
  'Clear a key to remove it when you test and save. Testing saves your settings, sends a short request to your text model, lists the image relay\'s models, and checks fal if a key is set. The model request may incur a small charge.': '清空密钥后测试并保存即可移除该密钥。测试会保存你的设置，向文本模型发送一次简短请求，列出图片中转的模型，并在配置了 fal 密钥时检查 fal。模型请求可能产生少量费用。',
  'Testing connections…': '正在测试连接…',
  'Test connection': '测试连接',
  'Settings changed in another window. Test the current settings again.': '设置已在其他窗口中更改，请重新测试当前设置。',
  'Connection test could not finish. Please try again.': '连接测试未能完成，请重试。',

  // PasswordInput.vue
  'Enter your password': '请输入密码',
  'Show password': '显示密码',
  'Hide password': '隐藏密码',

  // MediaLightbox.vue
  'Generated video': '生成的视频',
  'Generated image': '生成的图片',
  'Close preview': '关闭预览',

  // error.vue / 404.vue / 500.vue / 503.vue
  'Oops! Page Not Found!': '哎呀！页面不存在',
  'It seems like the page you\'re looking for': '你要访问的页面似乎',
  'does not exist or might have been removed.': '不存在或已被移除。',
  'Go Back': '返回上一页',
  'Back to Home': '回到首页',
  'Oops! Something went wrong :\')': '哎呀！出了点问题 :\')',
  'We apologize for the inconvenience.': '给你带来不便，我们深表歉意。',
  'Please try again later.': '请稍后再试。',
  'Website is under maintenance!': '网站维护中',
  'The site is not available at the moment.': '网站暂时无法访问。',
  'We\'ll be back online shortly.': '我们很快就会恢复上线。',
} satisfies Record<string, string>
