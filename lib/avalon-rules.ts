export type AvalonRole = 'Merlin' | 'Percival' | 'Loyal Servant' | 'Assassin' | 'Morgana' | 'Mordred' | 'Oberon' | 'Minion'
export type OptionalRole = 'Percival' | 'Morgana' | 'Mordred' | 'Oberon'
export type Faction = 'Good' | 'Evil'
export type AvalonMode = 'basic' | 'commander' | 'custom'
export type AvalonPhase = 'reveal' | 'proposal' | 'vote' | 'quest' | 'handoff' | 'result' | 'assassination' | 'ended'

export interface MissionRule {
  teamSize: number
  failsRequired: number
}

export interface CustomAvalonSetup {
  roleCounts: Partial<Record<AvalonRole, number>>
  missions: MissionRule[]
}

export interface AvalonPlayer {
  id: number
  name: string
  role: AvalonRole
}

export interface QuestResult {
  number: number
  team: number[]
  fails: number
  succeeded: boolean
}

export interface ProposalResult {
  quest: number
  leader: number
  team: number[]
  votes: boolean[]
  approved: boolean
}

export interface AvalonGame {
  mode: AvalonMode
  missions: MissionRule[]
  finalIdentification: boolean
  players: AvalonPlayer[]
  phase: AvalonPhase
  revealIndex: number
  leader: number
  quest: number
  rejections: number
  team: number[]
  votes: boolean[]
  cards: boolean[]
  pendingQuest: QuestResult | null
  quests: QuestResult[]
  proposals: ProposalResult[]
  winner: Faction | null
  ending: string | null
  assassinationTarget: number | null
}

export const optionalRoles: OptionalRole[] = ['Percival', 'Morgana', 'Mordred', 'Oberon']
export const evilRoles: AvalonRole[] = ['Assassin', 'Morgana', 'Mordred', 'Oberon', 'Minion']

export const playerSetups: Record<number, { good: number; evil: number; teams: number[] }> = {
  5: { good: 3, evil: 2, teams: [2, 3, 2, 3, 3] },
  6: { good: 4, evil: 2, teams: [2, 3, 4, 3, 4] },
  7: { good: 4, evil: 3, teams: [2, 3, 3, 4, 4] },
  8: { good: 5, evil: 3, teams: [3, 4, 4, 5, 5] },
  9: { good: 6, evil: 3, teams: [3, 4, 4, 5, 5] },
  10: { good: 6, evil: 4, teams: [3, 4, 4, 5, 5] },
}

export const roleNames: Record<AvalonRole, string> = {
  Merlin: 'Commander', Percival: 'Bodyguard', 'Loyal Servant': 'Resistance Member',
  Assassin: 'Assassin', Morgana: 'False Commander', Mordred: 'Deep Cover Spy',
  Oberon: 'Blind Spy', Minion: 'Spy',
}

export const roleDescriptions: Record<AvalonRole, string> = {
  Merlin: 'Resistance. Knows the Spies, including the Blind Spy, but not the Deep Cover Spy. Must play Pass on missions. The Assassin can identify you after three successful missions.',
  Percival: 'Resistance. Sees all Commander and False Commander players without knowing which role each has. If no False Commander is in play, sees only the Commanders. Must play Pass; has no shield or power to cancel an assassination.',
  'Loyal Servant': 'Resistance. Receives no secret identities. Votes on proposed groups and must play Pass on missions.',
  Assassin: 'Spy faction. Knows the other Spies except the Blind Spy. May play Pass or Fail. After three successful missions, chooses one Resistance player as the Commander; a correct choice wins for the Spies.',
  Morgana: 'Spy faction. Appears as a Commander candidate to the Bodyguard. Knows the other Spies except the Blind Spy, and may play Pass or Fail.',
  Mordred: 'Spy faction. Hidden from the Commander, but known to the other Spies except the Blind Spy. May play Pass or Fail.',
  Oberon: 'Spy faction. Does not know the other Spies, and they do not know you. The Commander can see you. May play Pass or Fail.',
  Minion: 'Spy faction. Knows the other Spies except the Blind Spy. Votes on groups and may play Pass or Fail on missions.',
}

export const roleStrategies: Record<AvalonRole, string> = {
  Merlin: 'Guide votes toward trustworthy groups without making your knowledge obvious. Build arguments from public mission and voting records instead of announcing who the Spies are.',
  Percival: 'Compare your candidates\' votes and group choices to identify the real Commander. Protect their identity by taking attention yourself, not by openly naming them.',
  'Loyal Servant': 'Track rejected groups, votes, and failed missions. Explain your suspicions, choose groups you trust, and do not expose a player you suspect is the Commander.',
  Assassin: 'Watch for someone whose reads are unusually accurate. Discuss with your Spy teammates at the final identification, but choose only one target.',
  Morgana: 'Act like an informed Resistance player so the Bodyguard trusts you over the real Commander. A Pass card can help maintain your cover.',
  Mordred: 'Use the Commander\'s uncertainty to gain trust and join missions. Coordinate sabotage carefully; passing sometimes protects your cover.',
  Oberon: 'Infer your teammates from public behavior. Avoid assuming that another Spy knows your identity, and decide when sabotage is worth revealing suspicion.',
  Minion: 'Earn trust, join groups, and coordinate sabotage. Playing Pass is legal and can hide your allegiance; do not reveal the Assassin\'s target early.',
}

export function getSetup(count: number) {
  if (!Number.isInteger(count) || count < 5 || count > 20) throw new Error('The game requires 5-20 players.')
  if (playerSetups[count]) return playerSetups[count]
  const evil = Math.round(count * 0.4)
  return { good: count - evil, evil, teams: [0.3, 0.4, 0.4, 0.5, 0.5].map(fraction => Math.ceil(count * fraction)) }
}

export function factionOf(role: AvalonRole): Faction {
  return evilRoles.includes(role) ? 'Evil' : 'Good'
}

export function recommendedRoles(count: number, preset: 'beginner' | 'classic'): OptionalRole[] {
  getSetup(count)
  return preset === 'beginner' ? [] : ['Percival', 'Morgana']
}

export function buildRolePool(count: number, selected: readonly OptionalRole[], mode: AvalonMode = 'commander'): AvalonRole[] {
  const setup = getSetup(count)
  if (mode === 'custom') throw new Error('Provide custom roles and mission rules.')
  if (mode === 'basic' && selected.length) throw new Error('Basic Resistance has no special roles. Choose the Commander variant to add them.')
  if (new Set(selected).size !== selected.length || selected.some(role => !optionalRoles.includes(role))) {
    throw new Error('Each optional role can appear only once.')
  }
  const good: AvalonRole[] = mode === 'basic' ? [] : ['Merlin', ...selected.filter(role => factionOf(role) === 'Good')]
  const evil: AvalonRole[] = mode === 'basic' ? [] : ['Assassin', ...selected.filter(role => factionOf(role) === 'Evil')]
  if (good.length > setup.good || evil.length > setup.evil) throw new Error('Too many special roles for this faction. Remove a Spy role or add players.')
  while (good.length < setup.good) good.push('Loyal Servant')
  while (evil.length < setup.evil) evil.push('Minion')
  return [...good, ...evil]
}

export function requiredFails(count: number, quest: number): number {
  getSetup(count)
  if (!Number.isInteger(quest) || quest < 1 || quest > 5) throw new Error('Invalid quest number.')
  return count >= 7 && quest === 4 ? 2 : 1
}

export function defaultMissions(count: number): MissionRule[] {
  return getSetup(count).teams.map((teamSize, index) => ({ teamSize, failsRequired: requiredFails(count, index + 1) }))
}

export function customSetupFromPool(pool: readonly AvalonRole[], missions = defaultMissions(pool.length)): CustomAvalonSetup {
  const roleCounts: CustomAvalonSetup['roleCounts'] = {}
  for (const role of pool) roleCounts[role] = (roleCounts[role] ?? 0) + 1
  return { roleCounts, missions: missions.map(mission => ({ ...mission })) }
}

export function validateCustomSetup(count: number, custom: CustomAvalonSetup): { pool: AvalonRole[]; missions: MissionRule[] } {
  getSetup(count)
  const pool: AvalonRole[] = []
  for (const [role, quantity] of Object.entries(custom.roleCounts)) {
    if (!Object.prototype.hasOwnProperty.call(roleNames, role) || !Number.isInteger(quantity) || quantity < 0 || quantity > count) {
      throw new Error('Role quantities must be whole numbers from zero to the player count.')
    }
    pool.push(...Array<AvalonRole>(quantity).fill(role as AvalonRole))
  }
  if (pool.length !== count) throw new Error('The total role quantity must equal the player count.')
  const spies = pool.filter(role => factionOf(role) === 'Evil').length
  if (spies === 0 || spies === count) throw new Error('Include at least one Resistance player and one Spy.')
  if (custom.missions.length !== 5) throw new Error('Configure exactly five missions.')
  for (const mission of custom.missions) {
    if (!Number.isInteger(mission.teamSize) || mission.teamSize < 1 || mission.teamSize > count) {
      throw new Error('Mission group sizes must be whole numbers from one to the player count.')
    }
    if (!Number.isInteger(mission.failsRequired) || mission.failsRequired < 1 || mission.failsRequired > Math.min(mission.teamSize, spies)) {
      throw new Error('Required Fails must be whole numbers from one to the smaller of group size and Spy count.')
    }
  }
  return { pool, missions: custom.missions.map(mission => ({ ...mission })) }
}

export function createAvalon(names: readonly string[], selected: readonly OptionalRole[], leader: number, random = Math.random, mode: AvalonMode = 'commander', custom?: CustomAvalonSetup): AvalonGame {
  const cleanNames = names.map(name => name.trim())
  if (cleanNames.some(name => !name) || new Set(cleanNames.map(name => name.toLocaleLowerCase())).size !== names.length) {
    throw new Error('Enter a unique, non-empty name for every player.')
  }
  if (!Number.isInteger(leader) || leader < 0 || leader >= names.length) throw new Error('Choose a valid first leader.')
  if (mode === 'custom' && !custom) throw new Error('Provide custom roles and mission rules.')
  if (mode !== 'custom' && custom) throw new Error('Custom roles and missions require Custom mode.')
  const configured = custom ? validateCustomSetup(names.length, custom) : null
  const pool = mode === 'custom' && configured ? [...configured.pool] : buildRolePool(names.length, selected, mode)
  const missions = configured?.missions ?? defaultMissions(names.length)
  const finalIdentification = pool.includes('Merlin') && pool.includes('Assassin')
  for (let index = pool.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]]
  }
  return {
    mode,
    missions,
    finalIdentification,
    players: cleanNames.map((name, id) => ({ id, name, role: pool[id] })),
    phase: 'reveal', revealIndex: 0, leader, quest: 1, rejections: 0,
    team: [], votes: [], cards: [], pendingQuest: null, quests: [], proposals: [],
    winner: null, ending: null, assassinationTarget: null,
  }
}

export function knowledgeFor(players: readonly AvalonPlayer[], player: AvalonPlayer): { label: string; names: string[] } {
  if (player.role === 'Merlin') return {
    label: 'Known Spies (Deep Cover Spy is hidden)',
    names: players.filter(other => factionOf(other.role) === 'Evil' && other.role !== 'Mordred').map(other => other.name),
  }
  if (player.role === 'Percival') return {
    label: 'Commander / False Commander candidates',
    names: players.filter(other => other.role === 'Merlin' || other.role === 'Morgana').map(other => other.name),
  }
  if (factionOf(player.role) === 'Evil' && player.role !== 'Oberon') return {
    label: players.every(other => other.role === 'Loyal Servant' || other.role === 'Minion') ? 'Other Spies' : 'Other known Spies (Blind Spy is hidden)',
    names: players.filter(other => other.id !== player.id && factionOf(other.role) === 'Evil' && other.role !== 'Oberon').map(other => other.name),
  }
  return { label: 'Secret information', names: [] }
}

export type AvalonAction =
  | { type: 'reveal' }
  | { type: 'propose'; team: number[] }
  | { type: 'vote'; approve: boolean }
  | { type: 'card'; fail: boolean }
  | { type: 'publish' }
  | { type: 'continue' }
  | { type: 'assassinate'; target: number }

export function advanceAvalon(game: AvalonGame, action: AvalonAction): AvalonGame {
  const count = game.players.length
  if (action.type === 'reveal' && game.phase === 'reveal') {
    const revealIndex = game.revealIndex + 1
    return { ...game, revealIndex, phase: revealIndex === count ? 'proposal' : 'reveal' }
  }
  if (action.type === 'propose' && game.phase === 'proposal') {
    if (action.team.length !== game.missions[game.quest - 1].teamSize || new Set(action.team).size !== action.team.length || action.team.some(id => !Number.isInteger(id) || !game.players[id])) {
      throw new Error('Select the required number of distinct players for this quest.')
    }
    return { ...game, phase: 'vote', team: [...action.team].sort((left, right) => left - right), votes: [] }
  }
  if (action.type === 'vote' && game.phase === 'vote') {
    const votes = [...game.votes, action.approve]
    if (votes.length < count) return { ...game, votes }
    const approved = votes.filter(Boolean).length > count / 2
    const proposals = [...game.proposals, { quest: game.quest, leader: game.leader, team: [...game.team], votes, approved }]
    if (approved) return { ...game, phase: 'quest', votes, proposals, rejections: 0, cards: [] }
    const rejections = game.rejections + 1
    if (rejections === 5) return { ...game, phase: 'ended', votes: [], proposals, rejections, winner: 'Evil', ending: 'Five consecutive groups were rejected.' }
    return { ...game, phase: 'proposal', leader: (game.leader + 1) % count, rejections, proposals, votes: [], team: [] }
  }
  if (action.type === 'card' && game.phase === 'quest') {
    const player = game.players[game.team[game.cards.length]]
    if (!player || (action.fail && factionOf(player.role) === 'Good')) throw new Error('Resistance players must submit Pass.')
    const cards = [...game.cards, action.fail]
    if (cards.length < game.team.length) return { ...game, cards }
    const fails = cards.filter(Boolean).length
    const succeeded = fails < game.missions[game.quest - 1].failsRequired
    return { ...game, phase: 'handoff', cards: [], votes: [], team: [], pendingQuest: { number: game.quest, team: [...game.team], fails, succeeded } }
  }
  if (action.type === 'publish' && game.phase === 'handoff' && game.pendingQuest) {
    return { ...game, phase: 'result', quests: [...game.quests, game.pendingQuest], pendingQuest: null }
  }
  if (action.type === 'continue' && game.phase === 'result') {
    const quests = game.quests
    const next = { ...game, leader: (game.leader + 1) % count }
    if (quests.filter(result => !result.succeeded).length === 3) return { ...next, phase: 'ended', winner: 'Evil', ending: 'Three missions failed.' }
    if (quests.filter(result => result.succeeded).length === 3) return !game.finalIdentification
      ? { ...next, phase: 'ended', winner: 'Good', ending: 'Three missions succeeded.' }
      : { ...next, phase: 'assassination' }
    return { ...next, phase: 'proposal', quest: game.quest + 1 }
  }
  if (action.type === 'assassinate' && game.phase === 'assassination') {
    const target = game.players[action.target]
    if (!target || factionOf(target.role) !== 'Good') throw new Error('The Assassin must choose a Resistance player.')
    const hit = target.role === 'Merlin'
    return { ...game, phase: 'ended', assassinationTarget: target.id, winner: hit ? 'Evil' : 'Good', ending: hit ? 'The Assassin identified the Commander.' : 'Three missions succeeded and the Commander survived.' }
  }
  throw new Error('That action is not available in the current phase.')
}