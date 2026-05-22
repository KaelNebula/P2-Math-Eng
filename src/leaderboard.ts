/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Global leaderboard backed by a Google Sheet via an Apps Script Web App.
 * Uses JSONP (script-tag injection) so it works cross-origin from GitHub
 * Pages with no CORS configuration. All calls fail gracefully.
 */

// TODO(P2): deploy a NEW Google Sheet + Apps Script Web App for the P2 site and
// paste its /exec URL here. It MUST be separate from the P3 backend, otherwise
// P2 scores pollute the P3 leaderboard. Until configured, the leaderboard is
// disabled and fails gracefully (play is never blocked).
const ENDPOINT = 'REPLACE_WITH_P2_APPS_SCRIPT_URL';
const ENDPOINT_READY = ENDPOINT.startsWith('https://');

// P2-specific cache key — github.io localStorage is shared across the whole
// origin, so this must differ from the P3 site's keys.
const CACHE_KEY_BOARDS = 'p2_boards_cache';

export interface Entry {
  name: string;
  score: number;
  section: string;
  date: string;
}

export interface Boards {
  math: Entry[];
  english: Entry[];
}

let cbSeq = 0;

function jsonp(params: Record<string, string | number>, timeoutMs = 8000): Promise<Entry[]> {
  return new Promise((resolve, reject) => {
    const cbName = `__mq_cb_${Date.now()}_${cbSeq++}`;
    const script = document.createElement('script');
    let done = false;

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete (window as any)[cbName];
      } catch {
        (window as any)[cbName] = undefined;
      }
    };

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('leaderboard timeout'));
    }, timeoutMs);

    (window as any)[cbName] = (data: { ok: boolean; top: Entry[] }) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      resolve((data && data.top) || []);
    };

    const qs = Object.entries({ ...params, callback: cbName })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

    script.src = `${ENDPOINT}?${qs}`;
    script.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('leaderboard network error'));
    };
    document.body.appendChild(script);
  });
}

// Pull a generous number of rows so we can dedupe + split by subject client-side.
const RAW_LIMIT = 300;

const norm = (s: unknown) => String(s ?? '').trim();

// A row belongs to English only if its tag is exactly 'english'.
// Everything else (the subject tag 'math', or any legacy zone title) is Maths.
const isEnglishRow = (r: Entry) => norm(r.section).toLowerCase() === 'english';

// Keep only the highest score per name, sorted desc, capped to `limit`.
// A player submits a row per level (their growing star total), so the raw
// feed contains the same name many times — this collapses it to one entry.
function dedupe(rows: Entry[], limit: number): Entry[] {
  const byName = new Map<string, Entry>();
  for (const r of rows || []) {
    const key = norm(r.name).toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing || Number(r.score) > Number(existing.score)) byName.set(key, r);
  }
  return Array.from(byName.values())
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, limit);
}

function splitBoards(rows: Entry[], limit: number): Boards {
  const english = dedupe((rows || []).filter(isEnglishRow), limit);
  const math = dedupe((rows || []).filter((r) => !isEnglishRow(r)), limit);
  return { math, english };
}

function readBoards(): Boards {
  try {
    const raw = localStorage.getItem(CACHE_KEY_BOARDS);
    return raw ? (JSON.parse(raw) as Boards) : { math: [], english: [] };
  } catch {
    return { math: [], english: [] };
  }
}

function writeBoards(b: Boards) {
  try { localStorage.setItem(CACHE_KEY_BOARDS, JSON.stringify(b)); } catch { /* ignore */ }
}

/** Cached (instant) boards; use fetchBoards for fresh data. */
export function cachedBoards(): Boards {
  return readBoards();
}

export async function fetchBoards(limit = 4): Promise<Boards> {
  if (!ENDPOINT_READY) return readBoards();
  try {
    const raw = await jsonp({ action: 'top', limit: RAW_LIMIT });
    const b = splitBoards(raw, limit);
    writeBoards(b);
    return b;
  } catch {
    return readBoards();
  }
}

/** Submit a per-subject star total. Returns the refreshed, split boards. */
export async function submitScore(
  name: string,
  score: number,
  subject: 'math' | 'english',
  limit = 4
): Promise<Boards> {
  if (!ENDPOINT_READY) return readBoards();
  try {
    const raw = await jsonp({ action: 'submit', name, score, section: subject, limit: RAW_LIMIT });
    const b = splitBoards(raw, limit);
    writeBoards(b);
    return b;
  } catch {
    try {
      const raw = await jsonp({ action: 'submit', name, score, section: subject, limit: RAW_LIMIT });
      const b = splitBoards(raw, limit);
      writeBoards(b);
      return b;
    } catch {
      return readBoards();
    }
  }
}

/**
 * True if the name already exists anywhere on the leaderboard (case-insensitive).
 * Fails open (returns false) on network error so play is never blocked.
 */
export async function isNameTaken(name: string): Promise<boolean> {
  const target = norm(name).toLowerCase();
  if (!target) return false;
  if (!ENDPOINT_READY) return false;
  try {
    const raw = await jsonp({ action: 'top', limit: RAW_LIMIT });
    return (raw || []).some((r) => norm(r.name).toLowerCase() === target);
  } catch {
    return false;
  }
}
