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
