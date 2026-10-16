import { useCallback, useEffect, useState } from 'react'

const CODE_KEY = 'para-nos:codigo:v1'
const LEGACY_MEMORIES_KEY = 'para-nos:memorias:v1'
const LEGACY_PHRASES_KEY = 'para-nos:frases:v1'

function savedCode() {
  try { return sessionStorage.getItem(CODE_KEY) || '' } catch { return '' }
}

function readLegacy() {
  try {
    const memories = JSON.parse(localStorage.getItem(LEGACY_MEMORIES_KEY) || '[]')
    const phrases = JSON.parse(localStorage.getItem(LEGACY_PHRASES_KEY) || '[]')
    return {
      memories: Array.isArray(memories) ? memories.slice(0, 30) : [],
      phrases: Array.isArray(phrases) ? phrases.slice(0, 30) : [],
    }
  } catch { return { memories: [], phrases: [] } }
}

async function requestShared(code, command) {
  const response = await fetch('/api/shared', {
    method: command ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${code}`,
      ...(command ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(command ? { body: JSON.stringify(command) } : {}),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(result.error || 'Não foi possível conectar agora.')
    error.status = response.status
    throw error
  }
  return result
}

export function useSharedContent() {
  const [code, setCode] = useState(savedCode)
  const [data, setData] = useState({ memories: [], phrases: [] })
  const [loading, setLoading] = useState(Boolean(code))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [legacy, setLegacy] = useState(readLegacy)

  const refresh = useCallback(async (accessCode = code) => {
    if (!accessCode) return
    try {
      const result = await requestShared(accessCode)
      setData(result)
      setReady(true)
      setError('')
    } catch (cause) {
      setError(cause.message)
      if (cause.status === 401) {
        setCode('')
        setReady(false)
        try { sessionStorage.removeItem(CODE_KEY) } catch { /* optional storage */ }
      }
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => { if (code) refresh(code) }, [code, refresh])

  useEffect(() => {
    if (!ready) return undefined
    const onFocus = () => refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 60000)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [ready, refresh])

  async function unlock(value) {
    const nextCode = value.trim()
    if (!nextCode) return false
    setLoading(true)
    try {
      const result = await requestShared(nextCode)
      setCode(nextCode)
      setData(result)
      setReady(true)
      setError('')
      try { sessionStorage.setItem(CODE_KEY, nextCode) } catch { /* optional storage */ }
      return true
    } catch (cause) {
      setError(cause.message)
      setLoading(false)
      return false
    }
  }

  async function change(command) {
    if (!code || busy) return false
    setBusy(true)
    try {
      const result = await requestShared(code, command)
      setData(result)
      setError('')
      return true
    } catch (cause) {
      setError(cause.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function importLegacy() {
    if (!legacy.memories.length && !legacy.phrases.length) return
    if (await change({ action: 'importLocal', ...legacy })) {
      try {
        localStorage.removeItem(LEGACY_MEMORIES_KEY)
        localStorage.removeItem(LEGACY_PHRASES_KEY)
      } catch { /* import already succeeded */ }
      setLegacy({ memories: [], phrases: [] })
    }
  }

  return { data, loading, busy, error, ready, legacyCount: legacy.memories.length + legacy.phrases.length, unlock, refresh, change, importLegacy }
}
