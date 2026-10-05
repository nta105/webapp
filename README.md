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
