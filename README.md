# Thien An Nguyen's Resume

A modern, responsive resume built with Next.js, TypeScript, and Tailwind CSS.

## Features
- Responsive design
- Dark/Light mode
- Modern UI
- Built with Next.js 15.1

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
