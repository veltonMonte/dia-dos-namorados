import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNextAnniversary, getRelationshipTime } from './time'
import { useSharedContent } from './useSharedContent'

const photos = [
  { src: `${import.meta.env.BASE_URL}photos/WhatsApp_Image_2026-06-12_at_02_04_46.jpeg`, alt: 'Nós dois juntos, sorrindo para a câmera' },
  { src: `${import.meta.env.BASE_URL}photos/WhatsApp_Image_2026-06-12_at_02_04_45.jpeg`, alt: 'Nós dois em uma foto no espelho' },
]
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function PhotoGallery() {
  const [active, setActive] = useState(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (active === null) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') setActive(null)
      if (event.key === 'ArrowLeft') setActive(index => (index + photos.length - 1) % photos.length)
      if (event.key === 'ArrowRight') setActive(index => (index + 1) % photos.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [active])

  return <>
    <div className="photo-grid">
      {photos.map((photo, index) => (
        <button className="photo-tile" key={photo.src} type="button" onClick={() => setActive(index)} aria-label={`Ampliar foto ${index + 1}`}>
          <img src={photo.src} alt={photo.alt} loading={index ? 'lazy' : 'eager'} />
          <span>Ver foto ↗</span>
        </button>
      ))}
    </div>
    {active !== null && (
      <div className="lightbox" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActive(null) }}>
        <div className="lightbox-content" role="dialog" aria-modal="true" aria-label={`Foto ${active + 1} de ${photos.length}`}>
          <button ref={closeRef} className="lightbox-close" type="button" onClick={() => setActive(null)} aria-label="Fechar foto">×</button>
          <img src={photos[active].src} alt={photos[active].alt} />
          <div className="lightbox-controls">
            <button type="button" onClick={() => setActive((active + photos.length - 1) % photos.length)} aria-label="Foto anterior">←</button>
            <span>{active + 1} / {photos.length}</span>
            <button type="button" onClick={() => setActive((active + 1) % photos.length)} aria-label="Próxima foto">→</button>
          </div>
        </div>
      </div>
    )}
  </>
}

function SharedAccess({ shared }) {
  const [draft, setDraft] = useState('1408')
  if (shared.ready) return <div className="shared-status wrap"><span>Memórias e frases compartilhadas nos dois celulares.</span>{shared.legacyCount > 0 && <button type="button" disabled={shared.busy} onClick={shared.importLegacy}>Importar {shared.legacyCount} item(ns) deste navegador</button>}<button type="button" onClick={() => shared.refresh()}>Atualizar ↻</button></div>
  return <section className="section shared-access wrap" aria-labelledby="shared-title">
    <span className="eyebrow">Espaço compartilhado</span>
    <h2 id="shared-title">Entrar para ver nossas memórias</h2>
    <p>Use o mesmo código de acesso nos dois celulares. Tudo o que um adicionar aparecerá para o outro.</p>
    <form onSubmit={async event => { event.preventDefault(); if (await shared.unlock(draft)) setDraft('1408') }}>
      <label htmlFor="shared-code">Código de acesso</label>
      <input id="shared-code" type="password" autoComplete="current-password" placeholder="1408" required value={draft} onChange={event => setDraft(event.target.value)} />
      <button className="button button-primary" type="submit" disabled={shared.loading}>{shared.loading ? 'Entrando...' : 'Entrar'}</button>
    </form>
    {shared.error && <p className="notice" role="alert">{shared.error}</p>}
  </section>
}

function Memories({ shared }) {
  const memories = shared.data.memories
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', date: '', text: '' })
  const [showForm, setShowForm] = useState(false)

  function resetForm() {
    setForm({ title: '', date: '', text: '' })
    setEditing(null)
    setShowForm(false)
  }
  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.text.trim()) return
    if (await shared.change({ action: 'saveMemory', ...form, id: editing })) resetForm()
  }
  function edit(memory) {
    setEditing(memory.id)
    setForm({ title: memory.title, date: memory.date, text: memory.text })
    setShowForm(true)
  }

  return (
    <section className="section memories-section wrap" id="memorias" aria-labelledby="memories-title">
      <div className="section-heading">
        <div><span className="eyebrow">Arquivo pessoal</span><h2 id="memories-title">Memórias</h2></div>
        {!showForm && <button className="button button-outline" type="button" onClick={() => setShowForm(true)}>+ Adicionar memória</button>}
      </div>
      <p className="section-lead">Registre momentos para consultar depois. Eles aparecem nos dois celulares.</p>
      {showForm && (
        <form className="memory-form" onSubmit={submit}>
          <h3>{editing ? 'Editar memória' : 'Nova memória'}</h3>
          <div className="form-row">
            <label>Título <input required maxLength="60" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Título da memória" /></label>
            <label>Data (opcional) <input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
          </div>
          <label>O que aconteceu? <textarea required maxLength="500" rows="3" value={form.text} onChange={event => setForm({ ...form, text: event.target.value })} placeholder="Conte esse momento com suas palavras..." /></label>
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={shared.busy}>{shared.busy ? 'Salvando...' : 'Salvar memória'}</button><button className="button button-text" type="button" onClick={resetForm}>Cancelar</button></div>
        </form>
      )}
      {shared.error && <p className="notice" role="alert">{shared.error}</p>}
      {memories.length ? (
        <div className="memory-list">
          {[...memories].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(memory => (
            <article className="memory-card" key={memory.id}>
              <span className="memory-icon" aria-hidden="true">✦</span>
              <div className="memory-content">
                {memory.date && <time dateTime={memory.date}>{new Date(`${memory.date}T12:00:00`).toLocaleDateString('pt-BR')}</time>}
                <h3>{memory.title}</h3><p>{memory.text}</p>
                <div className="memory-actions"><button type="button" onClick={() => edit(memory)}>Editar</button><button type="button" disabled={shared.busy} onClick={() => { if (window.confirm('Excluir esta memória?')) shared.change({ action: 'deleteMemory', id: memory.id }) }}>Excluir</button></div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty-state">✦ <span>Nenhuma memória adicionada ainda.</span></div>}
    </section>
  )
}

function Phrases({ shared }) {
  const phrases = shared.data.phrases
  const [draft, setDraft] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const current = phrases[Math.min(activeIndex, phrases.length - 1)]

  async function submit(event) {
    event.preventDefault()
    if (!draft.trim()) return
    if (await shared.change({ action: 'addPhrase', text: draft })) {
      setDraft('')
      setActiveIndex(0)
    }
  }

  function removeCurrent() {
    if (!current || !window.confirm('Excluir esta frase?')) return
    shared.change({ action: 'deletePhrase', id: current.id })
    setActiveIndex(0)
  }

  return (
    <section className="section surprise-section wrap" aria-labelledby="phrases-title">
      <div>
        <span className="eyebrow">Para reler</span>
        <h2 id="phrases-title">Uma frase por vez</h2>
        <p>Escreva frases suas para aparecerem aqui.</p>
      </div>
      <div className="surprise-card">
        <span aria-hidden="true">✦</span>
        <p className="phrase-display" aria-live="polite">{current?.text || 'Nenhuma frase adicionada ainda.'}</p>
        {current && (
          <div className="phrase-actions">
            <button className="button button-primary" type="button" onClick={() => setActiveIndex(index => (index + 1) % phrases.length)} disabled={phrases.length < 2}>Próxima frase ↗</button>
            <button className="phrase-delete" type="button" disabled={shared.busy} onClick={removeCurrent}>Excluir</button>
            <span className="phrase-count">{Math.min(activeIndex, phrases.length - 1) + 1} / {phrases.length}</span>
          </div>
        )}
        <form className="phrase-form" onSubmit={submit}>
          <label htmlFor="new-phrase">Escreva uma frase</label>
          <textarea id="new-phrase" rows="2" maxLength="180" required value={draft} onChange={event => setDraft(event.target.value)} placeholder="Ex.: Eu te amo" />
          <button className="button button-outline" type="submit" disabled={shared.busy}>{shared.busy ? 'Salvando...' : 'Adicionar frase'}</button>
        </form>
        <small>As frases aparecem nos dois celulares.</small>
        {shared.error && <p className="notice" role="alert">{shared.error}</p>}
      </div>
    </section>
  )
}

export default function App() {
  const now = useClock()
  const shared = useSharedContent()
  const time = getRelationshipTime(now)
  const anniversary = getNextAnniversary(now)
  const [shareMessage, setShareMessage] = useState('')
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  async function sharePage() {
    try {
      if (navigator.share) await navigator.share({ title: 'Para nós 💗', url: window.location.href })
      else {
        await navigator.clipboard.writeText(window.location.href)
        setShareMessage('Link copiado!')
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Não foi possível compartilhar agora.')
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header wrap">
        <button className="brand" type="button" onClick={() => scrollTo('inicio')} aria-label="Para nós, ir ao início"><span className="brand-mark">♥</span> para nós</button>
        <nav aria-label="Navegação principal"><button type="button" onClick={() => scrollTo('historia')}>Nossa história</button><button type="button" onClick={() => scrollTo('memorias')}>Memórias</button><Link to="/lyrics">Nossa música</Link></nav>
        <button className="header-share" type="button" onClick={sharePage}>Compartilhar ↗</button>
      </header>

      <main id="inicio">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><span className="tiny-heart">♥</span> Nossa história</span>
            <h1 id="hero-title">Uma história feita de <em>momentos.</em></h1>
            <p>Fotos, uma música e o tempo desde o começo — tudo reunido em um só lugar.</p>
            <div className="hero-actions"><button className="button button-primary" type="button" onClick={() => scrollTo('historia')}>Ver linha do tempo <span>↓</span></button><Link className="button button-outline" to="/lyrics">Abrir música <span>↗</span></Link></div>
            <div className="hero-since"><span className="hero-since-icon">✦</span><span>Juntos desde <strong>14 de agosto de 2021</strong></span></div>
          </div>
          <div className="hero-photo"><img src={photos[0].src} alt={photos[0].alt} /><span className="photo-sticker">um registro nosso ♡</span></div>
        </section>

        <section className="story-band" id="historia" aria-labelledby="story-title"><div className="wrap">
          <div className="section-heading story-heading"><div><span className="eyebrow">Linha do tempo</span><h2 id="story-title">Nossa história em números</h2></div><p>Uma contagem desde 14 de agosto de 2021.</p></div>
          <div className="timer-grid" aria-label="Tempo juntos">
            {[
              ['years', 'anos'], ['months', 'meses'], ['days', 'dias'],
              ['hours', 'horas'], ['minutes', 'minutos'], ['seconds', 'segundos'],
            ].map(([key, label]) => <div className="timer-cell" key={key}><strong>{String(time[key]).padStart(2, '0')}</strong><span>{label}</span></div>)}
          </div>
          <div className="milestone-grid"><div><span className="milestone-icon">♥</span><p><strong>{time.totalDays.toLocaleString('pt-BR')} dias</strong><br />desde o começo</p></div><div><span className="milestone-icon">✦</span><p><strong>{anniversary.daysLeft === 0 ? 'É hoje!' : `${anniversary.daysLeft} dias`}</strong><br />{anniversary.daysLeft === 0 ? 'Nosso aniversário' : 'até o próximo aniversário'}</p></div></div>
        </div></section>

        <section className="section gallery-section wrap" aria-labelledby="gallery-title"><div className="section-heading"><div><span className="eyebrow">Galeria</span><h2 id="gallery-title">Nossos momentos</h2></div><span className="section-decoration" aria-hidden="true">✳</span></div><PhotoGallery /></section>

        <section className="letter-section wrap" aria-labelledby="letter-title"><div className="letter-ornament" aria-hidden="true">✦</div><div className="letter-paper"><span className="eyebrow">Uma nota</span><h2 id="letter-title">Sobre o caminho até aqui</h2><p>Desde 2021, vieram conversas, planos, desafios e boas lembranças.</p><p>É bom olhar para trás e ver tudo o que construímos.</p><p className="letter-signature">Obrigado pela parceria. <span>♥</span></p></div></section>

        <SharedAccess shared={shared} />
        {shared.ready && <><Memories shared={shared} /><Phrases shared={shared} /></>}
      </main>
      <footer className="site-footer"><div className="wrap"><span>♥ para nós</span><p>Desde 2021, um registro da nossa história.</p><button type="button" onClick={() => scrollTo('inicio')}>Voltar ao topo ↑</button></div></footer>
      {shareMessage && <div className="toast" role="status">{shareMessage}<button type="button" onClick={() => setShareMessage('')} aria-label="Fechar aviso">×</button></div>}
    </div>
  )
}
