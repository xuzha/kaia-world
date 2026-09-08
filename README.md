# Kaia’s little world

A storybook playroom built with Three.js. Two-year-old Kaia chooses toys, walks over to play, then wanders off to her next little discovery. Mom and Dad drop by from time to time.

Play online: [Kaia’s little world](https://xuzha.github.io/kaia-world/).

## Run locally

Requires Node.js 22.12+ (or 20.19+).

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Vite updates styles and reloads code changes automatically. The server listens on localhost by default. To try it on a phone on the same network, run `npm run dev -- --host 0.0.0.0` and open your computer’s local network IP on port 5173.

```sh
npm run build       # Type-check and build the production app in dist/
npm run preview     # Preview the production build, on port 4173 by default
npm test            # Test navigation, drawing data, and outlines
npm run test:e2e     # Test browser interactions, animations, and mobile layouts
```

Browser tests use your installed Chrome by default. To use Playwright Chromium instead, run `npx playwright install chromium`, followed by `PLAYWRIGHT_CHANNEL=chromium npm run test:e2e`.

## GitHub Pages

In the repository’s **Settings → Pages → Build and deployment**, select **GitHub Actions**, then push to `main`.

The workflow installs locked dependencies from public npm, checks formatting, runs unit and Chromium browser tests, and builds `dist/`. Pull requests run the same checks. Pushes to `main` and manual workflow runs update the website. Find the deployed URL under **Actions → Validate and deploy Kaia → deploy**.

Browser tests run in eight parallel groups. Deployment waits for the build and every test group to pass. Cloud runners use a lower canvas pixel density for software rendering while testing layout and interactions at the normal CSS viewport size. Failure screenshots and call traces are available as Actions artifacts.

Relative asset paths support GitHub Pages project subdirectories. You can also upload `dist/` to another static website host.

## Inside this little world

- Drag to rotate; scroll or pinch to zoom. The buttons on the right zoom in and out, change the angle, and restore the full view. Rotation stays on the open side of the room so walls do not hide the characters.
- Tap a 3D toy or its illustration in the dock to invite Kaia to play. Double-click a 3D toy to look closer. She finishes activities such as climbing or riding before moving to the next toy.
- Kaia occasionally runs on her way to a toy, bending her knees and swinging her arms. She speeds up only on open paths and returns to walking near turns or toys.
- Turn off the switch on Kaia’s status card to let her finish her current activity and wait for your next invitation.
- Tap **Mom** or **Dad** to invite a parent. They also visit on their own, wave, spend time with Kaia, and leave.
- Pause time, switch to warm evening lights, turn on gentle music box sounds, or save a photo. Sound starts off.
- **Imagine:** Choose an Ocean, Space, Zoo, Polar, or Treehouse story. When Kaia opens the book, the room and its surroundings change together. Ocean brings a ship with a deck, sails, islands, and seagulls. Space surrounds a station with Earth, Saturn, and satellites. Zoo has one cat, one dog, four hopping bunnies, two perched parrots, and a large crocodile pond opposite the duck pond. Polar has an igloo, penguins, seals, ice floes, and moving northern lights. The nighttime treehouse has a wooden platform, rope bridge, stream, fireflies, and squirrels holding pinecones. The forest always stays at night; the top-right button brightens or dims it. All eight toys and shared activities remain available. At sea, the castle becomes a lighthouse and the rocking horse becomes a small sailboat. Choose another story or close the book to return to the playroom.
- **Draw a toy:** Draw with a mouse or finger, or start with a bunny or star. Choose colors and brush size, undo strokes, and name your creation. Its colors and outline become a 3D plush with depth and stitching. Kaia picks it up, rocks it gently, and puts it back. Only the most recently created plush is saved on the current device; it remains available after a reload. Drawing and plush creation happen entirely in your browser.
- **Play together:** Roll a ball to Kaia and wait for her to roll it back; hide Teddy in one of three places and watch her search; or blow bubbles with a button or your microphone, then tap them to pop. Free exploration returns to its previous setting when you finish. Kaia comes down safely from elevated toys before joining a new activity.
- The microphone asks for permission only when you tap **Use microphone**. It measures volume without recording or uploading audio. Pausing, ending the activity, opening a menu, or leaving the page turns it off. Microphone access requires HTTPS or localhost. The bubble button works even when microphone access is unavailable or denied.
- With the playroom focused, use `Space` to pause, `+` / `-` to zoom, arrow keys to rotate, `Home` to restore the full view, and `1`–`8` to choose a toy. The app starts paused when the system’s reduced motion preference is enabled.

The play mat measures **8.6 × 7 meters (about 60 m²)**, with an open center. The room, characters, and toys use procedural geometry; wood grain, fabric, and book cover textures are generated locally. The space theme bundles Milky Way and Earth images; see the [asset credits and licenses](public/assets/space/README.md). No external model, texture, font, or audio service is needed at runtime.

## Toys and activities

| Toy           | What Kaia does                                                           |
| ------------- | ------------------------------------------------------------------------ |
| Little Castle | Climbs the ladder, crosses the platform, sits, slides, and stands up     |
| Color Blocks  | Squats, picks up a block, and adds it to the stack                       |
| Story Corner  | Sits down to read a picture book, turns pages, and looks at the pictures |
| Bouncy Ball   | Kicks, chases, and watches the ball bounce                               |
| Rocking Horse | Climbs on, rocks back and forth, and gets off                            |
| Little Band   | Squats and plays the xylophone with alternating hands                    |
| Teddy Tea     | Picks up the teapot and pours tea for Teddy                              |
| Rainbow Arch  | Kneels, crawls under the arch on hands and knees, then stands and waves  |

## Extending the world

```text
src/
  play/               Five story worlds, drawings and plush toys, shared play, microphone lifecycle
  toys/               Toy models, animated parts, collision bounds, and registry
  characters/
    rig.ts            Joints, ankles, and grounded poses for Kaia and her parents
    appearance.ts     Cheeks, bangs, eyes, and hair accessories
    actions.ts        Toy activities: poses, movement, and prop animation
    director.ts       Choose a toy → find a path → play → explore again
    family.ts         Parent visits, shared play, and departures
  world/
    room.ts           Room, shelves, play mat, and decorations
    palette.ts        Colors and procedural wood and fabric textures
    primitives.ts     Rounded geometry, plants, books, and other modeling helpers
    navigation.ts     A* navigation and path smoothing with clearance for the body
    stage.ts          Camera, lighting, zoom, rotation, and responsive sizing
    atmosphere.ts     Sunlit dust and little hearts
    audio.ts          Synthesized music box sounds
  ui/                 Interface and hand-drawn toy SVG illustrations
```

To add a toy:

1. Create a model factory in `toys/` that returns a `ToyModel`: `root`, named `parts`, local-coordinate `obstacles`, and optional `update` / `reset` methods.
2. Add the toy ID to `toys/types.ts` and register its name, position, approach point, duration, and activity in `toys/registry.ts`. Leave enough clearance at the approach point for the character’s navigation radius.
3. Reuse an existing `action`, or add one in `characters/actions.ts` for a different activity. Actions must end on walkable ground; elevated activities control their own paths.
4. Add the toy’s illustration to `ui/icons.ts`. The interface and autonomous selector use the same toy registry.

Models use meters, with Y up and local +Z facing forward. `Pose` describes joint rotations and center-of-mass shifts, smoothly blended by the character. Breathing, blinking, and subtle hair movement are layered independently. Code is formatted with Prettier.

In development, open `/?inspect=1` to use `window.__KAIA__` to step through the same simulation and inspect specific animation moments. This inspector is removed from production builds.
