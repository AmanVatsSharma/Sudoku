import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════
//  SUDOKU ENGINE
// ═══════════════════════════════════════════════════════════
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const canPlace = (b, r, c, n) => {
  for (let i = 0; i < 9; i++) {
    if (b[r][i] === n || b[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let x = br; x < br + 3; x++)
    for (let y = bc; y < bc + 3; y++)
      if (b[x][y] === n) return false;
  return true;
};
const fillBoard = (b) => {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (b[r][c] === 0) {
        for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (canPlace(b, r, c, n)) {
            b[r][c] = n;
            if (fillBoard(b)) return true;
            b[r][c] = 0;
          }
        }
        return false;
      }
  return true;
};
const genPuzzle = (diff) => {
  const sol = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(sol);
  const removes = { easy: 27, medium: 37, hard: 46, expert: 53, ultimatum: 60 };
  const puz = sol.map((r) => [...r]);
  let rem = removes[diff] || 37;
  for (const i of shuffle([...Array(81).keys()])) {
    if (!rem) break;
    puz[Math.floor(i / 9)][i % 9] = 0;
    rem--;
  }
  return { puzzle: puz, solution: sol.map((r) => [...r]) };
};
const isConflict = (b, r, c) => {
  const v = b[r][c];
  if (!v) return false;
  for (let i = 0; i < 9; i++) {
    if (i !== c && b[r][i] === v) return true;
    if (i !== r && b[i][c] === v) return true;
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let x = br; x < br + 3; x++)
    for (let y = bc; y < bc + 3; y++)
      if ((x !== r || y !== c) && b[x][y] === v) return true;
  return false;
};

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const DIFFS = {
  easy:      { label: "Easy",      color: "#34C759", dColor: "#30D158", desc: "Relaxed & fun" },
  medium:    { label: "Medium",    color: "#FF9500", dColor: "#FF9F0A", desc: "Balanced challenge" },
  hard:      { label: "Hard",      color: "#FF6B6B", dColor: "#FF6B6B", desc: "Real thinking" },
  expert:    { label: "Expert",    color: "#AF52DE", dColor: "#BF5AF2", desc: "Serious solver" },
  ultimatum: { label: "Ultimatum", color: "#007AFF", dColor: "#0A84FF", desc: "Max difficulty" },
};
const ACCENTS = [
  { id: "blue",   l: "#007AFF", d: "#0A84FF", name: "Ocean"  },
  { id: "purple", l: "#AF52DE", d: "#BF5AF2", name: "Cosmic" },
  { id: "green",  l: "#28A745", d: "#30D158", name: "Forest" },
  { id: "orange", l: "#E67700", d: "#FF9F0A", name: "Ember"  },
  { id: "teal",   l: "#0097A7", d: "#5AC8FA", name: "Arctic" },
];
const ACHS = [
  { id: "first",   icon: "⚡", title: "First Blood",    desc: "Complete your first puzzle",         xp: 100,  r: "common"    },
  { id: "flawless",icon: "◈", title: "Flawless",        desc: "Solve with zero mistakes",           xp: 300,  r: "rare"      },
  { id: "solo",    icon: "✦", title: "Self-Reliant",    desc: "Solve without using hints",          xp: 200,  r: "uncommon"  },
  { id: "speed",   icon: "⚡", title: "Speed Demon",    desc: "Solve Easy in under 90 seconds",     xp: 250,  r: "uncommon"  },
  { id: "expert",  icon: "◉", title: "Expert Mind",     desc: "Complete an Expert puzzle",          xp: 500,  r: "epic"      },
  { id: "ultimate",icon: "⬡", title: "Ultimatum",       desc: "Complete an Ultimatum puzzle",       xp: 1000, r: "legendary" },
  { id: "streak3", icon: "🔥", title: "On Fire",         desc: "Reach a 3-day streak",              xp: 150,  r: "common"    },
  { id: "perfect", icon: "★", title: "Perfect Expert",  desc: "Expert: no mistakes & no hints",     xp: 750,  r: "legendary" },
];
const R_COLORS = { common:"#8E8E93", uncommon:"#30D158", rare:"#0A84FF", epic:"#BF5AF2", legendary:"#FFD60A" };
const XPL = 500;
const RANKS = ["Novice","Student","Solver","Sharp","Expert","Elite","Master","Sage","Champion","Ultimatum"];
const getRank = (lv) => RANKS[Math.min(lv - 1, RANKS.length - 1)];
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const calcXP = (diff, mistakes, hints, time) => {
  const base = { easy: 80, medium: 160, hard: 300, expert: 500, ultimatum: 900 };
  let x = base[diff] || 80;
  if (mistakes === 0) x = Math.round(x * 1.5);
  if (hints === 0) x = Math.round(x * 1.2);
  if (diff === "easy" && time < 90) x = Math.round(x * 1.3);
  return x;
};

// ═══════════════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════════════
const mkT = (dark, aid) => {
  const ac = ACCENTS.find((a) => a.id === aid) || ACCENTS[0];
  const a = dark ? ac.d : ac.l;
  return dark
    ? { bg:"#08080F", bgC:"#0E0E1A", bgS:"#141422", sur:"rgba(255,255,255,0.055)", surH:"rgba(255,255,255,0.1)", bor:"rgba(255,255,255,0.09)", borS:"rgba(255,255,255,0.22)", txt:"#F2F2F7", txS:"rgba(242,242,247,0.7)", txM:"rgba(242,242,247,0.4)", txF:"rgba(242,242,247,0.18)", acc:a, aD:a+"28", aM:a+"44", aB:a+"55", red:"#FF453A", rD:"rgba(255,69,58,0.2)", grn:"#30D158", yel:"#FFD60A", cSel:a+"38", cRel:"rgba(255,255,255,0.055)", cSam:a+"20", cCon:"rgba(255,69,58,0.22)", gClr:"#F2F2F7", pClr:a, eClr:"#FF453A", glow:`0 0 60px ${a}20`, dark:true, aid }
    : { bg:"#F3F3EE", bgC:"#FFFFFF", bgS:"#F8F8F4", sur:"rgba(0,0,0,0.045)", surH:"rgba(0,0,0,0.09)", bor:"rgba(0,0,0,0.09)", borS:"rgba(0,0,0,0.22)", txt:"#1A1A1E", txS:"rgba(26,26,30,0.7)", txM:"rgba(26,26,30,0.45)", txF:"rgba(26,26,30,0.2)", acc:a, aD:a+"22", aM:a+"38", aB:a+"50", red:"#FF3B30", rD:"rgba(255,59,48,0.13)", grn:"#28A745", yel:"#FFCC00", cSel:a+"2E", cRel:"rgba(0,0,0,0.04)", cSam:a+"18", cCon:"rgba(255,59,48,0.12)", gClr:"#1A1A1E", pClr:a, eClr:"#FF3B30", glow:`0 0 60px ${a}18`, dark:false, aid };
};

// ═══════════════════════════════════════════════════════════
//  INJECTED STYLES
// ═══════════════════════════════════════════════════════════
const CSS = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  button{font-family:inherit}
  @keyframes pop{0%{transform:scale(1)}45%{transform:scale(1.22)}100%{transform:scale(1)}}
  @keyframes toastIn{from{transform:translateY(-110%) scale(0.88);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
  @keyframes toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-110%)}}
  @keyframes winBounce{0%{opacity:0;transform:scale(0.72)}65%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(400deg);opacity:0}}
  @keyframes firePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
  @keyframes shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
`;

// ═══════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [dark, setDark] = useState(true);
  const [aid, setAid] = useState("blue");
  const [screen, setScreen] = useState("home");

  // Game
  const [diff, setDiff] = useState("medium");
  const [puzzle, setPuzzle] = useState(null);
  const [solution, setSolution] = useState(null);
  const [board, setBoard] = useState(null);
  const [given, setGiven] = useState(null);
  const [notes, setNotes] = useState(null);
  const [sel, setSel] = useState(null);
  const [hist, setHist] = useState([]);
  const [noteMode, setNoteMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [winData, setWinData] = useState(null);

  // Animations
  const [flashSet, setFlashSet] = useState(new Set());
  const [doneRows, setDoneRows] = useState(new Set());
  const [doneCols, setDoneCols] = useState(new Set());
  const [doneBoxes, setDoneBoxes] = useState(new Set());

  // Profile
  const [xp, setXP] = useState(0);
  const [lv, setLv] = useState(1);
  const [streak, setStreak] = useState(1);
  const [solves, setSolves] = useState(0);
  const [bests, setBests] = useState({});
  const [unlocked, setUnlocked] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [solvHist, setSolvHist] = useState([]);

  // Settings
  const [hlSame, setHlSame] = useState(true);
  const [showErr, setShowErr] = useState(true);
  const [autoRm, setAutoRm] = useState(true);
  const [showClock, setShowClock] = useState(true);
  const [showSett, setShowSett] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const timerRef = useRef(null);
  const T = mkT(dark, aid);

  useEffect(() => {
    if (running && !paused) timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running, paused]);

  const pushToast = useCallback((a) => {
    const tid = Date.now() + Math.random();
    setToasts((q) => [...q.slice(-2), { ...a, tid }]);
    setTimeout(() => setToasts((q) => q.filter((t) => t.tid !== tid)), 3800);
  }, []);

  const grantAch = useCallback((id) => {
    if (unlocked.has(id)) return;
    const a = ACHS.find((x) => x.id === id);
    if (!a) return;
    setUnlocked((s) => new Set([...s, id]));
    pushToast(a);
    setXP((prev) => { const next = prev + a.xp; setLv(Math.floor(next / XPL) + 1); return next; });
  }, [unlocked, pushToast]);

  const addXP = useCallback((amount) => {
    setXP((prev) => { const next = prev + amount; setLv(Math.floor(next / XPL) + 1); return next; });
  }, []);

  const startGame = useCallback((d) => {
    const { puzzle: p, solution: s } = genPuzzle(d);
    setPuzzle(p); setSolution(s);
    setBoard(p.map((r) => [...r]));
    setGiven(p.map((r) => r.map((v) => v !== 0)));
    setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())));
    setSel(null); setHist([]); setNoteMode(false);
    setMistakes(0); setHintsUsed(0); setTime(0);
    setRunning(true); setPaused(false); setDiff(d);
    setFlashSet(new Set()); setDoneRows(new Set()); setDoneCols(new Set()); setDoneBoxes(new Set());
    setWinData(null);
    setScreen("game");
  }, []);

  const checkComplete = useCallback((nb) => {
    const nr = new Set(doneRows), nc = new Set(doneCols), nb2 = new Set(doneBoxes);
    for (let r = 0; r < 9; r++)
      if (!nr.has(r) && nb[r].every((v) => v !== 0) && new Set(nb[r]).size === 9) nr.add(r);
    for (let c = 0; c < 9; c++) {
      const col = nb.map((r) => r[c]);
      if (!nc.has(c) && col.every((v) => v !== 0) && new Set(col).size === 9) nc.add(c);
    }
    for (let br = 0; br < 3; br++)
      for (let bc = 0; bc < 3; bc++) {
        const k = `${br}${bc}`;
        if (!nb2.has(k)) {
          const vals = [];
          for (let x = br * 3; x < br * 3 + 3; x++)
            for (let y = bc * 3; y < bc * 3 + 3; y++) vals.push(nb[x][y]);
          if (vals.every((v) => v !== 0) && new Set(vals).size === 9) nb2.add(k);
        }
      }
    setDoneRows(nr); setDoneCols(nc); setDoneBoxes(nb2);
  }, [doneRows, doneCols, doneBoxes]);

  const handleInput = useCallback((num) => {
    if (!sel || !board || !given) return;
    const [r, c] = sel;
    if (given[r][c]) return;
    setHist((h) => [...h.slice(-99), { board: board.map((row) => [...row]), notes: notes.map((row) => row.map((s) => new Set(s))) }]);
    if (noteMode && num !== 0) {
      const nn = notes.map((row) => row.map((s) => new Set(s)));
      nn[r][c].has(num) ? nn[r][c].delete(num) : nn[r][c].add(num);
      setNotes(nn); return;
    }
    const nb = board.map((row) => [...row]);
    nb[r][c] = num;
    let nn = notes.map((row) => row.map((s) => new Set(s)));
    if (num !== 0 && autoRm) {
      for (let i = 0; i < 9; i++) { nn[r][i].delete(num); nn[i][c].delete(num); }
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (let x = br; x < br + 3; x++) for (let y = bc; y < bc + 3; y++) nn[x][y].delete(num);
    }
    if (num !== 0) nn[r][c] = new Set();
    if (num !== 0 && solution && num !== solution[r][c]) setMistakes((m) => m + 1);
    setBoard(nb); setNotes(nn);
    if (num !== 0 && num === solution?.[r]?.[c]) {
      const k = `${r}-${c}`;
      setFlashSet((p) => new Set([...p, k]));
      setTimeout(() => setFlashSet((p) => { const s = new Set(p); s.delete(k); return s; }), 420);
      checkComplete(nb);
    }
    if (nb.every((row) => row.every((v) => v !== 0))) {
      const ok = nb.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
      if (ok) {
        setRunning(false);
        const xpE = calcXP(diff, mistakes, hintsUsed, time);
        const wd = { time: fmtTime(time), raw: time, mistakes, hints: hintsUsed, diff, xpE };
        setWinData(wd);
        setSolves((n) => n + 1);
        addXP(xpE);
        setStreak((s) => s + 1);
        setSolvHist((h) => [{ diff, time: fmtTime(time), mistakes, xp: xpE }, ...h.slice(0, 19)]);
        setBests((p) => (!p[diff] || time < p[diff] ? { ...p, [diff]: time } : p));
        if (solves === 0) grantAch("first");
        if (mistakes === 0) grantAch("flawless");
        if (hintsUsed === 0) grantAch("solo");
        if (diff === "easy" && time < 90) grantAch("speed");
        if (diff === "expert") grantAch("expert");
        if (diff === "ultimatum") grantAch("ultimate");
        if (streak >= 2) grantAch("streak3");
        if (diff === "expert" && mistakes === 0 && hintsUsed === 0) grantAch("perfect");
        setTimeout(() => setScreen("win"), 700);
      }
    }
  }, [sel, board, given, notes, noteMode, autoRm, solution, diff, mistakes, hintsUsed, time, solves, checkComplete, grantAch, addXP, streak]);

  const handleUndo = useCallback(() => {
    if (!hist.length) return;
    const last = hist[hist.length - 1];
    setBoard(last.board); setNotes(last.notes);
    setHist((h) => h.slice(0, -1));
  }, [hist]);

  const handleHint = useCallback(() => {
    if (hintsUsed >= 3 || !sel || !board || !solution || !given) return;
    const [r, c] = sel;
    if (given[r][c] || board[r][c] !== 0) return;
    setHist((h) => [...h.slice(-99), { board: board.map((row) => [...row]), notes: notes.map((row) => row.map((s) => new Set(s))) }]);
    const nb = board.map((row) => [...row]);
    nb[r][c] = solution[r][c];
    const nn = notes.map((row) => row.map((s) => new Set(s)));
    nn[r][c] = new Set();
    setBoard(nb); setNotes(nn);
    setHintsUsed((h) => h + 1);
  }, [hintsUsed, sel, board, solution, given, notes]);

  const dLeft = board
    ? [0, ...[1,2,3,4,5,6,7,8,9].map((n) => 9 - board.flat().filter((v) => v === n).length)]
    : Array(10).fill(9);
  const filled = board ? board.flat().filter((v) => v !== 0).length : 0;

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, color:T.txt, fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",sans-serif', WebkitFontSmoothing:"antialiased", transition:"background 0.3s,color 0.3s", overflowX:"hidden" }}>
      <style>{CSS}</style>

      {/* Toasts */}
      <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", flexDirection:"column", gap:8, width:"calc(100% - 32px)", maxWidth:360, pointerEvents:"none" }}>
        {toasts.map((t) => <Toast key={t.tid} t={t} T={T} />)}
      </div>

      {screen === "home" && (
        <HomeScreen T={T} dark={dark} setDark={setDark} aid={aid} setAid={setAid}
          diff={diff} setDiff={setDiff} onStart={startGame}
          lv={lv} xp={xp} streak={streak} solves={solves} bests={bests} unlocked={unlocked}
          onStats={() => setShowStats(true)}
        />
      )}
      {screen === "game" && board && solution && given && notes && (
        <GameScreen T={T} diff={diff} board={board} given={given} notes={notes} solution={solution}
          sel={sel} setSel={setSel} time={fmtTime(time)} showClock={showClock}
          mistakes={mistakes} hintsUsed={hintsUsed} noteMode={noteMode} setNoteMode={setNoteMode}
          hist={hist} hlSame={hlSame} showErr={showErr}
          flashSet={flashSet} doneRows={doneRows} doneCols={doneCols} doneBoxes={doneBoxes}
          dLeft={dLeft} filled={filled}
          onInput={handleInput} onUndo={handleUndo} onHint={handleHint}
          onBack={() => { setRunning(false); setScreen("home"); }}
          onSettings={() => setShowSett(true)}
          paused={paused} onPause={() => setPaused((p) => !p)}
        />
      )}
      {screen === "win" && winData && (
        <WinScreen T={T} winData={winData} lv={lv} xp={xp}
          onReplay={() => startGame(diff)}
          onHome={() => setScreen("home")}
          onNext={() => {
            const ks = Object.keys(DIFFS);
            startGame(ks[Math.min(ks.indexOf(diff) + 1, ks.length - 1)]);
          }}
        />
      )}
      {showSett && (
        <SettingsSheet T={T} dark={dark} setDark={setDark} aid={aid} setAid={setAid}
          hlSame={hlSame} setHlSame={setHlSame} showErr={showErr} setShowErr={setShowErr}
          autoRm={autoRm} setAutoRm={setAutoRm} showClock={showClock} setShowClock={setShowClock}
          paused={paused} onPause={() => setPaused((p) => !p)}
          onNewGame={() => { setShowSett(false); setRunning(false); setScreen("home"); }}
          onClose={() => setShowSett(false)}
        />
      )}
      {showStats && (
        <StatsSheet T={T} lv={lv} xp={xp} streak={streak} solves={solves}
          bests={bests} solvHist={solvHist} unlocked={unlocked}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  HOME SCREEN
// ═══════════════════════════════════════════════════════════
function HomeScreen({ T, dark, setDark, aid, setAid, diff, setDiff, onStart, lv, xp, streak, solves, bests, unlocked, onStats }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  const rank = getRank(lv);
  const lvXP = xp % XPL;
  const lvPct = (lvXP / XPL) * 100;
  const dc = dark ? DIFFS[diff].dColor : DIFFS[diff].color;

  return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", opacity:mounted?1:0, transform:mounted?"translateY(0)":"translateY(18px)", transition:"all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100vw", height:320, background:`radial-gradient(ellipse 80% 50% at 50% -5%, ${T.acc}1C 0%, transparent 70%)`, pointerEvents:"none", transition:"all 0.3s" }} />
      <div style={{ width:"100%", maxWidth:430, padding:"0 20px 56px", zIndex:1 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:22, marginBottom:12 }}>
          <button onClick={onStats} style={{ background:T.sur, border:`1px solid ${T.bor}`, borderRadius:12, padding:"8px 14px", color:T.txM, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <span>◉</span> Stats
          </button>
          <button onClick={() => setDark((d) => !d)} style={{ background:T.sur, border:`1px solid ${T.bor}`, borderRadius:12, padding:"8px 16px", color:T.txM, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7, transition:"all 0.2s" }}>
            <span style={{ fontSize:16 }}>{dark ? "☀" : "◑"}</span>
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Hero */}
        <div style={{ textAlign:"center", paddingTop:22, paddingBottom:24 }}>
          <div style={{ width:96, height:96, borderRadius:26, margin:"0 auto 22px", background:`linear-gradient(145deg,${T.acc}2E,${T.acc}09)`, border:`1.5px solid ${T.acc}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, boxShadow:T.glow, transition:"all 0.3s" }}>⬡</div>
          <h1 style={{ fontSize:"clamp(32px,8vw,52px)", fontWeight:800, letterSpacing:"-0.04em", margin:"0 0 5px", lineHeight:1 }}>Ultimatum</h1>
          <p style={{ fontSize:13, color:T.txM, margin:"0 0 24px", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700 }}>Sudoku</p>

          {/* Player card */}
          <div style={{ background:T.bgC, border:`1px solid ${T.bor}`, borderRadius:18, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, boxShadow:dark?"0 4px 24px rgba(0,0,0,0.3)":"0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ width:46, height:46, borderRadius:14, background:T.aD, border:`1.5px solid ${T.aB}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>⬡</div>
            <div style={{ flex:1, textAlign:"left" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <span style={{ fontSize:14, fontWeight:800 }}>{rank}</span>
                <span style={{ fontSize:11, color:T.txM, fontWeight:600 }}>Lv.{lv} · {xp.toLocaleString()} XP</span>
              </div>
              <div style={{ height:5, background:T.sur, borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${lvPct}%`, background:`linear-gradient(90deg,${T.acc},${T.acc}BB)`, borderRadius:3, transition:"width 0.6s ease" }} />
              </div>
              <div style={{ fontSize:10, color:T.txM, marginTop:4 }}>{XPL - lvXP} XP to next level</div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display:"flex", gap:10, marginBottom:22 }}>
          {[{icon:"🔥",val:streak,label:"Streak",anim:streak>2},{icon:"✓",val:solves,label:"Solved",anim:false},{icon:"◈",val:unlocked.size,label:"Badges",anim:false}].map(({ icon, val, label, anim }) => (
            <div key={label} style={{ flex:1, background:T.bgC, border:`1px solid ${T.bor}`, borderRadius:16, padding:"14px 8px", textAlign:"center", boxShadow:dark?"0 2px 12px rgba(0,0,0,0.2)":"0 1px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:22, marginBottom:3, animation:anim?"firePulse 1.8s ease-in-out infinite":"none", display:"inline-block" }}>{icon}</div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em" }}>{val}</div>
              <div style={{ fontSize:10, color:T.txM, fontWeight:700, marginTop:2, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:T.txM, marginBottom:11 }}>Difficulty</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {Object.entries(DIFFS).map(([key, meta]) => {
              const active = diff === key;
              const col = dark ? meta.dColor : meta.color;
              return (
                <button key={key} onClick={() => setDiff(key)} style={{ background:active?`${col}16`:T.sur, border:`1.5px solid ${active?col+"55":T.bor}`, borderRadius:14, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all 0.18s", color:T.txt }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:col, boxShadow:active?`0 0 10px ${col}`:"none", transition:"all 0.2s" }} />
                    <span style={{ fontSize:15, fontWeight:700, color:active?col:T.txt }}>{meta.label}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:T.txM }}>{meta.desc}</div>
                    {bests[key] && <div style={{ fontSize:10, color:col, fontWeight:700, marginTop:1 }}>Best {fmtTime(bests[key])}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent color */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:T.txM, marginBottom:11 }}>Theme Color</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            {ACCENTS.map((ac) => {
              const active = aid === ac.id;
              const col = dark ? ac.d : ac.l;
              return (
                <button key={ac.id} onClick={() => setAid(ac.id)} title={ac.name} style={{ width:44, height:44, borderRadius:13, background:active?`${col}22`:T.sur, border:`2px solid ${active?col:T.bor}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, transition:"all 0.2s" }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", background:col, boxShadow:active?`0 0 12px ${col}`:"none", transition:"all 0.2s" }} />
                  <span style={{ fontSize:8, color:active?col:T.txM, fontWeight:700 }}>{ac.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Play button */}
        <button onClick={() => onStart(diff)}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{ width:"100%", padding:"18px", borderRadius:18, background:`linear-gradient(135deg,${T.acc},${T.acc}CC)`, border:"none", cursor:"pointer", color:"#fff", fontSize:17, fontWeight:800, letterSpacing:"-0.01em", boxShadow:`0 8px 32px ${T.acc}44,inset 0 1px 0 rgba(255,255,255,0.2)`, transition:"transform 0.15s,box-shadow 0.15s" }}>
          Play {DIFFS[diff].label} →
        </button>

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:16, justifyContent:"center" }}>
          {["Unlimited Undo","Pencil Notes","3 Hints","Conflict Check","5 Difficulties"].map((f) => (
            <div key={f} style={{ background:T.sur, border:`1px solid ${T.bor}`, borderRadius:100, padding:"5px 12px", fontSize:11, fontWeight:600, color:T.txM }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  GAME SCREEN
// ═══════════════════════════════════════════════════════════
function GameScreen({ T, diff, board, given, notes, solution, sel, setSel, time, showClock, mistakes, hintsUsed, noteMode, setNoteMode, hist, hlSame, showErr, flashSet, doneRows, doneCols, doneBoxes, dLeft, filled, onInput, onUndo, onHint, onBack, onSettings, paused, onPause }) {
  return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100vw", height:260, background:`radial-gradient(ellipse 70% 40% at 50% -5%,${T.acc}18 0%,transparent 70%)`, pointerEvents:"none", transition:"all 0.3s" }} />

      {paused && (
        <div style={{ position:"fixed", inset:0, background:T.dark?"rgba(8,8,15,0.92)":"rgba(243,243,238,0.93)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)", zIndex:100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
          <div style={{ fontSize:64, lineHeight:1 }}>⏸</div>
          <div style={{ fontSize:24, fontWeight:800 }}>Paused</div>
          <button onClick={onPause} style={{ background:T.acc, border:"none", borderRadius:16, padding:"14px 44px", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer" }}>Resume →</button>
        </div>
      )}

      <div style={{ width:"100%", maxWidth:430, zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
        {/* Top bar */}
        <div style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 8px" }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:T.txM, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", gap:3, padding:"6px 0" }}>
            <span style={{ fontSize:20 }}>‹</span> Home
          </button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:700, letterSpacing:"-0.5px", fontVariantNumeric:"tabular-nums", lineHeight:1 }}>{showClock ? time : "—:——"}</div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:T.acc, marginTop:2 }}>{DIFFS[diff]?.label}</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {mistakes > 0 && <span style={{ fontSize:12, color:T.red, fontWeight:800 }}>✕{mistakes}</span>}
            <button onClick={onSettings} style={{ width:36, height:36, background:T.sur, border:`1px solid ${T.bor}`, borderRadius:11, color:T.txM, fontSize:19, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⋯</button>
          </div>
        </div>

        {/* Grid */}
        <Grid T={T} board={board} given={given} notes={notes} solution={solution}
          sel={sel} setSel={setSel} hlSame={hlSame} showErr={showErr}
          flashSet={flashSet} doneRows={doneRows} doneCols={doneCols} doneBoxes={doneBoxes}
        />

        {/* Progress bar */}
        <div style={{ width:"calc(100% - 32px)", display:"flex", alignItems:"center", gap:10, margin:"5px 0 0" }}>
          <div style={{ flex:1, height:3, background:T.sur, borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(filled/81)*100}%`, background:`linear-gradient(90deg,${T.acc},${T.acc}99)`, borderRadius:3, transition:"width 0.35s ease" }} />
          </div>
          <span style={{ fontSize:11, color:T.txM, fontWeight:700, minWidth:26, textAlign:"right" }}>{Math.round((filled/81)*100)}%</span>
        </div>

        {/* Action bar */}
        <div style={{ display:"flex", gap:9, width:"calc(100% - 32px)", margin:"11px 0 8px" }}>
          {[
            { icon:"↩", label:"Undo",   fn:onUndo,           dis:!hist.length },
            { icon:"⌫", label:"Erase",  fn:()=>onInput(0),   dis:!sel||!board||(given&&sel&&given[sel[0]][sel[1]]) },
            { icon:"✎", label:"Notes",  fn:()=>setNoteMode(m=>!m), act:noteMode },
            { icon:"◈", label:`${3-hintsUsed} Hints`, fn:onHint, dis:hintsUsed>=3, acc:true },
          ].map(({ icon, label, fn, dis, act, acc }) => (
            <button key={label} onClick={fn} disabled={dis} style={{ flex:1, background:act?T.aD:acc?`${T.acc}12`:T.sur, border:`1.5px solid ${act?T.aB:acc?T.aM:T.bor}`, borderRadius:14, padding:"10px 0 8px", cursor:dis?"default":"pointer", opacity:dis?0.25:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, transition:"all 0.15s", color:act||acc?T.acc:T.txt }}>
              <span style={{ fontSize:19, lineHeight:1 }}>{icon}</span>
              <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.04em", color:T.txM }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Number pad */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(9,1fr)", gap:5, width:"calc(100% - 32px)", paddingBottom:32 }}>
          {[1,2,3,4,5,6,7,8,9].map((n) => {
            const done = dLeft[n] <= 0 && !noteMode;
            return (
              <button key={n} onClick={() => onInput(n)} disabled={done}
                onMouseDown={(e) => !done && (e.currentTarget.style.transform="scale(0.9)")}
                onMouseUp={(e) => (e.currentTarget.style.transform="scale(1)")}
                onTouchStart={(e) => !done && (e.currentTarget.style.transform="scale(0.9)")}
                onTouchEnd={(e) => (e.currentTarget.style.transform="scale(1)")}
                style={{ background:noteMode?T.aD:T.sur, border:`1.5px solid ${noteMode?T.aM:T.bor}`, borderRadius:13, padding:"12px 0 9px", cursor:done?"default":"pointer", opacity:done?0.16:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, transition:"transform 0.1s", color:T.txt }}>
                <span style={{ fontSize:"clamp(17px,4.5vw,21px)", fontWeight:600, lineHeight:1 }}>{n}</span>
                <span style={{ fontSize:9, color:T.txM, fontWeight:700 }}>{done?"✓":dLeft[n]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUDOKU GRID
// ═══════════════════════════════════════════════════════════
function Grid({ T, board, given, notes, solution, sel, setSel, hlSame, showErr, flashSet, doneRows, doneCols, doneBoxes }) {
  const sv = sel ? board[sel[0]][sel[1]] : 0;

  const cellBg = (r, c) => {
    const isSel = sel && sel[0]===r && sel[1]===c;
    const v = board[r][c];
    if (isSel) return T.cSel;
    if (showErr && isConflict(board, r, c)) return T.cCon;
    if (sel) {
      const [sr, sc] = sel;
      const sameBox = Math.floor(r/3)===Math.floor(sr/3) && Math.floor(c/3)===Math.floor(sc/3);
      if (hlSame && sv && v===sv) return T.cSam;
      if (r===sr || c===sc || sameBox) return T.cRel;
    }
    // Row/col/box completion glow
    const bk = `${Math.floor(r/3)}${Math.floor(c/3)}`;
    if (doneRows.has(r) || doneCols.has(c) || doneBoxes.has(bk)) return T.aD;
    return "transparent";
  };

  const cellColor = (r, c) => {
    const v = board[r][c];
    if (!v) return T.txt;
    if (showErr && isConflict(board, r, c)) return T.red;
    if (given[r][c]) return T.gClr;
    return v === solution[r][c] ? T.pClr : T.eClr;
  };

  return (
    <div style={{ width:"100%", padding:"5px 16px 2px" }}>
      <div style={{ border:`2px solid ${T.borS}`, borderRadius:16, overflow:"hidden", boxShadow:T.dark?"0 8px 48px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.04)":"0 4px 28px rgba(0,0,0,0.1)", display:"grid", gridTemplateColumns:"repeat(9,1fr)", aspectRatio:"1", background:T.dark?T.bgC:"#FFFFFF" }}>
        {Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => {
            const v = board[r][c];
            const cn = notes[r][c];
            const bg = cellBg(r, c);
            const col = cellColor(r, c);
            const isG = given[r][c];
            const isFlash = flashSet.has(`${r}-${c}`);
            const rB = c===8 ? "none" : (c+1)%3===0 ? `1.5px solid ${T.borS}` : `1px solid ${T.bor}`;
            const bB = r===8 ? "none" : (r+1)%3===0 ? `1.5px solid ${T.borS}` : `1px solid ${T.bor}`;
            return (
              <div key={`${r}-${c}`} onClick={() => setSel([r, c])} style={{ aspectRatio:"1", background:bg, borderRight:rB, borderBottom:bB, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", transition:"background 0.12s", animation:isFlash?"pop 0.38s ease":"none" }}>
                {v !== 0 ? (
                  <span style={{ fontSize:"clamp(13px,4vw,19px)", fontWeight:isG?700:500, color:col, lineHeight:1, transition:"color 0.15s" }}>{v}</span>
                ) : cn.size > 0 ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", width:"88%", height:"88%" }}>
                    {[1,2,3,4,5,6,7,8,9].map((n) => (
                      <span key={n} style={{ fontSize:"clamp(5px,1vw,7px)", color:cn.has(n)?T.acc:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, lineHeight:1 }}>{n}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  WIN SCREEN
// ═══════════════════════════════════════════════════════════
function WinScreen({ T, winData, lv, xp, onReplay, onHome, onNext }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);
  const { time, mistakes, hints, diff, xpE } = winData;
  const dc = T.dark ? DIFFS[diff]?.dColor : DIFFS[diff]?.color;
  const stars = mistakes===0?3:mistakes<=3?2:1;
  const rank = getRank(lv);
  const confColors = [T.acc, T.grn, T.yel, T.red, T.dark?"#BF5AF2":"#AF52DE"];

  return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px", textAlign:"center", opacity:mounted?1:0, transform:mounted?"scale(1)":"scale(0.9)", transition:"all 0.55s cubic-bezier(0.34,1.56,0.64,1)", overflowX:"hidden" }}>
      <div style={{ position:"fixed", inset:0, background:`radial-gradient(ellipse 70% 55% at 50% 20%,${dc}18 0%,transparent 70%)`, pointerEvents:"none" }} />
      {Array.from({length:14},(_,i)=>(
        <div key={i} style={{ position:"fixed", top:`${5+Math.random()*15}%`, left:`${5+i*6.5}%`, width:7, height:7, borderRadius:"50%", background:confColors[i%confColors.length], animation:`confetti ${1.1+i*0.14}s ${i*0.08}s ease-in forwards`, opacity:mounted?1:0, zIndex:0 }} />
      ))}
      <div style={{ zIndex:1, width:"100%", maxWidth:360, animation:"winBounce 0.58s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
        <div style={{ fontSize:70, lineHeight:1, marginBottom:6 }}>🎉</div>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:dc, marginBottom:8 }}>{DIFFS[diff]?.label} Complete</div>
        <h1 style={{ fontSize:50, fontWeight:800, letterSpacing:"-0.04em", margin:"0 0 10px" }}>Solved!</h1>
        <div style={{ fontSize:32, letterSpacing:8, marginBottom:24 }}>{["","⭐","⭐⭐","⭐⭐⭐"][stars]}</div>
        <div style={{ background:`${dc}18`, border:`1px solid ${dc}40`, borderRadius:14, padding:"10px 22px", marginBottom:22, display:"inline-block" }}>
          <span style={{ fontSize:16, fontWeight:800, color:dc }}>+{xpE} XP earned</span>
          <span style={{ fontSize:12, color:T.txM, marginLeft:8 }}>{rank} · Lv.{lv}</span>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:30 }}>
          {[{label:"Time",val:time,icon:"⏱"},{label:"Mistakes",val:mistakes,icon:"✕"},{label:"Hints",val:hints,icon:"◈"}].map(({label,val,icon})=>(
            <div key={label} style={{ flex:1, background:T.bgC, border:`1px solid ${T.bor}`, borderRadius:16, padding:"16px 8px" }}>
              <div style={{ fontSize:13, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em" }}>{val}</div>
              <div style={{ fontSize:10, color:T.txM, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={onNext} style={{ padding:"17px", borderRadius:16, background:`linear-gradient(135deg,${T.acc},${T.acc}BB)`, border:"none", cursor:"pointer", color:"#fff", fontSize:16, fontWeight:800, boxShadow:`0 6px 28px ${T.acc}44`, fontFamily:"inherit" }}>Next Difficulty →</button>
          <button onClick={onReplay} style={{ padding:"16px", borderRadius:16, background:T.sur, border:`1px solid ${T.bor}`, cursor:"pointer", color:T.txt, fontSize:15, fontWeight:600, fontFamily:"inherit" }}>Play Again</button>
          <button onClick={onHome} style={{ padding:"13px", borderRadius:16, background:"none", border:"none", cursor:"pointer", color:T.txM, fontSize:15, fontWeight:600, fontFamily:"inherit" }}>Home</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SETTINGS SHEET
// ═══════════════════════════════════════════════════════════
function SettingsSheet({ T, dark, setDark, aid, setAid, hlSame, setHlSame, showErr, setShowErr, autoRm, setAutoRm, showClock, setShowClock, paused, onPause, onNewGame, onClose }) {
  const Tog = ({ val, set }) => (
    <button onClick={() => set((v) => !v)} style={{ width:50, height:29, borderRadius:15, border:"none", cursor:"pointer", background:val?T.acc:T.dark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.15)", position:"relative", flexShrink:0, marginLeft:16, transition:"background 0.22s" }}>
      <div style={{ width:23, height:23, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:val?24:3, transition:"left 0.22s cubic-bezier(0.34,1.2,0.64,1)", boxShadow:"0 1px 6px rgba(0,0,0,0.28)" }} />
    </button>
  );
  const toggles = [
    { label:"Highlight Same Numbers", desc:"Show all matching digits", val:hlSame, set:setHlSame },
    { label:"Show Conflicts", desc:"Mark invalid placements in red", val:showErr, set:setShowErr },
    { label:"Auto-Remove Notes", desc:"Clear pencil marks when filling", val:autoRm, set:setAutoRm },
    { label:"Show Timer", desc:"Display elapsed time", val:showClock, set:setShowClock },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", zIndex:200, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:T.dark?"#1A1A28":"#F6F6F2", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430, margin:"0 auto", padding:"12px 20px 46px", boxShadow:"0 -8px 48px rgba(0,0,0,0.35)", animation:"fadeUp 0.3s ease" }}>
        <div style={{ width:36, height:4, background:"rgba(128,128,128,0.28)", borderRadius:2, margin:"0 auto 20px" }} />
        <h2 style={{ margin:"0 0 18px", fontSize:20, fontWeight:800 }}>Settings</h2>

        <div style={{ fontSize:11, fontWeight:700, color:T.txM, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Appearance</div>
        <div style={{ display:"flex", gap:9, marginBottom:12 }}>
          {[{label:"Dark",icon:"◑",v:true},{label:"Light",icon:"☀",v:false}].map((o) => (
            <button key={o.label} onClick={() => setDark(o.v)} style={{ flex:1, background:dark===o.v?T.aD:T.sur, border:`1.5px solid ${dark===o.v?T.aB:T.bor}`, borderRadius:12, padding:"10px", color:dark===o.v?T.acc:T.txM, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontFamily:"inherit" }}>
              {o.icon} {o.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }}>
          {ACCENTS.map((ac) => {
            const active = aid === ac.id;
            const col = dark ? ac.d : ac.l;
            return (
              <button key={ac.id} onClick={() => setAid(ac.id)} title={ac.name} style={{ width:40, height:40, borderRadius:11, background:active?`${col}22`:T.sur, border:`2px solid ${active?col:T.bor}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:col, boxShadow:active?`0 0 10px ${col}`:"none", transition:"all 0.2s" }} />
              </button>
            );
          })}
        </div>

        <div style={{ fontSize:11, fontWeight:700, color:T.txM, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Gameplay</div>
        {toggles.map(({ label, desc, val, set }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${T.bor}` }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{label}</div>
              <div style={{ fontSize:11, color:T.txM, marginTop:1 }}>{desc}</div>
            </div>
            <Tog val={val} set={set} />
          </div>
        ))}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={() => { onPause(); onClose(); }} style={{ flex:1, padding:14, borderRadius:14, background:T.sur, border:`1px solid ${T.bor}`, color:T.txt, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button onClick={onNewGame} style={{ flex:1, padding:14, borderRadius:14, background:`${T.red}18`, border:`1px solid ${T.red}30`, color:T.red, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  STATS SHEET
// ═══════════════════════════════════════════════════════════
function StatsSheet({ T, lv, xp, streak, solves, bests, solvHist, unlocked, onClose }) {
  const rank = getRank(lv);
  const lvPct = ((xp % XPL) / XPL) * 100;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", zIndex:200, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:T.dark?"#1A1A28":"#F6F6F2", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430, margin:"0 auto", padding:"12px 20px 52px", boxShadow:"0 -8px 48px rgba(0,0,0,0.35)", maxHeight:"85vh", overflowY:"auto", animation:"fadeUp 0.3s ease" }}>
        <div style={{ width:36, height:4, background:"rgba(128,128,128,0.28)", borderRadius:2, margin:"0 auto 20px" }} />
        <h2 style={{ margin:"0 0 18px", fontSize:20, fontWeight:800 }}>Your Stats</h2>

        {/* Profile row */}
        <div style={{ background:T.sur, borderRadius:16, padding:"16px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:T.aD, border:`1.5px solid ${T.aB}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>⬡</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:800 }}>{rank}</div>
            <div style={{ fontSize:12, color:T.txM, marginBottom:6 }}>Level {lv} · {xp.toLocaleString()} XP</div>
            <div style={{ height:5, background:T.dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${lvPct}%`, background:T.acc, borderRadius:3 }} />
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {[{icon:"✓",v:solves,l:"Total Solved"},{icon:"🔥",v:streak,l:"Streak"},{icon:"◈",v:unlocked.size,l:"Achievements"},{icon:"⬡",v:lv,l:"Level"}].map((s) => (
            <div key={s.l} style={{ background:T.sur, borderRadius:14, padding:"14px 16px" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:800 }}>{s.v}</div>
              <div style={{ fontSize:11, color:T.txM, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Best times */}
        {Object.keys(bests).length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.txM, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Personal Bests</div>
            {Object.entries(bests).map(([d, t]) => {
              const col = T.dark ? DIFFS[d]?.dColor : DIFFS[d]?.color;
              return (
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${T.bor}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:"50%", background:col }} /><span style={{ fontSize:14, fontWeight:700, color:col }}>{DIFFS[d]?.label}</span></div>
                  <span style={{ fontSize:14, fontWeight:800, fontVariantNumeric:"tabular-nums" }}>{fmtTime(t)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.txM, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>
            Achievements ({unlocked.size}/{ACHS.length})
          </div>
          {ACHS.map((a) => {
            const got = unlocked.has(a.id);
            const rc = R_COLORS[a.r];
            return (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:got?`${rc}10`:T.sur, border:`1px solid ${got?rc+"30":T.bor}`, borderRadius:12, marginBottom:6, opacity:got?1:0.4 }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{a.title}</div>
                  <div style={{ fontSize:11, color:T.txM }}>{a.desc}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontWeight:800, color:rc, textTransform:"capitalize" }}>{a.r}</div>
                  <div style={{ fontSize:10, color:T.txM }}>+{a.xp} XP</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent solves */}
        {solvHist.length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:T.txM, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Recent Solves</div>
            {solvHist.slice(0, 6).map((s, i) => {
              const col = T.dark ? DIFFS[s.diff]?.dColor : DIFFS[s.diff]?.color;
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.bor}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:"50%", background:col }} /><span style={{ fontSize:13, fontWeight:600 }}>{DIFFS[s.diff]?.label}</span></div>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:12, fontVariantNumeric:"tabular-nums", fontWeight:700 }}>{s.time}</span>
                    <span style={{ fontSize:12, color:T.acc, fontWeight:800 }}>+{s.xp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ACHIEVEMENT TOAST
// ═══════════════════════════════════════════════════════════
function Toast({ t, T }) {
  const [out, setOut] = useState(false);
  useEffect(() => { setTimeout(() => setOut(true), 2900); }, []);
  const rc = R_COLORS[t.r] || T.acc;
  return (
    <div style={{ background:T.dark?"rgba(20,20,34,0.97)":"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:`1px solid ${rc}40`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:`0 8px 32px rgba(0,0,0,0.32),0 0 0 1px ${rc}20`, pointerEvents:"auto", animation:`${out?"toastOut 0.35s ease forwards":"toastIn 0.42s cubic-bezier(0.34,1.3,0.64,1)"}` }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`${rc}22`, border:`1px solid ${rc}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{t.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:10, fontWeight:800, color:rc, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>Achievement · {t.r}</div>
        <div style={{ fontSize:14, fontWeight:800, color:T.txt, lineHeight:1.2 }}>{t.title}</div>
        <div style={{ fontSize:11, color:T.txM }}>{t.desc}</div>
      </div>
      <div style={{ fontSize:12, fontWeight:800, color:rc, background:`${rc}18`, borderRadius:8, padding:"4px 8px", flexShrink:0 }}>+{t.xp}</div>
    </div>
  );
}
