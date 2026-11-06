'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Be_Vietnam_Pro } from 'next/font/google'
import { ArrowLeft, Coins, Eye, EyeOff, Flag, LockKeyhole, RotateCcw, Swords, Users } from 'lucide-react'
import { advanceCoup, createCoup, coupFactions, coupRoles } from '@/lib/coup-rules'
import type { CoupAction, CoupActionName, CoupFaction, CoupGame, CoupRole } from '@/lib/coup-rules'
import { coupTranslator, localizeCoupError, localizeCoupMessage, localizeCoupRole, localizeCoupRoleDetails } from '@/lib/coup-i18n'
import type { CoupLanguage } from '@/lib/coup-i18n'

const vietnameseFont = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
})

const button = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const primary = `${button} bg-amber-300 text-[#241b0b] hover:bg-amber-200`
const secondary = `${button} border border-white/20 text-white/80 hover:bg-white/10`
const input = 'w-full min-w-0 rounded-lg border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300'

function RoleCards({ language }: { language: CoupLanguage }) {
  const t = coupTranslator(language)

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {coupRoles.map(role => {
        const details = localizeCoupRoleDetails(language, role)
        return (
          <li key={role} className="rounded-lg border border-white/10 bg-black/15 p-3">
            <h3 className="mb-2 font-semibold text-amber-200">{localizeCoupRole(language, role)}</h3>
            <dl className="space-y-2 text-xs leading-relaxed">
              <div><dt className="font-semibold text-white/50">{t('roleAction')}</dt><dd className="text-white/75">{details.action}</dd></div>
              <div><dt className="font-semibold text-white/50">{t('roleBlock')}</dt><dd className="text-white/75">{details.block}</dd></div>
            </dl>
          </li>
        )
      })}
    </ul>
  )
}

function RoleReference({ language }: { language: CoupLanguage }) {
  const t = coupTranslator(language)
  return (
    <section aria-labelledby="coup-role-reference" className="mb-5 rounded-2xl border border-amber-200/20 bg-amber-200/[0.025] p-4 sm:p-5">
      <h2 id="coup-role-reference" className="mb-3 text-sm font-semibold text-amber-100">{t('roleReference')}</h2>
      <RoleCards language={language} />
    </section>
  )
}

export default function CoupPage() {
  const [language, setLanguage] = useState<CoupLanguage>('en')
  const t = coupTranslator(language)
  const [playerCount, setPlayerCount] = useState(4)
  const [names, setNames] = useState(['', '', '', ''])
  const [factions, setFactions] = useState<CoupFaction[]>(['Catholic', 'Protestant', 'Catholic', 'Protestant'])
  const [firstPlayer, setFirstPlayer] = useState(0)
  const [game, setGame] = useState<CoupGame | null>(null)
  const [privateOpen, setPrivateOpen] = useState(false)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [exchangeKeep, setExchangeKeep] = useState<number[]>([])
  const [error, setError] = useState('')

  const changePlayerCount = (count: number) => {
    setPlayerCount(count)
    setNames(previous => Array.from({ length: count }, (_, index) => previous[index] ?? ''))
    setFactions(previous => Array.from({ length: count }, (_, index) => previous[index] ?? coupFactions[index % coupFactions.length]))
    setFirstPlayer(previous => Math.min(previous, count - 1))
  }

  const start = () => {
    try {
      setGame(createCoup(names, firstPlayer, Math.random, factions))
      setPrivateOpen(false)
      setTargetId(null)
      setExchangeKeep([])
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('errorStart'))
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
      setError(cause instanceof Error ? cause.message : t('errorAction'))
    }
  }

  const reset = () => {
    if (window.confirm(t('confirmNewGame'))) {
      setGame(null)
      setPrivateOpen(false)
      setTargetId(null)
      setExchangeKeep([])
      setError('')
    }
  }

  const current = game?.players[game.currentPlayer]
  const targetOptions = game?.players.filter(player => player.alive && player.id !== game.currentPlayer) ?? []
  const attackTargetOptions = targetOptions.filter(player => player.faction !== current?.faction)
  const challengedClaimantId = game?.pending?.stage === 'blockChallenge' ? game.pending.blockerId : game?.pending?.actorId
  const challengers = game?.players.filter(player => player.alive && player.id !== challengedClaimantId) ?? []
  const mandatoryCoup = !!current && game?.mustCoup === true
  const startAction = (action: CoupActionName) => {
    if (action === 'coup' || action === 'assassinate' || action === 'steal' || action === 'investigate') {
      if (targetId !== null) act({ type: 'takeAction', action, targetId })
    } else {
      act({ type: 'takeAction', action })
    }
  }

  return (
    <div lang={language} className={`${language === 'vi' ? vietnameseFont.className : ''} min-h-screen bg-[#171713] text-white px-4 py-6 sm:px-8 sm:py-8`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/side-projects" className="mb-4 inline-flex items-center gap-2 text-xs text-white/55 hover:text-white">
              <ArrowLeft size={14} /> {t('sideProjects')}
            </Link>
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-amber-200/70">{t('edition')}</p>
            <h1 className="font-serif text-4xl">Coup: Reformation</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div role="group" aria-label={t('language')} className="inline-flex overflow-hidden rounded-lg border border-white/20">
              {([{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }] as const).map(option => (
                <button key={option.value} type="button" lang={option.value} aria-pressed={language === option.value} onClick={() => setLanguage(option.value)} className={`min-w-20 px-3 py-2 text-xs ${language === option.value ? 'bg-amber-300 font-semibold text-[#241b0b]' : 'text-white/60 hover:bg-white/10'}`}>{option.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-white/60">
              <Users size={15} /> {t('playerCount')}
            </div>
          </div>
        </header>

        {error && <p role="alert" className="mb-4 border-l-2 border-rose-300 bg-rose-300/10 px-3 py-3 text-sm text-rose-200">{localizeCoupError(language, error)}</p>}

        {!game ? (
          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold"><Users size={18} /> {t('setupPlayers')}</h2>
              <label className="flex items-center gap-3 text-sm text-white/70">
                {t('players')}
                <select value={playerCount} onChange={event => changePlayerCount(Number(event.target.value))} className={`${input} w-24`}>
                  {[3, 4, 5, 6].map(count => <option key={count} value={count} className="bg-[#171713]">{count}</option>)}
                </select>
              </label>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-white/55">{t('enterNames')}</p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {names.map((name, index) => (
                <li key={index}>
                  <label htmlFor={`coup-player-${index}`} className="mb-1.5 block text-xs text-white/55">{t('playerNumber', { number: index + 1 })}</label>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input id={`coup-player-${index}`} value={name} maxLength={40} autoComplete="off" placeholder={t('playerName', { number: index + 1 })} onChange={event => setNames(previous => previous.map((entry, position) => position === index ? event.target.value : entry))} className={input} />
                    <select aria-label={t('chooseFaction', { name: name.trim() || t('playerName', { number: index + 1 }) })} value={factions[index]} onChange={event => setFactions(previous => previous.map((faction, position) => position === index ? event.target.value as CoupFaction : faction))} className={`${input} sm:w-40`}>
                      {coupFactions.map(faction => <option key={faction} value={faction} className="bg-[#171713]">{t(faction === 'Catholic' ? 'catholic' : 'protestant')}</option>)}
                    </select>
                  </div>
                </li>
              ))}
            </ol>
            <label className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/70">
              <Flag size={16} />
              {t('firstPlayer')}
              <select value={firstPlayer} onChange={event => setFirstPlayer(Number(event.target.value))} className={`${input} max-w-56`}>
                {names.map((name, index) => <option key={index} value={index} className="bg-[#171713]">{name.trim() || t('playerName', { number: index + 1 })}</option>)}
              </select>
            </label>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
              <p className="text-xs text-white/45">{t('reformationEdition')}</p>
              <button type="button" onClick={start} className={primary}><Swords size={16} /> {t('dealCards')}</button>
            </div>
            <details className="mt-6 border-t border-white/10 pt-4 text-sm">
              <summary className="cursor-pointer text-white/70">{t('rules')}</summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><RoleCards language={language} /></div>
                <div className="rounded-lg border border-white/10 p-3"><h3 className="mb-1 font-semibold">{t('otherActions')}</h3><p className="text-xs leading-relaxed text-white/60">{t('otherActionsDetails')}</p></div>
                <div className="rounded-lg border border-white/10 p-3"><h3 className="mb-1 font-semibold">{t('challenges')}</h3><p className="text-xs leading-relaxed text-white/60">{t('challengeRules')}</p></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/45">{t('influenceRules')}</p>
            </details>
          </section>
        ) : (
          <>
            <section aria-label={t('standings')} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {game.players.map(player => {
                const isTurnPlayer = player.id === game.currentPlayer && game.phase === 'turn'
                return (
                  <article key={player.id} aria-current={isTurnPlayer ? 'true' : undefined} className={`rounded-xl border p-4 transition-all duration-200 ${isTurnPlayer ? 'z-10 scale-[1.02] border-2 border-amber-300 bg-amber-200/15 p-5 shadow-lg shadow-amber-300/10 ring-2 ring-amber-300/40' : 'border-white/10 bg-white/[0.025]'} ${!player.alive ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className={`break-words ${isTurnPlayer ? 'text-xl font-bold text-amber-100' : 'font-semibold'}`}>{player.name}{isTurnPlayer ? ` · ${t('turn')}` : ''}</h2>
                        <p className="mt-1 text-xs text-white/55">{t(player.faction === 'Catholic' ? 'catholic' : 'protestant')} · {player.alive ? `${player.cards.length} ${player.cards.length === 1 ? t('influence') : t('influences')}` : t('eliminated')}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm"><Coins size={15} className="text-amber-200" />{player.coins}</span>
                    </div>
                    {isTurnPlayer && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#241b0b]"><Swords size={14} />{t('activeTurnBadge')}</p>}
                    <div className="mt-3 flex flex-wrap gap-2" aria-label={`${player.name} · ${t('standings')}`}>
                      {player.revealed.map((role, index) => <span key={`${role}-${index}`} className="rounded-md border border-rose-200/25 bg-rose-200/10 px-2 py-1 text-xs text-rose-100/80">{localizeCoupRole(language, role)} · {t('revealed')}</span>)}
                      {player.cards.map((_, index) => <span key={`hidden-${index}`} className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/45">{t('hiddenInfluence')}</span>)}
                    </div>
                  </article>
                )
              })}
            </section>

            <RoleReference language={language} />

            {game.message && <p role="status" aria-live="polite" className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">{localizeCoupMessage(language, game.message)}</p>}

            {game.phase === 'reveal' && (
              <section className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/[0.03] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-amber-200/70" size={28} />
                <p className="mb-2 text-xs uppercase text-white/45">{t('privateDeal', { current: game.revealIndex + 1, total: game.players.length })}</p>
                <h2 className="mb-2 text-2xl">{game.players[game.revealIndex].name}</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">{t('passDeviceToPlayer')}</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> {t('viewCards')}</button>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-white/55">{t('keepCardsSecret')}</p>
                    <div className="mb-5 flex justify-center gap-3">{game.players[game.revealIndex].cards.map((role, index) => <span key={index} className="rounded-xl border border-amber-200/30 bg-amber-200/[0.08] px-5 py-4 text-lg font-semibold text-amber-100">{localizeCoupRole(language, role)}</span>)}</div>
                    <button type="button" onClick={() => act({ type: 'reveal' })} className={secondary}><EyeOff size={16} /> {t('hideAndPass')}</button>
                  </>
                )}
              </section>
            )}

            {game.phase === 'turn' && current && (
              <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-8">
                <h2 className="mb-2 text-xl">{t('turnOf', { name: current.name })}</h2>
                {!game.convertedThisTurn && current.coins > 0 && (
                  <div className="mb-5 max-w-sm">
                    <ActionCard title={t('convert')} detail={t('convertDetails')} onClick={() => startAction('convert')} />
                  </div>
                )}
                {mandatoryCoup ? (
                  <>
                    <p className="mb-5 text-sm text-amber-100/80">{t('mandatoryCoup')}</p>
                    <TargetPicker players={attackTargetOptions} targetId={targetId} onChange={setTargetId} label={t('chooseCoupTarget')} emptyLabel={t('choosePlayer')} />
                    <button type="button" disabled={targetId === null || !attackTargetOptions.some(player => player.id === targetId)} onClick={() => startAction('coup')} className={`${button} mt-4 bg-rose-200 text-[#351b23] hover:bg-rose-100`}><Swords size={16} /> {t('coupPay')}</button>
                  </>
                ) : (
                  <>
                    <p className="mb-5 text-sm text-white/55">{t('chooseAction')}</p>
                    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <ActionCard title={t('income')} detail={t('incomeDetails')} onClick={() => startAction('income')} />
                      <ActionCard title={t('foreignAid')} detail={t('foreignAidDetails')} onClick={() => startAction('foreignAid')} />
                      <ActionCard title={t('tax')} detail={t('taxDetails')} onClick={() => startAction('tax')} />
                      <ActionCard title={t('exchange')} detail={t('exchangeDetails')} onClick={() => startAction('exchange')} />
                      <ActionCard title={t('investigate')} detail={t('investigateDetails')} onClick={() => startAction('investigate')} />
                    </div>
                    <div className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <TargetPicker players={targetOptions} targetId={targetId} onChange={setTargetId} label={t('chooseActionTarget')} emptyLabel={t('choosePlayer')} />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={current.coins < 3 || targetId === null || !attackTargetOptions.some(player => player.id === targetId)} onClick={() => startAction('assassinate')} className={`${button} bg-rose-200 text-[#351b23] hover:bg-rose-100`}>{t('assassinate')}</button>
                        <button type="button" disabled={targetId === null} onClick={() => startAction('steal')} className={secondary}>{t('steal')}</button>
                        <button type="button" disabled={current.coins < 7 || targetId === null || !attackTargetOptions.some(player => player.id === targetId)} onClick={() => startAction('coup')} className={secondary}>{t('coup')}</button>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-white/45">{t('turnRules')}</p>
                  </>
                )}
              </section>
            )}

            {game.phase === 'response' && game.pending && (
              <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-8">
                {game.pending.stage === 'actionChallenge' && (
                  <>
                    <h2 className="mb-2 text-xl">{t('challengeClaim')}</h2>
                    <p className="mb-5 text-sm text-white/60">{t('messageClaimsRole', { name: game.players[game.pending.actorId].name, role: localizeCoupRole(language, game.pending.action === 'assassinate' ? 'Assassin' : game.pending.action === 'steal' ? 'Captain' : game.pending.action === 'tax' ? 'Duke' : 'Inquisitor') })}</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => act({ type: 'pass' })} className={primary}>{t('noChallenge')}</button>
                    </div>
                    <p className="mb-2 text-xs text-white/45">{t('otherPlayersChallenge')}</p>
                    <div className="flex flex-wrap gap-2">{challengers.map(player => <button key={player.id} type="button" onClick={() => act({ type: 'challenge', playerId: player.id })} className={secondary}>{t('challengeAs', { name: player.name })}</button>)}</div>
                  </>
                )}

                {game.pending.stage === 'blockChoice' && (
                  <>
                    <h2 className="mb-2 text-xl">{t('blockOrAllow')}</h2>
                    <p className="mb-5 text-sm text-white/60">{game.pending.action === 'foreignAid' ? t('mayBlockAid') : t('mayBlockTarget', { name: game.players[game.pending.targetId!].name, roles: game.pending.action === 'assassinate' ? localizeCoupRole(language, 'Contessa') : `${localizeCoupRole(language, 'Captain')} ${language === 'vi' ? 'hoặc' : 'or'} ${localizeCoupRole(language, 'Inquisitor')}` })}</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => act({ type: 'allow' })} className={primary}>{t('noBlock')}</button>
                    </div>
                    {game.pending.action === 'foreignAid' ? (
                      <div className="flex flex-wrap gap-2">{game.players.filter(player => player.alive && player.id !== game.pending!.actorId).map(player => <button key={player.id} type="button" onClick={() => act({ type: 'block', playerId: player.id, role: 'Duke' })} className={secondary}>{t('blockAs', { role: localizeCoupRole(language, 'Duke'), name: player.name })}</button>)}</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(game.pending.action === 'assassinate' ? ['Contessa'] : ['Captain', 'Inquisitor'] as CoupRole[]).map(role => <button key={role} type="button" onClick={() => act({ type: 'block', playerId: game.pending!.targetId!, role: role as CoupRole })} className={secondary}>{t('blockAs', { role: localizeCoupRole(language, role as CoupRole), name: game.players[game.pending!.targetId!].name })}</button>)}
                      </div>
                    )}
                  </>
                )}

                {game.pending.stage === 'blockChallenge' && (
                  <>
                    <h2 className="mb-2 text-xl">{t('challengeBlock')}</h2>
                    <p className="mb-5 text-sm text-white/60">{t('messageClaimsRole', { name: game.players[game.pending.blockerId!].name, role: localizeCoupRole(language, game.pending.blockRole!) })}</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => act({ type: 'pass' })} className={primary}>{t('acceptBlock')}</button>
                    </div>
                    <p className="mb-2 text-xs text-white/45">{t('challengeBlockPrompt')}</p>
                    <div className="flex flex-wrap gap-2">{challengers.map(player => <button key={player.id} type="button" onClick={() => act({ type: 'challenge', playerId: player.id })} className={secondary}>{t('challengeAs', { name: player.name })}</button>)}</div>
                  </>
                )}
              </section>
            )}

            {game.phase === 'loseInfluence' && game.lossPlayerId !== null && (
              <section className="mx-auto max-w-xl rounded-2xl border border-rose-200/20 bg-rose-200/[0.04] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-rose-100/60" size={28} />
                <h2 className="mb-2 text-xl">{t('mustLoseInfluence', { name: game.players[game.lossPlayerId].name })}</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">{t('passToLosingPlayer')}</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> {t('chooseCard')}</button>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-white/55">{t('selectCardToLose')}</p>
                    <div className="flex justify-center gap-3">{game.players[game.lossPlayerId].cards.map((role, index) => <button key={index} type="button" onClick={() => act({ type: 'loseInfluence', playerId: game.lossPlayerId!, cardIndex: index })} className="rounded-xl border border-rose-200/25 bg-rose-200/[0.08] px-5 py-4 text-base font-semibold text-rose-100 hover:bg-rose-200/15">{localizeCoupRole(language, role)}</button>)}</div>
                  </>
                )}
              </section>
            )}

            {game.phase === 'exchange' && current && (
              <section className="mx-auto max-w-xl rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-amber-100/60" size={28} />
                <h2 className="mb-2 text-xl">{t('exchangeCards', { name: current.name })}</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">{t('passToActivePlayer')}</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> {t('viewExchangeCards')}</button>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-white/55">{t('chooseTwoCards')}</p>
                    <div className="mb-5 flex flex-wrap justify-center gap-3">{game.exchangeOptions.map((role, index) => {
                      const selected = exchangeKeep.includes(index)
                      return <button key={index} type="button" aria-pressed={selected} onClick={() => setExchangeKeep(previous => selected ? previous.filter(item => item !== index) : previous.length < 2 ? [...previous, index] : previous)} className={`rounded-xl border px-5 py-4 text-base font-semibold ${selected ? 'border-amber-200 bg-amber-200/15 text-amber-100' : 'border-white/15 bg-black/20 text-white/70'}`}>{localizeCoupRole(language, role)}</button>
                    })}</div>
                    <button type="button" disabled={exchangeKeep.length !== 2} onClick={() => act({ type: 'exchange', playerId: current.id, keep: exchangeKeep })} className={primary}>{t('keepSelectedCards')}</button>
                  </>
                )}
              </section>
            )}

            {game.phase === 'investigate' && current && game.pending?.targetId !== undefined && (
              <section className="mx-auto max-w-xl rounded-2xl border border-violet-200/20 bg-violet-200/[0.04] p-6 text-center">
                <LockKeyhole className="mx-auto mb-4 text-violet-100/60" size={28} />
                <h2 className="mb-2 text-xl">{t('investigationTitle', { name: game.players[game.pending.targetId].name })}</h2>
                {!privateOpen ? (
                  <>
                    <p className="mb-5 text-sm text-white/55">{t('passForInvestigation')}</p>
                    <button type="button" onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> {t('viewTargetCards')}</button>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-white/55">{t('inspectAndReplace')}</p>
                    <div className="mb-5 flex flex-wrap justify-center gap-3">{game.players[game.pending.targetId].cards.map((role, index) => <button key={index} type="button" disabled={game.deck.length === 0} onClick={() => act({ type: 'forceExchange', cardIndex: index })} className="rounded-xl border border-violet-200/25 bg-violet-200/[0.08] px-5 py-4 text-base font-semibold text-violet-100 disabled:opacity-40">{localizeCoupRole(language, role)}</button>)}</div>
                    <button type="button" onClick={() => act({ type: 'finishInvestigation' })} className={secondary}>{t('finishInvestigation')}</button>
                  </>
                )}
              </section>
            )}

            {game.phase === 'ended' && (
              <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-6 sm:p-8">
                <h2 className={`mb-2 text-3xl text-amber-100 ${language === 'vi' ? vietnameseFont.className : 'font-serif'}`}>{game.winningFaction ? t('factionWins', { faction: t(game.winningFaction === 'Catholic' ? 'catholic' : 'protestant') }) : game.winner === null ? t('gameEnded') : t('winsCoup', { name: game.players[game.winner].name })}</h2>
                <p className="mb-5 text-sm text-white/60">{localizeCoupMessage(language, game.message)}</p>
                <h3 className="mb-3 text-sm font-semibold text-white/70">{t('finalRoles')}</h3>
                <ul className="mb-6 grid gap-2 sm:grid-cols-2">{game.players.map(player => <li key={player.id} className="flex justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span>{player.name} · {t(player.faction === 'Catholic' ? 'catholic' : 'protestant')}</span><span className="text-right text-white/55">{[...player.revealed, ...player.cards].map(role => localizeCoupRole(language, role)).join(', ') || t('eliminated')}</span></li>)}</ul>
                <button type="button" onClick={reset} className={secondary}><RotateCcw size={16} /> {t('newGame')}</button>
              </section>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-xs text-white/40">{t('passAndPlay')}</p>
              <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"><RotateCcw size={14} /> {t('newGame')}</button>
            </div>
          </>
        )}

        <footer className="mt-8 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/35">{t('privacy')}</footer>
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

function TargetPicker({ players, targetId, onChange, label, emptyLabel }: { players: { id: number; name: string }[]; targetId: number | null; onChange: (id: number | null) => void; label: string; emptyLabel: string }) {
  return (
    <label className="block text-xs text-white/55">
      {label}
      <select value={targetId ?? ''} onChange={event => onChange(event.target.value === '' ? null : Number(event.target.value))} className={`${input} mt-1.5`}>
        <option value="" className="bg-[#171713]">{emptyLabel}</option>
        {players.map(player => <option key={player.id} value={player.id} className="bg-[#171713]">{player.name}</option>)}
      </select>
    </label>
  )
}
