# 3D Labyrinth Game

A first-person 3D labyrinth game built with **plain HTML, CSS and JavaScript** — no game engine,
no WebGL, no libraries, no build step. The whole 3D world is rendered with CSS 3D transforms on
ordinary `<div>` elements.

Pick a difficulty, learn your way through a fixed labyrinth, collect every key to unlock the exit,
and reach the win coin before the traps take your last life.

---

## Run it

Double-click `index.html`, or open it in any modern browser.

Chrome can block local audio files when a page is opened directly from disk. If you want the
sound effects, serve the folder over a local web server instead:

```bash
# from the project folder
python -m http.server 8000
# then open http://localhost:8000
```

No installation or dependencies required either way.

---

## Controls

| Input | Action |
|---|---|
| Arrow keys | Move (forward / back / strafe left / right) |
| Mouse | Look around |
| Click | Lock the mouse into the game |
| `Escape` | Release the mouse |
| `Space` | Move up |
| `B` | Move down |
| `P` | Speed boost (3×) |
| `R` | Back to the spawn corner |
| `M` | Open the main menu |

Mouse look requires a pointer lock, so **click once inside the game** after starting.

---

## Difficulty levels

Each level has its own **fixed labyrinth**. The layout is identical every time you play it, so a
level can be learned by heart — only the items and traps move.

| Level | Labyrinth | Corridors | Dead ends | Lives | Keys | Traps | Extra lives |
|---|---|---|---|---|---|---|---|
| Easy | 6 × 6 cells | wide (333px) | 1 | 5 | 3 | 2 | at 10 pts, then every 5 |
| Medium | 8 × 8 cells | 250px | 4 | 3 | 3 | 4 | at 15 pts, then every 6 |
| Difficult | 10 × 10 cells | tight (200px) | 13 | 2 | 4 | 7 | at 20 pts, then every 8 |

Easy and medium contain loops, so a wrong turn is cheap. Difficult is a *perfect* maze — exactly
one route between any two cells — which means every mistake has to be walked back.

The menu and the difficulty table in "How To Play" are both generated from the `DIFFICULTIES`
object in [script.js](script.js), so the numbers on screen are always the numbers the game plays
with.

---

## Rules

**Goal** — collect **every key**, then reach the win coin (*Little Pony*) in the corner opposite
the spawn. Touching the exit without all keys leaves it locked; the coin stays where it is, so you
can come back once you have found them.

**Items** — placed at random on walkable cells every round:

| Item | Points | Note |
|---|---|---|
| Key | 1 | Needed to unlock the exit |
| Double key | 2 | Bonus points only, not one of the keys |
| Coin | 3 | Bonus points only |

**Lives** — points earn extra lives at the thresholds in the table above. Each trap costs one
life, and the trap disappears after it triggers. At 0 lives the game is over.

A trap only bites where its red square actually lies, so there is always clear floor to squeeze
past it — 52px on either side in easy, down to 15px in difficult.

---

## Project structure

```
.
├── index.html   Game viewport, menus, HUD
├── style.css    Visual design plus the 3D setup (perspective, preserve-3d, wall faces)
├── script.js    Engine: labyrinth data, rendering, movement, collision, items, scoring
├── menu.js      Menu navigation, difficulty picker, start / restart flow
├── pattern/     Item textures (coin, key, double key, win coin)
├── sound/       Sound effects for each pickup and for traps
└── gifs/        Unused texture experiments from earlier iterations
```

---

## How it works

### Objects are arrays of numbers

Every surface in the world — walls, floor, ceiling, items, traps — is described by the same
10-element array:

```js
[x, y, z,  rotX, rotY, rotZ,  width, height,  colorOrImage, opacity]
```

`createSquare()` turns each array into a `<div>` and positions it with a single CSS transform:

```js
translate3d(x, y, z) rotateX(...) rotateY(...) rotateZ(...)
```

If the 9th value starts with `#` it becomes a background colour, otherwise it is loaded as a
background image. That one convention covers walls, floors and textured items alike.

### There is no camera

Instead of moving a camera through the world, the game applies the **inverse** of the player's
position and rotation to the single `#world` container:

```js
world.style.transform = "translateZ(600px)" +
    "rotateX(" + (-pawn.rx) + "deg)" +
    "rotateY(" + (-pawn.ry) + "deg)" +
    "translate3d(" + (-pawn.x) + "px," + (-pawn.y) + "px," + (-pawn.z) + "px)";
```

Walk right and the entire world slides left. The `translateZ(600px)` matches the container's
`perspective: 600px`, which puts the vanishing point at the player's eye. That is the complete
3D engine.

### The labyrinth is a character grid

Each level stores its maze as strings in the classic `(2N+1) × (2N+1)` text layout:

```
even row / even column  ->  corner post
even row / odd  column  ->  horizontal wall slot
odd  row / even column  ->  vertical wall slot
odd  row / odd  column  ->  walkable cell
```

A `#` means solid, a space means open, so the data reads as a picture of the finished maze:

```
#################
#   #           #
# # # # ####### #
# # # # #       #
...
```

`buildMazeWalls()` walks the grid and emits one wall plane per solid slot, sized to the cell and
stretched by the wall thickness so the corners close. `buildItemSlots()` collects the open cells,
which is where items may spawn — an item can therefore never end up inside a wall. Wall colours
come from `wallColorFor(row, column)` rather than `Math.random()`, so a wall keeps its colour
every time the level is rebuilt.

Because the grid size changes per level while the room stays 2000 units wide, the corridors get
narrower as the difficulty rises: `cellSize = 2000 / N`.

### Walls, floor and ceiling

A wall is a flat plane, so `.wall::before` and `.wall::after` add a 28px side face and top face,
each rotated 90° out of the plane. From inside the maze the walls read as solid blocks. The room is
closed off by six planes — four outer walls, a floor, and a ceiling — and a `#vignette` overlay
fades the far corners into the background to fake depth fog.

### Movement follows the view

Arrow-key input is rotated by the player's yaw with `sin`/`cos`, so "forward" always means the
direction you are looking. The X and Z axes are collision-tested **separately**, which is why you
slide along a wall instead of getting stuck on it. Vertical movement is clamped to the room height
so the labyrinth cannot be flown over.

### The game loop

`setInterval(repeat, 10)` drives everything at roughly 100 ticks per second: spin the items, move
the player, then run a distance check against each group of items. Floating items are collected
from anywhere inside a sphere the size of their sprite; traps use ground distance only, so their
red square marks exactly where they hurt. A collected item is hidden and moved far outside the
world (`x = 100000`) so it can never trigger twice.

---

## How the layouts were verified

Hand-drawn mazes are easy to get wrong, and an item sealed behind a wall makes a round
unwinnable. The three layouts were therefore generated with a recursive backtracker, braided to
add loops, and then checked twice:

1. A flood fill over the maze grid confirms every cell is reachable from the spawn.
2. A port of the real `isColliding()` and `movePlayer()` code flood-fills the **player's** possible
   positions on a 5px grid and confirms every cell centre and the exit are genuinely walkable with
   the collision box the game actually uses — and that a trap never fills a corridor end to end.

Both checks pass for all three levels (36, 64 and 100 cells).

---

## Known limitations

- **The game loop uses `setInterval`, not `requestAnimationFrame`,** so motion is not synced to
  the display refresh rate.
- **Mouse look needs the Pointer Lock API,** which is unavailable on touch devices. The layout is
  responsive and the HUD collapses on small screens, but the game needs a keyboard and a mouse.
- **The exit corner is the same in every level.** That is deliberate — it is what makes a level
  learnable — but it does mean the route out never surprises you twice.

---

## About

Coursework for the BIP 3D game course, Semester 5, written as an exercise in building a 3D
renderer from nothing but the DOM and CSS transforms.
