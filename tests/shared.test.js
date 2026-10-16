import test from 'node:test'
import assert from 'node:assert/strict'
import { changeData } from '../api/shared.js'

test('memórias e frases compartilham o mesmo documento sem apagar umas às outras', () => {
  const empty = { memories: [], phrases: [] }
  const withMemory = changeData(empty, { action: 'saveMemory', title: '  Um passeio  ', text: '  Foi bom  ', date: '2026-10-15' })
  const withBoth = changeData(withMemory, { action: 'addPhrase', text: '  Eu te amo  ' })
  assert.equal(withBoth.memories[0].title, 'Um passeio')
  assert.equal(withBoth.phrases[0].text, 'Eu te amo')
  const edited = changeData(withBoth, { action: 'saveMemory', id: withMemory.memories[0].id, title: 'Outro título', text: 'Novo texto', date: '' })
  assert.equal(edited.memories.length, 1)
  assert.equal(edited.memories[0].title, 'Outro título')
  assert.equal(edited.phrases.length, 1)
  assert.equal(changeData(edited, { action: 'deletePhrase', id: withBoth.phrases[0].id }).phrases.length, 0)
})

test('dados vazios, ações desconhecidas e edição de outro registro são recusados', () => {
  const empty = { memories: [], phrases: [] }
  assert.equal(changeData(empty, { action: 'addPhrase', text: '   ' }), null)
  assert.equal(changeData(empty, { action: 'saveMemory', title: '', text: 'texto' }), null)
  assert.equal(changeData(empty, { action: 'saveMemory', id: 'inexistente', title: 'Título', text: 'texto' }), null)
  assert.equal(changeData(empty, { action: 'desconhecida' }), null)
})

test('importação local preserva registros existentes e evita duplicatas', () => {
  const data = { memories: [{ id: 'online', title: 'Viagem', text: 'Praia', date: '' }], phrases: [{ id: 'online', text: 'Até logo' }] }
  const imported = changeData(data, {
    action: 'importLocal',
    memories: [{ title: 'Viagem', text: 'Praia', date: '' }, { title: 'Passeio', text: 'Parque', date: '' }],
    phrases: [{ text: 'Até logo' }, { text: 'Eu te amo' }],
  })
  assert.equal(imported.memories.length, 2)
  assert.equal(imported.phrases.length, 2)
  assert.equal(imported.memories[0].id, 'online')
})
