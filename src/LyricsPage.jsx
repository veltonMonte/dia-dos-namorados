import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function LyricsPage(){
  const [lines, setLines] = useState([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [slideDelay, setSlideDelay] = useState(2500)
  const [syncMode, setSyncMode] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const END_LIMIT = 247

  const [audioError, setAudioError] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    fetch('/lyrics/always.json')
      .then(r=>{
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(j=>{
        if(Array.isArray(j.lines) && j.lines.length > 0 && j.lines[0].hasOwnProperty('time')){
          setLines(j.lines)
          setSyncMode(true)
        } else {
          throw new Error('no timestamps')
        }
      })
      .catch(()=>{
        fetch('/lyrics/always_full.json')
          .then(r=>r.json())
          .then(j=>{ setLines(j.lines || []); setSyncMode(false) })
          .catch(()=> setLines([]))
      })
  },[])

  useEffect(()=>{
    const a = audioRef.current
    if(!a) return
    const onEnded = ()=> setPlaying(false)
    a.addEventListener('ended', onEnded)
    return ()=> a.removeEventListener('ended', onEnded)
  },[])

  useEffect(()=>{
    const a = audioRef.current
    if(!a) return

    const onMeta = () => {
      if(syncMode) return
      if(!lines || lines.length === 0) return
      const plain = typeof lines[0] === 'string'
      if(!plain) return

      const start = 166
      const dur = a.duration && isFinite(a.duration) ? a.duration : 0
      const available = Math.max(5, Math.max(0, dur - start))
      const nonEmptyCount = lines.filter(l => typeof l === 'string' && l.trim() !== '').length || 1
      const per = available / nonEmptyCount

      let t = start
      const mapped = lines.map((ln) => {
        if(typeof ln === 'string' && ln.trim() !== ''){
          const obj = { time: Math.max(0, Math.round(t)), text_en: ln, text_pt: ln }
          t += per
          return obj
        }
        const obj = { time: Math.max(0, Math.round(t)), text_en: '', text_pt: '' }
        return obj
      })

      setLines(mapped)
      setSyncMode(true)
    }

    a.addEventListener('loadedmetadata', onMeta)
    return () => a.removeEventListener('loadedmetadata', onMeta)
  },[lines, syncMode])

  useEffect(()=>{
    const a = audioRef.current
    if(!a) return
    if(syncMode){
      const onTime = () => {
        const t = a.currentTime
        if(t >= END_LIMIT){
          try{ a.pause() }catch(e){}
          try{ a.currentTime = END_LIMIT }catch(e){}
          setPlaying(false)
          setProgress(100)
          if(lines && lines.length) setIndex(lines.length - 1)
          return
        }
        let idx = -1
        for(let i=0;i<lines.length;i++){
          if(t >= (lines[i].time || 0)) idx = i
          else break
        }
        if(idx !== -1) setIndex(idx)

        const start = lines[0]?.time || 166
        const end = END_LIMIT
        let pct = 0
        if(end > start){
          pct = Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100))
        } else {
          pct = t >= end ? 100 : 0
        }
        setProgress(pct)
      }

      if(playing){
        if(a.currentTime < 166) a.currentTime = 166
        a.play().catch((e)=>{ setAudioError('Falha ao reproduzir o áudio: '+ (e && e.message)) })
      } else {
        a.pause()
      }

      a.addEventListener('timeupdate', onTime)
      return ()=> a.removeEventListener('timeupdate', onTime)
    } else {
      if(playing){
        if(a.currentTime < 166) a.currentTime = 166
        a.play().catch((e)=>{ setAudioError('Falha ao reproduzir o áudio: '+ (e && e.message)) })
        if(timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(()=>{
          const t = a.currentTime
          if(t >= END_LIMIT){
            if(timerRef.current){ clearInterval(timerRef.current); timerRef.current = null }
            try{ a.pause() }catch(e){}
            setPlaying(false)
            setProgress(100)
            if(lines && lines.length) setIndex(lines.length - 1)
            return
          }
          const start = lines[0]?.time || 166
          const end = END_LIMIT
          let pct = 0
          if(end > start) pct = Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100))
          else pct = t >= end ? 100 : 0
          setProgress(pct)

          let idx = -1
          for(let i=0;i<lines.length;i++){
            if(t >= (lines[i].time || 0)) idx = i
            else break
          }
          if(idx !== -1) setIndex(idx)
        }, slideDelay)
      } else {
        if(timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        a.pause()
      }
      return ()=> { if(timerRef.current){ clearInterval(timerRef.current); timerRef.current = null } }
    }
  },[playing, lines, slideDelay, syncMode])

  const reset = () => {
    setIndex(0)
    setPlaying(false)
    setProgress(0)
    if(audioRef.current) audioRef.current.currentTime = 166
  }

  const seekToProgress = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frac = Math.max(0, Math.min(1, x / rect.width || 0))
    const start = lines[0]?.time || 166
    const end = END_LIMIT
    const newTime = Math.min(end, start + frac * (end - start))
    if(audioRef.current){
      try{ audioRef.current.currentTime = newTime }catch(e){}
      const pct = end > start ? Math.min(100, Math.max(0, ((newTime - start) / (end - start)) * 100)) : (newTime >= end ? 100 : 0)
      setProgress(pct)

      let idx = -1
      for(let i=0;i<lines.length;i++){
        if(newTime >= (lines[i].time || 0)) idx = i
        else break
      }
      if(idx !== -1) setIndex(idx)
    }
  }

  const current = lines[index]
  const prev = lines[index-1]
  const next = lines[index+1]

  const textOf = (l) => l ? (syncMode ? l.text_en : l) : ''
  const ptOf = (l) => l && syncMode ? l.text_pt : ''

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg, #1a0b2e 0%, #2d1b4e 50%, #1a0b2e 100%)',
      color:'#fff',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:24,
      fontFamily:'sans-serif',
      overflow:'hidden'
    }}>
      <div className="lyrics-wrapper" style={{width:'100%', maxWidth:680}}>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
          <button onClick={()=> navigate('/')} style={{
            padding:'8px 16px', borderRadius:20, background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.1)', color:'#fff', cursor:'pointer', fontSize:14
          }}>← Voltar</button>
          <div style={{fontSize:13, color:'#9d8bb8', letterSpacing:1, textTransform:'uppercase'}}>
            Always — Bon Jovi
          </div>
        </div>

        <div className="lyrics-card" style={{
          position:'relative',
          padding:'56px 32px',
          borderRadius:20,
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)',
          textAlign:'center',
          boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
          minHeight:240,
          display:'flex',
          flexDirection:'column',
          justifyContent:'center',
          overflow:'hidden'
        }}>
          {/* glow background pulse synced with line changes */}
          <motion.div
            key={`glow-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.35, scale: 1.4 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position:'absolute',
              top:'50%', left:'50%',
              width:300, height:300,
              marginTop:-150, marginLeft:-150,
              borderRadius:'50%',
              background:'radial-gradient(circle, rgba(255,143,171,0.25), transparent 70%)',
              pointerEvents:'none'
            }}
          />

          {/* previous line */}
          <AnimatePresence mode="wait">
            {prev && (
              <motion.div
                key={`prev-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.35, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                style={{ fontSize:15, color:'#c9b8e0', marginBottom:10, position:'relative', zIndex:1 }}
              >
                {textOf(prev)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* current line */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`current-${index}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ position:'relative', zIndex:1 }}
            >
              <div style={{ fontSize:32, fontWeight:700, lineHeight:1.4, marginBottom:8, color:'#fff', textShadow:'0 0 24px rgba(255,143,171,0.35)' }}>
                {current ? textOf(current) : '...'}
              </div>
              {syncMode && current?.text_pt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  style={{ fontSize:18, color:'#ff8fab', fontStyle:'italic' }}
                >
                  {ptOf(current)}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* next line */}
          <AnimatePresence mode="wait">
            {next && (
              <motion.div
                key={`next-${index}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.35, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                style={{ fontSize:15, color:'#c9b8e0', marginTop:10, position:'relative', zIndex:1 }}
              >
                {textOf(next)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div onClick={seekToProgress} style={{margin:'20px 0 8px', height:8, borderRadius:6, background:'rgba(255,255,255,0.08)', overflow:'hidden', cursor:'pointer'}} title="Clique para pular para essa posição">
          <motion.div
            style={{
              height:'100%',
              background:'linear-gradient(90deg, #ff8fab, #c084fc)',
              borderRadius:6
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease:'linear' }}
          />
        </div>
        <div style={{textAlign:'center', fontSize:12, color:'#7a6a96', marginBottom:24}}>
          {lines.length ? `${index+1} / ${lines.length}` : 'carregando letra...'}
        </div>

        <div style={{display:'flex', justifyContent:'center', gap:12}}>
          <button onClick={reset} className="reset-btn" style={{
            width:44, height:44, borderRadius:'50%',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'#fff', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center'
          }}>⟲</button>
          <motion.button
            onClick={()=> setPlaying(p => !p)}
            whileTap={{ scale: 0.9 }}
            animate={playing ? { boxShadow: ['0 8px 24px rgba(255,143,171,0.4)', '0 8px 36px rgba(255,143,171,0.7)', '0 8px 24px rgba(255,143,171,0.4)'] } : {}}
            transition={playing ? { duration: 1.6, repeat: Infinity, ease:'easeInOut' } : {}}
            className="play-btn"
            style={{
              width:60, height:60, borderRadius:'50%',
              background:'linear-gradient(135deg, #ff8fab, #c084fc)',
              border:'none', cursor:'pointer', color:'#1a0b2e',
              display:'flex', alignItems:'center', justifyContent:'center', padding:0
            }}
          >
            <span style={{display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, fontSize:24, transform:'translateY(-1px)'}}>
              {playing ? '❚❚' : '▶'}
            </span>
          </motion.button>
        </div>

        {!syncMode && lines.length > 0 && (
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:20, fontSize:12, color:'#9d8bb8'}}>
            <span>Velocidade</span>
            <input
              type="range" min="1500" max="5000" step="100"
              value={slideDelay}
              onChange={e=> setSlideDelay(Number(e.target.value))}
              style={{width:120}}
            />
          </div>
        )}

        <audio
          ref={audioRef}
          src="/music/Bon Jovi - Always (Official Music Video).mp3"
          preload="metadata"
          style={{display:'none'}}
          onError={()=> setAudioError('Erro ao carregar o arquivo de áudio (verifique o caminho em /public/music/)')}
        />
        {audioError && <div style={{color:'#ffb3c1', marginTop:12, textAlign:'center', fontSize:13}}>{audioError}</div>}
      </div>
    </div>
  )
}