# Gameplay and controls

## Objective

Travel as far as possible without colliding with another vehicle. Distance and score advance continuously during an active run. Each map keeps its own top-five local leaderboard.

## Maps

| Map | Layout | Visual theme |
| --- | --- | --- |
| Metro Manila Night | Four lanes | Dark city road with neon accents |
| Baguio Mountain Road | Three lanes | Mountain highway with pine-lined verges |
| Palawan Coastal Highway | Three lanes | Coastal road with tropical water colors |

## Controls

- Desktop: Left/Right Arrow or A/D
- Touch: on-screen left and right buttons
- Pause: opens explicit Resume and Exit to map selection actions

## Rules

- The road loops indefinitely.
- Speed begins at 20 and increases by 5 after every complete 100 meters.
- Traffic and hazard spawn intervals remain constant.
- Some faster traffic swerves across lane dividers.
- Manholes and potholes temporarily slow the player and reduce score; potholes have the larger penalty.
- Traffic slows and wobbles after crossing a manhole.
- A traffic collision ends the run.

High-speed swept collision checks cover the entire path between rendered frames, preventing fast objects from skipping through the player.

## Scores

The game stores the five highest runs per map in browser `localStorage`. Scores never leave the device. Clearing site data clears the leaderboard.
