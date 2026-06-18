'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Be_Vietnam_Pro } from 'next/font/google'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
})

// ─── Types ───
interface Player {
  name: string
  role: string
  side: string
  isAlive: boolean
  lives: number
  linkedWith: number | null
  hunterTarget: number | null
  isTransformed: boolean
  markedByMirror: boolean
}

interface GameState {
  players: Player[]
  nightCount: number
  witchHeal: boolean
  witchPoison: boolean
  extraKillNextNight: boolean
  isCursed: boolean
  pendingHunterKill: number | null
  lastProtected: number | null
  gameLogs: string[]
  running: boolean
  phase: 'setup' | 'reveal' | 'playing' | 'ended'
  pendingDeathMessages: string[]
}

type ModalConfig = {
  title: string
  subtitle?: string
  body?: string
  primaryText?: string
  mode: 'simple'
  resolve: () => void
} | {
  title: string
  subtitle?: string
  infoText?: string
  mode: 'playerChoice'
  players: { name: string; disabled: boolean }[]
  allowSkip: boolean
  resolve: (index: number | null) => void
} | {
  title: string
  subtitle?: string
  infoText?: string
  mode: 'confirm'
  resolve: (yes: boolean) => void
}

// ─── Constants ───
const roleMap = new Map<string, string>([
  ['masoi', 'Ma Sói'], ['soi', 'Ma Sói'], ['wolf', 'Ma Sói'], ['werewolf', 'Ma Sói'],
  ['soicon', 'Sói Con'], ['wolfcub', 'Sói Con'],
  ['tientri', 'Tiên Tri'], ['seer', 'Tiên Tri'],
  ['baove', 'Bảo Vệ'], ['bodyguard', 'Bảo Vệ'],
  ['phuthuy', 'Phù Thủy'], ['witch', 'Phù Thủy'],
  ['thosan', 'Thợ Săn'], ['hunter', 'Thợ Săn'],
  ['gialang', 'Già Làng'], ['elder', 'Già Làng'],
  ['cupid', 'Cupid'],
  ['50/50', '50/50'],
  ['danlang', 'Dân Làng'], ['dan', 'Dân Làng'], ['villager', 'Dân Làng'],
  ['bitch', 'Bitch'],
  ['guong', 'Gương'], ['mirror', 'Gương'],
])

function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9/]+/g, '')
}

function parseRoles(raw: string, numPlayers: number): string[] {
  const rolePool: string[] = []
  const items = String(raw || '').split(',')
  for (const item of items) {
    const trimmed = item.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^(\d+)\s*(.*)$/)
    let count = 1
    let roleName = trimmed
    if (match) {
      count = parseInt(match[1], 10)
      roleName = match[2]
    }
    const canonical = roleMap.get(normalizeText(roleName))
    if (canonical) {
      for (let i = 0; i < count; i++) rolePool.push(canonical)
    }
  }
  while (rolePool.length < numPlayers) rolePool.push('Dân Làng')
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]]
  }
  return rolePool.slice(0, numPlayers)
}

// ─── Component ───
export default function WerewolfGame() {
  const [numPlayers, setNumPlayers] = useState('')
  const [namesInput, setNamesInput] = useState('')
  const [rolesInput, setRolesInput] = useState('')
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    nightCount: 0,
    witchHeal: true,
    witchPoison: true,
    extraKillNextNight: false,
    isCursed: false,
    pendingHunterKill: null,
    lastProtected: null,
    gameLogs: [],
    running: false,
    phase: 'setup',
    pendingDeathMessages: [],
  })
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const logBoxRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(gameState)

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
    }
  }, [gameState.gameLogs])

  const log = useCallback((message: string) => {
    setGameState(prev => ({ ...prev, gameLogs: [...prev.gameLogs, message] }))
  }, [])

  const showSimplePrompt = useCallback(({ title, subtitle = '', body = '', primaryText = 'OK' }: { title: string; subtitle?: string; body?: string; primaryText?: string }): Promise<void> => {
    return new Promise((resolve) => {
      setModal({ title, subtitle, body, primaryText, mode: 'simple', resolve })
    })
  }, [])

  const awaitPlayerChoice = useCallback(({ title, subtitle = '', allowSkip = false, disabledIndices = [], infoText = '' }: { title: string; subtitle?: string; allowSkip?: boolean; disabledIndices?: number[]; infoText?: string }): Promise<number | null> => {
    return new Promise((resolve) => {
      const alive = stateRef.current.players.filter(p => p.isAlive)
      const players = alive.map((p, i) => ({ name: p.name, disabled: disabledIndices.includes(i) }))
      setModal({ title, subtitle, infoText, mode: 'playerChoice', players, allowSkip, resolve })
    })
  }, [])

  const confirmAction = useCallback(({ title, subtitle = '', infoText = '' }: { title: string; subtitle?: string; infoText?: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({ title, subtitle, infoText, mode: 'confirm', resolve })
    })
  }, [])

  const getAlivePlayers = useCallback(() => {
    return stateRef.current.players.filter(p => p.isAlive)
  }, [])

  const reflect = (targetGlobalIdx: number, mirrorIndex: number, mirrorTargetGlobalIdx: number | null): number => {
    if (targetGlobalIdx === mirrorIndex && mirrorTargetGlobalIdx !== null) {
      return mirrorTargetGlobalIdx
    }
    return targetGlobalIdx
  }

  const kill = useCallback((playerIndex: number, reason: string, isDaytime = false, silent = false, hideRole = false, currentNightDeathEvents?: number[]) => {
    setGameState(prev => {
      const players = [...prev.players.map(p => ({ ...p }))]
      const player = players[playerIndex]
      if (!player || !player.isAlive) return prev

      player.lives -= 1
      if (player.lives > 0) {
        return { ...prev, players, gameLogs: [...prev.gameLogs, `-> ${player.name} bị tấn công (${reason}) nhưng vẫn còn mạng.`] }
      }

      player.isAlive = false
      const newLogs = [...prev.gameLogs]
      const newDeathMessages = [...prev.pendingDeathMessages]
      let newIsCursed = prev.isCursed
      let newExtraKill = prev.extraKillNextNight
      let newPendingHunterKill = prev.pendingHunterKill

      if (hideRole) {
        newLogs.push(`-> ${player.name} ĐÃ CHẾT do ${reason}.`)
        if (isDaytime && !silent) newDeathMessages.push(`💀 ${player.name} ĐÃ CHẾT! [${reason}]`)
      } else {
        newLogs.push(`-> ${player.name} (${player.role}) ĐÃ CHẾT do ${reason}.`)
        if (isDaytime && !silent) newDeathMessages.push(`💀 ${player.name} (${player.role}) ĐÃ CHẾT! [${reason}]`)
      }

      if (player.role === 'Già Làng') newIsCursed = true
      if (player.role === 'Sói Con') newExtraKill = true

      if (player.linkedWith !== null && players[player.linkedWith]?.isAlive) {
        const linked = players[player.linkedWith]
        linked.isAlive = false
        newLogs.push(`-> ${linked.name} (${linked.role}) ĐÃ CHẾT do Chết chùm (Cupid).`)
      }

      if (player.role === 'Thợ Săn' && !newIsCursed) {
        if (player.hunterTarget !== null && players[player.hunterTarget]?.isAlive) {
          if (!isDaytime) {
            const ht = players[player.hunterTarget]
            ht.isAlive = false
            newLogs.push(`-> ${ht.name} (${ht.role}) ĐÃ CHẾT do Thợ Săn kéo.`)
          } else {
            newPendingHunterKill = player.hunterTarget
          }
        }
      }

      if (currentNightDeathEvents) currentNightDeathEvents.push(playerIndex)

      return {
        ...prev,
        players,
        gameLogs: newLogs,
        pendingDeathMessages: newDeathMessages,
        isCursed: newIsCursed,
        extraKillNextNight: newExtraKill,
        pendingHunterKill: newPendingHunterKill,
      }
    })
  }, [])

  const fillDemo = () => {
    setNumPlayers('8')
    setNamesInput('An\nThompson\nVinh\nQnhi\nTu\nMnhi\nDuy\nNam')
    setRolesInput('2 Soi, 1 Witch, 1 Seer, 1 Bodyguard, 1 Hunter, 1 50/50, 1 gialang')
  }

  const resetGame = () => {
    setGameState({
      players: [],
      nightCount: 0,
      witchHeal: true,
      witchPoison: true,
      extraKillNextNight: false,
      isCursed: false,
      pendingHunterKill: null,
      lastProtected: null,
      gameLogs: [],
      running: false,
      phase: 'setup',
      pendingDeathMessages: [],
    })
    setModal(null)
  }

  const startGame = async () => {
    const num = parseInt(numPlayers, 10)
    if (!Number.isInteger(num) || num < 2) {
      await showSimplePrompt({ title: 'Lỗi nhập liệu', body: 'Nhập tổng số người chơi hợp lệ (tối thiểu 2).', primaryText: 'OK' })
      return
    }

    const names = namesInput.split('\n').map(s => s.trim()).filter(Boolean)
    while (names.length < num) names.push(`PLAYER_${names.length + 1}`)

    const rolePool = parseRoles(rolesInput, num)
    const players: Player[] = Array.from({ length: num }, (_, i) => {
      const role = rolePool[i]
      const side = role.includes('Sói') ? 'Sói' : (role === 'Gương' ? 'Gương' : 'Dân')
      return {
        name: (names[i] || `PLAYER_${i + 1}`).trim().toUpperCase(),
        role,
        side,
        isAlive: true,
        lives: role === 'Già Làng' ? 2 : 1,
        linkedWith: null,
        hunterTarget: null,
        isTransformed: false,
        markedByMirror: false,
      }
    })

    setGameState(prev => ({
      ...prev,
      players,
      nightCount: 0,
      witchHeal: true,
      witchPoison: true,
      extraKillNextNight: false,
      isCursed: false,
      pendingHunterKill: null,
      lastProtected: null,
      gameLogs: ['--- SETUP GAME ---', `Tổng số người chơi: ${num}`, 'Vai trò đã được phân bổ.'],
      running: true,
      phase: 'reveal',
      pendingDeathMessages: [],
    }))

    // Role reveal
    for (const p of players) {
      await showSimplePrompt({
        title: `🔔 Mời ${p.name} xem vai`,
        subtitle: 'Những người khác vui lòng nhắm mắt.',
        body: `<strong>Vai của bạn là:</strong> <span style="color:#f39c12;font-size:22px">${p.role.toUpperCase()}</span><br/><br/>Ghi nhớ vai và bấm OK để sang người tiếp theo.`,
        primaryText: 'Tôi đã xem',
      })
    }

    // Start game loop
    setGameState(prev => ({ ...prev, phase: 'playing' }))
    await gameLoop(players)
  }

  const gameLoop = async (initialPlayers: Player[]) => {
    let looping = true
    while (looping) {
      if (checkVictory()) { looping = false; break }
      await nightPhase()
      if (checkVictory()) { looping = false; break }
      await dayPhase()
    }
  }

  const checkVictory = (): boolean => {
    const st = stateRef.current
    const alives = st.players.filter(p => p.isAlive)
    const wolves = alives.filter(p => p.side === 'Sói' || p.isTransformed)
    const villagers = alives.filter(p => p.side === 'Dân' && !p.isTransformed)
    const mirrorAlive = alives.filter(p => p.role === 'Gương')

    let victoryMsg: string | null = null
    if (mirrorAlive.length) {
      const m = mirrorAlive[0]
      const others = alives.filter(p => p !== m)
      if (others.length && others.every(p => p.markedByMirror)) {
        victoryMsg = '🪞 GƯƠNG CHIẾN THẮNG TUYỆT ĐỐI!'
      }
    }
    if (!victoryMsg && !villagers.length) {
      victoryMsg = '🐺 PHE MA SÓI CHIẾN THẮNG!'
    }
    if (!victoryMsg && !wolves.length) {
      victoryMsg = '🏆 PHE DÂN LÀNG CHIẾN THẮNG!'
    }

    if (victoryMsg) {
      setGameState(prev => ({ ...prev, running: false, phase: 'ended', gameLogs: [...prev.gameLogs, `\n${victoryMsg}`] }))
      showSimplePrompt({ title: 'KẾT THÚC TRẬN ĐẤU', body: `<div style="text-align:center;font-size:22px;padding:16px 0">${victoryMsg}</div>`, primaryText: 'Xem tổng kết' })
      return true
    }
    return false
  }

  const nightPhase = async () => {
    const st = stateRef.current
    const nightNum = st.nightCount + 1
    setGameState(prev => ({ ...prev, nightCount: nightNum }))
    log(`\n--- ĐÊM ${nightNum} ---`)

    await showSimplePrompt({
      title: `🌙 ĐÊM THỨ ${nightNum} BẮT ĐẦU`,
      subtitle: 'Tất cả người chơi nhắm mắt lại.',
      body: 'Bấm OK để đi qua từng vai đúng thứ tự.',
      primaryText: 'Bắt đầu đêm',
    })

    const state = stateRef.current
    const intentWolfBites: number[] = []
    let intentProtected: number | null = null
    let intentPoisoned: number | null = null
    let intentWitchSaved = false
    let intentDisabledPlayer: number | null = null

    const mirrorIndex = state.players.findIndex(p => p.role === 'Gương' && p.isAlive)
    let mirrorTargetIndex: number | null = null
    const hasMirror = state.players.some(p => p.role === 'Gương')

    // ── Gương ──
    if (hasMirror) {
      await showSimplePrompt({ title: 'GƯƠNG thức dậy', body: 'Những người khác nhắm mắt. Bấm OK để Gương mở mắt.', primaryText: 'Tiếp tục' })
      if (mirrorIndex !== -1) {
        const alive = state.players.filter(p => p.isAlive)
        const mirrorAliveIdx = alive.findIndex(p => p === state.players[mirrorIndex])
        const choice = await awaitPlayerChoice({ title: 'Chào Gương, chọn người phản chiếu:', disabledIndices: [mirrorAliveIdx] })
        if (choice !== null) {
          mirrorTargetIndex = state.players.indexOf(alive[choice])
          setGameState(prev => {
            const players = [...prev.players.map(p => ({ ...p }))]
            players[mirrorTargetIndex!].markedByMirror = true
            return { ...prev, players }
          })
          log(`Gương soi ${alive[choice].name}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Bitch ──
    if (state.players.some(p => p.role === 'Bitch')) {
      await showSimplePrompt({ title: 'BITCH thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
      const bitchIndex = state.players.findIndex(p => p.role === 'Bitch' && p.isAlive)
      if (bitchIndex !== -1) {
        const choice = await awaitPlayerChoice({ title: 'Ngủ với ai?', allowSkip: true, infoText: hasMirror ? 'Nếu có Gương, mục tiêu có thể bị phản chiếu.' : '' })
        if (choice !== null) {
          const alive = state.players.filter(p => p.isAlive)
          const globalIdx = state.players.indexOf(alive[choice])
          intentDisabledPlayer = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          log(`Bitch ngủ với ${alive[choice].name}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Cupid (đêm đầu) ──
    if (state.players.some(p => p.role === 'Cupid') && nightNum === 1) {
      await showSimplePrompt({ title: 'CUPID thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
      const cupidIndex = state.players.findIndex(p => p.role === 'Cupid' && p.isAlive)
      if (cupidIndex !== -1 && cupidIndex !== intentDisabledPlayer) {
        const firstChoice = await awaitPlayerChoice({ title: 'Nối người 1' })
        if (firstChoice !== null) {
          const alive = state.players.filter(p => p.isAlive)
          const firstGlobalIdx = state.players.indexOf(alive[firstChoice])
          const secondChoice = await awaitPlayerChoice({ title: 'Nối người 2', disabledIndices: [firstChoice] })
          if (secondChoice !== null) {
            const secondGlobalIdx = state.players.indexOf(alive[secondChoice])
            const p1Final = reflect(firstGlobalIdx, mirrorIndex, mirrorTargetIndex)
            const p2Final = reflect(secondGlobalIdx, mirrorIndex, mirrorTargetIndex)
            setGameState(prev => {
              const players = [...prev.players.map(p => ({ ...p }))]
              players[p1Final].linkedWith = p2Final
              players[p2Final].linkedWith = p1Final
              return { ...prev, players }
            })
            log(`Cupid nối ${alive[firstChoice].name} và ${alive[secondChoice].name}`)
          }
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Ma Sói ──
    await showSimplePrompt({ title: 'MA SÓI thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
    const activeWolves = state.players.filter(p => p.isAlive && (p.role.includes('Sói') || p.isTransformed) && state.players.indexOf(p) !== intentDisabledPlayer)
    if (activeWolves.length) {
      const num = state.extraKillNextNight ? 2 : 1
      setGameState(prev => ({ ...prev, extraKillNextNight: false }))
      let firstBiteAliveIdx: number | null = null
      for (let i = 0; i < num; i++) {
        const disabled = i === 1 && firstBiteAliveIdx !== null ? [firstBiteAliveIdx] : []
        const choice = await awaitPlayerChoice({ title: `Cắn người ${i + 1}`, disabledIndices: disabled })
        if (choice !== null) {
          const alive = stateRef.current.players.filter(p => p.isAlive)
          const globalIdx = stateRef.current.players.indexOf(alive[choice])
          const res = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          intentWolfBites.push(res)
          log(`Sói cắn ${alive[choice].name}`)
          if (i === 0) firstBiteAliveIdx = choice
        }
      }
    }
    await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })

    // ── Phù Thủy ──
    if (state.players.some(p => p.role === 'Phù Thủy')) {
      await showSimplePrompt({ title: 'PHÙ THỦY thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
      const witchIndex = state.players.findIndex(p => p.role === 'Phù Thủy' && p.isAlive)
      const currentState = stateRef.current
      const canAct = witchIndex !== -1 && witchIndex !== intentDisabledPlayer && !currentState.isCursed
      if (canAct) {
        const victim = intentWolfBites.length ? currentState.players[intentWolfBites[0]] : null
        if (currentState.witchHeal) {
          await showSimplePrompt({ title: 'Người bị cắn', subtitle: `Người bị cắn là: ${victim ? victim.name : 'Không ai'}`, primaryText: 'Tiếp tục' })
          if (victim) {
            const save = await confirmAction({ title: 'CỨU?', subtitle: victim.name, infoText: 'Bạn có muốn dùng bình cứu không?' })
            if (save) {
              intentWitchSaved = true
              setGameState(prev => ({ ...prev, witchHeal: false }))
              log(`Phù thủy cứu ${victim.name}`)
            }
          }
        } else {
          await showSimplePrompt({ title: 'Bình cứu đã hết', body: 'Bạn đã hết bình cứu.', primaryText: 'Tiếp tục' })
        }
        if (stateRef.current.witchPoison) {
          const choice = await awaitPlayerChoice({ title: 'ĐỘC ai?', allowSkip: true })
          if (choice !== null) {
            const alive = stateRef.current.players.filter(p => p.isAlive)
            const globalIdx = stateRef.current.players.indexOf(alive[choice])
            intentPoisoned = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
            setGameState(prev => ({ ...prev, witchPoison: false }))
            log(`Phù thủy độc ${alive[choice].name}`)
          }
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Bảo Vệ ──
    if (state.players.some(p => p.role === 'Bảo Vệ')) {
      await showSimplePrompt({ title: 'BẢO VỆ thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
      const bodyguardIndex = state.players.findIndex(p => p.role === 'Bảo Vệ' && p.isAlive)
      const currentState = stateRef.current
      if (bodyguardIndex !== -1 && bodyguardIndex !== intentDisabledPlayer && !currentState.isCursed) {
        const alive = currentState.players.filter(p => p.isAlive)
        const disabled: number[] = []
        if (currentState.lastProtected !== null && currentState.players[currentState.lastProtected]?.isAlive) {
          const lastIdx = alive.indexOf(currentState.players[currentState.lastProtected])
          if (lastIdx !== -1) disabled.push(lastIdx)
        }
        const choice = await awaitPlayerChoice({ title: 'Bảo vệ ai?', disabledIndices: disabled })
        if (choice !== null) {
          const globalIdx = currentState.players.indexOf(alive[choice])
          const res = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          intentProtected = res
          log(`Bảo vệ gác cho ${alive[choice].name}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Tiên Tri ──
    if (state.players.some(p => p.role === 'Tiên Tri')) {
      await showSimplePrompt({ title: 'TIÊN TRI thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
      const seerIndex = state.players.findIndex(p => p.role === 'Tiên Tri' && p.isAlive)
      const currentState = stateRef.current
      if (seerIndex !== -1 && seerIndex !== intentDisabledPlayer && !currentState.isCursed) {
        const choice = await awaitPlayerChoice({ title: 'Soi ai?' })
        if (choice !== null) {
          const alive = currentState.players.filter(p => p.isAlive)
          const globalIdx = currentState.players.indexOf(alive[choice])
          const res = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          const resPlayer = currentState.players[res]
          const resSide = (resPlayer.role.includes('Sói') || resPlayer.isTransformed) ? 'SÓI' : 'DÂN'
          await showSimplePrompt({ title: 'Kết quả soi', subtitle: `Kết quả soi ${alive[choice].name}: ${resSide}`, primaryText: 'Tiếp tục' })
          log(`Tiên tri soi ${alive[choice].name} ra ${resSide}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Thợ Săn ──
    if (state.players.some(p => p.role === 'Thợ Săn')) {
      await showSimplePrompt({ title: 'THỢ SĂN thức dậy', body: 'Những người khác nhắm mắt.', primaryText: 'Tiếp tục' })
      const hunterIndex = state.players.findIndex(p => p.role === 'Thợ Săn' && p.isAlive)
      const currentState = stateRef.current
      if (hunterIndex !== -1 && hunterIndex !== intentDisabledPlayer && !currentState.isCursed) {
        const choice = await awaitPlayerChoice({ title: 'Ngắm bắn ai?' })
        if (choice !== null) {
          const alive = currentState.players.filter(p => p.isAlive)
          const globalIdx = currentState.players.indexOf(alive[choice])
          const res = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          setGameState(prev => {
            const players = [...prev.players.map(p => ({ ...p }))]
            players[hunterIndex].hunterTarget = res
            return { ...prev, players }
          })
          log(`Thợ săn ngắm ${alive[choice].name}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Xử lý kết quả đêm ──
    setGameState(prev => ({ ...prev, lastProtected: intentProtected }))
    const nightVictims: number[] = []

    setGameState(prev => {
      const players = [...prev.players.map(p => ({ ...p }))]
      const newLogs = [...prev.gameLogs]

      for (let i = 0; i < intentWolfBites.length; i++) {
        const v = intentWolfBites[i]
        if ((i === 0 && intentWitchSaved) || (v === intentProtected)) {
          newLogs.push(`-> ${players[v].name} thoát chết đêm nay nhờ Bảo vệ/Phù thủy.`)
          continue
        }
        if (players[v].role === '50/50' && v !== intentDisabledPlayer) {
          players[v].isTransformed = true
          players[v].side = 'Sói'
          newLogs.push(`-> ${players[v].name} bị cắn và hóa Sói (50/50)!`)
        } else {
          nightVictims.push(v)
        }
      }
      if (intentPoisoned !== null) nightVictims.push(intentPoisoned)

      const unique = [...new Set(nightVictims)]
      for (const idx of unique) {
        if (players[idx].isAlive) {
          players[idx].lives -= 1
          if (players[idx].lives <= 0) {
            players[idx].isAlive = false
            newLogs.push(`-> ${players[idx].name} (${players[idx].role}) ĐÃ CHẾT do Chết trong đêm.`)
            // Handle linked deaths
            if (players[idx].linkedWith !== null && players[players[idx].linkedWith!]?.isAlive) {
              const linked = players[players[idx].linkedWith!]
              linked.isAlive = false
              newLogs.push(`-> ${linked.name} (${linked.role}) ĐÃ CHẾT do Chết chùm (Cupid).`)
            }
            // Handle wolf cub
            if (players[idx].role === 'Sói Con') {
              return { ...prev, players, gameLogs: newLogs, extraKillNextNight: true }
            }
          } else {
            newLogs.push(`-> ${players[idx].name} bị tấn công nhưng vẫn còn mạng.`)
          }
        }
      }

      return { ...prev, players, gameLogs: newLogs }
    })

    // Wait for state to propagate
    await new Promise(r => setTimeout(r, 50))
    const updatedState = stateRef.current
    const deadNames = updatedState.players.filter((p, i) => !p.isAlive && intentWolfBites.includes(i) || (intentPoisoned !== null && i === intentPoisoned && !p.isAlive))
      .map(p => p.name)

    const allNightDead = updatedState.players.filter(p => !p.isAlive).map(p => p.name)
    const sunriseBody = nightVictims.length
      ? `Sáng nay làng phát hiện nạn nhân: ${[...new Set(nightVictims)].map(i => updatedState.players[i].name).join(', ')}`
      : 'Một đêm bình yên, không ai qua đời.'

    await showSimplePrompt({
      title: '☀️ TRỜI ĐÃ SÁNG',
      subtitle: 'Mời mọi người mở mắt!',
      body: sunriseBody,
      primaryText: 'Tiếp tục',
    })

    if (nightVictims.length) {
      log(`☀️ Sáng nay, làng phát hiện nạn nhân qua đời.`)
    } else {
      log('☀️ Một đêm bình yên, không ai qua đời.')
    }
  }

  const dayPhase = async () => {
    const currentState = stateRef.current
    log(`\n--- BAN NGÀY ---`)
    setGameState(prev => ({ ...prev, pendingDeathMessages: [] }))

    const alive = currentState.players.filter(p => p.isAlive)
    const choice = await awaitPlayerChoice({
      title: 'BAN NGÀY: Treo cổ ai?',
      allowSkip: true,
      infoText: `Người còn sống: ${alive.map(p => p.name).join(', ')}`,
    })

    if (choice !== null) {
      const aliveNow = stateRef.current.players.filter(p => p.isAlive)
      const chosenPlayer = aliveNow[choice]
      const globalIdx = stateRef.current.players.indexOf(chosenPlayer)
      log(`BAN NGÀY: Làng treo cổ ${chosenPlayer.name}`)
      kill(globalIdx, 'Treo cổ', true, false, true)
      await new Promise(r => setTimeout(r, 50))

      const msgs = stateRef.current.pendingDeathMessages
      if (msgs.length) {
        await showSimplePrompt({
          title: '💀 Kết quả treo cổ',
          body: msgs.join('<br/>'),
          primaryText: 'Tiếp tục',
        })
      }
    } else {
      log('BAN NGÀY: Bỏ qua treo cổ.')
    }

    // Handle pending hunter kill
    await new Promise(r => setTimeout(r, 50))
    const afterState = stateRef.current
    if (afterState.pendingHunterKill !== null) {
      const hk = afterState.pendingHunterKill
      setGameState(prev => ({ ...prev, pendingHunterKill: null }))
      kill(hk, 'Thợ Săn kéo', true, false, false)
      await new Promise(r => setTimeout(r, 50))
      const hunterMsgs = stateRef.current.pendingDeathMessages
      if (hunterMsgs.length) {
        await showSimplePrompt({ title: '🔫 Thợ Săn kéo theo!', body: hunterMsgs.join('<br/>'), primaryText: 'Tiếp tục' })
      }
    }
  }

  // ─── Render Modal ───
  const renderModal = () => {
    if (!modal) return null
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div className="w-full max-w-[720px] bg-gradient-to-b from-[#141930]/98 to-[#0a0e1a]/98 border border-red-900/20 rounded-2xl shadow-2xl p-6 animate-slideIn">
          <h2 className="text-xl font-bold text-amber-100 mb-2 font-[family-name:var(--font-be-vietnam)] tracking-wide">{modal.title}</h2>
          {modal.subtitle && <p className="text-white/50 text-sm mb-3">{modal.subtitle}</p>}

          {modal.mode === 'simple' && (
            <>
              {modal.body && <div className="text-white/80 text-sm leading-relaxed p-4 rounded-xl bg-white/5 border border-white/5 mb-4" dangerouslySetInnerHTML={{ __html: modal.body }} />}
              <button
                onClick={() => { setModal(null); modal.resolve() }}
                className="px-5 py-2.5 bg-gradient-to-r from-red-800 to-red-700 text-white font-bold text-sm rounded-xl hover:from-red-700 hover:to-red-600 transition-all"
              >
                {modal.primaryText || 'OK'}
              </button>
            </>
          )}

          {modal.mode === 'playerChoice' && (
            <>
              {modal.infoText && <p className="text-white/40 text-xs mb-3">{modal.infoText}</p>}
              <div className="flex flex-wrap gap-2.5 max-h-[360px] overflow-y-auto p-1 mb-4">
                {modal.players.map((p, i) => (
                  <button
                    key={i}
                    disabled={p.disabled}
                    onClick={() => { setModal(null); modal.resolve(i) }}
                    className="px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-blue-400/15 text-white/90 hover:border-blue-400/40 hover:from-blue-900/30 hover:to-purple-800/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                  >
                    {p.name}
                  </button>
                ))}
                {modal.allowSkip && (
                  <button
                    onClick={() => { setModal(null); modal.resolve(null) }}
                    className="px-5 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-dashed border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70 transition-all"
                  >
                    Bỏ qua
                  </button>
                )}
              </div>
            </>
          )}

          {modal.mode === 'confirm' && (
            <>
              {modal.infoText && <p className="text-white/60 text-sm mb-4 p-3 rounded-xl bg-white/5 border border-white/5">{modal.infoText}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setModal(null); modal.resolve(true) }}
                  className="px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-blue-400/15 text-white/90 hover:border-blue-400/40 transition-all"
                >
                  Có
                </button>
                <button
                  onClick={() => { setModal(null); modal.resolve(false) }}
                  className="px-5 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-dashed border-white/15 text-white/50 hover:bg-white/10 transition-all"
                >
                  Không
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 relative ${beVietnam.variable}`}>
      {/* Werewolf-specific background */}
      <div className="fixed inset-0 z-[-1]">
        <img src="/werewolf-background.jpg" alt="" className="w-full h-full object-cover blur-sm" />
        <div className="absolute inset-0 bg-black/80 dark:bg-black/90 transition-colors duration-500"></div>
      </div>

      <main className="max-w-[1360px] mx-auto">
        {/* Back link */}
        <Link href="/side-projects" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Side Projects
        </Link>

        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-8 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-be-vietnam)] tracking-wide bg-gradient-to-r from-amber-200 via-amber-100 to-red-300 bg-clip-text text-transparent mb-1">🐺 Ma Sói — Werewolf</h1>
          <p className="text-white/40 text-sm">Browser-based host tool — private role reveals, button selection, full night/day automation</p>
          <div className="mt-2 text-[11px] text-white/20 tracking-[4px]">🌕 🌲 🐺 🔮 🏹 💀 🌲 🌕</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-5">
          {/* Setup Card */}
          {gameState.phase === 'setup' && (
            <div className="glass-card rounded-2xl overflow-hidden lg:col-span-2">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-bold font-[family-name:var(--font-be-vietnam)] uppercase tracking-widest text-amber-100">Thiết lập</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Tổng số người chơi</label>
                    <input type="number" min="2" placeholder="Ví dụ: 10" value={numPlayers} onChange={e => setNumPlayers(e.target.value)} className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Chuỗi vai trò (VN hoặc EN)</label>
                    <input type="text" placeholder="Ví dụ: 1 Soi, 1 Witch, 1 Mirror" value={rolesInput} onChange={e => setRolesInput(e.target.value)} className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Tên người chơi, mỗi dòng một tên</label>
                  <textarea placeholder={'PLAYER 1\nPLAYER 2\nPLAYER 3'} value={namesInput} onChange={e => setNamesInput(e.target.value)} className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm min-h-[100px] resize-y focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10 outline-none transition-all" />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={startGame} className="px-5 py-2.5 bg-gradient-to-r from-red-800 to-red-700 text-white font-bold text-sm rounded-xl hover:from-red-700 hover:to-red-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/30 transition-all">
                    Bắt đầu trò chơi
                  </button>
                  <button onClick={fillDemo} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/70 font-semibold text-sm rounded-xl hover:bg-white/10 transition-all">
                    Điền ví dụ
                  </button>
                  <button onClick={resetGame} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/70 font-semibold text-sm rounded-xl hover:bg-white/10 transition-all">
                    Làm lại
                  </button>
                </div>
                <p className="text-xs text-white/30 leading-relaxed">
                  Hỗ trợ tên vai trò tiếng Việt và tiếng Anh: Ma Sói / Soi / Wolf / Werewolf, Sói Con / Wolf Cub, Tiên Tri / Seer, Bảo Vệ / Bodyguard, Phù Thủy / Witch, Thợ Săn / Hunter, Già Làng / Elder, Cupid, 50/50, Dân Làng / Villager / Dan, Bitch, Gương / Mirror.
                </p>
              </div>
            </div>
          )}

          {/* Status Card */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-sm font-bold font-[family-name:var(--font-be-vietnam)] uppercase tracking-widest text-amber-100">Trạng thái game</h2>
            </div>
            <div className="p-5">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/15 to-red-900/5 border border-blue-400/10 mb-4">
                <div className="font-semibold text-white text-sm">
                  {gameState.phase === 'setup' && 'Chưa bắt đầu.'}
                  {gameState.phase === 'reveal' && 'Đang xem vai...'}
                  {gameState.phase === 'playing' && `🌙 Đêm ${gameState.nightCount}`}
                  {gameState.phase === 'ended' && 'Game kết thúc.'}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {gameState.phase === 'setup' && 'Nhập số người chơi, danh sách tên, và vai trò rồi bấm Bắt đầu.'}
                  {gameState.phase === 'ended' && 'Bạn có thể bấm Làm lại để chơi ván mới.'}
                </div>
              </div>
              {gameState.phase === 'ended' && (
                <button onClick={resetGame} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/70 font-semibold text-sm rounded-xl hover:bg-white/10 transition-all">
                  Làm lại
                </button>
              )}
            </div>
          </div>

          {/* Log Card */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-sm font-bold font-[family-name:var(--font-be-vietnam)] uppercase tracking-widest text-amber-100">Nhật ký</h2>
            </div>
            <div className="p-5">
              <div ref={logBoxRef} className="bg-black/40 border border-white/5 rounded-xl p-4 min-h-[200px] max-h-[500px] overflow-auto whitespace-pre-wrap font-mono text-xs text-white/60 leading-relaxed">
                {gameState.gameLogs.join('\n') || 'Chưa có nhật ký...'}
              </div>
            </div>
          </div>

          {/* Players Card */}
          {gameState.players.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden lg:col-span-2">
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-bold font-[family-name:var(--font-be-vietnam)] uppercase tracking-widest text-amber-100">Người chơi</h2>
              </div>
              <div className="p-5">
                <div className="grid gap-2 max-h-[60vh] overflow-auto pr-1">
                  {gameState.players.map((p, i) => {
                    let roleName = p.role
                    if (p.role === '50/50' && p.isAlive) roleName = `50/50 (${p.isTransformed ? 'Sói' : 'Dân Làng'})`
                    if (p.linkedWith !== null) roleName += ' (Cặp đôi)'
                    if (p.markedByMirror) roleName += ' (Đã bị gương soi)'
                    return (
                      <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${p.isAlive ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-red-900/5 border-red-900/10 opacity-40'}`}>
                        <div>
                          <div className="font-semibold text-white text-sm">{p.name}</div>
                          <div className="text-white/40 text-xs mt-0.5">Vai: {roleName} · {p.isAlive ? 'SỐNG' : 'ĐÃ CHẾT'}</div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${p.side === 'Sói' ? 'bg-red-900/20 text-red-400 border-red-500/20' : p.side === 'Gương' ? 'bg-purple-900/20 text-purple-400 border-purple-500/20' : 'bg-green-900/20 text-green-400 border-green-500/20'}`}>
                          {p.side}
                        </span>
                        {!p.isAlive && <span className="text-lg">💀</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {renderModal()}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateY(20px) scale(0.97); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
        .animate-fadeIn { animation: fadeIn 0.2s ease }
        .animate-slideIn { animation: slideIn 0.25s ease }
      `}</style>
    </div>
  )
}
