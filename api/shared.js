import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { get, put } from '@vercel/blob'

const DATA_PATH = 'para-nos/conteudo.json'
const EMPTY_DATA = { memories: [], phrases: [] }
const MAX_ENTRIES = 100

function reply(response, status, body) {
  response.setHeader('Cache-Control', 'private, no-store')
  return response.status(status).json(body)
}

function authorized(request) {
  const secret = process.env.DATA_ACCESS_CODE
  const header = request.headers.authorization || ''
  if (!secret || !header.startsWith('Bearer ')) return false
  const actual = createHash('sha256').update(header.slice(7)).digest()
  const expected = createHash('sha256').update(secret).digest()
  return timingSafeEqual(actual, expected)
}

async function readData() {
  const result = await get(DATA_PATH, { access: 'private', useCache: false })
  if (!result) return { data: structuredClone(EMPTY_DATA), etag: null }
  const body = await new Response(result.stream).text()
  const parsed = JSON.parse(body)
  return {
    data: {
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      phrases: Array.isArray(parsed.phrases) ? parsed.phrases : [],
    },
    etag: result.blob.etag,
  }
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function changeData(data, command) {
  if (!command || typeof command !== 'object') return null
  const { action, id } = command
  if (action === 'saveMemory') {
    const title = cleanText(command.title, 60)
    const text = cleanText(command.text, 500)
    const date = command.date || ''
    if (!title || !text || (date && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)))) return null
    if (id && (typeof id !== 'string' || !data.memories.some(item => item.id === id))) return null
    if (!id && data.memories.length >= MAX_ENTRIES) return null
    const memory = { id: id || randomUUID(), title, text, date }
    const memories = id
      ? data.memories.map(item => item.id === id ? memory : item)
      : [memory, ...data.memories]
    return { ...data, memories }
  }
  if (action === 'deleteMemory' && typeof id === 'string') {
    return { ...data, memories: data.memories.filter(item => item.id !== id) }
  }
  if (action === 'addPhrase') {
    const text = cleanText(command.text, 180)
    if (!text) return null
    if (data.phrases.length >= MAX_ENTRIES) return null
    return { ...data, phrases: [{ id: randomUUID(), text }, ...data.phrases] }
  }
  if (action === 'deletePhrase' && typeof id === 'string') {
    return { ...data, phrases: data.phrases.filter(item => item.id !== id) }
  }
  if (action === 'importLocal') {
    if (!Array.isArray(command.memories) || !Array.isArray(command.phrases)) return null
    const memories = [...data.memories]
    const phrases = [...data.phrases]
    for (const item of command.memories.slice(0, 30)) {
      const title = cleanText(item?.title, 60)
      const text = cleanText(item?.text, 500)
      const date = typeof item?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : ''
      if (title && text && !memories.some(existing => existing.title === title && existing.text === text && existing.date === date)) {
        memories.push({ id: randomUUID(), title, text, date })
      }
    }
    for (const item of command.phrases.slice(0, 30)) {
      const text = cleanText(item?.text, 180)
      if (text && !phrases.some(existing => existing.text === text)) phrases.push({ id: randomUUID(), text })
    }
    if (memories.length > MAX_ENTRIES || phrases.length > MAX_ENTRIES) return null
    return { memories, phrases }
  }
  return null
}

function isConflict(error) {
  return error?.name === 'BlobPreconditionFailedError' || /already exists/i.test(error?.message || '')
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) return reply(response, 405, { error: 'Método não permitido.' })
  if (!process.env.DATA_ACCESS_CODE || !process.env.BLOB_READ_WRITE_TOKEN) {
    return reply(response, 503, { error: 'O compartilhamento ainda não foi configurado na Vercel.' })
  }
  if (!authorized(request)) return reply(response, 401, { error: 'Código de acesso incorreto.' })

  try {
    if (request.method === 'GET') {
      const { data } = await readData()
      return reply(response, 200, data)
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, etag } = await readData()
      const updated = changeData(data, request.body)
      if (!updated) return reply(response, 400, { error: 'Dados inválidos.' })
      try {
        await put(DATA_PATH, JSON.stringify(updated), {
          access: 'private',
          contentType: 'application/json',
          allowOverwrite: Boolean(etag),
          ...(etag ? { ifMatch: etag } : {}),
        })
        return reply(response, 200, updated)
      } catch (error) {
        if (!isConflict(error)) throw error
      }
    }
    return reply(response, 409, { error: 'Houve outra atualização ao mesmo tempo. Tente novamente.' })
  } catch (error) {
    console.error('Shared content error:', error)
    return reply(response, 500, { error: 'Não foi possível acessar os dados compartilhados agora.' })
  }
}
