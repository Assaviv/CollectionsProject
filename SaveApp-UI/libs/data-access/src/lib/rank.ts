/**
 * Card ranks (fractional indexing). A card's place in its collection is its `rank`, a string compared
 * by code unit (the same order as IndexedDB and Postgres `COLLATE "C"`); ties break by card id.
 * Moving a card only rewrites that card: it gets a rank between its new neighbours.
 *
 * Port of the `fractional-indexing` algorithm (rocicorp/fractional-indexing, base 62). A rank is an
 * "integer" part (head letter + digits; the head encodes the length) followed by an optional fraction
 * that never ends in '0'. The server's `RankKey.AppendAfter` (CollectionsDB) produces the same keys as
 * `rankBetween(last, null)`; keep the two in step.
 */
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ZERO = DIGITS[0];
const SMALLEST_INTEGER = 'A' + ZERO.repeat(26);

/** A rank strictly between `a` and `b` (`null` = open end). Throws if either is invalid or `a >= b`. */
export function rankBetween(a: string | null, b: string | null): string {
  if (a !== null) assertValid(a);
  if (b !== null) assertValid(b);
  if (a !== null && b !== null && a >= b) throw new Error(`${a} >= ${b}`);

  if (a === null) {
    if (b === null) return 'a' + ZERO;
    const ib = integerPart(b);
    const fb = b.slice(ib.length);
    if (ib === SMALLEST_INTEGER) return ib + midpoint('', fb);
    if (ib < b) return ib;
    const decremented = decrementInteger(ib);
    if (decremented === null) throw new Error('Cannot rank before the smallest key');
    return decremented;
  }

  const ia = integerPart(a);
  const fa = a.slice(ia.length);
  if (b === null) return incrementInteger(ia) ?? ia + midpoint(fa, null);

  const ib = integerPart(b);
  const fb = b.slice(ib.length);
  if (ia === ib) return ia + midpoint(fa, fb);
  const incremented = incrementInteger(ia);
  if (incremented === null) throw new Error('Cannot increment the largest key');
  return incremented < b ? incremented : ia + midpoint(fa, null);
}

/** `n` ascending ranks strictly between `a` and `b`, spread so later inserts stay short. */
export function ranksBetween(a: string | null, b: string | null, n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [rankBetween(a, b)];
  if (b === null) {
    const result = [rankBetween(a, null)];
    while (result.length < n) result.push(rankBetween(result[result.length - 1], null));
    return result;
  }
  if (a === null) {
    const result = [rankBetween(null, b)];
    while (result.length < n) result.push(rankBetween(null, result[result.length - 1]));
    return result.reverse();
  }
  const half = Math.floor(n / 2);
  const middle = rankBetween(a, b);
  return [...ranksBetween(a, middle, half), middle, ...ranksBetween(middle, b, n - half - 1)];
}

export function isValidRank(rank: unknown): rank is string {
  if (typeof rank !== 'string' || rank.length === 0 || rank === SMALLEST_INTEGER) return false;
  if (![...rank].every((c) => DIGITS.includes(c))) return false;
  const length = integerLength(rank[0]);
  if (length === null || rank.length < length) return false;
  return rank.length === length || rank[rank.length - 1] !== ZERO;
}

/** Code-unit order, then id: the order every store shows cards in. */
export function compareRanked(a: { rank?: string; id: string }, b: { rank?: string; id: string }): number {
  const ra = a.rank ?? '';
  const rb = b.rank ?? '';
  if (ra !== rb) return ra < rb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
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

function assertValid(rank: string): void {
  if (!isValidRank(rank)) throw new Error(`Invalid rank: ${rank}`);
}

// 'a' → 2 chars ("a0".."az"), 'b' → 3, …; 'Z' → 2, 'Y' → 3, … (upper-case heads sort before lower-case).
function integerLength(head: string): number | null {
  if (head >= 'a' && head <= 'z') return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2;
  if (head >= 'A' && head <= 'Z') return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2;
  return null;
}

function integerPart(rank: string): string {
  return rank.slice(0, integerLength(rank[0])!);
}

function incrementInteger(integer: string): string | null {
  const [head, ...digits] = integer;
  for (let i = digits.length - 1; i >= 0; i--) {
    const next = DIGITS.indexOf(digits[i]) + 1;
    if (next < DIGITS.length) {
      digits[i] = DIGITS[next];
      return head + digits.join('');
    }
    digits[i] = ZERO;
  }
  if (head === 'Z') return 'a' + ZERO;
  if (head === 'z') return null;
  const nextHead = String.fromCharCode(head.charCodeAt(0) + 1);
  if (nextHead > 'a') digits.push(ZERO);
  else digits.pop();
  return nextHead + digits.join('');
}

function decrementInteger(integer: string): string | null {
  const [head, ...digits] = integer;
  const largest = DIGITS[DIGITS.length - 1];
  for (let i = digits.length - 1; i >= 0; i--) {
    const previous = DIGITS.indexOf(digits[i]) - 1;
    if (previous >= 0) {
      digits[i] = DIGITS[previous];
      return head + digits.join('');
    }
    digits[i] = largest;
  }
  if (head === 'a') return 'Z' + largest;
  if (head === 'A') return null;
  const previousHead = String.fromCharCode(head.charCodeAt(0) - 1);
  if (previousHead < 'Z') digits.push(largest);
  else digits.pop();
  return previousHead + digits.join('');
}

/** A fraction strictly between `a` and `b` (`null` = 1). Neither may end in '0'. */
function midpoint(a: string, b: string | null): string {
  if (b !== null) {
    let n = 0;
    while ((a[n] ?? ZERO) === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0]) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0]) : DIGITS.length;
  if (digitB - digitA > 1) return DIGITS[Math.round((digitA + digitB) / 2)];
  if (b !== null && b.length > 1) return b.slice(0, 1);
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}
