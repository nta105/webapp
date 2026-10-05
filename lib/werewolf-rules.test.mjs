import assert from 'node:assert/strict'
import test from 'node:test'
import { createRolePool, getBearAnnouncement, getLivingNeighbors, getLivingSeatGroup, isWolfSide, roleOptions } from './werewolf-rules.ts'

const player = (role = 'Dân Làng', isAlive = true, isTransformed = false) => ({
  role, isAlive, isTransformed, side: role.includes('Sói') ? 'Sói' : 'Dân',
})

test('first and last seats wrap around', () => {
  const players = Array.from({ length: 5 }, () => player())
  assert.deepEqual(getLivingNeighbors(players, 0), [4, 1])
  assert.deepEqual(getLivingNeighbors(players, 4), [3, 0])
})

test('consecutive deaths update neighbors without moving player identities', () => {
  const players = Array.from({ length: 6 }, () => player())
  players[1].isAlive = false
  players[2].isAlive = false
  players[5].isAlive = false
  assert.deepEqual(getLivingNeighbors(players, 0), [4, 3])
  assert.equal(players.length, 6)
})

test('Fox scans the current living circle, not dead wolves in old seats', () => {
  const players = [player('Fox/Cao'), player('Ma Sói', false), player(), player('Sói Con'), player()]
  const group = getLivingSeatGroup(players, 2)
  assert.deepEqual(group, [0, 2, 3])
  assert.equal(group.some(index => isWolfSide(players[index])), true)
  players[3].isAlive = false
  assert.deepEqual(getLivingSeatGroup(players, 2), [0, 2, 4])
  assert.equal(getLivingSeatGroup(players, 2).some(index => isWolfSide(players[index])), false)
})

test('small circles do not duplicate players or use the center as its own neighbor', () => {
  assert.deepEqual(getLivingNeighbors([player(), player()], 0), [1])
  assert.deepEqual(getLivingSeatGroup([player(), player()], 0), [1, 0])
  assert.deepEqual(getLivingNeighbors([player()], 0), [])
  assert.deepEqual(getLivingSeatGroup([player()], 0), [0])
  assert.deepEqual(getLivingSeatGroup([player('Dân Làng', false)], 0), [])
  assert.deepEqual(getLivingNeighbors([], 0), [])
})

test('Bear recognizes the next living wolf, including a transformed 50/50', () => {
  const players = [player('Gau/Bear'), player('Dân Làng', false), player('50/50', true, true), player()]
  assert.deepEqual(getBearAnnouncement(players, null, false), {
    signal: 'CÓ', neighbors: [3, 2], repeated: false, inverted: false,
  })
  players[2].isTransformed = false
  assert.equal(getBearAnnouncement(players, null, false).signal, 'KHÔNG')
})

test('existing Bear reversal and post-death repeat rules are preserved', () => {
  const players = [player('Gau/Bear'), player('Ma Sói'), player()]
  assert.equal(getBearAnnouncement(players, null, true).signal, 'KHÔNG')
  players[0].isAlive = false
  assert.deepEqual(getBearAnnouncement(players, 'KHÔNG', true), {
    signal: 'KHÔNG', neighbors: [2, 1], repeated: true, inverted: false,
  })
  assert.equal(getBearAnnouncement(players, null, false).signal, 'CÓ')
  assert.equal(getBearAnnouncement([player()], null, false), null)
})

test('setup includes all fourteen roles and handles 50/50 literally', () => {
  assert.equal(roleOptions.length, 14)
  const counts = Object.fromEntries(roleOptions.map(role => [role.name, 1]))
  const pool = createRolePool(counts, 14)
  assert.equal(pool.length, 14)
  assert.equal(pool.filter(role => role === '50/50').length, 1)
})

test('setup rejects invalid counts instead of truncating or filling roles', () => {
  assert.throws(() => createRolePool({ 'Ma Sói': 1 }, 2))
  assert.throws(() => createRolePool({ 'Ma Sói': 3 }, 2))
  assert.throws(() => createRolePool({ 'Phù Thủy': 2 }, 2))
  assert.throws(() => createRolePool({ 'Dân Làng': -1 }, 2))
  assert.throws(() => createRolePool({ 'Dân Làng': 1.5 }, 2))
  assert.throws(() => createRolePool({ 'Dân Làng': NaN }, 2))
  assert.equal(createRolePool({ 'Ma Sói': 2, 'Fox/Cao': 2, 'Dân Làng': 2 }, 6).length, 6)
})