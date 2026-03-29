import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePersistedApp } from '../context/AppPersistProvider';
import { playSfx } from '../audio/sfx';
import {
  safeImpactLight,
  safeImpactMedium,
  safeNotificationError,
  safeSelectionAsync,
} from '../utils/haptics';
import {
  autoRemoveNotesFromPlacement,
  cloneBoard,
  cloneNotes,
  emptyNotes,
  fillAllCandidateNotes,
  findContradiction,
  generatePuzzle,
  getCandidates,
  isConflict,
  isLegalCandidate,
  toggleNote,
} from '../game/engine';
import type { Board, Difficulty, NotesGrid } from '../game/types';
import type { GameBranchSnapshotV1, ResumeStateV1 } from '../persistence/schema';

export type CellSelection = readonly [number, number];

export type GameBranchData = {
  name: string;
  isMain: boolean;
  branchBoard: Board;
  branchNotes: NotesGrid;
};

type HistoryEntry = { board: Board; notes: NotesGrid };

function buildGiven(puzzle: Board): boolean[][] {
  return puzzle.map((row) => row.map((v) => v !== 0));
}

function keyForCell(r: number, c: number): string {
  return `${r}-${c}`;
}

function snapshotToBranch(s: GameBranchSnapshotV1): GameBranchData {
  return {
    name: s.name,
    isMain: s.isMain,
    branchBoard: cloneBoard(s.board),
    branchNotes: cloneNotes(s.notes),
  };
}

function branchToSnapshot(b: GameBranchData): GameBranchSnapshotV1 {
  return {
    name: b.name,
    isMain: b.isMain,
    board: cloneBoard(b.branchBoard),
    notes: cloneNotes(b.branchNotes),
  };
}

function mainBranchFrom(board: Board, notes: NotesGrid): GameBranchData {
  return {
    name: 'Main',
    isMain: true,
    branchBoard: cloneBoard(board),
    branchNotes: cloneNotes(notes),
  };
}

export type GameSessionOptions = {
  onFlowEnter?: () => void;
  onBranchCreated?: () => void;
};

export function useGameSession(opts: GameSessionOptions = {}) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const { replaceResume, bumpGamesStarted } = usePersistedApp();

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzle, setPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [given, setGiven] = useState<boolean[][] | null>(null);
  const [branches, setBranches] = useState<GameBranchData[] | null>(null);
  const [activeBranchIdx, setActiveBranchIdx] = useState(0);
  const activeBranchIdxRef = useRef(0);
  activeBranchIdxRef.current = activeBranchIdx;

  const [selection, setSelection] = useState<CellSelection | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [noteMode, setNoteMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [flashSet, setFlashSet] = useState(() => new Set<string>());
  const [doneRows, setDoneRows] = useState(() => new Set<number>());
  const [doneCols, setDoneCols] = useState(() => new Set<number>());
  const [doneBoxes, setDoneBoxes] = useState(() => new Set<string>());
  const [showBranchesDrawer, setShowBranchesDrawer] = useState(false);

  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [flowState, setFlowState] = useState(false);
  const [flowSecondsLeft, setFlowSecondsLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  runningRef.current = running;

  const board = branches?.[activeBranchIdx]?.branchBoard ?? null;
  const notes = branches?.[activeBranchIdx]?.branchNotes ?? null;

  const activeBranch = branches?.[activeBranchIdx] ?? null;
  const isOnHypothesisBranch = activeBranch != null && !activeBranch.isMain;

  const contradiction = useMemo(() => (board ? findContradiction(board) : null), [board]);

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      if (s !== 'active' && runningRef.current) setPaused(true);
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!flowState || !running || paused) return;
    const id = setInterval(() => {
      setFlowSecondsLeft((s) => {
        if (s <= 1) {
          setFlowState(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [flowState, running, paused]);

  const clearResumeTimer = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
  };

  const buildResumePayload = useCallback(
    (
      nextBranches: GameBranchData[],
      nextActiveIdx: number,
      nextHistory: HistoryEntry[],
      nextNoteMode: boolean,
      nextMistakes: number,
      nextHints: number,
      nextTime: number,
      nextShowDrawer: boolean,
      nextConsecutive: number,
      nextFlow: boolean,
      nextFlowSec: number,
    ): ResumeStateV1 => {
      if (!puzzle || !solution || !given) {
        throw new Error('buildResumePayload: missing puzzle');
      }
      const active = nextBranches[nextActiveIdx]!;
      return {
        diff: difficulty,
        puzzle: cloneBoard(puzzle),
        solution: cloneBoard(solution),
        given: given.map((row) => [...row]),
        board: cloneBoard(active.branchBoard),
        notes: cloneNotes(active.branchNotes),
        mistakes: nextMistakes,
        hintsUsed: nextHints,
        timeSeconds: nextTime,
        history: nextHistory.map((h) => ({
          board: cloneBoard(h.board),
          notes: cloneNotes(h.notes),
        })),
        noteMode: nextNoteMode,
        branches: nextBranches.length > 1 ? nextBranches.map(branchToSnapshot) : undefined,
        activeBranch: nextActiveIdx,
        showBranches: nextShowDrawer,
        consecutiveCorrect: nextConsecutive,
        flowState: nextFlow,
        flowSecondsLeft: nextFlowSec,
      };
    },
    [difficulty, given, puzzle, solution],
  );

  const scheduleResumeSaveFull = useCallback(
    (payload: ResumeStateV1) => {
      clearResumeTimer();
      resumeTimerRef.current = setTimeout(() => {
        replaceResume(payload);
      }, 400);
    },
    [replaceResume],
  );

  useEffect(() => {
    if (!running || paused || !board) return;
    timerRef.current = setInterval(() => setTimeSeconds((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [board, paused, running]);

  const checkComplete = useCallback((nb: Board) => {
    setDoneRows((prev) => {
      const nr = new Set(prev);
      for (let r = 0; r < 9; r++) {
        if (!nr.has(r) && nb[r]!.every((v) => v !== 0) && new Set(nb[r]).size === 9) {
          nr.add(r);
        }
      }
      return nr;
    });
    setDoneCols((prev) => {
      const nc = new Set(prev);
      for (let c = 0; c < 9; c++) {
        const col = nb.map((row) => row[c]!);
        if (!nc.has(c) && col.every((v) => v !== 0) && new Set(col).size === 9) {
          nc.add(c);
        }
      }
      return nc;
    });
    setDoneBoxes((prev) => {
      const nb2 = new Set(prev);
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
          const k = `${br}${bc}`;
          if (!nb2.has(k)) {
            const vals: number[] = [];
            for (let x = br * 3; x < br * 3 + 3; x++)
              for (let y = bc * 3; y < bc * 3 + 3; y++) vals.push(nb[x]![y]!);
            if (vals.every((v) => v !== 0) && new Set(vals).size === 9) nb2.add(k);
          }
        }
      }
      return nb2;
    });
  }, []);

  const startNewGame = useCallback(
    (diff: Difficulty) => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
      replaceResume(null);
      let p: Board;
      let s: Board;
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const g = generatePuzzle(diff);
          p = g.puzzle;
          s = g.solution;
          break;
        } catch {
          if (attempt === 7) throw new Error('Could not generate puzzle');
        }
      }
      setPuzzle(p!);
      setSolution(s!);
      setGiven(buildGiven(p!));
      setBranches([mainBranchFrom(p!, emptyNotes())]);
      setActiveBranchIdx(0);
      setSelection(null);
      setHistory([]);
      setNoteMode(false);
      setMistakes(0);
      setHintsUsed(0);
      setTimeSeconds(0);
      setRunning(true);
      setPaused(false);
      setDifficulty(diff);
      setFlashSet(new Set());
      setDoneRows(new Set());
      setDoneCols(new Set());
      setDoneBoxes(new Set());
      setShowBranchesDrawer(false);
      setConsecutiveCorrect(0);
      setFlowState(false);
      setFlowSecondsLeft(0);
      bumpGamesStarted();
    },
    [bumpGamesStarted, replaceResume],
  );

  const continueFromResume = useCallback((r: ResumeStateV1) => {
    clearResumeTimer();
    setDifficulty(r.diff);
    setPuzzle(cloneBoard(r.puzzle));
    setSolution(cloneBoard(r.solution));
    setGiven(r.given.map((row) => [...row]));
    if (r.branches?.length) {
      setBranches(r.branches.map(snapshotToBranch));
      setActiveBranchIdx(
        r.activeBranch != null && r.activeBranch >= 0 && r.activeBranch < r.branches.length
          ? r.activeBranch
          : 0,
      );
    } else {
      setBranches([mainBranchFrom(r.board, r.notes)]);
      setActiveBranchIdx(0);
    }
    setSelection(null);
    setHistory(r.history.map((h) => ({ board: cloneBoard(h.board), notes: cloneNotes(h.notes) })));
    setNoteMode(r.noteMode);
    setMistakes(r.mistakes);
    setHintsUsed(r.hintsUsed);
    setTimeSeconds(r.timeSeconds);
    setRunning(true);
    setPaused(false);
    setFlashSet(new Set());
    setDoneRows(new Set());
    setDoneCols(new Set());
    setDoneBoxes(new Set());
    setShowBranchesDrawer(r.showBranches ?? false);
    setConsecutiveCorrect(r.consecutiveCorrect ?? 0);
    setFlowState(r.flowState ?? false);
    setFlowSecondsLeft(r.flowSecondsLeft ?? 0);
  }, []);

  const patchActiveBranch = useCallback(
    (fn: (b: GameBranchData) => GameBranchData) => {
      setBranches((prev) => {
        if (!prev) return prev;
        const idx = activeBranchIdxRef.current;
        const next = [...prev];
        next[idx] = fn(next[idx]!);
        return next;
      });
    },
    [],
  );

  const exitToMenu = useCallback(() => {
    if (puzzle && solution && given && branches) {
      scheduleResumeSaveFull(
        buildResumePayload(
          branches,
          activeBranchIdx,
          history,
          noteMode,
          mistakes,
          hintsUsed,
          timeSeconds,
          showBranchesDrawer,
          consecutiveCorrect,
          flowState,
          flowSecondsLeft,
        ),
      );
    }
    clearResumeTimer();
    setRunning(false);
    setPuzzle(null);
    setSolution(null);
    setGiven(null);
    setBranches(null);
    setActiveBranchIdx(0);
    setSelection(null);
    setHistory([]);
  }, [
    activeBranchIdx,
    branches,
    buildResumePayload,
    consecutiveCorrect,
    flowSecondsLeft,
    flowState,
    given,
    hintsUsed,
    history,
    mistakes,
    noteMode,
    puzzle,
    scheduleResumeSaveFull,
    showBranchesDrawer,
    solution,
    timeSeconds,
  ]);

  const inputDigit = useCallback(
    (
      num: number,
      opts: {
        puzzle: Board;
        solution: Board;
        given: boolean[][];
        autoRm: boolean;
        blockBad: boolean;
        onSolved: (meta?: {
          mistakes?: number;
          hintsUsed?: number;
          flowBonus?: boolean;
        }) => void;
        onNoteWarn?: (message: string) => void;
      },
    ) => {
      if (!selection || !board || !notes || !branches) return;
      const [r, c] = selection;
      if (opts.given[r]![c]) return;

      if (noteMode && num !== 0) {
        if (!isLegalCandidate(board, r, c, num)) {
          let reason = 'that unit';
          for (let i = 0; i < 9; i++) {
            if (board[r]![i] === num && i !== c) {
              reason = `row ${r + 1}`;
              break;
            }
            if (board[i]![c] === num && i !== r) {
              reason = `column ${c + 1}`;
              break;
            }
          }
          opts.onNoteWarn?.(`${num} is not valid — clash in ${reason}`);
          if (opts.blockBad) return;
        }

        const histEntry = { board: cloneBoard(board), notes: cloneNotes(notes) };
        const nextHist = [...history.slice(-99), histEntry];
        setHistory(nextHist);
        const nn = cloneNotes(notes);
        nn[r]![c] = toggleNote(nn[r]![c]!, num);
        patchActiveBranch((br) => ({
          ...br,
          branchNotes: nn,
        }));
        void safeSelectionAsync();
        playSfx('tap');
        scheduleResumeSaveFull(
          buildResumePayload(
            branches.map((b, i) =>
              i === activeBranchIdx ? { ...b, branchNotes: nn } : b,
            ),
            activeBranchIdx,
            nextHist,
            noteMode,
            mistakes,
            hintsUsed,
            timeSeconds,
            showBranchesDrawer,
            consecutiveCorrect,
            flowState,
            flowSecondsLeft,
          ),
        );
        return;
      }

      const histBefore = { board: cloneBoard(board), notes: cloneNotes(notes) };
      const nextHistAfterMove = [...history.slice(-99), histBefore];
      setHistory(nextHistAfterMove);
      const nb = cloneBoard(board);
      nb[r]![c] = num;
      let nn = cloneNotes(notes);
      if (num !== 0 && opts.autoRm) {
        nn = autoRemoveNotesFromPlacement(nn, r, c, num);
      }
      if (num !== 0) nn[r]![c] = 0;

      const willSolve =
        nb.every((row) => row.every((v) => v !== 0)) &&
        nb.every((row, ri) => row.every((v, ci) => v === opts.solution[ri]![ci]));

      let nextMistakes = mistakes;
      let nextConsecutive = consecutiveCorrect;
      let nextFlow = flowState;
      let nextFlowSec = flowSecondsLeft;

      if (num !== 0 && num !== opts.solution[r]![c]) {
        nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        void safeNotificationError();
        playSfx('error');
        nextConsecutive = 0;
        nextFlow = false;
        nextFlowSec = 0;
        setConsecutiveCorrect(0);
        setFlowState(false);
        setFlowSecondsLeft(0);
      } else if (num !== 0 && num === opts.solution[r]![c]) {
        const k = keyForCell(r, c);
        setFlashSet((p) => new Set([...p, k]));
        setTimeout(() => {
          setFlashSet((p) => {
            const s = new Set(p);
            s.delete(k);
            return s;
          });
        }, 420);
        checkComplete(nb);
        void safeImpactLight();
        if (!willSolve) playSfx('place');
        nextConsecutive = consecutiveCorrect + 1;
        setConsecutiveCorrect(nextConsecutive);
        if (nextConsecutive >= 5 && !flowState) {
          nextFlow = true;
          nextFlowSec = 60;
          setFlowState(true);
          setFlowSecondsLeft(60);
          optsRef.current.onFlowEnter?.();
        }
      }

      const branchesAfter = branches.map((b, i) =>
        i === activeBranchIdx ? { ...b, branchBoard: nb, branchNotes: nn } : b,
      );
      setBranches(branchesAfter);

      if (willSolve) {
        setRunning(false);
        clearResumeTimer();
        replaceResume(null);
        opts.onSolved({
          mistakes: nextMistakes,
          hintsUsed,
          flowBonus: nextFlow,
        });
        return;
      }

      scheduleResumeSaveFull(
        buildResumePayload(
          branchesAfter,
          activeBranchIdx,
          nextHistAfterMove,
          noteMode,
          nextMistakes,
          hintsUsed,
          timeSeconds,
          showBranchesDrawer,
          nextConsecutive,
          nextFlow,
          nextFlowSec,
        ),
      );
    },
    [
      activeBranchIdx,
      board,
      branches,
      buildResumePayload,
      checkComplete,
      consecutiveCorrect,
      flowSecondsLeft,
      flowState,
      history,
      hintsUsed,
      mistakes,
      noteMode,
      notes,
      patchActiveBranch,
      replaceResume,
      scheduleResumeSaveFull,
      selection,
      showBranchesDrawer,
      timeSeconds,
    ],
  );

  const resetFlowFromUndo = useCallback(() => {
    setConsecutiveCorrect(0);
    setFlowState(false);
    setFlowSecondsLeft(0);
  }, []);

  const undo = useCallback(
    (_ctx: { puzzle: Board; solution: Board; given: boolean[][] }) => {
      if (!history.length || !branches) return;
      resetFlowFromUndo();
      const last = history[history.length - 1]!;
      const rest = history.slice(0, -1);
      const nextBranches = branches.map((b, i) =>
        i === activeBranchIdx ? { ...b, branchBoard: last.board, branchNotes: last.notes } : b,
      );
      setBranches(nextBranches);
      setHistory(rest);
      scheduleResumeSaveFull(
        buildResumePayload(
          nextBranches,
          activeBranchIdx,
          rest,
          noteMode,
          mistakes,
          hintsUsed,
          timeSeconds,
          showBranchesDrawer,
          0,
          false,
          0,
        ),
      );
    },
    [
      activeBranchIdx,
      branches,
      buildResumePayload,
      history,
      mistakes,
      noteMode,
      hintsUsed,
      resetFlowFromUndo,
      scheduleResumeSaveFull,
      showBranchesDrawer,
      timeSeconds,
    ],
  );

  const applyHint = useCallback(
    (opts: {
      puzzle: Board;
      solution: Board;
      given: boolean[][];
      onSolved: (meta?: {
        mistakes?: number;
        hintsUsed?: number;
        flowBonus?: boolean;
      }) => void;
    }) => {
      if (hintsUsed >= 3 || !selection || !board || !notes || !branches) return;
      const [r, c] = selection;
      if (opts.given[r]![c] || board[r]![c] !== 0) return;

      const histBeforeHint = { board: cloneBoard(board), notes: cloneNotes(notes) };
      const nextHistHint = [...history.slice(-99), histBeforeHint];
      setHistory(nextHistHint);
      const nb = cloneBoard(board);
      const hintVal = opts.solution[r]![c];
      if (hintVal == null || hintVal === 0) return;
      nb[r]![c] = hintVal;
      const nn = cloneNotes(notes);
      nn[r]![c] = 0;

      const solvedHint =
        nb.every((row) => row.every((v) => v !== 0)) &&
        nb.every((row, ri) => row.every((v, ci) => v === opts.solution[ri]![ci]));

      let nextConsecutive = consecutiveCorrect + 1;
      let nextFlow = flowState;
      let nextFlowSec = flowSecondsLeft;
      setConsecutiveCorrect(nextConsecutive);
      if (nextConsecutive >= 5 && !flowState) {
        nextFlow = true;
        nextFlowSec = 60;
        setFlowState(true);
        setFlowSecondsLeft(60);
        optsRef.current.onFlowEnter?.();
      }

      const branchesAfter = branches.map((b, i) =>
        i === activeBranchIdx ? { ...b, branchBoard: nb, branchNotes: nn } : b,
      );
      setBranches(branchesAfter);

      const nextHints = hintsUsed + 1;
      setHintsUsed(nextHints);
      void safeImpactMedium();
      const k = keyForCell(r, c);
      setFlashSet((p) => new Set([...p, k]));
      setTimeout(() => {
        setFlashSet((p) => {
          const s = new Set(p);
          s.delete(k);
          return s;
        });
      }, 420);
      checkComplete(nb);

      if (solvedHint) {
        setRunning(false);
        clearResumeTimer();
        replaceResume(null);
        opts.onSolved({ mistakes, hintsUsed: nextHints, flowBonus: nextFlow });
        return;
      }

      scheduleResumeSaveFull(
        buildResumePayload(
          branchesAfter,
          activeBranchIdx,
          nextHistHint,
          noteMode,
          mistakes,
          nextHints,
          timeSeconds,
          showBranchesDrawer,
          nextConsecutive,
          nextFlow,
          nextFlowSec,
        ),
      );
    },
    [
      activeBranchIdx,
      board,
      branches,
      buildResumePayload,
      checkComplete,
      consecutiveCorrect,
      flowState,
      flowSecondsLeft,
      history,
      hintsUsed,
      mistakes,
      noteMode,
      notes,
      replaceResume,
      scheduleResumeSaveFull,
      selection,
      showBranchesDrawer,
      timeSeconds,
    ],
  );

  const fillAllCandidates = useCallback(() => {
    if (!board || !branches) return;
    const nn = fillAllCandidateNotes(board);
    const nextBranches = branches.map((b, i) =>
      i === activeBranchIdx ? { ...b, branchNotes: nn } : b,
    );
    setBranches(nextBranches);
    scheduleResumeSaveFull(
      buildResumePayload(
        nextBranches,
        activeBranchIdx,
        history,
        noteMode,
        mistakes,
        hintsUsed,
        timeSeconds,
        showBranchesDrawer,
        consecutiveCorrect,
        flowState,
        flowSecondsLeft,
      ),
    );
  }, [
    activeBranchIdx,
    board,
    branches,
    buildResumePayload,
    consecutiveCorrect,
    flowSecondsLeft,
    flowState,
    history,
    hintsUsed,
    mistakes,
    noteMode,
    scheduleResumeSaveFull,
    showBranchesDrawer,
    timeSeconds,
  ]);

  const createBranch = useCallback(() => {
    if (!branches || !board || !notes) return;
    const name = `Branch ${branches.length}`;
    const copy: GameBranchData = {
      name,
      isMain: false,
      branchBoard: cloneBoard(board),
      branchNotes: cloneNotes(notes),
    };
    const next = [...branches, copy];
    setBranches(next);
    setActiveBranchIdx(next.length - 1);
    setHistory([]);
    setSelection(null);
    setShowBranchesDrawer(true);
    optsRef.current.onBranchCreated?.();
    scheduleResumeSaveFull(
      buildResumePayload(
        next,
        next.length - 1,
        [],
        noteMode,
        mistakes,
        hintsUsed,
        timeSeconds,
        true,
        consecutiveCorrect,
        flowState,
        flowSecondsLeft,
      ),
    );
  }, [
    board,
    branches,
    buildResumePayload,
    consecutiveCorrect,
    flowSecondsLeft,
    flowState,
    hintsUsed,
    mistakes,
    noteMode,
    notes,
    scheduleResumeSaveFull,
    timeSeconds,
  ]);

  const switchBranch = useCallback(
    (idx: number) => {
      if (!branches || idx < 0 || idx >= branches.length) return;
      setActiveBranchIdx(idx);
      setHistory([]);
      setSelection(null);
      scheduleResumeSaveFull(
        buildResumePayload(
          branches,
          idx,
          [],
          noteMode,
          mistakes,
          hintsUsed,
          timeSeconds,
          showBranchesDrawer,
          consecutiveCorrect,
          flowState,
          flowSecondsLeft,
        ),
      );
    },
    [
      branches,
      buildResumePayload,
      consecutiveCorrect,
      flowSecondsLeft,
      flowState,
      hintsUsed,
      mistakes,
      noteMode,
      scheduleResumeSaveFull,
      showBranchesDrawer,
      timeSeconds,
    ],
  );

  const deleteBranch = useCallback(
    (idx: number) => {
      if (!branches || branches.length <= 1 || idx === 0) return;
      const next = branches.filter((_, i) => i !== idx);
      let nextIdx = activeBranchIdx;
      if (activeBranchIdx === idx) nextIdx = 0;
      else if (activeBranchIdx > idx) nextIdx = activeBranchIdx - 1;
      setBranches(next);
      setActiveBranchIdx(nextIdx);
      setHistory([]);
      setSelection(null);
      scheduleResumeSaveFull(
        buildResumePayload(
          next,
          nextIdx,
          [],
          noteMode,
          mistakes,
          hintsUsed,
          timeSeconds,
          showBranchesDrawer,
          consecutiveCorrect,
          flowState,
          flowSecondsLeft,
        ),
      );
    },
    [
      activeBranchIdx,
      branches,
      buildResumePayload,
      consecutiveCorrect,
      flowSecondsLeft,
      flowState,
      hintsUsed,
      mistakes,
      noteMode,
      scheduleResumeSaveFull,
      showBranchesDrawer,
      timeSeconds,
    ],
  );

  const mergeFromBranchIndex = useCallback(
    (sourceIdx: number) => {
      if (!branches || sourceIdx === 0 || sourceIdx >= branches.length) return;
      const src = branches[sourceIdx]!;
      const next = [...branches];
      next[0] = {
        ...next[0]!,
        branchBoard: cloneBoard(src.branchBoard),
        branchNotes: cloneNotes(src.branchNotes),
      };
      setBranches(next);
      setActiveBranchIdx(0);
      setHistory([]);
      setSelection(null);
      scheduleResumeSaveFull(
        buildResumePayload(
          next,
          0,
          [],
          noteMode,
          mistakes,
          hintsUsed,
          timeSeconds,
          showBranchesDrawer,
          consecutiveCorrect,
          flowState,
          flowSecondsLeft,
        ),
      );
    },
    [
      branches,
      buildResumePayload,
      consecutiveCorrect,
      flowSecondsLeft,
      flowState,
      hintsUsed,
      mistakes,
      noteMode,
      scheduleResumeSaveFull,
      showBranchesDrawer,
      timeSeconds,
    ],
  );

  const mergeToMain = useCallback(() => {
    if (activeBranchIdx === 0) return;
    mergeFromBranchIndex(activeBranchIdx);
  }, [activeBranchIdx, mergeFromBranchIndex]);

  const digitRemaining = board
    ? ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
        n === 0 ? 0 : 9 - board.flat().filter((v) => v === n).length,
      ) as number[])
    : Array(10).fill(9);

  const filledCount = board ? board.flat().filter((v) => v !== 0).length : 0;

  const hasMeaningfulProgress =
    board != null &&
    puzzle != null &&
    (history.length > 0 ||
      (() => {
        for (let r = 0; r < 9; r++)
          for (let c = 0; c < 9; c++) if (board[r]![c] !== puzzle[r]![c]) return true;
        return false;
      })());

  return {
    difficulty,
    puzzle,
    solution,
    given,
    board,
    notes,
    branches,
    activeBranchIdx,
    selection,
    setSelection,
    noteMode,
    setNoteMode,
    mistakes,
    hintsUsed,
    timeSeconds,
    running,
    paused,
    setPaused,
    flashSet,
    doneRows,
    doneCols,
    doneBoxes,
    showBranchesDrawer,
    setShowBranchesDrawer,
    contradiction,
    isOnHypothesisBranch,
    consecutiveCorrect,
    flowState,
    flowSecondsLeft,
    startNewGame,
    continueFromResume,
    exitToMenu,
    inputDigit,
    undo,
    applyHint,
    fillAllCandidates,
    createBranch,
    switchBranch,
    deleteBranch,
    mergeToMain,
    mergeFromBranchIndex,
    digitRemaining,
    filledCount,
    hasMeaningfulProgress,
    canUndo: history.length > 0,
    isConflict: (r: number, c: number) => (board && board[r]![c] ? isConflict(board, r, c) : false),
    getCandidatesForCell: (r: number, c: number) =>
      board ? getCandidates(board, r, c) : [],
  };
}

export type GameSessionApi = ReturnType<typeof useGameSession>;
