/**
 * Card ranks (fractional indexing). A card's place in its collection is its `rank`, a string compared
 * by code unit (the same order as IndexedDB and Postgres `COLLATE "C"`); ties break by card id.
 * Moving a card only rewrites that card: it gets a rank between its new neighbours.
 *
 * Key generation comes from the `fractional-indexing` package (base 62). The server uses the .NET port
 * of the same algorithm (NuGet `FractionalIndexing`), so ranks made on either side sort together.
 */
import { BASE_62_DIGITS, generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

/** A rank strictly between `a` and `b` (`null` = open end). Throws if either is invalid or `a >= b`. */
export function rankBetween(a: string | null, b: string | null): string {
  // The library would quietly accept reversed neighbours; an inverted pair here is a bug, so fail loudly.
  if (a !== null && b !== null && a >= b) throw new Error(`${a} >= ${b}`);
  return generateKeyBetween(a, b);
}

/** `n` ascending ranks strictly between `a` and `b`, spread so later inserts stay short. */
export function ranksBetween(a: string | null, b: string | null, n: number): string[] {
  if (a !== null && b !== null && a >= b) throw new Error(`${a} >= ${b}`);
  return generateNKeysBetween(a, b, n);
}

/**
 * True if `rank` is a well-formed key. The library validates the key's structure when it generates
 * from it, but not the characters of the fractional part (it accepts "a0 "), so those are checked here.
 */
export function isValidRank(rank: unknown): rank is string {
  if (typeof rank !== 'string' || rank.length === 0) return false;
  if (![...rank].every((c) => BASE_62_DIGITS.includes(c))) return false;
  try {
    generateKeyBetween(rank, null);
    return true;
  } catch {
    return false;
  }
}

/** Keeps valid ranks; cards without one get ranks after the highest valid rank, in list order. */
export function withRanks<T extends { rank?: string }>(items: T[]): T[] {
  let last = items.map((item) => item.rank).filter(isValidRank).sort().pop() ?? null;
  return items.map((item) => {
    if (isValidRank(item.rank)) return item;
    last = rankBetween(last, null);
    return { ...item, rank: last };
  });
}
