/**
 * Minecraft Web - UI Components, Inventory, 3x3 Crafting, Recipe Book, Furnace & Chest
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  BlockType,
  ItemType,
  AnyItemId,
  ItemStack,
  WorldMeta,
  FurnaceData,
  ChestData,
  CraftingRecipe,
  KeyBindings,
  DEFAULT_KEY_BINDINGS,
  isBedBlock,
  isDoorBlock,
  isUpperSlabBlock,
} from '../game/types';
import {
  BLOCK_DEFS,
  ITEM_DEFS,
  getItemIcon,
  getItemName,
} from '../game/textures';
import { CRAFTING_RECIPES, matchRecipe } from '../game/recipes';
import { Sound } from '../game/audio';
import * as THREE from 'three';
import { MinecraftEngine } from '../game/engine';
import { ControlsModal } from './ControlsModal';

interface MinecraftUIProps {
  engine: MinecraftEngine | null;
  uiState: string; // 'playing' | 'inventory' | 'crafting_table' | 'furnace' | 'chest' | 'paused' | 'dead' | 'title' | 'create_world'
  setUIState: (state: string) => void;
  onSaveAndQuit: () => void;
  onRespawn: () => void;
  toastMessage: string | null;
  keyBindings?: KeyBindings;
  onSaveKeyBindings?: (binds: KeyBindings) => void;
  onlinePlayers?: Record<string, any>;
  onlineIsAdmin?: boolean;
  onKickPlayer?: (id: string) => void;
  onlineSelfId?: string | null;
}

const Donkey3DPreview: React.FC<{ mousePos: { x: number; y: number } }> = ({ mousePos }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const donkeyRef = useRef<THREE.Group | null>(null);
  const headRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = 104;
    const height = 124;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.45, 3.4);
    camera.lookAt(0, 1.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Soft Studio Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 1.3);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // 3D Miniature Donkey Character Model
    const donkey = new THREE.Group();
    donkeyRef.current = donkey;

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    const lightMat = new THREE.MeshLambertMaterial({ color: 0xc9c4bb });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.6, 1.1), bodyMat);
    body.position.set(0, 0.95, 0);
    donkey.add(body);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 1.12), darkMat);
    spine.position.set(0, 1.26, 0);
    donkey.add(spine);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.36), bodyMat);
    neck.position.set(0, 1.32, -0.5);
    donkey.add(neck);

    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.48, 0.38), darkMat);
    mane.position.set(0, 1.42, -0.42);
    donkey.add(mane);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, -0.72);
    headRef.current = headGroup;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.5), bodyMat);
    headGroup.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.25, 0.22), lightMat);
    snout.position.set(0, -0.06, -0.32);
    headGroup.add(snout);

    const nostril1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), blackMat);
    nostril1.position.set(-0.09, -0.07, -0.43);
    headGroup.add(nostril1);
    const nostril2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), blackMat);
    nostril2.position.set(0.09, -0.07, -0.43);
    headGroup.add(nostril2);

    // Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), blackMat);
    eye1.position.set(-0.18, 0.07, -0.12);
    headGroup.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), blackMat);
    eye2.position.set(0.18, 0.07, -0.12);
    headGroup.add(eye2);

    // Long Donkey Ears
    const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.44, 0.09), bodyMat);
    ear1.position.set(-0.13, 0.38, 0.04);
    headGroup.add(ear1);
    const earInner1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.05), darkMat);
    earInner1.position.set(-0.13, 0.38, 0.05);
    headGroup.add(earInner1);

    const ear2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.44, 0.09), bodyMat);
    ear2.position.set(0.13, 0.38, 0.04);
    headGroup.add(ear2);
    const earInner2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.05), darkMat);
    earInner2.position.set(0.13, 0.38, 0.05);
    headGroup.add(earInner2);

    donkey.add(headGroup);

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 0.07), darkMat);
    tail.position.set(0, 0.92, 0.6);
    tail.rotation.x = 0.2;
    donkey.add(tail);

    // 4 Legs
    const legPositions = [
      [-0.22, -0.4],
      [0.22, -0.4],
      [-0.22, 0.4],
      [0.22, 0.4],
    ];
    for (const [lx, lz] of legPositions) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.16), bodyMat);
      leg.position.set(lx, 0.42, lz);
      donkey.add(leg);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), darkMat);
      hoof.position.set(lx, 0.1, lz);
      donkey.add(hoof);
    }

    // Envanter kamerası +Z tarafından baktığı için yüzü kameraya dönük tut.
    donkey.rotation.y = Math.PI + 0.45;
    scene.add(donkey);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Mouse tracking: rotate head and body slightly towards mouse pointer
      if (container && donkeyRef.current && headRef.current) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = (mousePos.x - centerX) / (window.innerWidth / 2);
        const dy = (mousePos.y - centerY) / (window.innerHeight / 2);

        // Body follows mouse gently
        const targetBodyYaw = Math.PI + 0.45 + dx * 0.6;
        donkeyRef.current.rotation.y += (targetBodyYaw - donkeyRef.current.rotation.y) * 0.1;

        // Head looks up/down and left/right towards mouse
        const targetHeadPitch = -dy * 0.4;
        const targetHeadYaw = dx * 0.5;
        headRef.current.rotation.x += (targetHeadPitch - headRef.current.rotation.x) * 0.15;
        headRef.current.rotation.y += (targetHeadYaw - headRef.current.rotation.y) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-[104px] h-[124px] overflow-hidden" />;
};

export const MinecraftUI: React.FC<MinecraftUIProps> = ({
  engine,
  uiState,
  setUIState,
  onSaveAndQuit,
  onRespawn,
  toastMessage,
  keyBindings,
  onSaveKeyBindings,
  onlinePlayers = {},
  onlineIsAdmin = false,
  onKickPlayer,
  onlineSelfId = null,
}) => {
  // Cursor item held in hand across all inventory/crafting menus
  const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);

  // 2x2 player crafting grid
  const [playerCraftGrid, setPlayerCraftGrid] = useState<(ItemStack | null)[]>(new Array(4).fill(null));

  // 3x3 table crafting grid
  const [tableCraftGrid, setTableCraftGrid] = useState<(ItemStack | null)[]>(new Array(9).fill(null));

  // Recipe book panel visibility and search/filter
  const [showRecipeBook, setShowRecipeBook] = useState(false);
  const [recipeCategory, setRecipeCategory] = useState<'all' | 'building' | 'tools' | 'combat' | 'survival'>('all');

  // Trigger state refresh on engine changes
  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);

  // Mouse move tracker for held cursor item
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Force exit pointer lock whenever any inventory/crafting modal is open
  useEffect(() => {
    const isModalOpen =
      uiState === 'inventory' ||
      uiState === 'crafting_table' ||
      uiState === 'furnace' ||
      uiState === 'chest';

    if (isModalOpen && engine) {
      engine.isGUIOpen = true;
      engine.isPaused = false;
      engine.exitPointerLock();
    }
  }, [uiState, engine]);

  // Minecraft-style TAB player list: hold Tab to show, release it to hide.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Tab' || (e.target as HTMLElement).tagName === 'INPUT') return;
      e.preventDefault();
      setShowPlayerList(true);
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Tab') setShowPlayerList(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  // Listen to Inventory key (dynamic keybinding, default 'KeyE') to open/close inventory
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const invKey = engine?.keyBindings?.inventory || keyBindings?.inventory || 'KeyE';
      if (e.code === invKey) {
        e.preventDefault();
        if (uiState === 'playing') {
          if (engine) engine.isGUIOpen = true;
          engine?.exitPointerLock();
          setUIState('inventory');
          Sound.click();
        } else if (
          uiState === 'inventory' ||
          uiState === 'crafting_table' ||
          uiState === 'furnace' ||
          uiState === 'chest'
        ) {
          closeOpenContainer();
        }
      } else if (e.code === 'Escape') {
        if (
          uiState === 'inventory' ||
          uiState === 'crafting_table' ||
          uiState === 'furnace' ||
          uiState === 'chest'
        ) {
          e.preventDefault();
          closeOpenContainer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState, engine, playerCraftGrid, tableCraftGrid, cursorItem]);

  // Cleanly close any open inventory and return floating items to player
  const closeOpenContainer = () => {
    if (!engine) return;

    // Return cursor item
    if (cursorItem) {
      const left = engine.addToInventory(cursorItem.id, cursorItem.count);
      if (left > 0) {
        engine.spawnDrop(engine.pos.x, engine.pos.y + 1, engine.pos.z, cursorItem.id, left);
      }
      setCursorItem(null);
    }

    // Return 2x2 craft grid items
    for (let i = 0; i < 4; i++) {
      const st = playerCraftGrid[i];
      if (st && st.count > 0) {
        const left = engine.addToInventory(st.id, st.count);
        if (left > 0) {
          engine.spawnDrop(engine.pos.x, engine.pos.y + 1, engine.pos.z, st.id, left);
        }
      }
    }
    setPlayerCraftGrid(new Array(4).fill(null));

    // Return 3x3 craft grid items
    for (let i = 0; i < 9; i++) {
      const st = tableCraftGrid[i];
      if (st && st.count > 0) {
        const left = engine.addToInventory(st.id, st.count);
        if (left > 0) {
          engine.spawnDrop(engine.pos.x, engine.pos.y + 1, engine.pos.z, st.id, left);
        }
      }
    }
    setTableCraftGrid(new Array(9).fill(null));

    engine.currentFurnacePos = null;
    engine.currentChestPos = null;
    engine.isGUIOpen = false;
    engine.isPaused = false;

    setUIState('playing');
    engine.requestPointerLock();
    engine.updateHeldItemModel();
    rerender();
  };

  // ================= GENERAL SLOT CLICK HANDLER =================
  const handleSlotClick = (
    currentStack: ItemStack | null,
    setStack: (newStack: ItemStack | null) => void,
    e: React.MouseEvent,
    allowedSlotType?: 'armor' | 'normal'
  ) => {
    e.preventDefault();
    if (!engine) return;

    const isRightClick = e.button === 2;
    const isShiftClick = e.shiftKey;

    // Quick Shift-Click transfer (e.g. between hotbar & inventory)
    if (isShiftClick && currentStack) {
      // Find destination in engine inventory
      const startIdx = engine.inventory.indexOf(currentStack);
      if (startIdx !== -1) {
        // If in hotbar (0-8), move to main inv (9-35); if in main inv, move to hotbar
        const destRange = startIdx < 9 ? [9, 36] : [0, 9];
        let moved = false;
        for (let i = destRange[0]; i < destRange[1]; i++) {
          if (!engine.inventory[i]) {
            engine.inventory[i] = { ...currentStack };
            setStack(null);
            moved = true;
            break;
          }
        }
        if (moved) {
          Sound.click();
          engine.updateHeldItemModel();
          rerender();
          return;
        }
      }
    }

    if (isRightClick) {
      // Right click: drop 1 from cursor or split slot stack in half
      if (cursorItem) {
        if (!currentStack) {
          setStack({ ...cursorItem, count: 1 });
          const newCount = cursorItem.count - 1;
          setCursorItem(newCount > 0 ? { ...cursorItem, count: newCount } : null);
          Sound.click();
        } else if (currentStack.id === cursorItem.id && currentStack.count < 64) {
          currentStack.count++;
          setStack({ ...currentStack });
          const newCount = cursorItem.count - 1;
          setCursorItem(newCount > 0 ? { ...cursorItem, count: newCount } : null);
          Sound.click();
        }
      } else if (currentStack) {
        // Split stack
        const half = Math.ceil(currentStack.count / 2);
        setCursorItem({ ...currentStack, count: half });
        const remain = currentStack.count - half;
        setStack(remain > 0 ? { ...currentStack, count: remain } : null);
        Sound.click();
      }
    } else {
      // Left click: pick up, swap, or merge stacks
      if (!cursorItem && currentStack) {
        setCursorItem({ ...currentStack });
        setStack(null);
        Sound.click();
      } else if (cursorItem && !currentStack) {
        setStack({ ...cursorItem });
        setCursorItem(null);
        Sound.click();
      } else if (cursorItem && currentStack) {
        if (cursorItem.id === currentStack.id) {
          const maxCanAdd = 64 - currentStack.count;
          const transfer = Math.min(maxCanAdd, cursorItem.count);
          currentStack.count += transfer;
          setStack({ ...currentStack });
          const remain = cursorItem.count - transfer;
          setCursorItem(remain > 0 ? { ...cursorItem, count: remain } : null);
          Sound.click();
        } else {
          // Swap stacks
          setStack({ ...cursorItem });
          setCursorItem({ ...currentStack });
          Sound.click();
        }
      }
    }

    engine.updateHeldItemModel();
    rerender();
  };

  // ================= CRAFTING OUTPUT CLICK HANDLER =================
  const handleCraftOutputClick = (grid: (ItemStack | null)[], setGrid: (g: (ItemStack | null)[]) => void, gridSize: 2 | 3) => {
    const matched = matchRecipe(grid, gridSize);
    if (!matched) return;

    const out = matched.output;

    // Can we pick up into cursor?
    if (cursorItem) {
      if (cursorItem.id !== out.id) return;
      if (cursorItem.count + out.count > 64) return;
      cursorItem.count += out.count;
      setCursorItem({ ...cursorItem });
    } else {
      setCursorItem({ ...out });
    }

    // Decrement 1 from every non-empty slot in the grid
    const nextGrid = [...grid];
    for (let i = 0; i < nextGrid.length; i++) {
      if (nextGrid[i]) {
        nextGrid[i]!.count--;
        if (nextGrid[i]!.count <= 0) {
          nextGrid[i] = null;
        }
      }
    }
    setGrid(nextGrid);
    Sound.craft();
    engine?.updateHeldItemModel();
    rerender();
  };

  // Recipe Book Auto-Fill
  const handleSelectRecipe = (recipe: CraftingRecipe, isTable: boolean) => {
    if (!engine) return;
    if (!isTable && (recipe.width > 2 || recipe.height > 2)) {
      Sound.hit();
      return; // Requires 3x3 crafting table!
    }

    const gridSize = isTable ? 3 : 2;
    const oldGrid = (isTable ? tableCraftGrid : playerCraftGrid).map((stack) => stack ? { ...stack } : null);
    const remainingGrid = oldGrid.map((stack) => stack ? { ...stack } : null);
    const nextInventory = engine.inventory.map((stack) => stack ? { ...stack } : null);
    const nextGrid: (ItemStack | null)[] = new Array(gridSize * gridSize).fill(null);
    const overflowDrops: ItemStack[] = [];

    // Prefer reusing items already in the crafting grid, then take only the missing items from inventory.
    const consumeOne = (id: AnyItemId): boolean => {
      for (const source of [remainingGrid, nextInventory]) {
        const index = source.findIndex((stack) => stack?.id === id && stack.count > 0);
        if (index < 0) continue;
        const stack = source[index]!;
        stack.count--;
        if (stack.count <= 0) source[index] = null;
        return true;
      }
      return false;
    };

    for (let r = 0; r < recipe.height; r++) {
      for (let c = 0; c < recipe.width; c++) {
        const id = recipe.pattern[r * recipe.width + c];
        if (id && consumeOne(id)) nextGrid[r * gridSize + c] = { id, count: 1 };
      }
    }

    // Return anything left in the old grid to a staged inventory before committing.
    const returnStack = (stack: ItemStack) => {
      let remaining = stack.count;
      for (let i = 0; i < nextInventory.length && remaining > 0; i++) {
        const existing = nextInventory[i];
        if (!existing || existing.id !== stack.id || existing.count >= 64) continue;
        const added = Math.min(64 - existing.count, remaining);
        existing.count += added;
        remaining -= added;
      }
      for (let i = 0; i < nextInventory.length && remaining > 0; i++) {
        if (nextInventory[i]) continue;
        const added = Math.min(64, remaining);
        nextInventory[i] = { ...stack, count: added };
        remaining -= added;
      }
      if (remaining > 0) overflowDrops.push({ ...stack, count: remaining });
    };
    for (const stack of remainingGrid) if (stack && stack.count > 0) returnStack(stack);

    for (let i = 0; i < engine.inventory.length; i++) engine.inventory[i] = nextInventory[i] ?? null;
    for (const stack of overflowDrops) engine.spawnDrop(engine.pos.x, engine.pos.y + 1, engine.pos.z, stack.id, stack.count);
    if (isTable) setTableCraftGrid(nextGrid);
    else setPlayerCraftGrid(nextGrid);

    engine.updateHeldItemModel();
    engine.onHUDUpdate?.();
    Sound.click();
    rerender();
  };

  // Render Item Slot Helper
  const renderSlot = (
    stack: ItemStack | null,
    onClick: (e: React.MouseEvent) => void,
    size = 44,
    customClass = ''
  ) => {
    return (
      <div
        className={`mc-slot pixelated ${customClass}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        onMouseDown={onClick}
        onContextMenu={(e) => e.preventDefault()}
        title={stack ? getItemName(stack.id) : ''}
      >
        {stack && (
          <>
            <img
              src={getItemIcon(stack.id)}
              alt={getItemName(stack.id)}
              className="w-8 h-8 pointer-events-none pixelated"
            />
            {stack.count > 1 && (
              <span className="absolute right-1 bottom-0 text-white font-mono font-bold text-xs pointer-events-none drop-shadow-[2px_2px_0_#222]">
                {stack.count}
              </span>
            )}
            {/* Tool Durability Bar */}
            {stack.durability !== undefined && stack.maxDurability && (
              <div className="absolute left-1 bottom-0.5 right-1 h-1 bg-black/70 pointer-events-none">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round((stack.durability / stack.maxDurability) * 100)}%`,
                    backgroundColor:
                      stack.durability / stack.maxDurability > 0.5
                        ? '#22c55e'
                        : stack.durability / stack.maxDurability > 0.25
                        ? '#eab308'
                        : '#ef4444',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Calculate matched outputs
  const playerCraftOutput = matchRecipe(playerCraftGrid, 2)?.output || null;
  const tableCraftOutput = matchRecipe(tableCraftGrid, 3)?.output || null;

  return (
    <>
      {/* ================= IN-GAME HUD ================= */}
      {uiState === 'playing' && engine && (
        <div className="fixed inset-0 pointer-events-none z-10 select-none">
          {/* Crosshair */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 mix-blend-difference pointer-events-none">
              <div className="absolute left-2 top-0 w-0.5 h-5 bg-white" />
              <div className="absolute left-0 top-2 w-5 h-0.5 bg-white" />
            </div>

            {/* Block Mining Progress Indicator Bar */}
            {engine.breakProgress > 0 && engine.breakingBlock && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-2 bg-black/80 border border-white/70 overflow-hidden shadow-md">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(engine.breakProgress * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/75 border border-yellow-400/50 px-4 py-1.5 rounded text-yellow-300 font-mono text-sm tracking-wide shadow-lg animate-bounce">
              {toastMessage}
            </div>
          )}

          {/* Damage Vignette */}
          {engine.damageFlashTimer > 0 && (
            <div
              className="absolute inset-0 bg-red-600 pointer-events-none transition-opacity duration-75"
              style={{ opacity: Math.max(0, Math.min(0.3, (engine.damageFlashTimer / 0.4) * 0.3)) }}
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <div className="px-2 py-1 bg-black/55 border border-white/20 text-white font-mono text-xs pointer-events-none">
              XYZ: {Math.floor(engine.pos.x)} / {Math.floor(engine.pos.y)} / {Math.floor(engine.pos.z)}
            </div>
            <div className={`w-fit px-2 py-1 bg-black/55 border font-mono text-xs pointer-events-none ${engine.fps < 30 ? 'border-red-500 text-red-300' : engine.fps < 55 ? 'border-yellow-500 text-yellow-200' : 'border-emerald-500 text-emerald-300'}`}>
              FPS: {engine.fps || '--'}
            </div>
          </div>
          {showPlayerList && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[520px] max-w-[94vw] bg-black/85 border-2 border-[#777] shadow-2xl p-3 pointer-events-auto">
              <div className="text-center font-mono font-bold text-white mb-2">ONLINE OYUNCULAR</div>
              <div className="flex flex-col gap-1">
                {Object.entries(onlinePlayers).map(([id, player]: [string, any]) => (
                  <div key={id} className="flex items-center justify-between px-2 py-1 bg-[#252525] border border-[#444] text-xs font-mono">
                    <span className={player.alive === false ? 'text-red-400' : 'text-white'}>
                      {player.name || 'Oyuncu'} {player.isAdmin ? <b className="text-yellow-300">[ADMIN]</b> : <span className="text-slate-400">[ÜYE]</span>}
                    </span>
                    {onlineIsAdmin && id !== onlineSelfId && (
                      <button onClick={() => onKickPlayer?.(id)} className="text-red-300 hover:text-red-100 border border-red-700 px-2 py-0.5">At</button>
                    )}
                  </div>
                ))}
                {Object.keys(onlinePlayers).length === 0 && <div className="text-center text-slate-400">Oyuncu listesi bekleniyor...</div>}
              </div>
              <div className="text-center text-[10px] text-slate-400 mt-2">TAB basılı tutulurken gösterilir</div>
            </div>
          )}

          {/* Bottom HUD: Hearts, Armor, Hunger, Level & Hotbar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
            {engine.gameMode !== 'creative' && <>
            {/* Status Bars (Hearts, Armor, Hunger) */}
            {/* Status Bars (Hearts, Armor, Hunger) - Spread across hotbar width without overflowing */}
            <div className="w-[404px] max-w-[94vw] flex justify-between items-end px-1 pb-1">
              {/* Hearts (Health) & Armor */}
              <div className="flex flex-col gap-1">
                {/* Armor Icons */}
                {engine.armor.some((a) => a !== null) && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="w-3.5 h-3.5 bg-slate-300 border border-slate-700 rounded-sm" />
                    ))}
                  </div>
                )}
                {/* Hearts */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const heartHp = engine.hp - i * 2;
                    return (
                      <div key={i} className="w-4 h-4 relative flex items-center justify-center">
                        <span
                          className={`text-base drop-shadow-[1px_1px_0_#000] ${
                            heartHp >= 2 ? 'text-red-600' : heartHp === 1 ? 'text-red-400' : 'text-neutral-800'
                          }`}
                        >
                          ♥
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hunger (Drumsticks) */}
              <div className="flex gap-0.5 flex-row-reverse">
                {Array.from({ length: 10 }).map((_, i) => {
                  const hungerPts = engine.hunger - i * 2;
                  return (
                    <div key={i} className="w-4 h-4 flex items-center justify-center text-sm font-bold">
                      <span
                        className={`drop-shadow-[1px_1px_0_#000] ${
                          hungerPts >= 2 ? 'text-amber-700' : hungerPts === 1 ? 'text-amber-500' : 'text-neutral-800'
                        }`}
                      >
                        🍗
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Readable numeric status bars: icons remain for the Minecraft look. */}
            <div className="w-[404px] max-w-[94vw] grid grid-cols-2 gap-2 px-1 text-[10px] font-mono font-bold drop-shadow-[1px_1px_0_#000]">
              <div className="flex items-center gap-1 text-red-200">
                <span className="w-8">CAN</span>
                <div className="h-2 flex-1 bg-black/75 border border-red-950 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-700 to-red-400 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (engine.hp / engine.maxHp) * 100))}%` }} />
                </div>
                <span className="w-9 text-right">{Math.ceil(engine.hp)}/{engine.maxHp}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-200">
                <span className="w-10">AÇLIK</span>
                <div className="h-2 flex-1 bg-black/75 border border-amber-950 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-700 to-yellow-300 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (engine.hunger / engine.maxHunger) * 100))}%` }} />
                </div>
                <span className="w-9 text-right">{Math.ceil(engine.hunger)}/{engine.maxHunger}</span>
              </div>
            </div>
            </>}
            {/* Experience Level & Bar */}
            <div className="relative w-[404px] max-w-[94vw] flex flex-col items-center">
              {engine.level > 0 && (
                <span className="text-[#55ff55] font-mono font-bold text-sm -mb-1 drop-shadow-[2px_2px_0_#000]">
                  {engine.level}
                </span>
              )}
              <div className="w-full h-1.5 bg-[#222222] border border-[#111111] rounded-none overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#55ff55] to-[#aaff55]"
                  style={{
                    width: `${Math.min(100, Math.round((engine.xp / ((engine.level + 1) * 7)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Hotbar (9 slots) */}
            <div className="flex items-end gap-2">
              {engine.offhand && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-mono text-white/80 drop-shadow-[1px_1px_0_#000]">SOL EL · F</span>
                  <div className="mc-slot relative">
                    <img src={getItemIcon(engine.offhand.id)} alt={getItemName(engine.offhand.id)} className="w-8 h-8 pointer-events-none pixelated" />
                    {engine.offhand.count > 1 && (
                      <span className="absolute right-1 bottom-0 text-white font-mono font-bold text-xs pointer-events-none drop-shadow-[2px_2px_0_#222]">{engine.offhand.count}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex bg-[#000000]/40 p-1 border-2 border-[#1a1a1a]">
                {engine.inventory.slice(0, 9).map((stack, idx) => (
                  <div
                    key={idx}
                    className={`mc-slot ${idx === engine.selectedSlot ? 'active-slot' : ''}`}
                  >
                    {stack && (
                      <>
                        <img
                          src={getItemIcon(stack.id)}
                          alt={getItemName(stack.id)}
                          className="w-8 h-8 pointer-events-none pixelated"
                        />
                        {stack.count > 1 && (
                          <span className="absolute right-1 bottom-0 text-white font-mono font-bold text-xs pointer-events-none drop-shadow-[2px_2px_0_#222]">
                            {stack.count}
                          </span>
                        )}
                        {stack.durability !== undefined && stack.maxDurability && (
                          <div className="absolute left-1 bottom-0.5 right-1 h-1 bg-black/70 pointer-events-none">
                            <div
                              className="h-full"
                              style={{
                                width: `${Math.round((stack.durability / stack.maxDurability) * 100)}%`,
                                backgroundColor:
                                  stack.durability / stack.maxDurability > 0.5
                                  ? '#22c55e'
                                  : stack.durability / stack.maxDurability > 0.25
                                  ? '#eab308'
                                  : '#ef4444',
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected item label tooltip */}
            {engine.inventory[engine.selectedSlot] && (
              <div className="text-white text-xs font-mono drop-shadow-[2px_2px_0_#000] -mt-1 tracking-wide">
                {getItemName(engine.inventory[engine.selectedSlot]!.id)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2x2 PLAYER INVENTORY ('E') ================= */}
      {uiState === 'inventory' && engine && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-[1px] cursor-default"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOpenContainer();
          }}
        >
          <div className="mc-panel p-4 flex gap-4 relative" onMouseDown={(e) => e.stopPropagation()}>
            {engine.gameMode === 'creative' && (
              <div className="absolute -top-28 left-0 right-0 bg-black/90 border-2 border-[#777] p-2 z-20">
                <div className="text-xs text-yellow-200 font-bold mb-1">CREATIVE BLOK PALETİ — sınırsız seçim</div>
                <div className="grid grid-cols-12 gap-1 max-h-24 overflow-y-auto">
                  {Object.entries(BLOCK_DEFS).filter(([id]) => {
                    const blockId = Number(id) as BlockType;
                    return blockId > 0 && blockId < 100 && blockId !== BlockType.FURNACE_LIT && !isUpperSlabBlock(blockId) && (!isDoorBlock(blockId) || blockId === BlockType.OAK_DOOR) && (!isBedBlock(blockId) || blockId === BlockType.BED);
                  }).map(([id, def]) => (
                    <button key={id} title={def.name} onClick={() => { engine.giveCreativeItem(Number(id) as AnyItemId); rerender(); }} className="mc-slot !w-9 !h-9 !p-0">
                      <img src={getItemIcon(Number(id) as AnyItemId)} alt={def.name} className="w-7 h-7 pixelated" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Left Zone: Armor Slots */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold text-[#444444] mb-1">Zırh</div>
              {engine.armor.map((stack, idx) =>
                renderSlot(stack, (e) =>
                  handleSlotClick(stack, (s) => (engine.armor[idx] = s), e, 'armor')
                )
              )}
              {/* Offhand slot */}
              <div className="mt-2">
                <div className="text-[10px] font-bold text-[#444444] mb-0.5">Sol El</div>
                {renderSlot(engine.offhand, (e) =>
                  handleSlotClick(engine.offhand, (s) => { engine.offhand = s; engine.updateHeldItemModel(); }, e)
                )}
              </div>
            </div>

            {/* Center-Right Main Area */}
            <div className="flex flex-col">
              {/* Top Row: 3D Character Box & 2x2 Crafting Area */}
              <div className="flex items-center gap-6 mb-4">
                {/* 3D Donkey Character Display */}
                <div className="w-28 h-36 bg-[#8b8b8b] border-2 border-[#373737] flex flex-col items-center justify-center p-1">
                  <div className="text-[10px] font-bold text-[#333] mb-0.5">Eşek (3D)</div>
                  <Donkey3DPreview mousePos={mousePos} />
                </div>

                {/* 2x2 Crafting Area */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-[#444444]">Üretim (2x2)</span>
                    <button
                      onClick={() => setShowRecipeBook(!showRecipeBook)}
                      className="mc-btn !py-0.5 !px-2 !text-xs bg-emerald-700 border-emerald-900"
                      title="Tarif Kitabını Aç/Kapat"
                    >
                      📖 Tarifler
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-1 bg-[#9e9e9e] p-1 border border-[#373737]">
                      {playerCraftGrid.map((stack, idx) =>
                        renderSlot(stack, (e) =>
                          handleSlotClick(
                            stack,
                            (s) => {
                              const next = [...playerCraftGrid];
                              next[idx] = s;
                              setPlayerCraftGrid(next);
                            },
                            e
                          )
                        )
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="text-2xl font-bold text-[#444444]">&rarr;</div>
                    {/* Output Slot */}
                    <div
                      className="mc-slot pixelated !w-[52px] !h-[52px] bg-[#9e9e9e] border-2 border-emerald-600"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCraftOutputClick(playerCraftGrid, setPlayerCraftGrid, 2);
                      }}
                      title={playerCraftOutput ? `${getItemName(playerCraftOutput.id)} (Üretmek için tıkla)` : ''}
                    >
                      {playerCraftOutput && (
                        <>
                          <img
                            src={getItemIcon(playerCraftOutput.id)}
                            alt={getItemName(playerCraftOutput.id)}
                            className="w-9 h-9 pointer-events-none pixelated"
                          />
                          {playerCraftOutput.count > 1 && (
                            <span className="absolute right-1 bottom-0 text-white font-mono font-bold text-sm pointer-events-none drop-shadow-[2px_2px_0_#222]">
                              {playerCraftOutput.count}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Player Inventory (27 slots: 9x3) */}
              <div className="text-xs font-bold text-[#444444] mb-1">Envanter</div>
              <div className="grid grid-cols-9 gap-1 mb-3">
                {engine.inventory.slice(9, 36).map((stack, idx) =>
                  renderSlot(stack, (e) =>
                    handleSlotClick(stack, (s) => (engine.inventory[idx + 9] = s), e)
                  )
                )}
              </div>

              {/* Hotbar (9 slots) */}
              <div className="grid grid-cols-9 gap-1 pt-2 border-t-2 border-[#9a9a9a]">
                {engine.inventory.slice(0, 9).map((stack, idx) =>
                  renderSlot(stack, (e) =>
                    handleSlotClick(stack, (s) => (engine.inventory[idx] = s), e)
                  )
                )}
              </div>
            </div>

            {/* Recipe Book Slide-Out Panel */}
            {showRecipeBook && (
              <div className="w-64 mc-panel !bg-[#d5d5d5] p-3 flex flex-col gap-2 max-h-[420px] overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#888] pb-1">
                  <span className="text-xs font-bold text-[#333]">Tarif Kitabı</span>
                  <button onClick={() => setShowRecipeBook(false)} className="text-xs text-red-700 font-bold">
                    ✕
                  </button>
                </div>
                {/* Category filter tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {(['all', 'building', 'tools', 'combat', 'survival'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setRecipeCategory(cat)}
                      className={`text-[11px] px-1.5 py-0.5 font-bold ${
                        recipeCategory === cat ? 'bg-emerald-700 text-white' : 'bg-[#aaa] text-black'
                      }`}
                    >
                      {cat === 'all'
                        ? 'Tümü'
                        : cat === 'building'
                        ? 'Yapı'
                        : cat === 'tools'
                        ? 'Alet'
                        : cat === 'combat'
                        ? 'Silah'
                        : 'Yaşam'}
                    </button>
                  ))}
                </div>
                {/* Recipe list */}
                <div className="flex-1 overflow-y-auto mc-scroll flex flex-col gap-1.5 pr-1">
                  {CRAFTING_RECIPES.filter(
                    (r) =>
                      (recipeCategory === 'all' || r.category === recipeCategory) &&
                      r.width <= 2 &&
                      r.height <= 2
                  ).map((recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe, false)}
                      className="p-1.5 bg-[#b8b8b8] hover:bg-[#868ddf]/40 border border-[#999] cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getItemIcon(recipe.output.id)}
                          alt={recipe.name}
                          className="w-7 h-7 pixelated"
                        />
                        <div>
                          <div className="text-xs font-bold text-black">{recipe.name}</div>
                          <div className="text-[10px] text-[#555]">
                            {recipe.output.count > 1 ? `x${recipe.output.count}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-800 font-bold">Üret</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button in Header */}
            <button
              onClick={closeOpenContainer}
              className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 bg-[#8b8b8b] hover:bg-red-800 hover:text-white border border-[#373737]"
            >
              ✕ Kapat
            </button>
          </div>
        </div>
      )}

      {/* ================= 3x3 CRAFTING TABLE GUI ================= */}
      {uiState === 'crafting_table' && engine && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-[1px] cursor-default"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOpenContainer();
          }}
        >
          <div className="mc-panel p-4 flex gap-4 relative" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-[#333]">Çalışma Masası (3x3 Crafting Table)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRecipeBook(!showRecipeBook)}
                    className="mc-btn !py-0.5 !px-2 !text-xs bg-emerald-700 border-emerald-900"
                  >
                    📖 Tarifler
                  </button>
                  <button
                    onClick={closeOpenContainer}
                    className="text-xs font-bold px-2 py-0.5 bg-[#8b8b8b] hover:bg-red-800 hover:text-white border border-[#373737]"
                  >
                    ✕ Kapat
                  </button>
                </div>
              </div>

              {/* 3x3 Crafting Grid Area */}
              <div className="flex items-center justify-center gap-6 mb-5 p-3 bg-[#a8a8a8] border-2 border-[#555]">
                {/* 3x3 Grid */}
                <div className="grid grid-cols-3 gap-1 bg-[#9e9e9e] p-1.5 border-2 border-[#373737]">
                  {tableCraftGrid.map((stack, idx) =>
                    renderSlot(stack, (e) =>
                      handleSlotClick(
                        stack,
                        (s) => {
                          const next = [...tableCraftGrid];
                          next[idx] = s;
                          setTableCraftGrid(next);
                        },
                        e
                      )
                    )
                  )}
                </div>

                {/* Big Arrow */}
                <div className="text-3xl font-bold text-[#333]">&rarr;</div>

                {/* Big Output Slot */}
                <div
                  className="mc-slot pixelated !w-[56px] !h-[56px] bg-[#9e9e9e] border-3 border-emerald-600"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCraftOutputClick(tableCraftGrid, setTableCraftGrid, 3);
                  }}
                  title={tableCraftOutput ? `${getItemName(tableCraftOutput.id)} (Üretmek için tıkla)` : ''}
                >
                  {tableCraftOutput && (
                    <>
                      <img
                        src={getItemIcon(tableCraftOutput.id)}
                        alt={getItemName(tableCraftOutput.id)}
                        className="w-10 h-10 pointer-events-none pixelated"
                      />
                      {tableCraftOutput.count > 1 && (
                        <span className="absolute right-1 bottom-0 text-white font-mono font-bold text-base pointer-events-none drop-shadow-[2px_2px_0_#222]">
                          {tableCraftOutput.count}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Main Player Inventory (27 slots) */}
              <div className="text-xs font-bold text-[#444444] mb-1">Envanter</div>
              <div className="grid grid-cols-9 gap-1 mb-3">
                {engine.inventory.slice(9, 36).map((stack, idx) =>
                  renderSlot(stack, (e) =>
                    handleSlotClick(stack, (s) => (engine.inventory[idx + 9] = s), e)
                  )
                )}
              </div>

              {/* Hotbar (9 slots) */}
              <div className="grid grid-cols-9 gap-1 pt-2 border-t-2 border-[#9a9a9a]">
                {engine.inventory.slice(0, 9).map((stack, idx) =>
                  renderSlot(stack, (e) =>
                    handleSlotClick(stack, (s) => (engine.inventory[idx] = s), e)
                  )
                )}
              </div>
            </div>

            {/* Recipe Book Panel for 3x3 */}
            {showRecipeBook && (
              <div className="w-72 mc-panel !bg-[#d5d5d5] p-3 flex flex-col gap-2 max-h-[460px] overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#888] pb-1">
                  <span className="text-xs font-bold text-[#333]">Tüm Minecraft Tarifleri</span>
                  <button onClick={() => setShowRecipeBook(false)} className="text-xs text-red-700 font-bold">
                    ✕
                  </button>
                </div>
                {/* Category filter tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {(['all', 'building', 'tools', 'combat', 'survival'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setRecipeCategory(cat)}
                      className={`text-[11px] px-1.5 py-0.5 font-bold ${
                        recipeCategory === cat ? 'bg-emerald-700 text-white' : 'bg-[#aaa] text-black'
                      }`}
                    >
                      {cat === 'all'
                        ? 'Tümü'
                        : cat === 'building'
                        ? 'Yapı'
                        : cat === 'tools'
                        ? 'Alet'
                        : cat === 'combat'
                        ? 'Silah'
                        : 'Yaşam'}
                    </button>
                  ))}
                </div>
                {/* Recipe list */}
                <div className="flex-1 overflow-y-auto mc-scroll flex flex-col gap-1.5 pr-1">
                  {CRAFTING_RECIPES.filter(
                    (r) => recipeCategory === 'all' || r.category === recipeCategory
                  ).map((recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe, true)}
                      className="p-1.5 bg-[#b8b8b8] hover:bg-[#868ddf]/40 border border-[#999] cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getItemIcon(recipe.output.id)}
                          alt={recipe.name}
                          className="w-7 h-7 pixelated"
                        />
                        <div>
                          <div className="text-xs font-bold text-black">{recipe.name}</div>
                          <div className="text-[10px] text-[#555]">
                            {recipe.output.count > 1 ? `x${recipe.output.count}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-800 font-bold">Üret</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= FURNACE GUI ================= */}
      {uiState === 'furnace' && engine && engine.currentFurnacePos && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-[1px] cursor-default"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOpenContainer();
          }}
        >
          {(() => {
            const idx = (engine.currentFurnacePos.y * 80 + engine.currentFurnacePos.z) * 80 + engine.currentFurnacePos.x;
            if (!engine.world.furnaces[idx]) {
              engine.world.furnaces[idx] = {
                input: null,
                fuel: null,
                output: null,
                burnTimeRemaining: 0,
                maxBurnTime: 0,
                cookProgress: 0,
                maxCookTime: 8,
              };
            }
            const f = engine.world.furnaces[idx];

            return (
              <div className="mc-panel p-4 flex flex-col gap-3 relative" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-[#333]">Ocak (Furnace)</span>
                  <button
                    onClick={closeOpenContainer}
                    className="text-xs font-bold px-2 py-0.5 bg-[#8b8b8b] hover:bg-red-800 hover:text-white border border-[#373737]"
                  >
                    ✕ Kapat
                  </button>
                </div>

                {/* Furnace Work Area */}
                <div className="flex items-center justify-center gap-6 p-4 bg-[#a8a8a8] border-2 border-[#555]">
                  {/* Left Column: Input item & Fuel item */}
                  <div className="flex flex-col items-center gap-2">
                    {/* Input slot */}
                    {renderSlot(f.input, (e) =>
                      handleSlotClick(f.input, (s) => (f.input = s), e)
                    )}

                    {/* Minecraft-style fuel gauge: remaining burn time / current fuel item burn time */}
                    <div className="flex flex-col items-center gap-0.5" title={`Yakıt: ${Math.ceil(f.burnTimeRemaining)} sn`}>
                      <div className="w-4 h-7 bg-[#333] border border-[#777] flex items-end">
                        <div className="w-full bg-orange-500 transition-all" style={{ height: `${Math.min(100, f.maxBurnTime > 0 ? (f.burnTimeRemaining / f.maxBurnTime) * 100 : 0)}%` }} />
                      </div>
                      <span className={`text-[10px] ${f.burnTimeRemaining > 0 ? 'text-amber-500' : 'text-[#666]'}`}>🔥</span>
                    </div>

                    {/* Fuel slot */}
                    {renderSlot(f.fuel, (e) =>
                      handleSlotClick(f.fuel, (s) => (f.fuel = s), e)
                    )}
                  </div>

                  {/* Smelting Progress Arrow */}
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-[#333]">&rarr;</div>
                    <div className="w-10 h-1.5 bg-[#333] mt-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${Math.round((f.cookProgress / (f.maxCookTime || 8)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Output Slot */}
                  {renderSlot(
                    f.output,
                    (e) => handleSlotClick(f.output, (s) => (f.output = s), e),
                    52
                  )}
                </div>

                {/* Main Player Inventory */}
                <div className="text-xs font-bold text-[#444444] mb-1">Envanter</div>
                <div className="grid grid-cols-9 gap-1 mb-2">
                  {engine.inventory.slice(9, 36).map((stack, i) =>
                    renderSlot(stack, (e) =>
                      handleSlotClick(stack, (s) => (engine.inventory[i + 9] = s), e)
                    )
                  )}
                </div>
                {/* Hotbar */}
                <div className="grid grid-cols-9 gap-1 pt-2 border-t-2 border-[#9a9a9a]">
                  {engine.inventory.slice(0, 9).map((stack, i) =>
                    renderSlot(stack, (e) =>
                      handleSlotClick(stack, (s) => (engine.inventory[i] = s), e)
                    )
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= CHEST GUI ================= */}
      {uiState === 'chest' && engine && engine.currentChestPos && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-[1px] cursor-default"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOpenContainer();
          }}
        >
          {(() => {
            const primary = engine.currentChestPos;
            const partner = engine.world.getAdjacentChest(primary.x, primary.y, primary.z);
            const chestPositions = partner
              ? [primary, partner].sort((a, b) => a.z - b.z || a.x - b.x)
              : [primary];
            const chestData = chestPositions.map((pos) => {
              const idx = (pos.y * 80 + pos.z) * 80 + pos.x;
              let data = engine.world.chests[idx];
              if (!data || !Array.isArray(data.slots)) {
                data = { slots: new Array(27).fill(null) };
                engine.world.chests[idx] = data;
              }
              while (data.slots.length < 27) data.slots.push(null);
              return data;
            });
            const chestSlots = chestData.flatMap((data) => data.slots.slice(0, 27));

            return (
              <div className="mc-panel p-4 flex flex-col gap-3 relative max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-[#333]">{chestPositions.length === 2 ? 'Büyük Sandık (54 Yuva)' : 'Sandık (27 Yuva)'}</span>
                  <button
                    onClick={closeOpenContainer}
                    className="text-xs font-bold px-2 py-0.5 bg-[#8b8b8b] hover:bg-red-800 hover:text-white border border-[#373737]"
                  >
                    ✕ Kapat
                  </button>
                </div>

                {/* One chest has 27 slots; a paired chest has 54. */}
                <div className="grid grid-cols-9 gap-1 p-2 bg-[#a8a8a8] border-2 border-[#555] mb-2">
                  {chestSlots.map((stack, i) =>
                    renderSlot(stack, (e) =>
                      handleSlotClick(stack, (s) => {
                        const data = chestData[Math.floor(i / 27)];
                        data.slots[i % 27] = s;
                      }, e)
                    )
                  )}
                </div>

                {/* Player Inventory */}
                <div className="text-xs font-bold text-[#444444] mb-1">Envanter</div>
                <div className="grid grid-cols-9 gap-1 mb-2">
                  {engine.inventory.slice(9, 36).map((stack, i) =>
                    renderSlot(stack, (e) =>
                      handleSlotClick(stack, (s) => (engine.inventory[i + 9] = s), e)
                    )
                  )}
                </div>
                {/* Hotbar */}
                <div className="grid grid-cols-9 gap-1 pt-2 border-t-2 border-[#9a9a9a]">
                  {engine.inventory.slice(0, 9).map((stack, i) =>
                    renderSlot(stack, (e) =>
                      handleSlotClick(stack, (s) => (engine.inventory[i] = s), e)
                    )
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= PAUSE MENU (ESC) ================= */}
      {uiState === 'paused' && engine && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/65">
          <div className="mc-panel p-6 flex flex-col items-center gap-3 min-w-[340px]">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-[2px_2px_0_#000]">
              Oyun Duraklatıldı
            </h2>

            <button
              onClick={() => {
                setUIState('playing');
                engine.isPaused = false;
                engine.requestPointerLock();
              }}
              className="mc-btn w-64"
            >
              Oyuna Dön
            </button>

            {/* Game mode toggle */}
            <button
              onClick={() => {
                engine.gameMode = engine.gameMode === 'survival' ? 'creative' : 'survival';
                if (engine.gameMode === 'survival') engine.isFlying = false;
                Sound.click();
                rerender();
              }}
              className="mc-btn w-64 text-sm"
            >
              Oyun Modu: {engine.gameMode === 'survival' ? 'Hayatta Kalma' : 'Yaratıcı (Creative)'}
            </button>

            {/* Settings (FOV & Sensitivity) */}
            <div className="w-full flex flex-col gap-2 my-2 p-2 bg-black/20 border border-[#888]">
              <div className="flex justify-between items-center text-xs text-white">
                <span>Görüş Açısı (FOV): {engine.fov}</span>
                <input
                  type="range"
                  min="60"
                  max="105"
                  value={engine.fov}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    engine.fov = val;
                    engine.camera.fov = val;
                    engine.camera.updateProjectionMatrix();
                    rerender();
                  }}
                  className="w-28"
                />
              </div>
              <div className="flex justify-between items-center text-xs text-white">
                <span>Hassasiyet: {Math.round(engine.mouseSensitivity * 100)}%</span>
                <input
                  type="range"
                  min="20"
                  max="250"
                  value={Math.round(engine.mouseSensitivity * 100)}
                  onChange={(e) => {
                    engine.mouseSensitivity = Number(e.target.value) / 100;
                    rerender();
                  }}
                  className="w-28"
                />
              </div>
            </div>

            {/* Render distance / chunk budget */}
            <div className="w-full flex flex-col gap-1 my-1 p-2 bg-black/20 border border-[#888]">
              <div className="flex justify-between items-center text-xs text-white">
                <span>Chunk / Görüş Mesafesi: {engine.renderDistance} blok</span>
                <span className="text-[10px] text-slate-300">16–80</span>
              </div>
              <input
                type="range"
                min="16"
                max="80"
                step="8"
                value={engine.renderDistance}
                onChange={(e) => { engine.setRenderDistance(Number(e.target.value)); rerender(); }}
                className="w-full accent-emerald-500"
              />
              <span className="text-[10px] text-slate-300">Düşük değer daha az blok çizer ve FPS’i artırır.</span>
            </div>

            {/* Controls Rebinding Button */}
            <button
              onClick={() => {
                Sound.click();
                setShowControlsModal(true);
              }}
              className="mc-btn w-64 text-sm bg-[#3a4a6a] border-[#6585c5]"
            >
              🎮 Kontroller (Tuş Atamaları)
            </button>

            <button onClick={onSaveAndQuit} className="mc-btn w-64 bg-red-900/60 border-red-700">
              Kaydet ve Çık
            </button>
          </div>
        </div>
      )}

      {/* ================= DEATH SCREEN ================= */}
      {uiState === 'dead' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-red-950/80">
          <div className="mc-panel p-6 flex flex-col items-center gap-4 min-w-[320px]">
            <h1 className="text-3xl font-bold text-red-500 drop-shadow-[2px_2px_0_#222]">
              Öldün!
            </h1>
            <p className="text-sm text-neutral-300">
              Tüm eşyaların korundu, yeniden doğarak devam edebilirsin.
            </p>
            <button
              onClick={() => {
                onRespawn();
                setUIState('playing');
                engine?.requestPointerLock();
              }}
              className="mc-btn w-60 bg-emerald-800 border-emerald-600"
            >
              Yeniden Doğ
            </button>
            <button onClick={onSaveAndQuit} className="mc-btn w-60">
              Ana Menüye Dön
            </button>
          </div>
        </div>
      )}

      {/* ================= CURSOR FLOATING ITEM ================= */}
      {cursorItem && (
        <div
          className="fixed pointer-events-none z-50 pixelated"
          style={{
            left: `${mousePos.x - 20}px`,
            top: `${mousePos.y - 20}px`,
          }}
        >
          <img
            src={getItemIcon(cursorItem.id)}
            alt={getItemName(cursorItem.id)}
            className="w-10 h-10 pixelated drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]"
          />
          {cursorItem.count > 1 && (
            <span className="absolute right-0 bottom-0 text-white font-mono font-bold text-sm drop-shadow-[2px_2px_0_#000]">
              {cursorItem.count}
            </span>
          )}
        </div>
      )}

      {/* Controls Rebinding Modal in Game */}
      <ControlsModal
        isOpen={showControlsModal}
        onClose={() => setShowControlsModal(false)}
        keyBindings={engine?.keyBindings || keyBindings || DEFAULT_KEY_BINDINGS}
        onSave={(newBinds) => {
          if (engine) engine.setKeyBindings(newBinds);
          onSaveKeyBindings?.(newBinds);
          rerender();
        }}
      />
    </>
  );
};
