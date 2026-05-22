/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy,
  MapPin,
  ChevronRight,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  Star,
  Volume2,
  VolumeX,
  Lock,
  Crown,
  ArrowLeft,
  BookOpen,
  Languages,
  Compass,
  Link2,
  Calculator,
  Sparkles,
  ScrollText,
  Hash,
  Plus,
  Coins,
  Ruler,
  Shapes,
  BarChart3,
  Mic,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  generateLevelQuestions,
  SECTION_LEVELS,
  LEVELS_PER_SECTION,
  QUESTIONS_PER_LEVEL,
  PASS_MARK,
  starsFor,
  type Question,
} from './questions';
import { generateEnglishQuestions, ENGLISH_SECTION_LEVELS } from './english';
import { fetchBoards, cachedBoards, submitScore, isNameTaken, type Entry, type Boards } from './leaderboard';
import { QuestionVisual } from './Visuals';

// merged level-meta lookup across both subjects
const LEVEL_META: Record<string, { title: string; desc: string }[]> = {
  ...SECTION_LEVELS,
  ...ENGLISH_SECTION_LEVELS,
};

// --- Audio: looping music + synthesized SFX (no external SFX URLs to break) ---
// "Playground Fun" — Mixkit Stock Music Free License (no attribution required).
// Gentle, playful kids' loop; different track from the P3 site, similar style.
const MUSIC_URL = 'https://assets.mixkit.co/music/12/12.mp3';
type SfxName = 'CORRECT' | 'WRONG' | 'WIN' | 'CLICK';

let _audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _audioCtx;
};

const synthesizeSfx = (name: SfxName) => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  const beep = (freq: number, start: number, dur: number, vol = 0.25, type: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0 + start);
    gain.gain.setValueAtTime(0, t0 + start);
    gain.gain.linearRampToValueAtTime(vol, t0 + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
  };
  switch (name) {
    case 'CORRECT': beep(880, 0, 0.12, 0.25, 'sine'); beep(1318, 0.1, 0.22, 0.25, 'sine'); break;
    case 'WRONG': beep(220, 0, 0.18, 0.25, 'square'); beep(165, 0.12, 0.25, 0.22, 'square'); break;
    case 'WIN': [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.1, 0.35, 0.22, 'triangle')); break;
    case 'CLICK': beep(1500, 0, 0.04, 0.18, 'square'); break;
  }
};

// --- Types ---
type GameState = 'MENU' | 'SUBJECT' | 'SECTION' | 'LEVEL' | 'PLAYING' | 'RESULT';
type Subject = 'math' | 'english';
type Section = {
  id: string;
  title: string;
  location: string;
  topic: string;
  icon: React.ReactNode;
  color: string;
  character: string;
  subject: Subject;
};

type UserAnswer = {
  question: string;
  correctAnswer: number | string;
  userValue: number | string;
  isCorrect: boolean;
  visual?: Question['visual'];
  glosses?: Record<string, string>;
};

// --- Math zones (HK theme + Tadamates mascots) mapped to P2 strands ---
const MATH_SECTIONS: Section[] = [
  { id: 'numbers', title: '數字大廈', location: '中環', topic: '三位數與四位數', icon: <Hash className="w-7 h-7" />, color: 'bg-red-500', character: 'melon_bun.png', subject: 'math' },
  { id: 'addsub', title: '街市買餸', location: '街市', topic: '加法與減法', icon: <Plus className="w-7 h-7" />, color: 'bg-blue-500', character: 'dolphin.png', subject: 'math' },
  { id: 'money', title: '便利店收銀', location: '便利店', topic: '香港貨幣', icon: <Coins className="w-7 h-7" />, color: 'bg-teal-500', character: 'cow.png', subject: 'math' },
  { id: 'muldiv', title: '茶餐廳分餐', location: '茶餐廳', topic: '乘法與除法', icon: <Calculator className="w-7 h-7" />, color: 'bg-purple-500', character: 'beanie.png', subject: 'math' },
  { id: 'measure', title: '量度實驗室', location: '科學館', topic: '長度・時間・日期', icon: <Ruler className="w-7 h-7" />, color: 'bg-cyan-600', character: 'hoola.png', subject: 'math' },
  { id: 'shape', title: '圖形樂園', location: '公園', topic: '圖形・角・方向', icon: <Shapes className="w-7 h-7" />, color: 'bg-indigo-500', character: 'owl.png', subject: 'math' },
  { id: 'data', title: '數據偵探社', location: '偵探社', topic: '象形圖與方塊圖', icon: <BarChart3 className="w-7 h-7" />, color: 'bg-amber-500', character: 'lion.png', subject: 'math' },
];

// --- English zones (P2 EDB KS1 scope) with distinct Tadamates ---
const ENGLISH_SECTIONS: Section[] = [
  { id: 'eng_phonics', title: 'Phonics Forest', location: '拼音森林', topic: 'Blends & Magic-e', icon: <Mic className="w-7 h-7" />, color: 'bg-pink-500', character: 'taro.png', subject: 'english' },
  { id: 'eng_vocab', title: 'Vocabulary Park', location: '詞彙寶庫', topic: 'School · Family · Weather', icon: <BookOpen className="w-7 h-7" />, color: 'bg-emerald-600', character: 'cres.png', subject: 'english' },
  { id: 'eng_grammar', title: 'Grammar Workshop', location: '文法工房', topic: 'a/an · plurals · be', icon: <Languages className="w-7 h-7" />, color: 'bg-blue-600', character: 'jimi.png', subject: 'english' },
  { id: 'eng_prepositions', title: 'Preposition Path', location: '介詞與疑問詞', topic: 'Prepositions & Wh-words', icon: <Compass className="w-7 h-7" />, color: 'bg-teal-600', character: 'pierre.png', subject: 'english' },
  { id: 'eng_sentence', title: 'Sentence Studio', location: '句子工作室', topic: 'and/or · because · likes', icon: <Link2 className="w-7 h-7" />, color: 'bg-violet-600', character: 'mozzarella.png', subject: 'english' },
  { id: 'eng_reading', title: 'Reading Quest', location: '閱讀理解', topic: 'Reading Comprehension', icon: <ScrollText className="w-7 h-7" />, color: 'bg-rose-500', character: 'roro.png', subject: 'english' },
];

const ALL_SECTIONS: Section[] = [...MATH_SECTIONS, ...ENGLISH_SECTIONS];

// --- Full Tadamates roster (16) for the random menu mascot ---
const CHARACTERS: { name: string; file: string }[] = [
  { name: 'Apollo', file: 'melon_bun.png' },
  { name: 'Jolly', file: 'dolphin.png' },
  { name: 'Pixi', file: 'cow.png' },
  { name: 'Cappu-Cappu', file: 'owl.png' },
  { name: 'Dante', file: 'lion.png' },
  { name: 'Beanie', file: 'beanie.png' },
  { name: 'Hoola', file: 'hoola.png' },
  { name: 'Micah', file: 'micah.png' },
  { name: 'Pierre', file: 'pierre.png' },
  { name: 'Taro', file: 'taro.png' },
  { name: 'Cres', file: 'cres.png' },
  { name: 'Roro', file: 'roro.png' },
  { name: 'Jimi', file: 'jimi.png' },
  { name: 'Mozzarella', file: 'mozzarella.png' },
  { name: 'Mellow', file: 'mellow.png' },
  { name: 'Nico', file: 'nico.png' },
];

// --- Persistence (P2-specific keys: github.io localStorage is shared across
// the whole origin, so these must differ from the P3 site's keys) ---
const NAME_KEY = 'p2_name';
const PROGRESS_KEY = 'p2_progress';
type Progress = Record<string, number[]>; // sectionId -> stars[5]

const emptyProgress = (): Progress => {
  const p: Progress = {};
  ALL_SECTIONS.forEach((s) => (p[s.id] = new Array(LEVELS_PER_SECTION).fill(0)));
  return p;
};

const loadProgress = (): Progress => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Progress;
    const base = emptyProgress();
    ALL_SECTIONS.forEach((s) => {
      if (Array.isArray(parsed[s.id])) {
        for (let i = 0; i < LEVELS_PER_SECTION; i++) base[s.id][i] = parsed[s.id][i] || 0;
      }
    });
    return base;
  } catch {
    return emptyProgress();
  }
};

const totalStars = (p: Progress): number =>
  Object.values(p).reduce((sum, arr) => sum + arr.reduce((a, b) => a + b, 0), 0);

const isUnlocked = (p: Progress, sectionId: string, level: number): boolean =>
  level === 0 || (p[sectionId] && p[sectionId][level - 1] >= 1);

// --- Reusable presentational components (module-level to avoid focus loss) ---
const Mascot = ({ character, status }: { character: string; status: 'CORRECT' | 'WRONG' | null }) => (
  <div className="relative w-28 h-28 md:w-44 md:h-44 mx-auto pointer-events-none flex items-center justify-center">
    <motion.img
      src={`${import.meta.env.BASE_URL}${character}`}
      alt="Mascot"
      className="w-full h-full object-contain drop-shadow-xl"
      initial={{ y: 0 }}
      animate={
        status === 'CORRECT'
          ? { y: [0, -30, 0, -20, 0], rotate: [0, 10, -10, 10, 0], scale: [1, 1.15, 1] }
          : status === 'WRONG'
          ? { x: [0, -15, 15, -15, 15, 0], rotate: [0, -15, 15, -15, 15, 0] }
          : { y: [0, -8, 0], rotate: [0, 2, -2, 0] }
      }
      transition={status ? { duration: 0.6 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: -20 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={`absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl text-white font-bold text-sm whitespace-nowrap shadow-xl ${
            status === 'CORRECT' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {status === 'CORRECT' ? '你好叻呀！🎉' : '加油呀！💪'}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const medalColor = (rank: number) =>
  rank === 0 ? 'text-yellow-500' : rank === 1 ? 'text-gray-400' : rank === 2 ? 'text-amber-700' : 'text-gray-300';

const LeaderboardPanel = ({
  top,
  variant,
  highlightName,
  label,
}: {
  top: Entry[];
  variant: 'home' | 'side';
  highlightName?: string;
  label?: string;
}) => {
  const rows = top.slice(0, 4);
  return (
    <div
      className={
        variant === 'home'
          ? 'w-full bg-white/90 backdrop-blur rounded-3xl shadow-xl border-2 border-teal-100 p-4'
          : 'bg-white rounded-2xl shadow-lg border border-gray-100 p-3'
      }
    >
      <div className="flex items-center gap-1.5 mb-3 justify-center">
        <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
        <h3 className={`font-bold text-gray-800 leading-tight text-center ${variant === 'home' ? 'text-sm' : 'text-sm'}`}>{label || '全球排行榜'}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-2 text-center">載入中…</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((e, i) =>
            variant === 'home' ? (
              // narrow two-column home: name on its own line so it never gets cut off
              <li
                key={i}
                className={`rounded-lg px-2 py-1.5 ${highlightName && e.name === highlightName ? 'bg-teal-100' : 'bg-gray-50'}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className={`font-black text-xs shrink-0 ${medalColor(i)}`}>{i + 1}.</span>
                  <span className="flex-1 min-w-0 truncate font-semibold text-gray-800 text-xs">{e.name}</span>
                </div>
                <div className="text-right font-black text-teal-500 text-[11px] leading-none">{e.score} ⭐</div>
              </li>
            ) : (
              <li
                key={i}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${highlightName && e.name === highlightName ? 'bg-teal-100' : 'bg-gray-50'}`}
              >
                <Crown className={`w-4 h-4 shrink-0 ${medalColor(i)}`} />
                <span className="font-bold text-gray-500 w-4 text-center text-sm">{i + 1}</span>
                <span className="flex-1 min-w-0 font-semibold text-gray-800 truncate text-sm">{e.name}</span>
                <span className="font-black text-teal-500 text-sm shrink-0">{e.score}⭐</span>
              </li>
            )
          )}
        </ol>
      )}
    </div>
  );
};

const NameModal = ({
  initial,
  onSave,
  validate,
}: {
  initial: string;
  onSave: (n: string) => void;
  validate: (n: string) => Promise<string | null>;
}) => {
  const [val, setVal] = useState(initial);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    const name = val.trim();
    if (!name || checking) return;
    setChecking(true);
    setError('');
    try {
      const err = await validate(name);
      if (err) {
        setError(err);
        setChecking(false);
        return;
      }
      onSave(name);
    } catch {
      onSave(name); // fail open — never block play on a network hiccup
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center space-y-5"
      >
        <h2 className="text-2xl font-black text-teal-600">輸入你嘅名</h2>
        <p className="text-gray-500 text-sm">你嘅名會出現喺全球排行榜上！每個名只可以用一次。</p>
        <input
          autoFocus
          value={val}
          maxLength={12}
          onChange={(e) => { setVal(e.target.value); if (error) setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="例如：Anna"
          className={`w-full px-4 py-3 text-center text-lg font-bold border-2 rounded-2xl focus:outline-none ${error ? 'border-red-400 focus:border-red-500' : 'border-teal-200 focus:border-teal-400'}`}
        />
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        <button
          disabled={!val.trim() || checking}
          onClick={submit}
          className="w-full py-3 bg-teal-500 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-teal-600 active:scale-95 transition-all disabled:opacity-40"
        >
          {checking ? '檢查緊…' : '開始冒險'}
        </button>
      </motion.div>
    </div>
  );
};

const StarRow = ({ stars, size = 'w-6 h-6' }: { stars: number; size?: string }) => (
  <div className="flex gap-1 justify-center">
    {[0, 1, 2].map((i) => (
      <Star key={i} className={`${size} ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [section, setSection] = useState<Section | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [name, setName] = useState<string>(() => localStorage.getItem(NAME_KEY) || '');
  const [showNameModal, setShowNameModal] = useState(false);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [boards, setBoards] = useState<Boards>(() => cachedBoards());
  const [myRank, setMyRank] = useState<number>(-1);
  const [menuMascot, setMenuMascot] = useState(() => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
  const [subject, setSubject] = useState<Subject>('math');

  const musicRef = useRef<HTMLAudioElement | null>(null);

  // initial leaderboard fetch (both subjects)
  useEffect(() => {
    fetchBoards(4).then(setBoards).catch(() => {});
  }, []);

  // total stars for one subject only (drives that subject's leaderboard)
  const subjectStars = (p: Progress, subj: Subject): number => {
    const ids = (subj === 'math' ? MATH_SECTIONS : ENGLISH_SECTIONS).map((s) => s.id);
    return ids.reduce((sum, id) => sum + (p[id] ? p[id].reduce((a, b) => a + b, 0) : 0), 0);
  };

  // pick a fresh random Tadamate each time we land on the menu
  useEffect(() => {
    if (gameState === 'MENU') setMenuMascot(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
  }, [gameState]);

  const persistProgress = (p: Progress) => {
    setProgress(p);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
  };

  const saveName = (n: string) => {
    setName(n);
    try { localStorage.setItem(NAME_KEY, n); } catch {}
    setShowNameModal(false);
  };

  // --- Audio wiring ---
  const ensureMusic = useCallback(() => {
    if (!musicRef.current) {
      const audio = new Audio(MUSIC_URL);
      audio.loop = true;
      audio.volume = 0.15;
      musicRef.current = audio;
    }
    if (!isMuted) musicRef.current.play().catch(() => {});
  }, [isMuted]);

  useEffect(() => {
    if (!musicRef.current) return;
    if (isMuted) musicRef.current.pause();
    else musicRef.current.play().catch(() => {});
  }, [isMuted]);

  const playSound = useCallback((type: SfxName) => {
    ensureMusic();
    if (isMuted) return;
    try { synthesizeSfx(type); } catch (e) { console.warn('SFX failed', e); }
  }, [isMuted, ensureMusic]);

  // --- Flow ---
  const goStart = () => {
    playSound('CLICK');
    ensureMusic();
    if (!name) { setShowNameModal(true); return; }
    setGameState('SUBJECT');
  };

  const chooseSubject = (subj: Subject) => {
    playSound('CLICK');
    setSubject(subj);
    setGameState('SECTION');
  };

  const openSection = (s: Section) => {
    playSound('CLICK');
    setSection(s);
    setGameState('LEVEL');
  };

  const startLevel = (s: Section, lvl: number) => {
    playSound('CLICK');
    setSection(s);
    setLevelIndex(lvl);
    setQuestions(
      s.subject === 'english'
        ? generateEnglishQuestions(s.id, lvl, QUESTIONS_PER_LEVEL)
        : generateLevelQuestions(s.id, lvl, QUESTIONS_PER_LEVEL)
    );
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setUserAnswers([]);
    setShowFeedback(null);
    setMyRank(-1);
    setGameState('PLAYING');
  };

  const handleAnswer = (val: number | string) => {
    if (showFeedback) return;
    const q = questions[currentQ];
    const isCorrect = String(val) === String(q.answer);
    playSound(isCorrect ? 'CORRECT' : 'WRONG');
    setUserAnswers((prev) => [...prev, { question: q.text, correctAnswer: q.answer, userValue: val, isCorrect, visual: q.visual, glosses: q.glosses }]);
    if (isCorrect) { setScore((s) => s + 1); setStreak((s) => s + 1); setShowFeedback('CORRECT'); }
    else { setStreak(0); setShowFeedback('WRONG'); }

    setTimeout(() => {
      setShowFeedback(null);
      if (currentQ < questions.length - 1) setCurrentQ((i) => i + 1);
      else finishLevel(isCorrect ? score + 1 : score);
    }, 1500);
  };

  const finishLevel = (finalScore: number) => {
    if (!section) return;
    const stars = starsFor(finalScore);
    const next = loadProgress();
    next[section.id][levelIndex] = Math.max(next[section.id][levelIndex] || 0, stars);
    persistProgress(next);
    setGameState('RESULT');
    if (finalScore >= PASS_MARK) playSound('WIN');

    // submit this subject's star total to that subject's leaderboard (non-blocking)
    const subj = section.subject;
    const tot = subjectStars(next, subj);
    const player = name || 'Player';
    submitScore(player, tot, subj, 4)
      .then((fresh) => {
        setBoards(fresh);
        const list = subj === 'math' ? fresh.math : fresh.english;
        setMyRank(list.findIndex((e) => e.name === player && Number(e.score) === tot));
      })
      .catch(() => {});
  };

  // --- Shared chrome ---
  const VolumeToggle = () => (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => { ensureMusic(); setIsMuted((m) => !m); }}
        className="p-3 bg-white/80 backdrop-blur rounded-full shadow-lg border-2 border-teal-200 text-teal-500 hover:bg-teal-50 transition-colors"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>
    </div>
  );

  // --- Screens ---
  const MainMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6 bg-gradient-to-b from-sky-50 to-cyan-100"
    >
      <VolumeToggle />
      <Mascot character={menuMascot.file} status={null} />
      <div className="space-y-1">
        <h1 className="text-3xl md:text-5xl font-black text-teal-600 drop-shadow-sm">全港英數大冒險 排名榜</h1>
        <p className="text-lg text-teal-800 font-medium italic">Math &amp; English Quest: P2 Hong Kong Adventure</p>
        <p className="text-sm text-teal-700/80">今日同你冒險嘅 Tadamate 係 <b>{menuMascot.name}</b>！</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        <LeaderboardPanel top={boards.math} variant="home" highlightName={name} label="🧮 數學 Maths" />
        <LeaderboardPanel top={boards.english} variant="home" highlightName={name} label="🔤 英文 English" />
      </div>

      <button
        onClick={goStart}
        id="start-btn"
        className="group px-10 py-4 bg-teal-500 text-white text-2xl font-bold rounded-2xl shadow-xl hover:bg-teal-600 active:scale-95 transition-all hover:-translate-y-1"
      >
        <span className="flex items-center gap-3">開始挑戰 <ChevronRight className="group-hover:translate-x-1 transition-transform" /></span>
      </button>

      <div className="text-sm text-gray-600">
        {name ? (
          <span>玩家：<b className="text-teal-700">{name}</b> · <button className="underline" onClick={() => setShowNameModal(true)}>改名</button></span>
        ) : (
          <button className="underline" onClick={() => setShowNameModal(true)}>設定玩家名稱</button>
        )}
        <div className="mt-1">⭐ 你嘅總星星：{totalStars(progress)}</div>
      </div>

      {/* Warm, non-commercial acknowledgement */}
      <footer className="max-w-md text-[11px] leading-relaxed text-gray-500 pt-4 border-t border-teal-200/60 mt-2">
        <p>
          懷著感謝之心 🧡 本遊戲採用{' '}
          <a href="https://tadaland.net" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Tadaland</a>{' '}
          嘅{' '}
          <a href="https://www.instagram.com/tadaland_hk/" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Tadamates</a>{' '}
          作為學習夥伴角色；學習內容由{' '}
          <a href="https://www.eurekahk.net" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Eureka Language Services Limited</a>{' '}
          分享（數學為 STEAM 內容，另設英語學習內容）。
        </p>
        <p className="mt-1 text-gray-400">
          Tadamates are original character mascots by Tadaland, supporting personality-inspired, creative learning.
        </p>
      </footer>

      {showNameModal && (
        <NameModal
          initial={name}
          validate={async (n) => {
            // allow keeping your own current name
            if (name && n.trim().toLowerCase() === name.trim().toLowerCase()) return null;
            const taken = await isNameTaken(n);
            return taken ? '呢個名已經有人用咗，請改第二個 🙏' : null;
          }}
          onSave={(n) => { saveName(n); setGameState('SUBJECT'); }}
        />
      )}
    </motion.div>
  );

  const SectionSelect = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 p-6 md:p-10">
      <VolumeToggle />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={() => { playSound('CLICK'); setGameState('SUBJECT'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"><ArrowLeft className="w-5 h-5" /> {subject === 'math' ? '數學' : 'English'}</button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><MapPin className="text-red-500" /> {subject === 'math' ? '選擇冒險地點' : 'Choose a Zone'}</h2>
          <button onClick={() => { playSound('CLICK'); setGameState('MENU'); }} className="p-2 hover:bg-gray-200 rounded-full"><Home className="w-6 h-6 text-gray-600" /></button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {(subject === 'math' ? MATH_SECTIONS : ENGLISH_SECTIONS).map((s, idx) => {
            const stars = progress[s.id].reduce((a, b) => a + b, 0);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => openSection(s)}
                className="bg-white rounded-3xl shadow-lg border-b-4 border-gray-200 overflow-hidden cursor-pointer group flex flex-col"
              >
                <div className={`${s.color} p-5 flex flex-col items-center justify-center text-white relative h-40`}>
                  <img src={`${import.meta.env.BASE_URL}${s.character}`} alt={s.title} className="w-28 h-28 object-contain group-hover:scale-110 transition-transform" />
                  <div className="absolute top-3 right-3 bg-white/20 p-2 rounded-full backdrop-blur-sm">{s.icon}</div>
                </div>
                <div className="p-5 space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{s.topic}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{s.location}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{s.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {stars} / {LEVELS_PER_SECTION * 3}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {subject === 'english' && (
          <footer className="text-[11px] leading-relaxed text-gray-500 pt-4 border-t border-gray-200 max-w-2xl">
            懷著感謝之心 🧡 角色為{' '}
            <a href="https://tadaland.net" target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">Tadaland</a>{' '}
            嘅{' '}
            <a href="https://www.instagram.com/tadaland_hk/" target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">Tadamates</a>
            ；英語學習內容由{' '}
            <a href="https://www.eurekahk.net" target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">Eureka Language Services Limited</a>{' '}
            分享。
          </footer>
        )}
      </div>
    </motion.div>
  );

  const SubjectSelect = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-gradient-to-b from-sky-50 to-cyan-100">
      <VolumeToggle />
      <button onClick={() => { playSound('CLICK'); setGameState('MENU'); }} className="fixed top-4 left-4 p-2 hover:bg-white/60 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
      <h2 className="text-3xl font-black text-teal-600">揀一個科目 Choose a subject</h2>
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <button onClick={() => chooseSubject('math')} className="bg-white rounded-3xl shadow-xl border-b-4 border-teal-200 p-8 flex flex-col items-center gap-3 hover:-translate-y-1 active:scale-95 transition-all">
          <div className="bg-teal-500 text-white p-4 rounded-2xl"><Calculator className="w-10 h-10" /></div>
          <h3 className="text-2xl font-black text-gray-800">數學 Maths</h3>
          <p className="text-sm text-gray-500">7 個地區 · P2</p>
        </button>
        <button onClick={() => chooseSubject('english')} className="bg-white rounded-3xl shadow-xl border-b-4 border-pink-200 p-8 flex flex-col items-center gap-3 hover:-translate-y-1 active:scale-95 transition-all">
          <div className="bg-pink-500 text-white p-4 rounded-2xl"><Sparkles className="w-10 h-10" /></div>
          <h3 className="text-2xl font-black text-gray-800">英文 English</h3>
          <p className="text-sm text-gray-500">6 個關卡 · P2 English</p>
        </button>
      </div>
    </motion.div>
  );

  const LevelSelect = () => {
    if (!section) return null;
    const levels = LEVEL_META[section.id];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 p-6 md:p-10">
        <VolumeToggle />
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={() => { playSound('CLICK'); setGameState('SECTION'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"><ArrowLeft className="w-5 h-5" /> 返回地圖</button>
            <button onClick={() => { playSound('CLICK'); setGameState('MENU'); }} className="p-2 hover:bg-gray-200 rounded-full"><Home className="w-6 h-6 text-gray-600" /></button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`${section.color} text-white p-3 rounded-2xl`}>{section.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
              <span className="text-sm text-gray-500">{section.topic} · 5 關</span>
            </div>
          </div>
          <div className="space-y-4">
            {levels.map((lv, i) => {
              const unlocked = isUnlocked(progress, section.id, i);
              const stars = progress[section.id][i];
              return (
                <motion.button
                  key={i}
                  whileHover={unlocked ? { scale: 1.02 } : {}}
                  disabled={!unlocked}
                  onClick={() => startLevel(section, i)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                    unlocked ? 'bg-white border-gray-200 hover:border-teal-400 shadow-sm' : 'bg-gray-100 border-gray-100 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${unlocked ? `${section.color} text-white` : 'bg-gray-300 text-gray-500'}`}>
                    {unlocked ? i + 1 : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">第 {i + 1} 關 · {lv.title}</h3>
                    <p className="text-sm text-gray-500">{lv.desc}</p>
                  </div>
                  <StarRow stars={stars} size="w-5 h-5" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  const Playing = () => {
    if (!section || !questions[currentQ]) return null;
    const q = questions[currentQ];
    const progressPct = ((currentQ + 1) / questions.length) * 100;
    const board = section.subject === 'math' ? boards.math : boards.english;
    const boardLabel = section.subject === 'math' ? '🧮 數學 Maths' : '🔤 英文 English';
    return (
      <div className="min-h-screen bg-white flex flex-col relative">
        <VolumeToggle />
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`${section.color} text-white p-2 rounded-lg`}>{section.icon}</div>
            <div>
              <h3 className="font-bold text-gray-800 leading-none">{section.title}</h3>
              <span className="text-xs text-gray-400">第 {levelIndex + 1} 關 · {LEVEL_META[section.id][levelIndex].title}</span>
            </div>
          </div>
          <button onClick={() => { playSound('CLICK'); setGameState('LEVEL'); }} className="p-2 hover:bg-gray-100 rounded-full"><Home className="w-5 h-5 text-gray-400" /></button>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-400 block">題目</span>
            <span className="text-lg font-black text-gray-700 font-mono">{currentQ + 1} / {questions.length}</span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100">
          <motion.div className={`h-full ${section.color}`} initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} />
        </div>

        {/* Mobile leaderboard strip — current subject only */}
        <div className="lg:hidden px-4 pt-3">
          <div className="flex items-center gap-3 overflow-x-auto text-xs bg-teal-50 rounded-xl px-3 py-2">
            <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
            <span className="font-bold text-gray-500 shrink-0">{boardLabel}</span>
            {board.slice(0, 4).map((e, i) => (
              <span key={i} className="whitespace-nowrap text-gray-700"><b>{i + 1}.</b> {e.name} {e.score}⭐</span>
            ))}
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Game area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-2xl mx-auto w-full">
            <AnimatePresence>
              {streak >= 2 && (
                <motion.div
                  key={streak}
                  initial={{ scale: 0.4, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-red-500 text-white font-black text-sm shadow-lg"
                >
                  🔥 連勝 {streak}！{streak >= 4 ? ' 勁呀!' : ''}
                </motion.div>
              )}
            </AnimatePresence>
            <Mascot character={section.character} status={showFeedback} />
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center space-y-6 w-full">
                {q.passage && (
                  <div className="text-left bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 text-base md:text-lg leading-relaxed text-gray-700">
                    <span className="block text-xs font-bold text-rose-400 mb-1 uppercase tracking-wider">📖 Read the passage</span>
                    {q.passage}
                  </div>
                )}
                <div className="p-5 md:p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 shadow-inner space-y-4">
                  {q.visual && <QuestionVisual visual={q.visual} />}
                  <h4 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{q.text}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {q.options.map((opt, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={showFeedback !== null} onClick={() => handleAnswer(opt)}
                      className="py-5 px-4 bg-white border-2 border-gray-200 rounded-2xl text-xl font-bold text-gray-700 shadow-sm hover:border-teal-400 hover:text-teal-500 transition-all disabled:opacity-50">
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop sidebar leaderboard — current subject only */}
          <aside className="hidden lg:block w-64 p-4 border-l bg-gray-50">
            <LeaderboardPanel top={board} variant="side" highlightName={name} label={boardLabel} />
          </aside>
        </div>

        <AnimatePresence>
          {showFeedback && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 px-6">
              {showFeedback === 'CORRECT' ? (
                <div className="bg-green-500 text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-3 text-center"><CheckCircle2 className="w-16 h-16" /><span className="text-2xl font-bold">答啱喇！你真係叻！</span></div>
              ) : (
                <div className="bg-red-500 text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-3 text-center"><XCircle className="w-16 h-16" /><span className="text-2xl font-bold">差少少呀，加油！</span></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Result = () => {
    if (!section) return null;
    const passed = score >= PASS_MARK;
    const stars = starsFor(score);
    const hasNext = levelIndex < LEVELS_PER_SECTION - 1;
    const nextUnlocked = passed && hasNext;
    const board = section.subject === 'math' ? boards.math : boards.english;
    const boardLabel = section.subject === 'math' ? '🧮 數學 Maths' : '🔤 英文 English';
    const subjTotal = subjectStars(progress, section.subject);

    useEffect(() => {
      if (passed) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }, []);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <VolumeToggle />
        <Mascot character={section.character} status={passed ? 'CORRECT' : 'WRONG'} />
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border-b-[10px] border-gray-200 max-w-lg w-full space-y-5 overflow-y-auto max-h-[88vh]">
          <StarRow stars={stars} size="w-10 h-10" />
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-800">{passed ? '挑戰成功！' : '再接再厲！'}</h2>
            <p className="text-gray-500">{passed ? '你好有數學天分呀！' : '答啱 3 題就可以過關，再試多次！'}</p>
          </div>

          <div className="bg-teal-50 p-5 rounded-3xl border-2 border-teal-100">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-1">本關得分</span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black text-teal-500">{score}</span>
              <span className="text-xl font-bold text-teal-300">/ {questions.length}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">⭐ {section.subject === 'math' ? '數學' : '英文'}總星星：<b>{subjTotal}</b></div>
          </div>

          {/* Competitive rank reveal — within this subject */}
          <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
            {myRank >= 0 ? (
              <p className="font-bold text-indigo-700">🏆 你而家喺{section.subject === 'math' ? '數學' : '英文'}榜排全球第 {myRank + 1} 位！</p>
            ) : (
              <p className="font-semibold text-indigo-600">繼續努力，衝入{section.subject === 'math' ? '數學' : '英文'}榜前 4 名！</p>
            )}
            <div className="mt-3"><LeaderboardPanel top={board} variant="side" highlightName={name} label={boardLabel} /></div>
          </div>

          <div className="space-y-2 text-left">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Star className="text-yellow-500" /> 答案回顧</h3>
            {userAnswers.map((a, i) => (
              <div key={i} className={`p-3 rounded-2xl border-l-8 ${a.isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                <p className="font-bold text-gray-800 mb-1 text-sm">{i + 1}. {a.question}</p>
                {a.visual && <div className="my-2 scale-90 origin-left"><QuestionVisual visual={a.visual} /></div>}
                <div className="flex flex-wrap gap-x-4 text-xs">
                  <span className="text-gray-600">正確答案：<b className="text-green-700">{a.correctAnswer}</b>{a.glosses && a.glosses[String(a.correctAnswer)] ? <span className="text-gray-500"> （{a.glosses[String(a.correctAnswer)]}）</span> : null}</span>
                  <span className="text-gray-600">你嘅答案：<b className={a.isCorrect ? 'text-green-700' : 'text-red-700'}>{a.userValue}</b>{a.glosses && a.glosses[String(a.userValue)] ? <span className="text-gray-500"> （{a.glosses[String(a.userValue)]}）</span> : null}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {nextUnlocked && (
              <button onClick={() => startLevel(section, levelIndex + 1)} className="py-4 bg-green-500 text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                下一關 <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="flex gap-3">
              <button onClick={() => startLevel(section, levelIndex)} className="flex-1 py-3 bg-teal-500 text-white font-bold rounded-2xl shadow-lg hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /> 重玩</button>
              <button onClick={() => { playSound('CLICK'); setGameState('LEVEL'); }} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"><MapPin className="w-5 h-5" /> 選關</button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 selection:bg-teal-200">
      <AnimatePresence mode="wait">
        {gameState === 'MENU' && <MainMenu key="menu" />}
        {gameState === 'SUBJECT' && <SubjectSelect key="subject" />}
        {gameState === 'SECTION' && <SectionSelect key="section" />}
        {gameState === 'LEVEL' && <LevelSelect key="level" />}
        {gameState === 'PLAYING' && <Playing key="play" />}
        {gameState === 'RESULT' && <Result key="result" />}
      </AnimatePresence>
    </div>
  );
}
