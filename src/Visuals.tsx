/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Animated SVG visuals that make P2 concepts concrete for kids:
 *  - dot arrays (the multiplication / division "array model")
 *  - place-value blocks (hundreds / tens / ones)
 *  - 2D shapes & triangles, angles, compass directions, 3D solids
 *  - analog clocks (telling the time)
 *  - HK money (coins & notes)
 *  - pictograms & block (bar) graphs (data handling)
 *  - fraction bars / pies & capacity (kept from the shared engine)
 */
import React from 'react';
import { motion } from 'motion/react';

export type Visual =
  | { kind: 'fractionBar'; num: number; den: number }
  | { kind: 'fractionPie'; num: number; den: number }
  | { kind: 'fractionTwoBars'; a: [number, number]; b: [number, number] }
  | { kind: 'dots'; rows: number; cols: number; extra?: number }
  | { kind: 'triangle'; type: 'equilateral' | 'isosceles' | 'right' | 'scalene' }
  | { kind: 'capacity'; items: { label: string; cups: number }[]; max: number }
  | { kind: 'shape'; shape: 'square' | 'rectangle' | 'triangle'; labels: string[] }
  // --- P2 additions ---
  | { kind: 'place'; hundreds: number; tens: number; ones: number }
  | { kind: 'clock'; h: number; m: number }
  | { kind: 'coins'; items: { v: number; n: number }[] }
  | { kind: 'angle'; type: 'right' | 'acute' | 'obtuse' }
  | { kind: 'compass'; facing: 'N' | 'E' | 'S' | 'W' }
  | { kind: 'solid'; shape: 'cube' | 'cuboid' | 'cylinder' | 'cone' | 'sphere' | 'prism' }
  | { kind: 'quad'; shape: 'square' | 'rectangle' | 'segment' }
  | { kind: 'pictogram'; rows: { label: string; count: number; icon: string }[]; unit?: number }
  | { kind: 'bargraph'; rows: { label: string; value: number }[]; max?: number };

const FILL = '#fb923c';
const FILL2 = '#34d399';
const EMPTY = '#f1f5f9';
const STROKE = '#e2e8f0';

const FractionBar = ({ num, den, color = FILL }: { num: number; den: number; color?: string }) => {
  const W = 300, H = 54, gap = 3;
  const seg = (W - gap * (den - 1)) / den;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto" role="img" aria-label={`${num}/${den}`}>
      {Array.from({ length: den }).map((_, i) => (
        <motion.rect
          key={i}
          x={i * (seg + gap)}
          y={0}
          width={seg}
          height={H}
          rx={7}
          fill={i < num ? color : EMPTY}
          stroke={STROKE}
          strokeWidth={2}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        />
      ))}
    </svg>
  );
};

const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const wedge = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
};

const FractionPie = ({ num, den }: { num: number; den: number }) => {
  const cx = 60, cy = 60, r = 52;
  const step = (2 * Math.PI) / den;
  const start = -Math.PI / 2;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto" role="img" aria-label={`${num}/${den}`}>
      {Array.from({ length: den }).map((_, i) => (
        <motion.path
          key={i}
          d={wedge(cx, cy, r, start + i * step, start + (i + 1) * step)}
          fill={i < num ? FILL : EMPTY}
          stroke="#fff"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth={2} />
    </svg>
  );
};

const TwoBars = ({ a, b }: { a: [number, number]; b: [number, number] }) => (
  <div className="space-y-3 w-full max-w-xs mx-auto">
    <div><div className="text-sm font-bold text-gray-500 mb-1">{a[0]}/{a[1]}</div><FractionBar num={a[0]} den={a[1]} /></div>
    <div><div className="text-sm font-bold text-gray-500 mb-1">{b[0]}/{b[1]}</div><FractionBar num={b[0]} den={b[1]} color={FILL2} /></div>
  </div>
);

const DotArray = ({ rows, cols, extra = 0 }: { rows: number; cols: number; extra?: number }) => {
  const cell = 26, pad = 6, r = 9;
  const W = cols * cell + pad * 2;
  const H = rows * cell + pad * 2;
  const dots: { x: number; y: number; k: number }[] = [];
  let k = 0;
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) dots.push({ x: pad + col * cell + cell / 2, y: pad + row * cell + cell / 2, k: k++ });
  const extraDots: { x: number; y: number; k: number }[] = [];
  for (let i = 0; i < extra; i++) extraDots.push({ x: pad + i * cell + cell / 2, y: H + cell / 2, k: k++ });
  const totalH = extra > 0 ? H + cell + pad : H;
  return (
    <svg viewBox={`0 0 ${Math.max(W, extra * cell + pad * 2)} ${totalH}`} className="mx-auto" style={{ width: '100%', maxWidth: 220, maxHeight: 180 }} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${rows} x ${cols}`}>
      {dots.map((d) => (
        <motion.circle key={d.k} cx={d.x} cy={d.y} r={r} fill={FILL} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: d.k * 0.02 }} />
      ))}
      {extraDots.map((d) => (
        <motion.circle key={d.k} cx={d.x} cy={d.y} r={r} fill={FILL2} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: d.k * 0.02 }} />
      ))}
    </svg>
  );
};

const TRI_POINTS: Record<string, string> = {
  equilateral: '50,10 90,82 10,82',
  isosceles: '50,6 80,84 20,84',
  right: '16,84 16,20 86,84',
  scalene: '22,78 84,84 58,18',
};

const TriangleShape = ({ type }: { type: 'equilateral' | 'isosceles' | 'right' | 'scalene' }) => (
  <svg viewBox="0 0 100 100" className="w-36 h-36 mx-auto" role="img" aria-label={type}>
    <motion.polygon
      points={TRI_POINTS[type]}
      fill="#bfdbfe"
      stroke="#3b82f6"
      strokeWidth={3}
      strokeLinejoin="round"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120 }}
      style={{ transformOrigin: '50px 50px' }}
    />
    {type === 'right' && <rect x={16} y={70} width={14} height={14} fill="none" stroke="#1d4ed8" strokeWidth={2} />}
  </svg>
);

const Capacity = ({ items, max }: { items: { label: string; cups: number }[]; max: number }) => (
  <div className="flex items-end justify-center gap-6">
    {items.map((it, i) => {
      const H = 110, W = 60;
      const fill = Math.max(6, (it.cups / max) * (H - 8));
      return (
        <div key={i} className="flex flex-col items-center gap-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-16" style={{ height: H }} role="img" aria-label={`${it.label} ${it.cups}`}>
            <rect x={4} y={2} width={W - 8} height={H - 4} rx={8} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2} />
            <motion.rect
              x={6}
              width={W - 12}
              rx={6}
              fill="#60a5fa"
              initial={{ height: 0, y: H - 4 }}
              animate={{ height: fill, y: H - 4 - fill }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.15 }}
            />
          </svg>
          <span className="text-sm font-bold text-gray-700">{it.label}</span>
          <span className="text-xs text-gray-500">{it.cups} 杯</span>
        </div>
      );
    })}
  </div>
);

const ShapeFig = ({ shape, labels }: { shape: 'square' | 'rectangle' | 'triangle'; labels: string[] }) => {
  const wrap = (children: React.ReactNode, vb: string, cls: string) => (
    <motion.svg viewBox={vb} className={`${cls} mx-auto`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120 }} role="img">
      {children}
    </motion.svg>
  );
  if (shape === 'square') {
    return wrap(
      <>
        <rect x={32} y={22} width={80} height={80} rx={4} fill="#bbf7d0" stroke="#16a34a" strokeWidth={3} />
        <text x={72} y={15} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#15803d">{labels[0]} cm</text>
      </>,
      '0 0 144 116', 'w-36'
    );
  }
  if (shape === 'rectangle') {
    return wrap(
      <>
        <rect x={18} y={32} width={120} height={60} rx={4} fill="#bfdbfe" stroke="#2563eb" strokeWidth={3} />
        <text x={78} y={24} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#1d4ed8">{labels[0]} cm</text>
        <text x={150} y={66} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#1d4ed8">{labels[1]}</text>
      </>,
      '0 0 168 110', 'w-44'
    );
  }
  return wrap(
    <>
      <polygon points="80,18 142,104 18,104" fill="#fde68a" stroke="#d97706" strokeWidth={3} strokeLinejoin="round" />
      <text x={120} y={60} fontSize={13} fontWeight="bold" fill="#b45309">{labels[0]}</text>
      <text x={28} y={60} fontSize={13} fontWeight="bold" fill="#b45309">{labels[1]}</text>
      <text x={80} y={120} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#b45309">{labels[2]}</text>
    </>,
    '0 0 160 128', 'w-44'
  );
};

// ---------- P2 additions ----------

// Place-value blocks: hundreds (flats), tens (rods), ones (units)
// Base-ten blocks shown as three clearly-separated, labelled columns (百 / 十 / 個)
// so each place value is easy to count. Empty columns still show their label.
const PlaceValue = ({ hundreds, tens, ones }: { hundreds: number; tens: number; ones: number }) => (
  <div className="flex items-end justify-center gap-5 sm:gap-8">
    {/* 百 — hundred flats */}
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap items-end justify-center gap-1.5 min-h-[40px] max-w-[160px]">
        {Array.from({ length: hundreds }).map((_, i) => (
          <motion.svg key={i} viewBox="0 0 40 40" className="w-9 h-9" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <rect x={2} y={2} width={36} height={36} rx={3} fill="#fecaca" stroke="#ef4444" strokeWidth={1.5} />
            {[10, 20, 30].map((p) => <line key={`v${p}`} x1={p} y1={2} x2={p} y2={38} stroke="#ef4444" strokeWidth={0.8} />)}
            {[10, 20, 30].map((p) => <line key={`h${p}`} x1={2} y1={p} x2={38} y2={p} stroke="#ef4444" strokeWidth={0.8} />)}
          </motion.svg>
        ))}
      </div>
      <span className="text-base font-black text-red-500">百</span>
    </div>
    {/* 十 — ten rods (well spaced so they can be counted) */}
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap items-end justify-center gap-2 min-h-[40px] max-w-[140px]">
        {Array.from({ length: tens }).map((_, i) => (
          <motion.svg key={i} viewBox="0 0 14 44" className="w-3.5 h-10" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}>
            <rect x={3} y={2} width={8} height={40} rx={2} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.2} />
            {[6, 10, 14, 18, 22, 26, 30, 34, 38].map((p) => <line key={p} x1={3} y1={p} x2={11} y2={p} stroke="#3b82f6" strokeWidth={0.7} />)}
          </motion.svg>
        ))}
      </div>
      <span className="text-base font-black text-blue-500">十</span>
    </div>
    {/* 個 — single units */}
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap items-end justify-center gap-1 min-h-[40px] max-w-[80px]">
        {Array.from({ length: ones }).map((_, i) => (
          <motion.div key={i} className="w-3.5 h-3.5 rounded-sm bg-amber-300 border border-amber-500" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.03 }} />
        ))}
      </div>
      <span className="text-base font-black text-amber-600">個</span>
    </div>
  </div>
);

// Analog clock
const Clock = ({ h, m }: { h: number; m: number }) => {
  const cx = 60, cy = 60, r = 52;
  const minA = (m / 60) * 2 * Math.PI - Math.PI / 2;
  const hourA = (((h % 12) + m / 60) / 12) * 2 * Math.PI - Math.PI / 2;
  const [mx, my] = polar(cx, cy, 40, minA);
  const [hx, hy] = polar(cx, cy, 28, hourA);
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto" role="img" aria-label={`${h}:${m}`}>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#0f172a" strokeWidth={3} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const [x1, y1] = polar(cx, cy, r - 4, a);
        const [x2, y2] = polar(cx, cy, r - 11, a);
        const [tx, ty] = polar(cx, cy, r - 20, a);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={2} />
            <text x={tx} y={ty + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#334155">{i === 0 ? 12 : i}</text>
          </g>
        );
      })}
      <motion.line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#1e293b" strokeWidth={4} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.line x1={cx} y1={cy} x2={mx} y2={my} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <circle cx={cx} cy={cy} r={4} fill="#1e293b" />
    </svg>
  );
};

// HK money: coins (<= $10) as discs, notes (>= $20) as rectangles
const Money = ({ items }: { items: { v: number; n: number }[] }) => {
  const noteColor: Record<number, string> = { 20: '#86efac', 50: '#7dd3fc', 100: '#fca5a5', 500: '#d8b4fe', 1000: '#fde68a' };
  const tokens: { v: number }[] = [];
  items.forEach((it) => { for (let i = 0; i < it.n; i++) tokens.push({ v: it.v }); });
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm mx-auto">
      {tokens.map((t, i) =>
        t.v >= 20 ? (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="w-16 h-10 rounded-md border-2 flex items-center justify-center font-black text-gray-700 shadow-sm"
            style={{ background: noteColor[t.v] || '#e2e8f0', borderColor: '#64748b' }}>
            ${t.v}
          </motion.div>
        ) : (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="w-11 h-11 rounded-full border-2 border-yellow-600 bg-yellow-300 flex items-center justify-center font-black text-yellow-900 text-sm shadow-sm">
            {t.v >= 1 ? `$${t.v}` : `${t.v * 100}¢`}
          </motion.div>
        )
      )}
    </div>
  );
};

// Angle: two rays from a vertex
const AngleFig = ({ type }: { type: 'right' | 'acute' | 'obtuse' }) => {
  const vx = 24, vy = 96, len = 78;
  const deg = type === 'right' ? 90 : type === 'acute' ? 42 : 130;
  const a = (-deg * Math.PI) / 180;
  const ex = vx + len * Math.cos(a), ey = vy + len * Math.sin(a);
  return (
    <svg viewBox="0 0 130 110" className="w-40 h-36 mx-auto" role="img" aria-label={type}>
      <motion.line x1={vx} y1={vy} x2={vx + len} y2={vy} stroke="#7c3aed" strokeWidth={4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
      <motion.line x1={vx} y1={vy} x2={ex} y2={ey} stroke="#7c3aed" strokeWidth={4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2 }} />
      {type === 'right'
        ? <path d={`M${vx + 16},${vy} L${vx + 16},${vy - 16} L${vx},${vy - 16}`} fill="none" stroke="#a78bfa" strokeWidth={2} />
        : <path d={wedge(vx, vy, 20, 0, a).replace('Z', '')} fill="none" stroke="#a78bfa" strokeWidth={2} transform={`scale(1,1)`} />}
      <circle cx={vx} cy={vy} r={3.5} fill="#7c3aed" />
    </svg>
  );
};

// Compass rose with an arrow pointing to `facing`
const Compass = ({ facing }: { facing: 'N' | 'E' | 'S' | 'W' }) => {
  const cx = 60, cy = 60;
  const ang: Record<string, number> = { N: -90, E: 0, S: 90, W: 180 };
  const a = (ang[facing] * Math.PI) / 180;
  const [tx, ty] = polar(cx, cy, 40, a);
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto" role="img" aria-label={`facing ${facing}`}>
      <circle cx={cx} cy={cy} r={52} fill="#f8fafc" stroke="#475569" strokeWidth={2} />
      <text x={cx} y={20} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#dc2626">北 N</text>
      <text x={cx} y={108} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#334155">南 S</text>
      <text x={106} y={64} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#334155">東 E</text>
      <text x={14} y={64} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#334155">西 W</text>
      <motion.line x1={cx} y1={cy} x2={tx} y2={ty} stroke="#dc2626" strokeWidth={4} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <polygon points={`${tx},${ty} ${tx - 6},${ty + 6} ${tx + 6},${ty + 6}`} fill="#dc2626" transform={`rotate(${ang[facing] + 90} ${tx} ${ty})`} />
      <circle cx={cx} cy={cy} r={4} fill="#475569" />
    </svg>
  );
};

// 3D solids
const Solid = ({ shape }: { shape: 'cube' | 'cuboid' | 'cylinder' | 'cone' | 'sphere' | 'prism' }) => {
  const S = '#1e40af', F = '#bfdbfe', F2 = '#93c5fd';
  const wrap = (c: React.ReactNode) => (
    <motion.svg viewBox="0 0 120 110" className="w-36 h-32 mx-auto" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120 }} role="img" aria-label={shape}>{c}</motion.svg>
  );
  switch (shape) {
    case 'cube':
      return wrap(<>
        <polygon points="30,40 70,40 90,22 50,22" fill={F2} stroke={S} strokeWidth={2} />
        <polygon points="70,40 90,22 90,72 70,90" fill={F2} stroke={S} strokeWidth={2} />
        <rect x={30} y={40} width={40} height={50} fill={F} stroke={S} strokeWidth={2} />
      </>);
    case 'cuboid':
      return wrap(<>
        <polygon points="22,42 82,42 100,24 40,24" fill={F2} stroke={S} strokeWidth={2} />
        <polygon points="82,42 100,24 100,70 82,88" fill={F2} stroke={S} strokeWidth={2} />
        <rect x={22} y={42} width={60} height={46} fill={F} stroke={S} strokeWidth={2} />
      </>);
    case 'cylinder':
      return wrap(<>
        <rect x={36} y={26} width={48} height={62} fill={F} stroke={S} strokeWidth={2} />
        <ellipse cx={60} cy={26} rx={24} ry={9} fill={F2} stroke={S} strokeWidth={2} />
        <ellipse cx={60} cy={88} rx={24} ry={9} fill={F} stroke={S} strokeWidth={2} />
      </>);
    case 'cone':
      return wrap(<>
        <polygon points="60,16 86,86 34,86" fill={F} stroke={S} strokeWidth={2} />
        <ellipse cx={60} cy={86} rx={26} ry={9} fill={F2} stroke={S} strokeWidth={2} />
      </>);
    case 'sphere':
      return wrap(<>
        <circle cx={60} cy={56} r={40} fill={F} stroke={S} strokeWidth={2} />
        <ellipse cx={60} cy={56} rx={40} ry={14} fill="none" stroke={F2} strokeWidth={2} />
      </>);
    case 'prism':
      return wrap(<>
        <polygon points="34,86 60,30 86,86" fill={F} stroke={S} strokeWidth={2} />
        <polygon points="60,30 78,20 100,76 86,86" fill={F2} stroke={S} strokeWidth={2} />
        <polygon points="86,86 100,76 100,76" fill={F2} stroke={S} strokeWidth={2} />
        <line x1="86" y1="86" x2="100" y2="76" stroke={S} strokeWidth={2} />
      </>);
  }
};

// Quadrilaterals / line segments for "lines & shapes"
const Quad = ({ shape }: { shape: 'square' | 'rectangle' | 'segment' }) => {
  const S = '#16a34a', F = '#bbf7d0';
  if (shape === 'segment')
    return (
      <svg viewBox="0 0 160 50" className="w-44 mx-auto" role="img" aria-label="segment">
        <line x1={16} y1={25} x2={144} y2={25} stroke="#0f766e" strokeWidth={4} strokeLinecap="round" />
        <circle cx={16} cy={25} r={5} fill="#0f766e" />
        <circle cx={144} cy={25} r={5} fill="#0f766e" />
      </svg>
    );
  return (
    <motion.svg viewBox="0 0 160 120" className="w-40 mx-auto" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} role="img" aria-label={shape}>
      {shape === 'square'
        ? <rect x={40} y={20} width={80} height={80} rx={3} fill={F} stroke={S} strokeWidth={3} />
        : <rect x={20} y={32} width={120} height={56} rx={3} fill={F} stroke={S} strokeWidth={3} />}
    </motion.svg>
  );
};

// Pictogram: rows of repeated emoji icons
const Pictogram = ({ rows, unit = 1 }: { rows: { label: string; count: number; icon: string }[]; unit?: number }) => (
  <div className="space-y-2 w-full max-w-sm mx-auto">
    {rows.map((r, i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-sm font-bold text-gray-600 text-right">{r.label}</span>
        <div className="flex flex-wrap gap-0.5">
          {Array.from({ length: r.count }).map((_, j) => (
            <motion.span key={j} className="text-xl leading-none" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (i * 6 + j) * 0.04 }}>{r.icon}</motion.span>
          ))}
        </div>
      </div>
    ))}
    {unit > 1 && <p className="text-xs text-gray-400 text-center pt-1">每個圖代表 {unit} 個</p>}
  </div>
);

// Block / bar graph
const BarGraph = ({ rows, max }: { rows: { label: string; value: number }[]; max?: number }) => {
  const top = max || Math.max(...rows.map((r) => r.value), 1);
  const H = 120, barW = 34, gap = 18, padL = 28, padB = 24;
  const W = padL + rows.length * (barW + gap);
  const colors = ['#fb923c', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24'];
  return (
    <svg viewBox={`0 0 ${W} ${H + padB}`} className="mx-auto" style={{ width: '100%', maxWidth: 320 }} role="img" aria-label="bar graph">
      {[0, 1, 2, 3, 4].map((g) => {
        const y = H - (g / 4) * H;
        return <g key={g}><line x1={padL} y1={y} x2={W} y2={y} stroke="#e2e8f0" strokeWidth={1} /><text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{Math.round((g / 4) * top)}</text></g>;
      })}
      {rows.map((r, i) => {
        const h = (r.value / top) * H;
        const x = padL + i * (barW + gap) + gap / 2;
        return (
          <g key={i}>
            <motion.rect x={x} width={barW} rx={4} fill={colors[i % colors.length]} initial={{ height: 0, y: H }} animate={{ height: h, y: H - h }} transition={{ duration: 0.7, delay: i * 0.1 }} />
            <text x={x + barW / 2} y={H + 15} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#475569">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const QuestionVisual = ({ visual }: { visual?: Visual }) => {
  if (!visual) return null;
  let inner: React.ReactNode = null;
  switch (visual.kind) {
    case 'fractionBar': inner = <FractionBar num={visual.num} den={visual.den} />; break;
    case 'fractionPie': inner = <FractionPie num={visual.num} den={visual.den} />; break;
    case 'fractionTwoBars': inner = <TwoBars a={visual.a} b={visual.b} />; break;
    case 'dots': inner = <DotArray rows={visual.rows} cols={visual.cols} extra={visual.extra} />; break;
    case 'triangle': inner = <TriangleShape type={visual.type} />; break;
    case 'capacity': inner = <Capacity items={visual.items} max={visual.max} />; break;
    case 'shape': inner = <ShapeFig shape={visual.shape} labels={visual.labels} />; break;
    case 'place': inner = <PlaceValue hundreds={visual.hundreds} tens={visual.tens} ones={visual.ones} />; break;
    case 'clock': inner = <Clock h={visual.h} m={visual.m} />; break;
    case 'coins': inner = <Money items={visual.items} />; break;
    case 'angle': inner = <AngleFig type={visual.type} />; break;
    case 'compass': inner = <Compass facing={visual.facing} />; break;
    case 'solid': inner = <Solid shape={visual.shape} />; break;
    case 'quad': inner = <Quad shape={visual.shape} />; break;
    case 'pictogram': inner = <Pictogram rows={visual.rows} unit={visual.unit} />; break;
    case 'bargraph': inner = <BarGraph rows={visual.rows} max={visual.max} />; break;
  }
  return <div className="w-full flex justify-center py-2">{inner}</div>;
};
