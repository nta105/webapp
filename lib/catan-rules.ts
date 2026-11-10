import { advanceCities, bankAmount, citiesActor, citiesPoints, cityLimit, continueCities, createCities, goods, goodAmount, goodsCount, isCitiesAction, knightAt, rollCitiesEvent, takeGood } from './catan-cities.ts'
import type { CitiesAction, CitiesState, Commodity } from './catan-cities.ts'

export const resources = ['wood', 'brick', 'wool', 'grain', 'ore'] as const
export type Resource = typeof resources[number]
export type Hand = Record<Resource, number>
export type Development = 'knight' | 'victory' | 'roads' | 'plenty' | 'monopoly'
export type CatanVersion = 'classic' | 'seafarers' | 'cities'
export type RouteKind = 'road' | 'ship'
export type Phase = 'setupSettlement' | 'setupRoad' | 'roll' | 'turn' | 'discard' | 'robber' | 'steal' | 'trade' | 'roads' | 'ended' | 'cityLoss' | 'cityChoice' | 'progressChoice' | 'progressDiscard' | 'cityTrade' | 'retreat'
export interface Tile { id: number; x: number; y: number; resource: Resource | null; number: number | null; nodes: number[]; sea?: boolean; island?: number }
export interface Vertex { id: number; x: number; y: number; tiles: number[]; edges: number[]; owner: number | null; city: boolean; port: Resource | 'any' | null }
export interface Edge { id: number; a: number; b: number; owner: number | null; kind?: RouteKind; builtOn?: number }
export interface Board { tiles: Tile[]; nodes: Vertex[]; edges: Edge[] }
export interface Player { id: number; name: string; hand: Hand; cards: { id: number; type: Development; boughtOn: number }[]; knights: number }
export interface Game {
  cities: CitiesState | null
  version: CatanVersion
  targetPoints: number
  pirate: number | null
  movedShip: boolean
  board: Board
  players: Player[]
  bank: Hand
  deck: Development[]
  phase: Phase
  current: number
  turn: number
  setupStep: number
  anchor: number | null
  robber: number
  dice: [number, number] | null
  discards: number[]
  victims: number[]
  trade: { target: number; give: Hand; receive: Hand } | null
  resume: 'roll' | 'turn'
  freeRoads: number
  playedCard: boolean
  longest: number | null
  army: number | null
  winner: number | null
  friendlyRobber: boolean
  log: string[]
}
export type Action =
  | CitiesAction
  | { type: 'settlement' | 'city'; node: number }
  | { type: 'road' | 'ship'; edge: number }
  | { type: 'moveShip'; from: number; to: number }
  | { type: 'roll' | 'end' | 'buy' | 'finishRoads' }
  | { type: 'discard'; hand: Hand }
  | { type: 'robber' | 'pirate'; tile: number }
  | { type: 'steal'; player: number }
  | { type: 'bank'; give: Resource; receive: Resource }
  | { type: 'offer'; target: number; give: Hand; receive: Hand }
  | { type: 'answer'; accept: boolean }
  | { type: 'card'; id: number; choices?: Resource[] }

export const emptyHand = (): Hand => ({ wood: 0, brick: 0, wool: 0, grain: 0, ore: 0 })
export const handSize = (hand: Hand) => resources.reduce((sum, resource) => sum + hand[resource], 0)
export const costs: Record<RouteKind | 'settlement' | 'city' | 'development', Hand> = {
  road: { ...emptyHand(), wood: 1, brick: 1 },
  ship: { ...emptyHand(), wood: 1, wool: 1 },
  settlement: { wood: 1, brick: 1, wool: 1, grain: 1, ore: 0 },
  city: { ...emptyHand(), grain: 2, ore: 3 },
  development: { ...emptyHand(), wool: 1, grain: 1, ore: 1 },
}
export const playerColors = ['#e87954', '#75b9ea', '#ead087', '#bd99de', '#86c9a0', '#ed95bb']
export const resourceLabels = { wood: 'Wood', brick: 'Brick', wool: 'Wool', grain: 'Grain', ore: 'Ore' } as const satisfies Record<Resource, string>
export const developmentLabels = { knight: 'Knight', victory: 'Victory point', roads: 'Road building', plenty: 'Year of plenty', monopoly: 'Monopoly' } as const satisfies Record<Development, string>
function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createBoard(large: boolean, random = Math.random): Board {
  const lengths = large ? [3, 4, 5, 6, 5, 4, 3] : [3, 4, 5, 4, 3]
  const counts = large ? [6, 5, 6, 6, 5] : [4, 3, 4, 4, 3]
  const terrain = shuffle<Resource | null>([
    ...resources.flatMap((resource, index) => Array<Resource>(counts[index]).fill(resource)),
    ...Array<null>(large ? 2 : 1).fill(null),
  ], random)
  const board: Board = { tiles: [], nodes: [], edges: [] }
  const vertices = new Map<string, number>()
  const edges = new Map<string, number>()
  lengths.forEach((length, row) => {
    const r = row - Math.floor(lengths.length / 2)
    const start = Math.ceil(-(length - 1) / 2 - r / 2)
    for (let q = start; q < start + length; q++) {
      const id = board.tiles.length
      const x = Math.sqrt(3) * (q + r / 2)
      const y = 1.5 * r
      const nodes = Array.from({ length: 6 }, (_, corner) => {
        const angle = (corner * 60 - 30) * Math.PI / 180
        const nx = x + Math.cos(angle)
        const ny = y + Math.sin(angle)
        const key = `${Math.round(nx * 10000)},${Math.round(ny * 10000)}`
        let nodeId = vertices.get(key)
        if (nodeId === undefined) {
          nodeId = board.nodes.length
          vertices.set(key, nodeId)
          board.nodes.push({ id: nodeId, x: nx, y: ny, tiles: [], edges: [], owner: null, city: false, port: null })
        }
        board.nodes[nodeId].tiles.push(id)
        return nodeId
      })
      nodes.forEach((a, i) => {
        const b = nodes[(i + 1) % 6]
        const key = [a, b].sort((left, right) => left - right).join(',')
        if (!edges.has(key)) {
          const edgeId = board.edges.length
          edges.set(key, edgeId)
          board.edges.push({ id: edgeId, a, b, owner: null })
          board.nodes[a].edges.push(edgeId)
          board.nodes[b].edges.push(edgeId)
        }
      })
      board.tiles.push({ id, x, y, resource: terrain[id], number: null, nodes })
    }
  })
  const numbers = large
    ? [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12]
    : [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]
  const productive = board.tiles.filter(tile => tile.resource !== null)
  const adjacent = (a: Tile, b: Tile) => a.nodes.filter(node => b.nodes.includes(node)).length === 2
  const redCount = numbers.filter(number => number === 6 || number === 8).length
  let redTiles: Tile[] = []
  for (let attempt = 0; attempt < 200; attempt++) {
    redTiles = []
    for (const tile of shuffle(productive, random)) {
      if (redTiles.every(other => !adjacent(tile, other))) redTiles.push(tile)
      if (redTiles.length === redCount) break
    }
    if (redTiles.length === redCount) break
  }
  requireRule(redTiles.length === redCount, 'Could not create a balanced board. Please shuffle again.')
  const redNumbers = shuffle(numbers.filter(number => number === 6 || number === 8), random)
  const otherNumbers = shuffle(numbers.filter(number => number !== 6 && number !== 8), random)
  for (const tile of productive) {
    tile.number = redTiles.includes(tile) ? redNumbers.pop()! : otherNumbers.pop()!
  }
  const boundary = board.edges.filter(edge => board.nodes[edge.a].tiles.filter(id => board.nodes[edge.b].tiles.includes(id)).length === 1)
    .sort((a, b) => {
      const mid = (edge: Edge) => Math.atan2((board.nodes[edge.a].y + board.nodes[edge.b].y) / 2, (board.nodes[edge.a].x + board.nodes[edge.b].x) / 2)
      return mid(a) - mid(b)
    })
  const ports = shuffle<Resource | 'any'>([...resources, ...Array<'any'>(large ? 6 : 4).fill('any')], random)
  ports.forEach((port, i) => {
    const edge = boundary[Math.floor(i * boundary.length / ports.length)]
    board.nodes[edge.a].port = port
    board.nodes[edge.b].port = port
  })
  return board
}

export function createSeafarersBoard(random = Math.random, large = false): Board {
  const board = createBoard(large, random)
  board.tiles.forEach(tile => { tile.island = 0 })
  const offshoreTerrain = shuffle([...resources, 'wood'] as Resource[], random)
  const offshoreNumbers = shuffle([3, 4, 5, 9, 10, 11], random)
  const extent = large ? 5 : 4
  const islandCoordinates = [[extent, 0], [0, extent], [-extent, extent], [-extent, 0], [0, -extent], [extent, -extent]]
  const mainland = new Set(board.tiles.map(tile => `${Math.round(tile.x * 10000)},${Math.round(tile.y * 10000)}`))
  // Extend the existing graph, preserving the mainland's balanced tokens and ports.
  const vertices = new Map(board.nodes.map(node => [`${Math.round(node.x * 10000)},${Math.round(node.y * 10000)}`, node.id]))
  const edges = new Set(board.edges.map(edge => [edge.a, edge.b].sort((a, b) => a - b).join(',')))
  for (let r = -extent; r <= extent; r++) for (let q = -extent; q <= extent; q++) {
    const radius = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))
    const x = Math.sqrt(3) * (q + r / 2)
    const y = 1.5 * r
    if (radius > extent || mainland.has(`${Math.round(x * 10000)},${Math.round(y * 10000)}`)) continue
    const island = islandCoordinates.findIndex(([iq, ir]) => iq === q && ir === r)
    const id = board.tiles.length
    const nodes = Array.from({ length: 6 }, (_, corner) => {
      const angle = (corner * 60 - 30) * Math.PI / 180
      const nx = x + Math.cos(angle); const ny = y + Math.sin(angle)
      const key = `${Math.round(nx * 10000)},${Math.round(ny * 10000)}`
      let node = vertices.get(key)
      if (node === undefined) {
        node = board.nodes.length
        vertices.set(key, node)
        board.nodes.push({ id: node, x: nx, y: ny, tiles: [], edges: [], owner: null, city: false, port: null })
      }
      board.nodes[node].tiles.push(id)
      return node
    })
    nodes.forEach((a, index) => {
      const b = nodes[(index + 1) % 6]
      const key = [a, b].sort((left, right) => left - right).join(',')
      if (edges.has(key)) return
      edges.add(key)
      const edge = board.edges.length
      board.edges.push({ id: edge, a, b, owner: null })
      board.nodes[a].edges.push(edge)
      board.nodes[b].edges.push(edge)
    })
    board.tiles.push({ id, x, y, nodes, sea: island < 0, island: island < 0 ? undefined : island + 1,
      resource: island < 0 ? null : offshoreTerrain[island], number: island < 0 ? null : offshoreNumbers[island] })
  }
  return board
}

export function createCatan(names: string[], friendlyRobber = true, random = Math.random, version: CatanVersion = 'classic'): Game {
  requireRule(names.length >= 3 && names.length <= 6, 'Choose 3 to 6 players.')
  requireRule(version === 'classic' || version === 'seafarers' || version === 'cities', 'Choose a supported Catan version.')
  const clean = names.map(name => name.trim())
  requireRule(clean.every(name => name.length > 0 && name.length <= 24) && new Set(clean.map(name => name.toLowerCase())).size === clean.length, 'Use unique names of 1–24 characters.')
  const large = clean.length > 4
  const board = version === 'seafarers' ? createSeafarersBoard(random, large) : createBoard(large, random)
  const cardCounts: [Development, number][] = [['knight', large ? 20 : 14], ['victory', 5], ['roads', large ? 3 : 2], ['plenty', large ? 3 : 2], ['monopoly', large ? 3 : 2]]
  return {
    version, targetPoints: version === 'classic' ? 10 : 13,
    cities: version === 'cities' ? createCities(clean.length, random) : null,
    pirate: version === 'seafarers' ? board.tiles.find(tile => tile.sea)!.id : null, movedShip: false,
    board, players: clean.map((name, id) => ({ id, name, hand: emptyHand(), cards: [], knights: 0 })),
    bank: Object.fromEntries(resources.map(resource => [resource, large ? 24 : 19])) as Hand,
    deck: version === 'cities' ? [] : shuffle(cardCounts.flatMap(([type, count]) => Array<Development>(count).fill(type)), random),
    phase: 'setupSettlement', current: 0, turn: 1, setupStep: 0, anchor: null,
    robber: board.tiles.find(tile => tile.resource === null)!.id, dice: null, discards: [], victims: [], trade: null,
    resume: 'turn', freeRoads: 0, playedCard: false, longest: null, army: null, winner: null, friendlyRobber,
    log: [version === 'cities' ? 'Place a settlement first, then a city in reverse order. Each gets a road.' : 'A new island awaits. Place two settlements and roads in snake order.'],
  }
}

const otherEnd = (edge: Edge, node: number) => edge.a === node ? edge.b : edge.a
const routeKind = (edge: Edge): RouteKind => edge.kind ?? 'road'
export function shipCount(game: Game, player: number) {
  return game.board.edges.filter(edge => edge.owner === player && routeKind(edge) === 'ship').length
}
export function pieceCount(game: Game, player: number) {
  const owned = game.board.nodes.filter(node => node.owner === player)
  return { settlements: owned.filter(node => !node.city).length, cities: owned.filter(node => node.city).length, roads: game.board.edges.filter(edge => edge.owner === player && routeKind(edge) === 'road').length }
}
export function islandBonus(game: Game, player: number): number {
  if (game.version !== 'seafarers') return 0
  const islands = game.board.nodes.filter(node => node.owner === player).flatMap(node => node.tiles.map(id => game.board.tiles[id].island))
  return new Set(islands.filter(id => id !== undefined && id !== 0)).size * 2
}
export function publicPoints(game: Game, player: number): number {
  return game.board.nodes.reduce((points, node) => points + (node.owner === player ? node.city ? 2 : 1 : 0), 0)
    + (game.longest === player ? 2 : 0) + (game.army === player ? 2 : 0) + islandBonus(game, player) + (game.cities ? citiesPoints(game, player) : 0)
}
export const totalPoints = (game: Game, player: number) => publicPoints(game, player) + game.players[player].cards.filter(card => card.type === 'victory').length
export function canAfford(hand: Hand, cost: Hand) { return resources.every(resource => hand[resource] >= cost[resource]) }
export function canSettle(game: Game, nodeId: number): boolean {
  const node = game.board.nodes[nodeId]
  if (!node || node.owner !== null || pieceCount(game, game.current).settlements >= 5) return false
  if (knightAt(game, nodeId)) return false
  if (!node.tiles.some(id => !game.board.tiles[id].sea)) return false
  if (game.version === 'seafarers' && game.phase === 'setupSettlement' && !node.tiles.some(id => game.board.tiles[id].island === 0)) return false
  if (node.edges.some(id => game.board.nodes[otherEnd(game.board.edges[id], nodeId)].owner !== null)) return false
  return game.phase === 'setupSettlement' || node.edges.some(id => game.board.edges[id].owner === game.current)
}
export function canRoad(game: Game, edgeId: number): boolean {
  return canRoute(game, edgeId, 'road')
}
const edgeTiles = (board: Board, edge: Edge) => board.nodes[edge.a].tiles.filter(id => board.nodes[edge.b].tiles.includes(id))
function pirateBlocks(game: Game, edge: Edge) { return game.pirate !== null && edgeTiles(game.board, edge).includes(game.pirate) }
export function canShip(game: Game, edgeId: number): boolean {
  return canRoute(game, edgeId, 'ship')
}
function canRoute(game: Game, edgeId: number, kind: RouteKind): boolean {
  const edge = game.board.edges[edgeId]
  if (!edge || edge.owner !== null) return false
  const tiles = edgeTiles(game.board, edge).map(id => game.board.tiles[id])
  if (kind === 'road' && (pieceCount(game, game.current).roads >= 15 || !tiles.some(tile => !tile.sea))) return false
  if (kind === 'ship' && (game.version !== 'seafarers' || shipCount(game, game.current) >= 15 || !tiles.some(tile => tile.sea) || pirateBlocks(game, edge))) return false
  if (game.phase === 'setupRoad') return edge.a === game.anchor || edge.b === game.anchor
  return [edge.a, edge.b].some(id => {
    const node = game.board.nodes[id]
    const knight = knightAt(game, id)
    return node.owner === game.current || (node.owner === null && (!knight || knight.owner === game.current) && node.edges.some(id => {
      const route = game.board.edges[id]
      return route.owner === game.current && routeKind(route) === kind
    }))
  })
}
export function canRelocateShip(game: Game, edgeId: number): boolean {
  const edge = game.board.edges[edgeId]
  if (game.version !== 'seafarers' || game.phase !== 'turn' || game.movedShip || !edge || edge.owner !== game.current
    || routeKind(edge) !== 'ship' || edge.builtOn === game.turn || pirateBlocks(game, edge)) return false
  return [edge.a, edge.b].some(id => {
    const node = game.board.nodes[id]
    return node.owner === null && !node.edges.some(other => other !== edgeId && game.board.edges[other].owner === game.current && routeKind(game.board.edges[other]) === 'ship')
  })
}
export function canMoveShipTo(game: Game, from: number, to: number): boolean {
  if (from === to || !canRelocateShip(game, from)) return false
  const copy = structuredClone(game)
  copy.board.edges[from].owner = null
  return canShip(copy, to)
}
export function longestRoad(game: Game, player: number): number {
  const roads = game.board.edges.filter(edge => edge.owner === player)
  const visit = (node: number, used: Set<number>, previousKind?: RouteKind): number => {
    if (used.size && (game.board.nodes[node].owner !== null && game.board.nodes[node].owner !== player || knightAt(game, node) && knightAt(game, node)!.owner !== player)) return 0
    let best = 0
    for (const edgeId of game.board.nodes[node].edges) {
      const edge = game.board.edges[edgeId]
      if (edge.owner !== player || used.has(edgeId)) continue
      if (previousKind && routeKind(edge) !== previousKind && game.board.nodes[node].owner !== player) continue
      used.add(edgeId)
      best = Math.max(best, 1 + visit(otherEnd(edge, node), used, routeKind(edge)))
      used.delete(edgeId)
    }
    return best
  }
  return Math.max(0, ...roads.flatMap(edge => [visit(edge.a, new Set()), visit(edge.b, new Set())]))
}
function awardHolder(values: number[], minimum: number, holder: number | null): number | null {
  const best = Math.max(...values)
  if (best < minimum) return null
  if (holder !== null && values[holder] === best) return holder
  const leaders = values.map((value, id) => value === best ? id : -1).filter(id => id >= 0)
  return leaders.length === 1 ? leaders[0] : null
}
function score(game: Game) {
  game.longest = awardHolder(game.players.map(player => longestRoad(game, player.id)), 5, game.longest)
  game.army = game.cities ? null : awardHolder(game.players.map(player => player.knights), 3, game.army)
  if (!game.phase.startsWith('setup') && (!game.cities || game.phase === 'turn' || game.phase === 'roll') && totalPoints(game, game.current) >= game.targetPoints) {
    game.winner = game.current
    game.phase = 'ended'
    message(game, `${game.players[game.current].name} wins with ${totalPoints(game, game.current)} points!`)
  }
}
function message(game: Game, text: string) { game.log = [...game.log.slice(-59), text] }
function validHand(hand: Hand) {
  requireRule(resources.every(resource => Number.isSafeInteger(hand[resource]) && hand[resource] >= 0), 'Resource amounts must be non-negative whole numbers.')
}
function pay(game: Game, cost: Hand) {
  const hand = game.players[game.current].hand
  requireRule(canAfford(hand, cost), 'Not enough resources.')
  for (const resource of resources) { hand[resource] -= cost[resource]; game.bank[resource] += cost[resource] }
}
function take(game: Game, player: number, resource: Resource, amount: number) {
  requireRule(game.bank[resource] >= amount, `The bank does not have enough ${resourceLabels[resource].toLowerCase()}.`)
  game.bank[resource] -= amount
  game.players[player].hand[resource] += amount
}
export function bankRate(game: Game, player: number, resource: Resource): number {
  const ports = game.board.nodes.filter(node => node.owner === player).map(node => node.port)
  return ports.includes(resource) ? 2 : ports.includes('any') ? 3 : 4
}
export function canMoveRobber(game: Game, tileId: number): boolean {
  const tile = game.board.tiles[tileId]
  return !!tile && !tile.sea && tileId !== game.robber && (!game.friendlyRobber || tile.nodes.every(id => {
    const owner = game.board.nodes[id].owner
    return owner === null || publicPoints(game, owner) > 2
  }))
}
export function canMovePirate(game: Game, tileId: number): boolean {
  return game.version === 'seafarers' && !!game.board.tiles[tileId]?.sea && tileId !== game.pirate
}
export function hasFreeRoute(game: Game): boolean {
  return game.board.edges.some(edge => canRoad(game, edge.id) || canShip(game, edge.id))
}
function distribute(game: Game, number: number) {
  const demand = game.players.map(() => emptyHand())
  const commodityDemand = game.players.map(() => ({ paper: 0, cloth: 0, coin: 0 }))
  const before = game.cities ? game.players.map(player => goodsCount(game, player.id)) : []
  const commodityByResource: Partial<Record<Resource, Commodity>> = { wood: 'paper', wool: 'cloth', ore: 'coin' }
  for (const tile of game.board.tiles) {
    if (tile.number !== number || tile.id === game.robber || !tile.resource) continue
    for (const id of tile.nodes) {
      const node = game.board.nodes[id]
      if (node.owner !== null) {
        const commodity = commodityByResource[tile.resource]
        if (game.cities && node.city && commodity) {
          demand[node.owner][tile.resource]++
          commodityDemand[node.owner][commodity]++
        } else demand[node.owner][tile.resource] += node.city ? 2 : 1
      }
    }
  }
  for (const resource of resources) {
    const total = demand.reduce((sum, hand) => sum + hand[resource], 0)
    const recipients = demand.map((hand, id) => hand[resource] > 0 ? id : -1).filter(id => id >= 0)
    if (total <= game.bank[resource]) demand.forEach((hand, id) => take(game, id, resource, hand[resource]))
    else if (recipients.length === 1) take(game, recipients[0], resource, game.bank[resource])
    else message(game, `${resourceLabels[resource]} shortage: no production of that resource this roll.`)
  }
  if (game.cities) {
    for (const commodity of ['paper', 'cloth', 'coin'] as const) {
      const recipients = commodityDemand.map((hand, id) => hand[commodity] > 0 ? id : -1).filter(id => id >= 0)
      const total = commodityDemand.reduce((sum, hand) => sum + hand[commodity], 0)
      if (total <= game.cities.bank[commodity]) commodityDemand.forEach((hand, id) => takeGood(game, id, commodity, hand[commodity]))
      else if (recipients.length === 1) takeGood(game, recipients[0], commodity, game.cities.bank[commodity])
      else message(game, 'Commodity shortage: no production of that commodity this roll.')
    }
    if (resources.some(resource => bankAmount(game, resource) > 0)) game.cities.choices = game.players.filter(player => game.cities!.players[player.id].improvements.science >= 3 && goodsCount(game, player.id) === before[player.id]).map(player => player.id)
  }
}
export function actingPlayer(game: Game): number {
  if (game.cities && ['cityLoss', 'cityChoice', 'progressChoice', 'progressDiscard', 'cityTrade', 'retreat'].includes(game.phase)) return citiesActor(game)
  return game.phase === 'discard' ? game.discards[0] : game.phase === 'trade' ? game.trade!.target : game.current
}

export function advanceCatan(previous: Game, action: Action, random = Math.random): Game {
  requireRule(previous.phase !== 'ended', 'This game has ended.')
  const game: Game = structuredClone(previous)
  const player = game.players[game.current]
  const requirePhase = (...phases: Phase[]) => requireRule(phases.includes(game.phase), 'Finish the current step first.')
  if (isCitiesAction(action)) {
    advanceCities(game, action, random)
    score(game)
    return game
  }
  switch (action.type) {
    case 'settlement': {
      requirePhase('setupSettlement', 'turn')
      requireRule(canSettle(game, action.node), 'Choose an empty intersection, two edges away from buildings, connected to your road.')
      const setup = game.phase === 'setupSettlement'
      if (!setup) pay(game, costs.settlement)
      game.board.nodes[action.node].owner = game.current
      if (setup && game.cities && game.setupStep >= game.players.length) game.board.nodes[action.node].city = true
      if (setup) {
        game.anchor = action.node
        game.phase = 'setupRoad'
        if (game.setupStep >= game.players.length) {
          for (const id of game.board.nodes[action.node].tiles) {
            const resource = game.board.tiles[id].resource
            if (resource) take(game, game.current, resource, 1)
          }
        }
      }
      message(game, setup && game.cities && game.setupStep >= game.players.length ? 'A starting city was placed.' : `${player.name} built a settlement.`)
      break
    }
    case 'road':
    case 'ship': {
      requirePhase('setupRoad', 'turn', 'roads')
      requireRule(action.type === 'ship' ? canShip(game, action.edge) : canRoad(game, action.edge),
        action.type === 'ship' ? 'Choose a connected sea or coastal edge, away from the pirate. Roads and ships connect only at your buildings.' : 'Choose a connected empty road without building through another player.')
      const setup = game.phase === 'setupRoad'
      if (!setup && game.phase !== 'roads') pay(game, costs[action.type])
      game.board.edges[action.edge].owner = game.current
      game.board.edges[action.edge].kind = action.type
      game.board.edges[action.edge].builtOn = game.turn
      if (setup) {
        game.setupStep++
        game.anchor = null
        const count = game.players.length
        if (game.setupStep === count * 2) {
          game.current = 0
          game.phase = 'roll'
          message(game, 'Setup complete. The first player can roll.')
        } else {
          game.current = game.setupStep < count ? game.setupStep : count * 2 - 1 - game.setupStep
          game.phase = 'setupSettlement'
        }
      } else {
        message(game, action.type === 'ship' ? `${player.name} built a ship.` : `${player.name} built a road.`)
        if (game.phase === 'roads') {
          game.freeRoads--
          if (!game.freeRoads || !hasFreeRoute(game)) game.phase = game.resume
        }
      }
      break
    }
    case 'moveShip': {
      requirePhase('turn')
      requireRule(canMoveShipTo(game, action.from, action.to), 'Move one older open-ended ship per turn to a connected sea edge, away from the pirate.')
      game.board.edges[action.from].owner = null
      const target = game.board.edges[action.to]
      target.owner = game.current; target.kind = 'ship'; target.builtOn = game.turn
      game.movedShip = true
      message(game, `${player.name} relocated a ship.`)
      break
    }
    case 'city': {
      requirePhase('turn')
      const node = game.board.nodes[action.node]
      requireRule(node?.owner === game.current && !node.city && pieceCount(game, game.current).cities < 4, 'Upgrade one of your settlements; at most 4 cities.')
      pay(game, costs.city)
      node.city = true
      message(game, `${player.name} upgraded a settlement to a city.`)
      break
    }
    case 'roll': {
      requirePhase('roll')
      game.dice = [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)]
      const total = game.dice[0] + game.dice[1]
      message(game, `${player.name} rolled ${game.dice[0]} + ${game.dice[1]} = ${total}.`)
      if (game.cities) rollCitiesEvent(game, random)
      if (total === 7) {
        game.discards = game.players.filter(other => game.cities ? goodsCount(game, other.id) > cityLimit(game, other.id) : handSize(other.hand) > 7).map(other => other.id)
        game.resume = 'turn'
        game.phase = game.discards.length ? 'discard' : game.cities && !game.cities.attacked ? 'turn' : 'robber'
      } else { distribute(game, total); game.phase = 'turn' }
      break
    }
    case 'discard': {
      requirePhase('discard')
      requireRule(!game.cities, 'Discard resources and commodities together.')
      validHand(action.hand)
      const target = game.players[game.discards[0]]
      requireRule(handSize(action.hand) === Math.floor(handSize(target.hand) / 2) && canAfford(target.hand, action.hand), 'Discard exactly half your resource cards, rounded down.')
      for (const resource of resources) { target.hand[resource] -= action.hand[resource]; game.bank[resource] += action.hand[resource] }
      message(game, `${target.name} discarded half their resources.`)
      game.discards.shift()
      if (!game.discards.length) game.phase = 'robber'
      break
    }
    case 'robber':
    case 'pirate': {
      requirePhase('robber')
      const pirate = action.type === 'pirate'
      requireRule(pirate ? canMovePirate(game, action.tile) : canMoveRobber(game, action.tile),
        pirate ? 'Move the pirate to a different sea tile.' : 'Move to another tile. Friendly robber protects players with 2 or fewer public points.')
      if (pirate) game.pirate = action.tile
      else game.robber = action.tile
      const owners = pirate
        ? game.board.edges.filter(edge => routeKind(edge) === 'ship' && edgeTiles(game.board, edge).includes(action.tile)).map(edge => edge.owner)
        : game.board.tiles[action.tile].nodes.map(id => game.board.nodes[id].owner)
      game.victims = [...new Set(owners)].filter((id): id is number => id !== null && id !== game.current && (game.cities ? goodsCount(game, id) : handSize(game.players[id].hand)) > 0)
      game.phase = game.victims.length ? 'steal' : game.resume
      message(game, pirate ? `${player.name} moved the pirate.` : `${player.name} moved the robber.`)
      break
    }
    case 'steal': {
      requirePhase('steal')
      requireRule(game.victims.includes(action.player), game.cities ? 'Choose a listed opponent with resources or commodities.' : 'Choose a player next to the robber who has resources.')
      const victim = game.players[action.player]
      const cards = game.cities ? goods.flatMap(good => Array<(typeof goods)[number]>(goodAmount(game, victim.id, good)).fill(good)) : resources.flatMap(resource => Array<Resource>(victim.hand[resource]).fill(resource))
      const resource = cards[Math.floor(random() * cards.length)]
      if (resource === 'paper' || resource === 'cloth' || resource === 'coin') {
        game.cities!.players[victim.id].commodities[resource]--
        game.cities!.players[player.id].commodities[resource]++
      } else {
        victim.hand[resource]--
        player.hand[resource]++
      }
      game.victims = []
      game.phase = game.resume
      message(game, game.cities ? 'A hidden resource or commodity changed hands.' : `${player.name} stole one hidden resource from ${victim.name}.`)
      break
    }
    case 'bank': {
      requirePhase('turn')
      requireRule(resources.includes(action.give) && resources.includes(action.receive) && action.give !== action.receive, 'Choose two different resources.')
      const rate = bankRate(game, game.current, action.give)
      requireRule(player.hand[action.give] >= rate, `This trade needs ${rate} ${action.give}.`)
      requireRule(game.bank[action.receive] > 0, 'The bank has none of that resource.')
      player.hand[action.give] -= rate
      game.bank[action.give] += rate
      take(game, game.current, action.receive, 1)
      message(game, `${player.name} traded ${rate} ${action.give} for 1 ${action.receive} with the bank.`)
      break
    }
    case 'offer': {
      requirePhase('turn')
      validHand(action.give); validHand(action.receive)
      requireRule(game.players[action.target] && action.target !== game.current, 'Choose another player.')
      requireRule(handSize(action.give) > 0 && handSize(action.receive) > 0 && resources.every(resource => !action.give[resource] || !action.receive[resource]), 'Offer resources for different resources; both sides must give something.')
      requireRule(canAfford(player.hand, action.give), 'You cannot offer resources you do not have.')
      game.trade = { target: action.target, give: action.give, receive: action.receive }
      game.phase = 'trade'
      message(game, `${player.name} offered a trade to ${game.players[action.target].name}.`)
      break
    }
    case 'answer': {
      requirePhase('trade')
      const offer = game.trade!
      const other = game.players[offer.target]
      if (action.accept) {
        requireRule(canAfford(player.hand, offer.give) && canAfford(other.hand, offer.receive), 'Both players must have the offered resources.')
        for (const resource of resources) {
          player.hand[resource] += offer.receive[resource] - offer.give[resource]
          other.hand[resource] += offer.give[resource] - offer.receive[resource]
        }
      }
      message(game, `${other.name} ${action.accept ? 'accepted' : 'declined'} the trade.`)
      game.trade = null
      game.phase = 'turn'
      break
    }
    case 'buy': {
      requirePhase('turn')
      requireRule(!game.cities, 'Use progress cards instead of development cards in this mode.')
      requireRule(game.deck.length > 0, 'No development cards remain.')
      pay(game, costs.development)
      player.cards.push({ id: Math.max(game.turn * 100, ...player.cards.map(card => card.id)) + 1, type: game.deck.pop()!, boughtOn: game.turn })
      message(game, `${player.name} bought a hidden development card.`)
      break
    }
    case 'card': {
      requirePhase('turn', 'roll')
      requireRule(!game.cities, 'Use progress cards instead of development cards in this mode.')
      const index = player.cards.findIndex(card => card.id === action.id)
      const card = player.cards[index]
      requireRule(card && card.type !== 'victory', 'Victory points count automatically; select an action card.')
      requireRule(!game.playedCard && card.boughtOn < game.turn, 'Play at most one action card per turn, never on the turn you bought it.')
      const choices = action.choices ?? []
      game.resume = game.phase === 'roll' ? 'roll' : 'turn'
      if (card.type === 'knight') {
        player.knights++
        game.phase = 'robber'
      } else if (card.type === 'roads') {
        requireRule(hasFreeRoute(game), 'No legal roads or ships remain.')
        game.freeRoads = Math.min(2, 15 - pieceCount(game, game.current).roads + (game.version === 'seafarers' ? 15 - shipCount(game, game.current) : 0))
        game.phase = 'roads'
      } else if (card.type === 'plenty') {
        requireRule(choices.length === 2 && choices.every(resource => resources.includes(resource)), 'Choose exactly two resources.')
        for (const resource of choices) take(game, game.current, resource, 1)
      } else {
        requireRule(choices.length === 1 && resources.includes(choices[0]), 'Choose one resource for Monopoly.')
        for (const other of game.players) {
          if (other.id === game.current) continue
          player.hand[choices[0]] += other.hand[choices[0]]
          other.hand[choices[0]] = 0
        }
      }
      player.cards.splice(index, 1)
      game.playedCard = true
      message(game, `${player.name} played ${developmentLabels[card.type]}.`)
      break
    }
    case 'finishRoads':
      requirePhase('roads')
      requireRule(!hasFreeRoute(game), 'Place the remaining free roads if a legal placement exists.')
      game.phase = game.resume
      break
    case 'end':
      requirePhase('turn')
      score(game)
      if (game.phase === 'ended') return game
      game.current = (game.current + 1) % game.players.length
      game.turn++
      game.phase = 'roll'
      game.playedCard = false
      game.movedShip = false
      game.dice = null
      if (game.cities) game.cities.players[game.current].fleet = null
      message(game, `${game.players[game.current].name}'s turn.`)
      break
  }
  continueCities(game)
  score(game)
  return game
}
