export type CoupRole = 'Duke' | 'Assassin' | 'Captain' | 'Inquisitor' | 'Contessa'
export type CoupFaction = 'Catholic' | 'Protestant'
export type CoupActionName = 'income' | 'foreignAid' | 'tax' | 'assassinate' | 'steal' | 'exchange' | 'investigate' | 'convert' | 'coup'
export type CoupPhase = 'reveal' | 'turn' | 'response' | 'loseInfluence' | 'exchange' | 'investigate' | 'ended'

export interface CoupPlayer {
  id: number
  name: string
  faction: CoupFaction
  cards: CoupRole[]
  revealed: CoupRole[]
  coins: number
  alive: boolean
}

export interface PendingTurn {
  actorId: number
  action: CoupActionName
  targetId?: number
  stage: 'actionChallenge' | 'blockChoice' | 'blockChallenge'
  blockerId?: number
  blockRole?: CoupRole
}

export type LossContinuation =
  | { type: 'finishTurn'; actorId: number }
  | { type: 'challenge'; stage: 'action' | 'block'; proved: boolean }

export interface CoupGame {
  players: CoupPlayer[]
  deck: CoupRole[]
  phase: CoupPhase
  revealIndex: number
  currentPlayer: number
  pending: PendingTurn | null
  lossPlayerId: number | null
  lossContinuation: LossContinuation | null
  exchangeOptions: CoupRole[]
  winner: number | null
  winningFaction: CoupFaction | null
  convertedThisTurn: boolean
  mustCoup: boolean
  message: string
}

export type CoupAction =
  | { type: 'reveal' }
  | { type: 'takeAction'; action: CoupActionName; targetId?: number }
  | { type: 'pass' }
  | { type: 'challenge'; playerId: number }
  | { type: 'allow' }
  | { type: 'block'; playerId: number; role: CoupRole }
  | { type: 'loseInfluence'; playerId: number; cardIndex: number }
  | { type: 'exchange'; playerId: number; keep: number[] }
  | { type: 'forceExchange'; cardIndex: number }
  | { type: 'finishInvestigation' }

export const coupRoles: CoupRole[] = ['Duke', 'Assassin', 'Captain', 'Inquisitor', 'Contessa']
export const coupFactions: CoupFaction[] = ['Catholic', 'Protestant']

export const coupRoleDetails: Record<CoupRole, { claim: string; power: string }> = {
  Duke: { claim: 'Tax +3 coins; block Foreign Aid.', power: 'Take 3 coins from the Court or block Foreign Aid.' },
  Assassin: { claim: 'Pay 3 coins to assassinate a player.', power: 'Pay 3 coins to make a player lose influence.' },
  Captain: { claim: 'Steal up to 2 coins; block stealing.', power: 'Take up to 2 coins from a player or block stealing.' },
  Inquisitor: { claim: 'Exchange one card with the Court, or inspect a player and force a card exchange; block stealing.', power: 'Exchange one card with the Court, inspect an opponent and force a card exchange, or block stealing.' },
  Contessa: { claim: 'Block an assassination.', power: 'Block an assassination.' },
}

const deckForGame = (): CoupRole[] => coupRoles.flatMap(role => [role, role, role])

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function createCoup(names: readonly string[], firstPlayer: number, random = Math.random, factions?: readonly CoupFaction[]): CoupGame {
  const cleanNames = names.map(name => name.trim())
  if (cleanNames.length < 3 || cleanNames.length > 6) throw new Error('Coup requires 3-6 players.')
  if (cleanNames.some(name => !name) || new Set(cleanNames.map(name => name.toLocaleLowerCase())).size !== cleanNames.length) {
    throw new Error('Enter a unique, non-empty name for every player.')
  }
  if (!Number.isInteger(firstPlayer) || firstPlayer < 0 || firstPlayer >= names.length) throw new Error('Choose a valid first player.')
  const playerFactions = factions ? [...factions] : cleanNames.map((_, index) => coupFactions[index % coupFactions.length])
  if (playerFactions.length !== cleanNames.length || playerFactions.some(faction => !coupFactions.includes(faction)) || new Set(playerFactions).size !== 2) {
    throw new Error('Assign players to both factions.')
  }

  const deck = shuffled(deckForGame(), random)
  const players = cleanNames.map((name, id) => ({
    id,
    name,
    faction: playerFactions[id],
    cards: [deck.pop()!, deck.pop()!],
    revealed: [],
    coins: 2,
    alive: true,
  }))

  return {
    players,
    deck,
    phase: 'reveal',
    revealIndex: 0,
    currentPlayer: firstPlayer,
    pending: null,
    lossPlayerId: null,
    lossContinuation: null,
    exchangeOptions: [],
    winner: null,
    winningFaction: null,
    convertedThisTurn: false,
    mustCoup: false,
    message: '',
  }
}

function endOrContinue(game: CoupGame, actorId: number, message: string): CoupGame {
  const survivors = game.players.filter(player => player.alive)
  const survivingFactions = new Set(survivors.map(player => player.faction))
  if (survivors.length <= 1 || survivingFactions.size <= 1) {
    const winningFaction = survivors[0]?.faction ?? null
    return {
      ...game,
      phase: 'ended',
      currentPlayer: survivors[0]?.id ?? actorId,
      pending: null,
      winner: survivors[0]?.id ?? null,
      winningFaction,
      convertedThisTurn: false,
      mustCoup: false,
      message: survivors.length
        ? survivingFactions.size === 1
          ? `${winningFaction} faction wins Coup.`
          : `${survivors[0].name} is the last player standing.`
        : 'No players remain.',
      lossPlayerId: null,
      lossContinuation: null,
      exchangeOptions: [],
    }
  }

  let nextPlayer = (actorId + 1) % game.players.length
  while (!game.players[nextPlayer].alive) nextPlayer = (nextPlayer + 1) % game.players.length
  return {
    ...game,
    phase: 'turn',
    currentPlayer: nextPlayer,
    convertedThisTurn: false,
    mustCoup: game.players[nextPlayer].coins >= 10,
    pending: null,
    lossPlayerId: null,
    lossContinuation: null,
    exchangeOptions: [],
    message,
  }
}

function startLoss(game: CoupGame, playerId: number, continuation: LossContinuation, message: string): CoupGame {
  if (!game.players[playerId]?.alive) return game
  return {
    ...game,
    phase: 'loseInfluence',
    lossPlayerId: playerId,
    lossContinuation: continuation,
    message,
  }
}

function claimForAction(action: CoupActionName): CoupRole {
  if (action === 'tax') return 'Duke'
  if (action === 'assassinate') return 'Assassin'
  if (action === 'steal') return 'Captain'
  if (action === 'exchange' || action === 'investigate') return 'Inquisitor'
  throw new Error('This action does not require an influence claim.')
}

function blockOptions(pending: PendingTurn): CoupRole[] {
  if (pending.action === 'foreignAid') return ['Duke']
  if (pending.action === 'assassinate') return ['Contessa']
  if (pending.action === 'steal') return ['Captain', 'Inquisitor']
  return []
}

function resolveAction(game: CoupGame, pending: PendingTurn): CoupGame {
  const actor = game.players[pending.actorId]
  if (pending.action === 'foreignAid') {
    return endOrContinue({
      ...game,
      players: game.players.map(player => player.id === actor.id ? { ...player, coins: player.coins + 2 } : player),
    }, actor.id, `${actor.name} took 2 coins from the Court.`)
  }
  if (pending.action === 'steal' && pending.targetId !== undefined) {
    const target = game.players[pending.targetId]
    if (!target.alive) return endOrContinue(game, actor.id, `${target.name} was eliminated before the steal resolved.`)
    const amount = Math.min(2, target.coins)
    return endOrContinue({
      ...game,
      players: game.players.map(player => player.id === actor.id
        ? { ...player, coins: player.coins + amount }
        : player.id === target.id ? { ...player, coins: player.coins - amount } : player),
    }, actor.id, `${actor.name} stole ${amount} ${amount === 1 ? 'coin' : 'coins'} from ${target.name}.`)
  }
  if (pending.action === 'assassinate' && pending.targetId !== undefined) {
    const target = game.players[pending.targetId]
    if (!target.alive) return endOrContinue(game, actor.id, `${target.name} was eliminated before the assassination resolved.`)
    return startLoss({
      ...game,
      pending: null,
    }, target.id, { type: 'finishTurn', actorId: actor.id }, `${actor.name} is attempting an assassination.`)
  }
  return endOrContinue(game, actor.id, '')
}

function proceedAfterActionClaim(game: CoupGame, pending: PendingTurn): CoupGame {
  if (pending.action === 'assassinate' || pending.action === 'steal') {
    return { ...game, phase: 'response', pending: { ...pending, stage: 'blockChoice' }, message: '' }
  }
  if (pending.action === 'tax') {
    const actor = game.players[pending.actorId]
    return endOrContinue({
      ...game,
      players: game.players.map(player => player.id === actor.id ? { ...player, coins: player.coins + 3 } : player),
    }, actor.id, `${actor.name} took 3 coins from the Court.`)
  }
  if (pending.action === 'exchange') {
    const actor = game.players[pending.actorId]
    const drawCount = Math.min(1, game.deck.length)
    const deck = [...game.deck]
    const drawn = deck.splice(deck.length - drawCount, drawCount)
    return {
      ...game,
      deck,
      phase: 'exchange',
      pending,
      exchangeOptions: [...actor.cards, ...drawn],
      message: drawCount ? `${actor.name} is exchanging cards.` : `${actor.name} has no Court cards available to draw.`,
    }
  }
  if (pending.action === 'investigate') {
    const actor = game.players[pending.actorId]
    return { ...game, phase: 'investigate', pending, message: `${actor.name} is investigating ${game.players[pending.targetId!].name}.` }
  }
  return resolveAction(game, pending)
}

function afterChallenge(game: CoupGame, stage: 'action' | 'block', proved: boolean): CoupGame {
  const pending = game.pending
  if (!pending) throw new Error('There is no challenged claim.')
  if (stage === 'action') {
    if (!proved) return endOrContinue({ ...game, pending: null }, pending.actorId, `${game.players[pending.actorId].name}'s action failed.`)
    if (game.players.filter(player => player.alive).length <= 1) return endOrContinue(game, pending.actorId, '')
    return proceedAfterActionClaim(game, pending)
  }
  if (proved) return endOrContinue({ ...game, pending: null }, pending.actorId, `${game.players[pending.blockerId!].name}'s block succeeded.`)
  return resolveAction({ ...game, pending: null }, pending)
}

function beginAction(game: CoupGame, action: CoupActionName, targetId?: number): CoupGame {
  const actor = game.players[game.currentPlayer]
  if (!actor?.alive) throw new Error('The active player is no longer in the game.')
  const opponents = game.players.filter(player => player.alive && player.id !== actor.id)
  if (action === 'convert') {
    if (game.convertedThisTurn) throw new Error('You can only change allegiance once per turn.')
    if (actor.coins < 1) throw new Error('Changing allegiance costs 1 coin.')
    const players = game.players.map(player => player.id === actor.id
      ? { ...player, coins: player.coins - 1, faction: player.faction === 'Catholic' ? 'Protestant' : 'Catholic' }
      : player)
    const converted = players[actor.id]
    const survivingFactions = new Set(players.filter(player => player.alive).map(player => player.faction))
    if (survivingFactions.size === 1) {
      return {
        ...game,
        players,
        phase: 'ended',
        currentPlayer: actor.id,
        pending: null,
        winner: actor.id,
        winningFaction: converted.faction,
        convertedThisTurn: true,
        message: `${converted.faction} faction wins Coup.`,
      }
    }
    return { ...game, players, convertedThisTurn: true, message: `${actor.name} changed allegiance to ${converted.faction}.` }
  }
  if (game.mustCoup && action !== 'coup') throw new Error('A player with 10 or more coins must launch a Coup.')
  if (action === 'coup') {
    if (actor.coins < 7) throw new Error('A Coup costs 7 coins.')
    if (!opponents.some(player => player.id === targetId)) throw new Error('Choose a living opponent to Coup.')
    if (game.players[targetId!].faction === actor.faction) throw new Error('You cannot Coup a player in your faction.')
    const players = game.players.map(player => player.id === actor.id ? { ...player, coins: player.coins - 7 } : player)
    return startLoss({ ...game, players }, targetId!, { type: 'finishTurn', actorId: actor.id }, `${actor.name} launched a Coup.`)
  }
  if (action === 'assassinate') {
    if (actor.coins < 3) throw new Error('An assassination costs 3 coins.')
    if (!opponents.some(player => player.id === targetId)) throw new Error('Choose a living opponent to assassinate.')
    if (game.players[targetId!].faction === actor.faction) throw new Error('You cannot assassinate a player in your faction.')
  }
  if (action === 'steal' && !opponents.some(player => player.id === targetId)) throw new Error('Choose a living opponent to steal from.')
  if (action === 'investigate' && !opponents.some(player => player.id === targetId)) throw new Error('Choose a living opponent to investigate.')

  const pending: PendingTurn = {
    actorId: actor.id,
    action,
    targetId,
    stage: action === 'foreignAid' ? 'blockChoice' : 'actionChallenge',
  }
  const players = action === 'assassinate'
    ? game.players.map(player => player.id === actor.id ? { ...player, coins: player.coins - 3 } : player)
    : game.players

  if (action === 'income') {
    return endOrContinue({
      ...game,
      players: game.players.map(player => player.id === actor.id ? { ...player, coins: player.coins + 1 } : player),
    }, actor.id, `${actor.name} took 1 coin from the Court.`)
  }
  return {
    ...game,
    players,
    phase: 'response',
    pending,
    message: action === 'foreignAid' ? `${actor.name} requested Foreign Aid.` : `${actor.name} claims ${claimForAction(action)}.`,
  }
}

export function advanceCoup(game: CoupGame, action: CoupAction, random = Math.random): CoupGame {
  if (action.type === 'reveal' && game.phase === 'reveal') {
    const revealIndex = game.revealIndex + 1
    return { ...game, revealIndex, phase: revealIndex === game.players.length ? 'turn' : 'reveal' }
  }

  if (action.type === 'takeAction' && game.phase === 'turn') return beginAction(game, action.action, action.targetId)

  if (action.type === 'pass' && game.phase === 'response' && game.pending) {
    if (game.pending.stage === 'blockChallenge') {
      const { actorId } = game.pending
      return endOrContinue({ ...game, pending: null }, actorId, `${game.players[game.pending.blockerId!].name}'s block was accepted.`)
    }
    if (game.pending.stage === 'actionChallenge') return proceedAfterActionClaim(game, game.pending)
    throw new Error('Choose whether to block or allow the action.')
  }

  if (action.type === 'allow' && game.phase === 'response' && game.pending?.stage === 'blockChoice') {
    return resolveAction(game, game.pending)
  }

  if (action.type === 'block' && game.phase === 'response' && game.pending?.stage === 'blockChoice') {
    const { pending } = game
    const blocker = game.players[action.playerId]
    if (!blocker?.alive || blocker.id === pending.actorId) throw new Error('Choose a living player other than the acting player to block.')
    if (!blockOptions(pending).includes(action.role)) throw new Error('That role cannot block this action.')
    if (pending.action !== 'foreignAid' && blocker.id !== pending.targetId) throw new Error('Only the targeted player may block this action.')
    return {
      ...game,
      pending: { ...pending, stage: 'blockChallenge', blockerId: blocker.id, blockRole: action.role },
      message: `${blocker.name} claims ${action.role} to block the action.`,
    }
  }

  if (action.type === 'challenge' && game.phase === 'response' && game.pending) {
    const pending = game.pending
    if (pending.stage === 'blockChoice') throw new Error('There is no role claim to challenge yet.')
    const challengedPlayerId = pending.stage === 'blockChallenge' ? pending.blockerId : pending.actorId
    const challenger = game.players[action.playerId]
    if (challengedPlayerId === undefined || !challenger?.alive || challenger.id === challengedPlayerId) {
      throw new Error('Choose a living player other than the person making the claim.')
    }
    const stage = pending.stage === 'blockChallenge' ? 'block' : 'action'
    const claimedRole = stage === 'block' ? pending.blockRole : claimForAction(pending.action)
    if (!claimedRole) throw new Error('There is no role claim to challenge.')
    const challenged = game.players[challengedPlayerId]
    const revealedIndex = challenged.cards.indexOf(claimedRole)
    const proved = revealedIndex !== -1
    let updated = game
    if (proved) {
      const deck = shuffled([...game.deck, claimedRole], random)
      const replacement = deck.pop()!
      updated = {
        ...game,
        deck,
        players: game.players.map(player => player.id === challengedPlayerId
          ? { ...player, cards: player.cards.map((role, index) => index === revealedIndex ? replacement : role) }
          : player),
        message: `${challenged.name} proved the ${claimedRole} claim.`,
      }
    }
    return startLoss(
      updated,
      proved ? challenger.id : challengedPlayerId,
      { type: 'challenge', stage, proved },
      proved ? `${challenger.name} must lose influence for the incorrect challenge.` : `${challenged.name} must lose influence for the false claim.`,
    )
  }

  if (action.type === 'loseInfluence' && game.phase === 'loseInfluence' && game.lossPlayerId !== null) {
    const losingPlayer = game.players[game.lossPlayerId]
    if (!losingPlayer?.alive || action.playerId !== losingPlayer.id) throw new Error('Only the player losing influence may choose a card.')
    const role = losingPlayer.cards[action.cardIndex]
    if (!role) throw new Error('Choose a card from your hand.')
    const players = game.players.map(player => player.id === losingPlayer.id
      ? {
          ...player,
          cards: player.cards.filter((_, index) => index !== action.cardIndex),
          revealed: [...player.revealed, role],
          alive: player.cards.length > 1,
          coins: player.cards.length > 1 ? player.coins : 0,
        }
      : player)
    const continuation = game.lossContinuation
    if (!continuation) throw new Error('The influence loss has no continuation.')
    const next = { ...game, players, lossPlayerId: null, lossContinuation: null, phase: 'turn' as const }
    if (continuation.type === 'finishTurn') return endOrContinue(next, continuation.actorId, `${losingPlayer.name} lost ${role}.`)
    const resolved = afterChallenge(next, continuation.stage, continuation.proved)
    return { ...resolved, message: `${losingPlayer.name} lost ${role}. ${resolved.message}`.trim() }
  }

  if (action.type === 'exchange' && game.phase === 'exchange' && game.pending) {
    const actor = game.players[game.pending.actorId]
    if (action.playerId !== actor.id) throw new Error('Only the active player may complete this exchange.')
    if (new Set(action.keep).size !== action.keep.length || action.keep.length !== 2 || action.keep.some(index => !Number.isInteger(index) || !game.exchangeOptions[index])) {
      throw new Error('Keep exactly two cards.')
    }
    const kept = action.keep.map(index => game.exchangeOptions[index])
    const returned = game.exchangeOptions.filter((_, index) => !action.keep.includes(index))
    const next = {
      ...game,
      players: game.players.map(player => player.id === actor.id ? { ...player, cards: kept } : player),
      deck: shuffled([...game.deck, ...returned], random),
      phase: 'turn' as const,
      exchangeOptions: [],
      pending: null,
    }
    return endOrContinue(next, actor.id, `${actor.name} completed the exchange.`)
  }

  if (action.type === 'finishInvestigation' && game.phase === 'investigate' && game.pending) {
    return endOrContinue({ ...game, phase: 'turn', pending: null }, game.pending.actorId, 'The investigation is complete.')
  }

  if (action.type === 'forceExchange' && game.phase === 'investigate' && game.pending) {
    const { actorId, targetId } = game.pending
    const target = targetId === undefined ? undefined : game.players[targetId]
    if (!target?.alive || !target.cards[action.cardIndex]) throw new Error('Choose a valid card to exchange.')
    if (!game.deck.length) throw new Error('The Court has no cards available to exchange.')
    const deck = [...game.deck]
    const replacement = deck.pop()!
    const returned = target.cards[action.cardIndex]
    const players = game.players.map(player => player.id === target.id
      ? { ...player, cards: player.cards.map((role, index) => index === action.cardIndex ? replacement : role) }
      : player)
    return endOrContinue({ ...game, players, deck: shuffled([...deck, returned], random), phase: 'turn', pending: null }, actorId, `${game.players[actorId].name} forced ${target.name} to exchange a card with the Court.`)
  }

  throw new Error('That action is not available in the current phase.')
}
