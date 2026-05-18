/**
 * 共享 PRNG — 给所有 P1 客户级 Tab 的 mock 数据生成器用。
 *
 * 同一个 `userId + kind` 永远生成相同序列，方便演示和回归测试。
 * （这是简化版的 mock 数据基础设施，P2 阶段接入真实 API 时整体替换。）
 */

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function seededRng(seed: string): () => number {
  let s = hashSeed(seed);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngHelpers(r: () => number) {
  return {
    int:   (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min,
    float: (min: number, max: number) => r() * (max - min) + min,
    pick:  <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)],
    weighted: <T,>(items: readonly [T, number][]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let p = r() * total;
      for (const [v, w] of items) {
        p -= w;
        if (p <= 0) return v;
      }
      return items[items.length - 1][0];
    },
    bool:  (probTrue: number) => r() < probTrue,
  };
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function shortDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
