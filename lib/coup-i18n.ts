import type { CoupRole } from './coup-rules'

export type CoupLanguage = 'en' | 'vi'

const english = {
  language: 'Game language',
  sideProjects: 'Side Projects',
  edition: 'Reformation · Faction play',
  playerCount: '3–6 players',
  players: 'Players',
  setupPlayers: 'Set up players',
  playerNumber: 'Player {number}',
  playerName: 'Player {number}',
  enterNames: 'Enter 3–6 names in clockwise order and assign each player to a faction. Both factions must be represented. Players start with 2 coins and 2 hidden influence cards.',
  firstPlayer: 'First player',
  reformationEdition: 'Reformation rules: choose a faction, switch allegiance for 1 coin, and eliminate the opposing faction.',
  chooseFaction: 'Choose faction for {name}',
  catholic: 'Catholic',
  protestant: 'Protestant',
  dealCards: 'Deal the cards',
  rules: 'Actions and rules',
  roleReference: 'Role reference · visible to everyone',
  roleAction: 'Action claim',
  roleBlock: 'Block',
  otherActions: 'Other actions',
  otherActionsDetails: 'Income: +1 coin. Foreign Aid: +2 coins, blockable by Duke. Coup: pay 7 coins and an opponent loses influence. You cannot Coup or assassinate a member of your faction. At 10 or more coins at the start of your turn, you must Coup.',
  challenges: 'Challenges',
  challengeRules: 'Any other living player may challenge a role claim. A truthful claimant returns the shown card to the Court, shuffles, and draws a replacement; the challenger loses influence. A false claimant loses influence and the claimed action or block fails.',
  influenceRules: 'Players lose one influence when challenged unsuccessfully, assassinated, or Couped. They choose which card to reveal. Losing both cards eliminates them. The last surviving faction wins.',
  standings: 'Player standings',
  turn: 'Turn',
  activeTurnBadge: 'Playing now',
  influence: 'influence',
  influences: 'influences',
  eliminated: 'Eliminated',
  revealed: 'revealed',
  hiddenInfluence: 'Hidden influence',
  privateDeal: 'Private card deal · Player {current} of {total}',
  passDeviceToPlayer: 'Pass the device to this player. Only they should view their influences.',
  viewCards: 'View my cards',
  keepCardsSecret: 'Keep these cards secret, then hide them before passing the device.',
  hideAndPass: 'Hide and pass device',
  turnOf: "{name}'s turn",
  mandatoryCoup: 'You have 10 or more coins. The rules require a Coup this turn.',
  chooseCoupTarget: 'Choose a target to Coup',
  coupPay: 'Coup · pay 7',
  chooseAction: 'Choose one action. Role claims may be challenged; blocks may also be challenged.',
  income: 'Income',
  incomeDetails: 'Take 1 coin. Cannot be blocked or challenged.',
  foreignAid: 'Foreign Aid',
  foreignAidDetails: 'Take 2 coins. Any other player may block with Duke.',
  tax: 'Tax',
  taxDetails: 'Claim Duke to take 3 coins.',
  exchange: 'Exchange',
  exchangeDetails: 'Claim Inquisitor to exchange one card with the Court.',
  investigate: 'Investigate',
  investigateDetails: 'Claim Inquisitor to inspect an opponent and optionally force a card exchange.',
  convert: 'Change allegiance · 1',
  convertDetails: 'Once per turn, pay 1 coin to switch factions before taking your action.',
  chooseActionTarget: 'Choose a target for a targeted action',
  assassinate: 'Assassinate · 3',
  steal: 'Steal',
  coup: 'Coup · 7',
  turnRules: 'At 10 or more coins, Coup is mandatory. Assassination costs are paid when declared, even if the action is blocked.',
  challengeClaim: 'Challenge the claim?',
  noChallenge: 'No challenge · continue',
  otherPlayersChallenge: 'Any other living player may challenge. Select the challenger:',
  challengeAs: 'Challenge as {name}',
  blockOrAllow: 'Block or allow?',
  mayBlockAid: 'Any other player may claim Duke to block Foreign Aid.',
  mayBlockTarget: '{name} may claim {roles} to block.',
  noBlock: 'No block · continue',
  blockAs: 'Block as {role} · {name}',
  challengeBlock: 'Challenge the block?',
  acceptBlock: 'Accept block',
  challengeBlockPrompt: 'Any other living player may challenge the claim:',
  mustLoseInfluence: '{name} must lose influence',
  passToLosingPlayer: 'Pass the device to this player. Their hand stays private; the selected card will be revealed.',
  chooseCard: 'Choose a card',
  selectCardToLose: 'Select one of your hidden cards to reveal and lose.',
  exchangeCards: '{name}: exchange cards',
  passToActivePlayer: 'Pass the device to the active player to privately choose which cards to keep.',
  viewExchangeCards: 'View exchange cards',
  chooseTwoCards: 'Choose exactly 2 cards to keep. Unselected cards return to the Court.',
  keepSelectedCards: 'Keep selected cards',
  investigationTitle: 'Investigate {name}',
  passForInvestigation: 'Pass the device to the active player. They may privately inspect this player’s cards.',
  viewTargetCards: 'View target’s cards',
  inspectAndReplace: 'Choose a card to return to the Court and replace, or finish without forcing an exchange.',
  finishInvestigation: 'Finish investigation',
  gameEnded: 'Game ended',
  winsCoup: '{name} wins Coup!',
  factionWins: 'The {faction} faction wins!',
  finalRoles: 'Final roles',
  newGame: 'New game',
  passAndPlay: 'Pass-and-play on one device. Private information depends on players keeping their hands hidden.',
  privacy: 'This is a local pass-and-play aid, not an online game. Hidden cards are held in browser memory and are not protected from someone inspecting the device. No match state is saved after reload.',
  choosePlayer: 'Choose player',
  roleDuke: 'Duke',
  roleAssassin: 'Assassin',
  roleCaptain: 'Captain',
  roleInquisitor: 'Inquisitor',
  roleContessa: 'Contessa',
  dukeClaim: 'Claim Duke to take 3 coins from the Court.',
  dukePower: 'Block Foreign Aid.',
  assassinClaim: 'Claim Assassin and pay 3 coins to make a player lose influence.',
  assassinPower: 'Cannot block.',
  captainClaim: 'Claim Captain to steal up to 2 coins from a player.',
  captainPower: 'Block a Steal action targeting you.',
  inquisitorClaim: 'Claim Inquisitor to exchange one card with the Court, or inspect a player and force a card exchange.',
  inquisitorPower: 'Block a Steal action targeting you.',
  contessaClaim: 'No action claim.',
  contessaPower: 'Block an assassination targeting you.',
  messageLastStanding: '{name} is the last player standing.',
  messageNoPlayers: 'No players remain.',
  messageTookCoins: '{name} took {count} coins from the Court.',
  messageStoleCoins: '{name} stole {count} coins from {target}.',
  messageNoCourtCards: '{name} has no Court cards available to draw.',
  messageExchanging: '{name} is exchanging cards.',
  messageActionFailed: "{name}'s action failed.",
  messageBlockSucceeded: "{name}'s block succeeded.",
  messageAidRequested: '{name} requested Foreign Aid.',
  messageClaimsRole: '{name} claims {role}.',
  messageClaimsBlock: '{name} claims {role} to block the action.',
  messageProvedClaim: '{name} proved the {role} claim.',
  messageChallengeLoss: '{name} must lose influence for the incorrect challenge.',
  messageFalseClaimLoss: '{name} must lose influence for the false claim.',
  messageLostRole: '{name} lost {role}.',
  messageAssassination: '{name} is attempting an assassination.',
  messageCoupLaunched: '{name} launched a Coup.',
  messageEliminatedBeforeSteal: '{name} was eliminated before the steal resolved.',
  messageEliminatedBeforeAssassination: '{name} was eliminated before the assassination resolved.',
  messageBlockAccepted: "{name}'s block was accepted.",
  messageExchangeComplete: '{name} completed the exchange.',
  messageFactionWins: '{faction} faction wins Coup!',
  messageChangedAllegiance: '{name} changed allegiance to {faction}.',
  messageInvestigating: '{name} is investigating {target}.',
  messageInvestigationComplete: 'The investigation is complete.',
  messageForcedExchange: '{name} forced {target} to exchange a card with the Court.',
  errorNoChallengeToPass: 'There is no challenged claim.',
  errorBlockDecision: 'Choose whether to block or allow the action.',
  errorNoClaimYet: 'There is no role claim to challenge yet.',
  errorPlayers: 'Coup requires 3-6 players.',
  errorNames: 'Enter a unique, non-empty name for every player.',
  errorFirstPlayer: 'Choose a valid first player.',
  errorFactions: 'Assign players to both factions.',
  errorActivePlayer: 'The active player is no longer in the game.',
  errorMandatoryCoup: 'A player with 10 or more coins must launch a Coup.',
  errorCoupCost: 'A Coup costs 7 coins.',
  errorCoupTarget: 'Choose a living opponent to Coup.',
  errorAssassinationCost: 'An assassination costs 3 coins.',
  errorAssassinationTarget: 'Choose a living opponent to assassinate.',
  errorFriendlyCoup: 'You cannot Coup a player in your faction.',
  errorFriendlyAssassination: 'You cannot assassinate a player in your faction.',
  errorConvertCost: 'Changing allegiance costs 1 coin.',
  errorConvertOnce: 'You can only change allegiance once per turn.',
  errorStealTarget: 'Choose a living opponent to steal from.',
  errorInvestigateTarget: 'Choose a living opponent to investigate.',
  errorInvestigateCard: 'Choose a valid card to exchange.',
  errorNoCourtCards: 'The Court has no cards available to exchange.',
  errorBlocker: 'Choose a living player other than the acting player to block.',
  errorBlockRole: 'That role cannot block this action.',
  errorBlockTarget: 'Only the targeted player may block this action.',
  errorChallengeTarget: 'Choose a living player other than the person making the claim.',
  errorNoClaim: 'There is no role claim to challenge.',
  errorLoseInfluencePlayer: 'Only the player losing influence may choose a card.',
  errorLoseInfluenceCard: 'Choose a card from your hand.',
  errorLossContinuation: 'The influence loss has no continuation.',
  errorExchangePlayer: 'Only the active player may complete this exchange.',
  errorExchangeCards: 'Keep exactly two cards.',
  errorUnavailable: 'That action is not available in the current phase.',
  errorStart: 'Could not start Coup.',
  errorAction: 'That action is not available.',
  confirmNewGame: 'Start a new game? The current match will be lost.',
} as const

const vietnamese: Record<keyof typeof english, string> = {
  language: 'Ngôn ngữ trò chơi',
  sideProjects: 'Dự án phụ',
  edition: 'Reformation · Chơi theo phe',
  playerCount: '3–6 người chơi',
  players: 'Người chơi',
  setupPlayers: 'Thiết lập người chơi',
  playerNumber: 'Người chơi {number}',
  playerName: 'Tên người chơi {number}',
  enterNames: 'Nhập tên 3–6 người chơi theo thứ tự chiều kim đồng hồ và chọn phe cho từng người. Cả hai phe đều phải có người chơi. Mỗi người bắt đầu với 2 xu và 2 lá Ảnh hưởng bí mật.',
  firstPlayer: 'Người đi đầu',
  reformationEdition: 'Luật Reformation: chọn phe, đổi phe với giá 1 xu và loại bỏ phe đối địch.',
  chooseFaction: 'Chọn phe cho {name}',
  catholic: 'Công giáo',
  protestant: 'Tin Lành',
  dealCards: 'Chia bài',
  rules: 'Hành động và luật chơi',
  roleReference: 'Tra cứu vai trò · mọi người đều xem được',
  roleAction: 'Tuyên bố hành động',
  roleBlock: 'Chặn',
  otherActions: 'Các hành động khác',
  otherActionsDetails: 'Thu nhập: +1 xu. Viện trợ nước ngoài: +2 xu, có thể bị Công tước chặn. Đảo chính: trả 7 xu để đối thủ mất Ảnh hưởng. Bạn không thể Đảo chính hoặc ám sát người cùng phe. Nếu bắt đầu lượt với ít nhất 10 xu, bạn bắt buộc phải Đảo chính.',
  challenges: 'Thách thức',
  challengeRules: 'Bất kỳ người chơi còn trong ván nào khác đều có thể thách thức lời tuyên bố vai. Nếu người bị thách thức nói thật, họ trả lá bài đã chứng minh về Bộ bài Cung đình, xáo bài và rút lá thay thế; người thách thức mất Ảnh hưởng. Nếu nói dối, người đó mất Ảnh hưởng và hành động hoặc chặn bài thất bại.',
  influenceRules: 'Người chơi mất một Ảnh hưởng khi thách thức sai, bị ám sát hoặc bị Đảo chính. Họ chọn lá bài sẽ lật. Mất cả hai lá sẽ bị loại. Phe còn người chơi sống sót cuối cùng sẽ thắng.',
  standings: 'Tình trạng người chơi',
  turn: 'Đang lượt',
  activeTurnBadge: 'ĐANG ĐẾN LƯỢT',
  influence: 'Ảnh hưởng',
  influences: 'Ảnh hưởng',
  eliminated: 'Đã bị loại',
  revealed: 'đã lộ',
  hiddenInfluence: 'Ảnh hưởng bí mật',
  privateDeal: 'Chia bài riêng · Người chơi {current}/{total}',
  passDeviceToPlayer: 'Chuyển thiết bị cho người chơi này. Chỉ họ được xem các lá Ảnh hưởng của mình.',
  viewCards: 'Xem bài của tôi',
  keepCardsSecret: 'Hãy giữ bí mật các lá bài, rồi úp lại trước khi chuyển thiết bị.',
  hideAndPass: 'Úp bài và chuyển thiết bị',
  turnOf: 'Lượt của {name}',
  mandatoryCoup: 'Bạn có ít nhất 10 xu. Theo luật, bạn bắt buộc phải Đảo chính trong lượt này.',
  chooseCoupTarget: 'Chọn mục tiêu để Đảo chính',
  coupPay: 'Đảo chính · trả 7 xu',
  chooseAction: 'Chọn một hành động. Lời tuyên bố vai và hành động chặn đều có thể bị thách thức.',
  income: 'Thu nhập',
  incomeDetails: 'Nhận 1 xu. Không thể bị chặn hoặc thách thức.',
  foreignAid: 'Viện trợ nước ngoài',
  foreignAidDetails: 'Nhận 2 xu. Người chơi khác có thể dùng Công tước để chặn.',
  tax: 'Thu thuế',
  taxDetails: 'Tuyên bố là Công tước để nhận 3 xu.',
  exchange: 'Đổi bài',
  exchangeDetails: 'Tuyên bố là Thẩm tra viên để đổi một lá với Bộ bài Cung đình.',
  investigate: 'Điều tra',
  investigateDetails: 'Tuyên bố là Thẩm tra viên để xem bài của đối thủ và có thể buộc họ đổi một lá.',
  convert: 'Đổi phe · 1 xu',
  convertDetails: 'Mỗi lượt một lần, trả 1 xu để đổi phe trước khi thực hiện hành động.',
  chooseActionTarget: 'Chọn mục tiêu cho hành động nhắm tới người chơi',
  assassinate: 'Ám sát · 3 xu',
  steal: 'Cướp xu',
  coup: 'Đảo chính · 7 xu',
  turnRules: 'Nếu có ít nhất 10 xu, bắt buộc phải Đảo chính. Phí ám sát được trả ngay khi tuyên bố, kể cả khi hành động bị chặn.',
  challengeClaim: 'Thách thức lời tuyên bố?',
  noChallenge: 'Không thách thức · tiếp tục',
  otherPlayersChallenge: 'Bất kỳ người chơi còn trong ván nào khác cũng có thể thách thức. Chọn người thách thức:',
  challengeAs: 'Thách thức với tư cách {name}',
  blockOrAllow: 'Chặn hay cho phép?',
  mayBlockAid: 'Người chơi khác có thể tuyên bố là Công tước để chặn Viện trợ nước ngoài.',
  mayBlockTarget: '{name} có thể tuyên bố là {roles} để chặn.',
  noBlock: 'Không chặn · tiếp tục',
  blockAs: 'Chặn với {role} · {name}',
  challengeBlock: 'Thách thức hành động chặn?',
  acceptBlock: 'Chấp nhận chặn',
  challengeBlockPrompt: 'Bất kỳ người chơi còn trong ván nào khác cũng có thể thách thức lời tuyên bố:',
  mustLoseInfluence: '{name} phải mất Ảnh hưởng',
  passToLosingPlayer: 'Chuyển thiết bị cho người chơi này. Bài trên tay vẫn được giữ kín; lá được chọn sẽ bị lật.',
  chooseCard: 'Chọn một lá bài',
  selectCardToLose: 'Chọn một lá bài bí mật để lật và mất.',
  exchangeCards: '{name}: đổi bài',
  passToActivePlayer: 'Chuyển thiết bị cho người đang lượt để họ chọn riêng những lá bài muốn giữ.',
  viewExchangeCards: 'Xem bài đổi',
  chooseTwoCards: 'Chọn đúng 2 lá để giữ. Các lá không chọn sẽ trở về Bộ bài Cung đình.',
  keepSelectedCards: 'Giữ các lá đã chọn',
  investigationTitle: 'Điều tra {name}',
  passForInvestigation: 'Chuyển thiết bị cho người đang lượt để họ xem riêng bài của người chơi này.',
  viewTargetCards: 'Xem bài mục tiêu',
  inspectAndReplace: 'Chọn một lá để trả về Bộ bài Cung đình và đổi lá mới, hoặc kết thúc mà không ép đổi.',
  finishInvestigation: 'Kết thúc điều tra',
  gameEnded: 'Ván đấu kết thúc',
  winsCoup: '{name} thắng Coup!',
  factionWins: 'Phe {faction} chiến thắng!',
  finalRoles: 'Vai trò cuối ván',
  newGame: 'Ván mới',
  passAndPlay: 'Chơi lần lượt trên cùng một thiết bị. Thông tin bí mật chỉ được giữ kín nếu mọi người không để lộ bài.',
  privacy: 'Đây là công cụ hỗ trợ chơi lần lượt trên một thiết bị, không phải trò chơi trực tuyến. Bài bí mật được lưu trong bộ nhớ trình duyệt và không được bảo vệ khỏi người kiểm tra thiết bị. Tải lại trang sẽ xóa ván đấu.',
  choosePlayer: 'Chọn người chơi',
  roleDuke: 'Công tước',
  roleAssassin: 'Sát thủ',
  roleCaptain: 'Đội trưởng',
  roleInquisitor: 'Thẩm tra viên',
  roleContessa: 'Contessa',
  dukeClaim: 'Tuyên bố là Công tước để lấy 3 xu từ Bộ bài Cung đình.',
  dukePower: 'Chặn hành động Viện trợ nước ngoài.',
  assassinClaim: 'Tuyên bố là Sát thủ và trả 3 xu để khiến một người chơi mất Ảnh hưởng.',
  assassinPower: 'Không thể chặn.',
  captainClaim: 'Tuyên bố là Đội trưởng để cướp tối đa 2 xu từ một người chơi.',
  captainPower: 'Chặn hành động Cướp xu nhắm vào bạn.',
  inquisitorClaim: 'Tuyên bố là Thẩm tra viên để đổi một lá với Bộ bài Cung đình, hoặc xem bài người chơi khác và buộc họ đổi một lá.',
  inquisitorPower: 'Chặn hành động Cướp xu nhắm vào bạn.',
  contessaClaim: 'Không có hành động để tuyên bố.',
  contessaPower: 'Chặn vụ ám sát nhắm vào bạn.',
  messageLastStanding: '{name} là người cuối cùng còn trụ lại.',
  messageNoPlayers: 'Không còn người chơi nào.',
  messageTookCoins: '{name} lấy {count} xu từ Bộ bài Cung đình.',
  messageStoleCoins: '{name} cướp {count} xu từ {target}.',
  messageNoCourtCards: 'Không còn lá bài nào trong Bộ bài Cung đình cho {name} rút.',
  messageExchanging: '{name} đang đổi bài.',
  messageActionFailed: 'Hành động của {name} thất bại.',
  messageBlockSucceeded: 'Lệnh chặn của {name} thành công.',
  messageAidRequested: '{name} yêu cầu Viện trợ nước ngoài.',
  messageClaimsRole: '{name} tuyên bố là {role}.',
  messageClaimsBlock: '{name} tuyên bố là {role} để chặn hành động.',
  messageProvedClaim: '{name} đã chứng minh lời tuyên bố {role} là đúng.',
  messageChallengeLoss: '{name} mất Ảnh hưởng vì thách thức sai.',
  messageFalseClaimLoss: '{name} mất Ảnh hưởng vì tuyên bố vai sai.',
  messageLostRole: '{name} đã mất vai {role}.',
  messageAssassination: '{name} đang thực hiện một vụ ám sát.',
  messageCoupLaunched: '{name} đã tiến hành Đảo chính.',
  messageEliminatedBeforeSteal: '{name} đã bị loại trước khi hành động Cướp xu được thực hiện.',
  messageEliminatedBeforeAssassination: '{name} đã bị loại trước khi vụ ám sát được thực hiện.',
  messageBlockAccepted: 'Lệnh chặn của {name} đã được chấp nhận.',
  messageExchangeComplete: '{name} đã đổi bài xong.',
  messageFactionWins: 'Phe {faction} chiến thắng Coup!',
  messageChangedAllegiance: '{name} đã đổi phe sang {faction}.',
  messageInvestigating: '{name} đang điều tra {target}.',
  messageInvestigationComplete: 'Cuộc điều tra đã kết thúc.',
  messageForcedExchange: '{name} đã buộc {target} đổi một lá với Bộ bài Cung đình.',
  errorNoChallengeToPass: 'Hiện không có lời tuyên bố nào đang bị thách thức.',
  errorBlockDecision: 'Hãy chọn chặn hoặc cho phép hành động.',
  errorNoClaimYet: 'Chưa có lời tuyên bố vai nào để thách thức.',
  errorPlayers: 'Coup cần từ 3 đến 6 người chơi.',
  errorNames: 'Hãy nhập tên riêng, không để trống cho từng người chơi.',
  errorFirstPlayer: 'Hãy chọn người đi đầu hợp lệ.',
  errorFactions: 'Hãy phân người chơi vào cả hai phe.',
  errorActivePlayer: 'Người đang lượt không còn trong ván.',
  errorMandatoryCoup: 'Người có ít nhất 10 xu bắt buộc phải tiến hành Đảo chính.',
  errorCoupCost: 'Một lần Đảo chính tốn 7 xu.',
  errorCoupTarget: 'Hãy chọn một đối thủ còn trong ván để Đảo chính.',
  errorAssassinationCost: 'Một vụ ám sát tốn 3 xu.',
  errorAssassinationTarget: 'Hãy chọn một đối thủ còn trong ván để ám sát.',
  errorFriendlyCoup: 'Bạn không thể Đảo chính người cùng phe.',
  errorFriendlyAssassination: 'Bạn không thể ám sát người cùng phe.',
  errorConvertCost: 'Đổi phe tốn 1 xu.',
  errorConvertOnce: 'Mỗi lượt bạn chỉ được đổi phe một lần.',
  errorStealTarget: 'Hãy chọn một đối thủ còn trong ván để cướp xu.',
  errorInvestigateTarget: 'Hãy chọn một đối thủ còn trong ván để điều tra.',
  errorInvestigateCard: 'Hãy chọn một lá bài hợp lệ để đổi.',
  errorNoCourtCards: 'Bộ bài Cung đình không còn lá để đổi.',
  errorBlocker: 'Hãy chọn một người còn trong ván, không phải người đang thực hiện hành động, để chặn.',
  errorBlockRole: 'Vai trò này không thể chặn hành động đó.',
  errorBlockTarget: 'Chỉ người bị nhắm tới mới có thể chặn hành động này.',
  errorChallengeTarget: 'Hãy chọn một người còn trong ván, không phải người đưa ra lời tuyên bố.',
  errorNoClaim: 'Hiện không có lời tuyên bố vai nào để thách thức.',
  errorLoseInfluencePlayer: 'Chỉ người đang mất Ảnh hưởng mới được chọn lá bài.',
  errorLoseInfluenceCard: 'Hãy chọn một lá bài trên tay.',
  errorLossContinuation: 'Việc mất Ảnh hưởng không có bước tiếp theo.',
  errorExchangePlayer: 'Chỉ người đang lượt mới được hoàn tất đổi bài.',
  errorExchangeCards: 'Hãy chọn đúng hai lá bài.',
  errorUnavailable: 'Hành động này không khả dụng trong giai đoạn hiện tại.',
  errorStart: 'Không thể bắt đầu Coup.',
  errorAction: 'Hành động này hiện không khả dụng.',
  confirmNewGame: 'Bắt đầu ván mới? Ván hiện tại sẽ bị xóa.',
}

const roleKeys: Record<CoupRole, keyof typeof english> = {
  Duke: 'roleDuke',
  Assassin: 'roleAssassin',
  Captain: 'roleCaptain',
  Inquisitor: 'roleInquisitor',
  Contessa: 'roleContessa',
}

const roleDetailKeys: Record<CoupRole, { action: keyof typeof english; block: keyof typeof english }> = {
  Duke: { action: 'dukeClaim', block: 'dukePower' },
  Assassin: { action: 'assassinClaim', block: 'assassinPower' },
  Captain: { action: 'captainClaim', block: 'captainPower' },
  Inquisitor: { action: 'inquisitorClaim', block: 'inquisitorPower' },
  Contessa: { action: 'contessaClaim', block: 'contessaPower' },
}

export function coupTranslator(language: CoupLanguage) {
  const dictionary = language === 'vi' ? vietnamese : english
  return (key: keyof typeof english, values: Record<string, string | number> = {}) =>
    dictionary[key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`))
}

export function localizeCoupRole(language: CoupLanguage, role: CoupRole): string {
  return coupTranslator(language)(roleKeys[role])
}

export function localizeCoupRoleDetails(language: CoupLanguage, role: CoupRole) {
  const t = coupTranslator(language)
  return {
    action: t(roleDetailKeys[role].action),
    block: t(roleDetailKeys[role].block),
  }
}

export function localizeCoupError(language: CoupLanguage, error: string): string {
  if (language === 'en') return error
  const errorKeys: Partial<Record<string, keyof typeof english>> = {
    'There is no challenged claim.': 'errorNoChallengeToPass',
    'Choose whether to block or allow the action.': 'errorBlockDecision',
    'There is no role claim to challenge yet.': 'errorNoClaimYet',
    'Coup requires 3-6 players.': 'errorPlayers',
    'Enter a unique, non-empty name for every player.': 'errorNames',
    'Choose a valid first player.': 'errorFirstPlayer',
    'Assign players to both factions.': 'errorFactions',
    'The active player is no longer in the game.': 'errorActivePlayer',
    'A player with 10 or more coins must launch a Coup.': 'errorMandatoryCoup',
    'A Coup costs 7 coins.': 'errorCoupCost',
    'Choose a living opponent to Coup.': 'errorCoupTarget',
    'An assassination costs 3 coins.': 'errorAssassinationCost',
    'Choose a living opponent to assassinate.': 'errorAssassinationTarget',
    'You cannot Coup a player in your faction.': 'errorFriendlyCoup',
    'You cannot assassinate a player in your faction.': 'errorFriendlyAssassination',
    'Changing allegiance costs 1 coin.': 'errorConvertCost',
    'You can only change allegiance once per turn.': 'errorConvertOnce',
    'Choose a living opponent to steal from.': 'errorStealTarget',
    'Choose a living opponent to investigate.': 'errorInvestigateTarget',
    'Choose a valid card to exchange.': 'errorInvestigateCard',
    'The Court has no cards available to exchange.': 'errorNoCourtCards',
    'Choose a living player other than the acting player to block.': 'errorBlocker',
    'That role cannot block this action.': 'errorBlockRole',
    'Only the targeted player may block this action.': 'errorBlockTarget',
    'Choose a living player other than the person making the claim.': 'errorChallengeTarget',
    'There is no role claim to challenge.': 'errorNoClaim',
    'Only the player losing influence may choose a card.': 'errorLoseInfluencePlayer',
    'Choose a card from your hand.': 'errorLoseInfluenceCard',
    'The influence loss has no continuation.': 'errorLossContinuation',
    'Only the active player may complete this exchange.': 'errorExchangePlayer',
    'Keep exactly two cards.': 'errorExchangeCards',
    'That action is not available in the current phase.': 'errorUnavailable',
  }
  const key = errorKeys[error]
  return key ? coupTranslator(language)(key) : error
}

function localizeMessageContent(language: CoupLanguage, message: string): string {
  const t = coupTranslator(language)
  let match = message.match(/^(.+ lost (?:Duke|Assassin|Captain|Inquisitor|Contessa)\.) (.+)$/)
  if (match) return `${localizeMessageContent(language, match[1])} ${localizeMessageContent(language, match[2])}`
  match = message.match(/^(Catholic|Protestant) faction wins Coup\.$/)
  if (match) return t('messageFactionWins', { faction: t(match[1] === 'Catholic' ? 'catholic' : 'protestant') })
  match = message.match(/^(.+) changed allegiance to (Catholic|Protestant)\.$/)
  if (match) return t('messageChangedAllegiance', { name: match[1], faction: t(match[2] === 'Catholic' ? 'catholic' : 'protestant') })
  match = message.match(/^(.+) is investigating (.+)\.$/)
  if (match) return t('messageInvestigating', { name: match[1], target: match[2] })
  if (message === 'The investigation is complete.') return t('messageInvestigationComplete')
  match = message.match(/^(.+) forced (.+) to exchange a card with the Court\.$/)
  if (match) return t('messageForcedExchange', { name: match[1], target: match[2] })
  match = message.match(/^(.+) is the last player standing\.$/)
  if (match) return t('messageLastStanding', { name: match[1] })
  if (message === 'No players remain.') return t('messageNoPlayers')
  match = message.match(/^(.+) took (\d+) coins? from the Court\.$/)
  if (match) return t('messageTookCoins', { name: match[1], count: match[2] })
  match = message.match(/^(.+) stole (\d+) (coin|coins) from (.+)\.$/)
  if (match) return t('messageStoleCoins', { name: match[1], count: match[2], target: match[4] })
  match = message.match(/^(.+) has no Court cards available to draw\.$/)
  if (match) return t('messageNoCourtCards', { name: match[1] })
  match = message.match(/^(.+) is exchanging cards\.$/)
  if (match) return t('messageExchanging', { name: match[1] })
  match = message.match(/^(.+)'s action failed\.$/)
  if (match) return t('messageActionFailed', { name: match[1] })
  match = message.match(/^(.+)'s block succeeded\.$/)
  if (match) return t('messageBlockSucceeded', { name: match[1] })
  match = message.match(/^(.+) requested Foreign Aid\.$/)
  if (match) return t('messageAidRequested', { name: match[1] })
  match = message.match(/^(.+) claims (Duke|Assassin|Captain|Inquisitor|Contessa)\.$/)
  if (match) return t('messageClaimsRole', { name: match[1], role: localizeCoupRole(language, match[2] as CoupRole) })
  match = message.match(/^(.+) claims (Duke|Assassin|Captain|Inquisitor|Contessa) to block the action\.$/)
  if (match) return t('messageClaimsBlock', { name: match[1], role: localizeCoupRole(language, match[2] as CoupRole) })
  match = message.match(/^(.+) proved the (Duke|Assassin|Captain|Inquisitor|Contessa) claim\.$/)
  if (match) return t('messageProvedClaim', { name: match[1], role: localizeCoupRole(language, match[2] as CoupRole) })
  match = message.match(/^(.+) must lose influence for the incorrect challenge\.$/)
  if (match) return t('messageChallengeLoss', { name: match[1] })
  match = message.match(/^(.+) must lose influence for the false claim\.$/)
  if (match) return t('messageFalseClaimLoss', { name: match[1] })
  match = message.match(/^(.+) lost (Duke|Assassin|Captain|Inquisitor|Contessa)\.(?:\s*(.*))?$/)
  if (match) {
    const lost = t('messageLostRole', { name: match[1], role: localizeCoupRole(language, match[2] as CoupRole) })
    return match[3] ? `${lost} ${localizeMessageContent(language, match[3])}` : lost
  }
  match = message.match(/^(.+) is attempting an assassination\.$/)
  if (match) return t('messageAssassination', { name: match[1] })
  match = message.match(/^(.+) launched a Coup\.$/)
  if (match) return t('messageCoupLaunched', { name: match[1] })
  match = message.match(/^(.+) was eliminated before the steal resolved\.$/)
  if (match) return t('messageEliminatedBeforeSteal', { name: match[1] })
  match = message.match(/^(.+) was eliminated before the assassination resolved\.$/)
  if (match) return t('messageEliminatedBeforeAssassination', { name: match[1] })
  match = message.match(/^(.+)'s block was accepted\.$/)
  if (match) return t('messageBlockAccepted', { name: match[1] })
  match = message.match(/^(.+) completed the exchange\.$/)
  if (match) return t('messageExchangeComplete', { name: match[1] })
  return message
}

export function localizeCoupMessage(language: CoupLanguage, message: string): string {
  if (language === 'en' || !message) return message
  return localizeMessageContent(language, message)
}
