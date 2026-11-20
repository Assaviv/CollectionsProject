import { compareRanked, isValidRank, rankBetween, ranksBetween, withRanks } from './rank';

describe('rank', () => {
  it('matches the documented examples', () => {
    expect(rankBetween(null, null)).toBe('a0');
    expect(rankBetween('a0', 'a1')).toBe('a0V');
    expect(rankBetween('a0', 'a0V')).toBe('a0G');
    expect(rankBetween('a2', null)).toBe('a3');
    expect(rankBetween(null, 'a0')).toBe('Zz');
  });

  // Same cases as the server's RankKey.AppendAfter: both sides must produce identical keys.
  it.each([
    ['a0', 'a1'],
    ['a0V', 'a1'],
    ['az', 'b00'],
    ['b0z', 'b10'],
    ['bzz', 'c000'],
    ['Zz', 'a0'],
    ['Yzz', 'Z0'],
  ])('appends after %s as %s', (last, next) => {
    expect(rankBetween(last, null)).toBe(next);
  });

  it('always lands strictly between its neighbours, however often a gap is split', () => {
    let low = 'a0';
    let high = 'a1';
    for (let i = 0; i < 200; i++) {
      const mid = rankBetween(low, high);
      expect(isValidRank(mid)).toBe(true);
      expect(low < mid && mid < high).toBe(true);
      if (i % 2) low = mid;
      else high = mid;
    }
  });

  it('spreads n ranks in ascending order', () => {
    const ranks = ranksBetween(null, null, 100);
    expect(ranks).toHaveLength(100);
    expect([...ranks].sort()).toEqual(ranks);
    expect(new Set(ranks).size).toBe(100);
    expect(ranksBetween('a0', 'a1', 5).every((r) => r > 'a0' && r < 'a1')).toBe(true);
  });

  it('rejects malformed ranks', () => {
    for (const bad of ['', 'a', 'a00', 'a0 ', '!0', 'A' + '0'.repeat(26), undefined, 3]) {
      expect(isValidRank(bad)).toBe(false);
    }
    expect(() => rankBetween('a1', 'a0')).toThrow();
    expect(() => rankBetween('a1', 'a1')).toThrow();
  });

  it('keeps valid ranks and appends ranks for the rest, in list order', () => {
    const ranked = withRanks([{ rank: 'a5' }, {}, { rank: 'a00' }]);
    expect(ranked.map((c) => c.rank)).toEqual(['a5', 'a6', 'a7']);
  });

  it('orders by rank in code unit order, then by id', () => {
    const cards = [
      { id: 'b', rank: 'a1' },
      { id: 'a', rank: 'a1' },
      { id: 'c', rank: 'Zz' },
      { id: 'd', rank: 'a0V' },
    ];
    expect([...cards].sort(compareRanked).map((c) => c.id)).toEqual(['c', 'd', 'a', 'b']);
  });
});
