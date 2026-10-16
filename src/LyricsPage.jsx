import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const START = 166
const END = 247
const AUDIO_URL = `${import.meta.env.BASE_URL}music/Bon Jovi - Always (Official Music Video).mp3`

function formatTime(seconds) {
  const value = Math.floor(seconds)
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

export default function LyricsPage() {
  const audioRef = useRef(null)
  const [lines, setLines] = useState([])
  const [position, setPosition] = useState(START)
  const [playing, setPlaying] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}lyrics/always.json`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('A letra não está disponível.')
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data.lines) || !data.lines.length || !data.lines.every(line => Number.isFinite(line.time) && typeof line.text_en === 'string')) {
          throw new Error('A letra está em um formato inválido.')
        }
        setLines(data.lines)
      })
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message || 'Não foi possível carregar a letra.')
      })
    return () => controller.abort()
  }, [])

  const currentIndex = lines.reduce((found, line, index) => position >= line.time ? index : found, 0)
  const current = lines[currentIndex]
  const previous = lines[currentIndex - 1]
  const next = lines[currentIndex + 1]

  function seek(seconds) {
    const target = Math.max(START, Math.min(END, Number(seconds)))
    if (audioRef.current) audioRef.current.currentTime = target
    setPosition(target)
  }

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      return
    }
    if (audio.currentTime < START || audio.currentTime >= END) seek(START)
    setError('')
    try {
      await audio.play()
    } catch {
      setError('Não foi possível reproduzir o áudio. Tente novamente.')
    }
  }

  function onTimeUpdate(event) {
    const audio = event.currentTarget
    if (audio.currentTime >= END) {
      audio.pause()
      audio.currentTime = END
      setPosition(END)
      return
    }
    setPosition(audio.currentTime)
  }

  return (
    <main className="music-page">
      <div className="music-wrap">
        <div className="music-top"><Link to="/">← Voltar</Link><span>Áudio e letra</span></div>
        <div className="music-intro"><span className="eyebrow">Bon Jovi</span><h1>Always</h1><p>Trecho com tradução opcional</p></div>
        <div className="music-card">
          <div className="lyric-stage" aria-live="off">
            <div className="adjacent">{previous?.text_en || '♪'}</div>
            <div className="current">{current?.text_en || (error ? 'A letra não carregou' : 'Carregando letra...')}</div>
            <div className="translation">{showTranslation ? current?.text_pt : ''}</div>
            <div className="adjacent">{next?.text_en || '♪'}</div>
          </div>

          <div className="music-progress">
            <input type="range" min={START} max={END} step="0.1" value={position} onChange={event => seek(event.target.value)} aria-label="Posição do trecho da música" />
            <div className="progress-meta"><span>{formatTime(position)}</span><span>{lines.length ? `Linha ${currentIndex + 1} de ${lines.length}` : 'Carregando...'}</span><span>{formatTime(END)}</span></div>
          </div>

          <div className="music-controls">
            <button type="button" onClick={() => seek(START)} aria-label="Reiniciar trecho" title="Reiniciar">↺</button>
            <button type="button" onClick={() => seek(previous?.time ?? START)} disabled={!previous} aria-label="Linha anterior" title="Linha anterior">‹</button>
            <button className="play-button" type="button" onClick={togglePlayback} aria-label={playing ? 'Pausar música' : 'Reproduzir música'}>{playing ? 'Ⅱ' : '▶'}</button>
            <button type="button" onClick={() => seek(next?.time ?? END)} disabled={!next} aria-label="Próxima linha" title="Próxima linha">›</button>
          </div>

          <div className="music-options">
            <label><input type="checkbox" checked={showTranslation} onChange={event => setShowTranslation(event.target.checked)} /> Mostrar tradução</label>
            <label>Velocidade <select value={speed} onChange={event => { const value = Number(event.target.value); setSpeed(value); if (audioRef.current) audioRef.current.playbackRate = value }}><option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option></select></label>
          </div>
          {error && <p className="music-error" role="alert">{error}</p>}
          <p className="music-hint">Use a barra ou as setas para navegar pelo trecho.</p>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={AUDIO_URL}
        preload="metadata"
        onLoadedMetadata={event => { event.currentTarget.currentTime = START; event.currentTarget.playbackRate = speed }}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError('Não foi possível carregar o arquivo de áudio.')}
      />
    </main>
  )
}
