import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceCoup, createCoup, coupRoles } from './coup-rules.ts'
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
  assert.equal(localizeCoupMessage('vi', 'Catholic faction wins Coup.'), 'Phe Công giáo chiến thắng Coup!')
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
  assert.throws(() => createCoup(names(3), 0, Math.random, ['Catholic', 'Catholic', 'Catholic']))
})

test('changing allegiance costs one coin without consuming the action, and is limited once per turn', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']])
  game = advanceCoup(game, { type: 'takeAction', action: 'convert' })
  assert.equal(game.players[0].faction, 'Protestant')
  assert.equal(game.players[0].coins, 1)
  assert.equal(game.currentPlayer, 0)
  assert.equal(game.phase, 'turn')
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'convert' }))
  game = advanceCoup(game, { type: 'takeAction', action: 'income' })
  assert.equal(game.currentPlayer, 1)
  assert.equal(game.players[0].coins, 2)
  assert.throws(() => advanceCoup({ ...game, currentPlayer: 0, convertedThisTurn: false, players: game.players.map(player => player.id === 0 ? { ...player, coins: 0 } : player) }, { type: 'takeAction', action: 'convert' }))

  game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [10, 2, 2])
  game = advanceCoup(game, { type: 'takeAction', action: 'convert' })
  assert.equal(game.players[0].coins, 9)
  assert.equal(game.mustCoup, true)
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'income' }))
})

test('Coup and assassination cannot target an ally, but eliminate a faction when its last member loses influence', () => {
  let game = readyGame([['Duke', 'Contessa'], ['Captain', 'Assassin'], ['Inquisitor', 'Contessa']], [7, 2, 2])
  assert.throws(() => advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 2 }))
  assert.throws(() => advanceCoup({ ...game, players: game.players.map(player => player.id === 0 ? { ...player, coins: 3 } : player) }, { type: 'takeAction', action: 'assassinate', targetId: 2 }))
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  game = { ...game, currentPlayer: 0, players: game.players.map(player => player.id === 0 ? { ...player, coins: 7 } : player.id === 2 ? { ...player, alive: false, cards: [], coins: 0 } : player) }
  game = advanceCoup(game, { type: 'takeAction', action: 'coup', targetId: 1 })
  game = advanceCoup(game, { type: 'loseInfluence', playerId: 1, cardIndex: 0 })
  assert.equal(game.phase, 'ended')
  assert.equal(game.winningFaction, 'Catholic')
})

test('Inquisitor can inspect a target and force one influence to be exchanged with the Court', () => {
  let game = readyGame([['Inquisitor', 'Duke'], ['Assassin', 'Captain'], ['Contessa', 'Duke']])
  game = advanceCoup(game, { type: 'takeAction', action: 'investigate', targetId: 1 })
  game = advanceCoup(game, { type: 'pass' })
  assert.equal(game.phase, 'investigate')
  assert.equal(game.message, 'Player 1 is investigating Player 2.')
  const courtSize = game.deck.length
  game = advanceCoup(game, { type: 'forceExchange', cardIndex: 0 }, () => 0.5)
  assert.equal(game.phase, 'turn')
  assert.equal(game.players[1].cards.length, 2)
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
