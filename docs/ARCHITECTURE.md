# Architecture

## Runtime overview

```text
HTML menu and HUD
        │
        ▼
Phaser RoadScene ──► procedural road and vehicle textures
        │
        ├──► distance-only speed rule
        ├──► Arcade Physics overlap checks
        ├──► swept high-speed collision checks
        └──► per-map score ranking ──► browser localStorage
```

## Modules

- `src/main.ts` owns the scene lifecycle, rendering, input, spawning, movement, collisions, pause flow, map switching, and local leaderboard UI.
- `src/rules.ts` contains deterministic rules for speed, lane selection, swept collision detection, and score ranking.
- `tests/rules.test.ts` verifies the logic that should remain independent of rendering.
- `src/style.css` provides the responsive shell, menu, HUD, dialogs, and mobile controls.

## Design decisions

### Procedural visuals

Vehicles, hazards, road markings, and map scenery are drawn at runtime. This keeps the repository lightweight and ensures the project does not depend on copied commercial artwork.

### Fixed spawn cadence

Traffic and hazard frequency does not increase with distance. Only road speed changes, keeping progression understandable and testable.

### Two collision layers

Arcade Physics handles ordinary overlap. A swept collision rule additionally checks whether a fast object crossed the player's vertical position between frames, preventing tunneling at high speed.

### Local-only scores

The leaderboard uses `localStorage`; there is no backend, identity layer, or transmission of player data.

## Deployment

Every push to `main` installs locked dependencies, runs tests, creates a production build, and deploys the artifact through GitHub Pages. The custom hostname is `roadrush.joshuadelacruz.solutions`.
