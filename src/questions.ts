/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2 (Primary 2) Hong Kong maths — 7 zones x 5 progressive levels.
 * Topics taken from the local P2 textbooks (Vol 1 三位數 + Vol 2 四位數):
 *  - 數字 (3-digit & 4-digit: place value, order, odd/even, compare)
 *  - 加減 (add/subtract within 3-digit, mixed, word problems)
 *  - 貨幣 (HK money: value, change, compare, shopping)
 *  - 乘除 (multiplication concept & facts, sharing & basic division)
 *  - 度量 (length m/cm, telling time, time intervals, dates)
 *  - 圖形 (angles, lines & quadrilaterals, 3D solids, directions)
 *  - 數據 (pictograms & block graphs)
 *
 * Every item is multiple-choice with exactly ONE correct option.
 */

import type { Visual } from './Visuals';

export interface Question {
  text: string;
  answer: number | string;
  options: (number | string)[];
  visual?: Visual;
  passage?: string;
  glosses?: Record<string, string>;
}

export interface LevelMeta {
  title: string;
  desc: string;
}

export const LEVELS_PER_SECTION = 5;
export const QUESTIONS_PER_LEVEL = 5;
export const PASS_MARK = 3; // need >=3 / 5 to clear a level
export const MAX_STARS = LEVELS_PER_SECTION * 5 * 3;

export const SECTION_LEVELS: Record<string, LevelMeta[]> = {
  numbers: [
    { title: '認識三位數', desc: '百、十、個位。' },
    { title: '順數倒數 · 單雙', desc: '搵規律、分單雙。' },
    { title: '比較大小', desc: '邊個數大啲？' },
    { title: '認識四位數', desc: '千位嚟喇！' },
    { title: '四位數排序', desc: '由細到大。' },
  ],
  addsub: [
    { title: '兩位數加減', desc: '熱身啦！' },
    { title: '三位數加法', desc: '小心進位。' },
    { title: '三位數減法', desc: '小心退位。' },
    { title: '加減混合', desc: '由左至右計。' },
    { title: '加減應用題', desc: '生活情境。' },
  ],
  money: [
    { title: '數一數有幾多錢', desc: '硬幣同紙幣。' },
    { title: '貨幣總值', desc: '加埋一齊。' },
    { title: '找續', desc: '應該找返幾多？' },
    { title: '比較價錢', desc: '邊樣最貴？' },
    { title: '購物應用題', desc: '買嘢計數。' },
  ],
  muldiv: [
    { title: '乘法的認識', desc: '同數相加。' },
    { title: '乘數表', desc: '基本乘法。' },
    { title: '平均分', desc: '公平咁分。' },
    { title: '基本除法', desc: '除法基本功。' },
    { title: '乘除應用題', desc: '生活挑戰。' },
  ],
  measure: [
    { title: '米和厘米', desc: '長度單位換算。' },
    { title: '報時和分鐘', desc: '睇鐘讀時間。' },
    { title: '時間間隔', desc: '過咗幾耐？' },
    { title: '日期', desc: '日、月、年。' },
    { title: '度量應用題', desc: '長度與時間。' },
  ],
  shape: [
    { title: '認識角', desc: '直角、銳角、鈍角。' },
    { title: '比較角', desc: '同直角比一比。' },
    { title: '線段和四邊形', desc: '邊同角。' },
    { title: '立體圖形', desc: '認識立體。' },
    { title: '方向', desc: '東南西北。' },
  ],
  data: [
    { title: '讀象形圖', desc: '邊樣最多？' },
    { title: '象形圖計數', desc: '加埋一齊。' },
    { title: '象形圖比較', desc: '多幾多？' },
    { title: '讀方塊圖', desc: '睇圖讀數。' },
    { title: '數據應用題', desc: '綜合挑戰。' },
  ],
};

// ---------- helpers ----------
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pick = <T>(arr: T[]): T => arr[rnd(0, arr.length - 1)];

// 4 unique numeric options including the answer; distractors near it, never equal, never negative.
const numOptions = (answer: number, spread = 10): (number | string)[] => {
  const opts = new Set<number>([answer]);
  let guard = 0;
  while (opts.size < 4 && guard < 200) {
    guard++;
    const offset = rnd(-spread, spread);
    if (offset === 0) continue;
    const o = answer + offset;
    if (o >= 0 && o !== answer) opts.add(o);
  }
  let extra = 1;
  while (opts.size < 4) {
    if (answer + extra >= 0) opts.add(answer + extra);
    opts.add(answer + extra + 1);
    extra++;
  }
  return shuffle(Array.from(opts));
};

const strOptions = (answer: string, distractors: string[]): string[] => {
  const set: string[] = [answer];
  for (const d of shuffle(distractors)) {
    if (set.length >= 4) break;
    if (!set.includes(d)) set.push(d);
  }
  return shuffle(set);
};

// 4 distinct numbers; the answer is the largest (or smallest if which==='min').
const compareOptions = (lo: number, hi: number, which: 'max' | 'min'): { answer: number; options: number[] } => {
  const set = new Set<number>();
  let guard = 0;
  while (set.size < 4 && guard < 200) { guard++; set.add(rnd(lo, hi)); }
  while (set.size < 4) set.add(hi - set.size);
  const arr = Array.from(set);
  const answer = which === 'max' ? Math.max(...arr) : Math.min(...arr);
  return { answer, options: shuffle(arr) };
};

const timeStr = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

// pick `k` distinct single-digit-ish numbers including `must`, for digit-extraction distractors
const digitOpts = (must: number): number[] => {
  const set = new Set<number>([must]);
  while (set.size < 4) set.add(rnd(0, 9));
  return shuffle(Array.from(set));
};

// ---------- 數字 ----------
function genNumbers(level: number): Question {
  if (level === 0) {
    const h = rnd(1, 9), t = rnd(0, 9), o = rnd(0, 9);
    const n = h * 100 + t * 10 + o;
    const v = rnd(0, 2);
    if (v === 0)
      return { text: `${h} 個百 + ${t} 個十 + ${o} 個一 = ?`, answer: n, options: numOptions(n, 30), visual: { kind: 'place', hundreds: h, tens: t, ones: o } };
    if (v === 1)
      return { text: `數字 ${n} 嘅「百位」數字係幾多？`, answer: h, options: digitOpts(h) };
    return { text: `睇圖數一數，一共有幾多？`, answer: n, options: numOptions(n, 40), visual: { kind: 'place', hundreds: h, tens: t, ones: o } };
  }
  if (level === 1) {
    const v = rnd(0, 2);
    if (v === 0) {
      const step = pick([1, 2, 5, 10]);
      const start = rnd(10, 200);
      const seq = [start, start + step, start + 2 * step];
      return { text: `搵規律，下一個數係？  ${seq.join('、')}、？`, answer: start + 3 * step, options: numOptions(start + 3 * step, step * 3) };
    }
    if (v === 1) {
      const even = 2 * rnd(5, 49);
      const odds = new Set<number>();
      while (odds.size < 3) { const x = 2 * rnd(5, 49) + 1; if (x !== even) odds.add(x); }
      return { text: `邊個係雙數？`, answer: even, options: shuffle([even, ...Array.from(odds)]) };
    }
    const odd = 2 * rnd(5, 49) + 1;
    const evens = new Set<number>();
    while (evens.size < 3) { const x = 2 * rnd(5, 49); if (x !== odd) evens.add(x); }
    return { text: `邊個係單數？`, answer: odd, options: shuffle([odd, ...Array.from(evens)]) };
  }
  if (level === 2) {
    const which = pick(['max', 'min'] as const);
    const { answer, options } = compareOptions(101, 999, which);
    return { text: which === 'max' ? `邊個數最大？` : `邊個數最細？`, answer, options };
  }
  if (level === 3) {
    const th = rnd(1, 9), h = rnd(0, 9), t = rnd(0, 9), o = rnd(0, 9);
    const n = th * 1000 + h * 100 + t * 10 + o;
    if (rnd(0, 1) === 0) return { text: `數字 ${n} 嘅「千位」數字係幾多？`, answer: th, options: digitOpts(th) };
    return { text: `${th} 個千 + ${h} 個百 + ${t} 個十 + ${o} 個一 = ?`, answer: n, options: numOptions(n, 300) };
  }
  // level 4 — 4-digit compare
  const which = pick(['max', 'min'] as const);
  const { answer, options } = compareOptions(1001, 9999, which);
  return { text: which === 'max' ? `邊個數最大？` : `邊個數最細？`, answer, options };
}

// ---------- 加減 ----------
const ADDSUB_CTX = ['圖書館', '商店', '農場', '學校', '停車場'];
function genAddsub(level: number): Question {
  if (level === 0) {
    const a = rnd(11, 79), b = rnd(10, 20);
    if (rnd(0, 1) === 0) return { text: `${a} + ${b} = ?`, answer: a + b, options: numOptions(a + b, 12) };
    const big = Math.max(a, b) + 10, small = rnd(5, 30);
    return { text: `${big} − ${small} = ?`, answer: big - small, options: numOptions(big - small, 12) };
  }
  if (level === 1) {
    const a = rnd(120, 799), b = rnd(100, 199);
    return { text: `${a} + ${b} = ?`, answer: a + b, options: numOptions(a + b, 40) };
  }
  if (level === 2) {
    const a = rnd(300, 999), b = rnd(100, a - 50);
    return { text: `${a} − ${b} = ?`, answer: a - b, options: numOptions(a - b, 40) };
  }
  if (level === 3) {
    const a = rnd(100, 500), b = rnd(50, 300), c = rnd(20, Math.min(a + b - 10, 400));
    return { text: `${a} + ${b} − ${c} = ?`, answer: a + b - c, options: numOptions(a + b - c, 50) };
  }
  // level 4 — word problems
  const place = pick(ADDSUB_CTX);
  const start = rnd(150, 500), inc = rnd(50, 250), out = rnd(30, 200);
  return {
    text: `${place}原本有 ${start} 個，運入 ${inc} 個，再拎走 ${out} 個，依家有幾多個？`,
    answer: start + inc - out,
    options: numOptions(start + inc - out, 60),
  };
}

// ---------- 貨幣 ----------
function genMoney(level: number): Question {
  if (level === 0) {
    const items = shuffle([1, 2, 5, 10]).slice(0, 2).map((v) => ({ v, n: rnd(1, 3) }));
    const total = items.reduce((s, it) => s + it.v * it.n, 0);
    return { text: `數一數，一共有幾多錢？（$）`, answer: total, options: numOptions(total, 8), visual: { kind: 'coins', items } };
  }
  if (level === 1) {
    const coins = shuffle([1, 2, 5, 10]).slice(0, 2).map((v) => ({ v, n: rnd(1, 2) }));
    const note = { v: pick([20, 50]), n: 1 };
    const items = [note, ...coins];
    const total = items.reduce((s, it) => s + it.v * it.n, 0);
    return { text: `一共有幾多錢？（$）`, answer: total, options: numOptions(total, 12), visual: { kind: 'coins', items } };
  }
  if (level === 2) {
    const cost = rnd(12, 88);
    const realPay = cost <= 50 ? (rnd(0, 1) ? 50 : 100) : 100;
    return { text: `用 $${realPay} 買咗 $${cost} 嘅嘢，應該找返幾多錢？（$）`, answer: realPay - cost, options: numOptions(realPay - cost, 10) };
  }
  if (level === 3) {
    const which = pick(['貴', '平'] as const);
    const set = new Set<number>();
    while (set.size < 4) set.add(rnd(5, 95));
    const arr = Array.from(set);
    const answer = which === '貴' ? Math.max(...arr) : Math.min(...arr);
    return { text: which === '貴' ? `邊樣最貴？（$）` : `邊樣最平？（$）`, answer, options: shuffle(arr) };
  }
  // level 4 — shopping word problem
  const price = rnd(4, 15), qty = rnd(2, 5);
  if (rnd(0, 1) === 0)
    return { text: `一支筆 $${price}，買 ${qty} 支要幾多錢？（$）`, answer: price * qty, options: numOptions(price * qty, 10) };
  const total = price * qty, pay = total <= 50 ? 50 : 100;
  return { text: `一件玩具 $${price}，買 ${qty} 件，畀 $${pay}，找返幾多？（$）`, answer: pay - total, options: numOptions(pay - total, 10) };
}

// ---------- 乘除 ----------
const SHARE_FOODS = ['粒糖', '個橙', '塊餅', '個蘋果'];
function genMuldiv(level: number): Question {
  if (level === 0) {
    const a = rnd(2, 5), b = rnd(2, 5);
    if (rnd(0, 1) === 0)
      return { text: `${Array(b).fill(a).join(' + ')} = ?  （即係 ${a} × ${b}）`, answer: a * b, options: numOptions(a * b, 6), visual: { kind: 'dots', rows: b, cols: a } };
    return { text: `${a} × ${b} 即係幾多個 ${a} 相加？`, answer: b, options: numOptions(b, 3), visual: { kind: 'dots', rows: b, cols: a } };
  }
  if (level === 1) {
    const a = rnd(2, 9), b = rnd(2, 9);
    if (rnd(0, 2) === 0)
      return { text: `? × ${b} = ${a * b}`, answer: a, options: numOptions(a, 5), visual: { kind: 'dots', rows: a, cols: b } };
    return { text: `${a} × ${b} = ?`, answer: a * b, options: numOptions(a * b, 8), visual: { kind: 'dots', rows: a, cols: b } };
  }
  if (level === 2) {
    const k = rnd(2, 6), per = rnd(2, 9);
    const total = k * per;
    return { text: `${total} ${pick(SHARE_FOODS)}平均分畀 ${k} 個人，每人有幾多？`, answer: per, options: numOptions(per, 5) };
  }
  if (level === 3) {
    const b = rnd(2, 9), q = rnd(2, 9);
    return { text: `${b * q} ÷ ${b} = ?`, answer: q, options: numOptions(q, 5), visual: { kind: 'dots', rows: q, cols: b } };
  }
  // level 4 — word problems
  if (rnd(0, 1) === 0) {
    const per = rnd(3, 8), groups = rnd(2, 6);
    return { text: `每袋有 ${per} 個橙，${groups} 袋一共有幾多個橙？`, answer: per * groups, options: numOptions(per * groups, 8) };
  }
  const per = rnd(3, 8), groups = rnd(2, 6);
  return { text: `${per * groups} 本書平均放入 ${groups} 個書架，每個書架放幾多本？`, answer: per, options: numOptions(per, 5) };
}

// ---------- 度量 ----------
const MONTHS_31 = [1, 3, 5, 7, 8, 10, 12];
const MONTHS_30 = [4, 6, 9, 11];
function genMeasure(level: number): Question {
  if (level === 0) {
    if (rnd(0, 1) === 0) {
      const m = rnd(2, 9);
      return { text: `${m} 米 = ? 厘米`, answer: m * 100, options: numOptions(m * 100, 80) };
    }
    const m = rnd(1, 5), cm = rnd(1, 99);
    return { text: `${m} 米 ${cm} 厘米 = ? 厘米`, answer: m * 100 + cm, options: numOptions(m * 100 + cm, 60) };
  }
  if (level === 1) {
    const h = rnd(1, 12), m = rnd(0, 11) * 5;
    const ans = timeStr(h, m);
    const wrong = new Set<string>([
      timeStr(h, (m + 5) % 60),
      timeStr((h % 12) + 1, m),
      timeStr(h, (m + 30) % 60),
    ]);
    wrong.delete(ans);
    return { text: `睇鐘，而家幾多點？`, answer: ans, options: strOptions(ans, Array.from(wrong)), visual: { kind: 'clock', h, m } };
  }
  if (level === 2) {
    const h1 = rnd(1, 6), dur = rnd(1, 5);
    return { text: `由 ${h1} 時 到 ${h1 + dur} 時，過咗幾多個鐘頭？`, answer: dur, options: numOptions(dur, 3) };
  }
  if (level === 3) {
    const v = rnd(0, 3);
    if (v === 0) return { text: `一個星期有幾多日？`, answer: 7, options: strOptions('7', ['5', '6', '8', '10', '12']) };
    if (v === 1) return { text: `一年有幾多個月？`, answer: 12, options: strOptions('12', ['10', '11', '7', '24', '30']) };
    if (v === 2) return { text: `一日有幾多個鐘頭？`, answer: 24, options: strOptions('24', ['12', '60', '7', '30']) };
    const mth = pick([...MONTHS_31, ...MONTHS_30, 2]);
    const days = mth === 2 ? 28 : MONTHS_31.includes(mth) ? 31 : 30;
    return { text: `${mth} 月有幾多日？（平年）`, answer: days, options: strOptions(String(days), ['28', '29', '30', '31']) };
  }
  // level 4 — word problems
  if (rnd(0, 1) === 0) {
    const each = rnd(2, 6), n = rnd(2, 5);
    return { text: `一條繩長 ${each} 米，${n} 條繩一共長幾多厘米？`, answer: each * n * 100, options: numOptions(each * n * 100, 150) };
  }
  const start = rnd(1, 6), dur = rnd(1, 4);
  return { text: `一堂課 ${start} 時開始，上咗 ${dur} 個鐘，幾點完？`, answer: `${start + dur}:00`, options: strOptions(`${start + dur}:00`, [`${start}:00`, `${dur}:00`, `${start + dur + 1}:00`, `${start + dur - 1}:00`]) };
}

// ---------- 圖形 ----------
const ANGLE_NAME: Record<string, string> = { right: '直角', acute: '銳角', obtuse: '鈍角' };
const SOLID_NAME: Record<string, string> = { cube: '正方體', cuboid: '長方體', cylinder: '圓柱', cone: '圓錐', sphere: '球', prism: '三角柱' };
const DIR_NAME: Record<string, string> = { N: '北', E: '東', S: '南', W: '西' };
function genShape(level: number): Question {
  if (level === 0) {
    const t = pick(['right', 'acute', 'obtuse'] as const);
    return { text: `睇圖，呢個係咩角？`, answer: ANGLE_NAME[t], options: strOptions(ANGLE_NAME[t], ['直角', '銳角', '鈍角', '平角']), visual: { kind: 'angle', type: t } };
  }
  if (level === 1) {
    const t = pick(['right', 'acute', 'obtuse'] as const);
    const ans = t === 'right' ? '等於直角' : t === 'acute' ? '細過直角' : '大過直角';
    return { text: `呢個角同直角比較，係…？`, answer: ans, options: strOptions(ans, ['細過直角', '等於直角', '大過直角', '無法比較']), visual: { kind: 'angle', type: t } };
  }
  if (level === 2) {
    const v = rnd(0, 3);
    if (v === 0) return { text: `正方形有幾多條邊？`, answer: 4, options: strOptions('4', ['3', '5', '6', '8']) };
    if (v === 1) return { text: `正方形有幾多隻角？`, answer: 4, options: strOptions('4', ['3', '5', '6', '2']) };
    if (v === 2) return { text: `一條線段有幾多個端點？`, answer: 2, options: strOptions('2', ['1', '3', '4', '0']) };
    const sq = pick(['square', 'rectangle'] as const);
    const ans = sq === 'square' ? '正方形' : '長方形';
    return { text: `睇圖，呢個係咩圖形？`, answer: ans, options: strOptions(ans, ['正方形', '長方形', '三角形', '圓形']), visual: { kind: 'quad', shape: sq } };
  }
  if (level === 3) {
    const s = pick(['cube', 'cuboid', 'cylinder', 'cone', 'sphere', 'prism'] as const);
    return { text: `睇圖，呢個立體圖形叫咩？`, answer: SOLID_NAME[s], options: strOptions(SOLID_NAME[s], Object.values(SOLID_NAME)), visual: { kind: 'solid', shape: s } };
  }
  // level 4 — directions
  if (rnd(0, 1) === 0) {
    const f = pick(['N', 'E', 'S', 'W'] as const);
    return { text: `睇圖，紅色箭咀指向邊個方向？`, answer: DIR_NAME[f], options: strOptions(DIR_NAME[f], ['北', '東', '南', '西']), visual: { kind: 'compass', facing: f } };
  }
  const order: ('N' | 'E' | 'S' | 'W')[] = ['N', 'E', 'S', 'W'];
  const startI = rnd(0, 3);
  const turn = pick(['右', '左'] as const);
  const endI = turn === '右' ? (startI + 1) % 4 : (startI + 3) % 4;
  return { text: `面向${DIR_NAME[order[startI]]}，向${turn}轉，而家面向邊個方向？`, answer: DIR_NAME[order[endI]], options: strOptions(DIR_NAME[order[endI]], ['北', '東', '南', '西']), visual: { kind: 'compass', facing: order[startI] } };
}

// ---------- 數據 ----------
const DATASETS: { label: string; icon: string }[][] = [
  [{ label: '蘋果', icon: '🍎' }, { label: '香蕉', icon: '🍌' }, { label: '橙', icon: '🍊' }, { label: '提子', icon: '🍇' }],
  [{ label: '小狗', icon: '🐶' }, { label: '小貓', icon: '🐱' }, { label: '兔仔', icon: '🐰' }, { label: '雀仔', icon: '🐦' }],
  [{ label: '紅色', icon: '🔴' }, { label: '藍色', icon: '🔵' }, { label: '黃色', icon: '🟡' }, { label: '綠色', icon: '🟢' }],
];

function makeData(n: number): { label: string; icon: string; count: number }[] {
  const base = pick(DATASETS).slice(0, n);
  const counts = new Set<number>();
  while (counts.size < n) counts.add(rnd(1, 8));
  const cs = shuffle(Array.from(counts));
  return base.map((b, i) => ({ ...b, count: cs[i] }));
}

function genData(level: number): Question {
  if (level === 0) {
    const d = makeData(4);
    const top = d.reduce((a, b) => (b.count > a.count ? b : a));
    return { text: `睇象形圖，邊樣最多？`, answer: top.label, options: strOptions(top.label, d.map((x) => x.label)), visual: { kind: 'pictogram', rows: d.map((x) => ({ label: x.label, count: x.count, icon: x.icon })) } };
  }
  if (level === 1) {
    const d = makeData(4);
    const [a, b] = shuffle(d).slice(0, 2);
    return { text: `${a.label} 同 ${b.label} 一共有幾多？`, answer: a.count + b.count, options: numOptions(a.count + b.count, 4), visual: { kind: 'pictogram', rows: d.map((x) => ({ label: x.label, count: x.count, icon: x.icon })) } };
  }
  if (level === 2) {
    const d = makeData(4);
    const mx = d.reduce((a, b) => (b.count > a.count ? b : a));
    const mn = d.reduce((a, b) => (b.count < a.count ? b : a));
    return { text: `${mx.label} 比 ${mn.label} 多幾多？`, answer: mx.count - mn.count, options: numOptions(mx.count - mn.count, 4), visual: { kind: 'pictogram', rows: d.map((x) => ({ label: x.label, count: x.count, icon: x.icon })) } };
  }
  if (level === 3) {
    const d = makeData(4);
    const target = pick(d);
    return { text: `睇方塊圖，${target.label} 有幾多？`, answer: target.count, options: numOptions(target.count, 4), visual: { kind: 'bargraph', rows: d.map((x) => ({ label: x.label, value: x.count })) } };
  }
  // level 4 — total of all
  const d = makeData(4);
  const total = d.reduce((s, x) => s + x.count, 0);
  return { text: `睇圖，一共有幾多？`, answer: total, options: numOptions(total, 6), visual: { kind: 'bargraph', rows: d.map((x) => ({ label: x.label, value: x.count })) } };
}

const GENERATORS: Record<string, (level: number) => Question> = {
  numbers: genNumbers,
  addsub: genAddsub,
  money: genMoney,
  muldiv: genMuldiv,
  measure: genMeasure,
  shape: genShape,
  data: genData,
};

export function generateLevelQuestions(
  sectionId: string,
  levelIndex: number,
  count = QUESTIONS_PER_LEVEL
): Question[] {
  const gen = GENERATORS[sectionId] || genNumbers;
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 80) {
    guard++;
    const q = gen(levelIndex);
    // safety: the answer must appear in the options exactly once
    const matches = q.options.filter((o) => String(o) === String(q.answer)).length;
    if (matches === 0) q.options = shuffle([q.answer, ...q.options.slice(0, 3)]);
    else if (matches > 1) continue;
    if (q.options.length !== 4) continue;
    // Dedupe on the WHOLE question (text + options + visual), not just text:
    // many P2 items share a fixed prompt (e.g. "睇鐘，而家幾多點？") but differ
    // by their visual/options, so a text-only key would wrongly collapse them.
    const key = `${q.text}|${JSON.stringify(q.options)}|${q.visual ? JSON.stringify(q.visual) : ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  // Safety net: if an inherently low-variety level couldn't produce `count`
  // distinct questions, top up by repeating so the screen never renders empty.
  const base = out.length;
  while (base > 0 && out.length < count) out.push(out[out.length % base]);
  return out;
}

export function starsFor(score: number): number {
  if (score >= 5) return 3;
  if (score >= 4) return 2;
  if (score >= PASS_MARK) return 1;
  return 0;
}
