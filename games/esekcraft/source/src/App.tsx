/**
 * EsekCraft - Main Application Component
 */
import React, { useState, useEffect, useRef } from 'react';
import { WorldMeta, BlockType, KeyBindings, DEFAULT_KEY_BINDINGS } from './game/types';
import { initTextures, getItemIcon } from './game/textures';
import { initAudio, Sound, setMasterVolume } from './game/audio';
import { MinecraftEngine } from './game/engine';
import { MinecraftUI } from './components/MinecraftUI';
import { ControlsModal } from './components/ControlsModal';

const LOCAL_STORAGE_KEY = 'esekcraft_worlds_v1';
const SETTINGS_KEY = 'esekcraft_settings_v1';

export default function App() {
  // App navigation state: 'boot' | 'title' | 'settings' | 'play_menu' | 'worlds' | 'create_world' | 'generating' | 'in_game'
  const [appState, setAppState] = useState<
    'boot' | 'title' | 'settings' | 'play_menu' | 'worlds' | 'create_world' | 'generating' | 'in_game'
  >('boot');

  const [uiState, setUIState] = useState<string>('playing');
  const [worlds, setWorlds] = useState<WorldMeta[]>([]);
  const [selectedWorldIdx, setSelectedWorldIdx] = useState<number>(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Boot progress
  const [bootProgress, setBootProgress] = useState(15);
  const [bootText, setBootText] = useState('Dokular hazırlanıyor...');

  // Generation progress
  const [genProgress, setGenProgress] = useState(10);
  const [genText, setGenText] = useState('Dünya oluşturuluyor...');

  // Settings
  const [sensitivity, setSensitivity] = useState(100);
  const [fov, setFov] = useState(75);
  const [volume, setVolume] = useState(70);
  const [thirdPerson, setThirdPerson] = useState(false);
  const [settingsFrom, setSettingsFrom] = useState<'title' | 'in_game'>('title');
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);

  // New world form state
  const [newWorldName, setNewWorldName] = useState('Yeni Dünya');
  const [newWorldSeed, setNewWorldSeed] = useState('');
  const [newWorldDifficulty, setNewWorldDifficulty] = useState(1);
  const [newWorldMode, setNewWorldMode] = useState<'survival' | 'creative'>('survival');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MinecraftEngine | null>(null);
  const activeMetaRef = useRef<WorldMeta | null>(null);

  // Boot animation on startup
  useEffect(() => {
    initTextures();
    loadSavedSettings();
    loadSavedWorlds();

    // Boot sequence steps
    setTimeout(() => {
      setBootProgress(45);
      setBootText('Sesler ayarlanıyor...');
      setTimeout(() => {
        setBootProgress(80);
        setBootText('Dünya motoru kuruluyor...');
        setTimeout(() => {
          setBootProgress(100);
          setBootText('Hazır!');
          setTimeout(() => {
            setAppState('title');
          }, 350);
        }, 350);
      }, 350);
    }, 300);
  }, []);

  const loadSavedSettings = () => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        const s = JSON.parse(data);
        if (s.sens !== undefined) setSensitivity(s.sens);
        if (s.fov !== undefined) setFov(s.fov);
        if (s.vol !== undefined) {
          setVolume(s.vol);
          setMasterVolume(s.vol / 100);
        }
        if (s.third !== undefined) setThirdPerson(s.third);
      }
    } catch {}

    try {
      const savedBinds = localStorage.getItem('esekcraft_keybinds');
      if (savedBinds) {
        setKeyBindings({ ...DEFAULT_KEY_BINDINGS, ...JSON.parse(savedBinds) });
      }
    } catch {}
  };

  const handleSaveKeyBindings = (newBindings: KeyBindings) => {
    setKeyBindings(newBindings);
    try {
      localStorage.setItem('esekcraft_keybinds', JSON.stringify(newBindings));
    } catch {}
    if (engineRef.current) {
      engineRef.current.setKeyBindings(newBindings);
    }
  };

  const saveSettings = (newSens: number, newFov: number, newVol: number, newThird: boolean) => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ sens: newSens, fov: newFov, vol: newVol, third: newThird })
      );
    } catch {}
  };

  const loadSavedWorlds = () => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        setWorlds(JSON.parse(data));
      }
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Launch into 3D Game with selected or new world
  const launchWorld = (meta: WorldMeta) => {
    initAudio();
    activeMetaRef.current = meta;
    setAppState('generating');
    setGenProgress(20);
    setGenText('Arazi oluşturuluyor...');

    setTimeout(() => {
      setGenProgress(65);
      setGenText('Ağaçlar ve madenler dikiliyor...');

      setTimeout(() => {
        setGenProgress(90);
        setGenText('Dünya inşa ediliyor...');

        setTimeout(() => {
          if (!canvasContainerRef.current) return;

          // Clean up previous engine if any
          if (engineRef.current) {
            engineRef.current.destroy();
            engineRef.current = null;
          }

          canvasContainerRef.current.innerHTML = '';

          // Initialize Engine with saved settings
          const eng = new MinecraftEngine(canvasContainerRef.current, meta);
          eng.mouseSensitivity = sensitivity / 100;
          eng.fov = fov;
          eng.camera.fov = fov;
          eng.camera.updateProjectionMatrix();
          eng.isThirdPerson = thirdPerson;

          engineRef.current = eng;

          eng.onUIStateChange = (st) => {
            setUIState(st);
          };
          eng.onHUDUpdate = () => {
            setUIState((prev) => prev);
          };
          eng.onToast = (msg) => {
            showToast(msg);
          };

          eng.start();
          setGenProgress(100);
          setGenText('Hazır!');

          setTimeout(() => {
            setAppState('in_game');
            setUIState('playing');
            eng.requestPointerLock();
          }, 200);
        }, 200);
      }, 250);
    }, 250);
  };

  const handleSaveAndQuit = () => {
    const eng = engineRef.current;
    const meta = activeMetaRef.current;

    if (eng && meta) {
      meta.saved = Date.now();
      meta.gameMode = eng.gameMode;
      meta.mods = { ...eng.world.mods };
      meta.furnaces = { ...eng.world.furnaces };
      meta.chests = { ...eng.world.chests };
      meta.player = {
        x: eng.pos.x,
        y: eng.pos.y,
        z: eng.pos.z,
        yaw: eng.yaw,
        pitch: eng.pitch,
        hp: eng.hp,
        hunger: eng.hunger,
        xp: eng.xp,
        level: eng.level,
        sel: eng.selectedSlot,
        inv: [...eng.inventory],
        armor: [...eng.armor],
        offhand: eng.offhand ? { ...eng.offhand } : null,
      };

      const updated = [...worlds];
      const foundIdx = updated.findIndex((w) => w.id === meta.id);
      if (foundIdx >= 0) {
        updated[foundIdx] = meta;
      } else {
        updated.push(meta);
      }
      setWorlds(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }

    if (eng) {
      eng.exitPointerLock();
      eng.destroy();
      engineRef.current = null;
    }

    setAppState('title');
    setUIState('title');
  };

  const handleCreateNewWorld = () => {
    const seed = newWorldSeed.trim() || `seed-${Math.floor(Math.random() * 9999999)}`;
    const newMeta: WorldMeta = {
      id: `w${Date.now()}`,
      name: newWorldName.trim() || 'Yeni Dünya',
      seed,
      difficulty: newWorldDifficulty,
      gameMode: newWorldMode,
      created: Date.now(),
      saved: Date.now(),
      mods: {},
      furnaces: {},
      chests: {},
    };

    const nextWorlds = [...worlds, newMeta];
    setWorlds(nextWorlds);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextWorlds));
    } catch {}

    launchWorld(newMeta);
  };

  const handleDeleteWorld = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bu dünyayı silmek istediğine emin misin?')) {
      const next = worlds.filter((w) => w.id !== id);
      setWorlds(next);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      setSelectedWorldIdx(-1);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* 3D Game Viewport Canvas */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 ${appState === 'in_game' ? 'block' : 'hidden'}`}
      />

      {/* In-Game UI (HUD, Crafting Tables, Inventory, Furnace, Chest, Pause, Death) */}
      {appState === 'in_game' && (
        <MinecraftUI
          engine={engineRef.current}
          uiState={uiState}
          setUIState={setUIState}
          onSaveAndQuit={handleSaveAndQuit}
          onRespawn={() => engineRef.current?.respawn()}
          toastMessage={toastMessage}
          keyBindings={keyBindings}
          onSaveKeyBindings={handleSaveKeyBindings}
        />
      )}

      {/* ================= 1. BOOT / INITIAL LOADING SCREEN ================= */}
      {appState === 'boot' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]">
          <h1 className="font-mono font-black text-6xl text-[#5fce46] tracking-widest drop-shadow-[4px_4px_0_#1e3d16] mb-1">
            ESEKCRAFT
          </h1>
          <div className="text-[#ffe45e] font-mono text-sm tracking-wider mb-6 drop-shadow-[2px_2px_0_#3f3a16]">
            Bir EsekGames Oyunu
          </div>
          {/* Outer bar */}
          <div className="w-[360px] h-[22px] bg-[#222] border-2 border-[#555] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7ed957] to-[#4caf2f] transition-all duration-200"
              style={{ width: `${bootProgress}%` }}
            />
          </div>
          <div className="text-[#ddd] font-mono text-sm mt-3">{bootText}</div>
        </div>
      )}

      {/* ================= 2. TITLE SCREEN (Oyna & Ayarlar) ================= */}
      {appState === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#6c9fe0] via-[#a8cbe8] via-45% via-[#c9e4ff] via-58% to-[#4a7d32]">
          {/* EsekCraft Title Branding */}
          <div className="flex flex-col items-center mb-6 relative">
            <h1 className="text-6xl md:text-7xl font-mono font-black tracking-widest text-[#5fce46] drop-shadow-[4px_4px_0_#1e3d16] drop-shadow-[8px_8px_0_rgba(0,0,0,0.35)]">
              ESEKCRAFT
            </h1>
            <span className="text-[#ffe45e] font-mono text-base tracking-wider drop-shadow-[2px_2px_0_#3f3a16] mt-1 -rotate-6 animate-pulse">
              EsekCraft 0.1! At degil, ESEK!
            </span>
          </div>

          {/* Block Icons Row */}
          <div className="flex gap-2 mb-6">
            {[
              BlockType.GRASS,
              BlockType.DIRT,
              BlockType.STONE,
              BlockType.OAK_LOG,
              BlockType.OAK_PLANKS,
              BlockType.COBBLESTONE,
            ].map((id) => (
              <img
                key={id}
                src={getItemIcon(id)}
                alt="Block"
                className="w-10 h-10 pixelated drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
              />
            ))}
          </div>

          {/* EXACTLY 2 MAIN BUTTONS: OYNA & AYARLAR */}
          <div className="flex flex-col gap-3 w-[340px]">
            <button
              onClick={() => {
                Sound.click();
                setAppState('play_menu');
              }}
              className="mc-btn w-full !py-3 !text-lg"
            >
              Oyna
            </button>

            <button
              onClick={() => {
                Sound.click();
                setSettingsFrom('title');
                setAppState('settings');
              }}
              className="mc-btn w-full !py-3 !text-lg"
            >
              Ayarlar
            </button>
          </div>

          {/* Version & Credits */}
          <div className="absolute left-3 bottom-2 text-xs text-neutral-200 font-mono drop-shadow-[1px_1px_0_#000]">
            EsekCraft v0.1.0
          </div>
          <div className="absolute right-3 bottom-2 text-xs text-neutral-200 font-mono drop-shadow-[1px_1px_0_#000]">
            EsekGames &copy; 2026
          </div>
        </div>
      )}

      {/* ================= 3. PLAY MENU (Tek Başına & Online) ================= */}
      {appState === 'play_menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className="mc-panel p-6 flex flex-col items-center gap-4 w-[380px] max-w-[90vw]">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-[2px_2px_0_#222]">
              Oyna
            </h2>

            {/* Tek Başına (Singleplayer - Active) */}
            <button
              onClick={() => {
                Sound.click();
                setSelectedWorldIdx(-1);
                loadSavedWorlds();
                setAppState('worlds');
              }}
              className="mc-btn w-full !py-3 !text-base"
            >
              Tek Başına
            </button>

            {/* Online (Multiplayer - Disabled) */}
            <button
              disabled
              title="Çok oyunculu mod yakında!"
              className="mc-btn w-full !py-3 !text-base disabled:opacity-60"
            >
              Online (Yakında!)
            </button>

            {/* Geri Button */}
            <div className="mt-2 w-full">
              <button
                onClick={() => {
                  Sound.click();
                  setAppState('title');
                }}
                className="mc-btn w-full !py-2 !text-sm"
              >
                Geri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. DÜNYALAR SCREEN ================= */}
      {appState === 'worlds' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className="mc-panel p-6 flex flex-col items-center gap-3 w-[460px] max-w-[92vw] max-h-[75vh]">
            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-[2px_2px_0_#222]">
              Dünyalar
            </h2>

            {/* World List Box */}
            <div className="w-full flex-1 min-h-[160px] max-h-[250px] overflow-y-auto mc-scroll flex flex-col gap-1.5 p-1.5 bg-[#111] border-2 border-[#555]">
              {worlds.length === 0 ? (
                <div className="text-xs text-[#888] text-center py-10 font-medium">
                  Henüz dünya yok. "Dünya Oluştur" ile bir tane yap!
                </div>
              ) : (
                worlds.map((w, idx) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorldIdx(idx)}
                    onDoubleClick={() => launchWorld(w)}
                    className={`p-2 cursor-pointer flex justify-between items-center border-2 transition-colors ${
                      selectedWorldIdx === idx
                        ? 'bg-[#455a8a] border-[#8ab4ff] text-white'
                        : 'bg-[#2a2a2a] border-[#1a1a1a] text-[#ddd] hover:bg-[#3a4a6a]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-base text-white">{w.name}</div>
                      <div className="text-xs text-[#aaa]">
                        {w.difficulty === 0 ? 'Kolay' : w.difficulty === 2 ? 'Zor' : 'Normal'} · Seed:{' '}
                        {w.seed} · {new Date(w.saved || w.created).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteWorld(w.id, e)}
                      className="text-red-400 hover:text-red-200 font-bold px-2 py-0.5 text-base bg-red-950/60 rounded"
                      title="Dünyayı Sil"
                    >
                      X
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Buttons Row: Dünya Oluştur / Oyna / Geri */}
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => {
                  Sound.click();
                  setNewWorldName('Yeni Dünya');
                  setNewWorldSeed('');
                  setNewWorldDifficulty(1);
                  setNewWorldMode('survival');
                  setAppState('create_world');
                }}
                className="mc-btn flex-1 !text-sm"
              >
                Dünya Oluştur
              </button>

              <button
                disabled={selectedWorldIdx < 0 || selectedWorldIdx >= worlds.length}
                onClick={() => {
                  if (selectedWorldIdx >= 0 && selectedWorldIdx < worlds.length) {
                    Sound.click();
                    launchWorld(worlds[selectedWorldIdx]);
                  }
                }}
                className="mc-btn flex-1 !text-sm bg-emerald-800 border-emerald-600"
              >
                Oyna
              </button>

              <button
                onClick={() => {
                  Sound.click();
                  setAppState('play_menu');
                }}
                className="mc-btn !px-4 !text-sm"
              >
                Geri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. DÜNYA OLUŞTUR SCREEN ================= */}
      {appState === 'create_world' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="mc-panel p-6 flex flex-col gap-3.5 w-[420px] max-w-[92vw]">
            <h2 className="text-2xl font-bold text-white text-center drop-shadow-[2px_2px_0_#222] mb-1">
              Dünya Oluştur
            </h2>

            {/* Dünya Adı */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-[#ddd] w-24">Dünya Adı</label>
              <input
                type="text"
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                maxLength={24}
                className="flex-1 p-2 bg-[#111] border-2 border-[#555] text-white text-sm outline-none font-mono"
                placeholder="Yeni Dünya"
              />
            </div>

            {/* Seed */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-[#ddd] w-24">Seed</label>
              <input
                type="text"
                value={newWorldSeed}
                onChange={(e) => setNewWorldSeed(e.target.value)}
                maxLength={32}
                className="flex-1 p-2 bg-[#111] border-2 border-[#555] text-white text-sm outline-none font-mono"
                placeholder="(boş = rastgele)"
              />
            </div>

            {/* Zorluk */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-[#ddd] w-24">Zorluk</label>
              <select
                value={newWorldDifficulty}
                onChange={(e) => setNewWorldDifficulty(Number(e.target.value))}
                className="flex-1 p-2 bg-[#111] border-2 border-[#555] text-white text-sm outline-none font-mono"
              >
                <option value={0}>Kolay</option>
                <option value={1}>Normal</option>
                <option value={2}>Zor</option>
              </select>
            </div>

            {/* Mod */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-[#ddd] w-24">Mod</label>
              <div className="flex gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => setNewWorldMode('survival')}
                  className={`mc-btn flex-1 !text-xs !py-1.5 ${
                    newWorldMode === 'survival' ? 'bg-emerald-800 border-emerald-600' : ''
                  }`}
                >
                  Hayatta Kalma
                </button>
                <button
                  type="button"
                  onClick={() => setNewWorldMode('creative')}
                  className={`mc-btn flex-1 !text-xs !py-1.5 ${
                    newWorldMode === 'creative' ? 'bg-emerald-800 border-emerald-600' : ''
                  }`}
                >
                  Yaratıcı
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  Sound.click();
                  handleCreateNewWorld();
                }}
                className="mc-btn flex-1 bg-emerald-800 border-emerald-600"
              >
                Dünyayı Oluştur!
              </button>
              <button
                onClick={() => {
                  Sound.click();
                  setAppState('worlds');
                }}
                className="mc-btn flex-1"
              >
                Geri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. AYARLAR SCREEN ================= */}
      {appState === 'settings' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="mc-panel p-6 flex flex-col gap-4 w-[420px] max-w-[92vw]">
            <h2 className="text-2xl font-bold text-white text-center drop-shadow-[2px_2px_0_#222] mb-1">
              Ayarlar
            </h2>

            {/* Fare Duyarlılığı */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#ddd] w-28">Fare Duyarl.</label>
              <input
                type="range"
                min="20"
                max="300"
                value={sensitivity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSensitivity(val);
                  saveSettings(val, fov, volume, thirdPerson);
                }}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono text-sm">{(sensitivity / 100).toFixed(1)}</span>
            </div>

            {/* Görüş (FOV) */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#ddd] w-28">Görüş (FOV)</label>
              <input
                type="range"
                min="60"
                max="110"
                value={fov}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFov(val);
                  saveSettings(sensitivity, val, volume, thirdPerson);
                }}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono text-sm">{fov}</span>
            </div>

            {/* Ses */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#ddd] w-28">Ses</label>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  setMasterVolume(val / 100);
                  saveSettings(sensitivity, fov, val, thirdPerson);
                }}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono text-sm">{volume}%</span>
            </div>

            {/* 3. Şahıs */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#ddd] w-28">3. Şahıs</label>
              <button
                type="button"
                onClick={() => {
                  const next = !thirdPerson;
                  setThirdPerson(next);
                  saveSettings(sensitivity, fov, volume, next);
                }}
                className="mc-btn flex-1 !py-1.5 !text-xs"
              >
                {thirdPerson ? 'Açık' : 'Kapalı'} (F5)
              </button>
            </div>

            {/* Kontroller (Tuş Atamaları) Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  Sound.click();
                  setShowControlsModal(true);
                }}
                className="mc-btn w-full !py-2.5 !text-sm bg-[#3a4a6a] border-[#6585c5] hover:bg-[#485b82]"
              >
                🎮 Kontroller (Tuş Atamaları)
              </button>
            </div>

            {/* Geri Button */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => {
                  Sound.click();
                  setAppState(settingsFrom === 'title' ? 'title' : 'in_game');
                }}
                className="mc-btn !px-8"
              >
                Geri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. WORLD GENERATION LOADING SCREEN ================= */}
      {appState === 'generating' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]">
          <h1 className="font-mono font-black text-5xl text-[#5fce46] tracking-widest drop-shadow-[4px_4px_0_#1e3d16] mb-3">
            ESEKCRAFT
          </h1>
          <div className="w-[360px] h-[22px] bg-[#222] border-2 border-[#555] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7ed957] to-[#4caf2f] transition-all duration-200"
              style={{ width: `${genProgress}%` }}
            />
          </div>
          <div className="text-[#ddd] font-mono text-sm mt-3">{genText}</div>
        </div>
      )}

      {/* Controls Rebinding Modal */}
      <ControlsModal
        isOpen={showControlsModal}
        onClose={() => setShowControlsModal(false)}
        keyBindings={keyBindings}
        onSave={handleSaveKeyBindings}
      />
    </div>
  );
}
