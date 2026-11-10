'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Be_Vietnam_Pro } from 'next/font/google'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Dices, Eye, EyeOff, Flag, Hammer, LockKeyhole, Mountain, RotateCcw, Shield, Ship, Sparkles, Users, X } from 'lucide-react'
import {
  actingPlayer, advanceCatan, bankRate, canAfford, canMovePirate, canMoveRobber, canMoveShipTo, canRelocateShip, canRoad, canSettle, canShip,
  costs, createBoard, createCatan, createSeafarersBoard, developmentLabels, emptyHand, handSize, hasFreeRoute, islandBonus, longestRoad,
  pieceCount, playerColors, publicPoints, resourceLabels, resources, shipCount, totalPoints,
} from '@/lib/catan-rules'
import type { Action, Board, CatanVersion, Game, Hand, Resource } from '@/lib/catan-rules'
import { catanTranslator, localizeCatanMessage } from '@/lib/catan-i18n'
import type { CatanLanguage } from '@/lib/catan-i18n'
import { cityLabels, citiesPoints, goodsCount, knightAt, metropolisAt, tracks } from '@/lib/catan-cities'
import { CitiesPanel } from './cities-panel'
import styles from './table.module.css'

const vietnameseFont = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--catan-vietnamese-font',
})

const LanguageContext = createContext<CatanLanguage>('en')
const useText = () => catanTranslator(useContext(LanguageContext))
const resourceColors: Record<Resource, string> = { wood: '#426d56', brick: '#ba7759', wool: '#96ae72', grain: '#dab56c', ore: '#839398' }
const resourceGlyphs: Record<Resource, string> = { wood: '♠', brick: '▰', wool: '●', grain: '⋎', ore: '▲' }
type BuildMode = 'road' | 'ship' | 'moveShip' | 'settlement' | 'city' | null
const phaseLabels = {
  setupSettlement: 'Place a settlement', setupRoad: 'Place a connected road',
  roll: 'Roll for resources', turn: 'Trade, build & explore', discard: 'Discard resources',
  robber: 'Move the robber', steal: 'Choose who to steal from', trade: 'Review a trade',
  roads: 'Place your free roads', ended: 'An island, well built',
  cityLoss: 'Choose a city loss', cityChoice: 'Aqueduct resource',
  progressChoice: 'Choose a progress deck', progressDiscard: 'Return excess progress',
  cityTrade: 'Review a goods trade', retreat: 'Retreat your knight',
} as const satisfies Record<Game['phase'], string>

function ResourceSelect({ value, onChange, label }: { value: Resource; onChange: (value: Resource) => void; label: string }) {
  const t = useText()
  return <label className={styles.field}>{label}<select value={value} onChange={event => onChange(event.target.value as Resource)}>{resources.map(resource => <option key={resource} value={resource}>{t(resourceLabels[resource])}</option>)}</select></label>
}

function HandPicker({ title, value, onChange, max }: { title: string; value: Hand; onChange: (value: Hand) => void; max?: Hand }) {
  const t = useText()
  return <fieldset className={styles.handPicker}><legend>{title}</legend>{resources.map(resource => <label key={resource}>
    <span style={{ color: resourceColors[resource] }}>{resourceGlyphs[resource]}</span>
    <span>{t(resourceLabels[resource])}</span>
    <input aria-label={`${title}: ${t(resourceLabels[resource])}`} type="number" min={0} max={max?.[resource] ?? 99} value={value[resource]} onChange={event => onChange({ ...value, [resource]: Number(event.target.value) })} />
  </label>)}</fieldset>
}

function Cost({ cost }: { cost: Hand }) {
  const t = useText()
  return <span className={styles.cost}>{resources.filter(resource => cost[resource]).map(resource =>
    <span key={resource} title={`${cost[resource]} ${t(resourceLabels[resource])}`} style={{ color: resourceColors[resource] }}>{cost[resource]} {resourceGlyphs[resource]}<span className={styles.srOnly}>{t(resourceLabels[resource])}</span></span>
  )}</span>
}

function IslandBoard({ board, game, mode, enabled, onAction, selectedShip = null, onSelectShip }: { board: Board; game: Game | null; mode: BuildMode; enabled: boolean; onAction: (action: Action) => void; selectedShip?: number | null; onSelectShip?: (edge: number) => void }) {
  const t = useText()
  const [zoom, setZoom] = useState(false)
  const xs = board.nodes.map(node => node.x * 54)
  const ys = board.nodes.map(node => node.y * 54)
  const bounds = [Math.min(...xs) - 48, Math.min(...ys) - 46, Math.max(...xs) - Math.min(...xs) + 96, Math.max(...ys) - Math.min(...ys) + 92]
  const activeMode = game?.phase === 'setupSettlement' ? 'settlement' : game?.phase === 'setupRoad' || game?.phase === 'roads' ? mode === 'ship' ? 'ship' : 'road' : mode
  const building = game?.phase === 'turn' || game?.phase.startsWith('setup') || game?.phase === 'roads'
  const choose = (event: React.KeyboardEvent<SVGGElement>, action: Action) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onAction(action) }
  }
  return <section className={styles.boardPanel} aria-label={t('Island game board')}>
    <div className={styles.boardCaption}><span><span className={styles.liveDot} /> {board.tiles.length} {t('HEXES')} · {t(game ? 'THE SHARED ISLAND' : 'A NEW WORLD AWAITS')}</span><button onClick={() => setZoom(!zoom)} aria-pressed={zoom}>{t(zoom ? 'Fit board' : 'Enlarge')}</button></div>
    <div className={`${styles.boardScroll} ${zoom ? styles.zoomed : ''}`}>
      <svg viewBox={bounds.join(' ')} className={styles.board} aria-label={t('Hexagonal island. Select a highlighted intersection, road or tile to play.')}>
        <defs>
          <filter id="island-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity=".23" /></filter>
          <pattern id="sea-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#ffffff" opacity=".12" /></pattern>
        </defs>
        <rect x={bounds[0]} y={bounds[1]} width={bounds[2]} height={bounds[3]} fill="url(#sea-dots)" />
        {board.tiles.map(tile => {
          const valid = !!game && enabled && game.phase === 'robber' && (tile.sea ? canMovePirate(game, tile.id) : canMoveRobber(game, tile.id))
          const action: Action = { type: tile.sea ? 'pirate' : 'robber', tile: tile.id }
          const color = tile.sea ? '#387680' : tile.resource ? resourceColors[tile.resource] : '#cbb68b'
          return <g key={tile.id} role={valid ? 'button' : undefined} tabIndex={valid ? 0 : undefined} aria-label={valid ? tile.sea ? t('Move pirate to sea tile {number}', { number: tile.id + 1 }) : t('Move robber to {resource} tile {number}', { resource: tile.resource ? t(resourceLabels[tile.resource]) : t('Desert'), number: tile.id + 1 }) : undefined}
            className={valid ? styles.tileTarget : ''} onClick={valid ? () => onAction(action) : undefined} onKeyDown={valid ? event => choose(event, action) : undefined}>
            <title>{`${t(tile.sea ? 'Sea' : tile.resource ? resourceLabels[tile.resource] : 'Desert')} · ${tile.number ?? t('no production')}${game?.robber === tile.id ? t(' · robber blocks production') : ''}${game?.pirate === tile.id ? t(' · pirate blocks ships') : ''}`}</title>
            <polygon points={tile.nodes.map(id => `${board.nodes[id].x * 54},${board.nodes[id].y * 54}`).join(' ')} fill={color} stroke={valid ? '#fff1bb' : '#203e40'} strokeWidth={valid ? 4 : 2.5} strokeLinejoin="round" />
            <g opacity=".18" fill="#102c2e" transform={`translate(${tile.x * 54},${tile.y * 54 - 22})`}>
              {tile.sea ? <path d="M-30 4q8-10 16 0t16 0t16 0t16 0M-22 16q8-10 16 0t16 0t16 0" fill="none" stroke="#d4eeee" strokeWidth="2" /> : tile.resource === 'wood' ? <><path d="M-25 7l10-25L-5 7zM0 9l12-30L24 9z" /><path d="M-16 0h3v15h-3M11-2h3v17h-3" /></>
                : tile.resource === 'ore' ? <path d="M-30 12L-9-18 5 1l8-12 22 23z" />
                : tile.resource === 'brick' ? <><path d="M-26-10h21V0h-21zM0-10h22V0H0zM-15 4H7v10h-22z" /></>
                : tile.resource === 'grain' ? <path d="M-16 14v-33m0 7l-8-7m8 16l8-8M6 14v-33m0 7l8-7M6-3l-8-8M25 14v-33" stroke="#102c2e" strokeWidth="4" />
                : tile.resource === 'wool' ? <><circle cx="-16" cy="0" r="13" /><circle cx="8" cy="-7" r="13" /><circle cx="22" cy="5" r="10" /></>
                : <path d="M-30 10q15-24 30 0t30 0M-20 1q10-15 20 0t20 0" fill="none" stroke="#102c2e" strokeWidth="3" />}
            </g>
            {tile.number !== null && <g transform={`translate(${tile.x * 54},${tile.y * 54 + 10})`} filter="url(#island-shadow)">
              <circle r="16" fill="#f3e8ce" stroke="#ffffff55" />
              <text y="3" textAnchor="middle" fill={tile.number === 6 || tile.number === 8 ? '#ae4035' : '#334339'} fontSize="16" fontWeight="800">{tile.number}</text>
              <text y="11" textAnchor="middle" fill={tile.number === 6 || tile.number === 8 ? '#ae4035' : '#697165'} fontSize="7" letterSpacing="1">{'•'.repeat(6 - Math.abs(7 - tile.number))}</text>
            </g>}
            {(game ? game.robber === tile.id : tile.resource === null && !tile.sea) && <g transform={`translate(${tile.x * 54 + (tile.number ? 27 : 0)},${tile.y * 54 + 8})`}>
              <path d="M-10 14l4-16h12l4 16z" fill="#253b3c" stroke="#f3e8ce" strokeWidth="1.5" /><circle cy="-7" r="7" fill="#253b3c" stroke="#f3e8ce" strokeWidth="1.5" />
            </g>}
            {game?.pirate === tile.id && <g transform={`translate(${tile.x * 54},${tile.y * 54 + 8})`}><title>{t('Pirate')}</title><path d="M-15 4h30l-5 9h-20zM0 3v-26M2-22l15 16H2z" fill="#192b35" stroke="#f3e8ce" strokeWidth="2" /></g>}
          </g>
        })}
        {board.edges.map(edge => {
          const a = board.nodes[edge.a]; const b = board.nodes[edge.b]
          const moving = !!game && enabled && game.phase === 'turn' && activeMode === 'moveShip'
          const source = moving && selectedShip === null && canRelocateShip(game, edge.id)
          const destination = moving && selectedShip !== null && canMoveShipTo(game, selectedShip, edge.id)
          const valid = !!game && enabled && ((building && (activeMode === 'road' ? canRoad(game, edge.id) : activeMode === 'ship' && canShip(game, edge.id))) || source || destination)
          const action: Action = destination && selectedShip !== null ? { type: 'moveShip', from: selectedShip, to: edge.id } : { type: activeMode === 'ship' ? 'ship' : 'road', edge: edge.id }
          const label = source ? 'Select ship {number} to move' : destination ? 'Move ship to edge {number}' : activeMode === 'ship' ? 'Build ship {number}' : 'Build road {number}'
          const click = () => source ? onSelectShip?.(edge.id) : onAction(action)
          return <g key={edge.id} role={valid ? 'button' : undefined} tabIndex={valid ? 0 : undefined} aria-label={valid ? t(label, { number: edge.id + 1 }) : undefined} className={valid ? styles.roadTarget : ''}
            onClick={valid ? click : undefined} onKeyDown={valid ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); click() } } : undefined}>
            {(edge.owner !== null || valid) && <line x1={a.x * 54} y1={a.y * 54} x2={b.x * 54} y2={b.y * 54} stroke={edge.owner !== null ? '#243b36' : '#fff1bb'} strokeWidth={edge.owner !== null ? 10 : 5} strokeDasharray={valid ? '5 5' : undefined} strokeLinecap="round" />}
            {edge.owner !== null && <line x1={a.x * 54} y1={a.y * 54} x2={b.x * 54} y2={b.y * 54} stroke={playerColors[edge.owner]} strokeWidth="6" strokeLinecap="round" />}
            {edge.owner !== null && edge.kind === 'ship' && <g transform={`translate(${(a.x + b.x) * 27},${(a.y + b.y) * 27})`}><path d="M-11 3h22l-4 6H-7zM0 2v-17l10 14H0" fill={playerColors[edge.owner]} stroke="#142c32" strokeWidth="1.5" /><title>{t('{name}: ship', { name: game?.players[edge.owner].name ?? '' })}</title></g>}
            {valid && <><line x1={a.x * 54} y1={a.y * 54} x2={b.x * 54} y2={b.y * 54} stroke="transparent" strokeWidth="20" /><circle cx={(a.x + b.x) * 27} cy={(a.y + b.y) * 27} r="12" fill="transparent" /></>}
          </g>
        })}
        {board.nodes.map(node => {
          const valid = !!game && enabled && building && (
            activeMode === 'settlement' ? canSettle(game, node.id)
              : activeMode === 'city' && game.phase === 'turn' && node.owner === game.current && !node.city && pieceCount(game, game.current).cities < 4
          )
          const action: Action = { type: activeMode === 'city' ? 'city' : 'settlement', node: node.id }
          const knight = game ? knightAt(game, node.id) : undefined
          const metropolis = game?.cities ? metropolisAt(game, node.id) : undefined
          return <g key={node.id} transform={`translate(${node.x * 54},${node.y * 54})`}>
            {node.port && <g transform={`translate(${node.x * 6},${node.y * 6})`}><circle r="10" fill="#203d41" stroke="#b9c9ad" strokeWidth=".8" /><text textAnchor="middle" y="3" fontSize="8" fill="#f3e8ce">{node.port === 'any' ? '3:1' : `2${resourceGlyphs[node.port]}`}</text><title>{t('{trade} port', { trade: node.port === 'any' ? t('Any resource 3:1') : t('{resource} 2:1', { resource: t(resourceLabels[node.port]) }) })}</title></g>}
            <g role={valid ? 'button' : undefined} tabIndex={valid ? 0 : undefined} aria-label={valid ? t(activeMode === 'city' ? 'Upgrade city at intersection {number}' : 'Build settlement at intersection {number}', { number: node.id + 1 }) : undefined}
              onClick={valid ? () => onAction(action) : undefined} onKeyDown={valid ? event => choose(event, action) : undefined} className={valid ? styles.nodeTarget : ''}>
              {valid && <><circle r="11" fill="#fff1bb" opacity=".3" /><circle r="5.5" fill="#fff1bb" stroke="#254343" strokeWidth="2" /><circle r="15" fill="transparent" /></>}
              {node.owner !== null && <path d={node.city ? 'M-12 8v-12l6-6 6 6v3h5v-10h8v19z' : 'M-9 8V-3l9-8 9 8V8z'} fill={playerColors[node.owner]} stroke="#233d3a" strokeWidth="2.5"><title>{t('{name}: {building}', { name: game?.players[node.owner].name ?? '', building: t(node.city ? 'city' : 'settlement') })}</title></path>}
              {game?.cities?.walls.includes(node.id) && <rect x="-15" y="-15" width="30" height="27" rx="3" fill="none" stroke="#f0d7b1" strokeWidth="2" />}
              {metropolis && <path d="M-13-15l4-9 9 6 9-6 4 9z" fill="#ffda67"><title>{t('Metropolis')}</title></path>}
              {knight && <g><circle r="10" fill={playerColors[knight.owner]} stroke={knight.active ? '#fff1bb' : '#203e40'} strokeWidth="3" /><text textAnchor="middle" y="4" fontSize="12" fontWeight="800" fill="#142c2d">{knight.strength}</text><title>{t('Knight {number} · strength {strength}', { number: node.id + 1, strength: knight.strength })}</title></g>}
              {game?.cities && <text y="23" textAnchor="middle" fill="#e0e9ce" fontSize="7" pointerEvents="none">{node.id + 1}</text>}
            </g>
          </g>
        })}
      </svg>
    </div>
    <div className={styles.boardLegend}>{resources.map(resource => <span key={resource}><i style={{ background: resourceColors[resource] }} />{t(resourceLabels[resource])}</span>)}<span><i style={{ background: '#cbb68b' }} />{t('Desert')}</span>{board.tiles.some(tile => tile.sea) && <span><i style={{ background: '#387680' }} />{t('Sea')}</span>}</div>
  </section>
}

export default function CatanPage() {
  const [language, setLanguage] = useState<CatanLanguage>('en')
  const t = catanTranslator(language)
  const [count, setCount] = useState(4)
  const [version, setVersion] = useState<CatanVersion>('classic')
  const [names, setNames] = useState<string[]>(Array(6).fill(''))
  const [friendly, setFriendly] = useState(true)
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState('')
  const [privateOpen, setPrivateOpen] = useState(false)
  const [mode, setMode] = useState<BuildMode>(null)
  const [selectedShip, setSelectedShip] = useState<number | null>(null)
  const [tab, setTab] = useState<'build' | 'trade' | 'cards'>('build')
  const [give, setGive] = useState<Resource>('wood')
  const [receive, setReceive] = useState<Resource>('brick')
  const [choices, setChoices] = useState<[Resource, Resource]>(['wood', 'grain'])
  const [offer, setOffer] = useState(emptyHand)
  const [request, setRequest] = useState(emptyHand)
  const [discard, setDiscard] = useState(emptyHand)
  const [target, setTarget] = useState(0)
  const preview = useMemo(() => {
    let seed = 49
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    return version === 'seafarers' ? createSeafarersBoard(random, count > 4) : createBoard(count > 4, random)
  }, [count, version])
  useEffect(() => {
    const hide = () => setPrivateOpen(false)
    window.addEventListener('blur', hide)
    document.addEventListener('visibilitychange', hide)
    return () => { window.removeEventListener('blur', hide); document.removeEventListener('visibilitychange', hide) }
  }, [])

  const start = () => {
    try {
      setGame(createCatan(names.slice(0, count).map((name, i) => name.trim() || t('Player {number}', { number: i + 1 })), friendly, Math.random, version))
      setPrivateOpen(false); setError(''); setMode(null); setSelectedShip(null); setTab('build')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to start this game.') }
  }
  const act = (action: Action) => {
    if (!game || !privateOpen) return
    try {
      const next = advanceCatan(game, action)
      if (actingPlayer(next) !== actingPlayer(game) || next.turn !== game.turn) setPrivateOpen(false)
      setGame(next); setError(''); setMode(null); setSelectedShip(null); setDiscard(emptyHand())
      if (action.type === 'offer' || action.type === 'answer') { setOffer(emptyHand()); setRequest(emptyHand()) }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'This action could not be completed.') }
  }
  const actor = game ? game.players[actingPlayer(game)] : null
  const current = game ? game.players[game.current] : null
  const seafaring = (game?.version ?? version) === 'seafarers'
  const knightly = (game?.version ?? version) === 'cities'
  const activeMode = game?.phase === 'setupSettlement' ? 'settlement' : game?.phase === 'setupRoad' || game?.phase === 'roads' ? mode === 'ship' ? 'ship' : 'road' : mode
  const describeHand = (hand: Hand) => resources.filter(resource => hand[resource]).map(resource => `${hand[resource]} ${t(resourceLabels[resource])}`).join(', ')

  return <LanguageContext.Provider value={language}><div lang={language} className={`${styles.page} ${vietnameseFont.variable}`}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/side-projects" className={styles.back}><ArrowLeft size={15} /> {t('Side projects')}</Link>
        <div className={styles.headerTools}><span className={styles.edition}><Sparkles size={12} /> {t(knightly ? 'CITIES & KNIGHTS · CUSTOM' : seafaring ? 'SEAFARERS' : 'ENHANCED CLASSIC')}</span><span className={styles.local}><Users size={14} /> {t('LOCAL TABLE')}</span>
          <div role="group" aria-label={t('Game language')} className={styles.language}>
            {([{ value: 'en', label: 'English' }, { value: 'vi', label: 'Tiếng Việt' }] as const).map(option => <button key={option.value} type="button" lang={option.value} aria-pressed={language === option.value} onClick={() => setLanguage(option.value)}>{option.label}</button>)}
          </div>
        </div>
      </header>
      <div className={styles.titleRow}><div><p className={styles.eyebrow}>{t('GATHER AROUND. BUILD SOMETHING.')}</p><h1>Catan<span className={styles.titleDot}>.</span></h1><p className={styles.subtitle}>{t('One island. A world of possibilities.')}</p></div><div className={styles.seal}><Ship size={27} strokeWidth={1.2} /><span>{t('TRADE · BUILD')}<br />{t('SETTLE · EXPLORE')}</span></div></div>

      {error && <div role="alert" className={styles.error}><span>{localizeCatanMessage(language, error)}</span><button aria-label={t('Dismiss error')} onClick={() => setError('')}><X size={16} /></button></div>}

      {!game ? <>
        <div className={styles.lobby}>
          <div className={styles.lobbyBoard}><IslandBoard board={preview} game={null} mode={null} enabled={false} onAction={() => {}} /><div className={styles.boardNote}><Mountain size={17} /> {t('A fresh island every game. No adjacent 6s or 8s.')}</div></div>
          <section className={styles.setup}>
            <span className={styles.sectionNumber}>{t('01 / YOUR TABLE')}</span><h2>{t('Make room for everyone.')}</h2><p className={styles.muted}>{t('Pass one device around the table. Negotiate in person. Keep your resources to yourself.')}</p>
            <label className={styles.field}>{t('Game version')}<select value={version} onChange={event => {
              const next = event.target.value as CatanVersion
              setVersion(next); setError('')
            }}><option value="classic">{t('Enhanced Classic · 3–6 players')}</option><option value="seafarers">{t('Seafarers · 3–6 players')}</option><option value="cities">{t('Cities & Knights · Custom · 3–6 players')}</option></select></label>
            {knightly && <p className={styles.muted}>{t('Custom Cities & Knights: commodities, knight pieces, barbarians and metropolises. Six custom progress cards; normal clockwise turns. Not the full official expansion.')}</p>}
            {seafaring && <p className={styles.muted}>{t('Outer Islands: a custom Seafarers scenario. Start on the mainland, sail to six islands and race to 13 points. No gold fields or fog in this scenario.')}</p>}
            <fieldset className={styles.countPicker}><legend>{t('How many settlers?')}</legend>{[3, 4, 5, 6].map(value => <button key={value} aria-pressed={count === value} onClick={() => setCount(value)} className={count === value ? styles.countActive : ''}>{value}<span>{t('players')}</span></button>)}</fieldset>
            <div className={styles.nameGrid}>{Array.from({ length: count }, (_, id) => <label className={styles.nameField} key={id}><i style={{ background: playerColors[id] }} /><input aria-label={t('Player {number} name', { number: id + 1 })} maxLength={24} placeholder={t('Player {number}', { number: id + 1 })} value={names[id]} onChange={event => setNames(previous => previous.map((name, index) => index === id ? event.target.value : name))} /></label>)}</div>
            <label className={styles.toggle}><input type="checkbox" checked={friendly} onChange={event => setFriendly(event.target.checked)} /><span><strong>{t('Friendly robber')}</strong><small>{t('Protect players with 2 or fewer public points.')}</small></span><Shield size={20} /></label>
            <div className={styles.setupDetails}><span><Users size={15} /> {t(seafaring ? count > 4 ? '36 land hexes · 55 sea hexes' : '25 land hexes · 36 sea hexes' : count > 4 ? '30-hex expanded island' : '19-hex classic island')}</span><span><Flag size={15} /> {t(seafaring || knightly ? 'First to 13 points' : 'First to 10 points')}</span></div>
            <button className={styles.primary} onClick={start}>{t('Set sail')} <ArrowRight size={17} /></button>
            <p className={styles.fine}>{t('Clockwise seat order starts with Player 1. No accounts or downloads.')}</p>
          </section>
        </div>
        <section className={styles.featureStrip}><div><span>01</span><h3>{t('An island of your own')}</h3><p>{t('Random terrain, balanced high-probability tokens and coastal trading ports.')}</p></div><div><span>02</span><h3>{t('A real table, digitally')}</h3><p>{t('Hidden hands, two-way trades and private handoffs. Talk, bargain, then build.')}</p></div><div><span>03</span><h3>{t('Room to grow')}</h3><p>{t('Three modes, each for 3–6 players. Choose your version before starting.')}</p></div></section>
      </> : <>
        <div className={styles.gameBar}><div><span className={styles.liveDot} /> {game.phase.startsWith('setup') ? t('SETUP · {step} / {total}', { step: Math.min(game.setupStep + 1, count * 2), total: count * 2 }) : t('TURN {number}', { number: game.turn })}<strong style={{ color: playerColors[game.current] }}>{current?.name}</strong></div><button className={styles.textButton} onClick={() => { if (window.confirm(t('Leave this game? The match is not saved.'))) { setGame(null); setPrivateOpen(false); setError('') } }}><RotateCcw size={14} /> {t('New table')}</button></div>
        <section className={styles.players} aria-label={t('Player standings')}>{game.players.map(player => <div key={player.id} className={`${styles.player} ${game.current === player.id ? styles.currentPlayer : ''}`} style={{ borderTopColor: playerColors[player.id] }}>
          <div><i style={{ background: playerColors[player.id] }} /><strong>{player.name}</strong>{game.current === player.id && <span className={styles.turnMarker}>{t('TURN')}</span>}</div>
          <p><b>{publicPoints(game, player.id)}</b> {t('public points')} <span>{game.cities ? t('{goods} goods · {cards} progress cards', { goods: goodsCount(game, player.id), cards: game.cities.players[player.id].progress.length }) : t('{resources} resources · {cards} cards', { resources: handSize(player.hand), cards: player.cards.length })}</span></p>
          <small>{t('{settlements} settlements · {cities} cities · {roads} longest road', { settlements: pieceCount(game, player.id).settlements, cities: pieceCount(game, player.id).cities, roads: longestRoad(game, player.id) })}</small>
          {seafaring && <small>{t('{ships} ships · {bonus} island bonus points', { ships: shipCount(game, player.id), bonus: islandBonus(game, player.id) })}</small>}
          {game.cities && <small>{t('City bonus points: {points}', { points: citiesPoints(game, player.id) })} · {tracks.map(track => `${t(cityLabels[track])} ${game.cities!.players[player.id].improvements[track]}`).join(' / ')}</small>}
          {(game.longest === player.id || game.army === player.id) && <em>{game.longest === player.id ? t(seafaring ? 'Longest trade route +2 ' : 'Longest road +2 ') : ''}{game.army === player.id ? t('Largest army +2') : ''}</em>}
        </div>)}</section>
        {game.cities && <section className={styles.cityStatus} aria-label={t('Barbarian status')}>
          <strong>{t('Barbarian distance: {step}/7', { step: game.cities.barbarian })}</strong>
          <span>{t('Event: {event}', { event: game.cities.event ? t(game.cities.event === 'barbarian' ? 'Barbarians' : cityLabels[game.cities.event]) : '—' })}</span>
          <span>{t('Defense {defense} / cities {cities}', { defense: game.cities.knights.filter(knight => knight.active).reduce((sum, knight) => sum + knight.strength, 0), cities: game.board.nodes.filter(node => node.city).length })}</span>
          {!game.cities.attacked && <span>{t('Robber is dormant until the first attack.')}</span>}
        </section>}

        {game.winner !== null && <section role="status" className={styles.winner}><Flag size={28} /><h2>{t('{name} built a winning island.', { name: game.players[game.winner].name })}</h2><p>{t('{points} victory points, including hidden cards. Well played, everyone.', { points: totalPoints(game, game.winner) })}</p></section>}
        <div className={styles.gameLayout}>
          <div><IslandBoard board={game.board} game={game} mode={mode} enabled={privateOpen && game.winner === null} onAction={act} selectedShip={selectedShip} onSelectShip={setSelectedShip} />
            <div className={styles.boardNote}>{activeMode && privateOpen ? <><Hammer size={16} /> {t(activeMode === 'moveShip' ? selectedShip === null ? 'Select an open-ended ship to move.' : 'Select a highlighted destination for your ship.' : activeMode === 'ship' ? 'Select a glowing edge to build a ship.' : activeMode === 'road' ? 'Select a glowing edge to build.' : activeMode === 'city' ? 'Select a glowing intersection to upgrade.' : 'Select a glowing intersection to build.')}</> : game.phase === 'robber' && privateOpen ? <><Shield size={16} /> {t(seafaring ? 'Move the robber on land OR the pirate at sea.' : 'Select a highlighted hex to move the robber.')}</> : <><Eye size={16} /> {t(game.cities ? 'The island is public. Resources, commodities and progress cards stay private.' : 'The island is public. Resources and development cards stay private.')}</>}</div>
            <section className={styles.journal}><h2>{t('Island journal')} <span>{t('PUBLIC HISTORY')}</span></h2><ol aria-live="polite">{game.log.slice(-6).reverse().map((entry, index) => <li key={`${game.log.length}-${index}`}><span>{String(game.log.length - index).padStart(2, '0')}</span>{localizeCatanMessage(language, entry)}</li>)}</ol></section>
          </div>
          <aside className={styles.console}>
            <div className={styles.consoleHeading}><span className={styles.sectionNumber}>{t('YOUR NEXT MOVE')}</span><h2>{t(seafaring && game.phase === 'robber' ? 'Move robber or pirate' : seafaring && (game.phase === 'setupRoad' || game.phase === 'roads') ? 'Place a road or ship' : phaseLabels[game.phase])}</h2>{game.dice && <div className={styles.dice} aria-label={t('Dice {first} and {second}', { first: game.dice[0], second: game.dice[1] })}><span className={game.cities ? styles.redDie : undefined} title={game.cities ? t('First die (red): progress eligibility') : undefined}>{game.dice[0]}</span><span>{game.dice[1]}</span><b>= {game.dice[0] + game.dice[1]}</b></div>}</div>
            {game.phase !== 'ended' && !privateOpen ? <div className={styles.handoff}><div className={styles.lock}><LockKeyhole size={27} strokeWidth={1.4} /></div><p>{t('Pass the device to')}</p><h3 style={{ color: playerColors[actor!.id] }}>{actor?.name}</h3><p className={styles.muted}>{t('Only this player should see the next screen. Other players, look away.')}</p><button className={styles.primary} onClick={() => { setPrivateOpen(true); setError('') }}><Eye size={16} /> {t("I'm {name}", { name: actor?.name ?? '' })}</button><small>{t('Hands hide when you switch windows.')}</small></div>
              : game.phase !== 'ended' && actor && <>
                <div className={styles.privateLabel}><span><LockKeyhole size={12} /> {t("{name}'s private hand", { name: actor.name })}</span><button aria-label={t('Hide private hand')} onClick={() => setPrivateOpen(false)}><EyeOff size={16} /></button></div>
                <div className={styles.hand}>{resources.map(resource => <div key={resource} style={{ borderColor: `${resourceColors[resource]}88` }}><span style={{ color: resourceColors[resource] }}>{resourceGlyphs[resource]}</span><b>{actor.hand[resource]}</b><small>{t(resourceLabels[resource])}</small></div>)}</div>
                <p className={styles.privateScore}>{t('{points} total points', { points: totalPoints(game, actor.id) })} {!game.cities && <span>{t('including {cards} hidden victory cards', { cards: actor.cards.filter(card => card.type === 'victory').length })}</span>}</p>
                {game.cities && <CitiesPanel key={`${actor.id}-${game.phase}-${game.turn}`} game={game} actor={actor.id} language={language} act={act} />}
                {game.cities && game.phase.startsWith('setup') && <p className={styles.muted}>{t('Place a settlement first, then a city in reverse order. Each gets a road.')}</p>}
                {seafaring && (game.phase === 'setupRoad' || game.phase === 'roads') && <div className={styles.actionRow}>
                  <button className={styles.secondary} aria-pressed={activeMode === 'road'} onClick={() => setMode('road')}>{t('Build road')}</button>
                  <button className={styles.secondary} aria-pressed={activeMode === 'ship'} onClick={() => setMode('ship')}>{t('Build ship')}</button>
                </div>}
                {seafaring && game.phase.startsWith('setup') && <p className={styles.muted}>{t('Both starting settlements must be on the mainland. A coastal settlement can start with a free ship instead of a road.')}</p>}

                {game.phase.startsWith('setup') && <div className={styles.prompt}><h3>{t(game.phase === 'setupSettlement' ? 'Find your first foothold.' : 'Connect it to the island.')}</h3><p>{t(game.phase === 'setupSettlement' ? 'Choose a glowing intersection. Leave at least one empty intersection between all buildings.' : 'Choose an edge touching the settlement you just placed.')}</p>{game.setupStep >= game.players.length && !game.cities && <small>{t('Your second settlement provides one resource from each neighboring productive hex.')}</small>}</div>}
                {game.phase === 'roll' && <button className={styles.primary} onClick={() => act({ type: 'roll' })}><Dices size={19} /> {t('Roll the dice')}</button>}
                {!game.cities && game.phase === 'discard' && <><p className={styles.muted}>{t('You have {total} resources. Return exactly {count} to the bank.', { total: handSize(actor.hand), count: Math.floor(handSize(actor.hand) / 2) })}</p><HandPicker title={t('Discard')} value={discard} onChange={setDiscard} max={actor.hand} /><button className={styles.primary} disabled={handSize(discard) !== Math.floor(handSize(actor.hand) / 2)} onClick={() => act({ type: 'discard', hand: discard })}>{t('Return {count} cards', { count: handSize(discard) })}</button></>}
                {game.phase === 'robber' && <p className={styles.muted}>{t(seafaring ? 'Move the robber on land OR the pirate at sea.' : 'Choose another highlighted hex on the board.')}{game.friendlyRobber ? t(' Tiles bordering players with 2 or fewer public points are protected.') : ''}{t(' The robber blocks resource production.')}{seafaring && t(' The pirate blocks adjacent ship construction and movement; steal from an opponent with a ship beside it.')}</p>}
                {game.phase === 'steal' && <div className={styles.stack}>{game.victims.map(id => <button key={id} className={styles.secondary} onClick={() => act({ type: 'steal', player: id })}>{t('Steal 1 random card from {name}', { name: game.players[id].name })}</button>)}</div>}
                {game.phase === 'trade' && game.trade && <div className={styles.prompt}><h3>{t('{name} proposes', { name: current?.name ?? '' })}</h3><p>{t('You receive:')} <strong>{describeHand(game.trade.give)}</strong></p><p>{t('You give:')} <strong>{describeHand(game.trade.receive)}</strong></p><div className={styles.actionRow}><button className={styles.primary} disabled={!canAfford(actor.hand, game.trade.receive)} onClick={() => act({ type: 'answer', accept: true })}><Check size={16} /> {t('Accept')}</button><button className={styles.secondary} onClick={() => act({ type: 'answer', accept: false })}>{t('Decline')}</button></div></div>}
                {game.phase === 'roads' && <div className={styles.prompt}><p>{t(seafaring ? '{count} free roads or ships remaining.' : game.freeRoads === 1 ? '{count} free road remaining. Select a highlighted edge.' : '{count} free roads remaining. Select a highlighted edge.', { count: game.freeRoads })}</p>{!hasFreeRoute(game) && <button className={styles.secondary} onClick={() => act({ type: 'finishRoads' })}>{t('Finish road building')}</button>}</div>}

                {(game.phase === 'turn' || game.phase === 'roll') && <>
                  {!game.cities && <div className={styles.tabs} role="group" aria-label={t('Player actions')}>{(['build', 'trade', 'cards'] as const).map(value => <button key={value} aria-pressed={tab === value} className={tab === value ? styles.tabActive : ''} onClick={() => { setTab(value); setMode(null) }}>{value === 'build' ? t('Build') : value === 'trade' ? t('Trade') : t('Cards ({count})', { count: actor.cards.length })}</button>)}</div>}
                  {game.phase === 'roll' && tab !== 'cards' && <p className={styles.muted}>{t(game.cities ? 'Roll first. City actions and custom progress cards are played after rolling.' : 'Roll first to collect resources. You may play an eligible development card before rolling.')}</p>}
                  {(tab === 'build' || game.cities) && game.phase === 'turn' && <div className={styles.stack}>
                    {(['road', 'settlement', 'city'] as const).map(kind => <button key={kind} aria-pressed={mode === kind} className={`${styles.buildButton} ${mode === kind ? styles.selectedBuild : ''}`} disabled={!canAfford(actor.hand, costs[kind]) || pieceCount(game, actor.id)[kind === 'road' ? 'roads' : kind === 'city' ? 'cities' : 'settlements'] >= (kind === 'road' ? 15 : kind === 'city' ? 4 : 5)} onClick={() => setMode(mode === kind ? null : kind)}><span><Hammer size={16} /> {t(kind === 'city' ? 'Upgrade to city' : kind === 'road' ? 'Build road' : 'Build settlement')}</span><Cost cost={costs[kind]} /></button>)}
                    {!game.cities && <><button className={styles.buildButton} disabled={!canAfford(actor.hand, costs.development) || !game.deck.length} onClick={() => act({ type: 'buy' })}><span><Sparkles size={16} /> {t('Development card')}</span><Cost cost={costs.development} /></button><small className={styles.muted}>{t('{count} cards in the deck. Buy now, play on a later turn.', { count: game.deck.length })}</small></>}
                  </div>}
                  {seafaring && tab === 'build' && game.phase === 'turn' && <div className={styles.stack}>
                    <button className={`${styles.buildButton} ${mode === 'ship' ? styles.selectedBuild : ''}`} aria-pressed={mode === 'ship'} disabled={!canAfford(actor.hand, costs.ship) || shipCount(game, actor.id) >= 15 || !game.board.edges.some(edge => canShip(game, edge.id))} onClick={() => { setMode(mode === 'ship' ? null : 'ship'); setSelectedShip(null) }}><span><Ship size={16} /> {t('Build ship')}</span><Cost cost={costs.ship} /></button>
                    <button className={styles.secondary} aria-pressed={mode === 'moveShip'} disabled={!game.board.edges.some(edge => canRelocateShip(game, edge.id))} onClick={() => { setMode(mode === 'moveShip' ? null : 'moveShip'); setSelectedShip(null) }}>{t('Move a ship')}</button>
                    <small className={styles.muted}>{t('Move at most one older open-ended ship per turn, after rolling. Ships beside the pirate cannot be built or moved.')}</small>
                  </div>}
                  {tab === 'trade' && game.phase === 'turn' && <div className={styles.stack}><h3>{t('Maritime trade')}</h3><div className={styles.twoCols}><ResourceSelect label={t('Give {count}', { count: bankRate(game, actor.id, give) })} value={give} onChange={setGive} /><ResourceSelect label={t('Receive 1')} value={receive} onChange={setReceive} /></div><button className={styles.secondary} disabled={give === receive || actor.hand[give] < bankRate(game, actor.id, give) || game.bank[receive] < 1} onClick={() => act({ type: 'bank', give, receive })}><Ship size={16} /> {t('Trade with bank')}</button><hr /><h3>{t('Trade with a player')}</h3><label className={styles.field}>{t('Send offer to')}<select value={target === actor.id ? (actor.id + 1) % game.players.length : target} onChange={event => setTarget(Number(event.target.value))}>{game.players.filter(player => player.id !== actor.id).map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label><HandPicker title={t('You give')} value={offer} onChange={setOffer} max={actor.hand} /><HandPicker title={t('You receive')} value={request} onChange={setRequest} /><button className={styles.primary} onClick={() => act({ type: 'offer', target: target === actor.id ? (actor.id + 1) % game.players.length : target, give: offer, receive: request })}>{t('Propose trade')} <ArrowRight size={16} /></button></div>}
                  {tab === 'cards' && <div className={styles.stack}>{!actor.cards.length && <p className={styles.muted}>{t('No development cards yet. Buy one with wool, grain and ore.')}</p>}<div className={styles.twoCols}><ResourceSelect label={t('Card resource 1')} value={choices[0]} onChange={value => setChoices([value, choices[1]])} /><ResourceSelect label={t('Card resource 2')} value={choices[1]} onChange={value => setChoices([choices[0], value])} /></div><small className={styles.muted}>{t('Year of Plenty takes both choices. Monopoly uses the first.')}</small>{actor.cards.map(card => <div key={card.id} className={styles.devCard}><div><Sparkles size={16} /><strong>{t(developmentLabels[card.type])}</strong></div><p>{t(card.type === 'knight' ? seafaring ? 'Move either robber or pirate and steal. Three knights can earn Largest Army.' : 'Move the robber and steal. Three knights can earn Largest Army.' : card.type === 'roads' ? seafaring ? 'Build two roads, two ships, or one of each for free.' : 'Build two connected roads at no resource cost.' : card.type === 'plenty' ? 'Take two available resources of your choice from the bank.' : card.type === 'monopoly' ? 'Collect all resources of one kind from the other players.' : 'One hidden point. Counts automatically toward victory.')}</p>{card.type !== 'victory' && <button className={styles.secondary} disabled={game.playedCard || card.boughtOn === game.turn} onClick={() => act({ type: 'card', id: card.id, choices: card.type === 'plenty' ? choices : [choices[0]] })}>{t(card.boughtOn === game.turn ? 'Available next turn' : game.playedCard ? 'One card per turn' : 'Play card')} <ChevronRight size={14} /></button>}</div>)}</div>}
                  {game.phase === 'turn' && <button className={styles.endTurn} onClick={() => act({ type: 'end' })}>{t('End turn & pass device')} <ArrowRight size={17} /></button>}
                </>}
              </>}
            <div className={styles.bank}><h3>{t('Bank inventory')}</h3>{resources.map(resource => <span key={resource} title={t(resourceLabels[resource])}><i style={{ color: resourceColors[resource] }}>{resourceGlyphs[resource]}</i>{game.bank[resource]}</span>)}{game.cities && (['paper', 'cloth', 'coin'] as const).map(good => <span key={good}>{t(cityLabels[good])}: {game.cities!.bank[good]}</span>)}</div>
          </aside>
        </div>
      </>}

      {seafaring && <details className={styles.rules} open><summary><Ship size={17} /><span>{t('Seafarers · Outer Islands')}</span></summary><div className={styles.ruleGrid}>
        <div><h3>{t('Ships and sea routes')}</h3><p>{t('A ship costs 1 wood and 1 wool; each player has 15. Build on a sea/coastal edge connected to your ship or coastal building. Roads and ships join only at your settlement or city. Both starting settlements stay on the mainland; a coastal setup route may be a ship.')}</p><p>{t('Move at most one older open-ended ship per turn, after rolling. Ships beside the pirate cannot be built or moved.')}</p></div>
        <div><h3>{t('Pirate and development cards')}</h3><p>{t('On a 7 or a Knight, move either the robber on land or the pirate at sea, not both. The pirate blocks adjacent ship construction and movement, not production or route points. Steal from an opponent with a ship beside the pirate. Friendly robber protects land only. Road Building gives any combination of two roads and ships.')}</p></div>
        <div><h3>{t('New islands, new points')}</h3><p>{t('Your first settlement on each offshore island earns 2 bonus points, once per island per player. Ships and roads count toward Longest Trade Route, but switch type only at your own building. Reach 13 points on your own turn to win. This original 3–6-player scenario has six visible resource islands, no gold fields and no fog; it is not an official scenario layout.')}</p><p>{t('For 5–6 players: a 30-hex mainland, six offshore islands, 55 sea hexes, 24 of each resource and 34 development cards. Normal clockwise turns; no special building phase. This is a custom variant, not the official extension.')}</p></div>
      </div></details>}
      {knightly && <details className={styles.rules} open><summary><Shield size={17} /><span>{t('Cities & Knights: custom rules')}</span></summary><div className={styles.ruleGrid}>
        <div><h3>{t('City improvements & walls')}</h3><p>{t('Start with one settlement and one city. Cities on wood, wool and ore produce one resource plus paper, cloth or coin; brick and grain cities produce two resources. Science, Trade and Politics cost 1–5 matching commodities. Level three unlocks aqueduct, 2:1 commodity trading or mighty knights; levels four/five compete for metropolises worth two extra points.')}</p><p>{t('Recruit and promote with ore + wool; activate with grain. Active knights defend immediately but move, displace or drive the robber only from your next turn. Opposing knights interrupt roads. Three walls maximum, each costing two brick and raising the safe goods limit by two.')}</p></div>
        <div><h3>{t('Barbarians')}</h3><p>{t('Three event-die faces advance barbarians; three award progress by improvement level and the first (red) die. At seven advances, resolve production and any discards/robber first, then compare active strength with city count. Strongest sole defender gains a point; tied leaders choose progress. On defeat, weakest eligible owners each lose one non-metropolis city and its wall. All knights deactivate. The robber sleeps until this first attack, but seven still discards goods.')}</p></div>
        <div><h3>{t('CITIES & KNIGHTS · CUSTOM')}</h3><p>{t('This is a custom 3–6-player, clockwise variant, not the complete official expansion. Six custom progress types in three recycling decks; at most four held, playable after rolling, including immediately. No merchant or development cards, no Largest Army. Longest Road still scores two. Win at 13 on your turn. If all five settlements are used when losing a city, remove it instead.')}</p></div>
      </div></details>}
      {!knightly && <details className={styles.rules}><summary><BookOpen size={17} /><span>{t('A field guide to the island')}</span><span>{t('RULES & ENHANCEMENTS')}</span></summary><div className={styles.ruleGrid}>
        <div><h3>{t('The first foothold')}</h3><p>{t('Each player places a settlement and road, then repeats in reverse order. Your second settlement gives starting resources. Buildings must have an empty intersection between them. The first named player begins.')}</p><h3>{t('Grow your island')}</h3><p>{t('Roll two dice; matching hexes produce 1 resource per settlement or 2 per city, unless blocked by the robber. Then trade, build, buy cards or play one older action card. Only the player whose turn it is can win at {points} points.', { points: seafaring ? 13 : 10 })}</p></div>
        <div><h3>{t('Seven changes everything')}</h3><p>{t('On a 7, everyone with more than 7 resource cards discards half, rounded down. The active player moves the robber to another hex and steals one random resource from a neighboring opponent. Friendly robber optionally protects anyone with at most 2 public points.')}</p><h3>{t('Trade winds')}</h3><p>{t('Bank trades start at 4:1. Settle at a coastal port for 3:1 in any resource or 2:1 in its pictured resource. Player trades require a private acceptance. If several players need more of a resource than the bank has, none receive it; a sole recipient gets what remains.')}</p></div>
        <div><h3>{t('Paths to victory')}</h3><p>{t('Settlements score 1, cities 2. Longest Road (at least 5 uninterrupted edges) and Largest Army (at least 3 played knights) each award 2 points. The existing holder keeps a tied award. Hidden victory cards add 1 each. Opposing buildings interrupt roads.')}</p><h3>{t('Enhanced, not an official edition')}</h3><p>{t(seafaring ? 'Outer Islands: a custom Seafarers scenario. Start on the mainland, sail to six islands and race to 13 points. No gold fields or fog in this scenario.' : 'No adjacent 6/8 tokens. The 5–6-player mode uses a 30-hex board, extra resources and development cards, with normal clockwise turns. No special building phase. These are labeled house rules, not an official extension. Standard mode and expansions are planned separately.')}</p></div>
      </div></details>}
      <footer className={styles.footer}><span>{t('DESIGNED FOR AROUND THE TABLE')}</span><p>{t('Unofficial fan-made implementation. Original visuals and interface; not affiliated with or endorsed by CATAN. Pass-and-play privacy relies on trusted players. State stays in browser memory: reload or leaving ends the match.')}</p></footer>
    </div>
  </div></LanguageContext.Provider>
}
