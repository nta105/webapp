import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { catanTranslator, localizeCatanMessage } from './catan-i18n.ts'
import {
  actingPlayer, advanceCatan, bankRate, canMovePirate, canMoveRobber, canMoveShipTo, canRelocateShip, canRoad, canSettle, canShip,
  createBoard, createCatan, createSeafarersBoard, emptyHand, handSize, islandBonus, longestRoad, pieceCount, publicPoints,
  resources, shipCount, totalPoints,
} from './catan-rules.ts'

function seeded(seed = 42) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
}

test('English and Vietnamese labels interpolate names and quantities without changing names', () => {
  const vi = catanTranslator('vi')
  const en = catanTranslator('en')
  assert.equal(vi('Wood'), 'Gỗ')
  assert.equal(vi('Year of plenty'), 'Năm bội thu')
  assert.equal(vi('Player {number}', { number: 6 }), 'Người chơi 6')
  assert.equal(vi("I'm {name}", { name: 'Wood {number}' }), 'Tôi là Wood {number}')
  assert.equal(en('Cards ({count})', { count: 2 }), 'Cards (2)')
  assert.equal(vi('Cards ({count})', { count: 2 }), 'Bài (2)')
})

test('all dynamic journal and error formats translate and preserve original English messages', () => {
  const cases = [
    ['An wins with 10 points!', 'An thắng với 10 điểm!'],
    ['Wood shortage: no production of that resource this roll.', 'Thiếu Gỗ: lượt gieo này không sản xuất loại tài nguyên đó.'],
    ['An built a settlement.', 'An đã xây khu định cư.'],
    ['An built a road.', 'An đã xây đường.'],
    ['An upgraded a settlement to a city.', 'An đã nâng cấp khu định cư thành thành phố.'],
    ['An rolled 3 + 4 = 7.', 'An đã gieo 3 + 4 = 7.'],
    ['An discarded half their resources.', 'An đã bỏ một nửa tài nguyên.'],
    ['An moved the robber.', 'An đã di chuyển tên cướp.'],
    ['An stole one hidden resource from Bình.', 'An đã cướp một tài nguyên ẩn từ Bình.'],
    ['An traded 4 wood for 1 ore with the bank.', 'An đã đổi 4 Gỗ lấy 1 Quặng với ngân hàng.'],
    ['An offered a trade to Bình.', 'An đã đề nghị trao đổi với Bình.'],
    ['An accepted the trade.', 'An đã chấp nhận trao đổi.'],
    ['An declined the trade.', 'An đã từ chối trao đổi.'],
    ['An bought a hidden development card.', 'An đã mua một lá bài phát triển ẩn.'],
    ['An played Knight.', 'An đã dùng Hiệp sĩ.'],
    ['An built a ship.', 'An đã đóng thuyền.'],
    ['An relocated a ship.', 'An đã di chuyển thuyền.'],
    ['An moved the pirate.', 'An đã di chuyển hải tặc.'],
    ["An's turn.", 'Đến lượt An.'],
    ['The bank does not have enough wool.', 'Ngân hàng không đủ Len.'],
    ['This trade needs 3 brick.', 'Trao đổi này cần 3 Gạch.'],
    ['Wood [A].*\nB built a road.', 'Wood [A].*\nB đã xây đường.'],
  ]
  for (const [english, vietnamese] of cases) {
    assert.equal(localizeCatanMessage('vi', english), vietnamese)
    assert.equal(localizeCatanMessage('en', english), english)
  }
  for (const resource of resources) {
    const label = resource[0].toUpperCase() + resource.slice(1)
    assert.notEqual(localizeCatanMessage('vi', `${label} shortage: no production of that resource this roll.`), `${label} shortage: no production of that resource this roll.`)
  }
})

test('every static engine error and journal message has a Vietnamese translation', () => {
  const source = ts.createSourceFile('catan-rules.ts', readFileSync(new URL('./catan-rules.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  let checked = 0
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['requireRule', 'message'].includes(node.expression.text)) {
      const text = node.arguments[1]
      if (text && ts.isStringLiteral(text)) {
        assert.notEqual(localizeCatanMessage('vi', text.text), text.text, text.text)
        checked++
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(checked >= 25)
  const initial = createCatan(names(3), true, seeded()).log[0]
  assert.notEqual(localizeCatanMessage('vi', initial), initial)
})
const names = count => Array.from({ length: count }, (_, id) => `Player ${id + 1}`)
function ready(count = 4) {
  let game = createCatan(names(count), false, seeded())
  for (let i = 0; i < count * 2; i++) {
    const node = game.board.nodes.find(node => canSettle(game, node.id))
    assert.ok(node)
    game = advanceCatan(game, { type: 'settlement', node: node.id })
    const edge = game.board.edges.find(edge => canRoad(game, edge.id))
    assert.ok(edge)
    game = advanceCatan(game, { type: 'road', edge: edge.id })
  }
  return game
}
function rich(game, phase = 'turn') {
  const result = structuredClone(game)
  result.phase = phase
  for (const resource of resources) {
    const missing = 8 - result.players[result.current].hand[resource]
    result.players[result.current].hand[resource] += missing
    result.bank[resource] -= missing
  }
  return result
}
function totalResources(game, resource) {
  return game.bank[resource] + game.players.reduce((sum, player) => sum + player.hand[resource], 0)
}
function addCard(game, type) {
  const index = game.deck.indexOf(type)
  game.deck.splice(index, 1)
  game.players[game.current].cards.push({ id: 1000, type, boughtOn: 0 })
  return game
}

test('classic and expanded graphs are joined, have correct terrain and ports, and never adjacent 6/8s', () => {
  for (const large of [false, true]) {
    for (let seed = 0; seed < 80; seed++) {
      const board = createBoard(large, seeded(seed))
      assert.equal(board.tiles.length, large ? 30 : 19)
      assert.equal(board.nodes.length - board.edges.length + board.tiles.length, 1)
      assert.equal(board.tiles.filter(tile => tile.resource === null).length, large ? 2 : 1)
      assert.equal(board.nodes.filter(node => node.port).length, (large ? 11 : 9) * 2)
      const red = board.tiles.filter(tile => tile.number === 6 || tile.number === 8)
      assert.equal(red.length, large ? 6 : 4)
      for (const tile of red) for (const other of red) {
        if (tile.id !== other.id) assert.notEqual(tile.nodes.filter(id => other.nodes.includes(id)).length, 2)
      }
      for (const node of board.nodes) assert.ok(node.edges.length >= 2 && node.edges.length <= 3)
    }
  }
})

test('player validation, deck sizes and resource supply match selected table', () => {
  assert.throws(() => createCatan(names(2)))
  assert.throws(() => createCatan(['A', 'a', 'B']))
  assert.throws(() => createCatan(['A', '', 'B']))
  for (let count = 3; count <= 6; count++) {
    const game = createCatan(names(count), true, seeded())
    assert.equal(game.deck.length, count > 4 ? 34 : 25)
    assert.equal(game.bank.wood, count > 4 ? 24 : 19)
    assert.equal(game.friendlyRobber, true)
  }
})

test('snake setup places two settlements/roads and conserves starting resources for all player counts', () => {
  for (let count = 3; count <= 6; count++) {
    const game = ready(count)
    assert.equal(game.phase, 'roll')
    assert.equal(game.current, 0)
    for (const player of game.players) {
      assert.equal(publicPoints(game, player.id), 2)
      assert.deepEqual(pieceCount(game, player.id), { roads: 2, cities: 0, settlements: 2 })
      assert.ok(handSize(player.hand) > 0)
    }
    for (const resource of resources) assert.equal(totalResources(game, resource), count > 4 ? 24 : 19)
  }
})

test('setup enforces distance and adjacent road; failed actions leave original state intact', () => {
  let game = createCatan(names(3), false, seeded())
  game = advanceCatan(game, { type: 'settlement', node: 0 })
  const invalid = game.board.edges.find(edge => edge.a !== 0 && edge.b !== 0)
  assert.throws(() => advanceCatan(game, { type: 'road', edge: invalid.id }))
  assert.equal(game.phase, 'setupRoad')
  assert.throws(() => advanceCatan(game, { type: 'roll' }))
  game = advanceCatan(game, { type: 'road', edge: game.board.nodes[0].edges[0] })
  const neighbor = game.board.edges[game.board.nodes[0].edges[0]]
  assert.equal(canSettle(game, neighbor.a === 0 ? neighbor.b : neighbor.a), false)
})

test('rolling produces by number, counts cities twice and blocks robbed tiles', () => {
  let game = ready()
  for (const player of game.players) player.hand = emptyHand()
  for (const resource of resources) game.bank[resource] = 19
  const productive = game.board.tiles.find(tile => tile.resource && tile.nodes.some(id => game.board.nodes[id].owner !== null))
  for (const tile of game.board.tiles) tile.number = tile.id === productive.id ? 6 : 2
  const owned = productive.nodes.find(id => game.board.nodes[id].owner !== null)
  game.board.nodes[owned].city = true
  const owner = game.board.nodes[owned].owner
  const before = game.players[owner].hand[productive.resource]
  const rolled = advanceCatan(game, { type: 'roll' }, () => 0.4)
  assert.deepEqual(rolled.dice, [3, 3])
  assert.equal(rolled.players[owner].hand[productive.resource] - before, 2)
  assert.equal(game.players[owner].hand[productive.resource], 0)
  game.robber = productive.id
  assert.equal(advanceCatan(game, { type: 'roll' }, () => 0.4).players[owner].hand[productive.resource], 0)
})

test('bank shortages deny shared production but give a sole recipient remaining stock', () => {
  const game = ready()
  for (const node of game.board.nodes) node.owner = null
  const tile = game.board.tiles.find(tile => tile.resource)
  tile.number = 6
  game.robber = game.board.tiles.find(other => other.resource === null).id
  for (const other of game.board.tiles) if (other.id !== tile.id) other.number = 2
  game.board.nodes[tile.nodes[0]].owner = 0
  game.board.nodes[tile.nodes[0]].city = true
  game.bank[tile.resource] = 1
  const before = game.players[0].hand[tile.resource]
  assert.equal(advanceCatan(game, { type: 'roll' }, () => 0.4).players[0].hand[tile.resource], before + 1)
  game.board.nodes[tile.nodes[2]].owner = 1
  assert.equal(advanceCatan(game, { type: 'roll' }, () => 0.4).players[0].hand[tile.resource], before)
})

test('seven discards exactly half, handles each private actor, then robber and random theft', () => {
  let game = rich(ready(), 'roll')
  game.players[1].hand = { ...emptyHand(), wood: 8 }
  let calls = 0
  game = advanceCatan(game, { type: 'roll' }, () => calls++ === 0 ? 0.4 : 0.55)
  assert.equal(game.phase, 'discard')
  assert.equal(actingPlayer(game), 0)
  assert.throws(() => advanceCatan(game, { type: 'discard', hand: emptyHand() }))
  game = advanceCatan(game, { type: 'discard', hand: { wood: 4, brick: 4, wool: 4, grain: 4, ore: 4 } })
  assert.equal(actingPlayer(game), 1)
  game = advanceCatan(game, { type: 'discard', hand: { ...emptyHand(), wood: 4 } })
  assert.equal(game.phase, 'robber')
  assert.throws(() => advanceCatan(game, { type: 'robber', tile: game.robber }))
  const tile = game.board.tiles.find(tile => tile.id !== game.robber && tile.nodes.some(id => game.board.nodes[id].owner === 1))
  game = advanceCatan(game, { type: 'robber', tile: tile.id })
  assert.equal(game.phase, 'steal')
  assert.ok(game.victims.includes(1))
  const before = handSize(game.players[1].hand)
  game = advanceCatan(game, { type: 'steal', player: 1 }, () => 0)
  assert.equal(handSize(game.players[1].hand), before - 1)
  assert.equal(game.phase, 'turn')
  assert.ok(!game.log.at(-1).includes('wood'))
})

test('friendly robber protects low-score buildings while unprotected mode permits them', () => {
  const game = ready()
  const tile = game.board.tiles.find(tile => tile.id !== game.robber && tile.nodes.some(id => game.board.nodes[id].owner !== null))
  assert.equal(canMoveRobber(game, tile.id), true)
  game.friendlyRobber = true
  assert.equal(canMoveRobber(game, tile.id), false)
})

test('connected roads charge resources; enemy buildings stop construction and longest roads', () => {
  const game = rich(ready())
  const edge = game.board.edges.find(edge => canRoad(game, edge.id))
  const next = advanceCatan(game, { type: 'road', edge: edge.id })
  assert.equal(next.players[0].hand.wood, game.players[0].hand.wood - 1)
  assert.equal(next.players[0].hand.brick, game.players[0].hand.brick - 1)
  assert.throws(() => advanceCatan(next, { type: 'road', edge: edge.id }))
  const disconnected = game.board.edges.find(edge => !canRoad(game, edge.id) && edge.owner === null)
  assert.throws(() => advanceCatan(game, { type: 'road', edge: disconnected.id }))
  for (const edge of game.board.edges) edge.owner = null
  for (const node of game.board.nodes) node.owner = null
  const node = game.board.nodes.find(node => node.edges.length === 3)
  for (const id of node.edges) game.board.edges[id].owner = 0
  assert.equal(longestRoad(game, 0), 2, 'branches are not summed')
  node.owner = 1
  assert.equal(longestRoad(game, 0), 1, 'opposing building breaks a road')
  const blocked = node.edges[0]
  game.board.edges[blocked].owner = null
  assert.equal(canRoad(game, blocked), false)
})

test('longest road counts loops without repeating edges and awards 2 points at five', () => {
  let game = rich(ready())
  for (const node of game.board.nodes) node.owner = null
  for (const edge of game.board.edges) edge.owner = null
  const tile = game.board.tiles[0]
  const cycle = game.board.edges.filter(edge => tile.nodes.includes(edge.a) && tile.nodes.includes(edge.b))
  for (const edge of cycle) edge.owner = 0
  assert.equal(longestRoad(game, 0), 6)
  game = advanceCatan(game, { type: 'bank', give: 'wood', receive: 'brick' })
  assert.equal(game.longest, 0)
  assert.equal(publicPoints(game, 0), 2)
})

test('city upgrades pay correctly and return a settlement to inventory', () => {
  const game = rich(ready())
  const node = game.board.nodes.find(node => node.owner === 0)
  const next = advanceCatan(game, { type: 'city', node: node.id })
  assert.deepEqual(pieceCount(next, 0), { settlements: 1, cities: 1, roads: 2 })
  assert.equal(publicPoints(next, 0), 3)
  assert.equal(next.players[0].hand.grain, 6)
  assert.equal(next.players[0].hand.ore, 5)
  assert.throws(() => advanceCatan(next, { type: 'city', node: node.id }))
})

test('bank and owned ports apply 4:1, 3:1 and specific 2:1 trades', () => {
  let game = rich(ready())
  for (const node of game.board.nodes) node.port = null
  assert.equal(bankRate(game, 0, 'wood'), 4)
  const node = game.board.nodes.find(node => node.owner === 0)
  node.port = 'any'
  assert.equal(bankRate(game, 0, 'wood'), 3)
  node.port = 'wood'
  assert.equal(bankRate(game, 0, 'wood'), 2)
  game = advanceCatan(game, { type: 'bank', give: 'wood', receive: 'brick' })
  assert.equal(game.players[0].hand.wood, 6)
  assert.equal(game.players[0].hand.brick, 9)
  assert.throws(() => advanceCatan(game, { type: 'bank', give: 'wood', receive: 'wood' }))
})

test('player offers transfer only after acceptance, reject cleanly, and lock other actions', () => {
  const base = rich(ready())
  base.players[1].hand = { ...emptyHand(), ore: 2 }
  const offer = { type: 'offer', target: 1, give: { ...emptyHand(), wood: 2 }, receive: { ...emptyHand(), ore: 1 } }
  let game = advanceCatan(base, offer)
  assert.equal(actingPlayer(game), 1)
  assert.equal(game.players[0].hand.wood, base.players[0].hand.wood)
  assert.throws(() => advanceCatan(game, { type: 'end' }))
  const declined = advanceCatan(game, { type: 'answer', accept: false })
  assert.deepEqual(declined.players[0].hand, base.players[0].hand)
  game = advanceCatan(game, { type: 'answer', accept: true })
  assert.equal(game.players[0].hand.wood, 6)
  assert.equal(game.players[0].hand.ore, 9)
  assert.equal(game.players[1].hand.ore, 1)
  assert.equal(game.phase, 'turn')
  assert.throws(() => advanceCatan(base, { ...offer, give: { ...emptyHand(), wood: -2 } }))
  assert.throws(() => advanceCatan(base, { ...offer, give: { ...emptyHand(), wood: 1.5 } }))
})

test('development purchases stay private, cannot be played immediately and have unique IDs', () => {
  const game = rich(ready())
  game.deck = ['knight', 'roads']
  let next = advanceCatan(game, { type: 'buy' })
  assert.equal(next.players[0].cards.at(-1).type, 'roads')
  assert.throws(() => advanceCatan(next, { type: 'card', id: next.players[0].cards.at(-1).id }))
  next = advanceCatan(next, { type: 'buy' })
  assert.equal(new Set(next.players[0].cards.map(card => card.id)).size, 2)
  assert.ok(!next.log.at(-1).includes('Knight'))
})

test('Year of Plenty, Monopoly and one-card-per-turn restriction work', () => {
  let game = addCard(rich(ready()), 'plenty')
  const before = game.players[0].hand.wood
  game = advanceCatan(game, { type: 'card', id: 1000, choices: ['wood', 'wood'] })
  assert.equal(game.players[0].hand.wood, before + 2)
  game = addCard(game, 'monopoly')
  assert.throws(() => advanceCatan(game, { type: 'card', id: 1000, choices: ['ore'] }))
  game.playedCard = false
  game.players[1].hand.ore = 4
  const total = game.players.reduce((sum, player) => sum + player.hand.ore, 0)
  game = advanceCatan(game, { type: 'card', id: 1000, choices: ['ore'] })
  assert.equal(game.players[0].hand.ore, total)
  assert.ok(game.players.slice(1).every(player => player.hand.ore === 0))
})

test('knight before rolling returns to roll, and three knights award Largest Army', () => {
  let game = addCard(ready(), 'knight')
  game.players[0].knights = 2
  game = advanceCatan(game, { type: 'card', id: 1000 })
  assert.equal(game.phase, 'robber')
  assert.equal(game.army, 0)
  const tile = game.board.tiles.find(tile => tile.id !== game.robber && tile.nodes.every(id => game.board.nodes[id].owner === null))
  game = advanceCatan(game, { type: 'robber', tile: tile.id })
  assert.equal(game.phase, 'roll')
})

test('Road Building grants two free roads, supports before-roll play and does not permit skipping legal roads', () => {
  let game = addCard(ready(), 'roads')
  const before = structuredClone(game.players[0].hand)
  game = advanceCatan(game, { type: 'card', id: 1000 })
  assert.equal(game.phase, 'roads')
  assert.throws(() => advanceCatan(game, { type: 'finishRoads' }))
  for (let i = 0; i < 2; i++) {
    const edge = game.board.edges.find(edge => canRoad(game, edge.id))
    game = advanceCatan(game, { type: 'road', edge: edge.id })
  }
  assert.equal(game.phase, 'roll')
  assert.deepEqual(game.players[0].hand, before)
})

test('victory cards remain hidden in public points and count for current-player victory', () => {
  let game = rich(ready())
  for (let i = 0; i < 8; i++) game.players[0].cards.push({ id: i, type: 'victory', boughtOn: 0 })
  assert.equal(publicPoints(game, 0), 2)
  assert.equal(totalPoints(game, 0), 10)
  game = advanceCatan(game, { type: 'end' })
  assert.equal(game.winner, 0)
  assert.equal(game.phase, 'ended')
  assert.throws(() => advanceCatan(game, { type: 'roll' }))
})

test('end turn advances clockwise, requires a roll and clears previous dice', () => {
  let game = ready()
  assert.throws(() => advanceCatan(game, { type: 'end' }))
  game = advanceCatan(game, { type: 'roll' }, () => 0.4)
  assert.throws(() => advanceCatan(game, { type: 'roll' }))
  game = advanceCatan(game, { type: 'end' })
  assert.equal(game.current, 1)
  assert.equal(game.turn, 2)
  assert.equal(game.phase, 'roll')
  assert.equal(game.dice, null)
})

const adjacentTiles = (game, edge) => game.board.nodes[edge.a].tiles.filter(id => game.board.nodes[edge.b].tiles.includes(id)).map(id => game.board.tiles[id])
const coastalJunction = game => game.board.nodes.find(node => {
  const touching = node.edges.map(id => game.board.edges[id])
  return touching.some(edge => adjacentTiles(game, edge).some(tile => !tile.sea))
    && touching.filter(edge => adjacentTiles(game, edge).some(tile => tile.sea)
      && !adjacentTiles(game, edge).some(tile => tile.id === game.pirate)).length >= 2
    && node.tiles.some(id => game.board.tiles[id].island === 0)
})
function seaFixture() {
  const game = rich(createCatan(names(3), false, seeded(), 'seafarers'))
  game.turn = 5
  const node = coastalJunction(game)
  assert.ok(node)
  node.owner = 0
  return game
}

test('Seafarers adds a connected sea graph and six separate islands without changing Classic', () => {
  for (let seed = 0; seed < 40; seed++) {
    const board = createSeafarersBoard(seeded(seed))
    assert.equal(board.tiles.length, 61)
    assert.equal(board.tiles.filter(tile => tile.sea).length, 36)
    assert.equal(board.tiles.filter(tile => tile.island === 0).length, 19)
    assert.equal(new Set(board.tiles.filter(tile => !tile.sea).map(tile => tile.island)).size, 7)
    assert.equal(board.nodes.length - board.edges.length + board.tiles.length, 1)
    assert.equal(board.nodes.filter(node => node.port).length, 18)
    for (const tile of board.tiles.filter(tile => tile.island > 0)) {
      assert.ok(tile.resource && tile.number)
      const neighbors = board.tiles.filter(other => other.id !== tile.id && tile.nodes.filter(node => other.nodes.includes(node)).length === 2)
      assert.ok(neighbors.every(other => other.sea))
    }
    const classic = createBoard(false, seeded(seed))
    assert.deepEqual(board.tiles.slice(0, 19), classic.tiles.map(tile => ({ ...tile, island: 0 })))
  }
  const classic = createCatan(names(6), true, seeded())
  assert.equal(classic.version, 'classic')
  assert.equal(classic.targetPoints, 10)
  assert.equal(classic.pirate, null)
  assert.ok(!classic.board.tiles.some(tile => tile.sea))
  assert.throws(() => createCatan(names(5), true, seeded(), 'seafarers'))
})

test('Seafarers snake setup stays on mainland and allows free coastal ships for 3 and 4 players', () => {
  for (const count of [3, 4]) {
    let game = createCatan(names(count), true, seeded(), 'seafarers')
    for (let placement = 0; placement < count * 2; placement++) {
      assert.ok(game.board.nodes.filter(node => canSettle(game, node.id)).every(node => node.tiles.some(id => game.board.tiles[id].island === 0)))
      const node = game.board.nodes.find(node => canSettle(game, node.id) && node.tiles.some(id => game.board.tiles[id].sea))
      assert.ok(node)
      game = advanceCatan(game, { type: 'settlement', node: node.id })
      const ship = game.board.edges.find(edge => canShip(game, edge.id))
      const route = ship ?? game.board.edges.find(edge => canRoad(game, edge.id))
      assert.ok(route)
      game = advanceCatan(game, { type: ship ? 'ship' : 'road', edge: route.id })
    }
    assert.equal(game.phase, 'roll')
    for (const player of game.players) {
      assert.equal(publicPoints(game, player.id), 2)
      assert.equal(shipCount(game, player.id) + pieceCount(game, player.id).roads, 2)
    }
    for (const resource of resources) assert.equal(totalResources(game, resource), 19)
  }
})

test('ships cost wood/wool, use sea edges and independent inventory; roads cannot cross the sea', () => {
  let game = seaFixture()
  const edge = game.board.edges.find(edge => canShip(game, edge.id))
  const before = structuredClone(game.players[0].hand)
  game = advanceCatan(game, { type: 'ship', edge: edge.id })
  assert.equal(game.players[0].hand.wood, before.wood - 1)
  assert.equal(game.players[0].hand.wool, before.wool - 1)
  assert.equal(game.players[0].hand.brick, before.brick)
  assert.equal(shipCount(game, 0), 1)
  assert.equal(pieceCount(game, 0).roads, 0)
  assert.equal(game.board.edges[edge.id].builtOn, game.turn)
  for (const sea of game.board.edges.filter(edge => adjacentTiles(game, edge).every(tile => tile.sea))) assert.equal(canRoad(game, sea.id), false)
  for (const node of game.board.nodes.filter(node => node.tiles.every(id => game.board.tiles[id].sea))) assert.equal(canSettle(game, node.id), false)
  for (const land of game.board.edges.filter(edge => adjacentTiles(game, edge).every(tile => !tile.sea))) assert.equal(canShip(game, land.id), false)
  assert.ok(game.board.edges.some(edge => canShip(game, edge.id)))
  for (const other of game.board.edges.filter(edge => edge.owner === null).slice(0, 14)) { other.owner = 0; other.kind = 'ship' }
  assert.equal(shipCount(game, 0), 15)
  assert.ok(game.board.edges.every(edge => !canShip(game, edge.id)))
  const classic = createCatan(names(3), false, seeded())
  assert.ok(!classic.board.edges.some(edge => canShip(classic, edge.id)))
})

test('roads and ships connect and score as one trade route only through an owned building', () => {
  const game = seaFixture()
  const node = game.board.nodes.find(node => node.owner === 0)
  const road = node.edges.map(id => game.board.edges[id]).find(edge => adjacentTiles(game, edge).every(tile => !tile.sea))
  const ship = node.edges.map(id => game.board.edges[id]).find(edge => adjacentTiles(game, edge).some(tile => tile.sea) && !adjacentTiles(game, edge).some(tile => tile.id === game.pirate))
  assert.ok(road && ship)
  node.owner = null
  road.owner = 0; road.kind = 'road'
  assert.equal(canShip(game, ship.id), false)
  node.owner = 0
  assert.equal(canShip(game, ship.id), true)
  node.owner = null
  ship.owner = 0; ship.kind = 'ship'
  assert.equal(longestRoad(game, 0), 1)
  node.owner = 0
  assert.equal(longestRoad(game, 0), 2)
  node.owner = 1
  assert.equal(longestRoad(game, 0), 1)
})

test('ship relocation is atomic, once per turn, older only and cannot disconnect its own destination', () => {
  let game = seaFixture()
  const node = game.board.nodes.find(node => node.owner === 0)
  const edges = node.edges.filter(id => canShip(game, id))
  assert.ok(edges.length >= 2)
  const from = edges[0]; const to = edges[1]
  game.board.edges[from].owner = 0; game.board.edges[from].kind = 'ship'; game.board.edges[from].builtOn = game.turn
  assert.equal(canRelocateShip(game, from), false)
  game.board.edges[from].builtOn--
  assert.equal(canRelocateShip(game, from), true)
  assert.equal(canMoveShipTo(game, from, from), false)
  const before = structuredClone(game)
  const hand = structuredClone(game.players[0].hand)
  assert.throws(() => advanceCatan(game, { type: 'moveShip', from, to: from }))
  assert.deepEqual(game, before)
  game = advanceCatan(game, { type: 'moveShip', from, to })
  assert.equal(game.board.edges[from].owner, null)
  assert.equal(game.board.edges[to].owner, 0)
  assert.equal(shipCount(game, 0), 1)
  assert.deepEqual(game.players[0].hand, hand)
  assert.equal(game.movedShip, true)
  assert.equal(canRelocateShip(game, to), false)
  assert.equal(advanceCatan(game, { type: 'end' }).movedShip, false)

  const unanchored = seaFixture()
  const floating = unanchored.board.edges.find(edge => adjacentTiles(unanchored, edge).every(tile => tile.sea))
  floating.owner = 0; floating.kind = 'ship'; floating.builtOn = 0
  const extension = unanchored.board.nodes[floating.a].edges.find(id => id !== floating.id && canShip(unanchored, id))
  assert.ok(extension !== undefined)
  assert.equal(canMoveShipTo(unanchored, floating.id, extension), false)
})

test('closed ship routes cannot move; the pirate blocks building and moving but does not break route length', () => {
  const game = seaFixture()
  const from = game.board.edges.find(edge => canShip(game, edge.id))
  from.owner = 0; from.kind = 'ship'; from.builtOn = 0
  game.board.nodes[from.a].owner = 0; game.board.nodes[from.b].owner = 0
  assert.equal(canRelocateShip(game, from.id), false)
  game.board.nodes[from.b].owner = null
  game.board.nodes[from.a].owner = null
  assert.equal(canRelocateShip(game, from.id), true)
  game.pirate = adjacentTiles(game, from).find(tile => tile.sea).id
  assert.equal(canRelocateShip(game, from.id), false)
  assert.equal(longestRoad(game, 0), 1)
  from.owner = null
  assert.equal(canShip(game, from.id), false)
})

test('pirate moves only to another sea hex, steals from adjacent ships and resumes a pre-roll Knight', () => {
  let game = seaFixture()
  game.phase = 'roll'
  game = addCard(game, 'knight')
  game = advanceCatan(game, { type: 'card', id: 1000 })
  const sea = game.board.tiles.find(tile => canMovePirate(game, tile.id))
  const edge = game.board.edges.find(edge => adjacentTiles(game, edge).some(tile => tile.id === sea.id))
  edge.owner = 1; edge.kind = 'ship'
  game.players[1].hand.ore = 1; game.bank.ore--
  const oldRobber = game.robber
  assert.equal(canMovePirate(game, game.pirate), false)
  assert.equal(canMovePirate(game, oldRobber), false)
  assert.equal(canMoveRobber(game, sea.id), false)
  assert.throws(() => advanceCatan(game, { type: 'pirate', tile: oldRobber }))
  game = advanceCatan(game, { type: 'pirate', tile: sea.id })
  assert.deepEqual(game.victims, [1])
  assert.equal(game.phase, 'steal')
  assert.equal(game.robber, oldRobber)
  game = advanceCatan(game, { type: 'steal', player: 1 }, () => 0)
  assert.equal(game.phase, 'roll')
  assert.equal(game.players[1].hand.ore, 0)

  game = advanceCatan(game, { type: 'roll' }, (() => { const rolls = [0.4, 0.6]; return () => rolls.shift() })())
  assert.equal(game.phase, 'discard')
  while (game.phase === 'discard') {
    const hand = emptyHand(); const actor = game.players[actingPlayer(game)]
    let remaining = Math.floor(handSize(actor.hand) / 2)
    for (const resource of resources) { hand[resource] = Math.min(remaining, actor.hand[resource]); remaining -= hand[resource] }
    game = advanceCatan(game, { type: 'discard', hand })
  }
  assert.equal(game.phase, 'robber')
  const destination = game.board.tiles.find(tile => canMovePirate(game, tile.id) && tile.id !== sea.id)
  game = advanceCatan(game, { type: 'pirate', tile: destination.id })
  assert.equal(game.phase, 'turn')
})

test('Road Building supports ships and mixed routes, including when all road pieces are used', () => {
  for (const useAllRoads of [false, true]) {
    let game = seaFixture()
    if (useAllRoads) for (const edge of game.board.edges.filter(edge => adjacentTiles(game, edge).every(tile => !tile.sea)).slice(0, 15)) { edge.owner = 0; edge.kind = 'road' }
    game = addCard(game, 'roads')
    const hand = structuredClone(game.players[0].hand)
    game = advanceCatan(game, { type: 'card', id: 1000 })
    assert.throws(() => advanceCatan(game, { type: 'finishRoads' }))
    const ship = game.board.edges.find(edge => canShip(game, edge.id))
    assert.ok(ship)
    game = advanceCatan(game, { type: 'ship', edge: ship.id })
    const route = game.board.edges.find(edge => useAllRoads ? canShip(game, edge.id) : canRoad(game, edge.id))
    assert.ok(route)
    game = advanceCatan(game, { type: useAllRoads ? 'ship' : 'road', edge: route.id })
    assert.equal(game.phase, 'turn')
    assert.deepEqual(game.players[0].hand, hand)
    assert.equal(shipCount(game, 0), useAllRoads ? 2 : 1)
  }
})

test('sailing to an offshore island enables settlement, once-per-island bonuses and production', () => {
  let game = seaFixture()
  const start = game.board.nodes.find(node => node.owner === 0)
  const queue = [{ node: start.id, route: [] }]
  const visited = new Set([start.id])
  let path
  while (queue.length) {
    const next = queue.shift()
    if (game.board.nodes[next.node].tiles.some(id => game.board.tiles[id].island > 0)) { path = next; break }
    for (const id of game.board.nodes[next.node].edges) {
      const edge = game.board.edges[id]
      if (!adjacentTiles(game, edge).some(tile => tile.sea) || adjacentTiles(game, edge).some(tile => tile.id === game.pirate)) continue
      const node = edge.a === next.node ? edge.b : edge.a
      if (!visited.has(node)) { visited.add(node); queue.push({ node, route: [...next.route, id] }) }
    }
  }
  assert.ok(path && path.route.length <= 6)
  for (const edge of path.route) {
    assert.ok(canShip(game, edge))
    game = advanceCatan(game, { type: 'ship', edge })
  }
  assert.ok(canSettle(game, path.node))
  game = advanceCatan(game, { type: 'settlement', node: path.node })
  assert.equal(islandBonus(game, 0), 2)
  assert.equal(publicPoints(game, 0), 4)
  const tile = game.board.tiles.find(tile => tile.island > 0 && tile.nodes.includes(path.node))
  const before = game.players[0].hand[tile.resource]
  const produced = game.board.tiles.filter(other => other.number === tile.number && other.resource === tile.resource && other.id !== game.robber)
    .reduce((sum, other) => sum + other.nodes.filter(id => game.board.nodes[id].owner === 0).length, 0)
  game.phase = 'roll'
  const first = Math.max(1, tile.number - 6); const second = tile.number - first
  const rolls = [(first - 0.5) / 6, (second - 0.5) / 6]
  game = advanceCatan(game, { type: 'roll' }, () => rolls.shift())
  assert.equal(game.players[0].hand[tile.resource], before + produced)
  // Upgrading does not award the island bonus again.
  game = rich(game)
  game = advanceCatan(game, { type: 'city', node: path.node })
  assert.equal(islandBonus(game, 0), 2)
  game.players[0].cards = Array.from({ length: 5 }, (_, id) => ({ id, type: 'victory', boughtOn: 0 }))
  game = advanceCatan(game, { type: 'bank', give: 'wood', receive: 'ore' })
  assert.equal(totalPoints(game, 0), 10)
  assert.equal(game.winner, null)
  game.players[0].cards.push(...Array.from({ length: 3 }, (_, id) => ({ id: id + 5, type: 'victory', boughtOn: 0 })))
  game = advanceCatan(game, { type: 'end' })
  assert.equal(game.winner, 0)
  assert.equal(game.phase, 'ended')
})
