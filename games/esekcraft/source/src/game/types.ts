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
}

export type DoorFacing = 0 | 1 | 2 | 3; // north, west, south, east

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

export function getDoorState(id: BlockType): { upper: boolean; open: boolean; facing: DoorFacing } | null {
  for (let facing = 0; facing < 4; facing++) {
    if (DOOR_LOWER_CLOSED[facing] === id) return { upper: false, open: false, facing: facing as DoorFacing };
    if (DOOR_UPPER_CLOSED[facing] === id) return { upper: true, open: false, facing: facing as DoorFacing };
    if (DOOR_LOWER_OPEN[facing] === id) return { upper: false, open: true, facing: facing as DoorFacing };
    if (DOOR_UPPER_OPEN[facing] === id) return { upper: true, open: true, facing: facing as DoorFacing };
  }
  return null;
}

export function getDoorBlockId(upper: boolean, facing: DoorFacing, open: boolean): BlockType {
  const states = open
    ? (upper ? DOOR_UPPER_OPEN : DOOR_LOWER_OPEN)
    : (upper ? DOOR_UPPER_CLOSED : DOOR_LOWER_CLOSED);
  return states[facing];
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
  
  // Tools
  WOODEN_PICKAXE = 110,
  STONE_PICKAXE = 111,
  IRON_PICKAXE = 112,
  DIAMOND_PICKAXE = 113,
  
  WOODEN_AXE = 120,
  STONE_AXE = 121,
  IRON_AXE = 122,
  DIAMOND_AXE = 123,
  
  WOODEN_SHOVEL = 130,
  STONE_SHOVEL = 131,
  IRON_SHOVEL = 132,
  DIAMOND_SHOVEL = 133,
  
  WOODEN_SWORD = 140,
  STONE_SWORD = 141,
  IRON_SWORD = 142,
  DIAMOND_SWORD = 143,

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
export type ToolMaterial = 'wood' | 'stone' | 'iron' | 'diamond';

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
