// Chinese translations keyed by the English source text.
export default {
  // pages/projects/index.vue
  'Projects': '项目',
  'Your generation projects': '你的生成项目',
  'Could not create the project': '无法创建项目',
  'Could not update the project': '无法更新项目',
  'Could not delete the project': '无法删除项目',
  'New project': '新建项目',
  'No projects yet.': '还没有项目。',
  'Give this project a title. A description is optional.': '为项目起个标题，描述可以稍后再填。',
  'Title': '标题',
  'Description': '描述',
  '(optional)': '（选填）',
  'What this project is for': '这个项目用来做什么',
  'Cancel': '取消',
  'Creating…': '创建中…',
  'Create': '创建',
  'Edit project': '编辑项目',
  'Update the title and description.': '修改标题和描述。',
  'Saving…': '保存中…',
  'Save': '保存',

  // pages/projects/[id].vue
  'This file is no longer available on the canvas.': '该文件已不在画布上。',
  'Project': '项目',
  'Project generations': '项目生成内容',
  'Could not load this project': '无法加载该项目',
  'Could not load generations': '无法加载生成内容',
  '{count} results could not be moved. Retry to process only these results.': '{count} 个结果移动失败，重试将只处理这些结果。',
  '{count} results could not be deleted. Retry to process only these results.': '{count} 个结果删除失败，重试将只处理这些结果。',
  'Could not refresh the project. Reload to see the latest results.': '无法刷新项目，请重新加载以查看最新结果。',
  'Could not move this result': '无法移动该结果',
  'Could not delete this result': '无法删除该结果',
  'Title is required': '请输入标题',
  'Could not rename the project': '无法重命名项目',
  'Canvas still': '画布图片',
  'Project name': '项目名称',
  'Save name': '保存名称',
  'Cancel rename': '取消重命名',
  'Rename': '重命名',
  'Rename project': '重命名项目',
  'Canvas': '画布',

  // components/projects/ProjectCard.vue
  'Generating': '生成中',
  '{count} asset': '{count} 个素材',
  '{count} assets': '{count} 个素材',
  'Actions for {name}': '{name} 的操作',
  'Edit': '编辑',
  'Delete': '删除',

  // components/projects/ProjectDeleteDialog.vue
  'Delete this project?': '删除这个项目？',
  'This cannot be undone. All generations in {name} will be moved to Default.': '此操作无法撤销。{name} 中的所有生成内容将移入默认项目。',
  'this project': '该项目',
  'Type {word} to confirm': '输入 {word} 以确认',
  'Delete project': '删除项目',

  // components/projects/ProjectMoveJobDialog.vue
  'Move to another project?': '移动到其他项目？',
  '{count} generations will leave the current project and appear in the project you select.': '{count} 条生成内容将从当前项目移出，并出现在你选择的项目中。',
  'This generation will leave the current project and appear in the project you select.': '该生成内容将从当前项目移出，并出现在你选择的项目中。',
  'Create another project first.': '请先创建另一个项目。',
  'Move': '移动',

  // components/projects/ProjectSelector.vue
  'Select project': '选择项目',
  'Default': '默认',
} satisfies Record<string, string>
