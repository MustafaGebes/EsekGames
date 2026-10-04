/**
 * Minecraft Web - Crafting Recipes & Smelting
 */
import { BlockType, ItemType, AnyItemId, ItemStack, CraftingRecipe } from './types';

export interface SmeltRecipe {
  input: AnyItemId;
  output: ItemStack;
  cookTime: number; // in seconds (default 10s in Minecraft)
}

export const SMELTING_RECIPES: SmeltRecipe[] = [
  { input: ItemType.RAW_IRON, output: { id: ItemType.IRON_INGOT, count: 1 }, cookTime: 8 },
  { input: ItemType.RAW_GOLD, output: { id: ItemType.GOLD_INGOT, count: 1 }, cookTime: 8 },
  { input: BlockType.SAND, output: { id: BlockType.GLASS, count: 1 }, cookTime: 8 },
  { input: BlockType.COBBLESTONE, output: { id: BlockType.STONE, count: 1 }, cookTime: 8 },
  { input: BlockType.OAK_LOG, output: { id: ItemType.CHARCOAL, count: 1 }, cookTime: 8 },
  { input: ItemType.RAW_BEEF, output: { id: ItemType.COOKED_STEAK, count: 1 }, cookTime: 8 },
  { input: ItemType.RAW_PORKCHOP, output: { id: ItemType.COOKED_PORKCHOP, count: 1 }, cookTime: 8 },
  { input: ItemType.RAW_MUTTON, output: { id: ItemType.COOKED_MUTTON, count: 1 }, cookTime: 8 },
  { input: ItemType.RAW_CHICKEN, output: { id: ItemType.COOKED_CHICKEN, count: 1 }, cookTime: 8 },
];

export function findSmeltRecipe(input: AnyItemId): SmeltRecipe | null {
  return SMELTING_RECIPES.find((r) => r.input === input) || null;
}

// Crafting Recipes
const _ = null;
const LOG = BlockType.OAK_LOG;
const PLK = BlockType.OAK_PLANKS;
const STK = ItemType.STICK;
const COB = BlockType.COBBLESTONE;
const STN = BlockType.STONE;
const TAB = BlockType.CRAFTING_TABLE;
const COL = ItemType.COAL;
const CHR = ItemType.CHARCOAL;
const IRN = ItemType.IRON_INGOT;
const GLD = ItemType.GOLD_INGOT;
const DIA = ItemType.DIAMOND;
const FUR = BlockType.FURNACE;
const CST = BlockType.CHEST;
const TRC = BlockType.TORCH;
const GLS = BlockType.GLASS;
const SND = BlockType.SAND;
const DOOR = BlockType.OAK_DOOR;
const SHEARS = ItemType.SHEARS;
const RAW_IRN = ItemType.RAW_IRON;
const RAW_GLD = ItemType.RAW_GOLD;
const BREAD = ItemType.BREAD;

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // 1 Log -> 4 Planks (1x1 shapeless)
  {
    id: 'planks',
    name: 'Meşe Tahtası',
    width: 1,
    height: 1,
    pattern: [LOG],
    output: { id: PLK, count: 4 },
    category: 'building',
  },
  // 2 Planks vertical -> 4 Sticks
  {
    id: 'sticks',
    name: 'Çubuk',
    width: 1,
    height: 2,
    pattern: [PLK, PLK],
    output: { id: STK, count: 4 },
    category: 'survival',
  },
  // 4 Planks (2x2) -> Crafting Table
  {
    id: 'crafting_table',
    name: 'Çalışma Masası',
    width: 2,
    height: 2,
    pattern: [PLK, PLK, PLK, PLK],
    output: { id: TAB, count: 1 },
    category: 'building',
  },
  // Torch with Coal
  {
    id: 'torch_coal',
    name: 'Meşale',
    width: 1,
    height: 2,
    pattern: [COL, STK],
    output: { id: TRC, count: 4 },
    category: 'survival',
  },
  // Torch with Charcoal
  {
    id: 'torch_charcoal',
    name: 'Meşale (Odun Kömürü)',
    width: 1,
    height: 2,
    pattern: [CHR, STK],
    output: { id: TRC, count: 4 },
    category: 'survival',
  },

  // 8 Cobblestone -> Furnace (3x3 ring)
  {
    id: 'furnace',
    name: 'Ocak',
    width: 3,
    height: 3,
    pattern: [COB, COB, COB, COB, _, COB, COB, COB, COB],
    output: { id: FUR, count: 1 },
    category: 'building',
  },
  // 8 Planks -> Chest (3x3 ring)
  {
    id: 'chest',
    name: 'Sandık',
    width: 3,
    height: 3,
    pattern: [PLK, PLK, PLK, PLK, _, PLK, PLK, PLK, PLK],
    output: { id: CST, count: 1 },
    category: 'building',
  },

  // PICKAXES
  {
    id: 'wood_pickaxe',
    name: 'Tahta Kazma',
    width: 3,
    height: 3,
    pattern: [PLK, PLK, PLK, _, STK, _, _, STK, _],
    output: { id: ItemType.WOODEN_PICKAXE, count: 1, durability: 59, maxDurability: 59 },
    category: 'tools',
  },
  {
    id: 'stone_pickaxe',
    name: 'Taş Kazma',
    width: 3,
    height: 3,
    pattern: [COB, COB, COB, _, STK, _, _, STK, _],
    output: { id: ItemType.STONE_PICKAXE, count: 1, durability: 131, maxDurability: 131 },
    category: 'tools',
  },
  {
    id: 'iron_pickaxe',
    name: 'Demir Kazma',
    width: 3,
    height: 3,
    pattern: [IRN, IRN, IRN, _, STK, _, _, STK, _],
    output: { id: ItemType.IRON_PICKAXE, count: 1, durability: 250, maxDurability: 250 },
    category: 'tools',
  },
  {
    id: 'diamond_pickaxe',
    name: 'Elmas Kazma',
    width: 3,
    height: 3,
    pattern: [DIA, DIA, DIA, _, STK, _, _, STK, _],
    output: { id: ItemType.DIAMOND_PICKAXE, count: 1, durability: 1561, maxDurability: 1561 },
    category: 'tools',
  },

  // AXES
  {
    id: 'wood_axe',
    name: 'Tahta Balta',
    width: 2,
    height: 3,
    pattern: [PLK, PLK, PLK, STK, _, STK],
    output: { id: ItemType.WOODEN_AXE, count: 1, durability: 59, maxDurability: 59 },
    category: 'tools',
  },
  {
    id: 'stone_axe',
    name: 'Taş Balta',
    width: 2,
    height: 3,
    pattern: [COB, COB, COB, STK, _, STK],
    output: { id: ItemType.STONE_AXE, count: 1, durability: 131, maxDurability: 131 },
    category: 'tools',
  },
  {
    id: 'iron_axe',
    name: 'Demir Balta',
    width: 2,
    height: 3,
    pattern: [IRN, IRN, IRN, STK, _, STK],
    output: { id: ItemType.IRON_AXE, count: 1, durability: 250, maxDurability: 250 },
    category: 'tools',
  },
  {
    id: 'diamond_axe',
    name: 'Elmas Balta',
    width: 2,
    height: 3,
    pattern: [DIA, DIA, DIA, STK, _, STK],
    output: { id: ItemType.DIAMOND_AXE, count: 1, durability: 1561, maxDurability: 1561 },
    category: 'tools',
  },

  // SHOVELS
  {
    id: 'wood_shovel',
    name: 'Tahta Kürek',
    width: 1,
    height: 3,
    pattern: [PLK, STK, STK],
    output: { id: ItemType.WOODEN_SHOVEL, count: 1, durability: 59, maxDurability: 59 },
    category: 'tools',
  },
  {
    id: 'stone_shovel',
    name: 'Taş Kürek',
    width: 1,
    height: 3,
    pattern: [COB, STK, STK],
    output: { id: ItemType.STONE_SHOVEL, count: 1, durability: 131, maxDurability: 131 },
    category: 'tools',
  },
  {
    id: 'iron_shovel',
    name: 'Demir Kürek',
    width: 1,
    height: 3,
    pattern: [IRN, STK, STK],
    output: { id: ItemType.IRON_SHOVEL, count: 1, durability: 250, maxDurability: 250 },
    category: 'tools',
  },
  {
    id: 'diamond_shovel',
    name: 'Elmas Kürek',
    width: 1,
    height: 3,
    pattern: [DIA, STK, STK],
    output: { id: ItemType.DIAMOND_SHOVEL, count: 1, durability: 1561, maxDurability: 1561 },
    category: 'tools',
  },

  // SWORDS
  {
    id: 'wood_sword',
    name: 'Tahta Kılıç',
    width: 1,
    height: 3,
    pattern: [PLK, PLK, STK],
    output: { id: ItemType.WOODEN_SWORD, count: 1, durability: 59, maxDurability: 59 },
    category: 'combat',
  },
  {
    id: 'stone_sword',
    name: 'Taş Kılıç',
    width: 1,
    height: 3,
    pattern: [COB, COB, STK],
    output: { id: ItemType.STONE_SWORD, count: 1, durability: 131, maxDurability: 131 },
    category: 'combat',
  },
  {
    id: 'iron_sword',
    name: 'Demir Kılıç',
    width: 1,
    height: 3,
    pattern: [IRN, IRN, STK],
    output: { id: ItemType.IRON_SWORD, count: 1, durability: 250, maxDurability: 250 },
    category: 'combat',
  },
  {
    id: 'diamond_sword',
    name: 'Elmas Kılıç',
    width: 1,
    height: 3,
    pattern: [DIA, DIA, STK],
    output: { id: ItemType.DIAMOND_SWORD, count: 1, durability: 1561, maxDurability: 1561 },
    category: 'combat',
  },

  // ARMOR
  {
    id: 'iron_helmet',
    name: 'Demir Kask',
    width: 3,
    height: 2,
    pattern: [IRN, IRN, IRN, IRN, _, IRN],
    output: { id: ItemType.IRON_HELMET, count: 1, durability: 165, maxDurability: 165 },
    category: 'combat',
  },
  {
    id: 'iron_chestplate',
    name: 'Demir Zırh',
    width: 3,
    height: 3,
    pattern: [IRN, _, IRN, IRN, IRN, IRN, IRN, IRN, IRN],
    output: { id: ItemType.IRON_CHESTPLATE, count: 1, durability: 240, maxDurability: 240 },
    category: 'combat',
  },
  {
    id: 'iron_leggings',
    name: 'Demir Pantolon',
    width: 3,
    height: 3,
    pattern: [IRN, IRN, IRN, IRN, _, IRN, IRN, _, IRN],
    output: { id: ItemType.IRON_LEGGINGS, count: 1, durability: 225, maxDurability: 225 },
    category: 'combat',
  },
  {
    id: 'iron_boots',
    name: 'Demir Bot',
    width: 3,
    height: 2,
    pattern: [IRN, _, IRN, IRN, _, IRN],
    output: { id: ItemType.IRON_BOOTS, count: 1, durability: 195, maxDurability: 195 },
    category: 'combat',
  },
  {
    id: 'diamond_chestplate',
    name: 'Elmas Zırh',
    width: 3,
    height: 3,
    pattern: [DIA, _, DIA, DIA, DIA, DIA, DIA, DIA, DIA],
    output: { id: ItemType.DIAMOND_CHESTPLATE, count: 1, durability: 528, maxDurability: 528 },
    category: 'combat',
  },

  // ====== NEW RECIPES (minecraft.wiki standard shapes) ======

  // Wooden Door (6 planks, 2x3 two vertical columns)
  {
    id: 'wooden_door',
    name: 'Meşe Kapı',
    width: 2,
    height: 3,
    pattern: [PLK, PLK, PLK, PLK, PLK, PLK],
    output: { id: DOOR, count: 1 },
    category: 'building',
  },

  // 4 Sand -> 4 Sandstone would need a new block; skip for now.
  // Instead, let's add shaped "Shapeless" Cobblestone -> 4 Gravel via crafting? No gravel.
  // Charcoal from Log is handled in SMELTING_RECIPES already.

  // Flint & Steel would need FLINT ItemType on its own (already exists)
  // 1 IRN + 1 FLINT -> 1 Flint and Steel - useful but requires new item type.
  // Skip tool-only items; users already have iron tools via recipes above.

  // 9 Diamonds -> Diamond Block (block type missing)
  // 9 Iron Ingots -> Iron Block (block type missing)

  // 1 Coal/Charcoal + 8 Sticks placed in a + shape -> 8 Torches
  {
    id: 'torch_bulk',
    name: 'Meşale (8x)',
    width: 3,
    height: 3,
    pattern: [STK, COL, STK, STK, STK, STK, STK, STK, STK],
    output: { id: TRC, count: 8 },
    category: 'survival',
  },
  {
    id: 'torch_bulk_charcoal',
    name: 'Meşale (Odun Kömürü, 8x)',
    width: 3,
    height: 3,
    pattern: [STK, CHR, STK, STK, STK, STK, STK, STK, STK],
    output: { id: TRC, count: 8 },
    category: 'survival',
  },

  // 4 Wood Log -> 4 Charcoal via furnace is already in SMELTING_RECIPES.

  // Raw Iron / Raw Gold are already mineable; smelting yields ingots.

  // Bed: three matching wool across a row over three planks.
  { id: 'bed', name: 'Yatak', width: 3, height: 2, pattern: [ItemType.WHITE_WOOL, ItemType.WHITE_WOOL, ItemType.WHITE_WOOL, PLK, PLK, PLK], output: { id: BlockType.BED, count: 1 }, category: 'building' },
  // Three matching blocks across a row craft six lower slabs.
  { id: 'stone_slab', name: 'Taş Yarım Basamak', width: 3, height: 1, pattern: [STN, STN, STN], output: { id: BlockType.STONE_SLAB, count: 6 }, category: 'building' },
  { id: 'oak_planks_slab', name: 'Meşe Tahta Yarım Basamak', width: 3, height: 1, pattern: [PLK, PLK, PLK], output: { id: BlockType.OAK_PLANKS_SLAB, count: 6 }, category: 'building' },
  { id: 'shears', name: 'Makas', width: 2, height: 2, pattern: [IRN, _, _, IRN], output: { id: SHEARS, count: 1, durability: 238, maxDurability: 238 }, category: 'tools' },
];

/**
 * Trims an input crafting grid (2x2 or 3x3) to its minimal bounding box
 */
function trimGrid(grid: (ItemStack | null)[], size: number): {
  width: number;
  height: number;
  pattern: (AnyItemId | null)[];
} | null {
  let minX = size,
    maxX = -1,
    minY = size,
    maxY = -1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const item = grid[y * size + x];
      if (item && item.count > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1) return null; // empty grid

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const pattern: (AnyItemId | null)[] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const item = grid[y * size + x];
      pattern.push(item && item.count > 0 ? item.id : null);
    }
  }

  return { width, height, pattern };
}

/**
 * Check if two patterns match (exact or horizontally mirrored)
 */
function patternMatches(
  p1: (AnyItemId | null)[],
  p2: (AnyItemId | null)[],
  width: number,
  height: number
): boolean {
  if (p1.length !== p2.length) return false;

  // Exact match check
  let exact = true;
  for (let i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i]) {
      exact = false;
      break;
    }
  }
  if (exact) return true;

  // Mirror match check (e.g. axe facing left or right)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const origIdx = y * width + x;
      const mirrorIdx = y * width + (width - 1 - x);
      if (p1[origIdx] !== p2[mirrorIdx]) return false;
    }
  }

  return true;
}

/**
 * Match a crafting recipe given a 2x2 or 3x3 grid
 */
export function matchRecipe(
  grid: (ItemStack | null)[],
  gridSize: 2 | 3
): { recipe: CraftingRecipe; output: ItemStack } | null {
  const trimmed = trimGrid(grid, gridSize);
  if (!trimmed) return null;

  for (const recipe of CRAFTING_RECIPES) {
    if (recipe.width === trimmed.width && recipe.height === trimmed.height) {
      if (patternMatches(trimmed.pattern, recipe.pattern, recipe.width, recipe.height)) {
        return {
          recipe,
          output: { ...recipe.output },
        };
      }
    }
  }

  return null;
}
