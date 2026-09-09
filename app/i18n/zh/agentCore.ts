// Chinese translations keyed by the English source text.
export default {
  // useAgentLab.ts
  'New agent': '新 Agent',
  'New agent {n}': '新 Agent {n}',
  'Stopped. In-progress generations will keep running.': '已停止。进行中的生成任务会继续完成。',
  'The agent request was cancelled': 'Agent 请求已取消',
  'Agent service error ({status})': 'Agent 服务出错（{status}）',
  'Agent service returned an empty stream': 'Agent 服务返回了空数据流',
  'Could not start an agent session': '无法启动 Agent 会话',
  'Canvas still': '画布图片',
  'Only generated stills can be attached': '只能添加已生成的图片',
  'Up to 9 images per message': '每条消息最多 9 张图片',
  'Upload JPEG, PNG, WEBP, or GIF': '请上传 JPEG、PNG、WEBP 或 GIF 格式的图片',
  'Each image must be 10MB or smaller': '每张图片不能超过 10MB',
  'Upload failed': '上传失败',
  'Cannot create a new agent right now. Wait for the current turn to finish or check the agent limit.': '现在无法新建 Agent。请等待当前回合结束，或检查 Agent 数量上限。',
  'Answer or skip the pending questions first': '请先回答或跳过待处理的问题',
  'Confirm or cancel the pending generation first': '请先确认或取消待处理的生成',
  'Stop failed ({status})': '停止失败（{status}）',
  'Could not stop the agent': '无法停止 Agent',
  'This session is already running': '该会话正在运行中',
  'Failed to reach the agent runtime': '无法连接 Agent 服务',
  'Failed to resolve confirmation': '确认操作失败',
  'Failed to send your choices': '选择提交失败',
  'One shot failed to generate. Retrying it automatically.': '有一条镜头生成失败，正在自动重试。',
  '{count} shots failed to generate. Retrying them automatically.': '有 {count} 条镜头生成失败，正在自动重试。',
  'One shot failed to generate. Want me to retry it?': '有一条镜头生成失败。需要我再试这一镜吗？',
  '{count} shots failed to generate. Want me to retry them?': '有 {count} 条镜头生成失败。需要我再试吗？',
  'Layer split complete: {count} layers (including the background). Results are below and have been added to the canvas.': '图层拆分已完成，共 {count} 个图层（含背景）。结果如下，也已添加到画布。',
  // shared/utils/agentRecovery.ts (surfaced through useAgentLab error state)
  'Server temporarily unavailable. Please wait a moment and refresh the page. We will check the saved task status when the connection returns.': '服务暂时不可用，请稍候刷新页面。连接恢复后我们会检查已保存任务的状态。',
  // useToolAgent.ts
  'Could not start the agent. Your request is saved in its draft.': '无法启动 Agent，你的请求已保存到草稿中。',
  // toolAgentRequest.ts
  'This model is not available in Agent.': '该模型暂不支持在 Agent 中使用。',
} satisfies Record<string, string>
