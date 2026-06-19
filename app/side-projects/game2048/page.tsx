'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

// ─── Types ───
interface Tile {
  value: number
  id: number
  isNew: boolean
  isMerged: boolean
}

// ─── Constants ───
const SIZE = 4

const TILE_COLORS: Record<number, string> = {
  0: '#CDC1B4',
  2: '#E4E4E4',
  4: '#D6D6D6',
  8: '#FFB6B6',
  16: '#FFD59E',
  32: '#FFA07A',
  64: '#FF8C42',
  128: '#B4F8C8',
  256: '#A0E7E5',
  512: '#85C7F2',
  1024: '#BDB2FF',
  2048: '#FFD6E0',
}

function getTileColor(value: number): string {
  return TILE_COLORS[value] ?? '#3C3A32'
}

function getTileTextColor(value: number): string {
  return value <= 4 ? '#776E65' : '#FFFFFF'
}

function getTileFontSize(value: number): string {
  if (value >= 1024) return 'text-lg sm:text-xl'
  if (value >= 128) return 'text-xl sm:text-2xl'
  return 'text-2xl sm:text-3xl'
}

// ─── Board Manager ───
class BoardManager {
  board: number[][]
  lastMoveScore: number
  private winAlreadyCounted: boolean

  constructor() {
    this.board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
    this.lastMoveScore = 0
    this.winAlreadyCounted = false
  }

  initializeBoard() {
    this.board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
    this.lastMoveScore = 0
    this.winAlreadyCounted = false
    this.addRandomTile()
    this.addRandomTile()
  }

  reset() {
    this.initializeBoard()
  }

  getBoard(): number[][] {
    return this.board
  }

  hasWon(): boolean {
    for (const row of this.board) {
      for (const tile of row) {
        if (tile === 2048 && !this.winAlreadyCounted) {
          this.winAlreadyCounted = true
          return true
        }
      }
    }
    return false
  }

  isGameOver(): boolean {
    if (this.getEmptyCells().length > 0) return false
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - 1; j++) {
        if (this.board[i][j] === this.board[i][j + 1] || this.board[j][i] === this.board[j + 1][i]) {
          return false
        }
      }
    }
    return true
  }

  moveLeft(): boolean {
    let moved = false
    this.lastMoveScore = 0

    for (let i = 0; i < SIZE; i++) {
      const row = this.board[i]
      const newRow = Array(SIZE).fill(0)
      let insertPos = 0
      let merged = false

      for (let j = 0; j < SIZE; j++) {
        if (row[j] === 0) continue
        if (insertPos > 0 && newRow[insertPos - 1] === row[j] && !merged) {
          newRow[insertPos - 1] *= 2
          this.lastMoveScore += newRow[insertPos - 1]
          merged = true
          moved = true
        } else {
          newRow[insertPos] = row[j]
          if (j !== insertPos) moved = true
          insertPos++
          merged = false
        }
      }
      this.board[i] = newRow
    }

    if (moved) {
      this.addRandomTile()
      if (Math.random() < 0.3) {
        this.addRandomTile()
      }
    }

    return moved
  }

  moveRight(): boolean {
    this.reverseRows()
    const moved = this.moveLeft()
    this.reverseRows()
    return moved
  }

  moveUp(): boolean {
    this.transpose()
    const moved = this.moveLeft()
    this.transpose()
    return moved
  }

  moveDown(): boolean {
    this.transpose()
    const moved = this.moveRight()
    this.transpose()
    return moved
  }

  private addRandomTile() {
    const empty = this.getEmptyCells()
    if (empty.length === 0) return
    const [r, c] = empty[Math.floor(Math.random() * empty.length)]
    const chance = Math.random()
    if (chance < 0.7) {
      this.board[r][c] = 2
    } else if (chance < 0.9) {
      this.board[r][c] = 4
    } else {
      this.board[r][c] = 8
    }
  }

  private getEmptyCells(): [number, number][] {
    const empty: [number, number][] = []
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (this.board[i][j] === 0) empty.push([i, j])
      }
    }
    return empty
  }

  private reverseRows() {
    for (const row of this.board) {
      row.reverse()
    }
  }

  private transpose() {
    for (let i = 0; i < SIZE; i++) {
      for (let j = i + 1; j < SIZE; j++) {
        const temp = this.board[i][j]
        this.board[i][j] = this.board[j][i]
        this.board[j][i] = temp
      }
    }
  }

  toJSON() {
    return { board: this.board.map(r => [...r]), winAlreadyCounted: this.winAlreadyCounted }
  }

  loadFrom(data: { board: number[][], winAlreadyCounted: boolean }) {
    this.board = data.board.map(r => [...r])
    this.winAlreadyCounted = data.winAlreadyCounted
  }
}

// ─── Component ───
let tileIdCounter = 0

export default function Game2048Page() {
  const managerRef = useRef<BoardManager | null>(null)
  const [tiles, setTiles] = useState<(Tile | null)[][]>([])
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'over'>('playing')
  const [hasShownWin, setHasShownWin] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const animKeyRef = useRef(0)

  const boardToTiles = useCallback((board: number[][], prevTiles?: (Tile | null)[][]): (Tile | null)[][] => {
    return board.map((row, i) =>
      row.map((val, j) => {
        const prev = prevTiles?.[i]?.[j]
        const isNew = prev === undefined || prev === null ? val !== 0 : (prev.value !== val && val !== 0)
        const isMerged = prev !== undefined && prev !== null && prev.value !== 0 && val !== 0 && prev.value !== val
        return val === 0
          ? null
          : { value: val, id: tileIdCounter++, isNew, isMerged }
      })
    )
  }, [])

  const updateFromManager = useCallback(() => {
    const mgr = managerRef.current!
    const board = mgr.getBoard()
    setTiles(prev => boardToTiles(board, prev))
    animKeyRef.current++
  }, [boardToTiles])

  // Initialize
  useEffect(() => {
    const mgr = new BoardManager()
    managerRef.current = mgr

    // Try to load saved state
    try {
      const saved = localStorage.getItem('game2048_state')
      if (saved) {
        const data = JSON.parse(saved)
        mgr.loadFrom(data.manager)
        setScore(data.score)
        setBest(data.best)
        setHasShownWin(data.hasShownWin ?? false)
        setTiles(boardToTiles(mgr.getBoard()))
        return
      }
    } catch { /* ignore */ }

    mgr.initializeBoard()
    const savedBest = parseInt(localStorage.getItem('game2048_best') ?? '0', 10)
    setBest(savedBest)
    setTiles(boardToTiles(mgr.getBoard()))
  }, [boardToTiles])

  // Save state on changes
  useEffect(() => {
    if (!managerRef.current) return
    const data = {
      manager: managerRef.current.toJSON(),
      score,
      best,
      hasShownWin,
    }
    localStorage.setItem('game2048_state', JSON.stringify(data))
    if (score > best) {
      localStorage.setItem('game2048_best', String(score))
    }
  }, [score, best, hasShownWin, tiles])

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameStatus === 'over') return
    const mgr = managerRef.current!
    let moved = false

    switch (direction) {
      case 'left': moved = mgr.moveLeft(); break
      case 'right': moved = mgr.moveRight(); break
      case 'up': moved = mgr.moveUp(); break
      case 'down': moved = mgr.moveDown(); break
    }

    if (!moved) return

    setScore(prev => {
      const newScore = prev + mgr.lastMoveScore
      setBest(b => Math.max(b, newScore))
      return newScore
    })
    updateFromManager()

    if (mgr.hasWon() && !hasShownWin) {
      setGameStatus('won')
      setHasShownWin(true)
    }
    if (mgr.isGameOver()) {
      setGameStatus('over')
    }
  }, [gameStatus, hasShownWin, updateFromManager])

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); handleMove('left'); break
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); handleMove('right'); break
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); handleMove('up'); break
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); handleMove('down'); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleMove])

  // Swipe detection helper
  const detectSwipe = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const dx = endX - startX
    const dy = endY - startY
    const SWIPE_THRESHOLD = 50

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        handleMove(dx > 0 ? 'right' : 'left')
      }
    } else {
      if (Math.abs(dy) > SWIPE_THRESHOLD) {
        handleMove(dy > 0 ? 'down' : 'up')
      }
    }
  }, [handleMove])

  // Touch/swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    detectSwipe(touchStartRef.current.x, touchStartRef.current.y, touch.clientX, touch.clientY)
    touchStartRef.current = null
  }

  // Mouse drag controls
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseStartRef.current) return
    detectSwipe(mouseStartRef.current.x, mouseStartRef.current.y, e.clientX, e.clientY)
    mouseStartRef.current = null
  }

  const handleMouseLeave = () => {
    mouseStartRef.current = null
  }

  const handleNewGame = () => {
    const mgr = managerRef.current!
    mgr.reset()
    setScore(0)
    setGameStatus('playing')
    setHasShownWin(false)
    setTiles(boardToTiles(mgr.getBoard()))
  }

  const handleContinue = () => {
    setGameStatus('playing')
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 relative select-none">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <img src="/guitar/background.avif" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 dark:bg-black/80 transition-colors duration-500" />
      </div>

      <main className="max-w-lg mx-auto">
        {/* Back link */}
        <Link
          href="/side-projects"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Side Projects
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-5xl font-bold" style={{ color: '#776E65' }}>2048</h1>
          <div className="flex gap-2">
            <ScoreBox label="SCORE" value={score} />
            <ScoreBox label="BEST" value={best} />
          </div>
        </div>

        {/* Subtitle + New Game */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm" style={{ color: '#776E65' }}>Join the tiles, get to <b>2048!</b></p>
          <button
            onClick={handleNewGame}
            className="px-4 py-1.5 text-sm font-bold text-white rounded-md transition-colors"
            style={{ backgroundColor: '#8F7A66' }}
          >
            New Game
          </button>
        </div>

        {/* How to play */}
        <p className="text-xs mb-4" style={{ color: '#776E65' }}>
          <b>HOW TO PLAY:</b> Use <b>arrow keys</b>, <b>swipe</b>, or <b>click & drag</b> to move the tiles. Tiles with the same number <b>merge into one</b> when they touch.
        </p>

        {/* Game Board */}
        <div
          className="relative rounded-xl p-2 sm:p-3 cursor-grab active:cursor-grabbing"
          style={{ backgroundColor: '#BBADA0' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Empty cell backgrounds */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg"
                style={{ backgroundColor: '#CDC1B4' }}
              />
            ))}
          </div>

          {/* Tiles overlay */}
          <div className="absolute inset-2 sm:inset-3 grid grid-cols-4 gap-2 sm:gap-3">
            {tiles.flat().map((tile, idx) => {
              const row = Math.floor(idx / SIZE)
              const col = idx % SIZE
              return (
                <div key={`${row}-${col}-${animKeyRef.current}`} className="aspect-square relative">
                  {tile && (
                    <div
                      className={`absolute inset-0 rounded-lg flex items-center justify-center font-bold transition-all duration-100
                        ${tile.isNew || tile.isMerged ? 'animate-tile-pop' : ''}`}
                      style={{
                        backgroundColor: getTileColor(tile.value),
                        color: getTileTextColor(tile.value),
                      }}
                    >
                      <span className={getTileFontSize(tile.value)}>{tile.value}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Game Over Overlay */}
          {gameStatus === 'over' && (
            <div className="absolute inset-0 rounded-xl bg-black/60 flex flex-col items-center justify-center z-10 animate-fade-in">
              <p className="text-3xl font-bold text-white mb-4">Game Over!</p>
              <button
                onClick={handleNewGame}
                className="px-6 py-2 bg-[#8F7A66] text-white font-bold rounded-lg hover:bg-[#7A6655] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Win Overlay */}
          {gameStatus === 'won' && (
            <div className="absolute inset-0 rounded-xl bg-yellow-400/70 flex flex-col items-center justify-center z-10 animate-fade-in">
              <p className="text-3xl font-bold text-white mb-2">🎉 You Win!</p>
              <p className="text-white/80 mb-4 text-sm">You reached 2048!</p>
              <div className="flex gap-3">
                <button
                  onClick={handleContinue}
                  className="px-5 py-2 bg-white/90 text-[#776E65] font-bold rounded-lg hover:bg-white transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={handleNewGame}
                  className="px-5 py-2 bg-[#8F7A66] text-white font-bold rounded-lg hover:bg-[#7A6655] transition-colors"
                >
                  New Game
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-white/30 text-xs">
            Ported from{' '}
            <a
              href="https://github.com/nta105/Game2048"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/50"
            >
              Game2048 Android App
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-4 py-1.5 rounded-md min-w-[70px]" style={{ backgroundColor: '#BBADA0' }}>
      <span className="text-[10px] font-bold tracking-wider" style={{ color: '#EEE4DA' }}>{label}</span>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  )
}
