import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceAvalon, buildRolePool, createAvalon, customSetupFromPool, defaultMissions, factionOf, getSetup, knowledgeFor, requiredFails, roleNames, roleDescriptions, roleStrategies, validateCustomSetup } from './avalon-rules.ts'
import { avalonMessages, avalonTranslator, localizeAvalonEnding, localizeAvalonError, localizeAvalonKnowledge, vietnameseRoles } from './avalon-i18n.ts'

const names = count => Array.from({ length: count }, (_, index) => `Player ${index + 1}`)
const readyGame = (count = 5, selected = []) => {
  let game = createAvalon(names(count), selected, 0, () => 0.999)
  for (let index = 0; index < count; index++) game = advanceAvalon(game, { type: 'reveal' })
  return game
}
const approve = game => {
  return advanceAvalon(game, { type: 'decide', accepted: true })
}
const quest = (game, fail = false) => {
  const size = game.missions[game.quest - 1].teamSize
  const team = fail
    ? [...game.players.filter(player => factionOf(player.role) === 'Evil'), ...game.players.filter(player => factionOf(player.role) === 'Good')].slice(0, size).map(player => player.id)
    : game.players.slice(0, size).map(player => player.id)
  game = approve(advanceAvalon(game, { type: 'propose', team }))
  for (const id of game.team) game = advanceAvalon(game, { type: 'card', fail: fail && factionOf(game.players[id].role) === 'Evil' })
  game = advanceAvalon(game, { type: 'publish' })
  game = advanceAvalon(game, { type: 'continue' })
  return game
}

test('all supported player counts use standard faction and quest tables', () => {
  const rows = [
    [5, 3, 2, [2, 3, 2, 3, 3]], [6, 4, 2, [2, 3, 4, 3, 4]],
    [7, 4, 3, [2, 3, 3, 4, 4]], [8, 5, 3, [3, 4, 4, 5, 5]],
    [9, 6, 3, [3, 4, 4, 5, 5]], [10, 6, 4, [3, 4, 4, 5, 5]],
  ]
  for (const [count, good, evil, teams] of rows) {
    assert.deepEqual(getSetup(count), { good, evil, teams })
    const pool = buildRolePool(count, ['Percival', 'Morgana'])
    assert.equal(pool.filter(role => factionOf(role) === 'Good').length, good)
    assert.equal(pool.filter(role => factionOf(role) === 'Evil').length, evil)
    for (let number = 1; number <= 5; number++) assert.equal(requiredFails(count, number), count >= 7 && number === 4 ? 2 : 1)
  }
  assert.throws(() => getSetup(4))
  assert.throws(() => getSetup(21))
  assert.throws(() => getSetup(5.5))
})

test('setup validates names, role capacity, duplicates and leader', () => {
  assert.throws(() => createAvalon(['A', 'a', 'C', 'D', 'E'], [], 0))
  assert.throws(() => createAvalon(['', 'B', 'C', 'D', 'E'], [], 0))
  assert.throws(() => createAvalon(names(5), [], 5))
  assert.throws(() => buildRolePool(5, ['Morgana', 'Mordred']))
  assert.throws(() => buildRolePool(5, ['Percival', 'Percival']))
  assert.equal(buildRolePool(10, ['Percival', 'Morgana', 'Mordred', 'Oberon']).length, 10)
})

test('Merlin sees Oberon but not Mordred; Evil excludes Oberon; Percival has ambiguous candidates', () => {
  const game = readyGame(10, ['Percival', 'Morgana', 'Mordred', 'Oberon'])
  const find = role => game.players.find(player => player.role === role)
  const merlin = knowledgeFor(game.players, find('Merlin')).names
  assert.ok(merlin.includes(find('Oberon').name))
  assert.ok(!merlin.includes(find('Mordred').name))
  const evil = knowledgeFor(game.players, find('Assassin')).names
  assert.ok(evil.includes(find('Mordred').name))
  assert.ok(!evil.includes(find('Oberon').name))
  assert.deepEqual(knowledgeFor(game.players, find('Oberon')).names, [])
  assert.deepEqual(knowledgeFor(game.players, find('Percival')).names, [find('Merlin').name, find('Morgana').name])
})

test('team proposals validate size and distinct player identities', () => {
  const game = readyGame()
  assert.throws(() => advanceAvalon(game, { type: 'propose', team: [0] }))
  assert.throws(() => advanceAvalon(game, { type: 'propose', team: [0, 0] }))
  assert.throws(() => advanceAvalon(game, { type: 'propose', team: [0, 9] }))
  assert.throws(() => advanceAvalon(game, { type: 'card', fail: false }))
})

test('one shared group rejection rotates the leader and records no individual votes', () => {
  let game = advanceAvalon(readyGame(6), { type: 'propose', team: [0, 1] })
  assert.equal(game.phase, 'decision')
  assert.equal(game.players.length, 6)
  game = advanceAvalon(game, { type: 'decide', accepted: false })
  assert.equal(game.phase, 'proposal')
  assert.equal(game.leader, 1)
  assert.equal(game.rejections, 1)
  assert.equal(game.proposals[0].approved, false)
  assert.equal('votes' in game.proposals[0], false)
})

test('five consecutive rejected teams give Evil the win', () => {
  let game = readyGame()
  for (let attempt = 0; attempt < 5; attempt++) {
    game = advanceAvalon(game, { type: 'propose', team: [0, 1] })
    game = advanceAvalon(game, { type: 'decide', accepted: false })
  }
  assert.equal(game.phase, 'ended')
  assert.equal(game.winner, 'Evil')
  assert.equal(game.proposals.length, 5)
})

test('Good cannot fail; Evil may succeed; quest history never stores individual cards', () => {
  let game = approve(advanceAvalon(readyGame(), { type: 'propose', team: [0, 3] }))
  assert.throws(() => advanceAvalon(game, { type: 'card', fail: true }))
  game = advanceAvalon(game, { type: 'card', fail: false })
  game = advanceAvalon(game, { type: 'card', fail: false })
  assert.equal(game.phase, 'handoff')
  assert.deepEqual(game.quests, [])
  assert.equal(game.leader, 0)
  assert.deepEqual(game.cards, [])
  assert.throws(() => advanceAvalon(game, { type: 'continue' }))
  game = advanceAvalon(game, { type: 'publish' })
  assert.equal(game.phase, 'result')
  assert.equal(game.quests[0].succeeded, true)
  assert.deepEqual(game.cards, [])
  assert.equal('cards' in game.quests[0], false)
  game = advanceAvalon(game, { type: 'continue' })
  assert.equal(game.leader, 1)
})

test('accepting a group resets the consecutive rejection track', () => {
  let game = readyGame()
  for (let index = 0; index < 4; index++) {
    game = advanceAvalon(game, { type: 'propose', team: [0, 1] })
    game = advanceAvalon(game, { type: 'decide', accepted: false })
  }
  game = advanceAvalon(game, { type: 'propose', team: [0, 1] })
  game = advanceAvalon(game, { type: 'decide', accepted: true })
  assert.equal(game.phase, 'quest')
  assert.equal(game.rejections, 0)
})

test('one Fail succeeds on quest four with seven players; two Fail cards fail it', () => {
  const base = { ...readyGame(7), quest: 4 }
  const evil = base.players.filter(player => factionOf(player.role) === 'Evil').map(player => player.id)
  const team = [0, 1, ...evil.slice(0, 2)]
  for (const failCount of [1, 2]) {
    let game = approve(advanceAvalon(base, { type: 'propose', team }))
    for (let index = 0; index < team.length; index++) game = advanceAvalon(game, { type: 'card', fail: index >= team.length - failCount })
    game = advanceAvalon(game, { type: 'publish' })
    assert.equal(game.quests[0].succeeded, failCount === 1)
  }
})

test('three failed quests end immediately for Evil', () => {
  let game = readyGame()
  for (let number = 0; number < 3; number++) game = quest(game, true)
  assert.equal(game.phase, 'ended')
  assert.equal(game.winner, 'Evil')
})

test('three successes lead to assassination; hitting Merlin reverses the outcome', () => {
  let game = readyGame()
  for (let number = 0; number < 3; number++) game = quest(game)
  assert.equal(game.phase, 'assassination')
  assert.equal(game.winner, null)
  assert.equal(advanceAvalon(game, { type: 'assassinate', target: 0 }).winner, 'Evil')
  assert.equal(advanceAvalon(game, { type: 'assassinate', target: 1 }).winner, 'Good')
  assert.throws(() => advanceAvalon(game, { type: 'assassinate', target: 99 }))
})

test('Commander edition supplies abilities and strategy for every role', () => {
  assert.equal(roleNames.Merlin, 'Commander')
  assert.equal(roleNames.Percival, 'Bodyguard')
  assert.equal(roleNames.Minion, 'Spy')
  for (const role of Object.keys(roleNames)) {
    assert.ok(roleDescriptions[role].length > 40)
    assert.ok(roleStrategies[role].length > 40)
    assert.ok(!/Merlin|Percival|Morgana|Mordred|Oberon/.test(roleDescriptions[role]))
  }
})

test('mission participants follow the player list; leader wraps after rejection', () => {
  let game = advanceAvalon(readyGame(), { type: 'propose', team: [4, 0] })
  assert.deepEqual(game.team, [0, 4])
  game = { ...game, leader: 4 }
  game = advanceAvalon(game, { type: 'decide', accepted: false })
  assert.equal(game.leader, 0)
})

test('public result is held until publish, acknowledged before victory or next mission', () => {
  let game = readyGame()
  for (let number = 0; number < 2; number++) game = quest(game)
  game = approve(advanceAvalon(game, { type: 'propose', team: [0, 1] }))
  game = advanceAvalon(game, { type: 'card', fail: false })
  game = advanceAvalon(game, { type: 'card', fail: false })
  assert.equal(game.phase, 'handoff')
  assert.equal(game.quests.length, 2)
  assert.equal(game.winner, null)
  game = advanceAvalon(game, { type: 'publish' })
  assert.equal(game.phase, 'result')
  assert.equal(game.quests.length, 3)
  assert.throws(() => advanceAvalon(game, { type: 'publish' }))
  game = advanceAvalon(game, { type: 'continue' })
  assert.equal(game.phase, 'assassination')
})

test('English and Vietnamese messages have matching keys and interpolation fields', () => {
  assert.deepEqual(Object.keys(avalonMessages.en), Object.keys(avalonMessages.vi))
  const fields = message => [...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
  for (const key of Object.keys(avalonMessages.en)) {
    assert.ok(avalonMessages.vi[key].trim())
    assert.deepEqual(fields(avalonMessages.en[key]), fields(avalonMessages.vi[key]), key)
  }
})

test('Vietnamese role names, abilities and strategies cover all eight roles', () => {
  assert.deepEqual(Object.keys(vietnameseRoles.names).sort(), Object.keys(roleNames).sort())
  assert.equal(vietnameseRoles.names.Merlin, 'Chỉ huy')
  assert.equal(vietnameseRoles.names.Percival, 'Vệ sĩ')
  assert.equal(vietnameseRoles.names.Minion, 'Gián điệp')
  for (const role of Object.keys(roleNames)) {
    assert.ok(vietnameseRoles.descriptions[role].length > 40)
    assert.ok(vietnameseRoles.strategies[role].length > 40)
    assert.notEqual(vietnameseRoles.descriptions[role], roleDescriptions[role])
  }
})

test('localized templates preserve player names and format mission values', () => {
  const translate = avalonTranslator('vi')
  assert.equal(translate('playerPlaceholder', { number: 3 }), 'Người chơi 3')
  assert.equal(translate('cardTotals', { pass: 3, fail: 1 }), '3 Thành công · 1 Phá hoại')
  assert.equal(translate('teamMember', { name: 'An {count}' }), 'Thành viên nhóm An {count}')
  assert.equal(avalonTranslator('en')('cardTotals', { pass: 3, fail: 1 }), '3 Pass · 1 Fail')
})

test('stored rule errors and outcomes translate when changing languages', () => {
  for (const key of Object.keys(avalonMessages.en).filter(key => key.startsWith('error'))) {
    assert.equal(localizeAvalonError('vi', avalonMessages.en[key]), avalonMessages.vi[key])
    assert.equal(localizeAvalonError('en', avalonMessages.en[key]), avalonMessages.en[key])
  }
  for (const key of Object.keys(avalonMessages.en).filter(key => key.startsWith('ending'))) {
    assert.equal(localizeAvalonEnding('vi', avalonMessages.en[key]), avalonMessages.vi[key])
  }
  assert.equal(localizeAvalonError('vi', 'Unexpected internal error'), avalonMessages.vi.invalidAction)
})

test('private knowledge labels translate without changing revealed identities', () => {
  const game = readyGame(10, ['Percival', 'Morgana', 'Mordred', 'Oberon'])
  for (const role of ['Merlin', 'Percival', 'Assassin', 'Oberon']) {
    const info = knowledgeFor(game.players, game.players.find(player => player.role === role))
    const originalNames = [...info.names]
    assert.notEqual(localizeAvalonKnowledge('vi', info.label), info.label)
    assert.equal(localizeAvalonKnowledge('en', info.label), info.label)
    assert.deepEqual(info.names, originalNames)
  }
})

test('11-20 player house setups have valid scaled factions and mission groups', () => {
  for (let count = 11; count <= 20; count++) {
    const setup = getSetup(count)
    assert.equal(setup.good + setup.evil, count)
    assert.equal(setup.evil, Math.round(count * 0.4))
    assert.ok(setup.good > setup.evil)
    assert.equal(setup.teams.length, 5)
    assert.deepEqual(setup.teams, [0.3, 0.4, 0.4, 0.5, 0.5].map(fraction => Math.ceil(count * fraction)))
    assert.ok(setup.teams.every(size => Number.isInteger(size) && size >= 2 && size <= setup.good))
    assert.equal(requiredFails(count, 4), 2)
    assert.equal(buildRolePool(count, [], 'basic').length, count)
    assert.equal(buildRolePool(count, ['Percival', 'Morgana'], 'commander').length, count)
  }
})

test('basic mode contains only regular members and spies with appropriate knowledge', () => {
  const game = createAvalon(names(12), [], 0, () => 0.999, 'basic')
  assert.equal(game.mode, 'basic')
  assert.ok(game.players.every(player => ['Loyal Servant', 'Minion'].includes(player.role)))
  assert.equal(game.players.filter(player => player.role === 'Minion').length, 5)
  const spy = game.players.find(player => player.role === 'Minion')
  const info = knowledgeFor(game.players, spy)
  assert.equal(info.label, 'Other Spies')
  assert.equal(info.names.length, 4)
  assert.ok(!info.names.includes(spy.name))
  assert.deepEqual(knowledgeFor(game.players, game.players[0]).names, [])
  assert.throws(() => buildRolePool(12, ['Percival'], 'basic'))
})

test('basic mode wins directly after three successes without an assassination', () => {
  let game = createAvalon(names(12), [], 0, () => 0.999, 'basic')
  for (let index = 0; index < 12; index++) game = advanceAvalon(game, { type: 'reveal' })
  for (let number = 0; number < 3; number++) game = quest(game)
  assert.equal(game.phase, 'ended')
  assert.equal(game.winner, 'Good')
  assert.equal(game.ending, 'Three missions succeeded.')
  assert.throws(() => advanceAvalon(game, { type: 'assassinate', target: 0 }))
})

test('20-player group uses one shared decision instead of twenty individual ballots', () => {
  let game = createAvalon(names(20), [], 19, () => 0.999, 'basic')
  for (let index = 0; index < 20; index++) game = advanceAvalon(game, { type: 'reveal' })
  game = advanceAvalon(game, { type: 'propose', team: [0, 1, 2, 3, 4, 5] })
  assert.equal(game.phase, 'decision')
  assert.equal('votes' in game, false)
  game = advanceAvalon(game, { type: 'decide', accepted: true })
  assert.equal(game.phase, 'quest')
  assert.equal(game.leader, 19)
  game = advanceAvalon(advanceAvalon(game, { type: 'card', fail: false }), { type: 'card', fail: false })
  assert.equal(game.phase, 'quest')
})

test('custom role quantities allow arbitrary factions and duplicate special roles', () => {
  const config = {
    roleCounts: { Merlin: 2, Percival: 2, 'Loyal Servant': 8, Assassin: 2, Morgana: 2, Mordred: 1, Oberon: 1, Minion: 2 },
    missions: Array.from({ length: 5 }, () => ({ teamSize: 3, failsRequired: 2 })),
  }
  const game = createAvalon(names(20), [], 0, () => 0.999, 'custom', config)
  assert.equal(game.players.filter(player => player.role === 'Merlin').length, 2)
  assert.equal(game.players.filter(player => player.role === 'Assassin').length, 2)
  assert.equal(game.finalIdentification, true)
  assert.deepEqual(knowledgeFor(game.players, game.players[2]).names, [names(20)[0], names(20)[1], names(20)[14], names(20)[15]])
})

test('custom role quantities validate totals, factions, roles and whole numbers', () => {
  const missions = defaultMissions(5)
  for (const roleCounts of [
    { 'Loyal Servant': 3, Minion: 1 }, { 'Loyal Servant': 4, Minion: 2 },
    { 'Loyal Servant': 5 }, { Minion: 5 }, { 'Loyal Servant': 4, Minion: -1 },
    { 'Loyal Servant': 3.5, Minion: 1.5 }, { 'Loyal Servant': 3, Minion: NaN },
    { 'Loyal Servant': 3, unknown: 2 }, { 'Loyal Servant': 3, toString: 2 },
  ]) assert.throws(() => validateCustomSetup(5, { roleCounts, missions }))
  assert.equal(validateCustomSetup(5, { roleCounts: { 'Loyal Servant': 1, Minion: 4 }, missions }).pool.length, 5)
})

test('custom missions reject invalid group sizes, impossible thresholds and wrong track lengths', () => {
  const roleCounts = { 'Loyal Servant': 4, Minion: 1 }
  for (const mission of [
    { teamSize: 0, failsRequired: 1 }, { teamSize: 6, failsRequired: 1 },
    { teamSize: 2.5, failsRequired: 1 }, { teamSize: 2, failsRequired: 0 },
    { teamSize: 2, failsRequired: 3 }, { teamSize: 3, failsRequired: 2 },
    { teamSize: 3, failsRequired: 1.5 },
  ]) assert.throws(() => validateCustomSetup(5, { roleCounts, missions: [mission, ...defaultMissions(5).slice(1)] }))
  assert.throws(() => validateCustomSetup(5, { roleCounts, missions: defaultMissions(5).slice(1) }))
  assert.throws(() => validateCustomSetup(5, { roleCounts, missions: [...defaultMissions(5), defaultMissions(5)[0]] }))
})

test('custom group size and Fail threshold control actual mission outcomes', () => {
  const config = { roleCounts: { 'Loyal Servant': 3, Minion: 2 }, missions: Array.from({ length: 5 }, () => ({ teamSize: 3, failsRequired: 2 })) }
  for (const failCount of [1, 2]) {
    let game = createAvalon(names(5), [], 0, () => 0.999, 'custom', config)
    for (let index = 0; index < 5; index++) game = advanceAvalon(game, { type: 'reveal' })
    assert.throws(() => advanceAvalon(game, { type: 'propose', team: [0, 1] }))
    game = approve(advanceAvalon(game, { type: 'propose', team: [0, 3, 4] }))
    game = advanceAvalon(game, { type: 'card', fail: false })
    game = advanceAvalon(game, { type: 'card', fail: true })
    game = advanceAvalon(game, { type: 'card', fail: failCount === 2 })
    game = advanceAvalon(game, { type: 'publish' })
    assert.equal(game.quests[0].succeeded, failCount === 1)
  }
})

test('custom setup is copied and never silently changed by later configuration edits', () => {
  const config = customSetupFromPool(buildRolePool(5, [], 'basic'))
  const game = createAvalon(names(5), [], 0, () => 0.999, 'custom', config)
  config.roleCounts.Minion = 0
  config.missions[0].teamSize = 5
  config.missions[0].failsRequired = 2
  assert.deepEqual(game.missions[0], { teamSize: 2, failsRequired: 1 })
  assert.equal(game.players.filter(player => player.role === 'Minion').length, 2)
})

test('custom games without both Commander and Assassin win directly after three successes', () => {
  for (const roleCounts of [
    { 'Loyal Servant': 3, Minion: 2 }, { Merlin: 1, 'Loyal Servant': 2, Minion: 2 },
    { 'Loyal Servant': 3, Assassin: 1, Minion: 1 },
  ]) {
    let game = createAvalon(names(5), [], 0, () => 0.999, 'custom', { roleCounts, missions: defaultMissions(5) })
    for (let index = 0; index < 5; index++) game = advanceAvalon(game, { type: 'reveal' })
    for (let number = 0; number < 3; number++) game = quest(game)
    assert.equal(game.finalIdentification, false)
    assert.equal(game.phase, 'ended')
    assert.equal(game.winner, 'Good')
  }
})

test('multiple Commanders and Assassins share one identification; any Commander is a winning target', () => {
  let game = createAvalon(names(7), [], 0, () => 0.999, 'custom', {
    roleCounts: { Merlin: 2, 'Loyal Servant': 2, Assassin: 2, Minion: 1 }, missions: defaultMissions(7),
  })
  for (let index = 0; index < 7; index++) game = advanceAvalon(game, { type: 'reveal' })
  for (let number = 0; number < 3; number++) game = quest(game)
  assert.equal(game.phase, 'assassination')
  assert.equal(advanceAvalon(game, { type: 'assassinate', target: 0 }).winner, 'Evil')
  assert.equal(advanceAvalon(game, { type: 'assassinate', target: 1 }).winner, 'Evil')
  assert.equal(advanceAvalon(game, { type: 'assassinate', target: 2 }).winner, 'Good')
})

test('custom configuration cannot be omitted or passed through a different mode', () => {
  assert.throws(() => createAvalon(names(5), [], 0, () => 0.999, 'custom'))
  assert.throws(() => buildRolePool(5, [], 'custom'))
  assert.throws(() => createAvalon(names(5), [], 0, () => 0.999, 'basic', customSetupFromPool(buildRolePool(5, [], 'basic'))))
})