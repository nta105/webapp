# Thien An Nguyen's Resume

A modern, responsive resume built with Next.js, TypeScript, and Tailwind CSS.

## Features
- Responsive design
- Dark/Light mode
- Modern UI
- Accessible keyboard-operable navigation and photo viewers
- Optimized local and YouTube preview images
- Page-specific metadata for portfolio routes
- Contact form honeypot and FormSubmit spam verification
- Built with Next.js 16

## Catan · Enhanced Classic, Seafarers & Cities and Knights

The **Game version** selector offers three independent rulesets. Enhanced Classic
remains the default with all existing 3–6-player settings. **Seafarers: Outer
Islands** supports 3–6 players on an original, fully visible scenario. For 3–4:
19-hex mainland, six resource islands and 36 sea hexes. This is a custom
scenario, not an official Seafarers map or a complete scenario collection.
It has no gold fields or fog/exploration tiles.
For 5–6 players the map expands to a 30-hex mainland, six offshore resource
islands and 55 sea hexes (91 total). The bank has 24 of each resource and the
development deck has 34 cards. The 13-point goal and individual piece limits
are unchanged. Turns remain clockwise with no special building phase; this
is a custom expanded scenario, not the official 5–6-player extension.

Every new match shuffles resource terrain and number tokens separately in
all three versions and both board sizes; numbers are not permanently tied to a
resource type. Seafarers also independently shuffles offshore resources and
their number tokens. Token/resource counts are preserved, sea/desert tiles
have no production number, and 6/8 tiles cannot be adjacent. Island outlines
stay scenario-defined; the lobby board is an illustrative preview, not the
next match's layout. Randomization varies strategy but does not guarantee
equal starting positions or mathematically unique layouts forever.

Seafarers starts both settlements on the mainland. At a coastal setup
settlement choose a free road or ship. Ships cost one wood and one wool, have
a separate 15-piece limit, and use sea/coastal edges. Roads and ships connect
only at your own settlement/city. After rolling, move at most one older ship
from an open end to a legal connected destination per turn; newly placed ships,
closed routes, and ships beside the pirate cannot move. Road Building grants
any combination of two roads and ships, subject to inventory and legality.

On a seven or Knight choose either the land robber or sea pirate. The pirate
blocks adjacent ship building/movement and allows theft from an opponent's
adjacent ship, but does not block production or interrupt route scoring.
Friendly robber protection applies to land only. Longest Trade Route combines
roads and ships (changing type at owned buildings only); its award still needs
five edges and gives two points. The first settlement on each offshore island
gives each player two bonus points once for that island. Seafarers wins at
**13 points on your own turn**, rather than Classic's 10.

Use the **English / Tiếng Việt** switch in the Catan header before or during a
match. It translates controls, rules, resource/card labels, errors and existing
journal entries without resetting the board, names, private-hand state or turn.
Vietnamese text uses self-hosted Be Vietnam Pro, including headings and form
controls, with extra heading line height for stacked accent marks.

Open `/side-projects/catan` (also linked from Side Projects). This is an
unofficial, original-art, local pass-and-play implementation for 3–6 humans,
not an online room or an AI game. Choose names in clockwise order; Player 1
starts. Classic and Seafarers use two settlement/road placements in snake order, with
starting resources from the second settlement. The board supports mouse,
touch and keyboard selection. Use Enlarge for a scrollable larger board.

Classic and Seafarers include dice production, finite resource bank and shortage rules,
settlements/cities/roads with piece limits, player trades with a private
accept/decline handoff, bank and coastal port trades, robber movement,
seven-triggered discards, random theft, all five development-card types,
Longest Road (including branches, loops and opposing-building interruptions),
Largest Army, hidden victory points and current-player victory at 10 points.
Action development cards cannot be played on their purchase turn; at most
one may be played each turn, including before rolling.

Enhanced mode has nonadjacent 6/8 tokens and an optional friendly robber
that protects tiles bordering anyone with 2 or fewer public points.
3–4 players use 19 hexes, 19 resources of each type and 25 development cards.
5–6 use 30 hexes, 24 resources of each type and 34 development cards.
The larger mode deliberately uses ordinary clockwise turns with **no special
building phase**. This configuration is a house variant, not the official
5–6-player extension. Other Seafarers scenarios, the official extension rules,
Standard mode and the complete official Cities & Knights expansion are not implemented.

### Cities & Knights · custom 3–6-player variant

Select **Cities & Knights · Custom** in the same version menu. This separate
mode preserves Classic and Seafarers; it cannot be combined with Seafarers.
It uses the randomized Classic island (19 hexes for 3–4, 30 for 5–6), ordinary
clockwise turns, a 13-point goal and no special building phase. It is not a
complete official expansion or official 5–6-player extension.

Snake setup gives each player one settlement/road, then one city/road. The
second placement grants one basic resource per neighboring productive hex.
Cities produce one resource plus one commodity on wood/paper, wool/cloth and
ore/coin; brick and grain cities still produce two resources. Commodity banks
have 19 of each type (24 for 5–6); shortages follow the resource-bank rule.
Discards and robber theft include resources and commodities, never progress cards.

Science, Trade and Politics cost 1, 2, 3, 4, then 5 paper, cloth or coin.
A city is required. Level three unlocks aqueduct (one basic resource when a
non-seven roll produces nothing for you), 2:1 commodity trading, or mighty
knights respectively. Level four claims a metropolis on an eligible city;
another player must strictly exceed the holder's level to take it. A metropolis
adds two points and cannot be lost to barbarians; one per city.

Recruit a basic knight beside your road for one ore + wool. Activate for grain;
promote for ore + wool, once per knight per turn, with two pieces per strength.
Mighty knights require Politics three. Active knights defend immediately but
cannot move, displace weaker knights or drive a neighboring robber until your
next turn. Movement follows your roads and cannot pass through buildings or
other knights. A displaced knight retreats along its owner's roads, or leaves
the board if trapped. Opposing knights interrupt road connectivity and scoring.
Walls cost two brick, maximum three, and each adds two to the seven-card safe
goods limit. A lost city also loses its wall; if all five settlement pieces are
already on the board, remove the city instead of adding a sixth settlement.

The event die has three barbarian faces and one face per improvement track.
Colored events award progress to players with a positive matching level when
the first (red) resource die is at most that level + one. Seven barbarian
advances trigger an attack. **Custom ordering:** resolve production and any
seven discards/robber first, then the attack, aqueduct and excess progress.
The robber cannot move until after the first attack, but sevens still discard.
Active knight strength must meet the total city count, including metropolises.
A unique strongest defender gains one point; tied leaders choose progress.
If defense fails, the weakest defenders among players with vulnerable cities
each downgrade one city. All knights deactivate after every attack.

The deliberately small **custom progress collection has six types**, not the
official expansion's full deck: Supply (two selected basic resources), Engineer
(free wall), Trade fleet (selected resource 2:1 until your next turn), Resource
monopoly (up to two selected resources from each opponent), Mobilization
(activate all inactive knights free), and Bishop (robber move/theft after the
first attack). Three 12-card decks each contain six copies of their two types;
played/returned cards recycle when their deck empties. Keep at most four;
play any number after rolling, including immediately after drawing.
There is no merchant, classic development deck or Largest Army. Longest Road
still awards two points. Commodities and progress hands use private handoffs;
improvement levels, knights, event/defense status and points remain public.

The board, resource totals and journal are public. Hands and development
cards require a private reveal after a player handoff; switching windows or
tabs hides them. This is a trusted-player privacy screen, not authentication:
all state is in client memory. Reloading, leaving the route or starting a new
table discards the match; there is no autosave or resume.

Run `npm run test:catan` using Node.js 22.14 or newer. Validate integration with
`npx tsc --noEmit`, `npx eslint app/side-projects/catan lib/catan-i18n.ts lib/catan-cities.ts lib/catan-rules.ts
lib/catan-rules.test.mjs app/side-projects/page.tsx`, and `npm run build`.

## Werewolf host tool

Open `/side-projects/werewolf`. Enter 2-60 unique player names in clockwise
seat order and select exactly one role per player. Role assignment is random;
seat order is not. The numbered rows can be edited or reordered before starting.
All 14 existing roles are available. Special roles are limited to one instance,
except wolves, wolf cubs, Fox, 50/50 and villagers.

Fox scans the selected living player and their nearest living neighbor on each
side. Bear checks its nearest living neighbors after all night deaths. Both
wrap around the circle and skip dead seats without renumbering players.
Transformed 50/50 players count as wolves. The existing Bear signal reversal
when targeted by Bitch, and repeated signal after Bear dies, are preserved.

Each night ends with a private host review of selected and reflected targets,
blocked/skipped actions, outcomes, remaining potions, player status and living
neighbors. Acknowledgment continues to public sunrise, then Bear's public
announcement, then victory checking and the day phase. The review is not an
undo/editor. Reviews remain available after the match; nothing is persisted
across reloads. Logs and player roles are hidden during public announcements;
the remaining controls and private prompts are intended for the host only.

With Node.js 22.14 or newer, run `npm run test:werewolf` for the focused rule
tests. Run `npx tsc --noEmit`, `npx eslint app/side-projects/werewolf/page.tsx
lib/werewolf-rules.ts lib/werewolf-rules.test.mjs`, and `npm run build` for
integration checks. Use `npm run dev -- --port 3001` to run locally.

## The Resistance

Use the English / Tiếng Việt switch in the page header to translate setup,
role guides, private handoffs, group decisions, mission results, history, and errors.
Switching language keeps the active match, selections and player names intact.
The selection applies to this page session; reloading starts in English.

Open `/side-projects/avalon`. This route now displays the Hidden Agenda role
names: Commander, Bodyguard, Resistance Member, Assassin, False Commander,
Deep Cover Spy, Blind Spy, and Spy. The underlying role identifiers remain
Avalon-compatible. Each role has an ability, objective and strategy guide in
setup and during its private reveal. Bodyguard protects the Commander through
deduction and misdirection, not a shield or cancellation ability.

Basic Resistance is the default: only Resistance Members and Spies, without
special abilities, Commander or Assassin. Resistance wins immediately after
three successful missions. Spies know each other; Resistance Members receive
no secret identities. The separate Commander preset adds Commander, Bodyguard,
Assassin and False Commander. Custom is a separate house-rule configuration,
not a preset that forces special roles. Roles stay fixed for the match.

Custom starts from the current preset and provides quantities for all eight
roles, including zero quantities and duplicated special roles. Quantities
must be non-negative whole numbers, total exactly the player count, and include
both factions. Basic/Commander role shortcuts replace only the quantities,
leaving custom mission settings intact. Duplicate Commanders and False
Commanders all appear as candidates to every Bodyguard. Each repeated role
uses the same ability independently.

Each of the five missions has editable group size and required Fail cards.
Editing a mission from another preset enters Custom mode. Group size must be
1 through the player count; required Fails must be 1 through the smaller of
group size and total Spies. This prevents impossible failure thresholds.
Recommended missions restores the default player-count table. Untouched
mission defaults follow player-count changes; edited missions and custom
role quantities are retained, with validation errors if they no longer fit.
The displayed track previews the configuration. Starting a match copies the
roles and mission rules, and all selections, outcomes and displays use that
saved configuration, never a newly calculated default.

Custom final identification is enabled only when at least one Commander and
one Assassin are assigned. Multiple Assassins share one collective target;
identifying any Commander wins for Spies. Without that role combination,
Resistance wins directly after three successes. These combinations are not
balance-tested. The five-mission, three-success/three-failure and five-rejected
group rules remain unchanged.

5-10 players use the unchanged standard faction counts and mission sizes.
11-20 players use explicitly labeled experimental house rules, not an official
or balance-tested extension. Spies are `round(playerCount * 0.4)` and the
remaining players are Resistance. The five group sizes are
`ceil(playerCount * fraction)` for fractions `0.3, 0.4, 0.4, 0.5, 0.5`.
For example, 12 players have 7 Resistance, 5 Spies, and groups of 4/5/5/6/6.
Default mission four requires two Fail cards for all counts of 7 or more;
other default missions require one. Custom thresholds override these defaults.
More participants increase handoff and discussion time.
No other expansion modules are implemented.

Names define clockwise leader order. The first leader is selectable. Pass the
device down the player list for private roles, then let the leader select a
group. Discuss the proposed group together in person, then record one shared
Accept or Reject decision on the device. The app does not collect individual
approvals or vote counts. Rejection moves leadership to the next player,
wrapping around the list. Five consecutive rejected groups give the Spies the
win.

After approval, group members submit cards in player-list order, regardless
of selection order. Resistance must play Pass; Spies may play Pass or Fail.
After the final card, the app seals the outcome and discards individual cards.
Return the device to the group and press Reveal mission result to publish
aggregate Pass/Fail counts. Acknowledge that result before the next leader,
victory, or final identification. Three failed missions give Spies the win.
In basic mode, three successful missions immediately win for the Resistance.
In Commander and applicable Custom setups, the Assassin can still win for
Spies by identifying a Commander; otherwise the Resistance wins.

This is a single-device pass-and-play tool, not a networked game. Keep the
device private during role reveals and mission cards. The group's decision is
recorded without individual responses; mission history never attributes cards
to individuals. Hidden roles and sealed aggregate outcomes exist in client memory, so privacy depends on
trusted players, not authentication or tamper resistance. Reloading discards
the match; no secret state is saved to local storage.

Run `npm run test:avalon` with Node.js 22.14 or newer. Use `npx eslint
app/side-projects/avalon/page.tsx lib/avalon-rules.ts lib/avalon-rules.test.mjs`,
`npx tsc --noEmit`, and `npm run build` for integration checks.

## Coup

Open `/side-projects/coup` for the standard 3-6 player base game. Each player
starts with two influence cards and two coins. The game supports the five
original roles, income, Foreign Aid, Tax, Assassination, Stealing, Exchange,
Coup, role challenges, and role-based blocks. English and Vietnamese are
available from the in-game language switch; changing language keeps the
current game and setup intact. A visible in-game reference lists every role's
action claim and block ability for all players to consult. A player with 10 or more coins at
the start of their turn must Coup. No expansions or custom rule variants are
included.

Pass the device for private card reveals, influence losses, and exchanges.
Challenges, blocks, and group decisions are made openly in person. Hidden cards
and game state exist in browser memory, not a protected server; keep the device
private and note that reloading ends the match without saving it.

Run `npm run test:coup` with Node.js 22.14 or newer. Use `npx eslint
app/side-projects/coup/page.tsx lib/coup-rules.ts lib/coup-rules.test.mjs`,
`npx tsc --noEmit`, and `npm run build` for integration checks.
