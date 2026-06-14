import { useEffect, useRef } from 'react'

// Cores da identidade CEFET (em RGB para usar com alpha no canvas)
const C = {
  line: '21,101,192',     // primary
  node: '66,165,245',     // primary-lighter
}

// Fundo interativo da hero: campo de pontos de contato (vários, em movimento)
// que se conectam entre si, ao cursor e ao centro de transmissão (o logo).
// O hub é lido dinamicamente da posição real do #hero-transmitter, então o
// brilho/pulsos/linhas seguem o logo em qualquer tamanho de tela.
const HeroBackground = () => {
  const canvasRef = useRef(null)
  const hostRef = useRef(null)
  const stateRef = useRef({ particles: [], mouse: { x: null, y: null }, hub: { x: 0, y: 0 }, t: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let raf

    const measureHub = (hostRect) => {
      const el = document.getElementById('hero-transmitter')
      if (el) {
        const r = el.getBoundingClientRect()
        stateRef.current.hub = {
          x: r.left + r.width / 2 - hostRect.left,
          y: r.top + r.height / 2 - hostRect.top,
        }
      } else {
        stateRef.current.hub = { x: width * 0.5, y: height * 0.5 }
      }
    }

    const initParticles = () => {
      const count = Math.min(96, Math.max(34, Math.round((width * height) / 13000)))
      stateRef.current.particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.7 + 1.1,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      measureHub(rect)
      initParticles()
      if (reduceMotion) renderFrame()
    }

    const drawHub = (hub, t) => {
      // Onda de transmissão expandindo (lenta) — emana de trás do logo
      if (!reduceMotion) {
        const period = 600 // quanto maior, mais lenta a onda
        for (let k = 0; k < 3; k++) {
          const prog = ((t + (k * period) / 3) % period) / period
          const r = 80 + prog * 210
          ctx.strokeStyle = `rgba(${C.node},${(1 - prog) * 0.20})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(hub.x, hub.y, r, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      // Brilho que ilumina o transmissor por trás
      const glow = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, 150)
      glow.addColorStop(0, `rgba(${C.node},0.26)`)
      glow.addColorStop(1, `rgba(${C.node},0)`)
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(hub.x, hub.y, 150, 0, Math.PI * 2)
      ctx.fill()
    }

    function renderFrame() {
      const hostRect = host.getBoundingClientRect()
      measureHub(hostRect)
      const { particles, mouse, hub } = stateRef.current
      const t = stateRef.current.t
      ctx.clearRect(0, 0, width, height)

      // Atualiza posição
      if (!reduceMotion) {
        for (const p of particles) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -20) p.x = width + 20
          else if (p.x > width + 20) p.x = -20
          if (p.y < -20) p.y = height + 20
          else if (p.y > height + 20) p.y = -20

          // Atração suave em direção ao cursor
          if (mouse.x != null) {
            const dx = mouse.x - p.x
            const dy = mouse.y - p.y
            const d2 = dx * dx + dy * dy
            const R = 170
            if (d2 < R * R) {
              const d = Math.sqrt(d2) || 1
              const f = (1 - d / R) * 0.5
              p.x += (dx / d) * f
              p.y += (dy / d) * f
            }
          }
        }
      }

      // Linhas entre pontos próximos
      const MAXD = 118
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < MAXD * MAXD) {
            const o = (1 - Math.sqrt(d2) / MAXD) * 0.16
            ctx.strokeStyle = `rgba(${C.line},${o})`
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          }
        }
      }

      // Linhas dos pontos até o centro de transmissão (o logo)
      const HUBD = 250
      for (const p of particles) {
        const dx = hub.x - p.x
        const dy = hub.y - p.y
        const d = Math.hypot(dx, dy)
        if (d < HUBD) {
          ctx.strokeStyle = `rgba(${C.node},${(1 - d / HUBD) * 0.30})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(p.x, p.y); ctx.stroke()
        }
      }

      // Linhas até o cursor
      if (mouse.x != null) {
        for (const p of particles) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const d = Math.hypot(dx, dy)
          if (d < 160) {
            ctx.strokeStyle = `rgba(${C.line},${(1 - d / 160) * 0.45})`
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y); ctx.stroke()
          }
        }
      }

      // Pontos de contato
      for (const p of particles) {
        const tw = reduceMotion ? 0.8 : 0.6 + 0.4 * Math.sin(t * 0.03 + p.phase)
        ctx.fillStyle = `rgba(${C.node},${0.45 * tw + 0.3})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }

      // Centro de transmissão (brilho + onda atrás do logo)
      drawHub(hub, t)
    }

    const loop = () => {
      stateRef.current.t += 1
      renderFrame()
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      const rect = host.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      stateRef.current.mouse =
        x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : { x: null, y: null }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    if (!reduceMotion) loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

export default HeroBackground
