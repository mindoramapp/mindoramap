// Records the Mindora demo scenes from a headless Chrome, driven over the DevTools protocol (no
// extra packages: Node 22 has WebSocket built in). Frames come from Page.startScreencast and are
// turned into one clip per scene with ffmpeg, timed by the frames' own timestamps.
//
// Usage:  node divulgacao/ferramentas/gravar.mjs <9x16|4x5|16x9|celular> [cena ...]
// The Chrome profile in ~/.cache/mindora-gravacao must already be signed in to the demo account
// (see 00_PLANO_DE_ACAO.md); this script never types a password.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const APP = process.env.MINDORA_URL ?? "https://mindoramapp.github.io/";
const PROFILE = join(homedir(), ".cache", "mindora-gravacao");
const PORT = 9333;

// Viewport in CSS pixels × scale = output pixels. 9:16 stays at 768 px wide so the editor keeps
// its desktop toolbar (narrower switches to the phone layout, which has its own scene).
const FORMATS = {
  "9x16": { width: 768, height: 1365, scale: 1080 / 768, mobile: false },
  "4x5": { width: 864, height: 1080, scale: 1.25, mobile: false },
  "16x9": { width: 1280, height: 720, scale: 1.5, mobile: false },
  celular: { width: 390, height: 844, scale: 3, mobile: true },
};

const [formatName = "9x16", ...onlyScenes] = process.argv.slice(2);
const format = FORMATS[formatName];
if (!format) throw new Error(`Formato desconhecido: ${formatName}`);
const OUT = join(ROOT, "brutos", formatName);

const order = format.mobile
  ? ["c8_celular"]
  : ["c1_resumo", "c2c3_criar", "c4_organizar", "c5_conectar", "c6_aparencia", "c7_revisar", "c9_final"];
const wanted = onlyScenes.length ? order.filter((name) => onlyScenes.includes(name)) : order;
// The two HTML scenes need no account: they use a throwaway profile, so they can be recorded
// even while the signed-in profile is open in a visible Chrome.
const needsLogin = wanted.some((name) => name !== "c1_resumo" && name !== "c9_final");
const profile = needsLogin ? PROFILE : join(ROOT, "brutos", "perfil-sem-login");
// SingletonLock is a symlink to "host-pid"; a lock left by a Chrome that is gone doesn't count.
const profileInUse = () => {
  try {
    const pid = Number(readlinkSync(join(PROFILE, "SingletonLock")).split("-").pop());
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
if (needsLogin && profileInUse()) {
  throw new Error(
    "O perfil de gravação está aberto em outro Chrome. Feche a janela do Chrome de gravação e rode de novo.",
  );
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// ---------- Chrome + CDP ----------

const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--allow-file-access-from-files",
    // The screencast ignores an emulated scale factor; a real one gives full-resolution frames.
    `--force-device-scale-factor=${format.scale}`,
    `--window-size=${format.width},${format.height}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function pageSocketUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = targets.find((target) => target.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await sleep(200);
  }
  throw new Error("O Chrome não abriu a porta de depuração.");
}

const ws = new WebSocket(await pageSocketUrl());
await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
let nextId = 0;
const pending = new Map();
const listeners = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { ok, fail } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) fail(new Error(message.error.message));
    else ok(message.result);
  } else if (message.method) {
    listeners.get(message.method)?.forEach((listener) => listener(message.params));
  }
});
const send = (method, params = {}) =>
  new Promise((ok, fail) => {
    const id = ++nextId;
    pending.set(id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params }));
  });
const on = (method, listener) => listeners.set(method, [...(listeners.get(method) ?? []), listener]);

const evaluate = async (expression) => {
  const { result, exceptionDetails } = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? "erro no JS");
  return result.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("DOM.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: format.width,
  height: format.height,
  deviceScaleFactor: 0,
  mobile: format.mobile,
});
if (format.mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });

// Runs before any page script: a visible cursor (headless draws none), and the app preferences
// for a clean take (dark theme, no tour/tips/install popups, no floating panels).
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
    try {
      if (location.protocol.startsWith("http")) {
        localStorage.setItem("mm_theme", "dark");
        localStorage.setItem("mindora-perf", "full");
        localStorage.setItem("mindora-install-dismissed-at", String(Date.now()));
        localStorage.setItem("mindora-editor-panels-v1", JSON.stringify({
          inspector: { show: false, minimized: true, position: { x: 12, y: 12 } },
          help: { show: false, minimized: true, position: { x: 12, y: 12 } },
          minimap: { show: false, minimized: true, position: { x: 12, y: 12 } },
        }));
        for (const key of Object.keys(localStorage)) {
          if (!/^sb-.*-auth-token$/.test(key)) continue;
          const id = JSON.parse(localStorage.getItem(key))?.user?.id;
          if (!id) continue;
          localStorage.setItem("mm_onboard_v2_" + id, "done");
          localStorage.setItem("mm_tips_v2_" + id,
            JSON.stringify(["first-child", "connect-ideas", "organize", "context-menu"]));
        }
      }
    } catch {}
    const draw = () => {
      if (document.getElementById("__cursor")) return;
      const style = document.createElement("style");
      style.textContent = "#__cursor{position:fixed;left:-50px;top:-50px;width:26px;height:26px;" +
        "margin:-13px 0 0 -13px;border-radius:50%;background:rgba(49,119,220,.30);" +
        "border:2.5px solid #3177DC;pointer-events:none;z-index:2147483647;" +
        "box-shadow:0 0 0 2px rgba(255,255,255,.7)}" +
        ".__ripple{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;" +
        "border:3px solid #00B1C4;pointer-events:none;z-index:2147483646;" +
        "animation:__r .45s ease-out forwards}@keyframes __r{to{transform:scale(2.6);opacity:0}}";
      document.documentElement.append(style);
      const cursor = document.createElement("div");
      cursor.id = "__cursor";
      document.documentElement.append(cursor);
      addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      }, true);
      addEventListener("mousedown", (e) => {
        const ring = document.createElement("div");
        ring.className = "__ripple";
        ring.style.left = e.clientX + "px";
        ring.style.top = e.clientY + "px";
        document.documentElement.append(ring);
        setTimeout(() => ring.remove(), 500);
      }, true);
    };
    if (document.readyState === "loading") addEventListener("DOMContentLoaded", draw);
    else draw();
  })();`,
});

async function go(url, settle = 2500) {
  await send("Page.navigate", { url });
  await sleep(settle);
}

// ---------- Input ----------

let mouse = { x: format.width / 2, y: format.height / 2 };

async function moveTo(x, y, ms = 380) {
  const steps = Math.max(6, Math.round(ms / 16));
  const from = { ...mouse };
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    mouse = { x: from.x + (x - from.x) * ease, y: from.y + (y - from.y) * ease };
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...mouse });
    await sleep(ms / steps);
  }
}

async function click(x, y, { double = false } = {}) {
  await moveTo(x, y);
  for (let count = 1; count <= (double ? 2 : 1); count++) {
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: count });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: count });
  }
  await sleep(250);
}

/** Drags with the left button from (x, y) by (dx, dy): pans the canvas when started on empty space. */
async function drag(x, y, dx, dy) {
  await moveTo(x, y, 200);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 20; i++) {
    mouse = { x: x + (dx * i) / 20, y: y + (dy * i) / 20 };
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...mouse, button: "left", buttons: 1 });
    await sleep(20);
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...mouse, button: "left", buttons: 0, clickCount: 1 });
  await sleep(300);
}

const KEYS = {
  Tab: { code: "Tab", windowsVirtualKeyCode: 9 },
  Enter: { code: "Enter", windowsVirtualKeyCode: 13, text: "\r" },
  Escape: { code: "Escape", windowsVirtualKeyCode: 27 },
  " ": { code: "Space", windowsVirtualKeyCode: 32, text: " " },
  1: { code: "Digit1", windowsVirtualKeyCode: 49, text: "1" },
  2: { code: "Digit2", windowsVirtualKeyCode: 50, text: "2" },
  3: { code: "Digit3", windowsVirtualKeyCode: 51, text: "3" },
};

async function press(key, wait = 350) {
  const info = KEYS[key];
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, ...info });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: info.code, windowsVirtualKeyCode: info.windowsVirtualKeyCode });
  await sleep(wait);
}

async function type(text, perChar = 55) {
  for (const char of text) {
    await send("Input.insertText", { text: char });
    await sleep(perChar);
  }
}

/** Center of the first element matching a CSS selector, optionally containing some text. */
async function find(selector, text = null, { timeout = 8000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const box = await evaluate(`(() => {
      const wanted = ${JSON.stringify(text)};
      const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (!wanted || node.textContent.trim().includes(wanted));
      });
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (box) return box;
    await sleep(200);
  }
  throw new Error(`Não encontrei ${selector}${text ? ` com "${text}"` : ""}`);
}

const clickOn = async (selector, text = null) => {
  const { x, y } = await find(selector, text);
  await click(x, y);
};

// ---------- Recording ----------

async function record(name, act, tail = 600) {
  const dir = join(OUT, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const onFrame = async ({ data, metadata, sessionId }) => {
    const file = join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, t: metadata.timestamp });
    await send("Page.screencastFrameAck", { sessionId });
  };
  listeners.set("Page.screencastFrame", [onFrame]);
  await send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: Math.round(format.width * format.scale),
    maxHeight: Math.round(format.height * format.scale),
  });
  const started = Date.now() / 1000;
  await act();
  await sleep(tail);
  const ended = Date.now() / 1000;
  await send("Page.stopScreencast");
  listeners.delete("Page.screencastFrame");
  if (!frames.length) throw new Error(`Nenhum quadro em ${name}`);

  // ffmpeg concat list: each frame lasts until the next one (the screen didn't change meanwhile).
  const lines = ["ffconcat version 1.0"];
  frames.forEach((frame, index) => {
    const next = frames[index + 1]?.t ?? ended;
    const start = index === 0 ? Math.min(frame.t, started) : frame.t;
    lines.push(`file '${frame.file}'`, `duration ${Math.max(next - start, 0.001).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1).file}'`);
  writeFileSync(join(dir, "lista.txt"), lines.join("\n"));
  const clip = join(OUT, `${name}.mp4`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(dir, "lista.txt"),
    "-vf", "fps=30,format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", clip,
  ]);
  console.log(`${name}: ${frames.length} quadros, ${(ended - started).toFixed(1)} s → ${clip}`);
}

// ---------- App helpers ----------

const node = (label) => find(".react-flow__node", label);

async function openMapByTitle(title) {
  await go(`${APP}#/dashboard`, 3500);
  await clickOn("h3", title);
  await sleep(3000);
}

/** Clicks empty canvas: no selection, so no branch is dimmed by the focus effect. */
const deselect = () => click(40, format.height * 0.3);
const centerMap = async () => {
  await evaluate(`window.dispatchEvent(new Event("mm-center"))`);
  await sleep(500);
};

/** Deletes every demo-account map with exactly this title, through the card's ⋯ menu. */
async function deleteMaps(title) {
  for (let round = 0; round < 6; round++) {
    await go(`${APP}#/dashboard`, 3500);
    const menu = await evaluate(`(() => {
      const card = [...document.querySelectorAll("h3")].find((h) => h.textContent.trim() === ${JSON.stringify(title)})
        ?.closest("[draggable]");
      const button = card?.querySelector('button[aria-label="Ações do mapa"]');
      if (!button) return null;
      const r = button.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (!menu) return;
    await click(menu.x, menu.y);
    await clickOn('[role="menuitem"]', "Excluir");
    await sleep(400);
    await clickOn('[role="dialog"] button', "Excluir");
    await sleep(1500);
  }
}

/** Demo maps start fresh on every run: the full map is imported scattered, so "Organizar" shows. */
async function prepareMaps() {
  await deleteMaps("Fotossíntese (Enem)");
  await deleteMaps("Fotossíntese");
  await go(`${APP}#/dashboard`, 3500);
  const { root } = await send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
  await send("DOM.setFileInputFiles", { nodeId, files: [join(HERE, "mapa-fotossintese.json")] });
  await sleep(4000);
  console.log("Mapa completo importado.");
}

async function newBlankMap(title) {
  await go(`${APP}#/dashboard`, 3500);
  await clickOn("button", "Novo mapa");
  await sleep(500);
  await clickOn('input[aria-label="Nome do mapa"]');
  await type(title, 30);
  await clickOn('[role="radio"]', "Em branco");
  await clickOn("button", "Criar mapa");
  await sleep(3500);
}

// ---------- Scenes (see 02_ROTEIRO.md) ----------

const cta = formatName === "16x9" ? "url" : "bio";
const SCENES = {
  async c1_resumo() {
    await go(`file://${join(HERE, "cenas", "resumo.html")}`, 300);
    await record("c1_resumo", () => sleep(3200), 0);
  },
  async c2c3_criar() {
    await newBlankMap("Fotossíntese");
    // Fixed framing at normal zoom: the central idea on the left third, so the branches grow
    // right and down inside the screen. (Re-fitting after each idea zoomed and pushed it off.)
    const start = await node("Fotossíntese");
    await drag(start.x + 260, start.y + 260, format.width * 0.2 - start.x, format.height * 0.33 - start.y);
    await deselect();
    const idea = async (key, text) => {
      await press(key, 550);
      await type(text);
      await press("Enter", 450);
    };
    await record("c2c3_criar", async () => {
      await sleep(600);
      const root = await node("Fotossíntese");
      await click(root.x, root.y);
      await idea("Tab", "O que é");
      await idea("Enter", "Onde acontece");
      await idea("Enter", "Fases");
      await idea("Tab", "Fase clara");
      await idea("Enter", "Ciclo de Calvin");
      await sleep(400);
    });
  },
  async c4_organizar() {
    await openMapByTitle("Fotossíntese (Enem)");
    await clickOn('button[aria-label="Grafo"]');
    await sleep(800);
    await deselect();
    await record("c4_organizar", async () => {
      await sleep(500);
      await clickOn('button[aria-label="Organizar"]');
      await sleep(1100);
      await centerMap();
      await deselect();
      await sleep(600);
    });
  },
  async c5_conectar() {
    await record("c5_conectar", async () => {
      await clickOn('button[aria-label="Conectar"]');
      await sleep(400);
      await clickOn(".react-flow__node", "Clorofila");
      await sleep(300);
      await clickOn(".react-flow__node", "Fase clara");
      await sleep(900);
      await press("Escape", 300);
    });
  },
  async c6_aparencia() {
    await record("c6_aparencia", async () => {
      await clickOn('button[aria-label="Aparência"]');
      await sleep(500);
      for (const preset of ["Pastel", "Neon", "Padrão"]) {
        await clickOn("button[aria-pressed]", preset);
        await sleep(700);
      }
      await clickOn('button[aria-label="Fechar aparência"]');
    });
  },
  async c7_revisar() {
    await record("c7_revisar", async () => {
      await clickOn("button", "Revisar");
      await sleep(1800);
      await press("Enter", 900);
      await press(" ", 1000);
      await press("3", 900);
      await press(" ", 900);
      await press("2", 900);
    });
  },
  async c8_celular() {
    await openMapByTitle("Fotossíntese (Enem)");
    await clickOn('button[aria-label="Organizar"]');
    await sleep(1200);
    await centerMap();
    await record("c8_celular", async () => {
      const root = await node("Fotossíntese");
      await click(root.x, root.y);
      await sleep(500);
      await clickOn("button", "Filho");
      await sleep(500);
      await type("Importância");
      await press("Enter", 900);
    });
  },
  async c9_final() {
    await go(`file://${join(HERE, "cenas", "final.html")}?cta=${cta}`, 50);
    await record("c9_final", () => sleep(4800), 0);
  },
};

try {
  mkdirSync(OUT, { recursive: true });
  // The phone scene reuses the map the desktop runs left organized.
  if (needsLogin && !format.mobile) await prepareMaps();
  for (const name of wanted) await SCENES[name]();
} finally {
  ws.close();
  chrome.kill();
}
