/**
 * EsekCraft - Main Application Component
 */
import React, { useState, useEffect, useRef } from 'react';
import { WorldMeta, BlockType, KeyBindings, DEFAULT_KEY_BINDINGS, FurnaceData, ChestData } from './game/types';
import { initTextures, getItemIcon } from './game/textures';
import { initAudio, Sound, setMasterVolume } from './game/audio';
import { MinecraftEngine } from './game/engine';
import { MinecraftUI } from './components/MinecraftUI';
import { ControlsModal } from './components/ControlsModal';
import { MobileControls } from './components/MobileControls';
import { MinecraftChat, type ChatLine } from './components/MinecraftChat';

const LOCAL_STORAGE_KEY = 'esekcraft_worlds_v1';
const SETTINGS_KEY = 'esekcraft_settings_v1';
const CONTROL_MODE_KEY = 'esekcraft_control_mode_v1';
type OnlineRoom = {
  id: string;
  name: string;
  gameId: string;
  maxPlayers: number;
  currentPlayers: number;
  mapName?: string;
  hostName?: string;
  worldOptions?: { name: string; seed: string; difficulty: number; gameMode: 'survival' | 'creative' } | null;
  isOpen: boolean;
};

export default function App() {
  // App navigation state: 'boot' | 'title' | 'settings' | 'play_menu' | 'worlds' | 'create_world' | 'online_rooms' | 'online_create' | 'generating' | 'in_game'
  const [appState, setAppState] = useState<
    'boot' | 'title' | 'settings' | 'play_menu' | 'worlds' | 'create_world' | 'online_rooms' | 'online_create' | 'generating' | 'in_game'
  >('boot');

  const [uiState, setUIState] = useState<string>('playing');
  const [, setHudRefresh] = useState(0);
  const [worlds, setWorlds] = useState<WorldMeta[]>([]);
  const [selectedWorldIdx, setSelectedWorldIdx] = useState<number>(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatLine[]>([]);

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
  const [controlMode, setControlMode] = useState<'pc' | 'mobile'>(() => {
    try {
      const saved = localStorage.getItem(CONTROL_MODE_KEY);
      if (saved === 'pc' || saved === 'mobile') return saved;
    } catch {}
    return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 ? 'mobile' : 'pc';
  });
  // Online EsekCraft lobby state
  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<Record<string, any>>({});
  const [onlineIsAdmin, setOnlineIsAdmin] = useState(false);
  const [mobilePlayerListOpen, setMobilePlayerListOpen] = useState(false);
  const [selectedOnlineRoom, setSelectedOnlineRoom] = useState<string | null>(null);
  const [onlineMaxPlayers, setOnlineMaxPlayers] = useState(1);
  const onlineSocketRef = useRef<WebSocket | null>(null);
  const onlineRoomRef = useRef<OnlineRoom | null>(null);
  const onlinePlayerIdRef = useRef<string | null>(null);
  const onlineMoveTimerRef = useRef<number | null>(null);
  const pendingOnlineGameModeRef = useRef<'survival' | 'creative' | null>(null);
  const pendingOnlineBlockChangesRef = useRef<Array<{ x: number; y: number; z: number; blockId: number }>>([]);
  const worldReadyRef = useRef(false);
  const pendingOnlineTileStateRef = useRef<{ furnaces: Record<number, FurnaceData>; chests: Record<number, ChestData> } | null>(null);
  const pendingOnlineDropsRef = useRef<unknown[] | null>(null);
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);

  // New world form state
  const [newWorldName, setNewWorldName] = useState('Yeni Dünya');
  const [newWorldSeed, setNewWorldSeed] = useState('');
  const [newWorldDifficulty, setNewWorldDifficulty] = useState(1);
  const [newWorldMode, setNewWorldMode] = useState<'survival' | 'creative'>('survival');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MinecraftEngine | null>(null);
  const activeMetaRef = useRef<WorldMeta | null>(null);

  useEffect(() => {
    try { localStorage.setItem(CONTROL_MODE_KEY, controlMode); } catch {}
  }, [controlMode]);
  useEffect(() => {
    if (appState !== 'in_game' || uiState !== 'playing') setChatOpen(false);
  }, [appState, uiState]);

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
    setChatOpen(false);
    setMobilePlayerListOpen(false);
    setChatMessages([]);
    initAudio();
    activeMetaRef.current = meta;
    setAppState('generating');
    setGenProgress(2);
    setGenText('Yükleme ekranı hazırlanıyor...');
    worldReadyRef.current = false;

    // Paint the loading screen before constructing the engine and beginning staged work.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const container = canvasContainerRef.current;
      if (!container) return;

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      container.innerHTML = '';

      const pendingMode = pendingOnlineGameModeRef.current;
      const worldMeta = onlineRoomRef.current && pendingMode ? { ...meta, gameMode: pendingMode } : meta;
      pendingOnlineGameModeRef.current = null;
      activeMetaRef.current = worldMeta;
      const eng = new MinecraftEngine(container, worldMeta);
      eng.mobileControlsEnabled = controlMode === 'mobile';
      eng.mouseSensitivity = sensitivity / 100;
      eng.fov = fov;
      eng.camera.fov = fov;
      eng.camera.updateProjectionMatrix();
      eng.isThirdPerson = thirdPerson;
      engineRef.current = eng;
      eng.onlineMode = !!onlineRoomRef.current;
      eng.networkPlayerId = onlinePlayerIdRef.current;

      eng.onUIStateChange = (st) => setUIState(st);
      eng.onHUDUpdate = () => setHudRefresh((tick) => tick + 1);
      eng.onToast = (msg) => showToast(msg);
      eng.onTileEntityChanged = () => persistActiveTileState(eng);
      eng.onBlockChanged = (change) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_block_change', ...change });
        else persistActiveTileState(eng);
      };
      eng.onAttackPlayer = (payload) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_attack', ...payload });
      };
      eng.onItemDropSpawned = (drop) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_item_drop', ...drop });
      };
      eng.onItemDropUpdated = (drop) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_item_drop_update', ...drop });
      };
      eng.onItemDropRemoved = (dropId) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_item_drop_remove', dropId });
      };
      eng.onItemDropPositionUpdated = (drop) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_item_drop_position', ...drop });
      };
      eng.onItemDropPickupRequested = (dropId) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_item_drop_pickup', dropId });
      };
      eng.onItemDropPickupResult = (result) => {
        if (onlineRoomRef.current) sendOnlineMessage({ type: 'esekcraft_item_drop_pickup_result', ...result });
      };

      if (pendingOnlineTileStateRef.current) {
        const state = pendingOnlineTileStateRef.current;
        eng.applyRemoteTileState(state.furnaces, state.chests);
        pendingOnlineTileStateRef.current = null;
      }
      if (pendingOnlineDropsRef.current) {
        eng.applyRemoteDrops(pendingOnlineDropsRef.current);
        pendingOnlineDropsRef.current = null;
      }

      eng.start(() => {
        if (pendingOnlineBlockChangesRef.current.length > 0) {
          eng.applyRemoteBlockChanges(pendingOnlineBlockChangesRef.current);
          pendingOnlineBlockChangesRef.current = [];
        }
        worldReadyRef.current = true;
        setGenProgress(100);
        setGenText('Dünya hazır!');
        setAppState('in_game');
        setUIState('playing');
        if (!eng.mobileControlsEnabled) eng.requestPointerLock();
        if (onlineMoveTimerRef.current !== null) window.clearInterval(onlineMoveTimerRef.current);
        if (onlineRoomRef.current) {
          onlineMoveTimerRef.current = window.setInterval(() => {
            const current = engineRef.current;
            if (!current || !onlineRoomRef.current) return;
            sendOnlineMessage({
              type: 'move', x: current.pos.x, y: current.pos.y, z: current.pos.z,
              yaw: current.yaw, pitch: current.pitch,
              isMoving: Math.hypot(current.vel.x, current.vel.z) > 0.05,
              isCrouching: current.isSneaking, isSprinting: current.isSprinting,
              isJumping: !current.onGround, platform: controlMode
            });
          }, 50);
        }
      }, (progress, stage, fps) => {
        setGenProgress(Math.max(2, Math.min(99, Math.round(progress))));
        setGenText(fps > 0 ? `${stage} · ${fps} FPS` : stage);
      });
    }));
  };

  const closeOnlineConnection = () => {
    if (onlineMoveTimerRef.current !== null) {
      window.clearInterval(onlineMoveTimerRef.current);
      onlineMoveTimerRef.current = null;
    }
    const ws = onlineSocketRef.current;
    onlineSocketRef.current = null;
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    onlineRoomRef.current = null;
    onlinePlayerIdRef.current = null;
    pendingOnlineBlockChangesRef.current = [];
    worldReadyRef.current = false;
    pendingOnlineTileStateRef.current = null;
    pendingOnlineDropsRef.current = null;
    setOnlinePlayers({});
    setOnlineIsAdmin(false);
  };
  const sendOnlineMessage = (payload: Record<string, unknown>) => {
    const ws = onlineSocketRef.current;
    if (!ws) return;
    const send = () => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
    };
    if (ws.readyState === WebSocket.OPEN) send();
    else ws.addEventListener('open', send, { once: true });
  };
  const handleSendChat = (rawText: string) => {
    const text = rawText.trim().slice(0, 200);
    if (!text) return;
    if (onlineRoomRef.current) {
      sendOnlineMessage({ type: 'esekcraft_chat', text });
      return;
    }
    setChatMessages((previous) => [...previous, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: 'Sen', text, timestamp: Date.now(),
    }].slice(-60));
  };
  const persistActiveTileState = (eng: MinecraftEngine) => {
    const meta = activeMetaRef.current;
    if (!meta) return;
    const updatedMeta: WorldMeta = {
      ...meta,
      saved: Date.now(),
      mods: { ...eng.world.mods },
      furnaces: { ...eng.world.furnaces },
      chests: { ...eng.world.chests },
    };
    activeMetaRef.current = updatedMeta;
    if (onlineRoomRef.current) {
      sendOnlineMessage({
        type: 'esekcraft_tile_state',
        furnaces: updatedMeta.furnaces,
        chests: updatedMeta.chests,
      });
      return;
    }

    let savedWorlds = worlds;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) savedWorlds = parsed;
      }
    } catch {}
    const index = savedWorlds.findIndex((world) => world.id === updatedMeta.id);
    const nextWorlds = [...savedWorlds];
    if (index >= 0) nextWorlds[index] = updatedMeta;
    else nextWorlds.push(updatedMeta);
    setWorlds(nextWorlds);
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextWorlds)); } catch {}
  };
  const roomToWorldMeta = (room: OnlineRoom): WorldMeta => {
    const options = room.worldOptions || { name: room.name, seed: `online-${room.id}`, difficulty: 1, gameMode: 'survival' as const };
    return {
      id: `online-${room.id}`,
      name: options.name || room.name,
      seed: options.seed,
      difficulty: options.difficulty,
      gameMode: options.gameMode,
      created: Date.now(), saved: Date.now(), mods: {}, furnaces: {}, chests: {}
    };
  };
  const connectOnline = () => {
    if (onlineSocketRef.current && onlineSocketRef.current.readyState <= WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    onlineSocketRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'rooms_request', gameId: 'esekcraft' }));
    ws.onmessage = (event) => {
      if (onlineSocketRef.current !== ws) return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'init') onlinePlayerIdRef.current = message.id || null;
        if (message.type === 'esekcraft_chat_message' && typeof message.text === 'string') {
          const timestamp = Number(message.timestamp) || Date.now();
          setChatMessages((previous) => [...previous, {
            id: `${timestamp}-${String(message.senderId || 'player')}-${Math.random().toString(36).slice(2, 7)}`,
            sender: String(message.sender || 'Oyuncu').slice(0, 24),
            text: String(message.text).slice(0, 200),
            timestamp,
          }].slice(-60));
        }
        if (message.type === 'esekcraft_joined') {
          onlinePlayerIdRef.current = message.id || null;
          if (engineRef.current) engineRef.current.networkPlayerId = onlinePlayerIdRef.current;
          setOnlineIsAdmin(!!message.isAdmin);
        }
        if (message.type === 'rooms_list') setOnlineRooms(message.rooms || []);
        if (message.type === 'room_error') showToast(message.message || 'Sunucu işlemi başarısız.');
        if (message.type === 'room_created') {
          const room = message.room as OnlineRoom;
          onlineRoomRef.current = room;
          setSelectedOnlineRoom(room.id);
          sendOnlineMessage({ type: 'join_room', gameId: 'esekcraft', roomId: room.id, platform: controlMode });
        }
        if (message.type === 'room_joined') {
          const room = message.room as OnlineRoom;
          pendingOnlineGameModeRef.current = null;
          setMobilePlayerListOpen(false);
          pendingOnlineBlockChangesRef.current = [];
          worldReadyRef.current = false;
          pendingOnlineTileStateRef.current = null;
          pendingOnlineDropsRef.current = null;
          onlineRoomRef.current = room;
          setChatOpen(false);
          setChatMessages([]);
          setSelectedOnlineRoom(room.id);
          launchWorld(roomToWorldMeta(room));
        }
        if (message.type === 'players' && onlineRoomRef.current && engineRef.current) {
          setOnlinePlayers(message.players || {});
          engineRef.current.setRemotePlayers(message.players || {}, onlinePlayerIdRef.current || undefined);
        }
        if (message.type === 'room_admin') setOnlineIsAdmin(!!message.isAdmin);
        if (message.type === 'esekcraft_gamemode') {
          const gameMode = message.gameMode === 'creative' ? 'creative' : message.gameMode === 'survival' ? 'survival' : null;
          if (gameMode) {
            if (engineRef.current) engineRef.current.setGameMode(gameMode);
            else pendingOnlineGameModeRef.current = gameMode;
            if (activeMetaRef.current) activeMetaRef.current.gameMode = gameMode;
          }
        }
        if (message.type === 'esekcraft_kicked') { showToast(message.message || 'Odadan çıkarıldın.'); handleSaveAndQuit(); return; }
        if (message.type === 'esekcraft_block_changes') {
          const changes = (Array.isArray(message.changes) ? message.changes : []).map((change: any) => ({
            x: Number(change.x), y: Number(change.y), z: Number(change.z), blockId: Number(change.blockId),
          }));
          if (engineRef.current && worldReadyRef.current) engineRef.current.applyRemoteBlockChanges(changes);
          else pendingOnlineBlockChangesRef.current.push(...changes);
        }
        if (message.type === 'esekcraft_tile_state') {
          const state = { furnaces: message.furnaces || {}, chests: message.chests || {} };
          if (engineRef.current) engineRef.current.applyRemoteTileState(state.furnaces, state.chests);
          else pendingOnlineTileStateRef.current = state;
        }
        if (message.type === 'esekcraft_drops_state') {
          const drops = Array.isArray(message.drops) ? message.drops : [];
          if (engineRef.current) engineRef.current.applyRemoteDrops(drops);
          else pendingOnlineDropsRef.current = drops;
        }
        if (message.type === 'esekcraft_item_drop' && message.sourceId !== onlinePlayerIdRef.current) {
          if (engineRef.current) engineRef.current.applyRemoteItemDrop(message.drop);
          else pendingOnlineDropsRef.current = [...(pendingOnlineDropsRef.current || []), message.drop];
        }
        if (message.type === 'esekcraft_item_drop_update' && message.sourceId !== onlinePlayerIdRef.current) {
          const dropId = String(message.dropId || '');
          if (engineRef.current) engineRef.current.updateRemoteDrop(dropId, Number(message.count));
          else if (pendingOnlineDropsRef.current) {
            pendingOnlineDropsRef.current = pendingOnlineDropsRef.current.map((drop: any) =>
              drop?.dropId === dropId ? { ...drop, count: Number(message.count) } : drop
            );
          }
        }
        if (message.type === 'esekcraft_item_drop_position' && message.sourceId !== onlinePlayerIdRef.current && engineRef.current) {
          engineRef.current.updateRemoteDropPosition(String(message.dropId || ''), Number(message.x), Number(message.y), Number(message.z));
        }
        if (message.type === 'esekcraft_item_drop_remove' && message.sourceId !== onlinePlayerIdRef.current) {
          const dropId = String(message.dropId || '');
          if (engineRef.current) engineRef.current.removeRemoteDrop(dropId);
          else if (pendingOnlineDropsRef.current) {
            pendingOnlineDropsRef.current = pendingOnlineDropsRef.current.filter((drop: any) => drop?.dropId !== dropId);
          }
        }
        if (message.type === 'esekcraft_item_drop_pickup_offer') {
          if (engineRef.current) engineRef.current.acceptRemoteDropPickupOffer(message.drop);
          else if (message.drop && typeof message.drop.dropId === 'string') {
            sendOnlineMessage({
              type: 'esekcraft_item_drop_pickup_result',
              dropId: message.drop.dropId,
              remainingCount: Number(message.drop.count),
            });
          }
        }
        if (message.type === 'esekcraft_item_drop_pickup_rejected') {
          engineRef.current?.rejectRemoteDropPickup(String(message.dropId || ''));
        }
        if (message.type === 'esekcraft_block_change') {
          const change = { x: Number(message.x), y: Number(message.y), z: Number(message.z), blockId: Number(message.blockId) };
          if (engineRef.current && worldReadyRef.current) engineRef.current.applyRemoteBlockChange(change.x, change.y, change.z, change.blockId);
          else pendingOnlineBlockChangesRef.current.push(change);
        }
        if (message.type === 'esekcraft_attack' && engineRef.current && message.attackerId !== onlinePlayerIdRef.current) {
          engineRef.current.playRemoteAttack(String(message.attackerId));
        }
        if (message.type === 'combat_hit' && engineRef.current) {
          if (message.targetId === onlinePlayerIdRef.current) engineRef.current.applyNetworkHealth(Number(message.health));
          else if (message.targetId) engineRef.current.flashRemotePlayer(String(message.targetId));
        }
        if (message.type === 'player_death' && engineRef.current && message.id === onlinePlayerIdRef.current) {
          engineRef.current.handleNetworkDeath(String(message.reason || 'Öldün!'));
        }
        if (message.type === 'respawned' && engineRef.current) {
          engineRef.current.respawnAt(message.spawn);
          setUIState('playing');
        }
      } catch {}
    };
    ws.onerror = () => showToast('Online sunucuya bağlanılamadı.');
    ws.onclose = () => {
      if (onlineSocketRef.current === ws) onlineSocketRef.current = null;
    };
  };
  const handleCreateOnlineRoom = () => {
    connectOnline();
    sendOnlineMessage({
      type: 'create_room', gameId: 'esekcraft', name: newWorldName.trim() || 'EsekCraft Lobisi',
      maxPlayers: onlineMaxPlayers, worldOptions: {
        name: newWorldName.trim() || 'Çevrimiçi Dünya', seed: newWorldSeed.trim(),
        difficulty: newWorldDifficulty, gameMode: newWorldMode
      }
    });
  };
  const handleSaveAndQuit = () => {
    setChatOpen(false);
    setMobilePlayerListOpen(false);
    pendingOnlineGameModeRef.current = null;
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

    if (onlineRoomRef.current) sendOnlineMessage({ type: 'leave_room' });
    if (eng) {
      eng.exitPointerLock();
      eng.destroy();
      engineRef.current = null;
    }

    closeOnlineConnection();
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
          onRespawn={() => {
            if (onlineRoomRef.current) sendOnlineMessage({ type: 'respawn' });
            else engineRef.current?.respawn();
          }}
          toastMessage={toastMessage}
          keyBindings={keyBindings}
          onSaveKeyBindings={handleSaveKeyBindings}
          onlinePlayers={onlinePlayers}
          onlineIsAdmin={onlineIsAdmin}
          mobilePlayerListOpen={mobilePlayerListOpen}
          onlineSelfId={onlinePlayerIdRef.current}
          onKickPlayer={(id) => sendOnlineMessage({ type: 'esekcraft_kick', targetId: id })}
        />
      )}
      {appState === 'in_game' && engineRef.current && (
        <MinecraftChat
          engine={engineRef.current}
          enabled={uiState === 'playing'}
          open={chatOpen}
          messages={chatMessages}
          onOpenChange={setChatOpen}
          onSend={handleSendChat}
        />
      )}
      {appState === 'in_game' && uiState === 'playing' && controlMode === 'mobile' && !chatOpen && engineRef.current && (
        <MobileControls
          engine={engineRef.current}
          playerListOpen={mobilePlayerListOpen}
          onTogglePlayerList={() => setMobilePlayerListOpen((open) => !open)}
          onOpenChat={() => { setMobilePlayerListOpen(false); setChatOpen(true); }}
          onDropItem={() => engineRef.current?.dropSelectedItem(false)}
          onOpenInventory={() => {
            const eng = engineRef.current;
            if (!eng) return;
            eng.isGUIOpen = true;
            eng.isPaused = false;
            eng.exitPointerLock();
            setUIState('inventory');
            Sound.click();
          }}
          onPause={() => {
            const eng = engineRef.current;
            if (!eng) return;
            setChatOpen(false);
            setMobilePlayerListOpen(false);
            eng.isPaused = true;
            eng.mouseLeft = false;
            eng.mouseRight = false;
            eng.exitPointerLock();
            setUIState('paused');
            Sound.click();
          }}
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

          <div className="mt-4 w-[340px] max-w-[90vw]">
            <div className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-white drop-shadow-[1px_1px_0_#222]">
              Kontrol Biçimi
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={controlMode === 'pc'}
                onClick={() => { Sound.click(); setControlMode('pc'); }}
                className={`mc-btn flex-1 !py-2 !text-xs !tracking-normal ${controlMode === 'pc' ? '!border-blue-300 !bg-blue-700 !ring-2 !ring-blue-300/80' : ''}`}
              >
                <span className="mr-1.5" aria-hidden="true">⌨</span> PC Kontrolü
              </button>
              <button
                type="button"
                aria-pressed={controlMode === 'mobile'}
                onClick={() => { Sound.click(); setControlMode('mobile'); }}
                className={`mc-btn flex-1 !py-2 !text-xs !tracking-normal ${controlMode === 'mobile' ? '!border-blue-300 !bg-blue-700 !ring-2 !ring-blue-300/80' : ''}`}
              >
                <span className="mr-1.5" aria-hidden="true">▯</span> Mobil Kontrolü
              </button>
            </div>
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

            {/* Online multiplayer */}
            <button
              onClick={() => {
                Sound.click();
                connectOnline();
                setAppState('online_rooms');
              }}
              className="mc-btn w-full !py-3 !text-base bg-emerald-800 border-emerald-600"
            >
              Online Sunucular
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

      {/* ================= ONLINE SUNUCULAR ================= */}
      {appState === 'online_rooms' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px]">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[560px] max-w-[94vw] bg-red-950/95 border-2 border-red-500 px-3 py-2 text-center text-red-200 font-bold text-xs">
            UYARI: Sunucuda 0 kişi kalırsa lobi 5 dakika sonra otomatik silinir.
          </div>
          <div className="mc-panel p-6 flex flex-col items-center gap-3 w-[560px] max-w-[94vw] max-h-[78vh]">
            <h2 className="text-2xl font-bold text-white">EsekCraft Sunucuları</h2>
            <div className="w-full text-xs text-[#bbb] text-center">En fazla 6 kişi · Bir sunucuya katılınca dünya otomatik açılır.</div>
            <div className="w-full min-h-[180px] max-h-[320px] overflow-y-auto mc-scroll flex flex-col gap-2 p-2 bg-[#111] border-2 border-[#555]">
              {onlineRooms.length === 0 ? (
                <div className="text-sm text-[#999] text-center py-14">Açık sunucu yok. İlk lobiyi sen oluştur!</div>
              ) : onlineRooms.map((room) => (
                <div key={room.id} onClick={() => setSelectedOnlineRoom(room.id)} className={`p-3 cursor-pointer border-2 flex items-center justify-between ${selectedOnlineRoom === room.id ? 'bg-[#455a8a] border-[#8ab4ff]' : 'bg-[#262626] border-[#444] hover:bg-[#343f58]'}`}>
                  <div>
                    <div className="font-bold text-base">{room.name}</div>
                    <div className="text-xs text-[#bbb]">Kurucu: {room.hostName || 'Oyuncu'} · Seed: {room.worldOptions?.seed || 'rastgele'}</div>
                    <div className="text-xs text-[#aaa]">{room.worldOptions?.gameMode === 'creative' ? 'Yaratıcı' : 'Hayatta Kalma'} · {room.worldOptions?.difficulty === 0 ? 'Kolay' : room.worldOptions?.difficulty === 2 ? 'Zor' : 'Normal'}</div>
                  </div>
                  <div className={`font-mono font-bold ${room.currentPlayers >= room.maxPlayers ? 'text-red-400' : 'text-emerald-300'}`}>{room.currentPlayers}/{room.maxPlayers}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => { Sound.click(); setNewWorldName('Çevrimiçi Dünya'); setNewWorldSeed(''); setNewWorldDifficulty(1); setNewWorldMode('survival'); setOnlineMaxPlayers(1); setAppState('online_create'); }} className="mc-btn flex-1 bg-emerald-800 border-emerald-600">Lobi Oluştur</button>
              <button disabled={!selectedOnlineRoom || !onlineRooms.find((r) => r.id === selectedOnlineRoom)?.isOpen} onClick={() => { Sound.click(); sendOnlineMessage({ type: 'join_room', gameId: 'esekcraft', roomId: selectedOnlineRoom, platform: controlMode }); }} className="mc-btn flex-1">Katıl</button>
              <button onClick={() => { Sound.click(); closeOnlineConnection(); setAppState('play_menu'); }} className="mc-btn flex-1">Geri</button>
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
      {(appState === 'create_world' || appState === 'online_create') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="mc-panel p-6 flex flex-col gap-3.5 w-[420px] max-w-[92vw]">
            <h2 className="text-2xl font-bold text-white text-center drop-shadow-[2px_2px_0_#222] mb-1">
              {appState === 'online_create' ? 'Online Lobi Oluştur' : 'Dünya Oluştur'}
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

            {appState === 'online_create' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-[#ddd] w-24">Kişi Sayısı</label>
                <div className="flex items-center gap-2 flex-1">
                  <button type="button" onClick={() => setOnlineMaxPlayers(Math.max(1, onlineMaxPlayers - 1))} className="mc-btn !px-4 !py-1">−</button>
                  <span className="flex-1 text-center font-mono text-lg">{onlineMaxPlayers}</span>
                  <button type="button" onClick={() => setOnlineMaxPlayers(Math.min(6, onlineMaxPlayers + 1))} className="mc-btn !px-4 !py-1">+</button>
                  <span className="text-xs text-[#999]">(1–6)</span>
                </div>
              </div>
            )}
            {/* Buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  Sound.click();
                  if (appState === 'online_create') handleCreateOnlineRoom();
                  else handleCreateNewWorld();
                }}
                className="mc-btn flex-1 bg-emerald-800 border-emerald-600"
              >
                {appState === 'online_create' ? 'Lobiyi Oluştur!' : 'Dünyayı Oluştur!'}
              </button>
              <button
                onClick={() => {
                  Sound.click();
                  setAppState(appState === 'online_create' ? 'online_rooms' : 'worlds');
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
          <div className="mt-5 max-w-[390px] px-4 text-center text-xs leading-5 text-[#aeb7c4]">
            Arazi ve bloklar FPS değerine göre parça parça hazırlanıyor. İlk görüntü tamamen yüklenince oyun açılacak.
          </div>
          <div className="mt-3 max-w-[390px] px-4 text-center text-xs leading-5 text-amber-300">
            Uyarı: Oyun açıldıktan sonraki ilk birkaç dakika takılma veya FPS düşüşü olabilir; dünya arka planda yüklenirken performans kademeli olarak düzelebilir.
          </div>
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
