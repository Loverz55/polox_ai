import assert from 'node:assert/strict'
import { test } from 'node:test'
import { translate } from '../app/i18n/tr.ts'
import agentCore from '../app/i18n/zh/agentCore.ts'
import agentLab from '../app/i18n/zh/agentLab.ts'
import common from '../app/i18n/zh/common.ts'
import generator from '../app/i18n/zh/generator.ts'
import home from '../app/i18n/zh/home.ts'
import layout from '../app/i18n/zh/layout.ts'
import projects from '../app/i18n/zh/projects.ts'
import tools from '../app/i18n/zh/tools.ts'

const fragments = { common, layout, home, agentLab, generator, projects, tools, agentCore }
const zh = Object.assign({}, ...Object.values(fragments))

test('translate falls back to the English key and interpolates params', () => {
  assert.equal(translate(zh, 'en', 'Projects'), 'Projects')
  assert.equal(translate(zh, 'zh', 'Projects'), '项目')
  assert.equal(translate(zh, 'zh', 'No such key {x}', { x: 1 }), 'No such key 1')
  assert.equal(translate(zh, 'en', 'Delete {count} items', { count: 3 }), 'Delete 3 items')
  assert.equal(translate(zh, 'en', 'Keep {missing}'), 'Keep {missing}')
})

test('every zh entry is non-empty and keeps the same {placeholders} as its key', () => {
  const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',')
  const bad = Object.entries(zh).filter(([key, value]) =>
    typeof value !== 'string' || !value.trim() || placeholders(key) !== placeholders(value),
  )
  assert.deepEqual(bad, [])
})

test('the same key is not translated differently in two fragments', () => {
  const seen = new Map()
  const conflicts = []
  for (const [name, dict] of Object.entries(fragments)) {
    for (const [key, value] of Object.entries(dict)) {
      const prev = seen.get(key)
      if (prev && prev.value !== value)
        conflicts.push(`${key}: ${prev.name}=${prev.value} vs ${name}=${value}`)
      seen.set(key, { name, value })
    }
  }
  assert.deepEqual(conflicts, [])
})
