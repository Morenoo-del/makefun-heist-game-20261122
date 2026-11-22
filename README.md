# Velvet Vault — The Midnight Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Morenoo-del/makefun-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Morenoo-del/makefun-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game for the make.fun **best-heist-game-20261122-0559** bounty. You are the thief in the Velvet Vault: cross three rooms past patrolling guards and sweeping security cameras, steal each room's treasure, and slip out the exit before the alarm hits 100%.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there.
- **Steal:** walk over loot. The gem (cyan diamond) unlocks the exit; cash and gold are optional bonus.
- **Tools (each costs loot):** `1` noise-maker ($50, lures guards to a spot) · `2` EMP pulse ($100, blinds the nearest camera for 8s) · `3` disguise ($150, guards ignore you for 6s).
- **Danger:** guard vision cones and camera sweeps fill your suspicion and the alarm meter. A guard that touches you catches you; at 100% alarm the vault locks down.
- **Win:** grab the gem and reach the green EXIT. Clear all three rooms — The Gallery, The Vault Floor, The Crown Room — for the clean getaway.
- `P` pause · `M` mute · `R` retry after being caught · `Enter` advance screens.

## Run it

No build step, no network. Serve `game/` with any static server and open `game/index.html` in desktop Chrome, e.g.:

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080 in Chrome. All art is drawn on canvas and all sound is synthesized with WebAudio — the game loads nothing from the network.

## Structure

- `game/src/main.js` — entrypoint, game loop, screens, win/lose
- `game/src/levels.js` — the three rooms (walls, patrols, cameras, loot)
- `game/src/guards.js` — patrols, vision cones, suspicion, chase
- `game/src/cameras.js` — sweeping cameras and EMP blinding
- `game/src/loot.js` — loot pickup and the three tools
- `game/src/player.js` — thief movement and collision
- `game/src/render.js` — canvas drawing, HUD, alarm meter, screens
- `game/src/state.js` — run state, alarm, score, tools
- `game/src/audio.js` — procedural WebAudio sounds
- `game/src/input.js` — keyboard and mouse input
- `main.ts` — the make.fun hand-in program (writes `/output/dossier.json`)

MIT licensed. Built fresh for this bounty — original names, art, and sounds.

Entry: `best-heist-game-20261122-0559` · author: Morenoo-del.
