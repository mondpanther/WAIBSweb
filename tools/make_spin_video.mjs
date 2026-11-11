// Make a looping spin video (MP4 + small GIF) of the GAIISia 3D view.
//
// Drives the atlas in a Chrome window frame by frame (one full turn), screenshots each frame,
// then joins them with ffmpeg. Run it while GAIISia is served locally (python3 -m http.server 8000
// in WAIBSweb/GAIISia, with the local_data link), or point URL at https://waibs.org/GAIISia/.
//
// One-off setup (in WAIBSweb/tools):   npm install playwright      (and: brew install ffmpeg)
// Run:                                  node make_spin_video.mjs
//
// Options as environment variables, e.g.  COL=theme LABELS=none node make_spin_video.mjs
//   URL      atlas address                  default http://localhost:8000/?data=local_data/
//   COL      colour mode                    labor | theme | type | region | green | score   (default labor)
//   ALPHA    point opacity in %             default 4
//   LABELS   broad | none                   default broad
//   SIZE     output width = height in px    default 1080
//   SECONDS  length of one full turn        default 8   (30 fps)
//   TILT     camera tilt in degrees         default 20
//   ZOOM     zoom relative to the default   default 0.15 (positive = closer)
//   TAG      corner text ("" for none)      default "GAIISia · waibs.org/GAIISia"
//   OUT      output base name               default gaiisia_spin

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const E = process.env;
const URL0 = E.URL || "http://localhost:8000/?data=local_data/";
const COL = E.COL || "labor", ALPHA = +(E.ALPHA || 4), LABELS = E.LABELS || "broad";
const SIZE = +(E.SIZE || 1080), FPS = 30, SECONDS = +(E.SECONDS || 8), TILT = +(E.TILT || 20), ZOOM = +(E.ZOOM || 0.15);
const TAG = E.TAG ?? "GAIISia · waibs.org/GAIISia", OUT = E.OUT || "gaiisia_spin";
const NFRAMES = Math.round(FPS * SECONDS), FRAMES = path.resolve("frames");

const log = m => console.log(`[${new Date().toLocaleTimeString()}] ${m}`);
fs.rmSync(FRAMES, { recursive: true, force: true }); fs.mkdirSync(FRAMES);

// a visible Chrome window, so the Mac's GPU draws the points (headless browsers fall back to software)
const headless = E.HEADLESS === "1";
const gl = headless ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [];
let browser;
try { browser = await chromium.launch({ channel: "chrome", headless, args: gl }); }
catch { browser = await chromium.launch({ headless, args: gl }); }
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 2 });
page.on("pageerror", e => log("page error: " + e.message));

const url = URL0.split("#")[0] + `#d=3&r=0&col=${COL}&a=${ALPHA}&show=prod.proc`;
log("opening " + url);
await page.goto(url);
log("loading all points and the 3D layout (can take a minute) ...");
await page.waitForFunction(() => window.GAIISia && window.GAIISia.dim === 3 && window.GAIISia.ready,
  null, { timeout: 15 * 60 * 1000, polling: 1000 });

// hide the interface, add the corner tag, fix the camera
await page.addStyleTag({ content: `#side,#toggleSide,#help,#tip,#ttip,#detail,#err,#search{display:none!important}
  #spinTag{position:fixed;right:22px;bottom:18px;font:600 20px Inter,system-ui,sans-serif;color:#e1eef2;
  opacity:.85;letter-spacing:.02em;text-shadow:0 0 6px #00121c;pointer-events:none;z-index:99}` });
await page.evaluate(([tag, labels]) => {
  if (tag) { const d = document.createElement("div"); d.id = "spinTag"; d.textContent = tag; document.body.appendChild(d); }
  if (labels === "none") window.GAIISia.labels = false;
}, [TAG, LABELS]);
await page.mouse.move(SIZE - 1, 0);
await page.waitForTimeout(1500);

const step = 360 / NFRAMES;
log(`rendering ${NFRAMES} frames ...`);
for (let i = 0; i < NFRAMES; i++) {
  await page.evaluate(([orbit, tilt, dzoom]) => window.GAIISia.camera({ orbit, tilt, dzoom }), [-30 + i * step, TILT, ZOOM]);
  await page.screenshot({ path: path.join(FRAMES, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 95 });
  if (i % 30 === 0) log(`  frame ${i}/${NFRAMES}`);
}
await browser.close();

log("encoding MP4 and GIF with ffmpeg ...");
const ff = args => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
ff(["-framerate", String(FPS), "-i", path.join(FRAMES, "f%04d.jpg"),
    "-vf", `scale=${SIZE}:${SIZE}:flags=lanczos,format=yuv420p`,
    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", `${OUT}.mp4`]);
ff(["-i", `${OUT}.mp4`, "-vf",
    "fps=15,scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=200[p];[b][p]paletteuse=dither=sierra2_4a",
    "-loop", "0", `${OUT}.gif`]);
const mb = f => (fs.statSync(f).size / 1e6).toFixed(1) + " MB";
log(`done: ${path.resolve(OUT + ".mp4")} (${mb(OUT + ".mp4")}), ${OUT}.gif (${mb(OUT + ".gif")})`);
log("the frames/ folder can be deleted");
