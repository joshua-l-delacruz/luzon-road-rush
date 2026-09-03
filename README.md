# Race with Death

An original Philippine-inspired browser road-survival game built with Phaser 3, TypeScript, and Vite. Pick a route, avoid swerving traffic violators and road hazards, and keep the run alive as speed rises.

**[Play Race with Death](https://roadrush.joshuadelacruz.solutions/)** · **[Portfolio](https://joshuadelacruz.solutions/)**

## Why this project exists

Race with Death is a compact game-engine and frontend engineering project. It demonstrates deterministic gameplay rules, responsive keyboard and touch input, procedural visuals, local persistence, automated tests, secure static deployment, and an accessible interface without copying commercial game assets.

## Gameplay

- Choose four-lane Metro Manila Night, three-lane Baguio Mountain Road, or three-lane Palawan Coastal Highway.
- Steer with arrow keys, A/D, or the touch controls.
- Dodge traffic, manholes, and potholes on an infinitely scrolling road.
- The endless run adds 5 speed units at every complete 100 meters.
- Traffic has varied cruising speeds, and some traffic violators cross lane dividers while swerving. Cars slow briefly after crossing a manhole. Swept collision checks keep high-speed runs honest. Spawn rates remain constant.
- Scores and the top five runs are stored locally for each map.
- The pause menu provides explicit Resume and Exit to map selection actions.

Manholes cause a short slowdown. Potholes cause a longer slowdown and larger score penalty. Traffic collisions end the run.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. No account, API key, database, or external service is required.

## Verify

```bash
npm test
npm run build
```

## Documentation

- [Gameplay and controls](docs/GAMEPLAY.md)
- [Architecture and data flow](docs/ARCHITECTURE.md)
- [Security and privacy](docs/SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Vulnerability reporting](SECURITY.md)

## Technology

- Phaser 3 with Arcade Physics
- TypeScript and Vite
- Vitest rules tests
- GitHub Actions and GitHub Pages
- Procedural vector-style game textures

## Privacy

The game has no accounts, advertising, analytics, cookies, or remote leaderboard. Per-map high scores stay in the player's browser using `localStorage`.

## Original-work statement

This project is an original spiritual successor to classic top-down road games. It does not use third-party game names, characters, sprites, music, tracks, or branding. Visuals are generated procedurally in the game code.

## License

[MIT](LICENSE)
