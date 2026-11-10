import type { Game, Resource } from './catan-rules'

export const commodities = ['paper', 'cloth', 'coin'] as const
export type Commodity = typeof commodities[number]
export type Good = Resource | Commodity
export const goods = ['wood', 'brick', 'wool', 'grain', 'ore', ...commodities] as const
export const tracks = ['science', 'trade', 'politics'] as const
export type Track = typeof tracks[number]
export const trackCommodity = { science: 'paper', trade: 'cloth', politics: 'coin' } as const
export const progressTypes = ['supply', 'engineer', 'fleet', 'monopoly', 'mobilize', 'bishop'] as const
export type Progress = typeof progressTypes[number]
const trackCards: Record<Track, Progress[]> = {
  science: ['supply', 'engineer'], trade: ['fleet', 'monopoly'], politics: ['mobilize', 'bishop'],
}
export const cityLabels = {
  paper: 'Paper', cloth: 'Cloth', coin: 'Coin',
  science: 'Science', trade: 'Trade', politics: 'Politics',
  supply: 'Supply', engineer: 'Engineer', fleet: 'Trade fleet',
  monopoly: 'Resource monopoly', mobilize: 'Mobilization', bishop: 'Bishop',
} as const
export interface Knight { owner: number; node: number; strength: number; active: boolean; readyOn: number; promotedOn: number }
export interface CitiesState {
  bank: Record<Commodity, number>
  players: {
    commodities: Record<Commodity, number>
    improvements: Record<Track, number>
    progress: Progress[]
    defender: number
    fleet: Good | null
  }[]
  knights: Knight[]
  walls: number[]
  metropolis: Record<Track, number | null>
  barbarian: number
  attacked: boolean
  event: Track | 'barbarian' | null
  pendingAttack: boolean
  losses: number[]
  choices: number[]
  progressChoices: number[]
  discards: number[]
  retreat: { knight: Knight; from: number; resume: 'turn' } | null
  trade: { target: number; give: Good; giveCount: number; receive: Good; receiveCount: number } | null
  decks: Record<Track, Progress[]>
  used: Record<Track, Progress[]>
}
export type CitiesAction =
  | { type: 'cityDiscard'; amounts: Record<Good, number> }
  | { type: 'cityChoice'; resource: Resource }
  | { type: 'cityLoss' | 'wall' | 'recruit'; node: number }
  | { type: 'activate' | 'promote' | 'driveRobber'; node: number }
  | { type: 'knightMove'; from: number; to: number }
  | { type: 'retreat'; to: number | null }
  | { type: 'improve'; track: Track; node: number }
  | { type: 'progress'; card: Progress; resource: Resource; node: number }
  | { type: 'progressChoice'; track: Track }
  | { type: 'progressDiscard'; index: number }
  | { type: 'goodsBank'; give: Good; receive: Good }
  | { type: 'goodsOffer'; target: number; give: Good; receive: Good; giveCount: number; receiveCount: number }
  | { type: 'goodsAnswer'; accept: boolean }

export function isCitiesAction(action: { type: string }): action is CitiesAction {
  return ['cityDiscard', 'cityChoice', 'cityLoss', 'wall', 'recruit', 'activate', 'promote', 'driveRobber', 'knightMove', 'retreat', 'improve', 'progress', 'progressChoice', 'progressDiscard', 'goodsBank', 'goodsOffer', 'goodsAnswer'].includes(action.type)
}

function rule(condition: unknown, text: string): asserts condition {
  if (!condition) throw new Error(text)
}
function log(game: Game, text: string) { game.log = [...game.log.slice(-59), text] }
function shuffled<T>(values: T[], random: () => number) {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export function createCities(count: number, random: () => number): CitiesState {
  return {
    bank: { paper: count > 4 ? 24 : 19, cloth: count > 4 ? 24 : 19, coin: count > 4 ? 24 : 19 },
    players: Array.from({ length: count }, () => ({
      commodities: { paper: 0, cloth: 0, coin: 0 }, improvements: { science: 0, trade: 0, politics: 0 },
      progress: [], defender: 0, fleet: null,
    })),
    knights: [], walls: [], metropolis: { science: null, trade: null, politics: null },
    barbarian: 0, attacked: false, event: null, pendingAttack: false,
    losses: [], choices: [], progressChoices: [], discards: [], retreat: null, trade: null,
    decks: Object.fromEntries(tracks.map(track => [track, shuffled(Array.from({ length: 6 }, () => trackCards[track]).flat(), random)])) as Record<Track, Progress[]>,
    used: { science: [], trade: [], politics: [] },
  }
}
export function cityState(game: Game): CitiesState {
  rule(game.cities, 'Cities & Knights mode is required.')
  return game.cities
}
const isCommodity = (good: Good): good is Commodity => (commodities as readonly string[]).includes(good)
export function goodAmount(game: Game, player: number, good: Good): number {
  return isCommodity(good) ? cityState(game).players[player].commodities[good] : game.players[player].hand[good]
}
export function bankAmount(game: Game, good: Good): number {
  return isCommodity(good) ? cityState(game).bank[good] : game.bank[good]
}
function changeGood(game: Game, player: number, good: Good, amount: number) {
  if (isCommodity(good)) cityState(game).players[player].commodities[good] += amount
  else game.players[player].hand[good] += amount
}
function changeBank(game: Game, good: Good, amount: number) {
  if (isCommodity(good)) cityState(game).bank[good] += amount
  else game.bank[good] += amount
}
export function takeGood(game: Game, player: number, good: Good, amount: number) {
  rule(bankAmount(game, good) >= amount, 'The bank lacks the selected goods.')
  changeBank(game, good, -amount); changeGood(game, player, good, amount)
}
function payGood(game: Game, player: number, good: Good, amount: number) {
  rule(goodAmount(game, player, good) >= amount, 'Not enough resources or commodities.')
  changeGood(game, player, good, -amount); changeBank(game, good, amount)
}
export const goodsCount = (game: Game, player: number) => goods.reduce((sum, good) => sum + goodAmount(game, player, good), 0)
export const cityLimit = (game: Game, player: number) => 7 + cityState(game).walls.filter(id => game.board.nodes[id].owner === player).length * 2
export function metropolisAt(game: Game, node: number): Track | undefined {
  return tracks.find(track => cityState(game).metropolis[track] === node)
}
export function citiesPoints(game: Game, player: number) {
  const state = cityState(game)
  return state.players[player].defender + tracks.filter(track => {
    const node = state.metropolis[track]
    return node !== null && game.board.nodes[node].owner === player
  }).length * 2
}
export const knightAt = (game: Game, node: number) => game.cities?.knights.find(knight => knight.node === node)
export function canRecruit(game: Game, node: number) {
  const vertex = game.board.nodes[node]
  return !!game.cities && !!vertex && vertex.owner === null && !knightAt(game, node)
    && vertex.edges.some(id => game.board.edges[id].owner === game.current)
    && game.cities.knights.filter(knight => knight.owner === game.current && knight.strength === 1).length < 2
}
function knightPath(game: Game, from: number, to: number) {
  const seen = new Set([from]); const queue = [from]
  while (queue.length) {
    const node = game.board.nodes[queue.pop()!]
    for (const id of node.edges) {
      const edge = game.board.edges[id]
      if (edge.owner !== game.current) continue
      const next = edge.a === node.id ? edge.b : edge.a
      if (seen.has(next)) continue
      if (next === to) return true
      if (game.board.nodes[next].owner === null && !knightAt(game, next)) { seen.add(next); queue.push(next) }
    }
  }
  return false
}
export function canKnightMove(game: Game, from: number, to: number) {
  const knight = knightAt(game, from); const target = game.board.nodes[to]
  if (!knight || knight.owner !== game.current || !knight.active || knight.readyOn > game.turn || !target || target.owner !== null || from === to) return false
  const other = knightAt(game, to)
  return (!other || other.owner !== game.current && other.strength < knight.strength) && knightPath(game, from, to)
}
export function retreatOptions(game: Game) {
  const state = cityState(game); const retreat = state.retreat
  if (!retreat) return []
  const copy = structuredClone(game)
  copy.current = retreat.knight.owner
  return copy.board.nodes.filter(node => node.owner === null && !knightAt(copy, node.id) && knightPath(copy, retreat.from, node.id)).map(node => node.id)
}
function drawProgress(game: Game, player: number, track: Track, random: () => number) {
  const state = cityState(game)
  if (!state.decks[track].length) {
    state.decks[track] = shuffled(state.used[track], random); state.used[track] = []
  }
  const card = state.decks[track].pop()
  if (card) state.players[player].progress.push(card)
  else log(game, 'This progress deck is empty; no card was drawn.')
}
export function resolveBarbarians(game: Game) {
  const state = cityState(game)
  const cities = game.board.nodes.filter(node => node.city)
  const strengths = game.players.map(player => state.knights.filter(knight => knight.owner === player.id && knight.active).reduce((sum, knight) => sum + knight.strength, 0))
  const defense = strengths.reduce((sum, strength) => sum + strength, 0)
  if (defense >= cities.length) {
    const best = Math.max(...strengths)
    const leaders = game.players.filter(player => strengths[player.id] === best && best > 0)
    if (leaders.length === 1) state.players[leaders[0].id].defender++
    else state.progressChoices = leaders.map(player => player.id)
    log(game, 'The knights defeated the barbarians.')
  } else {
    const vulnerable = game.players.filter(player => cities.some(node => node.owner === player.id && !metropolisAt(game, node.id)))
    const weakest = Math.min(...vulnerable.map(player => strengths[player.id]))
    state.losses = vulnerable.filter(player => strengths[player.id] === weakest).map(player => player.id)
    log(game, 'The barbarians won. The weakest unprotected cities must be downgraded.')
  }
  state.knights.forEach(knight => { knight.active = false })
  state.barbarian = 0; state.attacked = true; state.pendingAttack = false
}
export function rollCitiesEvent(game: Game, random: () => number) {
  const state = cityState(game)
  const event = Math.floor(random() * 6)
  state.event = event < 3 ? 'barbarian' : tracks[event - 3]
  if (state.event === 'barbarian') {
    state.barbarian++
    if (state.barbarian === 7) state.pendingAttack = true
  } else {
    for (const player of game.players) {
      const level = state.players[player.id].improvements[state.event]
      if (level > 0 && game.dice![0] <= level + 1) drawProgress(game, player.id, state.event, random)
    }
  }
}
export function continueCities(game: Game) {
  if (!game.cities || game.phase !== 'turn') return
  const state = game.cities
  if (state.pendingAttack) resolveBarbarians(game)
  if (state.choices.length && !goods.slice(0, 5).some(good => bankAmount(game, good) > 0)) {
    state.choices = []
    log(game, 'Aqueduct choices ended because the resource bank is empty.')
  }
  state.discards = game.players.filter(player => state.players[player.id].progress.length > 4).map(player => player.id)
  if (state.losses.length) game.phase = 'cityLoss'
  else if (state.progressChoices.length) game.phase = 'progressChoice'
  else if (state.choices.length) game.phase = 'cityChoice'
  else if (state.discards.length) game.phase = 'progressDiscard'
}
export function citiesActor(game: Game) {
  const state = cityState(game)
  if (game.phase === 'cityLoss') return state.losses[0]
  if (game.phase === 'cityChoice') return state.choices[0]
  if (game.phase === 'progressChoice') return state.progressChoices[0]
  if (game.phase === 'progressDiscard') return state.discards[0]
  if (game.phase === 'cityTrade') return state.trade!.target
  if (game.phase === 'retreat') return state.retreat!.knight.owner
  return game.current
}
export function goodsRate(game: Game, good: Good) {
  const state = cityState(game)
  if (state.players[game.current].fleet === good || isCommodity(good) && state.players[game.current].improvements.trade >= 3) return 2
  const ports = game.board.nodes.filter(node => node.owner === game.current).map(node => node.port)
  if (!isCommodity(good) && ports.includes(good)) return 2
  return ports.includes('any') ? 3 : 4
}
export function advanceCities(game: Game, action: CitiesAction, random: () => number) {
  const state = cityState(game); const player = state.players[game.current]
  const phase = (...phases: Game['phase'][]) => rule(phases.includes(game.phase), 'Finish the current step first.')
  switch (action.type) {
    case 'cityDiscard': {
      phase('discard')
      const actor = game.discards[0]
      rule(goods.every(good => Number.isSafeInteger(action.amounts[good]) && action.amounts[good] >= 0 && action.amounts[good] <= goodAmount(game, actor, good))
        && goods.reduce((sum, good) => sum + action.amounts[good], 0) === Math.floor(goodsCount(game, actor) / 2), 'Discard exactly half your goods, rounded down.')
      for (const good of goods) payGood(game, actor, good, action.amounts[good])
      game.discards.shift()
      if (!game.discards.length) game.phase = state.attacked ? 'robber' : 'turn'
      log(game, 'A player returned half their goods to the bank.')
      break
    }
    case 'cityLoss': {
      phase('cityLoss')
      const actor = state.losses[0]; const node = game.board.nodes[action.node]
      rule(node?.owner === actor && node.city && !metropolisAt(game, node.id), 'Choose one of your cities without a metropolis.')
      const settlements = game.board.nodes.filter(other => other.owner === actor && !other.city).length
      node.city = false
      if (settlements >= 5) node.owner = null
      state.walls = state.walls.filter(id => id !== node.id)
      state.losses.shift(); game.phase = 'turn'
      log(game, 'A city fell to the barbarians.')
      break
    }
    case 'cityChoice': {
      phase('cityChoice')
      rule(['wood', 'brick', 'wool', 'grain', 'ore'].includes(action.resource), 'Choose a resource.')
      takeGood(game, state.choices[0], action.resource, 1)
      state.choices.shift(); game.phase = 'turn'
      break
    }
    case 'progressChoice':
      phase('progressChoice')
      rule(tracks.includes(action.track), 'Choose a city improvement track.')
      drawProgress(game, state.progressChoices.shift()!, action.track, random); game.phase = 'turn'
      break
    case 'progressDiscard': {
      phase('progressDiscard')
      const actor = state.discards[0]; const cards = state.players[actor].progress
      rule(Number.isInteger(action.index) && action.index >= 0 && action.index < cards.length, 'Choose a progress card to return.')
      const [card] = cards.splice(action.index, 1)
      state.used[tracks.find(track => trackCards[track].includes(card))!].push(card)
      game.phase = 'turn'
      break
    }
    case 'wall': {
      phase('turn')
      const node = game.board.nodes[action.node]
      rule(node?.owner === game.current && node.city && !state.walls.includes(node.id) && state.walls.filter(id => game.board.nodes[id].owner === game.current).length < 3, 'Choose an unwalled city; at most three walls.')
      payGood(game, game.current, 'brick', 2); state.walls.push(node.id)
      log(game, 'A city wall raised its owner’s safe hand limit by two.')
      break
    }
    case 'recruit':
      phase('turn')
      rule(canRecruit(game, action.node), 'Recruit a basic knight on an empty intersection along your road; at most two of each strength.')
      payGood(game, game.current, 'ore', 1); payGood(game, game.current, 'wool', 1)
      state.knights.push({ owner: game.current, node: action.node, strength: 1, active: false, readyOn: game.turn + 1, promotedOn: -1 })
      log(game, 'A basic knight joined the island.')
      break
    case 'activate': {
      phase('turn')
      const knight = knightAt(game, action.node)
      rule(knight?.owner === game.current && !knight.active, 'Choose your inactive knight.')
      payGood(game, game.current, 'grain', 1)
      knight.active = true; knight.readyOn = game.turn + 1
      log(game, 'A knight was activated for defense.')
      break
    }
    case 'promote': {
      phase('turn')
      const knight = knightAt(game, action.node)
      rule(knight?.owner === game.current && knight.strength < 3 && knight.promotedOn !== game.turn
        && (knight.strength < 2 || player.improvements.politics >= 3)
        && state.knights.filter(other => other.owner === game.current && other.strength === knight.strength + 1).length < 2, 'Promote once per turn; mighty knights require Politics level three and an available piece.')
      payGood(game, game.current, 'ore', 1); payGood(game, game.current, 'wool', 1)
      knight.strength++; knight.promotedOn = game.turn
      log(game, 'A knight was promoted.')
      break
    }
    case 'driveRobber': {
      phase('turn')
      const knight = knightAt(game, action.node)
      rule(state.attacked && knight?.owner === game.current && knight.active && knight.readyOn <= game.turn && game.board.tiles[game.robber].nodes.includes(knight.node), 'Use an older active knight beside the robber, after the first barbarian attack.')
      knight.active = false; game.resume = 'turn'; game.phase = 'robber'
      break
    }
    case 'knightMove': {
      phase('turn')
      rule(canKnightMove(game, action.from, action.to), 'Move an older active knight along your roads to an empty intersection or a weaker opposing knight.')
      const knight = knightAt(game, action.from)!; const other = knightAt(game, action.to)
      if (other) {
        state.knights = state.knights.filter(piece => piece !== other)
        state.retreat = { knight: other, from: action.to, resume: 'turn' }
      }
      knight.node = action.to; knight.active = false
      log(game, 'A knight moved along its roads.')
      if (other && retreatOptions(game).length) game.phase = 'retreat'
      else {
        state.retreat = null
        if (other) log(game, 'A displaced knight had no retreat and left the board.')
      }
      break
    }
    case 'retreat': {
      phase('retreat')
      const options = retreatOptions(game)
      rule(action.to === null ? !options.length : options.includes(action.to), 'Retreat along your roads to a legal empty intersection.')
      if (action.to !== null) state.knights.push({ ...state.retreat!.knight, node: action.to })
      state.retreat = null; game.phase = 'turn'
      break
    }
    case 'improve': {
      phase('turn')
      rule(tracks.includes(action.track), 'Choose a city improvement track.')
      const level = player.improvements[action.track]
      rule(level < 5 && game.board.nodes.some(node => node.owner === game.current && node.city), 'City improvements require a city and stop at level five.')
      const holder = state.metropolis[action.track]
      const holderOwner = holder === null ? null : game.board.nodes[holder].owner
      const claim = level + 1 >= 4 && holderOwner !== game.current && (holderOwner === null || level + 1 > state.players[holderOwner].improvements[action.track])
      if (claim) rule(game.board.nodes[action.node]?.owner === game.current && game.board.nodes[action.node].city && !metropolisAt(game, action.node), 'Choose your city without a metropolis to claim this metropolis.')
      payGood(game, game.current, trackCommodity[action.track], level + 1)
      player.improvements[action.track]++
      if (claim) state.metropolis[action.track] = action.node
      log(game, 'A city improvement advanced.')
      break
    }
    case 'progress': {
      phase('turn')
      const index = player.progress.indexOf(action.card)
      rule(index >= 0, 'Choose a progress card in your hand.')
      rule(['wood', 'brick', 'wool', 'grain', 'ore'].includes(action.resource), 'Choose a resource.')
      switch (action.card) {
        case 'supply': takeGood(game, game.current, action.resource, 2); break
        case 'engineer': {
          const node = game.board.nodes[action.node]
          rule(node?.owner === game.current && node.city && !state.walls.includes(node.id) && state.walls.filter(id => game.board.nodes[id].owner === game.current).length < 3, 'Choose an unwalled city; at most three walls.')
          state.walls.push(node.id); break
        }
        case 'fleet': player.fleet = action.resource; break
        case 'monopoly':
          for (const other of game.players.filter(other => other.id !== game.current)) {
            const count = Math.min(2, other.hand[action.resource])
            other.hand[action.resource] -= count; game.players[game.current].hand[action.resource] += count
          }
          break
        case 'mobilize':
          state.knights.filter(knight => knight.owner === game.current && !knight.active).forEach(knight => { knight.active = true; knight.readyOn = game.turn + 1 })
          break
        case 'bishop':
          rule(state.attacked, 'The robber stays still until the first barbarian attack.')
          game.resume = 'turn'; game.phase = 'robber'; break
      }
      player.progress.splice(index, 1)
      state.used[tracks.find(track => trackCards[track].includes(action.card))!].push(action.card)
      log(game, 'A progress card was played.')
      break
    }
    case 'goodsBank': {
      phase('turn')
      rule(goods.includes(action.give) && goods.includes(action.receive) && action.give !== action.receive, 'Choose two different goods.')
      const rate = goodsRate(game, action.give)
      rule(bankAmount(game, action.receive) > 0, 'The bank lacks the selected goods.')
      payGood(game, game.current, action.give, rate); takeGood(game, game.current, action.receive, 1)
      log(game, 'Goods were traded with the bank.')
      break
    }
    case 'goodsOffer':
      phase('turn')
      rule(game.players[action.target] && action.target !== game.current && goods.includes(action.give) && goods.includes(action.receive) && action.give !== action.receive
        && Number.isSafeInteger(action.giveCount) && action.giveCount > 0 && Number.isSafeInteger(action.receiveCount) && action.receiveCount > 0
        && goodAmount(game, game.current, action.give) >= action.giveCount, 'Offer positive amounts of different goods to another player.')
      state.trade = { target: action.target, give: action.give, receive: action.receive, giveCount: action.giveCount, receiveCount: action.receiveCount }
      game.phase = 'cityTrade'
      log(game, 'A goods trade awaits private acceptance.')
      break
    case 'goodsAnswer': {
      phase('cityTrade')
      const offer = state.trade!
      if (action.accept) {
        rule(goodAmount(game, game.current, offer.give) >= offer.giveCount && goodAmount(game, offer.target, offer.receive) >= offer.receiveCount, 'Both players must have the offered goods.')
        changeGood(game, game.current, offer.give, -offer.giveCount); changeGood(game, offer.target, offer.give, offer.giveCount)
        changeGood(game, offer.target, offer.receive, -offer.receiveCount); changeGood(game, game.current, offer.receive, offer.receiveCount)
      }
      state.trade = null; game.phase = 'turn'
      log(game, action.accept ? 'A goods trade was accepted.' : 'A goods trade was declined.')
      break
    }
  }
  continueCities(game)
}
