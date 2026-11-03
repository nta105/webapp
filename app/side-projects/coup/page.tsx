'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Coins, Eye, EyeOff, Flag, LockKeyhole, RotateCcw, Swords, Users } from 'lucide-react'
import { advanceCoup, createCoup, coupRoleDetails, coupRoles } from '@/lib/coup-rules'
import type { CoupAction, CoupActionName, CoupGame, CoupRole } from '@/lib/coup-rules'

const button = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const primary = `${button} bg-amber-300 text-[#241b0b] hover:bg-amber-200`
const secondary = `${button} border border-white/20 text-white/80 hover:bg-white/10`
const input = 'w-full min-w-0 rounded-lg border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300'

export default function CoupPage() {
  const [playerCount, setPlayerCount] = useState(4)
  const [names, setNames] = useState(['', '', '', ''])
  const [firstPlayer, setFirstPlayer] = useState(0)
  const [game, setGame] = useState<CoupGame | null>(null)
  const [privateOpen, setPrivateOpen] = useState(false)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [exchangeKeep, setExchangeKeep] = useState<number[]>([])
  const [error, setError] = useState('')

  const changePlayerCount = (count: number) => {
    setPlayerCount(count)
    setNames(previous => Array.from({ length: count }, (_, index) => previous[index] ?? ''))
    setFirstPlayer(previous => Math.min(previous, count - 1))
  }

  const start = () => {
    try {
      setGame(createCoup(names, firstPlayer))
      setPrivateOpen(false)
      setTargetId(null)
      setExchangeKeep([])
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start Coup.')
    }
  }

  const act = (action: CoupAction) => {
    if (!game) return
    try {
      setGame(advanceCoup(game, action))
      setPrivateOpen(false)
      setTargetId(null)
      setExchangeKeep([])
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That action is not available.')
    }
  }

  const reset = () => {
    if (window.confirm('Start a new game? The current match will be lost.')) {
      setGame(null)
      setPrivateOpen(false)
      setTargetId(null)
      setExchangeKeep([])
      setError('')
    }
  }

  const current = game?.players[game.currentPlayer]
  const targetOptions = game?.players.filter(player => player.alive && player.id !== game.currentPlayer) ?? []
  const challengedClaimantId = game?.pending?.stage === 'blockChallenge' ? game.pending.blockerId : game?.pending?.actorId
  const challengers = game?.players.filter(player => player.alive && player.id !== challengedClaimantId) ?? []
  const mandatoryCoup = !!current && current.coins >= 10
  const startAction = (action: CoupActionName) => {
    if (action === 'coup' || action === 'assassinate' || action === 'steal') {
      if (targetId !== null) act({ type: 'takeAction', action, targetId })
    } else {
      act({ type: 'takeAction', action })
    }
  }

  return (
    <div className="min-h-screen bg-[#171713] text-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/side-projects" className="mb-4 inline-flex items-center gap-2 text-xs text-white/55 hover:text-white">
              <ArrowLeft size={14} /> Side Projects
            </Link>
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Hidden roles · Bluffing · Strategy</p>
            <h1 className="font-serif text-4xl">Coup</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-white/60">
            <Users size={15} /> 3–6 players
          </div>
        </header>

        {error && <p role="alert" className="mb-4 border-l-2 border-rose-300 bg-rose-300/10 px-3 py-3 text-sm text-rose-200">{error}</p>}

        {!game ? (
          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><Users size={18} /> Set up players</h2>
              <label className="flex items-center gap-3 text-sm text-white/70">
                Players
                <select value={playerCount} onChange={event => changePlayerCount(Number(event.target.value))} className={`${input} w-24`}>
                  {[3, 4, 5, 6].map(count => <option key={count} value={count} className="bg-[#171713]">{count}</option>)}
                </select>
              </label>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-white/55">Enter 3–6 names in clockwise order. Each player starts with 2 coins and 2 hidden influence cards. The first player is randomly dealt cards too; turn order is the order shown here.</p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {names.map((name, index) => (
                <li key={index}>
                  <label htmlFor={`coup-player-${index}`} className="mb-1.5 block text-xs text-white/55">Player {index + 1}</label>
                  <input id={`coup-player-${index}`} value={name} maxLength={40} autoComplete="off" placeholder={`Player ${index + 1}`} onChange={event => setNames(previous => previous.map((entry, position) => position === index ? event.target.value : entry))} className={input} />
                </li>
              ))}
            </ol>
            <label className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/70">
              <Flag size={16} />
              First player
              <select value={firstPlayer} onChange={event => setFirstPlayer(Number(event.target.value))} className={`${input} max-w-56`}>
                {names.map((name, index) => <option key={index} value={index} className="bg-[#171713]">{name.trim() || `Player ${index + 1}`}</option>)}
              </select>
            </label>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
              <p className="text-xs text-white/45">Base Coup only. No expansion roles or house rules.</p>
              <button type="button" onClick={start} className={primary}><Swords size={16} /> Deal the cards</button>
            </div>
            <details className="mt-6 border-t border-white/10 pt-4 text-sm">
              <summary className="cursor-pointer text-white/70">Actions and rules</summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {coupRoles.map(role => <div key={role} className="rounded-lg border border-white/10 p-3"><h3 className="mb-1 font-semibold text-amber-200">{role}</h3><p className="text-xs leading-relaxed text-white/70">{coupRoleDetails[role].claim}</p><p className="mt-1 text-xs leading-relaxed text-white/50">{coupRoleDetails[role].power}</p></div>)}
                <div className="rounded-lg border border-white/10 p-3"><h3 className="mb-1 font-semibold">Other actions</h3><p className="text-xs leading-relaxed text-white/60">Income: +1 coin. Foreign Aid: +2 coins, blockable by Duke. Coup: pay 7 coins and the target loses influence. At 10 or more coins at the start of your turn, you must Coup.</p></div>
                <div className="rounded-lg border border-white/10 p-3"><h3 className="mb-1 font-semibold">Challenges</h3><p className="text-xs leading-relaxed text-white/60">Any other living player may challenge a role claim. A truthful claimant returns the shown card to the Court, shuffles, and draws a replacement; the challenger loses influence. A false claimant loses influence and the claimed action or block fails.</p></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/45">Players lose one influence when challenged unsuccessfully, assassinated, or Couped. They choose which card to reveal. Losing both cards eliminates them. The last player with influence wins.</p>
            </details>
          </section>
        ) : (
          <>
            <section aria-label="Player standings" className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {game.players.map(player => (
                <article key={player.id} className={`rounded-xl border p-4 ${player.id === game.currentPlayer && game.phase === 'turn' ? 'border-amber-200/50 bg-amber-200/[0.06]' : 'border-white/10 bg-white/[0.025]'} ${!player.alive ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold">{player.name}{player.id === game.currentPlayer && game.phase === 'turn' ? ' · Turn' : ''}</h2>
                      <p className="mt-1 text-xs text-white/55">{player.alive ? `${player.cards.length} influence${player.cards.length === 1 ? '' : 's'}` : 'Eliminated'}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm"><Coins size={15} className="text-amber-200" />{player.coins}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" aria-label={`${player.name}'s public influences`}>
                    {player.revealed.map((role, index) => <span key={`${role}-${index}`} className="rounded-md border border-rose-200/25 bg-rose-200/10 px-2 py-1 text-xs text-rose-100/80">{role} · revealed</span>)}
                    {player.cards.map((_, index) => <span key={`hidden-${index}`} className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/45">Hidden influence</span>)}
                  </div>
                </article>
              ))}
            </section>

            {game.message && <p role="status" aria-live="polite" className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">{game.message}</p>}

            {game.phase === 'reveal' && (
              <section className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/[0.03] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-amber-200/70" size={28} />
                <p className="mb-2 text-xs uppercase text-white/45">Private card deal · Player {game.revealIndex + 1} of {game.players.length}</p>
                <h2 className="mb-2 text-2xl">{game.players[game.revealIndex].name}</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">Pass the device to this player. Only they should view their influences.</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> View my cards</button>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-white/55">Keep these cards secret, then hide them before passing the device.</p>
                    <div className="mb-5 flex justify-center gap-3">{game.players[game.revealIndex].cards.map((role, index) => <span key={index} className="rounded-xl border border-amber-200/30 bg-amber-200/[0.08] px-5 py-4 text-lg font-semibold text-amber-100">{role}</span>)}</div>
                    <button type="button" onClick={() => act({ type: 'reveal' })} className={secondary}><EyeOff size={16} /> Hide and pass device</button>
                  </>
                )}
              </section>
            )}

            {game.phase === 'turn' && current && (
              <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-8">
                <h2 className="mb-2 text-xl">{current.name}&apos;s turn</h2>
                {mandatoryCoup ? (
                  <>
                    <p className="mb-5 text-sm text-amber-100/80">You have 10 or more coins. The rules require a Coup this turn.</p>
                    <TargetPicker players={targetOptions} targetId={targetId} onChange={setTargetId} label="Choose a target to Coup" />
                    <button type="button" disabled={targetId === null} onClick={() => startAction('coup')} className={`${button} mt-4 bg-rose-200 text-[#351b23] hover:bg-rose-100`}><Swords size={16} /> Coup · pay 7</button>
                  </>
                ) : (
                  <>
                    <p className="mb-5 text-sm text-white/55">Choose one action. Role claims may be challenged; blocks may also be challenged.</p>
                    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <ActionCard title="Income" detail="Take 1 coin. Cannot be blocked or challenged." onClick={() => startAction('income')} />
                      <ActionCard title="Foreign Aid" detail="Take 2 coins. Any other player may block with Duke." onClick={() => startAction('foreignAid')} />
                      <ActionCard title="Tax" detail="Claim Duke to take 3 coins." onClick={() => startAction('tax')} />
                      <ActionCard title="Exchange" detail="Claim Ambassador to exchange Court cards." onClick={() => startAction('exchange')} />
                    </div>
                    <div className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <TargetPicker players={targetOptions} targetId={targetId} onChange={setTargetId} label="Choose a target for a targeted action" />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={current.coins < 3 || targetId === null} onClick={() => startAction('assassinate')} className={`${button} bg-rose-200 text-[#351b23] hover:bg-rose-100`}>Assassinate · 3</button>
                        <button type="button" disabled={targetId === null} onClick={() => startAction('steal')} className={secondary}>Steal</button>
                        <button type="button" disabled={current.coins < 7 || targetId === null} onClick={() => startAction('coup')} className={secondary}>Coup · 7</button>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-white/45">At 10 or more coins, Coup is mandatory. Assassination costs are paid when declared, even if the action is blocked.</p>
                  </>
                )}
              </section>
            )}

            {game.phase === 'response' && game.pending && (
              <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-8">
                {game.pending.stage === 'actionChallenge' && (
                  <>
                    <h2 className="mb-2 text-xl">Challenge the claim?</h2>
                    <p className="mb-5 text-sm text-white/60">{game.players[game.pending.actorId].name} claims {game.pending.action === 'assassinate' ? 'Assassin' : game.pending.action === 'steal' ? 'Captain' : game.pending.action === 'tax' ? 'Duke' : 'Ambassador'}.</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => act({ type: 'pass' })} className={primary}>No challenge · continue</button>
                    </div>
                    <p className="mb-2 text-xs text-white/45">Any other living player may challenge. Select the challenger:</p>
                    <div className="flex flex-wrap gap-2">{challengers.map(player => <button key={player.id} type="button" onClick={() => act({ type: 'challenge', playerId: player.id })} className={secondary}>Challenge as {player.name}</button>)}</div>
                  </>
                )}

                {game.pending.stage === 'blockChoice' && (
                  <>
                    <h2 className="mb-2 text-xl">Block or allow?</h2>
                    <p className="mb-5 text-sm text-white/60">{game.pending.action === 'foreignAid' ? 'Any other player may claim Duke to block Foreign Aid.' : `${game.players[game.pending.targetId!].name} may claim ${game.pending.action === 'assassinate' ? 'Contessa' : 'Captain or Ambassador'} to block.`}</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => act({ type: 'allow' })} className={primary}>No block · continue</button>
                    </div>
                    {game.pending.action === 'foreignAid' ? (
                      <div className="flex flex-wrap gap-2">{game.players.filter(player => player.alive && player.id !== game.pending!.actorId).map(player => <button key={player.id} type="button" onClick={() => act({ type: 'block', playerId: player.id, role: 'Duke' })} className={secondary}>Block as Duke · {player.name}</button>)}</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(game.pending.action === 'assassinate' ? ['Contessa'] : ['Captain', 'Ambassador'] as CoupRole[]).map(role => <button key={role} type="button" onClick={() => act({ type: 'block', playerId: game.pending!.targetId!, role: role as CoupRole })} className={secondary}>Block as {role}</button>)}
                      </div>
                    )}
                  </>
                )}

                {game.pending.stage === 'blockChallenge' && (
                  <>
                    <h2 className="mb-2 text-xl">Challenge the block?</h2>
                    <p className="mb-5 text-sm text-white/60">{game.players[game.pending.blockerId!].name} claims {game.pending.blockRole}.</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => act({ type: 'pass' })} className={primary}>Accept block</button>
                    </div>
                    <p className="mb-2 text-xs text-white/45">Any other living player may challenge the claim:</p>
                    <div className="flex flex-wrap gap-2">{challengers.map(player => <button key={player.id} type="button" onClick={() => act({ type: 'challenge', playerId: player.id })} className={secondary}>Challenge as {player.name}</button>)}</div>
                  </>
                )}
              </section>
            )}

            {game.phase === 'loseInfluence' && game.lossPlayerId !== null && (
              <section className="mx-auto max-w-xl rounded-2xl border border-rose-200/20 bg-rose-200/[0.04] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-rose-100/60" size={28} />
                <h2 className="mb-2 text-xl">{game.players[game.lossPlayerId].name} must lose influence</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">Pass the device to this player. Their hand stays private; the selected card will be revealed.</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> Choose a card</button>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-white/55">Select one of your hidden cards to reveal and lose.</p>
                    <div className="flex justify-center gap-3">{game.players[game.lossPlayerId].cards.map((role, index) => <button key={index} type="button" onClick={() => act({ type: 'loseInfluence', playerId: game.lossPlayerId!, cardIndex: index })} className="rounded-xl border border-rose-200/25 bg-rose-200/[0.08] px-5 py-4 text-base font-semibold text-rose-100 hover:bg-rose-200/15">{role}</button>)}</div>
                  </>
                )}
              </section>
            )}

            {game.phase === 'exchange' && current && (
              <section className="mx-auto max-w-xl rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-amber-100/60" size={28} />
                <h2 className="mb-2 text-xl">{current.name}: exchange cards</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">Pass the device to the active player to privately choose which cards to keep.</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> View exchange cards</button>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-white/55">Choose exactly 2 cards to keep. Unselected cards return to the Court.</p>
                    <div className="mb-5 flex flex-wrap justify-center gap-3">{game.exchangeOptions.map((role, index) => {
                      const selected = exchangeKeep.includes(index)
                      return <button key={index} type="button" aria-pressed={selected} onClick={() => setExchangeKeep(previous => selected ? previous.filter(item => item !== index) : previous.length < 2 ? [...previous, index] : previous)} className={`rounded-xl border px-5 py-4 text-base font-semibold ${selected ? 'border-amber-200 bg-amber-200/15 text-amber-100' : 'border-white/15 bg-black/20 text-white/70'}`}>{role}</button>
                    })}</div>
                    <button type="button" disabled={exchangeKeep.length !== 2} onClick={() => act({ type: 'exchange', playerId: current.id, keep: exchangeKeep })} className={primary}>Keep selected cards</button>
                  </>
                )}
              </section>
            )}

            {game.phase === 'ended' && (
              <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-6 sm:p-8">
                <h2 className="mb-2 font-serif text-3xl text-amber-100">{game.winner === null ? 'Game ended' : `${game.players[game.winner].name} wins Coup!`}</h2>
                <p className="mb-5 text-sm text-white/60">{game.message}</p>
                <h3 className="mb-3 text-sm font-semibold text-white/70">Final roles</h3>
                <ul className="mb-6 grid gap-2 sm:grid-cols-2">{game.players.map(player => <li key={player.id} className="flex justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span>{player.name}</span><span className="text-right text-white/55">{[...player.revealed, ...player.cards].join(', ') || 'Eliminated'}</span></li>)}</ul>
                <button type="button" onClick={reset} className={secondary}><RotateCcw size={16} /> New game</button>
              </section>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-xs text-white/40">Pass-and-play on one device. Private information depends on players keeping their hands hidden.</p>
              <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"><RotateCcw size={14} /> New game</button>
            </div>
          </>
        )}

        <footer className="mt-8 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/35">
          This is a local pass-and-play aid, not an online game. Hidden cards are held in browser memory and are not protected from someone inspecting the device. No match state is saved after reload.
        </footer>
      </div>
    </div>
  )
}

function ActionCard({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-white/15 p-4 text-left transition-colors hover:border-amber-200/40 hover:bg-amber-200/[0.04]">
      <span className="mb-1 block font-semibold text-amber-100">{title}</span>
      <span className="block text-xs leading-relaxed text-white/55">{detail}</span>
    </button>
  )
}

function TargetPicker({ players, targetId, onChange, label }: { players: { id: number; name: string }[]; targetId: number | null; onChange: (id: number | null) => void; label: string }) {
  return (
    <label className="block text-xs text-white/55">
      {label}
      <select value={targetId ?? ''} onChange={event => onChange(event.target.value === '' ? null : Number(event.target.value))} className={`${input} mt-1.5`}>
        <option value="" className="bg-[#171713]">Choose player</option>
        {players.map(player => <option key={player.id} value={player.id} className="bg-[#171713]">{player.name}</option>)}
      </select>
    </label>
  )
}
