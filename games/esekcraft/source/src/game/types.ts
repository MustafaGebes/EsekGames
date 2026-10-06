/**
 * Minecraft Web - Types and Constants
 */

export const SX = 80;
export const SY = 64;
export const SZ = 80;
export const MAX_STACK = 64;

// Block Types
export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  BEDROCK = 4,
  OAK_LOG = 5,
  OAK_LEAVES = 6,
  OAK_PLANKS = 7,
  COBBLESTONE = 8,
  CRAFTING_TABLE = 9,
  FURNACE = 10,
  FURNACE_LIT = 11,
  CHEST = 12,
  TORCH = 13,
  COAL_ORE = 14,
  IRON_ORE = 15,
  GOLD_ORE = 16,
  DIAMOND_ORE = 17,
  SAND = 18,
  GLASS = 19,
  BRICKS = 20,
  MOSSY_COBBLE = 21,
  OBSIDIAN = 22,
  OAK_DOOR = 23,
  BED = 24,
  WHITE_WOOL_BLOCK = 25,
  STONE_SLAB = 26,
  OAK_PLANKS_SLAB = 27,
  STONE_SLAB_TOP = 28,
  OAK_PLANKS_SLAB_TOP = 29,
  OAK_DOOR_WEST = 30,
  OAK_DOOR_SOUTH = 31,
  OAK_DOOR_EAST = 32,
  OAK_DOOR_TOP = 33,
  OAK_DOOR_TOP_WEST = 34,
  OAK_DOOR_TOP_SOUTH = 35,
  OAK_DOOR_TOP_EAST = 36,
  OAK_DOOR_OPEN = 37,
  OAK_DOOR_OPEN_WEST = 38,
  OAK_DOOR_OPEN_SOUTH = 39,
  OAK_DOOR_OPEN_EAST = 40,
  OAK_DOOR_TOP_OPEN = 41,
  OAK_DOOR_TOP_OPEN_WEST = 42,
  OAK_DOOR_TOP_OPEN_SOUTH = 43,
  OAK_DOOR_TOP_OPEN_EAST = 44,
  BED_FOOT_WEST = 45,
  BED_FOOT_SOUTH = 46,
  BED_FOOT_EAST = 47,
  BED_HEAD_NORTH = 48,
  BED_HEAD_WEST = 49,
  BED_HEAD_SOUTH = 50,
  BED_HEAD_EAST = 51,
  OAK_DOOR_RIGHT_HINGE = 52,
  OAK_DOOR_WEST_RIGHT_HINGE = 53,
  OAK_DOOR_SOUTH_RIGHT_HINGE = 54,
  OAK_DOOR_EAST_RIGHT_HINGE = 55,
  OAK_DOOR_TOP_RIGHT_HINGE = 56,
  OAK_DOOR_TOP_WEST_RIGHT_HINGE = 57,
  OAK_DOOR_TOP_SOUTH_RIGHT_HINGE = 58,
  OAK_DOOR_TOP_EAST_RIGHT_HINGE = 59,
  OAK_DOOR_OPEN_RIGHT_HINGE = 60,
  OAK_DOOR_OPEN_WEST_RIGHT_HINGE = 61,
  OAK_DOOR_OPEN_SOUTH_RIGHT_HINGE = 62,
  OAK_DOOR_OPEN_EAST_RIGHT_HINGE = 63,
  OAK_DOOR_TOP_OPEN_RIGHT_HINGE = 64,
  OAK_DOOR_TOP_OPEN_WEST_RIGHT_HINGE = 65,
  OAK_DOOR_TOP_OPEN_SOUTH_RIGHT_HINGE = 66,
  OAK_DOOR_TOP_OPEN_EAST_RIGHT_HINGE = 67,
}

export type DoorFacing = 0 | 1 | 2 | 3; // north, west, south, east
export type DoorHinge = 'left' | 'right';

const DOOR_LOWER_CLOSED: readonly BlockType[] = [
  BlockType.OAK_DOOR, BlockType.OAK_DOOR_WEST, BlockType.OAK_DOOR_SOUTH, BlockType.OAK_DOOR_EAST,
];
const DOOR_UPPER_CLOSED: readonly BlockType[] = [
  BlockType.OAK_DOOR_TOP, BlockType.OAK_DOOR_TOP_WEST, BlockType.OAK_DOOR_TOP_SOUTH, BlockType.OAK_DOOR_TOP_EAST,
];
const DOOR_LOWER_OPEN: readonly BlockType[] = [
  BlockType.OAK_DOOR_OPEN, BlockType.OAK_DOOR_OPEN_WEST, BlockType.OAK_DOOR_OPEN_SOUTH, BlockType.OAK_DOOR_OPEN_EAST,
];
const DOOR_UPPER_OPEN: readonly BlockType[] = [
  BlockType.OAK_DOOR_TOP_OPEN, BlockType.OAK_DOOR_TOP_OPEN_WEST, BlockType.OAK_DOOR_TOP_OPEN_SOUTH, BlockType.OAK_DOOR_TOP_OPEN_EAST,
];
const DOOR_LOWER_CLOSED_RIGHT: readonly BlockType[] = [
  BlockType.OAK_DOOR_RIGHT_HINGE, BlockType.OAK_DOOR_WEST_RIGHT_HINGE, BlockType.OAK_DOOR_SOUTH_RIGHT_HINGE, BlockType.OAK_DOOR_EAST_RIGHT_HINGE,
];
const DOOR_UPPER_CLOSED_RIGHT: readonly BlockType[] = [
  BlockType.OAK_DOOR_TOP_RIGHT_HINGE, BlockType.OAK_DOOR_TOP_WEST_RIGHT_HINGE, BlockType.OAK_DOOR_TOP_SOUTH_RIGHT_HINGE, BlockType.OAK_DOOR_TOP_EAST_RIGHT_HINGE,
];
const DOOR_LOWER_OPEN_RIGHT: readonly BlockType[] = [
  BlockType.OAK_DOOR_OPEN_RIGHT_HINGE, BlockType.OAK_DOOR_OPEN_WEST_RIGHT_HINGE, BlockType.OAK_DOOR_OPEN_SOUTH_RIGHT_HINGE, BlockType.OAK_DOOR_OPEN_EAST_RIGHT_HINGE,
];
const DOOR_UPPER_OPEN_RIGHT: readonly BlockType[] = [
  BlockType.OAK_DOOR_TOP_OPEN_RIGHT_HINGE, BlockType.OAK_DOOR_TOP_OPEN_WEST_RIGHT_HINGE, BlockType.OAK_DOOR_TOP_OPEN_SOUTH_RIGHT_HINGE, BlockType.OAK_DOOR_TOP_OPEN_EAST_RIGHT_HINGE,
];

export function getDoorState(id: BlockType): { upper: boolean; open: boolean; facing: DoorFacing; hinge: DoorHinge } | null {
  for (let facing = 0; facing < 4; facing++) {
    if (DOOR_LOWER_CLOSED[facing] === id) return { upper: false, open: false, facing: facing as DoorFacing, hinge: 'left' };
    if (DOOR_UPPER_CLOSED[facing] === id) return { upper: true, open: false, facing: facing as DoorFacing, hinge: 'left' };
    if (DOOR_LOWER_OPEN[facing] === id) return { upper: false, open: true, facing: facing as DoorFacing, hinge: 'left' };
    if (DOOR_UPPER_OPEN[facing] === id) return { upper: true, open: true, facing: facing as DoorFacing, hinge: 'left' };
    if (DOOR_LOWER_CLOSED_RIGHT[facing] === id) return { upper: false, open: false, facing: facing as DoorFacing, hinge: 'right' };
    if (DOOR_UPPER_CLOSED_RIGHT[facing] === id) return { upper: true, open: false, facing: facing as DoorFacing, hinge: 'right' };
    if (DOOR_LOWER_OPEN_RIGHT[facing] === id) return { upper: false, open: true, facing: facing as DoorFacing, hinge: 'right' };
    if (DOOR_UPPER_OPEN_RIGHT[facing] === id) return { upper: true, open: true, facing: facing as DoorFacing, hinge: 'right' };
  }
  return null;
}

export function getDoorBlockId(upper: boolean, facing: DoorFacing, open: boolean, hinge: DoorHinge = 'left'): BlockType {
  const states = hinge === 'right'
    ? (open ? (upper ? DOOR_UPPER_OPEN_RIGHT : DOOR_LOWER_OPEN_RIGHT) : (upper ? DOOR_UPPER_CLOSED_RIGHT : DOOR_LOWER_CLOSED_RIGHT))
    : (open ? (upper ? DOOR_UPPER_OPEN : DOOR_LOWER_OPEN) : (upper ? DOOR_UPPER_CLOSED : DOOR_LOWER_CLOSED));
  return states[facing];
}

export interface DoorLocalBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Shared hinge-aware panel bounds for mesh, raycast, outline and player collision. */
export function getDoorLocalBounds(id: BlockType): DoorLocalBounds | null {
  const state = getDoorState(id);
  if (!state) return null;

  if (state.open) {
    // When open, the leaf rotates out of the doorway and hugs the stored hinge edge.
    const leftEdge = state.facing === 0 ? 'minX' : state.facing === 1 ? 'maxZ' : state.facing === 2 ? 'maxX' : 'minZ';
    const rightEdge = state.facing === 0 ? 'maxX' : state.facing === 1 ? 'minZ' : state.facing === 2 ? 'minX' : 'maxZ';
    const edge = state.hinge === 'left' ? leftEdge : rightEdge;
    if (edge === 'minX') return { minX: 0, maxX: 0.125, minZ: 0.05, maxZ: 0.95 };
    if (edge === 'maxX') return { minX: 0.875, maxX: 1, minZ: 0.05, maxZ: 0.95 };
    if (edge === 'minZ') return { minX: 0.05, maxX: 0.95, minZ: 0, maxZ: 0.125 };
    return { minX: 0.05, maxX: 0.95, minZ: 0.875, maxZ: 1 };
  }

  // Closed leaves lie across X for north/south and across Z for west/east.
  const widthAlongX = state.facing % 2 === 0;
  return widthAlongX
    ? { minX: 0.05, maxX: 0.95, minZ: 0.4375, maxZ: 0.5625 }
    : { minX: 0.4375, maxX: 0.5625, minZ: 0.05, maxZ: 0.95 };
}

/** Pick the hinge on the outside edge, away from an adjacent matching door. */
export function getDoorHingeAwayFromNeighbor(facing: DoorFacing, neighborDx: number, neighborDz: number): DoorHinge {
  const awayEdge = facing % 2 === 0
    ? (neighborDx < 0 ? 'maxX' : 'minX')
    : (neighborDz < 0 ? 'maxZ' : 'minZ');
  const leftEdge = facing === 0 ? 'minX' : facing === 1 ? 'maxZ' : facing === 2 ? 'maxX' : 'minZ';
  return awayEdge === leftEdge ? 'left' : 'right';
}

/** Finds the adjacent, same-facing door leaf that forms a horizontal double door. */
export function findAdjacentDoorPair(
  getBlock: (x: number, y: number, z: number) => BlockType,
  x: number,
  y: number,
  z: number,
  facing: DoorFacing,
): { x: number; z: number } | null {
  const offsets = facing % 2 === 0
    ? [{ x: -1, z: 0 }, { x: 1, z: 0 }]
    : [{ x: 0, z: -1 }, { x: 0, z: 1 }];

  for (const offset of offsets) {
    const neighborX = x + offset.x;
    const neighborZ = z + offset.z;
    const lower = getDoorState(getBlock(neighborX, y, neighborZ));
    const upper = getDoorState(getBlock(neighborX, y + 1, neighborZ));
    if (lower && !lower.upper && lower.facing === facing && upper?.upper && upper.facing === facing) {
      return { x: neighborX, z: neighborZ };
    }
  }
  return null;
}

export function isDoorBlock(id: BlockType): boolean {
  return getDoorState(id) !== null;
}

export type BedFacing = DoorFacing;

const BED_FOOT: readonly BlockType[] = [
  BlockType.BED, BlockType.BED_FOOT_WEST, BlockType.BED_FOOT_SOUTH, BlockType.BED_FOOT_EAST,
];
const BED_HEAD: readonly BlockType[] = [
  BlockType.BED_HEAD_NORTH, BlockType.BED_HEAD_WEST, BlockType.BED_HEAD_SOUTH, BlockType.BED_HEAD_EAST,
];

export function getBedState(id: BlockType): { head: boolean; facing: BedFacing } | null {
  switch (id) {
    case BlockType.BED: return { head: false, facing: 0 };
    case BlockType.BED_FOOT_WEST: return { head: false, facing: 1 };
    case BlockType.BED_FOOT_SOUTH: return { head: false, facing: 2 };
    case BlockType.BED_FOOT_EAST: return { head: false, facing: 3 };
    case BlockType.BED_HEAD_NORTH: return { head: true, facing: 0 };
    case BlockType.BED_HEAD_WEST: return { head: true, facing: 1 };
    case BlockType.BED_HEAD_SOUTH: return { head: true, facing: 2 };
    case BlockType.BED_HEAD_EAST: return { head: true, facing: 3 };
    default: return null;
  }
}

export function getBedBlockId(head: boolean, facing: BedFacing): BlockType {
  return (head ? BED_HEAD : BED_FOOT)[facing];
}

export function isBedBlock(id: BlockType): boolean {
  return id === BlockType.BED || (id >= BlockType.BED_FOOT_WEST && id <= BlockType.BED_HEAD_EAST);
}

export function isUpperSlabBlock(id: BlockType): boolean {
  return id === BlockType.STONE_SLAB_TOP || id === BlockType.OAK_PLANKS_SLAB_TOP;
}

export function isSlabBlock(id: BlockType): boolean {
  return id === BlockType.STONE_SLAB || id === BlockType.OAK_PLANKS_SLAB || isUpperSlabBlock(id);
}

export function getSlabBaseBlock(id: BlockType): BlockType {
  if (id === BlockType.STONE_SLAB_TOP) return BlockType.STONE_SLAB;
  if (id === BlockType.OAK_PLANKS_SLAB_TOP) return BlockType.OAK_PLANKS_SLAB;
  return id;
}

export function getBlockOffsetY(id: BlockType): number {
  return isUpperSlabBlock(id) ? 0.5 : 0;
}

export function getBlockHeight(id: BlockType): number {
  if (id === BlockType.AIR || id === BlockType.TORCH) return 0;
  if (isBedBlock(id)) return 0.5625;
  return isSlabBlock(id) ? 0.5 : 1;
}

// Non-Block Items
export enum ItemType {
  STICK = 100,
  COAL = 101,
  CHARCOAL = 102,
  IRON_INGOT = 103,
  GOLD_INGOT = 104,
  DIAMOND = 105,
  FLINT = 106,
  RAW_IRON = 107,
  RAW_GOLD = 108,
  OAK_SAPLING = 109,
  
  // Tools
  WOODEN_PICKAXE = 110,
  STONE_PICKAXE = 111,
  IRON_PICKAXE = 112,
  DIAMOND_PICKAXE = 113,
  GOLD_PICKAXE = 114,
  
  WOODEN_AXE = 120,
  STONE_AXE = 121,
  IRON_AXE = 122,
  DIAMOND_AXE = 123,
  GOLD_AXE = 124,
  
  WOODEN_SHOVEL = 130,
  STONE_SHOVEL = 131,
  IRON_SHOVEL = 132,
  DIAMOND_SHOVEL = 133,
  GOLD_SHOVEL = 134,
  
  WOODEN_SWORD = 140,
  STONE_SWORD = 141,
  IRON_SWORD = 142,
  DIAMOND_SWORD = 143,
  GOLD_SWORD = 144,

  // Food
  APPLE = 150,
  BREAD = 151,
  RAW_BEEF = 152,
  COOKED_STEAK = 153,
  RAW_PORKCHOP = 154,
  COOKED_PORKCHOP = 155,
  RAW_MUTTON = 156,
  COOKED_MUTTON = 157,
  RAW_CHICKEN = 158,
  COOKED_CHICKEN = 159,

  // Drops & Materials
  LEATHER = 171,
  FEATHER = 172,
  WHITE_WOOL = 173,
  SHEARS = 174,

  // Armor
  IRON_HELMET = 160,
  IRON_CHESTPLATE = 161,
  IRON_LEGGINGS = 162,
  IRON_BOOTS = 163,
  DIAMOND_CHESTPLATE = 164,
  LEATHER_HELMET = 175,
  LEATHER_CHESTPLATE = 176,
  LEATHER_LEGGINGS = 177,
  LEATHER_BOOTS = 178,
  GOLD_HELMET = 179,
  GOLD_CHESTPLATE = 180,
  GOLD_LEGGINGS = 181,
  GOLD_BOOTS = 182,
  DIAMOND_HELMET = 183,
  DIAMOND_LEGGINGS = 184,
  DIAMOND_BOOTS = 185,
}

export enum MobType {
  COW = 'cow',
  PIG = 'pig',
  SHEEP = 'sheep',
  CHICKEN = 'chicken',
}

export interface KeyBindings {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  sprint: string;
  sneak: string;
  inventory: string;
  drop: string;
  offhand: string;
  perspective: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  sprint: 'ShiftLeft',
  sneak: 'KeyC',
  inventory: 'KeyE',
  drop: 'KeyQ',
  offhand: 'KeyF',
  perspective: 'F5',
};

export type AnyItemId = BlockType | ItemType;

export interface ItemStack {
  id: AnyItemId;
  count: number;
  durability?: number;
  maxDurability?: number;
}

export type ToolType = 'pickaxe' | 'axe' | 'shovel' | 'sword' | 'none';
export type ToolMaterial = 'wood' | 'stone' | 'iron' | 'gold' | 'diamond';

export interface ToolDef {
  type: ToolType;
  material: ToolMaterial;
  durability: number;
  speed: number;
  damage: number;
  harvestLevel: number; // 0=wood, 1=stone, 2=iron, 3=diamond
}

export interface BlockDef {
  name: string;
  top: number;
  bottom: number;
  side: number;
  front?: number;
  frontFaces?: readonly number[];
  hardness: number; // break time base in seconds
  requiredTool: ToolType;
  minHarvestLevel: number;
  drop: AnyItemId | null;
  dropCount?: number;
  transparent?: boolean;
  light?: number;
}

export interface ItemDef {
  name: string;
  iconIndex?: number;
  tool?: ToolDef;
  food?: {
    healHp: number;
    foodPoints: number;
    saturation: number;
  };
  armor?: {
    slot: 'helmet' | 'chest' | 'legs' | 'feet';
    material: 'leather' | 'iron' | 'gold' | 'diamond';
    defense: number;
    durability: number;
  };
  fuelValue?: number; // seconds it burns in furnace
}

export interface CraftingRecipe {
  id: string;
  name: string;
  width: number;
  height: number;
  pattern: (AnyItemId | null)[];
  output: ItemStack;
  category: 'building' | 'tools' | 'combat' | 'survival';
}

export interface FurnaceData {
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  burnTimeRemaining: number;
  maxBurnTime: number;
  cookProgress: number;
  maxCookTime: number;
}

export interface ChestData {
  slots: (ItemStack | null)[];
  /** Explicit partner block index; null marks a single chest beside an existing pair. */
  pairedWith?: number | null;
}

export interface WorldMeta {
  id: string;
  name: string;
  seed: string;
  difficulty: number;
  gameMode: 'survival' | 'creative';
  created: number;
  saved: number;
  mods?: Record<number, number>;
  furnaces?: Record<number, FurnaceData>;
  chests?: Record<number, ChestData>;
  player?: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    hp: number;
    hunger: number;
    xp: number;
    level: number;
    sel: number;
    inv: (ItemStack | null)[];
    armor: (ItemStack | null)[];
    offhand: ItemStack | null;
  };
}

export interface MobEntity {
  id: string;
  type: MobType;
  mesh: any; // THREE.Group
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  yaw: number;
  hp: number;
  maxHp: number;
  hurtTimer: number;
  wanderTimer: number;
  soundTimer: number;
  walkPhase: number;
  isPanicking: boolean;
  panicTimer: number;
  woolAvailable?: boolean;
  woolRegrowTimer?: number;
}
