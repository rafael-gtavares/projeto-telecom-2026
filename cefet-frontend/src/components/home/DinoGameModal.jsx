import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CANVAS_W = 600
const CANVAS_H = 200
const GROUND_Y = 160
const GRAVITY = 0.6
const JUMP_FORCE = -11
const DINO_SIZE = 30

// Lê uma CSS variable "R G B" (ex: "57 255 130") e devolve como rgb(r,g,b)
const readColor = (varName, fallback) => {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  if (!raw) return fallback
  return `rgb(${raw.replace(/\s+/g, ', ')})`
}

const DinoGameModal = ({ onClose }) => {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    dinoY: GROUND_Y - DINO_SIZE,
    velocityY: 0,
    isJumping: false,
    obstacles: [],
    speed: 5,
    frame: 0,
    running: true,
  })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const scoreRef = useRef(0)

  const jump = () => {
    const s = stateRef.current
    if (!s.isJumping && s.running) {
      s.velocityY = JUMP_FORCE
      s.isJumping = true
    }
  }

  const restart = () => {
    stateRef.current = {
      dinoY: GROUND_Y - DINO_SIZE,
      velocityY: 0,
      isJumping: false,
      obstacles: [],
      speed: 5,
      frame: 0,
      running: true,
    }
    scoreRef.current = 0
    setScore(0)
    setGameOver(false)
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (gameOver) restart()
        else jump()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameOver])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId

    const loop = () => {
      const s = stateRef.current

      const colorGround = readColor('--color-border', '#5C6880')
      const colorDino = readColor('--color-primary', '#E65100')
      const colorObstacle = readColor('--color-obstacle', '#1A1A2E')
      const colorText = readColor('--color-text-primary', '#1A1A2E')

      if (s.running) {
        s.frame++

        s.velocityY += GRAVITY
        s.dinoY += s.velocityY
        if (s.dinoY > GROUND_Y - DINO_SIZE) {
          s.dinoY = GROUND_Y - DINO_SIZE
          s.velocityY = 0
          s.isJumping = false
        }

        if (s.frame % 90 === 0) {
          s.obstacles.push({ x: CANVAS_W, w: 16, h: 30 + Math.random() * 20 })
        }

        s.obstacles.forEach(o => { o.x -= s.speed })
        s.obstacles = s.obstacles.filter(o => o.x + o.w > 0)

        const dinoBox = { x: 40, y: s.dinoY, w: DINO_SIZE, h: DINO_SIZE }
        for (const o of s.obstacles) {
          const oBox = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h }
          if (
            dinoBox.x < oBox.x + oBox.w &&
            dinoBox.x + dinoBox.w > oBox.x &&
            dinoBox.y < oBox.y + oBox.h &&
            dinoBox.y + dinoBox.h > oBox.y
          ) {
            s.running = false
            setGameOver(true)
          }
        }

        if (s.frame % 6 === 0) {
          scoreRef.current += 1
          setScore(scoreRef.current)
        }

        if (s.frame % 500 === 0) s.speed += 0.5
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      ctx.strokeStyle = colorGround
      ctx.beginPath()
      ctx.moveTo(0, GROUND_Y)
      ctx.lineTo(CANVAS_W, GROUND_Y)
      ctx.stroke()

      ctx.fillStyle = colorDino
      ctx.fillRect(40, s.dinoY, DINO_SIZE, DINO_SIZE)

      ctx.fillStyle = colorObstacle
      s.obstacles.forEach(o => {
        ctx.fillRect(o.x, GROUND_Y - o.h, o.w, o.h)
      })

      ctx.fillStyle = colorText
      ctx.font = '16px monospace'
      ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_W - 120, 24)

      if (!s.running) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = colorDino
        ctx.font = 'bold 22px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 10)
        ctx.font = '14px monospace'
        ctx.fillText('Espaço para jogar de novo', CANVAS_W / 2, CANVAS_H / 2 + 16)
        ctx.textAlign = 'left'
      }

      animationId = requestAnimationFrame(loop)
    }

    animationId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-border p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-primary mb-3">
          Pule os obstáculos!
        </h3>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={() => (gameOver ? restart() : jump())}
          className="w-full border border-border rounded-card cursor-pointer bg-surface-page"
        />

        <p className="text-xs text-text-muted mt-3 text-center">
          Espaço, seta pra cima ou clique no canvas para pular
        </p>
      </div>
    </div>
  )
}

export default DinoGameModal