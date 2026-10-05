'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Be_Vietnam_Pro } from 'next/font/google'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { createRolePool, getBearAnnouncement, getLivingNeighbors, getLivingSeatGroup, isWolfSide, roleOptions } from '@/lib/werewolf-rules'

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
  foxCanScan: boolean
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
  bearLastAnnouncement: 'CÓ' | 'KHÔNG' | null
  bearReverseAnnouncementToday: boolean
  gameLogs: string[]
  running: boolean
  phase: 'setup' | 'reveal' | 'playing' | 'ended'
  pendingDeathMessages: string[]
}

interface NightSummary {
  night: number
  actions: string[]
  players: Player[]
  witchHeal: boolean
  witchPoison: boolean
  isCursed: boolean
  extraKillNextNight: boolean
  bearLastAnnouncement: 'CÓ' | 'KHÔNG' | null
  bearReverseAnnouncementToday: boolean
}

type ModalConfig = {
  title: string
  subtitle?: string
  body?: ReactNode
  primaryText?: string
  public?: boolean
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
} | {
  title: string
  mode: 'nightReview'
  summary: NightSummary
  resolve: () => void
}

function PromptLines({ lines }: { lines: string[] }) {
  return <>{lines.map((line, index) => <p key={index} className="mb-2 last:mb-0">{line}</p>)}</>
}

// ─── Component ───
export default function WerewolfGame() {
  const [numPlayers, setNumPlayers] = useState('')
  const [namesInput, setNamesInput] = useState('')
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})
  const seatNames = namesInput.split('\n')
  const selectedRoleCount = Object.values(roleCounts).reduce((total, count) => total + count, 0)
  const updateSeat = (index: number, name: string) => {
    const names = [...seatNames]
    names[index] = name
    setNamesInput(names.join('\n'))
  }
  const moveSeat = (index: number, direction: number) => {
    const names = [...seatNames]
    const next = index + direction
    if (next < 0 || next >= names.length) return
    ;[names[index], names[next]] = [names[next], names[index]]
    setNamesInput(names.join('\n'))
  }
  const [gameState, setRenderedGameState] = useState<GameState>({
    players: [],
    nightCount: 0,
    witchHeal: true,
    witchPoison: true,
    extraKillNextNight: false,
    isCursed: false,
    pendingHunterKill: null,
    lastProtected: null,
    bearLastAnnouncement: null,
    bearReverseAnnouncementToday: false,
    gameLogs: [],
    running: false,
    phase: 'setup',
    pendingDeathMessages: [],
  })
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const [nightSummaries, setNightSummaries] = useState<NightSummary[]>([])
  const logBoxRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(gameState)
  const publicView = modal?.mode === 'simple' && modal.public

  const setGameState = useCallback((update: GameState | ((previous: GameState) => GameState)) => {
    const next = typeof update === 'function' ? update(stateRef.current) : update
    stateRef.current = next
    setRenderedGameState(next)
  }, [])

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
    }
  }, [gameState.gameLogs])

  const log = useCallback((message: string) => {
    setGameState(prev => ({ ...prev, gameLogs: [...prev.gameLogs, message] }))
  }, [setGameState])

  const showSimplePrompt = useCallback(({ title, subtitle = '', body = '', primaryText = 'OK', public: isPublic = false }: { title: string; subtitle?: string; body?: ReactNode; primaryText?: string; public?: boolean }): Promise<void> => {
    return new Promise((resolve) => {
      setModal({ title, subtitle, body, primaryText, public: isPublic, mode: 'simple', resolve })
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

  const reflect = (targetGlobalIdx: number, mirrorIndex: number, mirrorTargetGlobalIdx: number | null): number => {
    if (targetGlobalIdx === mirrorIndex && mirrorTargetGlobalIdx !== null) {
      log(`Gương phản chiếu mục tiêu: ${stateRef.current.players[targetGlobalIdx].name} → ${stateRef.current.players[mirrorTargetGlobalIdx].name}`)
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
  }, [setGameState])

  const fillDemo = () => {
    setNumPlayers('8')
    setNamesInput('An\nThompson\nVinh\nQnhi\nTu\nMnhi\nDuy\nNam')
    setRoleCounts({ 'Ma Sói': 2, 'Phù Thủy': 1, 'Fox/Cao': 1, 'Gau/Bear': 1, 'Bảo Vệ': 1, 'Thợ Săn': 1, '50/50': 1 })
  }

  const resetGame = () => {
    setNightSummaries([])
    setGameState({
      players: [],
      nightCount: 0,
      witchHeal: true,
      witchPoison: true,
      extraKillNextNight: false,
      isCursed: false,
      pendingHunterKill: null,
      lastProtected: null,
      bearLastAnnouncement: null,
      bearReverseAnnouncementToday: false,
      gameLogs: [],
      running: false,
      phase: 'setup',
      pendingDeathMessages: [],
    })
    setModal(null)
  }

  const startGame = async () => {
    const num = Number(numPlayers)
    if (!Number.isInteger(num) || num < 2 || num > 60) {
      await showSimplePrompt({ title: 'Lỗi nhập liệu', body: 'Nhập tổng số người chơi hợp lệ (2–60).', primaryText: 'OK' })
      return
    }

    const names = namesInput.trim().split('\n').map(name => name.trim())
    if (names.length !== num || names.some(name => !name) || new Set(names.map(name => name.toLocaleLowerCase('vi'))).size !== num) {
      await showSimplePrompt({ title: 'Lỗi danh sách', body: 'Cần đủ tên theo thứ tự ghế, không để trống hoặc trùng tên.' })
      return
    }

    let rolePool: string[]
    try {
      rolePool = createRolePool(roleCounts, num)
    } catch (error) {
      await showSimplePrompt({ title: 'Lỗi vai trò', body: error instanceof Error ? error.message : 'Vai trò không hợp lệ.' })
      return
    }
    for (let index = rolePool.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[rolePool[index], rolePool[randomIndex]] = [rolePool[randomIndex], rolePool[index]]
    }
    const players: Player[] = Array.from({ length: num }, (_, i) => {
      const role = rolePool[i]
      const side = role.includes('Sói') ? 'Sói' : (role === 'Gương' ? 'Gương' : 'Dân')
      return {
        name: names[i],
        role,
        side,
        isAlive: true,
        lives: role === 'Già Làng' ? 2 : 1,
        linkedWith: null,
        hunterTarget: null,
        isTransformed: false,
        markedByMirror: false,
        foxCanScan: true,
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
      bearLastAnnouncement: null,
      bearReverseAnnouncementToday: false,
      gameLogs: ['--- SETUP GAME ---', `Tổng số người chơi: ${num}`, 'Vai trò đã được phân bổ.'],
      running: true,
      phase: 'reveal',
      pendingDeathMessages: [],
    }))
    setNightSummaries([])

    // Role reveal
    for (const p of players) {
      await showSimplePrompt({
        title: `🔔 Mời ${p.name} xem vai`,
        subtitle: 'Những người khác vui lòng nhắm mắt.',
        body: <><strong>Vai của bạn là:</strong> <span className="text-amber-400 text-xl">{p.role.toUpperCase()}</span></>,
        primaryText: 'Tôi đã xem',
      })
    }

    // Start game loop
    setGameState(prev => ({ ...prev, phase: 'playing' }))
    await gameLoop()
  }

  const gameLoop = async () => {
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
    const mirrors = alives.filter(p => p.role === 'Gương')

    // Detect mixed Cupid couple (one villager-side, one werewolf-side).
    // Mixed couple is treated as an independent faction.
    let mixedCouple: { p1: Player; p2: Player } | null = null
    const processed = new Set<number>()
    for (const p of alives) {
      const pIdx = st.players.indexOf(p)
      if (p.linkedWith === null || processed.has(pIdx)) continue
      const partner = st.players[p.linkedWith]
      if (!partner || !partner.isAlive) continue
      const pIsWolf = p.side === 'Sói' || p.isTransformed
      const partnerIsWolf = partner.side === 'Sói' || partner.isTransformed
      if (pIsWolf !== partnerIsWolf) mixedCouple = { p1: p, p2: partner }
      processed.add(pIdx)
      processed.add(p.linkedWith)
    }

    let victoryMsg: string | null = null

    // 1) Mirror check first (highest priority independent faction).
    if (mirrors.length) {
      const mirror = mirrors[0]
      const others = alives.filter(p => p !== mirror)
      if (others.length > 0 && others.every(p => p.markedByMirror)) {
        victoryMsg = `🪞 GƯƠNG (${mirror.name}) CHIẾN THẮNG TUYỆT ĐỐI! Tất cả người chơi đã bị soi.`
      } else {
        const phaseName = mixedCouple ? '4 phe (Gương, Cặp đôi, Sói, Dân)' : '3 phe (Gương, Sói, Dân)'
        log(`[TRÒ CHƠI TIẾP TIẾP] Gương còn sống. Cuộc chơi tiếp tục với ${phaseName}`)
        return false
      }
    }

    // 2) Mixed-couple check (independent faction) when Mirror is not alive.
    if (!victoryMsg && mixedCouple) {
      const othersInGame = alives.filter(p => p !== mixedCouple!.p1 && p !== mixedCouple!.p2)
      if (othersInGame.length === 0) {
        victoryMsg = `❤️ CẶP ĐÔI (${mixedCouple.p1.name} & ${mixedCouple.p2.name}) CHIẾN THẮNG! Chỉ còn mình họ!`
      } else {
        const otherWolves = alives.filter(p => (p.side === 'Sói' || p.isTransformed) && p !== mixedCouple!.p1 && p !== mixedCouple!.p2)
        const otherVillagers = alives.filter(p => p.side === 'Dân' && !p.isTransformed && p !== mixedCouple!.p1 && p !== mixedCouple!.p2)
        log(`[TRÒ CHƠI TIẾP TIẾP] Cặp đôi (${mixedCouple.p1.name} & ${mixedCouple.p2.name}) còn sống. Cuộc chơi tiếp tục với 3 phe: Cặp đôi, Sói (${otherWolves.length}), Dân (${otherVillagers.length})`)
        return false
      }
    }

    // 3) Regular villager-vs-werewolf resolution.
    if (!victoryMsg) {
      const wolves = alives.filter(p => p.side === 'Sói' || p.isTransformed)
      const villagers = alives.filter(p => p.side === 'Dân' && !p.isTransformed)

      const hasAliveWitchWithPoison = !st.isCursed && st.witchPoison && alives.some(p => p.role === 'Phù Thủy')
      const hasAliveHunterShotPotential = !st.isCursed && alives.some(p => p.role === 'Thợ Săn')
      const hasPendingHunterShot = st.pendingHunterKill !== null && !!st.players[st.pendingHunterKill]?.isAlive
      const villagersHaveComebackPotential = hasAliveWitchWithPoison || hasAliveHunterShotPotential || hasPendingHunterShot

      // Wolves only auto-win at parity/majority when villagers have no lethal comeback path left.
      if (wolves.length > 0 && wolves.length >= villagers.length && !villagersHaveComebackPotential) {
        victoryMsg = `🐺 PHE MA SÓI CHIẾN THẮNG! Sói đã đạt được đa số (${wolves.length} Sói vs ${villagers.length} Dân).`
      } else if (wolves.length === 0 && villagers.length > 0) {
        victoryMsg = '🏆 PHE DÂN LÀNG CHIẾN THẮNG! Tất cả ma sói đã bị tiêu diệt.'
      }
    }

    if (victoryMsg) {
      setGameState(prev => ({ ...prev, running: false, phase: 'ended', gameLogs: [...prev.gameLogs, `\n${victoryMsg}`] }))
      showSimplePrompt({ title: 'KẾT THÚC TRẬN ĐẤU', body: victoryMsg, primaryText: 'Xem tổng kết', public: true })
      return true
    }
    return false
  }

  const nightPhase = async () => {
    const st = stateRef.current
    const nightLogStart = st.gameLogs.length
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
    const getRoleDeadNames = (predicate: (p: Player) => boolean) => {
      return state.players.filter(p => predicate(p) && !p.isAlive).map(p => p.name)
    }

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
      const mirrorDead = getRoleDeadNames(p => p.role === 'Gương')
      const mirrorWakeNotes: string[] = ['Những người khác nhắm mắt. Bấm OK để Gương mở mắt.']
      if (mirrorDead.length) {
        mirrorWakeNotes.push(`HOST NOTE: Gương đã chết (${mirrorDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      await showSimplePrompt({ title: 'GƯƠNG thức dậy', body: <PromptLines lines={mirrorWakeNotes} />, primaryText: 'Tiếp tục' })
      if (mirrorIndex !== -1) {
        const alive = state.players.filter(p => p.isAlive)
        const mirrorAliveIdx = alive.findIndex(p => p === state.players[mirrorIndex])
        const alreadyMarked = alive.filter(p => p.markedByMirror).map(p => p.name).join(', ')
        const choice = await awaitPlayerChoice({
          title: 'Chào Gương, chọn người phản chiếu:',
          subtitle: alreadyMarked ? `Những người đã bị soi: ${alreadyMarked}` : 'Bạn chưa soi ai cả',
          disabledIndices: [mirrorAliveIdx],
        })
        if (choice !== null) {
          mirrorTargetIndex = state.players.indexOf(alive[choice])
          setGameState(prev => {
            const players = [...prev.players.map(p => ({ ...p }))]
            players[mirrorTargetIndex!].markedByMirror = true
            return { ...prev, players }
          })
          const markedCount = stateRef.current.players.filter(p => p.markedByMirror).length
          const totalAlive = stateRef.current.players.filter(p => p.isAlive).length
          log(`Gương soi ${alive[choice].name} (${markedCount}/${totalAlive} người đã bị soi)`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Bitch ──
    if (state.players.some(p => p.role === 'Bitch')) {
      const bitchDead = getRoleDeadNames(p => p.role === 'Bitch')
      const bitchWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (bitchDead.length) {
        bitchWakeNotes.push(`HOST NOTE: Bitch đã chết (${bitchDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      await showSimplePrompt({ title: 'BITCH thức dậy', body: <PromptLines lines={bitchWakeNotes} />, primaryText: 'Tiếp tục' })
      const bitchIndex = state.players.findIndex(p => p.role === 'Bitch' && p.isAlive)
      if (bitchIndex !== -1) {
        const choice = await awaitPlayerChoice({ title: 'Ngủ với ai?', allowSkip: true, infoText: hasMirror ? 'Nếu có Gương, mục tiêu có thể bị phản chiếu.' : '' })
        if (choice !== null) {
          const alive = state.players.filter(p => p.isAlive)
          const globalIdx = state.players.indexOf(alive[choice])
          intentDisabledPlayer = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          log(`Bitch chọn ${alive[choice].name}; mục tiêu thực tế: ${stateRef.current.players[intentDisabledPlayer].name}`)
        } else {
          log('Bitch bỏ qua hành động.')
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Cupid (đêm đầu) ──
    if (state.players.some(p => p.role === 'Cupid') && nightNum === 1) {
      const cupidDead = getRoleDeadNames(p => p.role === 'Cupid')
      const cupidWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (cupidDead.length) {
        cupidWakeNotes.push(`HOST NOTE: Cupid đã chết (${cupidDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      await showSimplePrompt({ title: 'CUPID thức dậy', body: <PromptLines lines={cupidWakeNotes} />, primaryText: 'Tiếp tục' })
      const cupidIndex = state.players.findIndex(p => p.role === 'Cupid' && p.isAlive)
      if (cupidIndex !== -1 && cupidIndex === intentDisabledPlayer) {
        await showSimplePrompt({
          title: 'Cupid bị khóa kỹ năng',
          body: `⚠️ ${state.players[cupidIndex].name} đã bị Bitch chọn tối nay nên KHÔNG được nối cặp.`,
          primaryText: 'Tiếp tục',
        })
      }
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
            log(`Cupid chọn ${alive[firstChoice].name} và ${alive[secondChoice].name}; nối thực tế: ${stateRef.current.players[p1Final].name} và ${stateRef.current.players[p2Final].name}`)
          }
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Ma Sói ──
    const wolfRoster = state.players.filter(p => p.role.includes('Sói') || p.isTransformed)
    const deadWolves = wolfRoster.filter(p => !p.isAlive).map(p => p.name)
    const disabledWolf = intentDisabledPlayer !== null
      ? state.players[intentDisabledPlayer]
      : null
    const isDisabledWolf = !!disabledWolf && disabledWolf.isAlive && (disabledWolf.role.includes('Sói') || disabledWolf.isTransformed)
    const wolfWakeNotes: string[] = ['Những người khác nhắm mắt.']
    if (deadWolves.length) {
      wolfWakeNotes.push(`HOST NOTE: Sói đã chết: ${deadWolves.join(', ')}. Vẫn gọi vai để giữ bí mật.`)
    }
    if (isDisabledWolf && disabledWolf) {
      wolfWakeNotes.push(`⚠️ ${disabledWolf.name} bị Bitch chọn tối nay nên KHÔNG được tham gia cắn.`)
    }
    await showSimplePrompt({ title: 'MA SÓI thức dậy', body: <PromptLines lines={wolfWakeNotes} />, primaryText: 'Tiếp tục' })
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
          log(`Sói chọn cắn ${alive[choice].name}; mục tiêu thực tế: ${stateRef.current.players[res].name}`)
          if (i === 0) firstBiteAliveIdx = choice
        }
      }
    } else {
      log('Sói không cắn: không còn Sói sống có thể hành động.')
      await showSimplePrompt({
        title: 'Không có Sói hành động',
        body: 'Đêm nay không có Sói nào có thể cắn (đã chết hoặc bị khóa kỹ năng).',
        primaryText: 'Tiếp tục',
      })
    }
    await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })

    // ── Phù Thủy ──
    if (state.players.some(p => p.role === 'Phù Thủy')) {
      const witchIndex = state.players.findIndex(p => p.role === 'Phù Thủy' && p.isAlive)
      const currentState = stateRef.current
      const witchDead = getRoleDeadNames(p => p.role === 'Phù Thủy')
      const witchWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (witchDead.length) {
        witchWakeNotes.push(`HOST NOTE: Phù Thủy đã chết (${witchDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      if (witchIndex !== -1 && witchIndex === intentDisabledPlayer) {
        witchWakeNotes.push(`⚠️ ${state.players[witchIndex].name} bị Bitch chọn tối nay nên KHÔNG được dùng kỹ năng.`)
      }
      if (witchIndex !== -1 && currentState.isCursed) {
        witchWakeNotes.push(`⚠️ Già Làng đã nguyền: ${state.players[witchIndex].name} KHÔNG được dùng kỹ năng đêm nay.`)
      }
      await showSimplePrompt({ title: 'PHÙ THỦY thức dậy', body: <PromptLines lines={witchWakeNotes} />, primaryText: 'Tiếp tục' })
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
            } else {
              log(`Phù thủy không cứu ${victim.name}.`)
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
            log(`Phù thủy chọn độc ${alive[choice].name}; mục tiêu thực tế: ${stateRef.current.players[intentPoisoned].name}`)
          } else {
            log('Phù thủy không dùng bình độc.')
          }
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Bảo Vệ ──
    if (state.players.some(p => p.role === 'Bảo Vệ')) {
      const bodyguardIndex = state.players.findIndex(p => p.role === 'Bảo Vệ' && p.isAlive)
      const currentState = stateRef.current
      const bodyguardDead = getRoleDeadNames(p => p.role === 'Bảo Vệ')
      const bodyguardWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (bodyguardDead.length) {
        bodyguardWakeNotes.push(`HOST NOTE: Bảo Vệ đã chết (${bodyguardDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      if (bodyguardIndex !== -1 && bodyguardIndex === intentDisabledPlayer) {
        bodyguardWakeNotes.push(`⚠️ ${state.players[bodyguardIndex].name} bị Bitch chọn tối nay nên KHÔNG được bảo vệ ai.`)
      }
      if (bodyguardIndex !== -1 && currentState.isCursed) {
        bodyguardWakeNotes.push(`⚠️ Già Làng đã nguyền: ${state.players[bodyguardIndex].name} KHÔNG được dùng kỹ năng đêm nay.`)
      }
      await showSimplePrompt({ title: 'BẢO VỆ thức dậy', body: <PromptLines lines={bodyguardWakeNotes} />, primaryText: 'Tiếp tục' })
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
          log(`Bảo vệ chọn ${alive[choice].name}; bảo vệ thực tế: ${stateRef.current.players[res].name}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Tiên Tri ──
    if (state.players.some(p => p.role === 'Tiên Tri')) {
      const seerIndex = state.players.findIndex(p => p.role === 'Tiên Tri' && p.isAlive)
      const currentState = stateRef.current
      const seerDead = getRoleDeadNames(p => p.role === 'Tiên Tri')
      const seerWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (seerDead.length) {
        seerWakeNotes.push(`HOST NOTE: Tiên Tri đã chết (${seerDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      if (seerIndex !== -1 && seerIndex === intentDisabledPlayer) {
        seerWakeNotes.push(`⚠️ ${state.players[seerIndex].name} bị Bitch chọn tối nay nên KHÔNG được soi.`)
      }
      if (seerIndex !== -1 && currentState.isCursed) {
        seerWakeNotes.push(`⚠️ Già Làng đã nguyền: ${state.players[seerIndex].name} KHÔNG được dùng kỹ năng đêm nay.`)
      }
      await showSimplePrompt({ title: 'TIÊN TRI thức dậy', body: <PromptLines lines={seerWakeNotes} />, primaryText: 'Tiếp tục' })
      if (seerIndex !== -1 && seerIndex !== intentDisabledPlayer && !currentState.isCursed) {
        const choice = await awaitPlayerChoice({ title: 'Soi ai?' })
        if (choice !== null) {
          const alive = currentState.players.filter(p => p.isAlive)
          const globalIdx = currentState.players.indexOf(alive[choice])
          const res = reflect(globalIdx, mirrorIndex, mirrorTargetIndex)
          const resPlayer = currentState.players[res]
          const resSide = (resPlayer.role.includes('Sói') || resPlayer.isTransformed) ? 'SÓI' : 'DÂN'
          await showSimplePrompt({ title: 'Kết quả soi', subtitle: `Kết quả soi ${alive[choice].name}: ${resSide}`, primaryText: 'Tiếp tục' })
          log(`Tiên tri chọn ${alive[choice].name}; soi thực tế ${resPlayer.name}: ${resSide}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Fox/Cao ──
    if (state.players.some(p => p.role === 'Fox/Cao')) {
      const currentState = stateRef.current
      const foxDead = getRoleDeadNames(p => p.role === 'Fox/Cao')
      const foxWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (foxDead.length) {
        foxWakeNotes.push(`HOST NOTE: Fox/Cao đã chết (${foxDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }

      const aliveFoxes = currentState.players
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.role === 'Fox/Cao' && p.isAlive)

      const disabledFoxesByBitch = aliveFoxes
        .filter(({ i }) => i === intentDisabledPlayer)
        .map(({ p }) => p.name)
      if (disabledFoxesByBitch.length) {
        foxWakeNotes.push(`⚠️ ${disabledFoxesByBitch.join(', ')} bị Bitch chọn tối nay nên KHÔNG được soi nhóm 3 người.`)
      }

      if (currentState.isCursed && aliveFoxes.length) {
        foxWakeNotes.push('⚠️ Già Làng đã nguyền: Fox/Cao KHÔNG được dùng kỹ năng đêm nay.')
      }

      const lockedFoxes = aliveFoxes.filter(({ p }) => !p.foxCanScan).map(({ p }) => p.name)
      if (lockedFoxes.length) {
        foxWakeNotes.push(`⚠️ ${lockedFoxes.join(', ')} đã nhận kết quả KHÔNG trước đó nên không thể soi tiếp ở các đêm sau.`)
      }

      await showSimplePrompt({ title: 'FOX/CAO thức dậy', body: <PromptLines lines={foxWakeNotes} />, primaryText: 'Tiếp tục' })

      if (!currentState.isCursed) {
        for (const fox of aliveFoxes) {
          const foxPlayer = currentState.players[fox.i]
          if (fox.i === intentDisabledPlayer) continue
          if (!foxPlayer.foxCanScan) continue

          await showSimplePrompt({ title: `Mời ${foxPlayer.name}`, body: 'Chọn 1 người để soi nhóm 3 người gồm trái - giữa - phải theo vị trí ngồi.', primaryText: 'Tiếp tục' })

          const aliveNow = stateRef.current.players.filter(p => p.isAlive)
          const foxAliveIdx = aliveNow.findIndex(p => p === stateRef.current.players[fox.i])
          const choice = await awaitPlayerChoice({
            title: 'Fox/Cao soi ai?',
            subtitle: 'Kết quả: CÓ nếu trong nhóm 3 người theo vị trí ngồi có ít nhất 1 phe Sói; KHÔNG nếu cả 3 đều không thuộc phe Sói.',
            disabledIndices: foxAliveIdx !== -1 ? [foxAliveIdx] : [],
          })

          if (choice !== null) {
            const aliveAfterChoice = stateRef.current.players.filter(p => p.isAlive)
            const selectedGlobalIdx = stateRef.current.players.indexOf(aliveAfterChoice[choice])
            const resolvedTarget = reflect(selectedGlobalIdx, mirrorIndex, mirrorTargetIndex)
            const group = getLivingSeatGroup(stateRef.current.players, resolvedTarget).map(idx => stateRef.current.players[idx])
            const hasWerewolfSide = group.some(isWolfSide)

            if (!hasWerewolfSide) {
              setGameState(prev => {
                const players = [...prev.players.map(p => ({ ...p }))]
                players[fox.i].foxCanScan = false
                return { ...prev, players }
              })
            }

            const answer = hasWerewolfSide ? 'CÓ' : 'KHÔNG'
            await showSimplePrompt({
              title: `Kết quả cho ${foxPlayer.name}`,
              subtitle: `Soi ${aliveAfterChoice[choice].name}: ${answer}`,
              body: hasWerewolfSide
                ? 'Nhóm 3 người theo vị trí ngồi có ít nhất 1 người thuộc phe Sói. Đêm sau bạn vẫn được soi.'
                : 'Nhóm 3 người theo vị trí ngồi đều không thuộc phe Sói. Từ đêm sau bạn không được soi nữa.',
              primaryText: 'Tiếp tục',
            })

            log(`Fox/Cao ${foxPlayer.name} chọn ${aliveAfterChoice[choice].name}; tâm thực tế: ${stateRef.current.players[resolvedTarget].name}; nhóm sống: ${group.map(player => player.name).join(' — ')} → ${answer}${hasWerewolfSide ? '' : '; mất kỹ năng soi từ đêm sau'}`)
          }
        }
      }

      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Thợ Săn ──
    if (state.players.some(p => p.role === 'Thợ Săn')) {
      const hunterIndex = state.players.findIndex(p => p.role === 'Thợ Săn' && p.isAlive)
      const currentState = stateRef.current
      const hunterDead = getRoleDeadNames(p => p.role === 'Thợ Săn')
      const hunterWakeNotes: string[] = ['Những người khác nhắm mắt.']
      if (hunterDead.length) {
        hunterWakeNotes.push(`HOST NOTE: Thợ Săn đã chết (${hunterDead.join(', ')}). Vẫn gọi vai để giữ bí mật.`)
      }
      if (hunterIndex !== -1 && hunterIndex === intentDisabledPlayer) {
        hunterWakeNotes.push(`⚠️ ${state.players[hunterIndex].name} bị Bitch chọn tối nay nên KHÔNG được ngắm bắn.`)
      }
      if (hunterIndex !== -1 && currentState.isCursed) {
        hunterWakeNotes.push(`⚠️ Già Làng đã nguyền: ${state.players[hunterIndex].name} KHÔNG được dùng kỹ năng đêm nay.`)
      }
      await showSimplePrompt({ title: 'THỢ SĂN thức dậy', body: <PromptLines lines={hunterWakeNotes} />, primaryText: 'Tiếp tục' })
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
          log(`Thợ săn chọn ${alive[choice].name}; ngắm thực tế: ${stateRef.current.players[res].name}`)
        }
      }
      await showSimplePrompt({ title: 'Xong', body: 'Hãy nhắm mắt lại.', primaryText: 'Tiếp tục' })
    }

    // ── Xử lý kết quả đêm ──
    const bearIndex = state.players.findIndex(p => p.role === 'Gau/Bear')
    const bearWasDisabledTonight = bearIndex !== -1 && intentDisabledPlayer === bearIndex
    for (const role of roleOptions) {
      for (const player of state.players.filter(player => player.role === role.name)) {
        const playerIndex = state.players.indexOf(player)
        if (!player.isAlive) {
          log(`${player.name} (${role.name}): đã chết, không hành động.`)
        } else if (role.name === 'Cupid' && nightNum !== 1) {
          log(`${player.name} (Cupid): chỉ nối cặp ở đêm đầu.`)
        } else if (role.name === 'Fox/Cao' && !player.foxCanScan) {
          log(`${player.name} (Fox/Cao): đã mất kỹ năng soi.`)
        } else if (playerIndex === intentDisabledPlayer && !['Gương', 'Gau/Bear', 'Già Làng', 'Dân Làng'].includes(role.name)) {
          log(`${player.name} (${role.name}): bị Bitch khóa kỹ năng đêm này.`)
        } else if (state.isCursed && ['Phù Thủy', 'Bảo Vệ', 'Tiên Tri', 'Fox/Cao', 'Thợ Săn'].includes(role.name)) {
          log(`${player.name} (${role.name}): mất kỹ năng do nguyền Già Làng.`)
        } else if (role.name === 'Gau/Bear') {
          log(`${player.name} (Gau/Bear): tín hiệu công bố sau bình minh${bearWasDisabledTonight ? ', bị Bitch đảo hôm nay' : ''}.`)
        } else if (['Dân Làng', 'Già Làng', '50/50'].includes(role.name) && !player.isTransformed) {
          log(`${player.name} (${role.name}): không có lựa chọn chủ động ban đêm.`)
        }
      }
    }
    setGameState(prev => ({
      ...prev,
      lastProtected: intentProtected,
      bearReverseAnnouncementToday: bearWasDisabledTonight,
    }))
    const aliveBeforeNight = new Set(state.players.map((p, i) => (p.isAlive ? i : -1)).filter(i => i !== -1))
    const nightVictims: number[] = []

    setGameState(prev => {
      const players = [...prev.players.map(p => ({ ...p }))]
      const newLogs = [...prev.gameLogs]
      let newExtraKill = prev.extraKillNextNight

      const killNow = (idx: number, reason: string) => {
        const victim = players[idx]
        if (!victim || !victim.isAlive) return

        victim.lives -= 1
        if (victim.lives > 0) {
          newLogs.push(`-> ${victim.name} bị tấn công (${reason}) nhưng vẫn còn mạng.`)
          return
        }

        victim.isAlive = false
        newLogs.push(`-> ${victim.name} (${victim.role}) ĐÃ CHẾT do ${reason}.`)

        if (victim.role === 'Sói Con') newExtraKill = true

        // Cupid chain death is unconditional once partner actually dies.
        if (victim.linkedWith !== null && players[victim.linkedWith]?.isAlive) {
          const linked = players[victim.linkedWith]
          linked.isAlive = false
          newLogs.push(`-> ${linked.name} (${linked.role}) ĐÃ CHẾT do Chết chùm (Cupid).`)
          if (linked.role === 'Sói Con') newExtraKill = true
        }

        // Hunter drags immediately at night when not cursed.
        if (victim.role === 'Thợ Săn' && !prev.isCursed && victim.hunterTarget !== null) {
          const target = players[victim.hunterTarget]
          if (target?.isAlive) {
            target.isAlive = false
            newLogs.push(`-> ${target.name} (${target.role}) ĐÃ CHẾT do Thợ Săn kéo.`)
            if (target.linkedWith !== null && players[target.linkedWith]?.isAlive) {
              const linked = players[target.linkedWith]
              linked.isAlive = false
              newLogs.push(`-> ${linked.name} (${linked.role}) ĐÃ CHẾT do Chết chùm (Cupid).`)
              if (linked.role === 'Sói Con') newExtraKill = true
            }
            if (target.role === 'Sói Con') newExtraKill = true
          }
        }
      }

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
        const reason = intentPoisoned !== null && idx === intentPoisoned ? 'Phù Thủy đầu độc' : 'Chết trong đêm'
        killNow(idx, reason)
      }

      return { ...prev, players, gameLogs: newLogs, extraKillNextNight: newExtraKill }
    })

    const updatedState = stateRef.current
    const diedTonight = updatedState.players
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => aliveBeforeNight.has(i) && !p.isAlive)
      .map(({ p }) => p.name)

    const summary: NightSummary = {
      night: nightNum,
      actions: updatedState.gameLogs.slice(nightLogStart),
      players: updatedState.players.map(player => ({ ...player })),
      witchHeal: updatedState.witchHeal,
      witchPoison: updatedState.witchPoison,
      isCursed: updatedState.isCursed,
      extraKillNextNight: updatedState.extraKillNextNight,
      bearLastAnnouncement: updatedState.bearLastAnnouncement,
      bearReverseAnnouncementToday: updatedState.bearReverseAnnouncementToday,
    }
    setNightSummaries(previous => [...previous, summary])
    await new Promise<void>(resolve => {
      setModal({ title: `Tổng kết đêm ${nightNum} · Chỉ quản trò`, mode: 'nightReview', summary, resolve })
    })

    const sunriseBody = diedTonight.length
      ? `Sáng nay làng phát hiện nạn nhân: ${diedTonight.join(', ')}`
      : 'Một đêm bình yên, không ai qua đời.'

    await showSimplePrompt({
      title: '☀️ TRỜI ĐÃ SÁNG',
      subtitle: 'Mời mọi người mở mắt!',
      body: sunriseBody,
      primaryText: 'Tiếp tục',
      public: true,
    })

    if (diedTonight.length) {
      log(`☀️ Sáng nay, làng phát hiện nạn nhân qua đời.`)
    } else {
      log('☀️ Một đêm bình yên, không ai qua đời.')
    }
    await announceBear()
  }

  const announceBear = async () => {
    const currentState = stateRef.current
    const result = getBearAnnouncement(currentState.players, currentState.bearLastAnnouncement, currentState.bearReverseAnnouncementToday)
    if (!result) return
    setGameState(prev => ({ ...prev, bearLastAnnouncement: result.signal, bearReverseAnnouncementToday: false }))
    await showSimplePrompt({
      title: '📢 THÔNG BÁO ĐẦU NGÀY',
      subtitle: 'Cảm nhận nguy hiểm của Gau/Bear',
      body: result.signal === 'CÓ' ? 'Gấu phát hiện có nguy hiểm' : 'Gấu không phát hiện nguy hiểm',
      primaryText: 'Tiếp tục',
      public: true,
    })
    log(`Gau/Bear cảm nhận nguy hiểm: ${result.signal}${result.repeated ? ' (lặp lại)' : ''}${result.inverted ? ' [đã đảo bởi Bitch]' : ''}`)

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

      const msgs = stateRef.current.pendingDeathMessages
      if (msgs.length) {
        await showSimplePrompt({
          title: '💀 Kết quả treo cổ',
          body: <PromptLines lines={msgs} />,
          primaryText: 'Tiếp tục',
          public: true,
        })
      }
    } else {
      log('BAN NGÀY: Bỏ qua treo cổ.')
    }

    // Handle pending hunter kill
    const afterState = stateRef.current
    if (afterState.pendingHunterKill !== null) {
      const hk = afterState.pendingHunterKill
      setGameState(prev => ({ ...prev, pendingHunterKill: null }))
      kill(hk, 'Thợ Săn kéo', true, false, false)
      const hunterMsgs = stateRef.current.pendingDeathMessages
      if (hunterMsgs.length) {
        await showSimplePrompt({ title: '🔫 Thợ Săn kéo theo!', body: <PromptLines lines={hunterMsgs} />, primaryText: 'Tiếp tục' })
      }
    }
  }

  // ─── Render Modal ───
  const renderModal = () => {
    if (!modal) return null
    const bearReview = modal.mode === 'nightReview'
      ? getBearAnnouncement(modal.summary.players, modal.summary.bearLastAnnouncement, modal.summary.bearReverseAnnouncementToday)
      : null
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div role="dialog" aria-modal="true" aria-label={modal.title} className="w-full max-w-[720px] max-h-[90dvh] overflow-y-auto bg-[#141930] border border-red-900/20 rounded-lg shadow-2xl p-6 animate-slideIn">
          <h2 className="text-xl font-bold text-amber-100 mb-2 font-[family-name:var(--font-be-vietnam)] break-words">{modal.title}</h2>
          {modal.mode !== 'nightReview' && modal.subtitle && <p className="text-white/50 text-sm mb-3">{modal.subtitle}</p>}

          {modal.mode === 'nightReview' && (
            <>
              <div className="max-h-[65dvh] overflow-y-auto text-white/80 text-sm space-y-4 mb-4">
                <h3 className="font-semibold text-amber-100">Hành động và kết quả</h3>
                <ol className="space-y-2 list-decimal pl-6 break-words">
                  {modal.summary.actions.map((action, index) => <li key={index}>{action}</li>)}
                </ol>
                <div className="border-t border-white/10 pt-3 space-y-1">
                  <p>Bình cứu: {modal.summary.witchHeal ? 'Còn' : 'Hết'} · Bình độc: {modal.summary.witchPoison ? 'Còn' : 'Hết'}</p>
                  <p>Nguyền Già Làng: {modal.summary.isCursed ? 'Có' : 'Không'} · Cắn đôi đêm sau: {modal.summary.extraKillNextNight ? 'Có' : 'Không'}</p>
                </div>
                <h3 className="font-semibold text-amber-100">Vòng người còn sống</h3>
                <p className="break-words">{modal.summary.players.map((player, index) => player.isAlive ? `#${index + 1} ${player.name}` : null).filter(Boolean).join(' → ') || 'Không còn người sống'} ↻</p>
                {bearReview && <p className="border-t border-white/10 pt-3 break-words">Gau/Bear · Hàng xóm sống: {bearReview.neighbors.map(index => modal.summary.players[index].name).join(' / ') || 'Không có'} · Công bố: {bearReview.signal}{bearReview.inverted ? ' (đảo bởi Bitch)' : ''}{bearReview.repeated ? ' (tín hiệu giữ lại sau khi Bear chết)' : ''}</p>}
                <ul className="space-y-2">
                  {modal.summary.players.map((player, index) => (
                    <li key={index} className="border-b border-white/10 pb-2 break-words">
                      #{index + 1} {player.name} · {player.role}{player.isTransformed ? ' (hóa Sói)' : ''} · {player.isAlive ? `Sống, ${player.lives} mạng` : 'Đã chết'}
                      {player.isAlive && <div className="text-white/50">Hàng xóm: {getLivingNeighbors(modal.summary.players, index).map(neighbor => modal.summary.players[neighbor].name).join(' / ') || 'Không có'}</div>}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => { setModal(null); modal.resolve() }} className="px-5 py-2.5 bg-red-800 text-white font-bold text-sm rounded-lg">{gameState.running ? 'Đã kiểm tra · Công bố bình minh' : 'Đóng'}</button>
            </>
          )}

          {modal.mode === 'simple' && (
            <>
              {modal.body && <div className="text-white/80 text-sm leading-relaxed p-4 rounded-lg bg-white/5 border border-white/5 mb-4 break-words">{modal.body}</div>}
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
                    className="max-w-full break-words whitespace-normal px-5 py-3 rounded-lg font-semibold text-sm bg-white/5 border border-white/15 text-white/90 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                    <input aria-label="Tổng số người chơi" type="number" min="2" max="60" placeholder="Ví dụ: 10" value={numPlayers} onChange={e => setNumPlayers(e.target.value)} className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm focus:border-blue-400/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Vai trò đã chọn</label>
                    <div className="py-2.5 text-white text-sm">{selectedRoleCount} / {numPlayers || 0}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Tên theo chiều kim đồng hồ, mỗi dòng một tên</label>
                  <textarea aria-label="Danh sách tên" placeholder={'PLAYER 1\nPLAYER 2\nPLAYER 3'} value={namesInput} onChange={e => setNamesInput(e.target.value)} className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-sm min-h-[100px] resize-y focus:border-blue-400/50 outline-none" />
                </div>
                {namesInput && (
                  <ol className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-auto">
                    {seatNames.map((name, index) => (
                      <li key={index} className="flex items-center gap-2 min-w-0">
                        <span className="text-amber-100 text-sm w-8 shrink-0">#{index + 1}</span>
                        <input aria-label={`Ghế ${index + 1}`} value={name} onChange={event => updateSeat(index, event.target.value)} className="min-w-0 flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                        <button title="Lên một ghế" aria-label={`Ghế ${index + 1}: lên`} disabled={index === 0} onClick={() => moveSeat(index, -1)} className="p-2 text-white disabled:opacity-25"><ArrowUp size={16} /></button>
                        <button title="Xuống một ghế" aria-label={`Ghế ${index + 1}: xuống`} disabled={index === seatNames.length - 1} onClick={() => moveSeat(index, 1)} className="p-2 text-white disabled:opacity-25"><ArrowDown size={16} /></button>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roleOptions.map(role => (
                    <label key={role.name} className="flex items-center justify-between gap-2 text-white/80 text-sm border-b border-white/10 py-2 min-w-0">
                      <span className="break-words">{role.name}</span>
                      <input aria-label={`Số lượng ${role.name}`} type="number" min="0" max={role.multiple ? Number(numPlayers) || 60 : 1} value={roleCounts[role.name] ?? 0} onChange={event => setRoleCounts(prev => ({ ...prev, [role.name]: Number(event.target.value) }))} className="w-14 shrink-0 bg-black/40 border border-white/10 rounded-lg p-2 text-white" />
                    </label>
                  ))}
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
          {!publicView && <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-sm font-bold font-[family-name:var(--font-be-vietnam)] uppercase tracking-widest text-amber-100">Nhật ký</h2>
            </div>
            <div className="p-5">
              <div ref={logBoxRef} className="bg-black/40 border border-white/5 rounded-xl p-4 min-h-[200px] max-h-[500px] overflow-auto whitespace-pre-wrap font-mono text-xs text-white/60 leading-relaxed">
                {gameState.gameLogs.join('\n') || 'Chưa có nhật ký...'}
              </div>
            </div>
          </div>}

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
                    if (p.role === 'Fox/Cao' && !p.foxCanScan) roleName += ' (Mất soi)'
                    if (p.linkedWith !== null) roleName += ' (Cặp đôi)'
                    if (p.markedByMirror) roleName += ' (Đã bị gương soi)'
                    return (
                      <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${p.isAlive ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-red-900/5 border-red-900/10 opacity-40'}`}>
                        <div>
                          <div className="font-semibold text-white text-sm break-words">#{i + 1} {p.name}</div>
                          <div className="text-white/40 text-xs mt-0.5">{!publicView && `Vai: ${roleName} · `}{p.isAlive ? 'SỐNG' : 'ĐÃ CHẾT'}</div>
                          {p.isAlive && <div className="text-white/40 text-xs mt-1 break-words">Hàng xóm: {getLivingNeighbors(gameState.players, i).map(index => gameState.players[index].name).join(' / ') || 'Không có'}</div>}
                        </div>
                        {!publicView && <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${p.side === 'Sói' ? 'bg-red-900/20 text-red-400 border-red-500/20' : p.side === 'Gương' ? 'bg-purple-900/20 text-purple-400 border-purple-500/20' : 'bg-green-900/20 text-green-400 border-green-500/20'}`}>
                          {p.side}
                        </span>}
                        {!p.isAlive && <span className="text-lg">💀</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {!publicView && nightSummaries.length > 0 && (
            <section className="lg:col-span-2 border-t border-white/10 pt-4">
              <h2 className="text-sm font-semibold text-amber-100 mb-3">Tổng kết đêm · Chỉ quản trò</h2>
              <div className="flex flex-wrap gap-2">
                {nightSummaries.map(summary => (
                  <button key={summary.night} disabled={gameState.running} onClick={() => setModal({ title: `Tổng kết đêm ${summary.night} · Chỉ quản trò`, mode: 'nightReview', summary, resolve: () => {} })} className="px-3 py-2 rounded-lg border border-white/10 text-white text-sm disabled:opacity-40">Đêm {summary.night}</button>
                ))}
              </div>
            </section>
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
