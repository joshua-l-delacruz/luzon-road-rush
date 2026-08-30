# Luzon Road Rush

An original infinite, Philippine-inspired browser road racer built with Phaser 3, TypeScript, and Vite.

**[Play Luzon Road Rush](https://joshua-l-delacruz.github.io/luzon-road-rush/)**

## Gameplay

- Choose four-lane Metro Manila Night, three-lane Baguio Mountain Road, or three-lane Palawan Coastal Highway.
- Steer with arrow keys, A/D, or the touch controls.
- Dodge traffic, manholes, and potholes on an infinitely scrolling road.
- The endless run uses gradual distance-based speed progression.
- Traffic has varied cruising speeds, some cars weave gently left and right, and cars slow briefly after crossing a manhole. Spawn rates remain constant.
- Scores and the top five runs are stored locally for each map.
- The pause menu provides explicit Resume and Exit to map selection actions.

Manholes cause a short slowdown. Potholes cause a longer slowdown and larger score penalty. Traffic collisions end the run.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## Original-work statement

This project is an original spiritual successor to classic top-down road games. It does not use third-party game names, characters, sprites, music, tracks, or branding. Visuals are generated procedurally in the game code.

## License

MIT
