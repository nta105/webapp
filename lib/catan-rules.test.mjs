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
import { bankAmount, canKnightMove, canRecruit, cityLimit, continueCities, goods, goodAmount, goodsCount, goodsRate, metropolisAt, retreatOptions, takeGood, tracks } from './catan-cities.ts'

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
  let checked = 0
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['requireRule', 'message', 'rule', 'log'].includes(node.expression.text)) {
      const text = node.arguments[1]
      if (text && ts.isStringLiteral(text)) {
        assert.notEqual(localizeCatanMessage('vi', text.text), text.text, text.text)
        checked++
      }
    }
    ts.forEachChild(node, visit)
  }
  for (const file of ['catan-rules.ts', 'catan-cities.ts']) visit(ts.createSourceFile(file, readFileSync(new URL(`./${file}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true))
  assert.ok(checked >= 25)
  const initial = createCatan(names(3), true, seeded()).log[0]
  assert.notEqual(localizeCatanMessage('vi', initial), initial)
})
const names = count => Array.from({ length: count }, (_, id) => `Player ${id + 1}`)
function ready(count = 4, version = 'classic') {
  let game = createCatan(names(count), false, seeded(), version)
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
  assert.throws(() => createCatan(names(7), true, seeded(), 'seafarers'))
})

test('expanded Seafarers graph keeps six isolated islands, coastal ports and connected sea routes', () => {
  for (let seed = 0; seed < 40; seed++) {
    const board = createSeafarersBoard(seeded(seed), true)
    assert.equal(board.tiles.length, 91)
    assert.equal(board.tiles.filter(tile => tile.sea).length, 55)
    assert.equal(board.tiles.filter(tile => tile.island === 0).length, 30)
    assert.equal(board.nodes.length - board.edges.length + board.tiles.length, 1)
    assert.equal(board.nodes.filter(node => node.port).length, 22)
    assert.deepEqual(board.tiles.slice(0, 30), createBoard(true, seeded(seed)).tiles.map(tile => ({ ...tile, island: 0 })))
    assert.equal(new Set(board.tiles.map(tile => `${tile.x},${tile.y}`)).size, 91)
    for (const tile of board.tiles.filter(tile => tile.island > 0)) {
      const neighbors = board.tiles.filter(other => other.id !== tile.id && tile.nodes.filter(id => other.nodes.includes(id)).length === 2)
      assert.ok(neighbors.length >= 3)
      assert.ok(neighbors.every(other => other.sea))
    }
    for (const node of board.nodes.filter(node => node.port)) assert.ok(node.tiles.some(id => board.tiles[id].sea))
    const seen = new Set([0]); const pending = [0]
    while (pending.length) {
      const node = board.nodes[pending.pop()]
      for (const id of node.edges) {
        const edge = board.edges[id]; const next = edge.a === node.id ? edge.b : edge.a
        if (!seen.has(next)) { seen.add(next); pending.push(next) }
      }
    }
    assert.equal(seen.size, board.nodes.length)
  }
})

test('all three versions randomize resource/number pairings on each board size while preserving token supplies', () => {
  const expectedNumbers = [
    [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
    [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12],
  ]
  for (const version of ['classic', 'seafarers', 'cities']) for (const count of [3, 4, 5, 6]) {
    const terrainLayouts = new Set()
    const numberLayouts = new Set()
    const pairedLayouts = new Set()
    const offshoreLayouts = new Set()
    const numbersByResource = new Map(resources.map(resource => [resource, new Set()]))
    const large = count > 4
    for (let seed = 0; seed < 64; seed++) {
      const { board } = createCatan(names(count), true, seeded(seed), version)
      const land = board.tiles.filter(tile => !tile.sea)
      terrainLayouts.add(land.map(tile => tile.resource).join(','))
      numberLayouts.add(land.map(tile => tile.number).join(','))
      pairedLayouts.add(land.map(tile => `${tile.resource}:${tile.number}`).join(','))
      const numbers = land.flatMap(tile => tile.number === null ? [] : [tile.number]).sort((a, b) => a - b)
      const expected = [...expectedNumbers[large ? 1 : 0], ...(version === 'seafarers' ? [3, 4, 5, 9, 10, 11] : [])].sort((a, b) => a - b)
      assert.deepEqual(numbers, expected)
      for (const tile of board.tiles) {
        if (tile.sea || tile.resource === null) assert.equal(tile.number, null)
        else {
          assert.ok(tile.number >= 2 && tile.number <= 12 && tile.number !== 7)
          numbersByResource.get(tile.resource).add(tile.number)
        }
      }
      for (const [index, resource] of resources.entries()) {
        const mainlandCount = (large ? [6, 5, 6, 6, 5] : [4, 3, 4, 4, 3])[index]
        assert.equal(land.filter(tile => tile.resource === resource).length,
          mainlandCount + (version === 'seafarers' ? resource === 'wood' ? 2 : 1 : 0))
      }
      const red = land.filter(tile => tile.number === 6 || tile.number === 8)
      for (const tile of red) for (const other of red) {
        if (tile.id !== other.id) assert.notEqual(tile.nodes.filter(id => other.nodes.includes(id)).length, 2)
      }
      if (version === 'seafarers') offshoreLayouts.add(land.filter(tile => tile.island > 0).map(tile => `${tile.resource}:${tile.number}`).join(','))
    }
    assert.equal(terrainLayouts.size, 64, `${version}, ${count} players: terrain varies`)
    assert.equal(numberLayouts.size, 64, `${version}, ${count} players: numbers vary`)
    assert.equal(pairedLayouts.size, 64, `${version}, ${count} players: pairings vary`)
    for (const numbers of numbersByResource.values()) assert.equal(numbers.size, 10)
    if (version === 'seafarers') assert.equal(offshoreLayouts.size, 64)
  }
})

test('Seafarers snake setup stays on mainland and allows free coastal ships for 3–6 players', () => {
  for (const count of [3, 4, 5, 6]) {
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
    for (const resource of resources) assert.equal(totalResources(game, resource), count > 4 ? 24 : 19)
    assert.equal(game.deck.length, count > 4 ? 34 : 25)
    assert.equal(game.targetPoints, 13)
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

function cityFixture(count = 3) {
  const game = createCatan(names(count), false, seeded(), 'cities')
  game.phase = 'turn'
  return game
}
function dice(first, second, event = .6) {
  const values = [(first - .5) / 6, (second - .5) / 6, event]
  return () => values.shift() ?? .5
}
function knight(owner, node, strength = 1, active = true) {
  return { owner, node, strength, active, readyOn: 0, promotedOn: -1 }
}
function assertGoodsSupply(game, supply = 19) {
  for (const good of goods) assert.equal(bankAmount(game, good) + game.players.reduce((sum, player) => sum + goodAmount(game, player.id, good), 0), supply, good)
}

test('Cities setup supports all 3–6 counts with a settlement, city, two roads and finite banks', () => {
  for (const count of [3, 4, 5, 6]) {
    const game = ready(count, 'cities')
    assert.equal(game.phase, 'roll')
    assert.equal(game.targetPoints, 13)
    assert.equal(game.deck.length, 0)
    for (const player of game.players) {
      assert.deepEqual(pieceCount(game, player.id), { settlements: 1, cities: 1, roads: 2 })
      assert.equal(publicPoints(game, player.id), 3)
      assert.equal(goodsCount(game, player.id), handSize(player.hand))
    }
    assertGoodsSupply(game, count > 4 ? 24 : 19)
    for (const track of tracks) assert.equal(game.cities.decks[track].length, 12)
    game.phase = 'turn'
    assert.throws(() => advanceCatan(game, { type: 'buy' }), /progress cards/)
  }
  assert.throws(() => advanceCatan(ready(), { type: 'recruit', node: 0 }), /mode is required/)
})

test('Cities production splits commodities and resources, conserves supply and respects robber', () => {
  for (const resource of resources) {
    let game = cityFixture()
    game.phase = 'roll'
    const tile = game.board.tiles.find(tile => tile.resource === resource && tile.id !== game.robber)
    game.board.nodes[tile.nodes[0]].owner = 0
    game.board.nodes[tile.nodes[0]].city = true
    const before = structuredClone(game)
    const first = Math.max(1, tile.number - 6), second = tile.number - first
    game = advanceCatan(game, { type: 'roll' }, dice(first, second))
    const commodity = { wood: 'paper', wool: 'cloth', ore: 'coin' }[resource]
    const matching = before.board.nodes[tile.nodes[0]].tiles.filter(id => before.board.tiles[id].resource === resource && before.board.tiles[id].number === tile.number).length
    assert.equal(game.players[0].hand[resource], matching * (commodity ? 1 : 2))
    if (commodity) assert.equal(game.cities.players[0].commodities[commodity], matching)
    assertGoodsSupply(game)
    before.robber = tile.id
    const blocked = advanceCatan(before, { type: 'roll' }, dice(first, second))
    assert.equal(blocked.players[0].hand[resource], (matching - 1) * (commodity ? 1 : 2))
  }
})

test('commodity shortage is independent from resource production; aqueduct checks actual receipts', () => {
  let game = cityFixture()
  const tile = game.board.tiles.find(tile => tile.resource === 'wood')
  for (const [owner, node] of tile.nodes.slice(0, 2).entries()) { game.board.nodes[node].owner = owner; game.board.nodes[node].city = true }
  game.cities.bank.paper = 1
  game.cities.players[2].commodities.paper = 18
  game.phase = 'roll'
  const first = Math.max(1, tile.number - 6)
  game = advanceCatan(game, { type: 'roll' }, dice(first, tile.number - first))
  assert.equal(game.cities.players[0].commodities.paper, 0)
  assert.equal(game.cities.players[1].commodities.paper, 0)
  assert.equal(game.cities.bank.paper, 1)
  assert.ok(game.players[0].hand.wood >= 1)
  assertGoodsSupply(game)
  game = cityFixture()
  game.cities.players[1].improvements.science = 3
  game.phase = 'roll'
  game = advanceCatan(game, { type: 'roll' }, dice(1, 1))
  assert.equal(game.phase, 'cityChoice')
  assert.equal(actingPlayer(game), 1)
  const chosen = advanceCatan(game, { type: 'cityChoice', resource: 'ore' })
  assert.equal(chosen.players[1].hand.ore, 1)
  assert.equal(chosen.phase, 'turn')
  for (const item of resources) game.bank[item] = 0
  game.phase = 'turn'; continueCities(game)
  assert.equal(game.phase, 'turn')
  assert.deepEqual(game.cities.choices, [])
})

test('walls raise combined goods discard limit and first-attack protection still enforces discards', () => {
  let game = cityFixture()
  game.board.nodes[0].owner = 0; game.board.nodes[0].city = true
  takeGood(game, 0, 'brick', 2)
  game = advanceCatan(game, { type: 'wall', node: 0 })
  assert.equal(cityLimit(game, 0), 9)
  takeGood(game, 0, 'paper', 5); takeGood(game, 0, 'wood', 4)
  takeGood(game, 1, 'coin', 8)
  game.phase = 'roll'
  game = advanceCatan(game, { type: 'roll' }, dice(3, 4))
  assert.deepEqual(game.discards, [1])
  assert.equal(actingPlayer(game), 1)
  const amounts = Object.fromEntries(goods.map(good => [good, good === 'coin' ? 4 : 0]))
  assert.throws(() => advanceCatan(game, { type: 'cityDiscard', amounts: { ...amounts, coin: 3 } }), /exactly half/)
  game = advanceCatan(game, { type: 'cityDiscard', amounts })
  assert.equal(game.phase, 'turn')
  assert.equal(goodsCount(game, 1), 4)
  assert.equal(game.cities.bank.coin, 15)
  assertGoodsSupply(game)
})

test('recruitment, activation, promotion and movement use proper costs and timing', () => {
  let game = rich(cityFixture())
  const edge = game.board.edges[0]; edge.owner = 0
  assert.ok(canRecruit(game, edge.a))
  game = advanceCatan(game, { type: 'recruit', node: edge.a })
  assert.equal(game.players[0].hand.ore, 7)
  assert.equal(game.players[0].hand.wool, 7)
  assert.equal(canSettle(game, edge.a), false)
  game = advanceCatan(game, { type: 'activate', node: edge.a })
  assert.equal(game.players[0].hand.grain, 7)
  assert.equal(canKnightMove(game, edge.a, edge.b), false)
  game = advanceCatan(game, { type: 'promote', node: edge.a })
  assert.equal(game.cities.knights[0].strength, 2)
  assert.throws(() => advanceCatan(game, { type: 'promote', node: edge.a }), /Promote once/)
  game.turn++
  assert.throws(() => advanceCatan(game, { type: 'promote', node: edge.a }), /Politics level three/)
  game.cities.players[0].improvements.politics = 3
  game = advanceCatan(game, { type: 'promote', node: edge.a })
  assert.equal(game.cities.knights[0].strength, 3)
  assert.ok(canKnightMove(game, edge.a, edge.b))
  game = advanceCatan(game, { type: 'knightMove', from: edge.a, to: edge.b })
  assert.equal(game.cities.knights[0].node, edge.b)
  assert.equal(game.cities.knights[0].active, false)
})

test('opposing knights interrupt road connectivity and displacement privately retreats', () => {
  let game = cityFixture()
  const tile = game.board.tiles[0]
  const edges = tile.nodes.map((node, index) => game.board.edges.find(edge => [edge.a, edge.b].includes(node) && [edge.a, edge.b].includes(tile.nodes[(index + 1) % 6])))
  edges.forEach(edge => { edge.owner = 0 })
  assert.equal(longestRoad(game, 0), 6)
  game.cities.knights = [knight(1, tile.nodes[0]), knight(1, tile.nodes[3])]
  assert.equal(longestRoad(game, 0), 3)
  game = cityFixture()
  const edge = game.board.edges[0]; edge.owner = 0
  const retreat = game.board.edges.find(other => other.id !== edge.id && [other.a, other.b].includes(edge.b))
  retreat.owner = 1
  game.cities.knights = [knight(0, edge.a, 2), knight(1, edge.b)]
  game = advanceCatan(game, { type: 'knightMove', from: edge.a, to: edge.b })
  assert.equal(game.phase, 'retreat')
  assert.equal(actingPlayer(game), 1)
  assert.equal(retreatOptions(game).length, 1)
  game = advanceCatan(game, { type: 'retreat', to: retreatOptions(game)[0] })
  assert.equal(game.phase, 'turn')
  assert.equal(game.cities.knights.length, 2)
  assert.equal(game.cities.knights.find(piece => piece.owner === 1).node, retreat.a === edge.b ? retreat.b : retreat.a)
})

test('barbarians deactivate knights and award sole defenders; attack does not skip discards', () => {
  let game = ready(3, 'cities')
  game.cities.barbarian = 6
  game.cities.knights = [knight(0, game.board.nodes.find(node => node.owner === null).id, 3)]
  const start = publicPoints(game, 0)
  game = advanceCatan(game, { type: 'roll' }, dice(1, 1, 0))
  assert.equal(game.phase, 'turn')
  assert.equal(game.cities.attacked, true)
  assert.equal(game.cities.barbarian, 0)
  assert.equal(game.cities.players[0].defender, 1)
  assert.equal(publicPoints(game, 0), start + 1)
  assert.equal(game.cities.knights[0].active, false)
  assert.equal(game.army, null)
  game = cityFixture()
  takeGood(game, 1, 'paper', 8)
  game.cities.barbarian = 6; game.phase = 'roll'
  game = advanceCatan(game, { type: 'roll' }, dice(3, 4, 0))
  assert.equal(game.phase, 'discard')
  assert.equal(game.cities.attacked, false)
  game = advanceCatan(game, { type: 'cityDiscard', amounts: Object.fromEntries(goods.map(good => [good, good === 'paper' ? 4 : 0])) })
  assert.equal(game.cities.attacked, true)
})

test('tied defenders choose private progress; losing players downgrade cities and lose walls', () => {
  let game = ready(3, 'cities')
  game.cities.knights = [knight(0, 0, 2), knight(1, 1, 2)]
  game.cities.barbarian = 6
  game = advanceCatan(game, { type: 'roll' }, dice(1, 1, 0))
  assert.equal(game.phase, 'progressChoice')
  assert.equal(actingPlayer(game), 0)
  game = advanceCatan(game, { type: 'progressChoice', track: 'science' })
  assert.equal(actingPlayer(game), 1)
  game = advanceCatan(game, { type: 'progressChoice', track: 'trade' })
  assert.equal(game.phase, 'turn')
  assert.equal(game.cities.players[0].progress.length, 1)
  assert.equal(game.cities.players[1].progress.length, 1)
  game.cities.barbarian = 6; game.phase = 'roll'
  const city = game.board.nodes.find(node => node.owner === 0 && node.city)
  game.cities.walls = [city.id]
  game = advanceCatan(game, { type: 'roll' }, dice(1, 1, 0))
  assert.deepEqual(game.cities.losses, [0, 1, 2])
  for (const actor of [0, 1, 2]) {
    assert.equal(actingPlayer(game), actor)
    const node = game.board.nodes.find(node => node.owner === actor && node.city)
    game = advanceCatan(game, { type: 'cityLoss', node: node.id })
  }
  assert.equal(game.phase, 'turn')
  assert.equal(game.cities.walls.length, 0)
  assert.equal(pieceCount(game, 0).settlements, 2)
})

test('metropolis transfers only to a higher level and upgrades charge increasing commodities', () => {
  let game = cityFixture()
  for (const owner of [0, 1]) { game.board.nodes[owner].owner = owner; game.board.nodes[owner].city = true }
  takeGood(game, 0, 'paper', 15)
  for (let level = 1; level <= 4; level++) {
    game = advanceCatan(game, { type: 'improve', track: 'science', node: 0 })
    assert.equal(game.cities.players[0].improvements.science, level)
  }
  assert.equal(metropolisAt(game, 0), 'science')
  assert.equal(publicPoints(game, 0), 4)
  assert.equal(game.cities.players[0].commodities.paper, 5)
  game.current = 1; game.cities.players[1].improvements.science = 3
  takeGood(game, 1, 'paper', 4)
  game = advanceCatan(game, { type: 'improve', track: 'science', node: 1 })
  assert.equal(metropolisAt(game, 0), 'science')
  takeGood(game, 1, 'paper', 5)
  game = advanceCatan(game, { type: 'improve', track: 'science', node: 1 })
  assert.equal(metropolisAt(game, 1), 'science')
  assert.equal(publicPoints(game, 0), 2)
  assert.equal(publicPoints(game, 1), 4)
  assertGoodsSupply(game)
})

test('metropolises resist barbarians; exhausted settlement pieces remove a lost city', () => {
  let game = cityFixture()
  game.board.nodes[0].owner = 0; game.board.nodes[0].city = true
  game.cities.metropolis.science = 0
  game.board.nodes[1].owner = 1; game.board.nodes[1].city = true
  for (const node of game.board.nodes.slice(2, 7)) node.owner = 1
  game.cities.barbarian = 6; game.phase = 'roll'
  game = advanceCatan(game, { type: 'roll' }, dice(1, 1, 0))
  assert.deepEqual(game.cities.losses, [1])
  game = advanceCatan(game, { type: 'cityLoss', node: 1 })
  assert.equal(game.board.nodes[1].owner, null)
  assert.equal(game.board.nodes[0].city, true)
  assert.equal(pieceCount(game, 1).settlements, 5)
})

test('colored events use red die and improvement levels, enforce four cards and recycle used cards', () => {
  let game = cityFixture()
  game.cities.players[0].improvements.science = 1
  game.cities.players[1].improvements.science = 1
  game.cities.players[0].progress = ['supply', 'engineer', 'supply', 'engineer']
  game.cities.decks.science = []; game.cities.used.science = ['supply']
  game.phase = 'roll'
  game = advanceCatan(game, { type: 'roll' }, dice(2, 3, .5))
  assert.equal(game.phase, 'progressDiscard')
  assert.equal(actingPlayer(game), 0)
  assert.equal(game.cities.players[0].progress.length, 5)
  assert.equal(game.cities.players[1].progress.length, 0)
  assert.ok(game.log.includes('This progress deck is empty; no card was drawn.'))
  game = advanceCatan(game, { type: 'progressDiscard', index: 4 })
  assert.equal(game.phase, 'turn')
  assert.deepEqual(game.cities.used.science, ['supply'])
  game.phase = 'roll'
  game = advanceCatan(game, { type: 'roll' }, dice(3, 2, .5))
  assert.equal(game.cities.players[0].progress.length, 4)
})

test('all six custom progress actions apply their effects and play after roll only', () => {
  let game = cityFixture()
  game.board.nodes[0].owner = 0; game.board.nodes[0].city = true
  game.cities.players[0].progress = ['supply', 'engineer', 'fleet', 'monopoly']
  game = advanceCatan(game, { type: 'progress', card: 'supply', resource: 'wood', node: 0 })
  assert.equal(game.players[0].hand.wood, 2)
  game = advanceCatan(game, { type: 'progress', card: 'engineer', resource: 'wood', node: 0 })
  assert.deepEqual(game.cities.walls, [0])
  game = advanceCatan(game, { type: 'progress', card: 'fleet', resource: 'wood', node: 0 })
  assert.equal(goodsRate(game, 'wood'), 2)
  takeGood(game, 1, 'wood', 3); takeGood(game, 2, 'wood', 1)
  game = advanceCatan(game, { type: 'progress', card: 'monopoly', resource: 'wood', node: 0 })
  assert.equal(game.players[0].hand.wood, 5)
  assert.equal(game.players[1].hand.wood, 1)
  game.cities.players[0].progress = ['mobilize', 'bishop']
  game.cities.knights = [knight(0, 1, 1, false)]
  game = advanceCatan(game, { type: 'progress', card: 'mobilize', resource: 'wood', node: 0 })
  assert.equal(game.cities.knights[0].active, true)
  assert.equal(game.cities.knights[0].readyOn, game.turn + 1)
  assert.throws(() => advanceCatan(game, { type: 'progress', card: 'bishop', resource: 'wood', node: 0 }), /first barbarian attack/)
  game.cities.attacked = true
  game = advanceCatan(game, { type: 'progress', card: 'bishop', resource: 'wood', node: 0 })
  assert.equal(game.phase, 'robber')
  assert.equal(game.cities.players[0].progress.length, 0)
  game.phase = 'roll'; game.cities.players[0].progress = ['supply']
  assert.throws(() => advanceCatan(game, { type: 'progress', card: 'supply', resource: 'wood', node: 0 }), /current step/)
})

test('Cities bank/player trades include commodities, require acceptance and preserve every good', () => {
  let game = cityFixture()
  game.cities.players[0].improvements.trade = 3
  takeGood(game, 0, 'cloth', 4); takeGood(game, 1, 'coin', 3)
  assert.equal(goodsRate(game, 'cloth'), 2)
  game = advanceCatan(game, { type: 'goodsBank', give: 'cloth', receive: 'paper' })
  assert.equal(game.cities.players[0].commodities.cloth, 2)
  assert.equal(game.cities.players[0].commodities.paper, 1)
  game = advanceCatan(game, { type: 'goodsOffer', target: 1, give: 'cloth', receive: 'coin', giveCount: 2, receiveCount: 3 })
  assert.equal(actingPlayer(game), 1)
  assert.equal(game.cities.players[0].commodities.cloth, 2)
  assert.throws(() => advanceCatan(game, { type: 'end' }), /current step/)
  game = advanceCatan(game, { type: 'goodsAnswer', accept: true })
  assert.equal(game.cities.players[0].commodities.coin, 3)
  assert.equal(game.cities.players[1].commodities.cloth, 2)
  assertGoodsSupply(game)
})

test('robber steals a commodity-only hand after the first attack', () => {
  let game = cityFixture()
  game.cities.attacked = true; game.phase = 'robber'
  const tile = game.board.tiles.find(tile => tile.id !== game.robber && tile.resource)
  game.board.nodes[tile.nodes[0]].owner = 1
  takeGood(game, 1, 'coin', 1)
  game = advanceCatan(game, { type: 'robber', tile: tile.id })
  assert.equal(game.phase, 'steal')
  assert.deepEqual(game.victims, [1])
  game = advanceCatan(game, { type: 'steal', player: 1 }, () => 0)
  assert.equal(game.cities.players[0].commodities.coin, 1)
  assert.equal(game.cities.players[1].commodities.coin, 0)
  assert.equal(game.phase, 'turn')
})

test('Cities wins at thirteen only on own turn and never gains Largest Army', () => {
  let game = cityFixture()
  game.cities.players[0].defender = 12; game.cities.players[1].defender = 13
  game.players[0].knights = 99
  game = advanceCatan(game, { type: 'end' })
  assert.equal(game.current, 1)
  assert.equal(game.winner, 1)
  assert.equal(game.army, null)
  assert.equal(game.phase, 'ended')
})

test('Cities walls and knight strength inventories have independent piece limits', () => {
  let game = rich(cityFixture())
  for (const node of game.board.nodes.slice(0, 4)) { node.owner = 0; node.city = true }
  for (const node of [0, 1, 2]) game = advanceCatan(game, { type: 'wall', node })
  assert.equal(cityLimit(game, 0), 13)
  assert.throws(() => advanceCatan(game, { type: 'wall', node: 3 }), /at most three walls/)
  game = rich(cityFixture())
  const edge = game.board.edges.find(edge => game.board.nodes[edge.a].owner === null && game.board.nodes[edge.b].owner === null)
  game.board.edges[edge.id].owner = 0
  const extra = game.board.edges.find(other => other.id !== edge.id && [other.a, other.b].includes(edge.a) && game.board.nodes[other.a].owner === null && game.board.nodes[other.b].owner === null)
  extra.owner = 0
  const empty = extra.a === edge.a ? extra.b : extra.a
  game.cities.knights = [knight(0, edge.a, 1, false), knight(0, edge.b, 1, false)]
  assert.equal(game.board.nodes.some(node => canRecruit(game, node.id)), false)
  game = advanceCatan(game, { type: 'promote', node: edge.a })
  assert.ok(canRecruit(game, empty))
})

test('trapped displaced knights leave the board; only an older active knight can drive the robber', () => {
  let game = cityFixture()
  const edge = game.board.edges[0]; edge.owner = 0
  game.cities.knights = [knight(0, edge.a, 2), knight(1, edge.b)]
  game = advanceCatan(game, { type: 'knightMove', from: edge.a, to: edge.b })
  assert.equal(game.phase, 'turn')
  assert.equal(game.cities.knights.length, 1)
  assert.ok(game.log.includes('A displaced knight had no retreat and left the board.'))
  const node = game.board.tiles[game.robber].nodes[0]
  game.cities.knights = [knight(0, node)]
  assert.throws(() => advanceCatan(game, { type: 'driveRobber', node }), /first barbarian attack/)
  game.cities.attacked = true
  game = advanceCatan(game, { type: 'driveRobber', node })
  assert.equal(game.phase, 'robber')
  assert.equal(game.cities.knights[0].active, false)
  game.phase = 'turn'
  assert.throws(() => advanceCatan(game, { type: 'driveRobber', node }), /older active knight/)
})

test('declined goods offers do not move goods and fleet discounts expire at the next own turn', () => {
  let game = cityFixture()
  takeGood(game, 0, 'cloth', 2)
  game.cities.players[0].fleet = 'wood'
  const before = structuredClone(game)
  game = advanceCatan(game, { type: 'goodsOffer', target: 1, give: 'cloth', receive: 'paper', giveCount: 2, receiveCount: 1 })
  assert.throws(() => advanceCatan(game, { type: 'goodsAnswer', accept: true }), /Both players/)
  game = advanceCatan(game, { type: 'goodsAnswer', accept: false })
  assert.deepEqual(game.players, before.players)
  assert.deepEqual(game.cities.players, before.cities.players)
  for (let turn = 0; turn < 3; turn++) {
    game.phase = 'turn'
    game = advanceCatan(game, { type: 'end' })
  }
  assert.equal(game.current, 0)
  assert.equal(game.cities.players[0].fleet, null)
  assert.equal(game.phase, 'roll')
})
