export const roleOptions = [
  { name: 'Ma Sói', multiple: true },
  { name: 'Sói Con', multiple: true },
  { name: 'Tiên Tri', multiple: false },
  { name: 'Fox/Cao', multiple: true },
  { name: 'Gau/Bear', multiple: false },
  { name: 'Bảo Vệ', multiple: false },
  { name: 'Phù Thủy', multiple: false },
  { name: 'Thợ Săn', multiple: false },
  { name: 'Già Làng', multiple: false },
  { name: 'Cupid', multiple: false },
  { name: '50/50', multiple: true },
  { name: 'Dân Làng', multiple: true },
  { name: 'Bitch', multiple: false },
  { name: 'Gương', multiple: false },
] as const

export function createRolePool(counts: Readonly<Record<string, number>>, numPlayers: number): string[] {
  const pool: string[] = []
  for (const role of roleOptions) {
    const count = counts[role.name] ?? 0
    if (!Number.isInteger(count) || count < 0 || count > numPlayers || (!role.multiple && count > 1)) {
      throw new Error(`Số lượng không hợp lệ: ${role.name}`)
    }
    pool.push(...Array<string>(count).fill(role.name))
  }
  if (pool.length !== numPlayers) throw new Error('Tổng số vai phải bằng tổng số người chơi.')
  return pool
}

export function getLivingNeighbors(players: readonly { isAlive: boolean }[], centerIndex: number): number[] {
  if (centerIndex < 0 || centerIndex >= players.length) return []
  const neighbors: number[] = []
  for (const direction of [-1, 1]) {
    for (let distance = 1; distance < players.length; distance++) {
      const index = (centerIndex + direction * distance + players.length) % players.length
      if (players[index].isAlive) {
        if (!neighbors.includes(index)) neighbors.push(index)
        break
      }
    }
  }
  return neighbors
}

export function getLivingSeatGroup(players: readonly { isAlive: boolean }[], centerIndex: number): number[] {
  if (!players[centerIndex]?.isAlive) return []
  const neighbors = getLivingNeighbors(players, centerIndex)
  return [...new Set([neighbors[0], centerIndex, neighbors[1]].filter((index): index is number => index !== undefined))]
}

export function isWolfSide(player: { side: string; isTransformed: boolean }): boolean {
  return player.side === 'Sói' || player.isTransformed
}

export function getBearAnnouncement(
  players: readonly { role: string; side: string; isAlive: boolean; isTransformed: boolean }[],
  previousSignal: 'CÓ' | 'KHÔNG' | null,
  reversed: boolean,
) {
  const bearIndex = players.findIndex(player => player.role === 'Gau/Bear')
  if (bearIndex === -1) return null
  const bear = players[bearIndex]
  const neighbors = getLivingNeighbors(players, bearIndex)
  const danger = neighbors.some(index => isWolfSide(players[index]))
  const inverted = bear.isAlive && reversed
  const signal: 'CÓ' | 'KHÔNG' = !bear.isAlive && previousSignal
    ? previousSignal
    : (inverted ? !danger : danger) ? 'CÓ' : 'KHÔNG'
  return { signal, neighbors, repeated: !bear.isAlive, inverted }
}