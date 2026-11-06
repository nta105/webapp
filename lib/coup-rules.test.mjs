import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceCoup, canTargetCoupPlayer, createCoup, coupRoles } from './coup-rules.ts'
import { coupTranslator, localizeCoupError, localizeCoupMessage, localizeCoupRole, localizeCoupRoleDetails } from './coup-i18n.ts'

const names = count => Array.from({ length: count }, (_, index) => `Player ${index + 1}`)

const readyGame = (hands, coins = [], firstPlayer = 0) => {
  let game = createCoup(names(hands.length), firstPlayer, () => 0.999)
  for (let index = 0; index < hands.length; index++) game = advanceCoup(game, { type: 'reveal' })

  const used = hands.flat()
  const remaining = coupRoles.flatMap(role => Array(3 - used.filter(card => card === role).length).fill(role))
  return {
    ...game,
    currentPlayer: firstPlayer,
    players: game.players.map((player, id) => ({
      ...player,
      cards: [...hands[id]],
      coins: coins[id] ?? 2,
    })),
    deck: remaining,
    mustCoup: (coins[firstPlayer] ?? 2) >= 10,
  }
}

test('English remains the default while Vietnamese translates role labels and dynamic game messages', () => {
  const vi = coupTranslator('vi')
  assert.equal(coupTranslator('en')('dealCards'), 'Deal the cards')
  assert.equal(vi('dealCards'), 'Chia bài')
  assert.equal(vi('roleReference'), 'Tra cứu vai trò · mọi người đều xem được')
  assert.equal(localizeCoupRole('vi', 'Duke'), 'Công tước')
  assert.equal(localizeCoupRoleDetails('en', 'Duke').block, 'Block Foreign Aid.')
  assert.equal(localizeCoupRoleDetails('vi', 'Captain').block, 'Chặn hành động Cướp xu nhắm vào bạn.')
  assert.equal(localizeCoupRoleDetails('vi', 'Contessa').action, 'Không có hành động để tuyên bố.')
  assert.equal(localizeCoupRole('vi', 'Inquisitor'), 'Thẩm tra viên')
  assert.equal(localizeCoupMessage('vi', 'Player 1 changed allegiance to Azure.'), 'Player 1 đã đổi phe sang Xanh Lam.')
  assert.equal(localizeCoupMessage('vi', 'Player 1 took 3 coins from the Court.'), 'Player 1 lấy 3 xu từ Bộ bài Cung đình.')
  assert.equal(localizeCoupMessage('vi', 'Player 2 lost Assassin. Player 1 is the last player standing.'), 'Player 2 đã mất vai Sát thủ. Player 1 là người cuối cùng còn trụ lại.')
  assert.equal(localizeCoupError('vi', 'A Coup costs 7 coins.'), 'Một lần Đảo chính tốn 7 xu.')
  assert.equal(localizeCoupError('en', 'A Coup costs 7 coins.'), 'A Coup costs 7 coins.')
})

test('setup deals two hidden influences and two coins per player from the 15-card deck', () => {
  const game = createCoup(names(6), 2, () => 0.5)
  assert.equal(game.phase, 'reveal')
  assert.equal(game.deck.length, 3)
  assert.deepEqual(game.players.map(player => player.cards.length), Array(6).fill(2))
  assert.deepEqual(game.players.map(player => player.coins), Array(6).fill(2))
  for (const role of coupRoles) {
    assert.equal([...game.deck, ...game.players.flatMap(player => player.cards)].filter(card => card === role).length, 3)
  }
  assert.throws(() => createCoup(names(2), 0))
  assert.throws(() => createCoup(['A', 'a', 'C'], 0))
  assert.deepEqual(game.players.map(player => player.faction), ['Azure', 'Crimson', 'Azure', 'Crimson', 'Azure', 'Crimson'])
  assert.throws(() => createCoup(names(3), 0, Math.random, ['Azure', 'Azure', 'Azure']))
})

test('changing allegiance costs one coin and consumes the entire turn without granting victory', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'convert' })
  assert.equal(game.players[0].faction, 'Crimson')
  assert.equal(game.players[0].coins, 1)
  assert.equal(game.currentPlayer, 1)
  assert.equal(game.phase, 'turn')
  assert.equal(game.winner, null)
  assert.throws(() => advanceCoup({ ...game, currentPlayer: 0, players: game.players.map(player => player.id === 0 ? { ...player, coins: 0 } : player) }, { type: 'takeAction', action: 'convert' }))

  game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [10, 2, 2])
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'convert' }))
  assert.equal(game.mustCoup, true)
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'income' }))

  game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [], 1)
  game = advanceCoup(game, { type: 'takeAction', action: 'convert' })
  assert.equal(new Set(game.players.map(player => player.faction)).size, 1)
  assert.equal(game.phase, 'turn')
  assert.equal(game.winner, null)
  assert.equal(canTargetCoupPlayer(game, 0, 2), true)
})

test('Coup and assassination cannot target an ally while factions differ; only the last individual wins', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [7, 2, 2])
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 2 }))
  assert.throws(() => advanceCoup({ ...game, players: game.players.map(player => player.id === 0 ? { ...player, coins: 3 } : player) }, { type: 'takeAction', action: 'assassinate', targetId: 2 }))
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  game = { ...game, currentPlayer: 0, players: game.players.map(player => player.id === 0 ? { ...player, coins: 7 } : player.id === 2 ? { ...player, alive: false, cards: [], coins: 0 } : player) }
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'ended')
  assert.equal(game.winner, 0)
})

test('Inquisitor can inspect a target and force one influence to be exchanged with the Court', () => {
  let game = readyGame([['Inquisitor', 'Duke'], ['Assassin', 'Captain'], ['Contessa', 'Duke']])
  game = advanceCoup(game, { type: 'takeAction', action: 'investigate', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  assert.equal(game.phase, 'inspectChoice')
  assert.equal(game.message, 'Player 1 is investigating Player 2.')
  assert.throws(() => advanceCoup(game, { type: 'forceExchange' }))
  assert.throws(() => advanceCoup(game, { type: 'showForInspection', playerId: 0, cardIndex: 0 }))
  game = advanceCoup(game, { type: 'showForInspection', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'investigate')
  assert.equal(game.inspectedCardIndex, 0)
  const courtSize = game.deck.length
  const otherCard = game.players[1].cards[1]
  game = advanceCoup(game, { type: 'forceExchange' }, () => 0.5)
  assert.equal(game.phase, 'turn')
  assert.equal(game.players[1].cards.length, 2)
  assert.equal(game.players[1].cards[1], otherCard)
  assert.equal(game.inspectedCardIndex, null)
  assert.equal(game.deck.length, courtSize)
  assert.equal([...game.deck, ...game.players.flatMap(player => player.cards), ...game.players.flatMap(player => player.revealed)].length, 15)
})

test('the selected first player takes the first turn after all private reveals', () => {
  let game = createCoup(names(4), 2, () => 0.5)
  for (let index = 0; index < game.players.length; index++) {
    game = advanceCoup(game, { type: 'reveal' })
    assert.equal(game.currentPlayer, 2)
  }
  assert.equal(game.phase, 'turn')

  game = advanceCoup(game, { type: 'takeAction', action: 'income' })
  assert.equal(game.currentPlayer, 3)
})

test('income, tax, foreign aid, steal and exchange resolve their standard effects', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'income' })
  assert.equal(game.players[0].coins, 3)
  assert.equal(game.currentPlayer, 1)

  game = { ...game, currentPlayer: 0 }
  game = advanceCoup(game, { type: 'takeAction', action: 'tax' })
  game = advanceCoup(game, { type: 'pass' })
  assert.equal(game.players[0].coins, 6)

  game = { ...game, currentPlayer: 0 }
  game = advanceCoup(game, { type: 'takeAction', action: 'foreignAid' })
  game = advanceCoup(game, { type: 'allow' })
  assert.equal(game.players[0].coins, 8)

  game = { ...game, currentPlayer: 0, players: game.players.map(player => player.id === 0 ? { ...player, coins: 2 } : player) }
  game = advanceCoup(game, { type: 'takeAction', action: 'steal', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  game = advanceCoup(game, { type: 'allow' })
  assert.equal(game.players[0].coins, 4)
  assert.equal(game.players[1].coins, 0)

  game = { ...game, currentPlayer: 0 }
  game = advanceCoup(game, { type: 'takeAction', action: 'exchange' })
  game = advanceCoup(game, { type: 'pass' })
  assert.equal(game.phase, 'exchange')
  const result = advanceCoup(game, { type: 'exchange', playerId: 0, keep: [0, 1] }, () => 0.5)
  assert.equal(result.phase, 'turn')
  assert.equal(result.players[0].cards.length, 2)
  assert.equal(result.deck.length + result.players.reduce((sum, player) => sum + player.cards.length + player.revealed.length, 0), 15)
})

test('a truthful challenge replaces the claimed card and makes the challenger lose influence', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'tax' })
  game = advanceCoup(game, { type: 'challenge', playerId: 1 }, () => 0.999)
  assert.equal(game.phase, 'loseInfluence')
  assert.equal(game.lossPlayerId, 1)
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 }, () => 0.5)
  assert.equal(game.phase, 'turn')
  assert.equal(game.currentPlayer, 1)
  assert.equal(game.players[0].cards.length, 2)
  assert.equal(game.deck.length + game.players.reduce((sum, player) => sum + player.cards.length + player.revealed.length, 0), 15)
  assert.deepEqual(game.players[1].revealed, ['Captain'])
})

test('a truthful role claim ends the game if its challenge eliminates the last opponent', () => {
  const roleForAction = { assassinate: 'Assassin', steal: 'Captain', exchange: 'Inquisitor' }
  for (const action of Object.keys(roleForAction)) {
    let game = readyGame([[roleForAction[action], 'Duke'], ['Contessa'], ['Inquisitor', 'Contessa']], [5, 2, 2])
    game = {
      ...game,
      players: game.players.map(player => player.id === 2 ? { ...player, cards: [], alive: false, coins: 0 } : player),
    }

    game = advanceCoup(game, { type: 'takeAction', action, ...(action === 'exchange' ? {} : { targetId: 1 }) })
    game = advanceCoup(game, { type: 'challenge', playerId: 1 }, () => 0.5)
    game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })

    assert.equal(game.phase, 'ended', `${action} claim should end the game`)
    assert.equal(game.winner, 0)
    assert.equal(game.pending, null)
  }
})

test('a false action claim costs influence and cancels the action', () => {
  let game = readyGame([['Captain', 'Contessa'], ['Duke', 'Assassin'], ['Inquisitor', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'tax' })
  game = advanceCoup(game, { type: 'challenge', playerId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 0, cardIndex: 0 })
  assert.equal(game.players[0].coins, 2)
  assert.equal(game.players[0].cards.length, 1)
  assert.deepEqual(game.players[0].revealed, ['Captain'])
  assert.equal(game.currentPlayer, 1)
})

test('a resolved action claim cannot be challenged during the block decision', () => {
  let game = readyGame([['Assassin', 'Duke'], ['Captain', 'Contessa'], ['Inquisitor', 'Duke']], [3, 2, 2])
  game = advanceCoup(game, { type: 'takeAction', action: 'assassinate', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  assert.throws(() => advanceCoup(game, { type: 'challenge', playerId: 2 }))
})

test('foreign aid can be blocked by a truthful Duke and the block can be challenged', () => {
  let game = readyGame([['Captain', 'Contessa'], ['Duke', 'Assassin'], ['Inquisitor', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'foreignAid' })
  game = advanceCoup(game, { type: 'block', playerId: 1, role: 'Duke' })
  game = advanceCoup(game, { type: 'challenge', playerId: 2 }, () => 0.5)
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 2, cardIndex: 0 })
  assert.equal(game.players[0].coins, 2)
  assert.equal(game.players[1].coins, 2)
  assert.equal(game.players[2].revealed.length, 1)
})

test('a false block loses influence and allows the blocked action to resolve', () => {
  let game = readyGame([['Captain', 'Contessa'], ['Assassin', 'Inquisitor'], ['Duke', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'foreignAid' })
  game = advanceCoup(game, { type: 'block', playerId: 1, role: 'Duke' })
  game = advanceCoup(game, { type: 'challenge', playerId: 2 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.players[0].coins, 4)
  assert.equal(game.players[1].revealed[0], 'Assassin')
  assert.equal(game.currentPlayer, 1)
})

test('a false assassination block costs the blocker influence and does not stop the assassination', () => {
  let game = readyGame([['Assassin', 'Duke'], ['Captain', 'Inquisitor'], ['Contessa', 'Duke']], [5, 2, 2])
  game = advanceCoup(game, { type: 'takeAction', action: 'assassinate', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  game = advanceCoup(game, { type: 'block', playerId: 1, role: 'Contessa' })
  game = advanceCoup(game, { type: 'challenge', playerId: 2 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'loseInfluence')
  assert.equal(game.lossPlayerId, 1)
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.players[1].alive, false)
  assert.equal(game.players[0].coins, 2)
})

test('assassination costs three coins and Contessa blocks it', () => {
  let game = readyGame([['Assassin', 'Duke'], ['Contessa', 'Captain'], ['Inquisitor', 'Duke']], [5, 2, 2])
  game = advanceCoup(game, { type: 'takeAction', action: 'assassinate', targetId: 1 })
  assert.equal(game.players[0].coins, 2)
  game = advanceCoup(game, { type: 'pass' })
  game = advanceCoup(game, { type: 'block', playerId: 1, role: 'Contessa' })
  game = advanceCoup(game, { type: 'pass' })
  assert.equal(game.phase, 'turn')
  assert.equal(game.players[1].cards.length, 2)
  assert.equal(game.currentPlayer, 1)
})

test('Coup costs seven, ignores blocks, eliminates influence, and is mandatory at ten coins', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [10, 2, 2])
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'income' }))
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  assert.equal(game.players[0].coins, 3)
  assert.equal(game.phase, 'loseInfluence')
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.players[1].cards.length, 1)
  assert.equal(game.currentPlayer, 1)
})

test('losing a second influence eliminates a player and ends when one remains', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [7, 2, 2])
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  game = { ...game, currentPlayer: 0, players: game.players.map(player => player.id === 1 ? { ...player, cards: ['Assassin'], alive: true, coins: 2 } : player) }
  game = { ...game, players: game.players.map(player => player.id === 0 ? { ...player, coins: 7 } : player.id === 2 ? { ...player, cards: [], alive: false, coins: 0 } : player) }
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'ended')
  assert.equal(game.winner, 0)
  assert.equal(game.players[1].coins, 0)
})

test('one-influence exchanges retain one card and never restore lost influence', () => {
  let game = readyGame([['Inquisitor', 'Duke'], ['Captain', 'Assassin'], ['Contessa', 'Duke']], [2, 7, 2], 1)
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 0 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 0, cardIndex: 1 })
  game = { ...game, currentPlayer: 0 }
  game = advanceCoup(game, { type: 'takeAction', action: 'exchange' })
  game = advanceCoup(game, { type: 'pass' })
  assert.equal(game.exchangeOptions.length, 2)
  assert.throws(() => advanceCoup(game, { type: 'exchange', playerId: 0, keep: [0, 1] }))
  assert.throws(() => advanceCoup(game, { type: 'exchange', playerId: 1, keep: [1] }))
  game = advanceCoup(game, { type: 'exchange', playerId: 0, keep: [1] }, () => 0.5)
  assert.equal(game.players[0].cards.length, 1)
  assert.deepEqual(game.players[0].revealed, ['Duke'])
  assert.equal(game.players[0].cards[0], 'Contessa')
  assertCardConservation(game)
})

test('stealing and Foreign Aid blocks follow temporary faction restrictions', () => {
  const game = readyGame([['Captain', 'Duke'], ['Assassin', 'Contessa'], ['Inquisitor', 'Duke']])
  assert.equal(canTargetCoupPlayer(game, 0, 0), false)
  assert.equal(canTargetCoupPlayer(game, 0, 99), false)
  assert.equal(canTargetCoupPlayer(game, 0, 2), false)
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'steal', targetId: 2 }))
  const aid = advanceCoup(game, { type: 'takeAction', action: 'foreignAid' })
  assert.throws(() => advanceCoup(aid, { type: 'block', playerId: 2, role: 'Duke' }))
  assert.equal(advanceCoup(aid, { type: 'block', playerId: 1, role: 'Duke' }).pending.blockerId, 1)

  const sameFaction = { ...game, players: game.players.map(player => ({ ...player, faction: 'Azure' })) }
  let steal = advanceCoup(sameFaction, { type: 'takeAction', action: 'steal', targetId: 2 })
  steal = advanceCoup(steal, { type: 'pass' })
  steal = advanceCoup(steal, { type: 'allow' })
  assert.equal(steal.players[0].coins, 4)
  assert.equal(steal.phase, 'turn')
  const unlockedAid = advanceCoup(sameFaction, { type: 'takeAction', action: 'foreignAid' })
  assert.equal(advanceCoup(unlockedAid, { type: 'block', playerId: 2, role: 'Duke' }).pending.blockerId, 2)
})

test('eliminating the last opposing faction does not end the game or lock out mandatory coups', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain'], ['Inquisitor', 'Assassin']], [7, 2, 10])
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'turn')
  assert.equal(game.winner, null)
  assert.equal(game.currentPlayer, 2)
  assert.equal(game.mustCoup, true)
  assert.equal(canTargetCoupPlayer(game, 2, 0), true)
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 0 })
  assert.equal(game.phase, 'loseInfluence')
})

test('any other living player can challenge, including an ally', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Duke']])
  game = advanceCoup(game, { type: 'takeAction', action: 'tax' })
  assert.throws(() => advanceCoup(game, { type: 'challenge', playerId: 0 }))
  game = advanceCoup(game, { type: 'challenge', playerId: 2 })
  assert.equal(game.lossPlayerId, 2)
})

test('an Inquisitor can leave the shown card alone; inspection choices require a valid owner and index', () => {
  let game = readyGame([['Inquisitor', 'Duke'], ['Assassin', 'Captain'], ['Contessa', 'Duke']])
  game = advanceCoup(game, { type: 'takeAction', action: 'investigate', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  for (const cardIndex of [-1, 0.5, 2, NaN]) {
    assert.throws(() => advanceCoup(game, { type: 'showForInspection', playerId: 1, cardIndex }))
  }
  const before = structuredClone(game.players)
  game = advanceCoup(game, { type: 'showForInspection', playerId: 1, cardIndex: 1 })
  assert.throws(() => advanceCoup(game, { type: 'showForInspection', playerId: 1, cardIndex: 0 }))
  game = advanceCoup(game, { type: 'finishInvestigation' })
  assert.deepEqual(game.players, before)
  assert.equal(game.phase, 'turn')
  assert.equal(game.inspectedCardIndex, null)
})

test('a target eliminated by challenging a truthful investigation does not need to show a card', () => {
  let game = readyGame([['Inquisitor', 'Duke'], ['Captain'], ['Contessa', 'Duke']])
  game = advanceCoup(game, { type: 'takeAction', action: 'investigate', targetId: 1 })
  game = advanceCoup(game, { type: 'challenge', playerId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'turn')
  assert.equal(game.players[1].alive, false)
  assert.equal(game.currentPlayer, 2)
})

test('replacement hands reflect successful challenges and forced exchanges without leaking replacements in messages', () => {
  let game = readyGame([['Duke', 'Inquisitor'], ['Assassin', 'Captain'], ['Contessa', 'Duke']])
  const original = [...game.players[0].cards]
  game = advanceCoup(game, { type: 'takeAction', action: 'tax' })
  game = advanceCoup(game, { type: 'challenge', playerId: 1 }, () => 0.5)
  assert.equal(game.players[0].cards.length, 2)
  assert.equal(game.players[0].cards[1], original[1])
  assert.notDeepEqual(game.players[0].cards, original)
  assertCardConservation(game)

  game = readyGame([['Inquisitor', 'Duke'], ['Assassin', 'Captain'], ['Contessa', 'Duke']])
  const untouched = game.players[1].cards[0]
  game = advanceCoup(game, { type: 'takeAction', action: 'investigate', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  game = advanceCoup(game, { type: 'showForInspection', playerId: 1, cardIndex: 1 })
  const replacement = game.deck.at(-1)
  game = advanceCoup(game, { type: 'forceExchange' })
  assert.deepEqual(game.players[1].cards, [untouched, replacement])
  assert.equal(game.message, 'Player 1 forced Player 2 to exchange a card with the Court.')
  assertCardConservation(game)
})

function assertCardConservation(game) {
  const cards = [
    ...game.deck,
    ...game.players.flatMap(player => game.phase === 'exchange' && player.id === game.pending.actorId ? player.revealed : [...player.cards, ...player.revealed]),
    ...game.exchangeOptions,
  ]
  assert.equal(cards.length, 15)
  for (const role of coupRoles) assert.equal(cards.filter(card => card === role).length, 3, role)
  for (const player of game.players) {
    assert.equal(player.alive, player.cards.length > 0)
    assert.ok(player.cards.length + player.revealed.length <= 2)
    assert.ok(Number.isInteger(player.coins) && player.coins >= 0)
  }
}

test('seeded complete matches preserve every card, influence count, turn, and individual victory', () => {
  for (let seed = 1; seed <= 40; seed++) {
    let state = seed
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0
      return state / 4294967296
    }
    const pick = items => items[Math.floor(random() * items.length)]
    let game = createCoup(names(3 + seed % 4), seed % 3, random)
    let steps = 0
    while (game.phase !== 'ended' && steps++ < 1500) {
      assertCardConservation(game)
      const actor = game.players[game.currentPlayer]
      let action
      if (game.phase === 'reveal') action = { type: 'reveal' }
      if (game.phase === 'turn') {
        assert.ok(actor.alive)
        const targets = game.players.filter(player => canTargetCoupPlayer(game, actor.id, player.id))
        assert.ok(targets.length > 0)
        if (actor.coins >= 7) {
          action = { type: 'takeAction', action: 'coup', targetId: pick(targets).id }
        } else {
          const chosen = pick(['income', 'income', 'tax', 'foreignAid', 'exchange', 'steal', 'assassinate', 'investigate', 'convert'])
          const unaffordable = chosen === 'convert' && actor.coins === 0 || chosen === 'assassinate' && actor.coins < 3
          action = { type: 'takeAction', action: unaffordable ? 'income' : chosen, targetId: pick(targets).id }
        }
      }
      if (game.phase === 'response') {
        const pending = game.pending
        if (pending.stage === 'blockChoice') {
          const blockers = pending.action === 'foreignAid'
            ? game.players.filter(player => canTargetCoupPlayer(game, pending.actorId, player.id))
            : game.players.filter(player => player.id === pending.targetId && player.alive)
          action = blockers.length && random() < 0.4
            ? { type: 'block', playerId: pick(blockers).id, role: pending.action === 'foreignAid' ? 'Duke' : pending.action === 'assassinate' ? 'Contessa' : pick(['Captain', 'Inquisitor']) }
            : { type: 'allow' }
        } else {
          const claimant = pending.stage === 'blockChallenge' ? pending.blockerId : pending.actorId
          const challengers = game.players.filter(player => player.alive && player.id !== claimant)
          action = random() < 0.4 ? { type: 'challenge', playerId: pick(challengers).id } : { type: 'pass' }
        }
      }
      if (game.phase === 'loseInfluence') {
        const losing = game.players[game.lossPlayerId]
        action = { type: 'loseInfluence', playerId: losing.id, cardIndex: Math.floor(random() * losing.cards.length) }
      }
      if (game.phase === 'exchange') {
        const indices = game.exchangeOptions.map((_, index) => index)
        const keep = []
        while (keep.length < actor.cards.length) keep.push(indices.splice(Math.floor(random() * indices.length), 1)[0])
        action = { type: 'exchange', playerId: actor.id, keep }
      }
      if (game.phase === 'inspectChoice') action = { type: 'showForInspection', playerId: game.pending.targetId, cardIndex: 0 }
      if (game.phase === 'investigate') action = { type: random() < 0.5 ? 'forceExchange' : 'finishInvestigation' }
      const previous = game
      const before = structuredClone(game)
      game = advanceCoup(game, action, random)
      assert.deepEqual(previous, before)
    }
    assert.ok(steps < 1500, `Seed ${seed} did not finish`)
    assertCardConservation(game)
    assert.equal(game.players.filter(player => player.alive).length, 1)
    assert.equal(game.winner, game.players.find(player => player.alive).id)
  }
})
