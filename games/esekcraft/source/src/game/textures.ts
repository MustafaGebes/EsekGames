/**
 * Minecraft Texture Atlas & Icon Generator
 * Generates 16x16 pixel-art tiles into a Three.js Texture Atlas & HTML Icon Cache
 */
import * as THREE from 'three';
import { BlockType, ItemType, AnyItemId, BlockDef, ItemDef, getBedState, getDoorState } from './types';

// Pseudo-random helper for deterministic textures
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ATLAS_SIZE = 256;
export const TILE_SIZE = 16;
export const TILES_PER_ROW = 16;

// Atlas Tile Indexes
export const TILE = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  BEDROCK: 4,
  LOG_SIDE: 5,
  LOG_TOP: 6,
  LEAVES: 7,
  PLANKS: 8,
  COBBLE: 9,
  CRAFT_TOP: 10,
  CRAFT_FRONT: 11,
  CRAFT_SIDE: 12,
  FURNACE_FRONT: 13,
  FURNACE_LIT: 14,
  FURNACE_SIDE: 15,
  CHEST_TOP: 16,
  CHEST_FRONT: 17,
  CHEST_SIDE: 18,
  COAL_ORE: 19,
  IRON_ORE: 20,
  GOLD_ORE: 21,
  DIAMOND_ORE: 22,
  SAND: 23,
  GLASS: 24,
  BRICKS: 25,
  MOSSY_COBBLE: 26,
  OBSIDIAN: 27,
  TORCH: 28,

  // Item-only tile slots (used for mob drops, ores, ingots, food, tools, etc.)
  ITEM_STICK: 29,
  ITEM_COAL: 30,
  ITEM_CHARCOAL: 31,
  ITEM_IRON_INGOT: 32,
  ITEM_GOLD_INGOT: 33,
  ITEM_DIAMOND: 34,
  ITEM_FLINT: 35,
  ITEM_APPLE: 36,
  ITEM_BREAD: 37,
  ITEM_RAW_BEEF: 38,
  ITEM_COOKED_STEAK: 39,
  ITEM_RAW_PORKCHOP: 40,
  ITEM_COOKED_PORKCHOP: 41,
  ITEM_RAW_MUTTON: 42,
  ITEM_COOKED_MUTTON: 43,
  ITEM_RAW_CHICKEN: 44,
  ITEM_COOKED_CHICKEN: 45,
  ITEM_LEATHER: 46,
  ITEM_FEATHER: 47,
  ITEM_WHITE_WOOL: 48,
  ITEM_RAW_IRON: 49,
  ITEM_RAW_GOLD: 50,
  ITEM_OAK_DOOR: 51,
  WOOL: 48,
  SHEARS: 52,
  DOOR_LOWER: 53,
  DOOR_UPPER: 54,
  BED_TOP_FOOT: 55,
  BED_HEAD_NORTH: 56,
  BED_HEAD_WEST: 57,
  BED_HEAD_SOUTH: 58,
  BED_HEAD_EAST: 59,
  BED_FRAME: 60,
  BED_SIDE: 61,
  BED_END: 62,
  SAPLING: 63,
};

export const BLOCK_DEFS: Record<number, BlockDef> = {
  [BlockType.GRASS]: {
    name: 'Çim Blok',
    top: TILE.GRASS_TOP,
    bottom: TILE.DIRT,
    side: TILE.GRASS_SIDE,
    hardness: 0.6,
    requiredTool: 'shovel',
    minHarvestLevel: 0,
    drop: BlockType.DIRT,
  },
  [BlockType.DIRT]: {
    name: 'Toprak',
    top: TILE.DIRT,
    bottom: TILE.DIRT,
    side: TILE.DIRT,
    hardness: 0.5,
    requiredTool: 'shovel',
    minHarvestLevel: 0,
    drop: BlockType.DIRT,
  },
  [BlockType.STONE]: {
    name: 'Taş',
    top: TILE.STONE,
    bottom: TILE.STONE,
    side: TILE.STONE,
    hardness: 1.5,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.COBBLESTONE,
  },
  [BlockType.COBBLESTONE]: {
    name: 'Kırık Taş',
    top: TILE.COBBLE,
    bottom: TILE.COBBLE,
    side: TILE.COBBLE,
    hardness: 2.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.COBBLESTONE,
  },
  [BlockType.BEDROCK]: {
    name: 'Katman Kayası',
    top: TILE.BEDROCK,
    bottom: TILE.BEDROCK,
    side: TILE.BEDROCK,
    hardness: Infinity,
    requiredTool: 'none',
    minHarvestLevel: 99,
    drop: null,
  },
  [BlockType.OAK_LOG]: {
    name: 'Meşe Kütüğü',
    top: TILE.LOG_TOP,
    bottom: TILE.LOG_TOP,
    side: TILE.LOG_SIDE,
    hardness: 2.0,
    requiredTool: 'axe',
    minHarvestLevel: 0,
    drop: BlockType.OAK_LOG,
  },
  [BlockType.OAK_LEAVES]: {
    name: 'Meşe Yaprakları',
    top: TILE.LEAVES,
    bottom: TILE.LEAVES,
    side: TILE.LEAVES,
    hardness: 0.2,
    requiredTool: 'none',
    minHarvestLevel: 0,
    drop: null,
    transparent: true,
  },
  [BlockType.OAK_PLANKS]: {
    name: 'Meşe Tahtası',
    top: TILE.PLANKS,
    bottom: TILE.PLANKS,
    side: TILE.PLANKS,
    hardness: 1.8,
    requiredTool: 'axe',
    minHarvestLevel: 0,
    drop: BlockType.OAK_PLANKS,
  },
  [BlockType.STONE_SLAB]: {
    name: 'Taş Yarım Basamak',
    top: TILE.STONE,
    bottom: TILE.STONE,
    side: TILE.STONE,
    hardness: 1.5,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.STONE_SLAB,
  },
  [BlockType.OAK_PLANKS_SLAB]: {
    name: 'Meşe Tahta Yarım Basamak',
    top: TILE.PLANKS,
    bottom: TILE.PLANKS,
    side: TILE.PLANKS,
    hardness: 1.8,
    requiredTool: 'axe',
    minHarvestLevel: 0,
    drop: BlockType.OAK_PLANKS_SLAB,
  },
  [BlockType.STONE_SLAB_TOP]: {
    name: 'Üst Taş Yarım Basamak', top: TILE.STONE, bottom: TILE.STONE, side: TILE.STONE,
    hardness: 1.5, requiredTool: 'pickaxe', minHarvestLevel: 0, drop: BlockType.STONE_SLAB,
  },
  [BlockType.OAK_PLANKS_SLAB_TOP]: {
    name: 'Üst Meşe Tahta Yarım Basamak', top: TILE.PLANKS, bottom: TILE.PLANKS, side: TILE.PLANKS,
    hardness: 1.8, requiredTool: 'axe', minHarvestLevel: 0, drop: BlockType.OAK_PLANKS_SLAB,
  },
  [BlockType.OAK_DOOR]: {
    name: 'Meşe Kapı', top: TILE.PLANKS, bottom: TILE.PLANKS, side: TILE.PLANKS, front: TILE.DOOR_LOWER,
    hardness: 3.0, requiredTool: 'none', minHarvestLevel: 0, drop: BlockType.OAK_DOOR, transparent: true,
  },
  [BlockType.BED]: {
    name: 'Yatak',
    top: TILE.BED_TOP_FOOT,
    bottom: TILE.BED_FRAME,
    side: TILE.BED_SIDE,
    front: TILE.BED_END,
    hardness: 0.2,
    requiredTool: 'none',
    minHarvestLevel: 0,
    drop: BlockType.BED,
  },
  [BlockType.WHITE_WOOL_BLOCK]: {
    name: 'Beyaz Yün Bloğu', top: TILE.ITEM_WHITE_WOOL, bottom: TILE.ITEM_WHITE_WOOL, side: TILE.ITEM_WHITE_WOOL,
    hardness: 0.8, requiredTool: 'none', minHarvestLevel: 0, drop: ItemType.WHITE_WOOL,
  },
  [BlockType.OAK_SAPLING]: {
    name: 'Meşe Fidanı', top: TILE.SAPLING, bottom: TILE.SAPLING, side: TILE.SAPLING,
    hardness: 0, requiredTool: 'none', minHarvestLevel: 0, drop: ItemType.OAK_SAPLING, transparent: true,
  },
  [BlockType.CRAFTING_TABLE]: {
    name: 'Çalışma Masası',
    top: TILE.CRAFT_TOP,
    bottom: TILE.PLANKS,
    side: TILE.CRAFT_SIDE,
    front: TILE.CRAFT_FRONT,
    hardness: 2.5,
    requiredTool: 'axe',
    minHarvestLevel: 0,
    drop: BlockType.CRAFTING_TABLE,
  },
  [BlockType.FURNACE]: {
    name: 'Fırın',
    top: TILE.STONE,
    bottom: TILE.STONE,
    side: TILE.FURNACE_SIDE,
    front: TILE.FURNACE_FRONT,
    frontFaces: [0, 1, 4, 5],
    hardness: 3.5,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.FURNACE,
  },
  [BlockType.FURNACE_LIT]: {
    name: 'Yanan Fırın',
    top: TILE.STONE,
    bottom: TILE.STONE,
    side: TILE.FURNACE_SIDE,
    front: TILE.FURNACE_LIT,
    frontFaces: [0, 1, 4, 5],
    hardness: 3.5,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.FURNACE,
    light: 13,
  },
  [BlockType.CHEST]: {
    name: 'Sandık',
    top: TILE.CHEST_TOP,
    bottom: TILE.PLANKS,
    side: TILE.CHEST_SIDE,
    front: TILE.CHEST_FRONT,
    hardness: 2.5,
    requiredTool: 'axe',
    minHarvestLevel: 0,
    drop: BlockType.CHEST,
  },
  [BlockType.TORCH]: {
    name: 'Meşale',
    top: TILE.TORCH,
    bottom: TILE.TORCH,
    side: TILE.TORCH,
    hardness: 0.1,
    requiredTool: 'none',
    minHarvestLevel: 0,
    drop: BlockType.TORCH,
    transparent: true,
    light: 14,
  },
  [BlockType.COAL_ORE]: {
    name: 'Kömür Cevheri',
    top: TILE.COAL_ORE,
    bottom: TILE.COAL_ORE,
    side: TILE.COAL_ORE,
    hardness: 3.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0, // wood pickaxe can mine
    drop: ItemType.COAL,
  },
  [BlockType.IRON_ORE]: {
    name: 'Demir Cevheri',
    top: TILE.IRON_ORE,
    bottom: TILE.IRON_ORE,
    side: TILE.IRON_ORE,
    hardness: 3.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 1, // stone pickaxe required
    drop: ItemType.RAW_IRON,
  },
  [BlockType.GOLD_ORE]: {
    name: 'Altın Cevheri',
    top: TILE.GOLD_ORE,
    bottom: TILE.GOLD_ORE,
    side: TILE.GOLD_ORE,
    hardness: 3.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 2, // iron pickaxe required
    drop: ItemType.RAW_GOLD,
  },
  [BlockType.DIAMOND_ORE]: {
    name: 'Elmas Cevheri',
    top: TILE.DIAMOND_ORE,
    bottom: TILE.DIAMOND_ORE,
    side: TILE.DIAMOND_ORE,
    hardness: 3.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 2, // iron pickaxe required
    drop: ItemType.DIAMOND,
  },
  [BlockType.SAND]: {
    name: 'Kum',
    top: TILE.SAND,
    bottom: TILE.SAND,
    side: TILE.SAND,
    hardness: 0.5,
    requiredTool: 'shovel',
    minHarvestLevel: 0,
    drop: BlockType.SAND,
  },
  [BlockType.GLASS]: {
    name: 'Cam',
    top: TILE.GLASS,
    bottom: TILE.GLASS,
    side: TILE.GLASS,
    hardness: 0.3,
    requiredTool: 'none',
    minHarvestLevel: 0,
    drop: null, // broken glass drops nothing without silk touch
    transparent: true,
  },
  [BlockType.BRICKS]: {
    name: 'Tuğla',
    top: TILE.BRICKS,
    bottom: TILE.BRICKS,
    side: TILE.BRICKS,
    hardness: 2.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.BRICKS,
  },
  [BlockType.MOSSY_COBBLE]: {
    name: 'Yosunlu Kırık Taş',
    top: TILE.MOSSY_COBBLE,
    bottom: TILE.MOSSY_COBBLE,
    side: TILE.MOSSY_COBBLE,
    hardness: 2.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 0,
    drop: BlockType.MOSSY_COBBLE,
  },
  [BlockType.OBSIDIAN]: {
    name: 'Obsidyen',
    top: TILE.OBSIDIAN,
    bottom: TILE.OBSIDIAN,
    side: TILE.OBSIDIAN,
    hardness: 10.0,
    requiredTool: 'pickaxe',
    minHarvestLevel: 3, // diamond pickaxe required
    drop: BlockType.OBSIDIAN,
  },
};

// ===================== ITEM TILE LOOKUP TABLE =====================
// These entries exist ONLY so that setupMeshUVs() can find a tile for items
// dropped by mobs, ores, or smelting. They have Infinity hardness so they
// can never be placed or broken as blocks. Placement logic in tryPlaceBlock
// checks BLOCK_DEFS[held.id]?.requiredTool — undefined entries there reject
// placement. Items-only entries below use requiredTool: 'none' to match.
const ITEM_TILE_ENTRIES: Array<{
  id: number;
  name: string;
  tile: number;
}> = [
  { id: ItemType.STICK, name: 'Çubuk', tile: TILE.ITEM_STICK },
  { id: ItemType.COAL, name: 'Kömür', tile: TILE.ITEM_COAL },
  { id: ItemType.CHARCOAL, name: 'Odun Kömürü', tile: TILE.ITEM_CHARCOAL },
  { id: ItemType.IRON_INGOT, name: 'Demir Külçesi', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.GOLD_INGOT, name: 'Altın Külçesi', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.DIAMOND, name: 'Elmas', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.RAW_IRON, name: 'Ham Demir', tile: TILE.ITEM_RAW_IRON },
  { id: ItemType.RAW_GOLD, name: 'Ham Altın', tile: TILE.ITEM_RAW_GOLD },
  { id: ItemType.FLINT, name: 'Çakmak Taşı', tile: TILE.ITEM_FLINT },
  { id: ItemType.OAK_SAPLING, name: 'Meşe Fidanı', tile: TILE.LEAVES },
  { id: ItemType.APPLE, name: 'Elma', tile: TILE.ITEM_APPLE },
  { id: ItemType.BREAD, name: 'Ekmek', tile: TILE.ITEM_BREAD },
  { id: ItemType.RAW_BEEF, name: 'Çiğ Sığır Eti', tile: TILE.ITEM_RAW_BEEF },
  { id: ItemType.COOKED_STEAK, name: 'Pişmiş Biftek', tile: TILE.ITEM_COOKED_STEAK },
  { id: ItemType.RAW_PORKCHOP, name: 'Çiğ Domuz Eti', tile: TILE.ITEM_RAW_PORKCHOP },
  { id: ItemType.COOKED_PORKCHOP, name: 'Pişmiş Domuz Pirzolası', tile: TILE.ITEM_COOKED_PORKCHOP },
  { id: ItemType.RAW_MUTTON, name: 'Çiğ Koyun Eti', tile: TILE.ITEM_RAW_MUTTON },
  { id: ItemType.COOKED_MUTTON, name: 'Pişmiş Koyun Eti', tile: TILE.ITEM_COOKED_MUTTON },
  { id: ItemType.RAW_CHICKEN, name: 'Çiğ Tavuk Eti', tile: TILE.ITEM_RAW_CHICKEN },
  { id: ItemType.COOKED_CHICKEN, name: 'Pişmiş Tavuk', tile: TILE.ITEM_COOKED_CHICKEN },
  { id: ItemType.LEATHER, name: 'Deri', tile: TILE.ITEM_LEATHER },
  { id: ItemType.FEATHER, name: 'Tüy', tile: TILE.ITEM_FEATHER },
  { id: ItemType.WHITE_WOOL, name: 'Beyaz Yün', tile: TILE.ITEM_WHITE_WOOL },
  { id: ItemType.WOODEN_PICKAXE, name: 'Tahta Kazma', tile: TILE.ITEM_STICK },
  { id: ItemType.STONE_PICKAXE, name: 'Taş Kazma', tile: TILE.ITEM_COAL },
  { id: ItemType.IRON_PICKAXE, name: 'Demir Kazma', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.DIAMOND_PICKAXE, name: 'Elmas Kazma', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.GOLD_PICKAXE, name: 'Altın Kazma', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.WOODEN_AXE, name: 'Tahta Balta', tile: TILE.ITEM_STICK },
  { id: ItemType.STONE_AXE, name: 'Taş Balta', tile: TILE.ITEM_COAL },
  { id: ItemType.IRON_AXE, name: 'Demir Balta', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.DIAMOND_AXE, name: 'Elmas Balta', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.GOLD_AXE, name: 'Altın Balta', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.WOODEN_SHOVEL, name: 'Tahta Kürek', tile: TILE.ITEM_STICK },
  { id: ItemType.STONE_SHOVEL, name: 'Taş Kürek', tile: TILE.ITEM_COAL },
  { id: ItemType.IRON_SHOVEL, name: 'Demir Kürek', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.DIAMOND_SHOVEL, name: 'Elmas Kürek', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.GOLD_SHOVEL, name: 'Altın Kürek', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.WOODEN_SWORD, name: 'Tahta Kılıç', tile: TILE.ITEM_STICK },
  { id: ItemType.STONE_SWORD, name: 'Taş Kılıç', tile: TILE.ITEM_COAL },
  { id: ItemType.IRON_SWORD, name: 'Demir Kılıç', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.DIAMOND_SWORD, name: 'Elmas Kılıç', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.GOLD_SWORD, name: 'Altın Kılıç', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.IRON_HELMET, name: 'Demir Kask', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.IRON_CHESTPLATE, name: 'Demir Zırh', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.IRON_LEGGINGS, name: 'Demir Pantolon', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.IRON_BOOTS, name: 'Demir Bot', tile: TILE.ITEM_IRON_INGOT },
  { id: ItemType.DIAMOND_CHESTPLATE, name: 'Elmas Zırh', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.LEATHER_HELMET, name: 'Deri Kask', tile: TILE.ITEM_LEATHER },
  { id: ItemType.LEATHER_CHESTPLATE, name: 'Deri Göğüslük', tile: TILE.ITEM_LEATHER },
  { id: ItemType.LEATHER_LEGGINGS, name: 'Deri Pantolon', tile: TILE.ITEM_LEATHER },
  { id: ItemType.LEATHER_BOOTS, name: 'Deri Bot', tile: TILE.ITEM_LEATHER },
  { id: ItemType.GOLD_HELMET, name: 'Altın Kask', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.GOLD_CHESTPLATE, name: 'Altın Göğüslük', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.GOLD_LEGGINGS, name: 'Altın Pantolon', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.GOLD_BOOTS, name: 'Altın Bot', tile: TILE.ITEM_GOLD_INGOT },
  { id: ItemType.DIAMOND_HELMET, name: 'Elmas Kask', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.DIAMOND_LEGGINGS, name: 'Elmas Pantolon', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.DIAMOND_BOOTS, name: 'Elmas Bot', tile: TILE.ITEM_DIAMOND },
  { id: ItemType.SHEARS, name: 'Makas', tile: TILE.SHEARS },
];

// Register each item entry into BLOCK_DEFS so setupMeshUVs can find a tile
// for any item ID. We use minHarvestLevel = 99 to make sure these can never
// be "broken" as a block by mistake.
for (const e of ITEM_TILE_ENTRIES) {
  BLOCK_DEFS[e.id] = {
    name: e.name,
    top: e.tile,
    bottom: e.tile,
    side: e.tile,
    hardness: Infinity,
    requiredTool: 'none',
    minHarvestLevel: 99,
    drop: null,
  };
}

// Door states are real block shapes, not the item-only cube fallback. Upper and
// open/facing variants share the correct procedural lower/upper atlas texture.
for (let blockId = BlockType.OAK_DOOR; blockId <= BlockType.OAK_DOOR_TOP_OPEN_EAST_RIGHT_HINGE; blockId++) {
  const state = getDoorState(blockId);
  if (!state) continue;
  const tile = state.upper ? TILE.DOOR_UPPER : TILE.DOOR_LOWER;
  BLOCK_DEFS[blockId] = {
    name: 'Meşe Kapı', top: TILE.PLANKS, bottom: TILE.PLANKS, side: TILE.PLANKS, front: tile,
    hardness: 3.0, requiredTool: 'none', minHarvestLevel: 0, drop: BlockType.OAK_DOOR, transparent: true,
  };
}

// A bed is stored as two directional states, but remains one craftable item.
for (const blockId of [
  BlockType.BED, BlockType.BED_FOOT_WEST, BlockType.BED_FOOT_SOUTH, BlockType.BED_FOOT_EAST,
  BlockType.BED_HEAD_NORTH, BlockType.BED_HEAD_WEST, BlockType.BED_HEAD_SOUTH, BlockType.BED_HEAD_EAST,
]) {
  const state = getBedState(blockId);
  if (!state) continue;
  const top = !state.head ? TILE.BED_TOP_FOOT : [
    TILE.BED_HEAD_NORTH, TILE.BED_HEAD_WEST, TILE.BED_HEAD_SOUTH, TILE.BED_HEAD_EAST,
  ][state.facing];
  BLOCK_DEFS[blockId] = {
    name: 'Yatak', top, bottom: TILE.BED_FRAME, side: TILE.BED_SIDE, front: TILE.BED_END,
    hardness: 0.2, requiredTool: 'none', minHarvestLevel: 0, drop: BlockType.BED,
  };
}

export const ITEM_DEFS: Record<number, ItemDef> = {
  // Materials
  [ItemType.STICK]: { name: 'Çubuk', fuelValue: 5 },
  [ItemType.COAL]: { name: 'Kömür', fuelValue: 80 },
  [ItemType.CHARCOAL]: { name: 'Odun Kömürü', fuelValue: 80 },
  [ItemType.IRON_INGOT]: { name: 'Demir Külçesi' },
  [ItemType.GOLD_INGOT]: { name: 'Altın Külçesi' },
  [ItemType.DIAMOND]: { name: 'Elmas' },
  [ItemType.FLINT]: { name: 'Çakmak Taşı' },
  [ItemType.RAW_IRON]: { name: 'Ham Demir' },
  [ItemType.RAW_GOLD]: { name: 'Ham Altın' },
  [ItemType.OAK_SAPLING]: { name: 'Meşe Fidanı', fuelValue: 5 },

  // Pickaxes
  [ItemType.WOODEN_PICKAXE]: {
    name: 'Tahta Kazma',
    fuelValue: 10,
    tool: { type: 'pickaxe', material: 'wood', durability: 59, speed: 2, damage: 2, harvestLevel: 0 },
  },
  [ItemType.STONE_PICKAXE]: {
    name: 'Taş Kazma',
    tool: { type: 'pickaxe', material: 'stone', durability: 131, speed: 4, damage: 3, harvestLevel: 1 },
  },
  [ItemType.IRON_PICKAXE]: {
    name: 'Demir Kazma',
    tool: { type: 'pickaxe', material: 'iron', durability: 250, speed: 6, damage: 4, harvestLevel: 2 },
  },
  [ItemType.DIAMOND_PICKAXE]: {
    name: 'Elmas Kazma',
    tool: { type: 'pickaxe', material: 'diamond', durability: 1561, speed: 8, damage: 5, harvestLevel: 3 },
  },
  [ItemType.GOLD_PICKAXE]: {
    name: 'Altın Kazma',
    tool: { type: 'pickaxe', material: 'gold', durability: 32, speed: 12, damage: 2, harvestLevel: 0 },
  },

  // Axes
  [ItemType.WOODEN_AXE]: {
    name: 'Tahta Balta',
    fuelValue: 10,
    tool: { type: 'axe', material: 'wood', durability: 59, speed: 2, damage: 4, harvestLevel: 0 },
  },
  [ItemType.STONE_AXE]: {
    name: 'Taş Balta',
    tool: { type: 'axe', material: 'stone', durability: 131, speed: 4, damage: 5, harvestLevel: 1 },
  },
  [ItemType.IRON_AXE]: {
    name: 'Demir Balta',
    tool: { type: 'axe', material: 'iron', durability: 250, speed: 6, damage: 6, harvestLevel: 2 },
  },
  [ItemType.DIAMOND_AXE]: {
    name: 'Elmas Balta',
    tool: { type: 'axe', material: 'diamond', durability: 1561, speed: 8, damage: 7, harvestLevel: 3 },
  },
  [ItemType.GOLD_AXE]: {
    name: 'Altın Balta',
    tool: { type: 'axe', material: 'gold', durability: 32, speed: 12, damage: 5, harvestLevel: 0 },
  },

  // Shovels
  [ItemType.WOODEN_SHOVEL]: {
    name: 'Tahta Kürek',
    fuelValue: 10,
    tool: { type: 'shovel', material: 'wood', durability: 59, speed: 2, damage: 1, harvestLevel: 0 },
  },
  [ItemType.STONE_SHOVEL]: {
    name: 'Taş Kürek',
    tool: { type: 'shovel', material: 'stone', durability: 131, speed: 4, damage: 2, harvestLevel: 1 },
  },
  [ItemType.IRON_SHOVEL]: {
    name: 'Demir Kürek',
    tool: { type: 'shovel', material: 'iron', durability: 250, speed: 6, damage: 3, harvestLevel: 2 },
  },
  [ItemType.DIAMOND_SHOVEL]: {
    name: 'Elmas Kürek',
    tool: { type: 'shovel', material: 'diamond', durability: 1561, speed: 8, damage: 4, harvestLevel: 3 },
  },
  [ItemType.GOLD_SHOVEL]: {
    name: 'Altın Kürek',
    tool: { type: 'shovel', material: 'gold', durability: 32, speed: 12, damage: 1, harvestLevel: 0 },
  },

  // Swords
  [ItemType.WOODEN_SWORD]: {
    name: 'Tahta Kılıç',
    fuelValue: 10,
    tool: { type: 'sword', material: 'wood', durability: 59, speed: 1.5, damage: 4, harvestLevel: 0 },
  },
  [ItemType.STONE_SWORD]: {
    name: 'Taş Kılıç',
    tool: { type: 'sword', material: 'stone', durability: 131, speed: 1.5, damage: 5, harvestLevel: 1 },
  },
  [ItemType.IRON_SWORD]: {
    name: 'Demir Kılıç',
    tool: { type: 'sword', material: 'iron', durability: 250, speed: 1.5, damage: 6, harvestLevel: 2 },
  },
  [ItemType.DIAMOND_SWORD]: {
    name: 'Elmas Kılıç',
    tool: { type: 'sword', material: 'diamond', durability: 1561, speed: 1.5, damage: 7, harvestLevel: 3 },
  },
  [ItemType.GOLD_SWORD]: {
    name: 'Altın Kılıç',
    tool: { type: 'sword', material: 'gold', durability: 32, speed: 1.5, damage: 4, harvestLevel: 0 },
  },

  // Food
  [ItemType.APPLE]: {
    name: 'Elma',
    food: { healHp: 2, foodPoints: 4, saturation: 2.4 },
  },
  [ItemType.BREAD]: {
    name: 'Ekmek',
    food: { healHp: 3, foodPoints: 5, saturation: 6.0 },
  },
  [ItemType.RAW_BEEF]: {
    name: 'Çiğ Sığır Eti',
    food: { healHp: 1, foodPoints: 3, saturation: 1.8 },
  },
  [ItemType.COOKED_STEAK]: {
    name: 'Pişmiş Biftek',
    food: { healHp: 4, foodPoints: 8, saturation: 12.8 },
  },
  [ItemType.RAW_PORKCHOP]: {
    name: 'Çiğ Domuz Eti',
    food: { healHp: 1, foodPoints: 3, saturation: 1.8 },
  },
  [ItemType.COOKED_PORKCHOP]: {
    name: 'Pişmiş Domuz Pirzolası',
    food: { healHp: 4, foodPoints: 8, saturation: 12.8 },
  },
  [ItemType.RAW_MUTTON]: {
    name: 'Çiğ Koyun Eti',
    food: { healHp: 1, foodPoints: 2, saturation: 1.2 },
  },
  [ItemType.COOKED_MUTTON]: {
    name: 'Pişmiş Koyun Eti',
    food: { healHp: 3, foodPoints: 6, saturation: 9.6 },
  },
  [ItemType.RAW_CHICKEN]: {
    name: 'Çiğ Tavuk Eti',
    food: { healHp: 1, foodPoints: 2, saturation: 1.2 },
  },
  [ItemType.COOKED_CHICKEN]: {
    name: 'Pişmiş Tavuk',
    food: { healHp: 3, foodPoints: 6, saturation: 7.2 },
  },
  [ItemType.LEATHER]: {
    name: 'Deri',
  },
  [ItemType.FEATHER]: {
    name: 'Tüy',
  },
  [ItemType.WHITE_WOOL]: { name: 'Beyaz Yün' },
  [ItemType.SHEARS]: { name: 'Makas', tool: { type: 'none', material: 'iron', durability: 238, speed: 1, damage: 1, harvestLevel: 0 } },

  // Armor
  [ItemType.IRON_HELMET]: {
    name: 'Demir Kask',
    armor: { slot: 'helmet', material: 'iron', defense: 2, durability: 165 },
  },
  [ItemType.IRON_CHESTPLATE]: {
    name: 'Demir Zırh',
    armor: { slot: 'chest', material: 'iron', defense: 6, durability: 240 },
  },
  [ItemType.IRON_LEGGINGS]: {
    name: 'Demir Pantolon',
    armor: { slot: 'legs', material: 'iron', defense: 5, durability: 225 },
  },
  [ItemType.IRON_BOOTS]: {
    name: 'Demir Bot',
    armor: { slot: 'feet', material: 'iron', defense: 2, durability: 195 },
  },
  [ItemType.DIAMOND_CHESTPLATE]: {
    name: 'Elmas Zırh',
    armor: { slot: 'chest', material: 'diamond', defense: 8, durability: 528 },
  },
  [ItemType.LEATHER_HELMET]: { name: 'Deri Kask', armor: { slot: 'helmet', material: 'leather', defense: 1, durability: 55 } },
  [ItemType.LEATHER_CHESTPLATE]: { name: 'Deri Göğüslük', armor: { slot: 'chest', material: 'leather', defense: 3, durability: 80 } },
  [ItemType.LEATHER_LEGGINGS]: { name: 'Deri Pantolon', armor: { slot: 'legs', material: 'leather', defense: 2, durability: 75 } },
  [ItemType.LEATHER_BOOTS]: { name: 'Deri Bot', armor: { slot: 'feet', material: 'leather', defense: 1, durability: 65 } },
  [ItemType.GOLD_HELMET]: { name: 'Altın Kask', armor: { slot: 'helmet', material: 'gold', defense: 2, durability: 77 } },
  [ItemType.GOLD_CHESTPLATE]: { name: 'Altın Göğüslük', armor: { slot: 'chest', material: 'gold', defense: 5, durability: 112 } },
  [ItemType.GOLD_LEGGINGS]: { name: 'Altın Pantolon', armor: { slot: 'legs', material: 'gold', defense: 3, durability: 105 } },
  [ItemType.GOLD_BOOTS]: { name: 'Altın Bot', armor: { slot: 'feet', material: 'gold', defense: 1, durability: 91 } },
  [ItemType.DIAMOND_HELMET]: { name: 'Elmas Kask', armor: { slot: 'helmet', material: 'diamond', defense: 3, durability: 363 } },
  [ItemType.DIAMOND_LEGGINGS]: { name: 'Elmas Pantolon', armor: { slot: 'legs', material: 'diamond', defense: 6, durability: 495 } },
  [ItemType.DIAMOND_BOOTS]: { name: 'Elmas Bot', armor: { slot: 'feet', material: 'diamond', defense: 3, durability: 429 } },
};

// Item fuel values for blocks
export function getItemFuelValue(id: AnyItemId): number {
  if ([
    BlockType.OAK_LOG,
    BlockType.OAK_PLANKS,
    BlockType.CRAFTING_TABLE,
    BlockType.CHEST,
    BlockType.OAK_DOOR,
  ].includes(id as BlockType)) return 15;
  if ([BlockType.OAK_PLANKS_SLAB, BlockType.OAK_PLANKS_SLAB_TOP].includes(id as BlockType)) return 7.5;
  if (id === ItemType.STICK || id === ItemType.OAK_SAPLING) return 5;
  if (id === ItemType.COAL || id === ItemType.CHARCOAL) return 80;
  const def = ITEM_DEFS[id];
  return def?.fuelValue ?? 0;
}

export function getItemName(id: AnyItemId): string {
  if (BLOCK_DEFS[id]) return BLOCK_DEFS[id].name;
  if (ITEM_DEFS[id]) return ITEM_DEFS[id].name;
  return 'Eşya';
}

export let atlasCanvas: HTMLCanvasElement | null = null;
export let atlasTexture: THREE.CanvasTexture | null = null;
export let crackTextures: THREE.CanvasTexture[] = [];
export const iconDataUrls: Record<number, string> = {};
const itemIconCanvases = new Map<number, HTMLCanvasElement>();
const itemIconTextures = new Map<number, THREE.CanvasTexture>();

function cacheItemIcon(id: number, canvas: HTMLCanvasElement) {
  itemIconTextures.get(id)?.dispose();
  itemIconTextures.delete(id);
  itemIconCanvases.set(id, canvas);
  iconDataUrls[id] = canvas.toDataURL();
}

/**
 * Generate Atlas & Crack Textures
 */
export function initTextures() {
  atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = ATLAS_SIZE;
  atlasCanvas.height = ATLAS_SIZE;
  const ctx = atlasCanvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;

  const rnd = mulberry32(1337);

  function tile(idx: number, fn: (x: number, y: number, r: () => number) => string | null) {
    const tx = (idx % TILES_PER_ROW) * TILE_SIZE;
    const ty = Math.floor(idx / TILES_PER_ROW) * TILE_SIZE;
    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const c = fn(px, py, rnd);
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(tx + px, ty + py, 1, 1);
        }
      }
    }
  }

  const pick = (r: () => number, opts: string[]) => opts[Math.min(opts.length - 1, Math.floor(r() * opts.length))];

  // 0 Grass Top (vibrant 4-tone organic grass blades)
  tile(TILE.GRASS_TOP, (x, y, r) => {
    const isEdgeClump = (x + y * 5) % 6 === 0;
    const isBrightBlade = (x * 7 + y * 3) % 8 === 0;
    if (isBrightBlade) return '#74bd48';
    if (isEdgeClump) return '#4f8a32';
    return pick(r, ['#5d9c3f', '#67a845', '#579639', '#62a342', '#528d34']);
  });

  // 1 Grass Side (rich brown soil with jagged hanging blade overhangs)
  tile(TILE.GRASS_SIDE, (x, y, r) => {
    const bladeDepth = 3 + ((x * 5 + 2) % 4 === 0 ? 3 : 0) + (x % 3 === 0 ? 1 : 0);
    if (y < bladeDepth) {
      if (y === bladeDepth - 1) return pick(r, ['#4f8a32', '#457a2b']); // darker tip
      return pick(r, ['#5d9c3f', '#67a845', '#74bd48', '#579639']);
    }
    // Dirt base with tiny root/pebble details
    if (y === bladeDepth && r() < 0.3) return '#457a2b';
    if ((x + y * 3) % 7 === 0) return '#5a3d24'; // dark root speck
    if ((x * 3 + y) % 9 === 0) return '#8f6848'; // light pebble
    return pick(r, ['#79553a', '#865f42', '#6b4a32', '#7d5a3e', '#6f4c33']);
  });

  // 2 Dirt (rich textured soil with dark crevices and gravel specks)
  tile(TILE.DIRT, (x, y, r) => {
    if ((x + y * 4) % 9 === 0) return '#5a3d24';
    if ((x * 4 + y * 7) % 11 === 0) return '#916a4a';
    return pick(r, ['#79553a', '#865f42', '#6b4a32', '#7d5a3e', '#6e4c32']);
  });

  // 3 Stone (natural mineral fissures, highlights, and shadow crevices)
  tile(TILE.STONE, (x, y, r) => {
    const isFissure = (x + y * 2) % 11 === 0 || (x * 3 + y) % 13 === 0;
    const isHighlight = (x + y) % 8 === 0;
    if (isFissure) return '#525252';
    if (isHighlight) return '#9c9c9c';
    return pick(r, ['#7a7a7a', '#828282', '#707070', '#8c8c8c', '#757575']);
  });

  // 4 Bedrock (dense basalt look with deep contrasting fractures)
  tile(TILE.BEDROCK, (x, y, r) => {
    const isDeepCrack = (x * 3 + y * 5) % 5 === 0;
    if (isDeepCrack) return '#151515';
    return pick(r, ['#282828', '#383838', '#1f1f1f', '#424242', '#303030']);
  });

  // 5 Oak Log Side (rich bark furrows with shaded crevices and lighter bark ridges)
  tile(TILE.LOG_SIDE, (x, y, r) => {
    const isDeepFurrow = x % 4 === 0 || (x + 2) % 7 === 0;
    const isRidgeEdge = x % 4 === 1;
    if (isDeepFurrow) return r() < 0.85 ? '#3b2a12' : '#453216';
    if (isRidgeEdge && (y % 3 === 0)) return '#785b2e';
    return pick(r, ['#6b5228', '#73582d', '#5e4722', '#674f26', '#624a24']);
  });

  // 6 Oak Log Top (concentric tree growth rings, pith center, outer bark rim)
  tile(TILE.LOG_TOP, (x, y, r) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 6.8) return '#3b2a12'; // outer bark
    if (d > 6.2) return '#453216';
    if (d < 1.6) return '#4a3618'; // pith center
    if (Math.floor(d * 1.5) % 2 === 0) return pick(r, ['#886a3b', '#8f6f3f']);
    return pick(r, ['#a3844f', '#aa8b55', '#9a7c47']);
  });

  // 7 Oak Leaves (lush leafy foliage with shaded canopy depth and bright outer leaves)
  tile(TILE.LEAVES, (x, y, r) => {
    const isInnerShadow = (x * 3 + y * 5) % 7 === 0;
    const isBrightLeaf = (x + y * 2) % 5 === 0;
    if (isInnerShadow && r() < 0.6) return '#1d4516';
    if (isBrightLeaf && r() < 0.7) return '#48a12f';
    return pick(r, ['#2d6921', '#378129', '#275d1d', '#3f8f2f', '#327325']);
  });

  // 8 Oak Planks (horizontal boards with wood grain lines, knots, and nail dots)
  tile(TILE.PLANKS, (x, y, r) => {
    const row = Math.floor(y / 4);
    // Dark seam line between boards
    if (y % 4 === 3) return '#523e1c';
    // Board end joints with iron nails
    if (
      (row === 0 && x === 7) ||
      (row === 1 && x === 13) ||
      (row === 2 && x === 4) ||
      (row === 3 && x === 10)
    ) {
      if (y % 4 === 1) return '#221a0f'; // nail head
      return '#523e1c';
    }
    // Subtle wood grain wave
    if ((x + y) % 5 === 0) return '#917344';
    return pick(r, ['#9c7f4e', '#a68754', '#927647', '#a18350', '#b0905a']);
  });

  // 9 Cobblestone (organic rounded cobblestone pavers with dark recessed mortar)
  tile(TILE.COBBLE, (x, y, r) => {
    const isMortar = x % 4 === 3 || y % 4 === 3 || (x + y) % 7 === 0;
    if (isMortar && r() < 0.8) return pick(r, ['#3d3d3d', '#333333', '#474747']);
    // Stone highlights on top-left of each stone cell
    if (x % 4 === 0 && y % 4 === 0) return '#949494';
    return pick(r, ['#787878', '#6e6e6e', '#858585', '#737373', '#7c7c7c']);
  });

  // 10 Crafting Table Top (checkered grid, corner brass brackets, tool grooves)
  tile(TILE.CRAFT_TOP, (x, y, r) => {
    // Corner brackets
    if ((x <= 2 || x >= 13) && (y <= 2 || y >= 13)) return '#b59247';
    // Outer wood border
    if (x < 1 || x > 14 || y < 1 || y > 14) return '#6b4f24';
    if (x === 1 || x === 14 || y === 1 || y === 14) return '#453214';
    // 3x3 engraved grid lines
    if (x === 5 || x === 10 || y === 5 || y === 10) return '#523e1c';
    // Inner checkered squares
    const sq = Math.floor((x - 2) / 4) + Math.floor((y - 2) / 4);
    return sq % 2 === 0 ? pick(r, ['#a68754', '#ad8d5a']) : pick(r, ['#967848', '#8f7243']);
  });

  // 11 Crafting Table Front (saw & pliers tools)
  tile(TILE.CRAFT_FRONT, (x, y, r) => {
    if (x < 1 || x > 14 || y < 1 || y > 14) return '#523e1c';
    // Saw blade
    if (y >= 4 && y <= 6 && x >= 3 && x <= 12) {
      if (y === 6 && x % 2 === 0) return '#222'; // saw teeth
      return '#e8e8e8';
    }
    if (y === 7 && x >= 5 && x <= 9) return '#453214'; // saw handle
    return pick(r, ['#9c7f4e', '#8f7445', '#a68754', '#947746']);
  });

  // 12 Crafting Table Side (hanging claw hammer)
  tile(TILE.CRAFT_SIDE, (x, y, r) => {
    if (x < 1 || x > 14 || y < 1 || y > 14) return '#523e1c';
    // Hammer head
    if (x >= 4 && x <= 8 && y >= 3 && y <= 5) return '#484848';
    if (x === 4 && y === 3) return '#2e2e2e'; // claw
    // Hammer wooden shaft
    if (x >= 6 && x <= 11 && y >= 6 && y <= 12 && Math.abs(x - y) <= 1) return '#6e5025';
    return pick(r, ['#9c7f4e', '#8f7445', '#a68754', '#947746']);
  });

  // 13 Furnace Front (unlit firebox with a readable iron frame and grate)
  tile(TILE.FURNACE_FRONT, (x, y, r) => {
    if (y >= 3 && y <= 14 && x >= 2 && x <= 13) {
      if (y === 3 && x >= 6 && x <= 9) return '#383b3d'; // exhaust slots
      if (y === 4 && x >= 6 && x <= 9) return '#222526';
      if (x === 2 || x === 13 || y === 6 || y === 14) return '#303437';
      if ((x === 3 || x === 12) && y >= 7 && y <= 13) return '#a4a7a5'; // iron uprights
      if (y === 7 || y === 13) return '#737a7a'; // upper/lower iron lip
      if (x >= 4 && x <= 11 && y >= 8 && y <= 12) {
        if ((x === 5 || x === 8 || x === 10) && y >= 10) return '#777b78'; // grate bars
        if (y === 12 && x >= 6 && x <= 9) return '#49352a'; // cold ash/coal
        if ((x + y) % 5 === 0) return '#202324';
        return '#111516'; // deep hollow firebox
      }
    }
    if ((x + y) % 4 === 0) return '#575c5e';
    return pick(r, ['#707779', '#858a8b', '#686e70', '#929697']);
  });

  // 14 Furnace Front (LIT - glowing intense fire & embers)
  tile(TILE.FURNACE_LIT, (x, y, r) => {
    if (x >= 3 && x <= 12 && y >= 7 && y <= 13) {
      if (y === 7 && (x === 3 || x === 12)) return '#444';
      // Blazing flame core
      if (y >= 10 && x >= 5 && x <= 10) return pick(r, ['#ffffff', '#fff159', '#ffaa00']);
      if (y >= 8 && x >= 4 && x <= 11) return pick(r, ['#ff6600', '#e64000', '#ff9900']);
      return '#881b00';
    }
    // Warm light reflection on stone
    if (y >= 6 && y <= 14 && (x === 2 || x === 13)) return '#8a6e5a';
    return pick(r, ['#757575', '#808080', '#6b6b6b', '#878787']);
  });

  // 15 Furnace Side (chiselled stone blocks)
  tile(TILE.FURNACE_SIDE, (_x, _y, r) => pick(r, ['#757575', '#808080', '#6b6b6b', '#878787', '#5e5e5e']));

  // 16 Chest Top (iron reinforced wooden lid)
  tile(TILE.CHEST_TOP, (x, y, r) => {
    if (x < 1 || x > 14 || y < 1 || y > 14) return '#1f1509';
    // Metal corner reinforcement
    if ((x <= 2 || x >= 13) || (y <= 2 || y >= 13)) return '#332717';
    return pick(r, ['#a17639', '#8f6831', '#aa7d3e', '#966d33']);
  });

  // 17 Chest Front (has silver/iron clasp latch)
  tile(TILE.CHEST_FRONT, (x, y, r) => {
    if (x < 1 || x > 14 || y < 1 || y > 14) return '#1f1509';
    if (y === 7) return '#111111'; // lid slit
    // Silver latch in center
    if (x >= 7 && x <= 8 && y >= 5 && y <= 9) {
      if (x === 7 && y === 6) return '#ffffff'; // glint
      if (y === 9) return '#1a1a1a'; // keyhole
      return '#e0e0e0';
    }
    return pick(r, ['#a17639', '#8f6831', '#aa7d3e', '#966d33']);
  });

  // 18 Chest Side
  tile(TILE.CHEST_SIDE, (x, y, r) => {
    if (x < 1 || x > 14 || y < 1 || y > 14) return '#1f1509';
    if (y === 7) return '#111111';
    return pick(r, ['#a17639', '#8f6831', '#aa7d3e', '#966d33']);
  });

  // Ore generator with high-contrast faceted gems
  function oreTile(oreColors: string[], highlightColor: string) {
    return (x: number, y: number, r: () => number) => {
      // 4 distinct gem clusters
      const isGem =
        (x >= 3 && x <= 5 && y >= 3 && y <= 5) ||
        (x >= 9 && x <= 12 && y >= 4 && y <= 7) ||
        (x >= 4 && x <= 7 && y >= 9 && y <= 12) ||
        (x >= 11 && x <= 13 && y >= 11 && y <= 13);

      if (isGem) {
        if (
          (x === 3 && y === 3) ||
          (x === 10 && y === 4) ||
          (x === 5 && y === 9) ||
          (x === 12 && y === 11)
        ) {
          return highlightColor; // bright glint on each gem
        }
        return pick(r, oreColors);
      }

      // Stone background with natural texture
      const v = r();
      if (v < 0.08) return '#525252';
      return pick(r, ['#7a7a7a', '#828282', '#707070', '#8c8c8c']);
    };
  }

  // 19 Coal Ore
  tile(TILE.COAL_ORE, oreTile(['#171717', '#212121', '#2c2c2c'], '#404040'));

  // 20 Iron Ore
  tile(TILE.IRON_ORE, oreTile(['#d4a787', '#bf8c67', '#e8c4a9'], '#fff0e6'));

  // 21 Gold Ore
  tile(TILE.GOLD_ORE, oreTile(['#ffd700', '#ebc400', '#ffd000'], '#ffffff'));

  // 22 Diamond Ore (vibrant glittering cyan gems)
  tile(TILE.DIAMOND_ORE, oreTile(['#38ebf5', '#24c2cc', '#1b9ea6'], '#ffffff'));

  // 23 Sand (warm golden dunes grain with ripples)
  tile(TILE.SAND, (x, y, r) => {
    if (y % 4 === (x % 3)) return '#e4d39f'; // wind ripple
    return pick(r, ['#dbc993', '#d1bd85', '#e2d09a', '#c7b37b']);
  });

  // 24 Glass (translucent crystal panel with clean borders and dual glints)
  tile(TILE.GLASS, (x, y, r) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#e0e0e0';
    if ((x === 3 && y === 3) || (x === 4 && y === 4) || (x === 5 && y === 5)) return '#ffffff';
    if ((x === 11 && y === 11) || (x === 12 && y === 12)) return '#ffffff';
    if (r() < 0.015) return 'rgba(255,255,255,0.3)';
    return null;
  });

  // 25 Bricks (terracotta running bond with light gray mortar)
  tile(TILE.BRICKS, (x, y, r) => {
    if (y % 4 === 3) return '#b8aaa0'; // horizontal mortar
    const row = Math.floor(y / 4);
    const offset = (row % 2) * 4;
    if ((x + offset) % 8 === 7) return '#b8aaa0'; // vertical mortar
    if ((x + y) % 3 === 0) return '#8c3924'; // brick shadow
    return pick(r, ['#a14932', '#943d26', '#ab523a', '#96402a']);
  });

  // 26 Mossy Cobble
  tile(TILE.MOSSY_COBBLE, (x, y, r) => {
    if (r() < 0.4 && (x + y * 2) % 3 === 0) return pick(r, ['#4f7a28', '#5e8c32', '#3f631d']);
    const isMortar = x % 4 === 3 || y % 4 === 3;
    if (isMortar) return '#3d3d3d';
    return pick(r, ['#787878', '#6e6e6e', '#858585', '#737373']);
  });

  // 27 Obsidian
  tile(TILE.OBSIDIAN, (_x, _y, r) => pick(r, ['#13101c', '#1b1427', '#251c36', '#100c17', '#33234d']));

  // 28 Torch
  tile(TILE.TORCH, (x, y, r) => {
    if (y <= 4 && x >= 6 && x <= 9) return pick(r, ['#ffea47', '#ff8800', '#ffffff', '#ffaa00']);
    if (y > 4 && x >= 7 && x <= 8) return '#5e4823';
    return null;
  });

  // ===================== ITEM TILES (rows 29-51) =====================
  // Each item is drawn as a single 16x16 tile that fills the box face on the drop mesh.

  // 29 Stick - diagonal brown rod
  tile(TILE.ITEM_STICK, (x, y) => {
    const onLine = (x - y >= -1 && x - y <= 1);
    const onLine2 = (x + y >= 13 && x + y <= 15);
    if (onLine || onLine2) return '#6e5124';
    if ((x - y === -2 || x - y === 2) || (x + y === 12 || x + y === 16)) return '#8a6a32';
    return null;
  });

  // 30 Coal - jagged black mineral chunk
  tile(TILE.ITEM_COAL, (x, y) => {
    const isChunk = (x + y) % 3 === 0 || (x * 2 + y) % 5 === 0;
    if (x < 2 || x > 13 || y < 2 || y > 13) return null;
    if (isChunk) return '#0a0a0a';
    if (y > 11 && x < 4) return null;
    return pick(rnd, ['#222222', '#1c1c1c', '#2a2a2a', '#161616']);
  });

  // 31 Charcoal - dark brown-black chunk (slightly warmer than coal)
  tile(TILE.ITEM_CHARCOAL, (x, y) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return null;
    if ((x + y * 2) % 4 === 0) return '#1a1108';
    return pick(rnd, ['#2c2014', '#2a1d12', '#3a2a1c', '#22170d']);
  });

  // 32 Iron Ingot - silvery bar with bevel
  tile(TILE.ITEM_IRON_INGOT, (x, y) => {
    if (y < 5 || y > 11) return null;
    if (y === 5 || y === 11) return '#8f8f8f';
    if (y === 6 || y === 10) return '#cfcfcf';
    if (x === 2 || x === 13) return '#8f8f8f';
    if (x === 3 || x === 12) return '#dcdcdc';
    return pick(rnd, ['#e0e0e0', '#d0d0d0', '#cccccc', '#dadada']);
  });

  // 33 Gold Ingot - golden bar with bevel
  tile(TILE.ITEM_GOLD_INGOT, (x, y) => {
    if (y < 5 || y > 11) return null;
    if (y === 5 || y === 11) return '#b58a00';
    if (y === 6 || y === 10) return '#ffe075';
    if (x === 2 || x === 13) return '#b58a00';
    if (x === 3 || x === 12) return '#fff575';
    return pick(rnd, ['#ffd700', '#f7c800', '#ffdc33', '#ffd700']);
  });

  // 34 Diamond - cyan gem
  tile(TILE.ITEM_DIAMOND, (x, y) => {
    const cx = 7.5, cy = 7.5;
    const dx = x - cx, dy = y - cy;
    const d = Math.abs(dx) + Math.abs(dy);
    if (d > 7) return null;
    if (d > 5.5) return '#1f989e';
    if (d > 4) return '#38ebf5';
    if ((x + y) % 3 === 0) return '#b8ffff';
    return pick(rnd, ['#4dedf4', '#38ebf5', '#5ff0ff', '#38ebf5']);
  });

  // 35 Flint - dark grey angular stone
  tile(TILE.ITEM_FLINT, (x, y) => {
    if (y < 3 || y > 12 || x < 3 || x > 12) return null;
    if (y < 5 && x > 10) return null;
    if (y > 10 && x < 5) return null;
    if ((x + y) % 5 === 0) return '#1a1a1a';
    return pick(rnd, ['#3d3d3d', '#2a2a2a', '#454545', '#383838']);
  });

  // 36 Apple - red fruit with stem
  tile(TILE.ITEM_APPLE, (x, y) => {
    if (y < 3 || y > 12) return null;
    if (y < 5 && (x < 6 || x > 9)) return null;
    if (y > 11 && (x < 5 || x > 10)) return null;
    if (y === 3 && x >= 7 && x <= 8) return '#5c3a1e';
    if (y === 4 && x === 9) return '#3fa32b';
    if (y > 4 && (x + y) % 3 === 0) return '#ff6b77';
    return pick(rnd, ['#d42222', '#c41a1a', '#e62828', '#b81818']);
  });

  // 37 Bread - crusty loaf with cuts
  tile(TILE.ITEM_BREAD, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y === 4 || y === 12) return '#7a4b14';
    if (y === 5 || y === 11) return '#e2aa4f';
    if (x === 5 || x === 11) return '#7a4b14';
    if ((y === 6 || y === 9) && (x % 4 === 2)) return '#7a4b14';
    return pick(rnd, ['#c8923a', '#bb8a30', '#cf9a40', '#bb8a30']);
  });

  // 38 Raw Beef - red meat with white bone
  tile(TILE.ITEM_RAW_BEEF, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y < 6 && (x < 3 || x > 12)) return null;
    if (y < 5 && (x < 4 || x > 11)) return null;
    if (y < 6 && x >= 4 && x <= 6) return '#fce8e8';
    if (y < 6 && x >= 5 && x <= 5) return '#ffffff';
    return pick(rnd, ['#b83333', '#a02828', '#c43a3a', '#9c2424']);
  });

  // 39 Cooked Steak - brown meat with grill marks
  tile(TILE.ITEM_COOKED_STEAK, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y < 6 && (x < 3 || x > 12)) return null;
    if (y < 5 && (x < 4 || x > 11)) return null;
    if (y < 6 && x >= 4 && x <= 6) return '#e0ded3';
    if ((x + y) % 4 === 0) return '#3d1d0c';
    return pick(rnd, ['#6b361a', '#5a2a14', '#7a3e20', '#602e16']);
  });

  // 40 Raw Porkchop - pink meat
  tile(TILE.ITEM_RAW_PORKCHOP, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y < 6 && (x < 3 || x > 12)) return null;
    if (y < 5 && (x < 4 || x > 11)) return null;
    if (y < 6 && x >= 4 && x <= 6) return '#fce4e4';
    return pick(rnd, ['#e88b8b', '#dd7878', '#f09999', '#d46c6c']);
  });

  // 41 Cooked Porkchop - brown meat
  tile(TILE.ITEM_COOKED_PORKCHOP, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y < 6 && (x < 3 || x > 12)) return null;
    if (y < 5 && (x < 4 || x > 11)) return null;
    if (y < 6 && x >= 4 && x <= 6) return '#e3cfc1';
    if ((x + y) % 4 === 0) return '#5c3a21';
    return pick(rnd, ['#a66e46', '#95593a', '#b27850', '#8f5236']);
  });

  // 42 Raw Mutton
  tile(TILE.ITEM_RAW_MUTTON, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y < 6 && (x < 3 || x > 12)) return null;
    if (y < 5 && (x < 4 || x > 11)) return null;
    if (y < 6 && x >= 4 && x <= 6) return '#f5e1e1';
    return pick(rnd, ['#bd4f4f', '#a83c3c', '#c45c5c', '#a83838']);
  });

  // 43 Cooked Mutton
  tile(TILE.ITEM_COOKED_MUTTON, (x, y) => {
    if (y < 4 || y > 12) return null;
    if (y < 6 && (x < 3 || x > 12)) return null;
    if (y < 5 && (x < 4 || x > 11)) return null;
    if (y < 6 && x >= 4 && x <= 6) return '#d6c0b4';
    return pick(rnd, ['#7a3e28', '#682e1c', '#8a4a30', '#5e2818']);
  });

  // 44 Raw Chicken - small meat on bone
  tile(TILE.ITEM_RAW_CHICKEN, (x, y) => {
    if (y < 4 || y > 13) return null;
    if (y < 6 && (x < 5 || x > 10)) return null;
    if (y > 11 && (x < 6 || x > 9)) return null;
    if (y === 12 && x === 7) return '#e3ded8';
    if (y > 10 && x >= 6 && x <= 9) return '#e3ded8';
    return pick(rnd, ['#e8a599', '#d99585', '#eab0a0', '#d89585']);
  });

  // 45 Cooked Chicken
  tile(TILE.ITEM_COOKED_CHICKEN, (x, y) => {
    if (y < 4 || y > 13) return null;
    if (y < 6 && (x < 5 || x > 10)) return null;
    if (y > 11 && (x < 6 || x > 9)) return null;
    if (y === 12 && x === 7) return '#e8dec8';
    if (y > 10 && x >= 6 && x <= 9) return '#e8dec8';
    if ((x + y) % 4 === 0) return '#61320d';
    return pick(rnd, ['#a35c24', '#8e4a18', '#b36628', '#85421a']);
  });

  // 46 Leather - tan hide square
  tile(TILE.ITEM_LEATHER, (x, y) => {
    if (x < 3 || x > 12 || y < 3 || y > 12) return null;
    if ((x + y) % 4 === 0) return '#6e3f20';
    if ((x + y) % 3 === 0) return '#a66a3f';
    return pick(rnd, ['#8f5630', '#7a4a28', '#965e36', '#7e4e2a']);
  });

  // 47 Feather - white fluffy barbs
  tile(TILE.ITEM_FEATHER, (x, y) => {
    const cx = 7.5;
    const along = y + (x - cx) * 0.4;
    const dist = Math.abs(x - cx) + (y < 4 ? (4 - y) : (y > 11 ? (y - 11) : 0));
    if (along < 2 || along > 14) return null;
    if (dist > 4) return null;
    if (Math.abs(x - cx) < 1 && y > 3 && y < 12) return '#737373';
    if ((x + y) % 2 === 0) return '#ffffff';
    return '#e8e8e8';
  });

  // 48 White Wool block face - opaque square textile pattern (not the round item icon).
  tile(TILE.ITEM_WHITE_WOOL, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#d8d8d8';
    if ((x + y) % 7 === 0) return '#f0f0f0';
    if ((x * 3 + y * 5) % 11 === 0) return '#ffffff';
    return pick(rnd, ['#ffffff', '#ffffff', '#fafafa', '#f5f5f5']);
  });

  // 49 Raw Iron - speckled iron ore chunk
  tile(TILE.ITEM_RAW_IRON, (x, y) => {
    if (x < 3 || x > 12 || y < 3 || y > 12) return null;
    if ((x + y * 2) % 4 === 0) return '#d2a87a';
    if ((x * 2 + y) % 5 === 0) return '#8c6c44';
    return pick(rnd, ['#a98b6b', '#c0a382', '#a4875f', '#b89b75']);
  });

  // 50 Raw Gold - speckled gold ore chunk
  tile(TILE.ITEM_RAW_GOLD, (x, y) => {
    if (x < 3 || x > 12 || y < 3 || y > 12) return null;
    if ((x + y * 2) % 4 === 0) return '#ffd700';
    if ((x * 2 + y) % 5 === 0) return '#c79d00';
    return pick(rnd, ['#c8a060', '#b89858', '#d2a86c', '#a88848']);
  });

  // 51 Oak Door - small wooden door panel with window cutout
  tile(TILE.ITEM_OAK_DOOR, (x, y) => {
    if (x < 5 || x > 10 || y < 1 || y > 14) return null;
    // Door frame outline
    if (x === 5 || x === 10) return '#3d2a13';
    if (y === 1 || y === 14) return '#3d2a13';
    // Window cutout
    if (y >= 4 && y <= 11 && x >= 7 && x <= 8) return '#7a99c4';
    if (y === 4 && x >= 7 && x <= 8) return '#a8c8e0';
    if (y === 11 && x >= 7 && x <= 8) return '#5a7a9a';
    // Handle
    if (x === 9 && y >= 7 && y <= 9) return '#3d2a13';
    return pick(rnd, ['#9c7f4e', '#a68754', '#8c7042', '#a18350']);
  });

  // 53 Oak door lower half: oak planks, framed panels and a dark handle.
  tile(TILE.DOOR_LOWER, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#51361c';
    if (x === 1 || x === 14) return '#76512a';
    if (y === 2 || y === 7 || y === 13) return '#805a2d';
    if (x === 6 || x === 10) return '#9b713b';
    if (x === 13 && y >= 6 && y <= 8) return '#392b1c';
    if (y === 1 || y === 8 || y === 14) return '#b28a4d';
    return pick(rnd, ['#a37b42', '#ad8549', '#98703a', '#b18a4d', '#9d7540']);
  });
  // 54 Oak door upper half: four inset glass panes in a dark oak frame.
  tile(TILE.DOOR_UPPER, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#51361c';
    if (x === 1 || x === 14 || y === 1 || y === 14) return '#76512a';
    const inPane = (x >= 4 && x <= 6 || x >= 9 && x <= 11) && (y >= 3 && y <= 6 || y >= 9 && y <= 12);
    if (inPane) {
      if (x === 4 || x === 9 || y === 3 || y === 9) return '#6b4a27';
      return (x + y) % 3 === 0 ? '#b8d7dc' : '#8fb9c7';
    }
    if (x === 7 || x === 8 || y === 7 || y === 8) return '#634522';
    if (y === 2 || y === 13) return '#a77e43';
    return pick(rnd, ['#9c743d', '#a98246', '#8e6838', '#aa8245']);
  });

  // Red bed textile and oak frame, with a directional white pillow on the head half.
  tile(TILE.BED_TOP_FOOT, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#7f2028';
    if (y === 3 || y === 12) return '#d6585c';
    return pick(rnd, ['#b52d37', '#c43740', '#a92732', '#ba303a']);
  });
  const bedHeadTiles = [
    { tile: TILE.BED_HEAD_NORTH, edge: 'north' },
    { tile: TILE.BED_HEAD_WEST, edge: 'west' },
    { tile: TILE.BED_HEAD_SOUTH, edge: 'south' },
    { tile: TILE.BED_HEAD_EAST, edge: 'east' },
  ] as const;
  for (const { tile: bedTile, edge } of bedHeadTiles) {
    tile(bedTile, (x, y) => {
      // CanvasTexture's top-face UVs invert pixel edges relative to world X/Z.
      const onPillow = edge === 'north' ? y >= 11 && y <= 14
        : edge === 'south' ? y >= 1 && y <= 4
        : edge === 'west' ? x >= 11 && x <= 14
        : x >= 1 && x <= 4;
      if (onPillow) return (x + y) % 4 === 0 ? '#ded8ca' : '#f3ead9';
      if (x === 0 || x === 15 || y === 0 || y === 15) return '#7f2028';
      return pick(rnd, ['#b52d37', '#c43740', '#a92732', '#ba303a']);
    });
  }
  tile(TILE.BED_FRAME, (x, y) => {
    if (y === 0 || y === 15) return '#56351e';
    if (x % 5 === 0) return '#76502d';
    return pick(rnd, ['#8c6035', '#95683a', '#80552f', '#a0703c']);
  });
  tile(TILE.BED_SIDE, (x, y) => {
    if (y <= 2) return '#d55258';
    if (y >= 13) return '#603d24';
    return pick(rnd, ['#ad2933', '#bb333b', '#9f232c', '#b52d37']);
  });
  tile(TILE.BED_END, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return '#56351e';
    if (y === 4 || y === 11) return '#704a29';
    return pick(rnd, ['#8c6035', '#95683a', '#80552f', '#a0703c']);
  });
  tile(TILE.SAPLING, (x, y) => {
    if ((x >= 7 && x <= 9 && y >= 8 && y <= 14) || (x >= 5 && x <= 10 && y >= 12 && y <= 13)) return '#74451f';
    if ((x >= 5 && x <= 10 && y >= 4 && y <= 8) || (x >= 3 && x <= 6 && y >= 7 && y <= 10) || (x >= 10 && x <= 13 && y >= 7 && y <= 10)) {
      if ((x + y) % 4 === 0) return '#72c54b';
      if ((x * 3 + y) % 5 === 0) return '#1f6424';
      return '#34892e';
    }
    return null;
  });

  // Create Three.js Texture
  atlasTexture = new THREE.CanvasTexture(atlasCanvas);
  atlasTexture.magFilter = THREE.NearestFilter;
  atlasTexture.minFilter = THREE.NearestFilter;
  atlasTexture.generateMipmaps = false;

  // Build Bold Breaking Cracks (10 stages)
  buildCrackStages();

  // Generate All UI Item Icons
  generateAllItemIcons();
}

/**
 * Builds 10 high-contrast, bold block fracture stages (Minecraft-accurate web cracks)
 */
function buildCrackStages() {
  crackTextures = [];
  const rnd = mulberry32(8888);

  // Define heavy fracture branch coordinates radiating outward from center
  const branches = [
    // Center cluster
    [[8, 8], [7, 6], [5, 5], [3, 4], [1, 3]],
    [[8, 8], [9, 6], [11, 5], [13, 3], [15, 2]],
    [[8, 8], [10, 9], [12, 11], [14, 13], [15, 14]],
    [[8, 8], [6, 10], [5, 12], [3, 14], [1, 15]],
    [[7, 6], [5, 8], [3, 9], [1, 9]],
    [[9, 6], [11, 8], [14, 8], [15, 9]],
    [[6, 10], [8, 12], [8, 15]],
    [[10, 9], [8, 11], [8, 14]],
    [[5, 5], [2, 6], [0, 6]],
    [[11, 5], [13, 7], [15, 7]],
  ];

  for (let stage = 0; stage < 10; stage++) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Determine how many branches to draw for this stage
    const activeBranches = Math.max(1, Math.min(branches.length, Math.ceil(((stage + 1) / 10) * branches.length)));
    const maxDepth = Math.max(1, Math.ceil(((stage + 1) / 10) * 5));

    // First pass: white contrast glow around cracks (so they are visible on dark blocks!)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.4;
    for (let b = 0; b < activeBranches; b++) {
      const pts = branches[b];
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + 0.5, pts[0][1] + 0.5);
      for (let p = 1; p < Math.min(pts.length, maxDepth); p++) {
        ctx.lineTo(pts[p][0] + 0.5, pts[p][1] + 0.5);
      }
      ctx.stroke();
    }

    // Second pass: thick, jet-black jagged fracture lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.6;
    for (let b = 0; b < activeBranches; b++) {
      const pts = branches[b];
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + 0.5, pts[0][1] + 0.5);
      for (let p = 1; p < Math.min(pts.length, maxDepth); p++) {
        ctx.lineTo(pts[p][0] + 0.5, pts[p][1] + 0.5);
      }
      ctx.stroke();
    }

    // Heavy shattered stage: fill center shatter chunks
    if (stage >= 5) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(7, 7, 2, 2);
    }
    if (stage >= 7) {
      ctx.fillRect(6, 6, 4, 4);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    crackTextures.push(tex);
  }
}

/**
 * Procedural Item Icon Generator
 */
export function generateAllItemIcons() {
  itemIconTextures.forEach((texture) => texture.dispose());
  itemIconTextures.clear();
  itemIconCanvases.clear();
  Object.keys(iconDataUrls).forEach((id) => delete iconDataUrls[Number(id)]);

  // First, map block items from atlas
  for (const key in BLOCK_DEFS) {
    const blockId = Number(key);
    const def = BLOCK_DEFS[blockId];
    if (!def) continue;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Use front or side tile for blocks
    const tileIdx = def.front !== undefined ? def.front : def.side;
    const tx = (tileIdx % TILES_PER_ROW) * TILE_SIZE;
    const ty = Math.floor(tileIdx / TILES_PER_ROW) * TILE_SIZE;

    if (atlasCanvas) {
      ctx.drawImage(atlasCanvas, tx, ty, TILE_SIZE, TILE_SIZE, 2, 2, 28, 28);
    }
    cacheItemIcon(blockId, canvas);
  }

  // Draw slabs as a half-height isometric block rather than a full-cube icon.
  for (const blockId of [BlockType.STONE_SLAB, BlockType.OAK_PLANKS_SLAB]) {
    const def = BLOCK_DEFS[blockId];
    if (!def || !atlasCanvas) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const paintClippedTile = (tile: number, points: number[][], shade = 0) => {
      const tx = (tile % TILES_PER_ROW) * TILE_SIZE;
      const ty = Math.floor(tile / TILES_PER_ROW) * TILE_SIZE;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(atlasCanvas!, tx, ty, TILE_SIZE, TILE_SIZE, 3, 2, 26, 26);
      if (shade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(3, 2, 26, 26);
      }
      ctx.restore();
    };
    paintClippedTile(def.top, [[4, 10], [16, 3], [28, 10], [16, 17]]);
    paintClippedTile(def.side, [[4, 10], [16, 17], [16, 25], [4, 18]]);
    paintClippedTile(def.side, [[16, 17], [28, 10], [28, 18], [16, 25]], 0.18);
    ctx.strokeStyle = 'rgba(25,20,15,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 10); ctx.lineTo(16, 17); ctx.lineTo(28, 10);
    ctx.moveTo(16, 17); ctx.lineTo(16, 25); ctx.lineTo(4, 18); ctx.lineTo(4, 10);
    ctx.moveTo(16, 25); ctx.lineTo(28, 18); ctx.lineTo(28, 10);
    ctx.stroke();
    cacheItemIcon(blockId, canvas);
  }

  // Keep the inventory icon as one complete door sprite; the world itself uses
  // separately textured upper and lower door blocks.
  if (atlasCanvas) {
    const doorCanvas = document.createElement('canvas');
    doorCanvas.width = 32;
    doorCanvas.height = 32;
    const ctx = doorCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const tx = (TILE.ITEM_OAK_DOOR % TILES_PER_ROW) * TILE_SIZE;
    const ty = Math.floor(TILE.ITEM_OAK_DOOR / TILES_PER_ROW) * TILE_SIZE;
    ctx.drawImage(atlasCanvas, tx, ty, TILE_SIZE, TILE_SIZE, 2, 2, 28, 28);
    cacheItemIcon(BlockType.OAK_DOOR, doorCanvas);
  }

  // One complete 3-D bed icon for crafting output and inventory (not a wood tile).
  const bedCanvas = document.createElement('canvas');
  bedCanvas.width = 32;
  bedCanvas.height = 32;
  const bedCtx = bedCanvas.getContext('2d')!;
  bedCtx.imageSmoothingEnabled = false;
  const bedPoly = (points: number[][], fill: string) => {
    bedCtx.beginPath();
    bedCtx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) bedCtx.lineTo(points[i][0], points[i][1]);
    bedCtx.closePath();
    bedCtx.fillStyle = fill;
    bedCtx.fill();
    bedCtx.strokeStyle = '#4a2b1a';
    bedCtx.lineWidth = 1;
    bedCtx.stroke();
  };
  bedPoly([[7, 16], [18, 10], [28, 15], [17, 22], [17, 27], [7, 21]], '#84552f');
  bedPoly([[17, 22], [28, 15], [28, 20], [17, 27]], '#633e25');
  bedPoly([[5, 14], [17, 7], [29, 14], [17, 21]], '#b52d37');
  bedPoly([[5, 14], [17, 21], [17, 25], [5, 18]], '#98242e');
  bedPoly([[17, 21], [29, 14], [29, 18], [17, 25]], '#7f2028');
  bedPoly([[8, 13], [16, 8.5], [22, 12], [14, 16]], '#f3ead9');
  cacheItemIcon(BlockType.BED, bedCanvas);

  // Draw standalone items (stick, tools, ores, ingots, food, armor)
  const drawIcon = (id: AnyItemId, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    cacheItemIcon(id, c);
  };

  const drawVoxelIcon = (id: AnyItemId, colors: { top: string; left: string; right: string; fleck: string; accent?: string }) => {
    drawIcon(id, (ctx) => {
      const faces = [
        { points: [[16, 2], [30, 10], [16, 18], [2, 10]], color: colors.top },
        { points: [[2, 10], [16, 18], [16, 31], [2, 23]], color: colors.left },
        { points: [[16, 18], [30, 10], [30, 23], [16, 31]], color: colors.right },
      ];
      faces.forEach((face, faceIndex) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(face.points[0][0], face.points[0][1]);
        for (let i = 1; i < face.points.length; i++) ctx.lineTo(face.points[i][0], face.points[i][1]);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = face.color;
        ctx.fillRect(0, 0, 32, 32);
        for (let y = 7; y < 29; y += 4) for (let x = 4; x < 29; x += 5) {
          const pick = (x * 13 + y * 7 + faceIndex * 17) % 5;
          if (pick < 2) {
            ctx.fillStyle = pick === 0 ? colors.fleck : (colors.accent || face.color);
            ctx.fillRect(x, y, 2 + (pick === 0 ? 1 : 0), 2);
          }
        }
        ctx.restore();
      });
      ctx.strokeStyle = '#252525';
      ctx.lineWidth = 1;
      for (const face of faces) {
        ctx.beginPath();
        ctx.moveTo(face.points[0][0], face.points[0][1]);
        for (let i = 1; i < face.points.length; i++) ctx.lineTo(face.points[i][0], face.points[i][1]);
        ctx.closePath();
        ctx.stroke();
      }
      if (id === BlockType.FURNACE) {
        ctx.fillStyle = '#22282a';
        ctx.fillRect(20, 12, 6, 7);
        ctx.fillStyle = '#ff8c21';
        ctx.fillRect(22, 15, 2, 3);
      }
      if (id === BlockType.COAL_ORE) {
        ctx.fillStyle = '#111111';
        [[7, 9], [20, 7], [12, 17], [22, 21], [7, 20]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 3));
      }
      if (id === BlockType.IRON_ORE) {
        ctx.fillStyle = '#bb8058';
        [[7, 9], [20, 7], [12, 17], [22, 21]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 3));
      }
      if (id === BlockType.WHITE_WOOL_BLOCK) {
        ctx.strokeStyle = '#bdbdbd';
        ctx.beginPath(); ctx.moveTo(8, 13); ctx.lineTo(13, 16); ctx.moveTo(20, 21); ctx.lineTo(25, 18); ctx.stroke();
      }
    });
  };

  drawVoxelIcon(BlockType.FURNACE, { top: '#777d80', left: '#62686a', right: '#484e50', fleck: '#a4aaab' });
  drawVoxelIcon(BlockType.COAL_ORE, { top: '#777777', left: '#686868', right: '#555555', fleck: '#313131', accent: '#2a2a2a' });
  drawVoxelIcon(BlockType.IRON_ORE, { top: '#83807d', left: '#6c6966', right: '#595653', fleck: '#c58d68', accent: '#d8ac86' });
  drawVoxelIcon(BlockType.STONE, { top: '#898989', left: '#737373', right: '#5c5c5c', fleck: '#4a4a4a', accent: '#a0a0a0' });
  drawVoxelIcon(BlockType.BEDROCK, { top: '#333333', left: '#222222', right: '#111111', fleck: '#050505', accent: '#4b4b4b' });
  drawVoxelIcon(BlockType.OBSIDIAN, { top: '#332548', left: '#241833', right: '#171020', fleck: '#624b81', accent: '#3e2b5b' });
  drawVoxelIcon(BlockType.COBBLESTONE, { top: '#858585', left: '#6d6d6d', right: '#555555', fleck: '#3e3e3e', accent: '#999999' });
  drawVoxelIcon(BlockType.WHITE_WOOL_BLOCK, { top: '#ffffff', left: '#f3f3f3', right: '#dedede', fleck: '#d5d5d5', accent: '#ffffff' });

  // Stick
  drawIcon(ItemType.STICK, (ctx) => {
    ctx.fillStyle = '#6e5124';
    for (let i = 6; i < 26; i += 2) {
      ctx.fillRect(i, 30 - i, 3, 3);
    }
  });

  drawIcon(ItemType.OAK_SAPLING, (ctx) => {
    ctx.fillStyle = '#71461f';
    ctx.fillRect(15, 14, 3, 13);
    ctx.fillRect(11, 19, 5, 2);
    ctx.fillRect(17, 22, 5, 2);
    ctx.fillStyle = '#2c842e';
    ctx.fillRect(12, 7, 9, 8);
    ctx.fillRect(7, 11, 8, 7);
    ctx.fillRect(18, 11, 8, 7);
    ctx.fillStyle = '#62b83d';
    ctx.fillRect(12, 8, 5, 4);
    ctx.fillRect(19, 12, 4, 3);
    ctx.fillStyle = '#1e6427';
    ctx.fillRect(9, 16, 6, 3);
  });
  drawIcon(BlockType.OAK_SAPLING, (ctx) => {
    ctx.fillStyle = '#71461f';
    ctx.fillRect(15, 14, 3, 13);
    ctx.fillRect(11, 19, 5, 2);
    ctx.fillRect(17, 22, 5, 2);
    ctx.fillStyle = '#2c842e';
    ctx.fillRect(12, 7, 9, 8);
    ctx.fillRect(7, 11, 8, 7);
    ctx.fillRect(18, 11, 8, 7);
    ctx.fillStyle = '#62b83d';
    ctx.fillRect(12, 8, 5, 4);
    ctx.fillRect(19, 12, 4, 3);
    ctx.fillStyle = '#1e6427';
    ctx.fillRect(9, 16, 6, 3);
  });

  drawIcon(ItemType.SHEARS, (ctx) => {
    ctx.fillStyle = '#dce4e8';
    ctx.fillRect(12, 5, 3, 12);
    ctx.fillRect(18, 5, 3, 12);
    ctx.fillRect(10, 7, 3, 7);
    ctx.fillRect(20, 7, 3, 7);
    ctx.fillStyle = '#8a969d';
    ctx.fillRect(14, 13, 5, 4);
    ctx.fillRect(8, 12, 9, 3);
    ctx.fillRect(15, 12, 9, 3);
    ctx.fillStyle = '#b23c36';
    ctx.fillRect(5, 19, 8, 8);
    ctx.fillRect(19, 19, 8, 8);
    ctx.fillStyle = '#252b30';
    ctx.fillRect(8, 22, 3, 3);
    ctx.fillRect(21, 22, 3, 3);
  });

  // Coal
  drawIcon(ItemType.COAL, (ctx) => {
    ctx.fillStyle = '#222';
    ctx.fillRect(8, 10, 16, 14);
    ctx.fillStyle = '#111';
    ctx.fillRect(10, 8, 12, 18);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(12, 12, 4, 4);
  });

  drawIcon(ItemType.FLINT, (ctx) => {
    ctx.fillStyle = '#31383d';
    ctx.beginPath(); ctx.moveTo(7, 22); ctx.lineTo(10, 12); ctx.lineTo(18, 6); ctx.lineTo(25, 11); ctx.lineTo(27, 20); ctx.lineTo(19, 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#68747b'; ctx.fillRect(12, 11, 7, 3); ctx.fillRect(9, 17, 5, 3);
    ctx.fillStyle = '#171b1e'; ctx.fillRect(18, 17, 7, 5);
  });
  drawIcon(ItemType.RAW_IRON, (ctx) => {
    ctx.fillStyle = '#9a6043'; ctx.fillRect(7, 13, 18, 10); ctx.fillRect(10, 9, 12, 15);
    ctx.fillStyle = '#c58d68'; ctx.fillRect(10, 10, 7, 4); ctx.fillRect(18, 16, 6, 4);
    ctx.fillStyle = '#654334'; ctx.fillRect(9, 21, 14, 3);
  });
  drawIcon(ItemType.RAW_GOLD, (ctx) => {
    ctx.fillStyle = '#b88716'; ctx.fillRect(7, 13, 18, 10); ctx.fillRect(10, 9, 12, 15);
    ctx.fillStyle = '#f2cd43'; ctx.fillRect(10, 10, 7, 4); ctx.fillRect(18, 16, 6, 4);
    ctx.fillStyle = '#80600c'; ctx.fillRect(9, 21, 14, 3);
  });

  // Charcoal
  drawIcon(ItemType.CHARCOAL, (ctx) => {
    ctx.fillStyle = '#2c2520';
    ctx.fillRect(9, 10, 14, 14);
    ctx.fillStyle = '#1a1614';
    ctx.fillRect(11, 8, 10, 18);
    ctx.fillStyle = '#423730';
    ctx.fillRect(12, 12, 3, 3);
  });

  // Iron Ingot
  drawIcon(ItemType.IRON_INGOT, (ctx) => {
    ctx.fillStyle = '#aebbc2';
    ctx.fillRect(6, 12, 20, 10);
    ctx.fillStyle = '#dce5e9';
    ctx.fillRect(8, 10, 16, 4);
    ctx.fillStyle = '#64727a';
    ctx.fillRect(6, 20, 20, 3);
  });

  // Gold Ingot
  drawIcon(ItemType.GOLD_INGOT, (ctx) => {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(6, 12, 20, 10);
    ctx.fillStyle = '#fff575';
    ctx.fillRect(8, 10, 16, 4);
    ctx.fillStyle = '#c79d00';
    ctx.fillRect(6, 20, 20, 3);
  });

  // Diamond
  drawIcon(ItemType.DIAMOND, (ctx) => {
    ctx.fillStyle = '#4dedf4';
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(26, 12);
    ctx.lineTo(16, 28);
    ctx.lineTo(6, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 8, 4, 4);
    ctx.fillStyle = '#1f989e';
    ctx.fillRect(14, 18, 4, 6);
  });

  // Apple
  drawIcon(ItemType.APPLE, (ctx) => {
    ctx.fillStyle = '#d11a2a';
    ctx.fillRect(8, 10, 16, 14);
    ctx.fillRect(10, 8, 12, 18);
    ctx.fillStyle = '#5c3a1e'; // stem
    ctx.fillRect(15, 4, 3, 5);
    ctx.fillStyle = '#3fa32b'; // leaf
    ctx.fillRect(18, 5, 4, 3);
    ctx.fillStyle = '#ff6b77'; // highlight
    ctx.fillRect(10, 10, 3, 3);
  });

  // Bread
  drawIcon(ItemType.BREAD, (ctx) => {
    ctx.fillStyle = '#c8923a';
    ctx.fillRect(6, 12, 20, 10);
    ctx.fillStyle = '#e2aa4f';
    ctx.fillRect(8, 10, 16, 5);
    ctx.fillStyle = '#7a4b14'; // cuts
    ctx.fillRect(11, 11, 2, 8);
    ctx.fillRect(15, 11, 2, 8);
    ctx.fillRect(19, 11, 2, 8);
  });

  // Raw Beef
  drawIcon(ItemType.RAW_BEEF, (ctx) => {
    ctx.fillStyle = '#b83333';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#ffffff'; // bone/fat
    ctx.fillRect(10, 8, 4, 4);
    ctx.fillStyle = '#8f2323';
    ctx.fillRect(12, 14, 8, 6);
  });

  // Cooked Steak
  drawIcon(ItemType.COOKED_STEAK, (ctx) => {
    ctx.fillStyle = '#6b361a';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#e0ded3'; // bone
    ctx.fillRect(10, 8, 4, 4);
    ctx.fillStyle = '#3d1d0c'; // grilled marks
    ctx.fillRect(14, 12, 2, 8);
    ctx.fillRect(18, 12, 2, 8);
  });

  // Raw Porkchop
  drawIcon(ItemType.RAW_PORKCHOP, (ctx) => {
    ctx.fillStyle = '#e88b8b';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#fce4e4';
    ctx.fillRect(10, 8, 4, 4);
    ctx.fillStyle = '#cc6666';
    ctx.fillRect(12, 13, 8, 5);
  });

  // Cooked Porkchop
  drawIcon(ItemType.COOKED_PORKCHOP, (ctx) => {
    ctx.fillStyle = '#a66e46';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#e3cfc1';
    ctx.fillRect(10, 8, 4, 4);
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(14, 11, 2, 8);
    ctx.fillRect(18, 11, 2, 8);
  });

  // Raw Mutton
  drawIcon(ItemType.RAW_MUTTON, (ctx) => {
    ctx.fillStyle = '#bd4f4f';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#f5e1e1';
    ctx.fillRect(8, 8, 4, 4);
  });

  // Cooked Mutton
  drawIcon(ItemType.COOKED_MUTTON, (ctx) => {
    ctx.fillStyle = '#7a3e28';
    ctx.fillRect(8, 10, 16, 12);
    ctx.fillStyle = '#d6c0b4';
    ctx.fillRect(8, 8, 4, 4);
  });

  // Raw Chicken
  drawIcon(ItemType.RAW_CHICKEN, (ctx) => {
    ctx.fillStyle = '#e8a599';
    ctx.fillRect(10, 10, 12, 14);
    ctx.fillStyle = '#e3ded8'; // bone stick
    ctx.fillRect(14, 22, 4, 6);
  });

  // Cooked Chicken
  drawIcon(ItemType.COOKED_CHICKEN, (ctx) => {
    ctx.fillStyle = '#a35c24';
    ctx.fillRect(10, 10, 12, 14);
    ctx.fillStyle = '#e8dec8'; // bone stick
    ctx.fillRect(14, 22, 4, 6);
    ctx.fillStyle = '#61320d';
    ctx.fillRect(12, 12, 4, 6);
  });

  // Leather
  drawIcon(ItemType.LEATHER, (ctx) => {
    ctx.fillStyle = '#8f5630';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#6e3f20';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = '#a66a3f';
    ctx.fillRect(8, 8, 4, 4);
  });

  // Feather
  drawIcon(ItemType.FEATHER, (ctx) => {
    ctx.fillStyle = '#e8e8e8';
    for (let i = 8; i <= 22; i += 2) {
      ctx.fillRect(i, 30 - i, 4, 4);
      ctx.fillRect(i - 2, 30 - i + 2, 4, 4);
    }
    ctx.fillStyle = '#737373'; // quill stem
    for (let i = 6; i <= 24; i += 2) {
      ctx.fillRect(i, 30 - i, 2, 2);
    }
  });

  // White Wool
  drawIcon(ItemType.WHITE_WOOL, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#f1f1f1';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#d6d6d6';
    ctx.fillRect(10, 14, 6, 4);
  });

  // Tool Drawing Helpers
  const materials: Record<string, { head: string; light: string; dark: string }> = {
    wood: { head: '#9c7f4e', light: '#b89860', dark: '#5e4823' },
    stone: { head: '#7f7f7f', light: '#a0a0a0', dark: '#4f4f4f' },
    iron: { head: '#aebbc2', light: '#dce5e9', dark: '#64727a' },
    gold: { head: '#e8b923', light: '#fff27a', dark: '#9a6a00' },
    diamond: { head: '#4dedf4', light: '#b8ffff', dark: '#1f989e' },
  };

  const drawStick = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#6e5124';
    for (let i = 8; i < 24; i += 2) {
      ctx.fillRect(i, 30 - i, 2, 2);
    }
  };

  // Pickaxes
  const pickaxes: [ItemType, string][] = [
    [ItemType.WOODEN_PICKAXE, 'wood'],
    [ItemType.STONE_PICKAXE, 'stone'],
    [ItemType.IRON_PICKAXE, 'iron'],
    [ItemType.DIAMOND_PICKAXE, 'diamond'],
    [ItemType.GOLD_PICKAXE, 'gold'],
  ];
  pickaxes.forEach(([id, matKey]) => {
    drawIcon(id, (ctx) => {
      drawStick(ctx);
      const col = materials[matKey];
      ctx.fillStyle = col.head;
      ctx.fillRect(9, 4, 18, 4);
      ctx.fillRect(6, 6, 24, 4);
      ctx.fillRect(4, 8, 5, 4);
      ctx.fillRect(27, 8, 5, 4);
      ctx.fillStyle = col.light;
      ctx.fillRect(10, 5, 14, 2);
      ctx.fillStyle = col.dark;
      ctx.fillRect(4, 10, 5, 2);
      ctx.fillRect(27, 10, 5, 2);
    });
  });

  // Axes
  const axes: [ItemType, string][] = [
    [ItemType.WOODEN_AXE, 'wood'],
    [ItemType.STONE_AXE, 'stone'],
    [ItemType.IRON_AXE, 'iron'],
    [ItemType.DIAMOND_AXE, 'diamond'],
    [ItemType.GOLD_AXE, 'gold'],
  ];
  axes.forEach(([id, matKey]) => {
    drawIcon(id, (ctx) => {
      drawStick(ctx);
      const col = materials[matKey];
      ctx.fillStyle = col.head;
      ctx.fillRect(16, 4, 10, 8);
      ctx.fillRect(14, 8, 4, 6);
      ctx.fillStyle = col.light;
      ctx.fillRect(18, 4, 6, 2);
    });
  });

  // Shovels
  const shovels: [ItemType, string][] = [
    [ItemType.WOODEN_SHOVEL, 'wood'],
    [ItemType.STONE_SHOVEL, 'stone'],
    [ItemType.IRON_SHOVEL, 'iron'],
    [ItemType.DIAMOND_SHOVEL, 'diamond'],
    [ItemType.GOLD_SHOVEL, 'gold'],
  ];
  shovels.forEach(([id, matKey]) => {
    drawIcon(id, (ctx) => {
      drawStick(ctx);
      const col = materials[matKey];
      ctx.fillStyle = col.head;
      ctx.fillRect(18, 6, 8, 8);
      ctx.fillStyle = col.light;
      ctx.fillRect(20, 6, 4, 4);
    });
  });

  // Swords
  const swords: [ItemType, string][] = [
    [ItemType.WOODEN_SWORD, 'wood'],
    [ItemType.STONE_SWORD, 'stone'],
    [ItemType.IRON_SWORD, 'iron'],
    [ItemType.DIAMOND_SWORD, 'diamond'],
    [ItemType.GOLD_SWORD, 'gold'],
  ];
  swords.forEach(([id, matKey]) => {
    drawIcon(id, (ctx) => {
      // Hilt
      ctx.fillStyle = '#6e5124';
      ctx.fillRect(6, 24, 4, 4);
      // Guard
      ctx.fillStyle = '#444';
      ctx.fillRect(8, 20, 8, 3);
      ctx.fillRect(11, 18, 3, 7);
      // Blade
      const col = materials[matKey];
      ctx.fillStyle = col.head;
      for (let i = 12; i <= 24; i += 2) {
        ctx.fillRect(i, 28 - i, 4, 4);
      }
      ctx.fillStyle = col.light;
      ctx.fillRect(24, 4, 4, 4);
    });
  });

  // Four complete armor families, using clear pixel-art silhouettes per slot.
  const drawArmorIcon = (id: ItemType, piece: 'helmet' | 'chest' | 'legs' | 'boots', colors: { main: string; light: string; dark: string }) => {
    drawIcon(id, (ctx) => {
      ctx.fillStyle = colors.dark;
      if (piece === 'helmet') {
        ctx.fillRect(7, 11, 18, 13);
        ctx.fillRect(9, 7, 14, 5);
        ctx.fillStyle = colors.main;
        ctx.fillRect(9, 9, 14, 12);
        ctx.fillRect(11, 6, 10, 4);
        ctx.fillStyle = colors.light;
        ctx.fillRect(11, 10, 4, 3);
        ctx.fillRect(9, 18, 14, 3);
        ctx.fillStyle = '#1d2023';
        ctx.fillRect(11, 15, 10, 4);
      } else if (piece === 'chest') {
        ctx.fillRect(5, 8, 22, 17);
        ctx.fillRect(7, 5, 7, 7);
        ctx.fillRect(18, 5, 7, 7);
        ctx.fillStyle = colors.main;
        ctx.fillRect(8, 8, 16, 14);
        ctx.fillRect(6, 10, 5, 10);
        ctx.fillRect(21, 10, 5, 10);
        ctx.fillStyle = colors.light;
        ctx.fillRect(10, 9, 4, 7);
        ctx.fillRect(14, 20, 4, 3);
        ctx.fillStyle = '#1d2023';
        ctx.fillRect(13, 6, 6, 4);
      } else if (piece === 'legs') {
        ctx.fillRect(7, 6, 18, 7);
        ctx.fillRect(8, 12, 7, 15);
        ctx.fillRect(17, 12, 7, 15);
        ctx.fillStyle = colors.main;
        ctx.fillRect(9, 8, 14, 4);
        ctx.fillRect(10, 13, 4, 11);
        ctx.fillRect(18, 13, 4, 11);
        ctx.fillStyle = colors.light;
        ctx.fillRect(10, 8, 5, 2);
        ctx.fillRect(10, 14, 2, 7);
      } else {
        ctx.fillRect(6, 12, 9, 13);
        ctx.fillRect(17, 12, 9, 13);
        ctx.fillRect(5, 22, 11, 5);
        ctx.fillRect(16, 22, 11, 5);
        ctx.fillStyle = colors.main;
        ctx.fillRect(8, 13, 5, 8);
        ctx.fillRect(19, 13, 5, 8);
        ctx.fillRect(7, 22, 8, 3);
        ctx.fillRect(17, 22, 8, 3);
        ctx.fillStyle = colors.light;
        ctx.fillRect(8, 14, 2, 5);
        ctx.fillRect(19, 14, 2, 5);
      }
    });
  };
  const armorColors = {
    leather: { main: '#9a6338', light: '#c18a55', dark: '#57361f' },
    iron: { main: '#aab7bf', light: '#d5e0e5', dark: '#56636c' },
    gold: { main: '#edc52e', light: '#fff18a', dark: '#8f6508' },
    diamond: { main: '#42d9dc', light: '#b9ffff', dark: '#176f7a' },
  };
  const armorSets: Array<{ colors: typeof armorColors.leather; ids: [ItemType, ItemType, ItemType, ItemType] }> = [
    { colors: armorColors.leather, ids: [ItemType.LEATHER_HELMET, ItemType.LEATHER_CHESTPLATE, ItemType.LEATHER_LEGGINGS, ItemType.LEATHER_BOOTS] },
    { colors: armorColors.iron, ids: [ItemType.IRON_HELMET, ItemType.IRON_CHESTPLATE, ItemType.IRON_LEGGINGS, ItemType.IRON_BOOTS] },
    { colors: armorColors.gold, ids: [ItemType.GOLD_HELMET, ItemType.GOLD_CHESTPLATE, ItemType.GOLD_LEGGINGS, ItemType.GOLD_BOOTS] },
    { colors: armorColors.diamond, ids: [ItemType.DIAMOND_HELMET, ItemType.DIAMOND_CHESTPLATE, ItemType.DIAMOND_LEGGINGS, ItemType.DIAMOND_BOOTS] },
  ];
  for (const set of armorSets) {
    drawArmorIcon(set.ids[0], 'helmet', set.colors);
    drawArmorIcon(set.ids[1], 'chest', set.colors);
    drawArmorIcon(set.ids[2], 'legs', set.colors);
    drawArmorIcon(set.ids[3], 'boots', set.colors);
  }

  // Never leave a registered item as a transparent/white-looking blank icon.
  for (const [rawId, def] of Object.entries(ITEM_DEFS)) {
    const id = Number(rawId) as AnyItemId;
    const canvas = itemIconCanvases.get(id);
    const data = canvas?.getContext('2d')?.getImageData(0, 0, 32, 32).data;
    let hasVisiblePixel = false;
    if (data) {
      for (let alpha = 3; alpha < data.length; alpha += 4) {
        if (data[alpha] > 0) {
          hasVisiblePixel = true;
          break;
        }
      }
    }
    if (hasVisiblePixel) continue;
    drawIcon(id, (ctx) => {
      const hue = (id * 47) % 360;
      ctx.fillStyle = `hsl(${hue}, 62%, 48%)`;
      ctx.fillRect(7, 7, 18, 18);
      ctx.fillStyle = '#202020';
      ctx.fillRect(9, 9, 14, 14);
      ctx.fillStyle = `hsl(${hue}, 72%, 66%)`;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.name.slice(0, 1).toLocaleUpperCase('tr'), 16, 16);
    });
  }
}

/**
 * Get icon URL for any item or block
 */
export function getItemIcon(id: AnyItemId): string {
  if (iconDataUrls[id]) return iconDataUrls[id];
  // Fallback
  return '';
}

/** Reuses the exact inventory pixel-art icon as a crisp 3D drop texture. */
export function getItemTexture(id: AnyItemId): THREE.CanvasTexture | null {
  const iconCanvas = itemIconCanvases.get(id) ??
    (id === ItemType.WHITE_WOOL ? itemIconCanvases.get(BlockType.WHITE_WOOL_BLOCK) : undefined);
  if (!iconCanvas) return null;

  let texture = itemIconTextures.get(id);
  if (!texture) {
    texture = new THREE.CanvasTexture(iconCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    itemIconTextures.set(id, texture);
  }
  return texture;
}
