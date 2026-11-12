const landscapeSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="sky" x2="0" y2="1">
            <stop stop-color="#8bc9d0"/><stop offset="1" stop-color="#e6e9b5"/>
          </linearGradient>
          <linearGradient id="hill" x2="0" y2="1">
            <stop stop-color="#80ad70"/><stop offset="1" stop-color="#3e805b"/>
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#sky)"/>
        <circle cx="430" cy="145" r="67" fill="#ffd47d"/>
        <path d="M0 350 145 185l136 165z" fill="#829e90"/>
        <path d="m190 350 172-215 180 215z" fill="#668878"/>
        <path d="m104 235 41-50 42 51-38-17z" fill="#f3f0d7"/>
        <path d="m315 194 47-59 50 60-47-21z" fill="#f3f0d7"/>
        <path d="M0 378q128-98 264-3t336-7v232H0z" fill="url(#hill)"/>
        <path d="M0 468q148-83 298-4t302-14v150H0z" fill="#538b60"/>
        <path d="M92 365h132v105H92z" fill="#f1c98b"/>
        <path d="m76 370 81-68 83 68z" fill="#c87358"/>
        <path d="M143 408h31v62h-31z" fill="#805d48"/>
        <rect x="104" y="389" width="27" height="27" rx="3" fill="#9bc9c1"/>
        <rect x="187" y="389" width="27" height="27" rx="3" fill="#9bc9c1"/>
        <path d="M450 429v-93" stroke="#75553d" stroke-width="16" stroke-linecap="round"/>
        <circle cx="450" cy="319" r="55" fill="#477c54"/>
        <circle cx="416" cy="341" r="34" fill="#5d925d"/>
        <circle cx="482" cy="344" r="35" fill="#3f714c"/>
        <path d="M0 546q100-42 202 0t201 0 197 1v53H0z" fill="#3d7552" opacity=".8"/>
      </svg>`;
const coastalSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="sea" x2="0" y2="1">
            <stop stop-color="#88cbd0"/><stop offset="1" stop-color="#3989a0"/>
          </linearGradient>
          <linearGradient id="sand" x2="0" y2="1">
            <stop stop-color="#f4d897"/><stop offset="1" stop-color="#d8a96d"/>
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="#b9e2dd"/>
        <circle cx="150" cy="145" r="66" fill="#ffe18b"/>
        <path d="M0 266q150-48 300 0t300 0v334H0z" fill="url(#sea)"/>
        <path d="M0 330q90-24 180 0t180 0 240 0" fill="none" stroke="#d4f0e5" stroke-width="14" opacity=".8"/>
        <path d="M0 455q160-35 300 0t300 0v145H0z" fill="url(#sand)"/>
        <path d="M365 330h119v157H365z" fill="#fff1d2"/>
        <path d="M347 339h154l-22-29H369z" fill="#d46f58"/>
        <path d="M394 256h60v74h-60z" fill="#f3d795"/>
        <path d="m384 259 40-48 41 48z" fill="#c85f4f"/>
        <path d="M408 279h30v36h-30z" fill="#81adb0"/>
        <path d="M409 392h32v95h-32z" fill="#765748"/>
        <path d="M65 469q14-82 31 0m-4-25 29-34m-27 56-34-29" fill="none" stroke="#477c54" stroke-width="10" stroke-linecap="round"/>
        <path d="M70 486q28-20 58 0" fill="none" stroke="#f4e3ba" stroke-width="7"/>
        <path d="M0 543q140-31 280 0t320-1v58H0z" fill="#c89861" opacity=".7"/>
      </svg>`;
const autumnSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="autumn-sky" x2="0" y2="1">
            <stop stop-color="#f3b77f"/><stop offset="1" stop-color="#f3dfaa"/>
          </linearGradient>
          <linearGradient id="autumn-hill" x2="0" y2="1">
            <stop stop-color="#bd754e"/><stop offset="1" stop-color="#744d49"/>
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#autumn-sky)"/>
        <circle cx="455" cy="143" r="58" fill="#ffe9ad"/>
        <path d="M0 375 160 194l157 181z" fill="#b27961"/>
        <path d="m245 374 148-198 207 198z" fill="#8d6156"/>
        <path d="m112 247 48-53 47 54-45-19z" fill="#f8e6bf"/>
        <path d="m343 243 50-67 65 68-62-23z" fill="#f8e6bf"/>
        <path d="M0 390q138-72 283 2t317-1v209H0z" fill="url(#autumn-hill)"/>
        <path d="M82 372h130v112H82z" fill="#f0c982"/>
        <path d="m65 381 82-69 84 69z" fill="#a84f42"/>
        <path d="M135 420h28v64h-28z" fill="#674c45"/>
        <rect x="94" y="397" width="27" height="25" rx="3" fill="#8db1aa"/>
        <rect x="174" y="397" width="27" height="25" rx="3" fill="#8db1aa"/>
        <path d="M442 440v-91" stroke="#634b3d" stroke-width="16" stroke-linecap="round"/>
        <circle cx="442" cy="326" r="58" fill="#d27a47"/>
        <circle cx="405" cy="347" r="37" fill="#db9950"/>
        <circle cx="480" cy="348" r="39" fill="#ad5943"/>
        <path d="M0 526q120-43 240 0t360 1v73H0z" fill="#a85d43"/>
        <path d="M290 482q32-32 64 0m-39-15 2 35m69 5q24-28 48 0" fill="none" stroke="#e8bd72" stroke-width="8" stroke-linecap="round"/>
      </svg>`;
const scenes = [
  { name: "Güneşli bir gün", svg: landscapeSvg },
  { name: "Deniz feneri", svg: coastalSvg },
  { name: "Sonbahar yolu", svg: autumnSvg }
];
const picture = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(landscapeSvg)}")`;
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const completionScreen = document.getElementById("completionScreen");
const resetConfirmation = document.getElementById("resetConfirmation");
const board = document.getElementById("board");
const trayPieces = document.getElementById("trayPieces");
const moveCounter = document.getElementById("moveCounter");
const gameStatus = document.getElementById("gameStatus");
const gameTitle = document.getElementById("gameTitle");
const completionMessage = document.getElementById("completionMessage");
const menuMusicToggle = document.getElementById("menuMusicToggle");
const menuEffectsToggle = document.getElementById("menuEffectsToggle");
const gameMusicToggle = document.getElementById("gameMusicToggle");
const gameEffectsToggle = document.getElementById("gameEffectsToggle");
const savedLevel = Number(localStorage.getItem("minikParcalarLevel"));
let currentLevel = Number.isSafeInteger(savedLevel) && savedLevel > 0 ? savedLevel : 1;
const legacyMenuSoundsEnabled = localStorage.getItem("minikParcalarMenuSounds") !== "false";
const legacyGameSoundsEnabled = localStorage.getItem("minikParcalarGameSounds") !== "false";
let menuMusicEnabled = localStorage.getItem("minikParcalarMenuMusic") === null
  ? legacyMenuSoundsEnabled
  : localStorage.getItem("minikParcalarMenuMusic") !== "false";
let menuEffectsEnabled = localStorage.getItem("minikParcalarMenuEffects") === null
  ? legacyMenuSoundsEnabled
  : localStorage.getItem("minikParcalarMenuEffects") !== "false";
let gameMusicEnabled = localStorage.getItem("minikParcalarGameMusic") === null
  ? legacyGameSoundsEnabled
  : localStorage.getItem("minikParcalarGameMusic") !== "false";
let gameEffectsEnabled = localStorage.getItem("minikParcalarGameEffects") === null
  ? legacyGameSoundsEnabled
  : localStorage.getItem("minikParcalarGameEffects") !== "false";
let audioContext = null;
let activeMusicTrack = null;
let musicInterval = null;
let musicGain = null;
let musicStep = 0;
let nextMusicNoteTime = 0;
let gridSize = 3;
let landscapeDataUri = "";
let correctOrder = [];
let horizontalEdges = [];
let verticalEdges = [];
let pieces = [...correctOrder];
let placedPieces = new Set();
let selectedPiece = null;
let dragGhost = null;
let moves = 0;
let isSolved = false;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    audioContext = new AudioContextConstructor();
  }

  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration, waveform = "sine", delay = 0, volume = 0.055) {
  const context = getAudioContext();
  if (!context) return;

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume * 9.75, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

function playMenuSound(kind = "button") {
  if (!menuEffectsEnabled) return;
  if (kind === "button") {
    playTone(520, 0.09, "sine", 0, 0.035);
    playTone(680, 0.1, "sine", 0.045, 0.03);
  }
}

function playGameSound(kind) {
  if (!gameEffectsEnabled) return;

  if (kind === "button") {
    playTone(390, 0.075, "triangle", 0, 0.035);
  } else if (kind === "pickup") {
    playTone(440, 0.08, "triangle", 0, 0.035);
    playTone(590, 0.1, "sine", 0.035, 0.028);
  } else if (kind === "move") {
    playTone(300, 0.045, "sine", 0, 0.016);
  } else if (kind === "place") {
    playTone(520, 0.11, "sine", 0, 0.045);
    playTone(780, 0.16, "sine", 0.08, 0.045);
  } else if (kind === "wrong") {
    playTone(190, 0.16, "triangle", 0, 0.04);
  } else if (kind === "complete") {
    playTone(523, 0.18, "sine", 0, 0.045);
    playTone(659, 0.18, "sine", 0.12, 0.045);
    playTone(784, 0.28, "sine", 0.24, 0.05);
  }
}

const musicTracks = {
  menu: {
    tempo: 0.38,
    notes: [523.25, null, 659.25, null, 783.99, null, 659.25, null, 587.33, null, 698.46, null, 880, null, 698.46, null],
    bass: [261.63, null, null, null, 196, null, null, null, 220, null, null, null, 174.61, null, null, null]
  },
  game: {
    tempo: 0.29,
    notes: [392, 493.88, 587.33, null, 523.25, 587.33, 659.25, null, 392, 493.88, 587.33, 783.99, 698.46, 587.33, 493.88, null],
    bass: [196, null, 246.94, null, 174.61, null, 220, null, 196, null, 246.94, null, 174.61, null, 146.83, null]
  }
};

function scheduleMusicNote(frequency, startTime, duration, volume, waveform) {
  const context = getAudioContext();
  if (!context || !musicGain) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const noteEnd = startTime + duration;
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
  envelope.gain.setValueAtTime(volume, Math.max(startTime + 0.026, noteEnd - 0.08));
  envelope.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
  oscillator.connect(envelope);
  envelope.connect(musicGain);
  oscillator.start(startTime);
  oscillator.stop(noteEnd + 0.015);
}

function scheduleMusicStep(trackName) {
  const context = getAudioContext();
  const track = musicTracks[trackName];
  if (!context || !track || !musicGain) return;

  while (nextMusicNoteTime < context.currentTime + 0.12) {
    const note = track.notes[musicStep];
    const bassNote = track.bass[musicStep];
    const noteDuration = track.tempo * 0.86;

    if (note) scheduleMusicNote(note, nextMusicNoteTime, noteDuration, 0.2, "sine");
    if (bassNote) scheduleMusicNote(bassNote, nextMusicNoteTime, track.tempo * 1.8, 0.09, "triangle");

    nextMusicNoteTime += track.tempo;
    musicStep = (musicStep + 1) % track.notes.length;
  }
}

function stopMusic() {
  if (musicInterval !== null) {
    window.clearInterval(musicInterval);
    musicInterval = null;
  }

  if (musicGain && audioContext) {
    const oldGain = musicGain;
    musicGain = null;
    oldGain.gain.cancelScheduledValues(audioContext.currentTime);
    oldGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
    window.setTimeout(() => oldGain.disconnect(), 600);
  }

  activeMusicTrack = null;
}

function startMusic(trackName) {
  const enabled = trackName === "menu" ? menuMusicEnabled : gameMusicEnabled;
  if (!enabled) {
    stopMusic();
    return;
  }
  if (activeMusicTrack === trackName && musicGain) return;

  stopMusic();
  const context = getAudioContext();
  if (!context) return;

  activeMusicTrack = trackName;
  musicStep = 0;
  nextMusicNoteTime = context.currentTime + 0.05;
  musicGain = context.createGain();
  musicGain.gain.setValueAtTime(0.0001, context.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.32 * 1.7, context.currentTime + 0.35);
  musicGain.connect(context.destination);
  scheduleMusicStep(trackName);
  musicInterval = window.setInterval(() => scheduleMusicStep(trackName), 40);
}

function syncMusicToScreen() {
  startMusic(menuScreen.classList.contains("hidden") ? "game" : "menu");
}

function updateSoundToggles() {
  menuMusicToggle.textContent = `♫ Menü müziği: ${menuMusicEnabled ? "Açık" : "Kapalı"}`;
  menuMusicToggle.setAttribute("aria-pressed", String(menuMusicEnabled));
  menuEffectsToggle.textContent = `♪ Menü efektleri: ${menuEffectsEnabled ? "Açık" : "Kapalı"}`;
  menuEffectsToggle.setAttribute("aria-pressed", String(menuEffectsEnabled));
  gameMusicToggle.textContent = `♫ Oyun müziği: ${gameMusicEnabled ? "Açık" : "Kapalı"}`;
  gameMusicToggle.setAttribute("aria-pressed", String(gameMusicEnabled));
  gameEffectsToggle.textContent = `♪ Oyun efektleri: ${gameEffectsEnabled ? "Açık" : "Kapalı"}`;
  gameEffectsToggle.setAttribute("aria-pressed", String(gameEffectsEnabled));
  menuMusicToggle.setAttribute("aria-label", `Menü müziğini ${menuMusicEnabled ? "kapat" : "aç"}`);
  menuEffectsToggle.setAttribute("aria-label", `Menü ses efektlerini ${menuEffectsEnabled ? "kapat" : "aç"}`);
  gameMusicToggle.setAttribute("aria-label", `Oyun müziğini ${gameMusicEnabled ? "kapat" : "aç"}`);
  gameEffectsToggle.setAttribute("aria-label", `Oyun ses efektlerini ${gameEffectsEnabled ? "kapat" : "aç"}`);
}

function renderMenuPreview() {
  const preview = document.getElementById("samplePuzzle");
  for (let piece = 0; piece < 9; piece += 1) {
    const tile = document.createElement("div");
    tile.className = "sample-piece";
    tile.style.backgroundImage = picture;
    preview.append(tile);
  }
}

function getPieceEdges(piece) {
  const row = Math.floor(piece / gridSize);
  const column = piece % gridSize;
  return {
    top: row === 0 ? 0 : -verticalEdges[row - 1][column],
    right: column === gridSize - 1 ? 0 : horizontalEdges[row][column],
    bottom: row === gridSize - 1 ? 0 : verticalEdges[row][column],
    left: column === 0 ? 0 : -horizontalEdges[row][column - 1]
  };
}

function edgePath(startX, startY, endX, endY, normalX, normalY, sign) {
  if (sign === 0) return `L${endX},${endY}`;

  const offset = 17 * sign;
  const point = (position, depth) =>
    `${startX + (endX - startX) * position + normalX * offset * depth},${startY + (endY - startY) * position + normalY * offset * depth}`;

  return [
    `L${point(0.34, 0)}`,
    `C${point(0.39, 0)} ${point(0.39, 1)} ${point(0.44, 1)}`,
    `C${point(0.46, 1)} ${point(0.46, 2)} ${point(0.5, 2)}`,
    `C${point(0.54, 2)} ${point(0.54, 1)} ${point(0.56, 1)}`,
    `C${point(0.61, 1)} ${point(0.61, 0)} ${point(0.66, 0)}`,
    `L${endX},${endY}`
  ].join(" ");
}

function getPiecePath(piece) {
  const edges = getPieceEdges(piece);
  return [
    "M0,0",
    edgePath(0, 0, 100, 0, 0, -1, edges.top),
    edgePath(100, 0, 100, 100, 1, 0, edges.right),
    edgePath(100, 100, 0, 100, 0, 1, edges.bottom),
    edgePath(0, 100, 0, 0, -1, 0, edges.left),
    "Z"
  ].join(" ");
}

function createPieceSvg(piece, outlineOnly = false) {
  const namespace = "http://www.w3.org/2000/svg";
  const row = Math.floor(piece / gridSize);
  const column = piece % gridSize;
  const svg = document.createElementNS(namespace, "svg");
  const clipId = `piece-clip-${piece}-${Math.random().toString(36).slice(2)}`;
  const pathData = getPiecePath(piece);
  svg.setAttribute("viewBox", "-20 -20 140 140");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("preserveAspectRatio", "none");

  const definitions = document.createElementNS(namespace, "defs");
  const clipPath = document.createElementNS(namespace, "clipPath");
  const clipShape = document.createElementNS(namespace, "path");
  clipPath.setAttribute("id", clipId);
  clipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
  clipShape.setAttribute("d", pathData);
  clipPath.append(clipShape);
  definitions.append(clipPath);
  svg.append(definitions);

  if (outlineOnly) {
    const outline = document.createElementNS(namespace, "path");
    outline.setAttribute("d", pathData);
    outline.setAttribute("fill", "#e7e1d5");
    outline.setAttribute("stroke", "#c5bdac");
    outline.setAttribute("stroke-width", "2");
    outline.setAttribute("stroke-dasharray", "5 4");
    outline.setAttribute("stroke-linejoin", "round");
    svg.append(outline);
    return svg;
  }

  const image = document.createElementNS(namespace, "image");
  image.setAttribute("x", String(-column * 100));
  image.setAttribute("y", String(-row * 100));
  image.setAttribute("width", String(gridSize * 100));
  image.setAttribute("height", String(gridSize * 100));
  image.setAttribute("href", landscapeDataUri);
  image.setAttribute("preserveAspectRatio", "none");
  image.setAttribute("clip-path", `url(#${clipId})`);
  svg.append(image);

  const border = document.createElementNS(namespace, "path");
  border.setAttribute("d", pathData);
  border.setAttribute("fill", "none");
  border.setAttribute("stroke", "#fffdf8");
  border.setAttribute("stroke-width", "2");
  border.setAttribute("stroke-linejoin", "round");
  svg.append(border);
  return svg;
}

function renderBoard() {
  board.replaceChildren();
  board.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;
  board.setAttribute("aria-label", `${gridSize} x ${gridSize} yapboz tahtası`);
  correctOrder.forEach((target) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "board-slot";
    slot.setAttribute("aria-label", `Yapboz tahtası, sıra ${target + 1}`);
    if (placedPieces.has(target)) {
      slot.disabled = true;
      slot.append(createPieceSvg(target));
      slot.setAttribute("aria-label", `Yerleştirilmiş yapboz parçası ${target + 1}`);
    } else {
      slot.append(createPieceSvg(target, true));
      slot.addEventListener("click", () => placeSelectedPiece(target));
    }
    board.append(slot);
  });
}

function renderTray() {
  trayPieces.replaceChildren();
  trayPieces.style.gridTemplateColumns = `repeat(${Math.min(gridSize, 5)}, minmax(0, 1fr))`;
  pieces.forEach((piece) => {
    if (placedPieces.has(piece)) return;

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `tray-piece${selectedPiece === piece ? " is-selected" : ""}`;
    tile.setAttribute("aria-label", `Yapboz parçası ${piece + 1}`);
    tile.setAttribute("aria-pressed", selectedPiece === piece ? "true" : "false");
    tile.dataset.piece = String(piece);
    tile.append(createPieceSvg(piece));
    tile.addEventListener("pointerdown", (event) => startDragging(event, piece, tile));
    tile.addEventListener("click", (event) => {
      if (event.detail === 0) {
        selectedPiece = selectedPiece === piece ? null : piece;
        playGameSound("pickup");
        gameStatus.textContent = selectedPiece === null
          ? "Bir parça seçip tahtada yerini belirleyebilirsin."
          : `Parça ${piece + 1} seçildi. Şimdi tahtadaki yerine dokun.`;
        renderTray();
      }
    });
    trayPieces.append(tile);
  });
}

function updateMoveCounter() {
  moveCounter.textContent = `Hamle: ${moves}`;
}

function placePiece(piece, target) {
  if (placedPieces.has(piece) || isSolved) return;
  if (piece !== target) {
    playGameSound("wrong");
    gameStatus.textContent = "Bu parça buraya uymuyor; başka bir yere dene.";
    return;
  }

  placedPieces.add(piece);
  isSolved = placedPieces.size === correctOrder.length;
  playGameSound(isSolved ? "complete" : "place");
  selectedPiece = null;
  moves += 1;
  updateMoveCounter();
  renderBoard();
  renderTray();
  if (isSolved) {
    completionMessage.textContent = `Seviye ${currentLevel} tamamlandı. Yapbozu ${moves} hamlede bitirdin!`;
    completionScreen.classList.remove("hidden");
    document.getElementById("continueButton").focus();
  } else {
    gameStatus.textContent = "Parça yerine oturdu! Sıradaki parçayı bul.";
  }
}

function placeSelectedPiece(target) {
  if (selectedPiece === null) {
    gameStatus.textContent = "Önce tepsiden bir parça seç.";
    return;
  }
  placePiece(selectedPiece, target);
}

function startDragging(event, piece, tile) {
  if (event.button !== 0 || isSolved || dragGhost) return;
  event.preventDefault();

  dragGhost = tile.cloneNode(true);
  dragGhost.className = "tray-piece drag-ghost";
  dragGhost.setAttribute("aria-hidden", "true");
  dragGhost.style.left = `${event.clientX}px`;
  dragGhost.style.top = `${event.clientY}px`;
  document.body.append(dragGhost);
  tile.classList.add("dragging");
  playGameSound("pickup");

  let hasMoved = false;
  const moveGhost = (moveEvent) => {
    if (!dragGhost) return;
    if (!hasMoved && Math.hypot(moveEvent.clientX - event.clientX, moveEvent.clientY - event.clientY) > 8) {
      hasMoved = true;
      playGameSound("move");
    }
    dragGhost.style.left = `${moveEvent.clientX}px`;
    dragGhost.style.top = `${moveEvent.clientY}px`;
  };

  const finishDrag = (upEvent) => {
    if (!dragGhost) return;
    dragGhost.remove();
    dragGhost = null;
    tile.classList.remove("dragging");
    window.removeEventListener("pointermove", moveGhost);
    window.removeEventListener("pointerup", finishDrag);

    if (!hasMoved) {
      selectedPiece = piece;
      gameStatus.textContent = `Parça ${piece + 1} seçildi. Tahtada doğru yerine dokun.`;
      renderTray();
      return;
    }

    const bounds = board.getBoundingClientRect();
    const x = upEvent.clientX - bounds.left - board.clientLeft;
    const y = upEvent.clientY - bounds.top - board.clientTop;
    if (x >= 0 && y >= 0 && x < board.clientWidth && y < board.clientHeight) {
      const column = Math.min(gridSize - 1, Math.floor(x / (board.clientWidth / gridSize)));
      const row = Math.min(gridSize - 1, Math.floor(y / (board.clientHeight / gridSize)));
      placePiece(piece, row * gridSize + column);
    } else {
      gameStatus.textContent = "Parçayı tahtadaki uygun yerine bırak.";
    }
  };

  window.addEventListener("pointermove", moveGhost);
  window.addEventListener("pointerup", finishDrag);
}

function shufflePieces() {
  do {
    pieces = [...correctOrder];
    for (let index = pieces.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [pieces[index], pieces[randomIndex]] = [pieces[randomIndex], pieces[index]];
    }
  } while (pieces.every((piece, index) => piece === index));

  placedPieces = new Set();
  selectedPiece = null;
  moves = 0;
  isSolved = false;
  completionScreen.classList.add("hidden");
  updateMoveCounter();
  gameStatus.textContent = "Parçayı tahtadaki doğru yerine bırak.";
  renderBoard();
  renderTray();
}

function startLevel(level) {
  currentLevel = level;
  gridSize = Math.min(level + 2, 7);
  correctOrder = Array.from({ length: gridSize * gridSize }, (_, index) => index);
  const scene = scenes[(level - 1) % scenes.length];
  landscapeDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene.svg)}`;
  horizontalEdges = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize - 1 }, () => Math.random() < 0.5 ? -1 : 1));
  verticalEdges = Array.from({ length: gridSize - 1 }, () =>
    Array.from({ length: gridSize }, () => Math.random() < 0.5 ? -1 : 1));
  gameTitle.textContent = `Seviye ${level} · ${scene.name}`;
  shufflePieces();
}

let resetConfirmationReturnTarget = null;

function showResetConfirmation(returnTarget) {
  resetConfirmationReturnTarget = returnTarget;
  resetConfirmation.classList.remove("hidden");
  document.getElementById("confirmResetButton").focus();
}

function cancelResetConfirmation() {
  resetConfirmation.classList.add("hidden");
  if (resetConfirmationReturnTarget) resetConfirmationReturnTarget.focus();
  resetConfirmationReturnTarget = null;
}

function resetProgressAndReturnToMenu() {
  currentLevel = 1;
  localStorage.setItem("minikParcalarLevel", String(currentLevel));
  resetConfirmation.classList.add("hidden");
  completionScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  syncMusicToScreen();
  document.getElementById("playButton").focus();
  resetConfirmationReturnTarget = null;
}

document.getElementById("exitButton").addEventListener("click", (event) => {
  event.preventDefault();
  playMenuSound();
  window.setTimeout(() => window.location.assign("/"), 180);
});

document.getElementById("playButton").addEventListener("click", () => {
  playMenuSound();
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  startLevel(currentLevel);
  syncMusicToScreen();
});

document.getElementById("menuButton").addEventListener("click", () => {
  playGameSound("button");
  showResetConfirmation(document.getElementById("menuButton"));
});

document.getElementById("shuffleButton").addEventListener("click", () => {
  playGameSound("button");
  shufflePieces();
});
document.getElementById("replayButton").addEventListener("click", () => {
  playGameSound("button");
  startLevel(currentLevel);
  document.getElementById("shuffleButton").focus();
});
document.getElementById("completionMenuButton").addEventListener("click", () => {
  playGameSound("button");
  showResetConfirmation(document.getElementById("completionMenuButton"));
});
document.getElementById("continueButton").addEventListener("click", () => {
  playGameSound("button");
  startLevel(currentLevel + 1);
  localStorage.setItem("minikParcalarLevel", String(currentLevel));
  document.getElementById("shuffleButton").focus();
});
document.getElementById("confirmResetButton").addEventListener("click", () => {
  playGameSound("button");
  resetProgressAndReturnToMenu();
});
document.getElementById("cancelResetButton").addEventListener("click", () => {
  playGameSound("button");
  cancelResetConfirmation();
});
resetConfirmation.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    playGameSound("button");
    cancelResetConfirmation();
  }
});
menuMusicToggle.addEventListener("click", () => {
  menuMusicEnabled = !menuMusicEnabled;
  localStorage.setItem("minikParcalarMenuMusic", String(menuMusicEnabled));
  updateSoundToggles();
  syncMusicToScreen();
});
menuEffectsToggle.addEventListener("click", () => {
  menuEffectsEnabled = !menuEffectsEnabled;
  localStorage.setItem("minikParcalarMenuEffects", String(menuEffectsEnabled));
  updateSoundToggles();
  playMenuSound();
});
gameMusicToggle.addEventListener("click", () => {
  gameMusicEnabled = !gameMusicEnabled;
  localStorage.setItem("minikParcalarGameMusic", String(gameMusicEnabled));
  updateSoundToggles();
  syncMusicToScreen();
});
gameEffectsToggle.addEventListener("click", () => {
  gameEffectsEnabled = !gameEffectsEnabled;
  localStorage.setItem("minikParcalarGameEffects", String(gameEffectsEnabled));
  updateSoundToggles();
  playGameSound("button");
});

document.addEventListener("pointerdown", syncMusicToScreen);
document.addEventListener("keydown", syncMusicToScreen);
updateSoundToggles();
renderMenuPreview();
