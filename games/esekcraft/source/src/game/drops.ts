import { AnyItemId, ItemType } from './types';

export interface RandomItemDrop {
  id: AnyItemId;
  count: number;
}

/** Vanilla-style independent oak-leaf drops: 5% sapling, 2% sticks, 0.5% apple. */
export function rollOakLeafDrops(random: () => number = Math.random): RandomItemDrop[] {
  const drops: RandomItemDrop[] = [];
  if (random() < 0.05) drops.push({ id: ItemType.OAK_SAPLING, count: 1 });
  if (random() < 0.02) drops.push({ id: ItemType.STICK, count: Math.floor(random() * 2) + 1 });
  if (random() < 0.005) drops.push({ id: ItemType.APPLE, count: 1 });
  return drops;
}
