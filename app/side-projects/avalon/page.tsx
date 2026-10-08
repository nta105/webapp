'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, ArrowUp, Check, Crown, Eye, Flag, LockKeyhole, RotateCcw, Shield, Swords, Users, X } from 'lucide-react'
import { advanceAvalon, buildRolePool, createAvalon, customSetupFromPool, defaultMissions, factionOf, getSetup, knowledgeFor, recommendedRoles, roleDescriptions, roleNames, roleStrategies, validateCustomSetup } from '@/lib/avalon-rules'
import type { AvalonAction, AvalonGame, AvalonMode, AvalonRole, CustomAvalonSetup, MissionRule } from '@/lib/avalon-rules'
import { avalonTranslator, localizeAvalonEnding, localizeAvalonError, localizeAvalonKnowledge, vietnameseRoles } from '@/lib/avalon-i18n'
import type { AvalonLanguage } from '@/lib/avalon-i18n'

const button = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed'
const primary = `${button} bg-emerald-300 text-[#14201a] hover:bg-emerald-200`
const secondary = `${button} border border-white/20 text-white/80 hover:bg-white/10`
const input = 'w-full min-w-0 rounded-lg border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-300'
const availableRoles = Object.keys(roleNames) as AvalonRole[]

function RoleGuide({ role, language, mode = 'commander', identification = mode === 'commander' }: { role: AvalonRole; language: AvalonLanguage; mode?: AvalonMode; identification?: boolean }) {
  const translate = avalonTranslator(language)
  const descriptions = language === 'vi' ? vietnameseRoles.descriptions : roleDescriptions
  const strategies = language === 'vi' ? vietnameseRoles.strategies : roleStrategies
  return (
    <dl className="space-y-3 text-sm leading-relaxed text-left">
      <div><dt className="text-xs text-white/40 mb-1">{translate('ability')}</dt><dd className="text-white/75">{mode === 'basic' ? translate(factionOf(role) === 'Good' ? 'basicGoodDescription' : 'basicEvilDescription') : descriptions[role]}{mode === 'custom' && !identification && (role === 'Merlin' || role === 'Assassin') && <p className="mt-2 text-amber-100/80">{translate('customAbilityFinalOff')}</p>}</dd></div>
      <div><dt className="text-xs text-white/40 mb-1">{translate('objective')}</dt><dd className="text-white/75">{translate(!identification ? factionOf(role) === 'Good' ? 'basicGoodObjective' : 'basicEvilObjective' : factionOf(role) === 'Good' ? 'goodObjective' : 'evilObjective')}</dd></div>
      <div><dt className="text-xs text-white/40 mb-1">{translate('strategy')}</dt><dd className="text-white/75">{mode === 'basic' ? translate(factionOf(role) === 'Good' ? 'basicGoodStrategy' : 'basicEvilStrategy') : strategies[role]}</dd></div>
      {mode === 'custom' && <div><dt className="text-xs text-white/40 mb-1">{translate('customEdition')}</dt><dd className="text-amber-100/80">{translate(identification ? 'customFinalOn' : 'customFinalOff')}</dd></div>}
    </dl>
  )
}

function QuestBoard({ missions, game, language }: { missions: MissionRule[]; game: AvalonGame | null; language: AvalonLanguage }) {
  const translate = avalonTranslator(language)
  return (
    <section className="border-y border-white/15 py-5" aria-label={translate('missionBoard')}>
      <div className="flex justify-between items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-white/80">{translate('missionTrack')}</h2>
        <span className="text-xs text-white/50">{translate('bestOfFive')}</span>
      </div>
      <ol className="grid grid-cols-5 gap-2 sm:gap-3">
        {missions.map((mission, index) => {
          const size = mission.teamSize
          const result = game?.quests.find(quest => quest.number === index + 1)
          const current = !!game && game.quest === index + 1 && !result && game.phase !== 'ended' && game.phase !== 'assassination'
          return (
            <li key={index} aria-current={current ? 'step' : undefined} className={`relative rounded-lg border px-1 py-3 sm:p-4 text-center ${result ? result.succeeded ? 'border-emerald-300/60 bg-emerald-300/10' : 'border-rose-300/60 bg-rose-300/10' : current ? 'border-white/70 bg-white/5' : 'border-white/15'}`}>
              <span className="block text-[10px] sm:text-xs uppercase text-white/50 mb-2">{translate('mission', { number: index + 1 })}</span>
              <div className="h-8 flex items-center justify-center text-white mb-2">
                {result ? result.succeeded ? <Check size={26} className="text-emerald-300" aria-label={translate('succeeded')} /> : <X size={26} className="text-rose-300" aria-label={translate('failed')} /> : <span className="text-2xl font-semibold">{size}</span>}
              </div>
              <span className="block text-[10px] sm:text-xs text-white/65">{translate(result ? 'failCount' : 'playerCount', { count: result ? result.fails : size })}</span>
              <span className={`block text-[10px] sm:text-xs mt-1 ${mission.failsRequired > 1 ? 'text-amber-200' : 'text-white/40'}`}>{translate('failThreshold', { count: mission.failsRequired })}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function AvalonPage() {
  const [language, setLanguage] = useState<AvalonLanguage>('en')
  const translate = avalonTranslator(language)
  const roleLabels = language === 'vi' ? vietnameseRoles.names : roleNames
  const [count, setCount] = useState(7)
  const [names, setNames] = useState<string[]>(Array(7).fill(''))
  const [preset, setPreset] = useState<'beginner' | 'classic' | 'custom'>('beginner')
  const [customConfig, setCustomConfig] = useState<CustomAvalonSetup | null>(null)
  const [missionsEdited, setMissionsEdited] = useState(false)
  const [firstLeader, setFirstLeader] = useState(0)
  const [game, setGame] = useState<AvalonGame | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<number[]>([])
  const [privateOpen, setPrivateOpen] = useState(false)
  const [error, setError] = useState('')
  const [resetPrompt, setResetPrompt] = useState(false)
  const [assassinTarget, setAssassinTarget] = useState<number | null>(null)

  const mode: AvalonMode = preset === 'beginner' ? 'basic' : preset === 'custom' ? 'custom' : 'commander'
  const activeMode = game?.mode ?? mode
  const setup = getSetup(count)
  const selectedRoles = recommendedRoles(count, preset === 'beginner' ? 'beginner' : 'classic')
  const previewMissions = preset === 'custom' && customConfig ? customConfig.missions : defaultMissions(count)
  let pool: ReturnType<typeof buildRolePool> = []
  let roleError = ''
  try {
    if (mode === 'custom') {
      if (!customConfig) throw new Error('Provide custom roles and mission rules.')
      pool = validateCustomSetup(count, customConfig).pool
    } else pool = buildRolePool(count, selectedRoles, mode)
  } catch (cause) { roleError = cause instanceof Error ? cause.message : 'Invalid roles.' }
  const roleCounts = mode === 'custom' && customConfig ? customConfig.roleCounts : pool.reduce<Partial<Record<AvalonRole, number>>>((counts, role) => ({ ...counts, [role]: (counts[role] ?? 0) + 1 }), {})
  const roleTotal = Object.values(roleCounts).reduce((total, quantity) => total + (quantity ?? 0), 0)
  const configuredGood = availableRoles.filter(role => factionOf(role) === 'Good').reduce((total, role) => total + (roleCounts[role] ?? 0), 0)
  const configuredSpies = roleTotal - configuredGood
  const identification = (roleCounts.Merlin ?? 0) > 0 && (roleCounts.Assassin ?? 0) > 0
  const actor = game?.phase === 'reveal' ? game.players[game.revealIndex]
    : game?.phase === 'quest' ? game.players[game.team[game.cards.length]] : null
  const knowledge = game && actor ? knowledgeFor(game.players, actor) : null
  const privatePhase = !!actor
  const successes = game?.quests.filter(result => result.succeeded).length ?? 0
  const failures = game?.quests.filter(result => !result.succeeded).length ?? 0
  const lastProposal = game?.proposals.at(-1)
  const lastQuest = game?.quests.at(-1)

  const changeCount = (next: number) => {
    setCount(next)
    setNames(previous => Array.from({ length: next }, (_, index) => previous[index] ?? ''))
    setFirstLeader(previous => Math.min(previous, next - 1))
    if (!missionsEdited) setCustomConfig(previous => previous ? { ...previous, missions: defaultMissions(next) } : null)
    setError('')
  }

  const selectPreset = (next: typeof preset) => {
    if (next === 'custom' && !customConfig) setCustomConfig(customSetupFromPool(pool, previewMissions))
    setPreset(next)
    setError('')
  }

  const updateQuantity = (role: AvalonRole, quantity: number) => {
    setCustomConfig(previous => previous ? { ...previous, roleCounts: { ...previous.roleCounts, [role]: quantity } } : null)
    setError('')
  }

  const applyRolePreset = (source: 'beginner' | 'classic') => {
    setCustomConfig(customSetupFromPool(buildRolePool(count, recommendedRoles(count, source), source === 'beginner' ? 'basic' : 'commander'), previewMissions))
    setError('')
  }

  const updateMission = (index: number, field: keyof MissionRule, value: number) => {
    const source = preset === 'custom' && customConfig ? customConfig : customSetupFromPool(pool, previewMissions)
    setCustomConfig({ ...source, missions: source.missions.map((mission, position) => position === index ? { ...mission, [field]: value } : { ...mission }) })
    setPreset('custom')
    setMissionsEdited(true)
    setError('')
  }

  const resetMissions = () => {
    setCustomConfig(previous => previous ? { ...previous, missions: defaultMissions(count) } : null)
    setMissionsEdited(false)
    setError('')
  }

  const movePlayer = (index: number, direction: number) => {
    const next = index + direction
    if (next < 0 || next >= count) return
    const reordered = [...names]
    ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
    setNames(reordered)
    if (firstLeader === index) setFirstLeader(next)
    else if (firstLeader === next) setFirstLeader(index)
  }

  const start = () => {
    try {
      setGame(createAvalon(names, selectedRoles, firstLeader, Math.random, mode, mode === 'custom' ? customConfig ?? undefined : undefined))
      setPrivateOpen(false)
      setSelectedTeam([])
      setAssassinTarget(null)
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start the game.') }
  }

  const act = (action: AvalonAction) => {
    if (!game) return
    try {
      setGame(advanceAvalon(game, action))
      setPrivateOpen(false)
      setSelectedTeam([])
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid action.') }
  }

  const reset = () => {
    setGame(null)
    setPrivateOpen(false)
    setSelectedTeam([])
    setAssassinTarget(null)
    setResetPrompt(false)
    setError('')
  }

  return (
    <div lang={language} className="min-h-screen bg-[var(--avalon-bg)] text-white px-4 sm:px-8 py-6 sm:py-8" style={{ '--avalon-bg': '#191e1b' } as CSSProperties}>
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <Link href="/side-projects" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white mb-4"><ArrowLeft size={14} /> {translate('sideProjects')}</Link>
            <p className="text-[10px] uppercase text-emerald-200/70 mb-1">{translate(activeMode === 'basic' ? 'basicEdition' : activeMode === 'custom' ? 'customEdition' : 'edition')}</p>
            <h1 className="text-3xl sm:text-4xl text-white" style={{ fontFamily: 'Georgia, serif' }}>The Resistance</h1>
          </div>
          <Image src="/avalon-table.svg" alt={translate('tableAlt')} width={104} height={104} priority className="w-20 h-20 sm:w-24 sm:h-24 shrink-0" />
          <div className="w-full sm:w-auto flex justify-end">
            <div role="group" aria-label={translate('language')} className="inline-flex border border-white/20 rounded-lg overflow-hidden">
              {([{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }] as const).map(option => <button key={option.value} lang={option.value} aria-pressed={language === option.value} onClick={() => setLanguage(option.value)} className={`min-w-20 px-3 py-2 text-xs ${language === option.value ? 'bg-emerald-300 text-[#14201a] font-semibold' : 'text-white/60 hover:bg-white/10'}`}>{option.label}</button>)}
            </div>
          </div>
        </header>

        {error && <p role="alert" className="border-l-2 border-rose-300 bg-rose-300/10 px-3 py-3 text-sm text-rose-200 mb-4">{localizeAvalonError(language, error)}</p>}

        {!game && (
          <>
            <section className="border-t border-white/15 pt-5 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <h2 className="text-lg font-semibold inline-flex items-center gap-2"><Users size={18} /> {translate('players')}</h2>
                <select aria-label={translate('playerCountLabel')} value={count} onChange={event => changeCount(Number(event.target.value))} className={`${input} w-36`}>
                  {Array.from({ length: 16 }, (_, index) => index + 5).map(number => <option key={number} value={number} className="bg-[#191e1b]">{translate('playerCount', { count: number })}</option>)}
                </select>
              </div>
              <p className={`text-xs mb-4 ${count > 10 || preset === 'custom' ? 'text-amber-200' : 'text-white/45'}`}>{translate(preset === 'custom' ? 'customBadge' : count > 10 ? 'houseBadge' : 'standardBadge')}</p>
              {count > 10 && preset !== 'custom' && <p role="note" className="border-l-2 border-amber-200/60 pl-3 mb-5 text-sm leading-relaxed text-amber-100/70">{translate('houseNotice')}</p>}
              <div className="flex gap-5 text-sm mb-5"><span className="text-emerald-300">{preset === 'custom' ? configuredGood : setup.good} {translate('resistance')}</span><span className="text-rose-300">{preset === 'custom' ? configuredSpies : setup.evil} {translate('spies')}</span></div>
              <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {names.map((name, index) => (
                  <li key={index} className="flex items-center gap-2 min-w-0">
                    <span className="w-6 shrink-0 text-xs text-white/40">{index + 1}</span>
                    <input aria-label={translate('playerName', { number: index + 1 })} value={name} maxLength={40} placeholder={translate('playerPlaceholder', { number: index + 1 })} onChange={event => setNames(previous => previous.map((old, position) => position === index ? event.target.value : old))} className={input} />
                    <button title={translate('earlier')} aria-label={translate('moveEarlier', { number: index + 1 })} onClick={() => movePlayer(index, -1)} disabled={index === 0} className="p-2 text-white/50 hover:text-white disabled:opacity-20"><ArrowUp size={15} /></button>
                    <button title={translate('later')} aria-label={translate('moveLater', { number: index + 1 })} onClick={() => movePlayer(index, 1)} disabled={index === count - 1} className="p-2 text-white/50 hover:text-white disabled:opacity-20"><ArrowDown size={15} /></button>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center gap-4 mt-5">
                <label className="flex flex-wrap sm:flex-nowrap items-center gap-3 text-sm text-white/70 min-w-0"><Crown size={16} className="shrink-0" /><span className="shrink-0">{translate('firstLeader')}</span>
                  <select aria-label={translate('firstLeader')} value={firstLeader} onChange={event => setFirstLeader(Number(event.target.value))} className={`${input} max-w-48`}>
                    {names.map((name, index) => <option key={index} value={index} className="bg-[#191e1b]">{name.trim() || translate('playerPlaceholder', { number: index + 1 })}</option>)}
                  </select>
                </label>
                <button onClick={() => setNames(Array.from({ length: count }, (_, index) => translate('playerPlaceholder', { number: index + 1 })))} className={secondary}><Users size={15} /> {translate('sampleNames')}</button>
              </div>
            </section>

            <section className="border-t border-white/15 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-semibold inline-flex items-center gap-2"><Shield size={18} /> {translate('roles')}</h2>
                <div role="group" aria-label={translate('roleSetup')} className="inline-flex flex-wrap border border-white/20 rounded-lg overflow-hidden max-w-full">
                  {(['beginner', 'classic', 'custom'] as const).map(option => <button key={option} aria-pressed={preset === option} onClick={() => selectPreset(option)} className={`px-3 py-2 text-xs capitalize ${preset === option ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10'}`}>{translate(option)}</button>)}
                </div>
              </div>
              {preset === 'custom' && <>
                <p role="note" className="text-sm text-amber-100/70 leading-relaxed mb-4">{translate('customNotice')}</p>
                <div className="flex flex-wrap gap-2 mb-5"><button className={secondary} onClick={() => applyRolePreset('beginner')}><Users size={15} />{translate('useBasicRoles')}</button><button className={secondary} onClick={() => applyRolePreset('classic')}><Shield size={15} />{translate('useCommanderRoles')}</button></div>
                <p className={`text-sm mb-5 ${roleTotal === count ? 'text-white/60' : 'text-rose-200'}`}>{translate('roleTotal', { total: roleTotal, count })}</p>
              </>}
              <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                <div>
                  {mode === 'custom' && customConfig ? (
                    <ul className="space-y-3">
                      {availableRoles.map((role, index) => <li key={role} className="border-b border-white/10 pb-3">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <label htmlFor={`role-quantity-${index}`} className={`text-sm break-words ${factionOf(role) === 'Good' ? 'text-emerald-300' : 'text-rose-300'}`}>{roleLabels[role]}</label>
                          <input id={`role-quantity-${index}`} aria-label={translate('roleQuantity', { role: roleLabels[role] })} type="number" min="0" max={count} step="1" value={customConfig.roleCounts[role] ?? 0} onChange={event => updateQuantity(role, Number(event.target.value))} className={`${input} max-w-20 shrink-0`} />
                        </div>
                        <details className="mt-2"><summary className="cursor-pointer text-xs text-white/45">{translate('ability')}</summary><div className="pt-3"><RoleGuide role={role} language={language} mode="custom" identification={identification} /></div></details>
                      </li>)}
                    </ul>
                  ) : mode === 'basic' ? (
                    <div className="space-y-4">
                      {(['Loyal Servant', 'Minion'] as const).map(role => <details key={role} className="border-b border-white/10 py-3 text-sm"><summary className={`cursor-pointer ${factionOf(role) === 'Good' ? 'text-emerald-300' : 'text-rose-300'}`}>{roleLabels[role]}</summary><div className="pt-3"><RoleGuide role={role} language={language} mode="basic" /></div></details>)}
                    </div>
                  ) : <>
                  <details className="border-b border-white/10 py-3 text-sm"><summary className="cursor-pointer text-emerald-300">{roleLabels.Merlin} <span className="text-white/40 text-xs ml-2">{translate('required')}</span></summary><div className="pt-3"><RoleGuide role="Merlin" language={language} /></div></details>
                  <details className="border-b border-white/10 py-3 text-sm"><summary className="cursor-pointer text-rose-300">{roleLabels.Assassin} <span className="text-white/40 text-xs ml-2">{translate('required')}</span></summary><div className="pt-3"><RoleGuide role="Assassin" language={language} /></div></details>
                  {selectedRoles.map(role => <details key={role} className="border-b border-white/10 py-3 text-sm"><summary className={`cursor-pointer ${factionOf(role) === 'Good' ? 'text-emerald-300' : 'text-rose-300'}`}>{roleLabels[role]}</summary><div className="pt-3"><RoleGuide role={role} language={language} /></div></details>)}
                  </>}
                </div>
                <div className="md:border-l md:border-white/15 md:pl-8">
                  <h3 className="text-xs uppercase text-white/45 mb-4">{translate('lineup', { count })}</h3>
                  {roleError && <p role="alert" className="text-sm text-rose-200 mb-4">{localizeAvalonError(language, roleError)}</p>}
                  <ul className="space-y-3">{Object.entries(roleCounts).filter(([, total]) => (total ?? 0) > 0).map(([role, total]) => <li key={role} className="text-sm"><details><summary className="cursor-pointer"><span>{roleLabels[role as AvalonRole]}</span><span className="text-white/50 ml-3">× {total}</span></summary><div className="py-3"><RoleGuide role={role as AvalonRole} language={language} mode={mode} identification={identification} /></div></details></li>)}</ul>
                  <div className="border-t border-white/15 mt-5 pt-4 text-xs leading-relaxed text-white/50">
                    {translate(preset === 'custom' ? identification ? 'customFinalOn' : 'customFinalOff' : preset === 'beginner' ? 'beginnerSetup' : 'classicSetup')}
                    {mode === 'commander' && <p className="mt-2">{translate('advancedSetup')}</p>}
                  </div>
                </div>
              </div>
            </section>
            <section className="border-t border-white/15 py-6" aria-label={translate('customMissions')}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-lg font-semibold">{translate('customMissions')}</h2><button className={secondary} disabled={preset !== 'custom'} onClick={resetMissions}><RotateCcw size={15} />{translate('resetMissions')}</button></div>
              <div className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-xs text-white/50 mb-3"><span /><span>{translate('missionPlayers')}</span><span>{translate('missionFails')}</span></div>
              <div className="space-y-3">
                {previewMissions.map((mission, index) => <div key={index} className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
                  <span className="text-xs text-white/65">{translate('mission', { number: index + 1 })}</span>
                  <input aria-label={translate('missionPlayersInput', { number: index + 1 })} type="number" min="1" max={count} step="1" value={mission.teamSize} onChange={event => updateMission(index, 'teamSize', Number(event.target.value))} className={input} />
                  <input aria-label={translate('missionFailsInput', { number: index + 1 })} type="number" min="1" max={Math.max(1, Math.min(mission.teamSize, configuredSpies))} step="1" value={mission.failsRequired} onChange={event => updateMission(index, 'failsRequired', Number(event.target.value))} className={input} />
                </div>)}
              </div>
              {roleError && <p role="alert" className="mt-4 text-sm text-rose-200">{localizeAvalonError(language, roleError)}</p>}
            </section>
            <QuestBoard missions={previewMissions} game={null} language={language} />
            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <p className="text-xs text-white/50">{translate('approvalRule')}</p>
              <button className={primary} onClick={start} disabled={!!roleError}><Flag size={16} /> {translate('assignRoles')}</button>
            </div>
          </>
        )}

        {game && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-3 border-t border-white/15 py-4">
              <div className="flex gap-4 text-sm"><span className="text-emerald-300">{translate('resistance')} {successes} / 3</span><span className="text-rose-300">{translate('spies')} {failures} / 3</span></div>
              <button title={translate('newGame')} aria-label={translate('newGame')} onClick={() => setResetPrompt(true)} className="p-2 text-white/50 hover:text-white"><RotateCcw size={18} /></button>
            </div>
            {!privateOpen && game.phase !== 'handoff' && <QuestBoard missions={game.missions} game={game} language={language} />}

            <section className="py-8 min-h-64" aria-label={translate('currentTurn')}>
              {privatePhase && actor && (
                <div className="max-w-lg mx-auto text-center">
                  {game.phase === 'quest' && !privateOpen && <p className="text-emerald-300 text-sm mb-5">{translate('groupAccepted')}</p>}
                  <LockKeyhole className="mx-auto text-white/35 mb-4" size={28} />
                  <p className="text-xs uppercase text-white/45 mb-2">{translate(game.phase === 'reveal' ? 'roleProgress' : 'cardProgress', { current: game.phase === 'reveal' ? game.revealIndex + 1 : game.cards.length + 1, total: game.phase === 'quest' ? game.team.length : count })}</p>
                  {!privateOpen && <p className="text-sm text-white/50 mb-2">{translate('passDevice')}</p>}
                  <h2 className="text-2xl break-words mb-4">{actor.name}</h2>
                  {!privateOpen ? <button onClick={() => setPrivateOpen(true)} className={primary}><Eye size={16} /> {translate(game.phase === 'reveal' ? 'showRole' : 'openCard')}</button> : game.phase === 'reveal' ? (
                    <div>
                      <p className={`text-3xl mb-3 ${factionOf(actor.role) === 'Good' ? 'text-emerald-300' : 'text-rose-300'}`} style={{ fontFamily: 'Georgia, serif' }}>{roleLabels[actor.role]}</p>
                      <div className="mb-5"><RoleGuide role={actor.role} language={language} mode={game.mode} identification={game.finalIdentification} /></div>
                      <div className="border-y border-white/15 py-4 mb-5">
                        <h3 className="text-xs text-white/40 mb-2">{knowledge ? localizeAvalonKnowledge(language, knowledge.label) : ''}</h3>
                        <p className="text-sm break-words">{knowledge?.names.join(' / ') || translate('noKnowledge')}</p>
                      </div>
                      <button className={secondary} onClick={() => act({ type: 'reveal' })}><LockKeyhole size={16} /> {translate(game.revealIndex === count - 1 ? 'hideBegin' : 'hideNext')}</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-white/50 mb-5">{translate(factionOf(actor.role) === 'Good' ? 'goodCardRule' : 'evilCardRule')}</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button className={primary} onClick={() => act({ type: 'card', fail: false })}><Shield size={16} /> {translate('pass')}</button>
                        {factionOf(actor.role) === 'Evil' && <button className={`${button} bg-rose-200 text-[#351b23] hover:bg-rose-100`} onClick={() => act({ type: 'card', fail: true })}><Swords size={16} /> {translate('fail')}</button>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {game.phase === 'proposal' && (
                <div>
                  {lastQuest && <p className={`text-sm mb-3 ${lastQuest.succeeded ? 'text-emerald-300' : 'text-rose-300'}`}>{translate(lastQuest.succeeded ? 'passedMission' : 'failedMission', { number: lastQuest.number })} · {translate('failCount', { count: lastQuest.fails })}</p>}
                  {lastProposal && !lastProposal.approved && <p className="text-sm text-rose-200 mb-3">{translate('groupRejected')}</p>}
                  <div className="flex flex-wrap justify-between gap-3 mb-5">
                    <div className="min-w-0 max-w-full"><p className="text-xs text-white/40 mb-1">{translate('groupLeader', { number: game.quest })}</p><h2 className="text-xl flex items-center gap-2"><Crown size={20} className="text-amber-200 shrink-0" /><span className="min-w-0 break-words">{game.players[game.leader].name}</span></h2></div>
                    <div className="text-sm text-white/50">{translate('selected', { current: selectedTeam.length, total: game.missions[game.quest - 1].teamSize })}</div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mb-5">
                    {game.players.map(player => <label key={player.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer min-w-0 ${selectedTeam.includes(player.id) ? 'border-emerald-300/70 bg-emerald-300/5' : 'border-white/15'}`}>
                      <input type="checkbox" aria-label={translate('teamMember', { name: player.name })} checked={selectedTeam.includes(player.id)} disabled={!selectedTeam.includes(player.id) && selectedTeam.length === game.missions[game.quest - 1].teamSize} onChange={() => setSelectedTeam(previous => previous.includes(player.id) ? previous.filter(id => id !== player.id) : [...previous, player.id].sort((left, right) => left - right))} className="accent-emerald-300 shrink-0 w-4 h-4" />
                      <span className="text-xs text-white/35 shrink-0">{player.id + 1}</span><span className="text-sm break-words min-w-0">{player.name}</span>{player.id === game.leader && <Crown size={14} className="ml-auto text-amber-200 shrink-0" />}
                    </label>)}
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <span className="text-xs text-white/50">{translate('rejectionTrack', { count: game.rejections })} · {translate('missionThreshold', { count: game.missions[game.quest - 1].failsRequired })}</span>
                    <button className={primary} disabled={selectedTeam.length !== game.missions[game.quest - 1].teamSize} onClick={() => act({ type: 'propose', team: selectedTeam })}><Users size={16} /> {translate('presentGroup')}</button>
                  </div>
                </div>
              )}

              {game.phase === 'decision' && (
                <div className="max-w-lg mx-auto text-center">
                  <Users size={30} className="mx-auto text-white/40 mb-4" />
                  <p className="text-xs uppercase text-white/45 mb-2">{translate('mission', { number: game.quest })}</p>
                  <h2 className="text-2xl mb-3">{translate('groupDecision')}</h2>
                  <p className="text-sm text-white/60 break-words mb-6">{translate('proposedGroup', { names: game.team.map(id => game.players[id].name).join(' / ') })}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button className={primary} onClick={() => act({ type: 'decide', accepted: true })}><Check size={16} /> {translate('acceptGroup')}</button>
                    <button className={`${button} bg-rose-200 text-[#351b23] hover:bg-rose-100`} onClick={() => act({ type: 'decide', accepted: false })}><X size={16} /> {translate('rejectGroup')}</button>
                  </div>
                </div>
              )}

              {game.phase === 'handoff' && (
                <div className="max-w-lg mx-auto text-center">
                  <LockKeyhole size={30} className="mx-auto text-white/40 mb-4" />
                  <h2 className="text-2xl mb-3">{translate('returnDevice')}</h2>
                  <p className="text-sm text-white/50 mb-6">{translate('sealed')}</p>
                  <button className={primary} onClick={() => act({ type: 'publish' })}><Eye size={16} /> {translate('revealResult')}</button>
                </div>
              )}

              {game.phase === 'result' && lastQuest && (
                <div className="max-w-lg mx-auto text-center" role="status">
                  {lastQuest.succeeded ? <Shield size={32} className="mx-auto text-emerald-300 mb-4" /> : <Swords size={32} className="mx-auto text-rose-300 mb-4" />}
                  <h2 className={`text-3xl mb-3 ${lastQuest.succeeded ? 'text-emerald-300' : 'text-rose-300'}`}>{translate(lastQuest.succeeded ? 'passedMission' : 'failedMission', { number: lastQuest.number })}</h2>
                  <p className="text-lg mb-3">{translate('cardTotals', { pass: lastQuest.team.length - lastQuest.fails, fail: lastQuest.fails })}</p>
                  <p className="text-sm text-white/50 mb-3">{translate('missionThreshold', { count: game.missions[lastQuest.number - 1].failsRequired })}</p>
                  <p className="text-sm text-white/60 break-words mb-6">{translate('group', { names: lastQuest.team.map(id => game.players[id].name).join(' / ') })}</p>
                  <button className={primary} onClick={() => act({ type: 'continue' })}><Flag size={16} /> {translate(failures === 3 || successes === 3 && !game.finalIdentification ? 'viewWinner' : successes === 3 ? 'finalIdentification' : 'nextLeader')}</button>
                </div>
              )}

              {game.phase === 'assassination' && (
                <div>
                  <p className="text-emerald-300 text-sm mb-3">{translate('threePassed')}</p>
                  <h2 className="text-xl inline-flex items-center gap-2 mb-3"><Swords size={20} /> {translate('finalAssassination')}</h2>
                  <p className="text-sm text-white/60 mb-5 break-words">{translate('assassin')}: {game.players.filter(player => player.role === 'Assassin').map(player => player.name).join(' / ')} · {translate('spies')}: {game.players.filter(player => factionOf(player.role) === 'Evil').map(player => player.name).join(' / ')}</p>
                  {game.mode === 'custom' && <p className="text-xs text-amber-100/70 mb-4">{translate('customFinalOn')}</p>}
                  <fieldset className="grid sm:grid-cols-2 gap-2 mb-5"><legend className="text-xs text-white/40 mb-3">{translate('commanderCandidate')}</legend>
                    {game.players.filter(player => factionOf(player.role) === 'Good').map(player => <label key={player.id} className="flex items-center gap-3 border border-white/15 rounded-lg p-3"><input type="radio" name="assassin-target" value={player.id} checked={assassinTarget === player.id} onChange={() => setAssassinTarget(player.id)} className="accent-rose-300" /><span className="break-words text-sm">{player.name}</span></label>)}
                  </fieldset>
                  <button className={`${button} bg-rose-200 text-[#351b23] hover:bg-rose-100`} disabled={assassinTarget === null} onClick={() => assassinTarget !== null && act({ type: 'assassinate', target: assassinTarget })}><Swords size={16} /> {translate('confirmAssassination')}</button>
                </div>
              )}

              {game.phase === 'ended' && (
                <div>
                  <h2 className={`text-3xl mb-2 ${game.winner === 'Good' ? 'text-emerald-300' : 'text-rose-300'}`} style={{ fontFamily: 'Georgia, serif' }}>{translate(game.winner === 'Good' ? 'goodWins' : 'evilWins')}</h2>
                  <p className="text-sm text-white/60 mb-6">{game.ending ? localizeAvalonEnding(language, game.ending) : ''}</p>
                  <ul className="grid sm:grid-cols-2 gap-x-8 mb-6">{game.players.map(player => <li key={player.id} className="flex justify-between gap-3 border-b border-white/10 py-3 text-sm"><span className="break-words min-w-0">{player.name}{game.assassinationTarget === player.id ? ` ${translate('target')}` : ''}</span><span className={`shrink-0 ${factionOf(player.role) === 'Good' ? 'text-emerald-300' : 'text-rose-300'}`}>{roleLabels[player.role]}</span></li>)}</ul>
                  <button className={primary} onClick={reset}><RotateCcw size={16} /> {translate('backSetup')}</button>
                </div>
              )}
            </section>

            {!privateOpen && game.phase !== 'handoff' && game.proposals.length > 0 && (
              <section className="border-t border-white/15 py-5">
                <h2 className="text-sm font-semibold mb-4">{translate('publicRecord')}</h2>
                <div className="space-y-3">
                  {[...game.proposals].reverse().map((proposal, index) => <details key={game.proposals.length - index} className="border-b border-white/10 pb-3 text-sm">
                    <summary className="cursor-pointer text-white/70 break-words">{translate('mission', { number: proposal.quest })} · {game.players[proposal.leader].name} · {translate(proposal.approved ? 'accepted' : 'rejected')}</summary>
                    <p className="text-xs text-white/50 mt-3 break-words">{translate('group', { names: proposal.team.map(id => game.players[id].name).join(' / ') })}</p>
                  </details>)}
                </div>
              </section>
            )}
          </>
        )}

        {resetPrompt && <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label={translate('resetTitle')} className="w-full max-w-sm rounded-lg border border-white/20 bg-[#191e1b] p-6"><h2 className="text-lg mb-3">{translate('resetTitle')}</h2><p className="text-sm text-white/60 mb-5">{translate('resetBody')}</p><div className="flex flex-wrap gap-3"><button className={secondary} onClick={() => setResetPrompt(false)}>{translate('cancel')}</button><button className={primary} onClick={reset}><RotateCcw size={16} /> {translate('newGame')}</button></div></div></div>}
        <footer className="border-t border-white/10 pt-4 pb-2 text-[11px] text-white/35">{translate('footer')}</footer>
      </div>
    </div>
  )
}