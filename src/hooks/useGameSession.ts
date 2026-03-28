import { AppState, type AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePersistedApp } from '../context/AppPersistProvider';
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
  generatePuzzle,
  isConflict,
  toggleNote,
} from '../game/engine';
import type { Board, Difficulty, NotesGrid } from '../game/types';
import type { ResumeStateV1 } from '../persistence/schema';

export type CellSelection = readonly [number, number];

type HistoryEntry = { board: Board; notes: NotesGrid };

function buildGiven(puzzle: Board): boolean[][] {
  return puzzle.map((row) => row.map((v) => v !== 0));
}

function keyForCell(r: number, c: number): string {
  return `${r}-${c}`;
}

function buildResumePayload(
  difficulty: Difficulty,
  puzzle: Board,
  solution: Board,
  given: boolean[][],
  board: Board,
  notes: NotesGrid,
  mistakes: number,
  hintsUsed: number,
  timeSeconds: number,
  history: HistoryEntry[],
  noteMode: boolean,
): ResumeStateV1 {
  return {
    diff: difficulty,
    puzzle: cloneBoard(puzzle),
    solution: cloneBoard(solution),
    given: given.map((row) => [...row]),
    board: cloneBoard(board),
    notes: cloneNotes(notes),
    mistakes,
    hintsUsed,
    timeSeconds,
    history: history.map((h) => ({
      board: cloneBoard(h.board),
      notes: cloneNotes(h.notes),
    })),
    noteMode,
  };
}

export function useGameSession() {
  const { replaceResume } = usePersistedApp();

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzle, setPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [given, setGiven] = useState<boolean[][] | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<NotesGrid | null>(null);
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  runningRef.current = running;

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      if (s !== 'active' && runningRef.current) setPaused(true);
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const clearResumeTimer = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
  };

  const scheduleResumeSave = useCallback(
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
      const { puzzle: p, solution: s } = generatePuzzle(diff);
      setPuzzle(p);
      setSolution(s);
      setBoard(p.map((r) => [...r]));
      setGiven(buildGiven(p));
      setNotes(emptyNotes());
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
    },
    [replaceResume],
  );

  const continueFromResume = useCallback((r: ResumeStateV1) => {
    clearResumeTimer();
    setDifficulty(r.diff);
    setPuzzle(cloneBoard(r.puzzle));
    setSolution(cloneBoard(r.solution));
    setGiven(r.given.map((row) => [...row]));
    setBoard(cloneBoard(r.board));
    setNotes(cloneNotes(r.notes));
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
  }, []);

  const exitToMenu = useCallback(() => {
    if (puzzle && solution && given && board && notes) {
      replaceResume(
        buildResumePayload(
          difficulty,
          puzzle,
          solution,
          given,
          board,
          notes,
          mistakes,
          hintsUsed,
          timeSeconds,
          history,
          noteMode,
        ),
      );
    }
    clearResumeTimer();
    setRunning(false);
    setPuzzle(null);
    setSolution(null);
    setGiven(null);
    setBoard(null);
    setNotes(null);
    setSelection(null);
    setHistory([]);
  }, [
    board,
    difficulty,
    given,
    hintsUsed,
    history,
    mistakes,
    noteMode,
    notes,
    puzzle,
    replaceResume,
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
        onSolved: (meta?: { mistakes?: number; hintsUsed?: number }) => void;
      },
    ) => {
      if (!selection || !board || !notes) return;
      const [r, c] = selection;
      if (opts.given[r]![c]) return;

      if (noteMode && num !== 0) {
        const histEntry = { board: cloneBoard(board), notes: cloneNotes(notes) };
        const nextHist = [...history.slice(-99), histEntry];
        setHistory(nextHist);
        const nn = cloneNotes(notes);
        const mask = nn[r]![c]!;
        nn[r]![c] = toggleNote(mask, num);
        setNotes(nn);
        void safeSelectionAsync();
        scheduleResumeSave(
          buildResumePayload(
            difficulty,
            opts.puzzle,
            opts.solution,
            opts.given,
            board,
            nn,
            mistakes,
            hintsUsed,
            timeSeconds,
            nextHist,
            noteMode,
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

      let nextMistakes = mistakes;
      if (num !== 0 && num !== opts.solution[r]![c]) {
        nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        void safeNotificationError();
      }

      setBoard(nb);
      setNotes(nn);

      if (num !== 0 && num === opts.solution[r]?.[c]) {
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
      }

      const solved =
        nb.every((row) => row.every((v) => v !== 0)) &&
        nb.every((row, ri) => row.every((v, ci) => v === opts.solution[ri]![ci]));

      if (solved) {
        setRunning(false);
        clearResumeTimer();
        replaceResume(null);
        opts.onSolved({ mistakes: nextMistakes, hintsUsed });
        return;
      }

      scheduleResumeSave(
        buildResumePayload(
          difficulty,
          opts.puzzle,
          opts.solution,
          opts.given,
          nb,
          nn,
          nextMistakes,
          hintsUsed,
          timeSeconds,
          nextHistAfterMove,
          noteMode,
        ),
      );
    },
    [
      board,
      checkComplete,
      difficulty,
      hintsUsed,
      history,
      mistakes,
      noteMode,
      notes,
      replaceResume,
      scheduleResumeSave,
      selection,
      timeSeconds,
    ],
  );

  const undo = useCallback(
    (ctx: { puzzle: Board; solution: Board; given: boolean[][] }) => {
      setHistory((h) => {
        if (!h.length) return h;
        const last = h[h.length - 1]!;
        const rest = h.slice(0, -1);
        setBoard(last.board);
        setNotes(last.notes);
        scheduleResumeSave(
          buildResumePayload(
            difficulty,
            ctx.puzzle,
            ctx.solution,
            ctx.given,
            last.board,
            last.notes,
            mistakes,
            hintsUsed,
            timeSeconds,
            rest,
            noteMode,
          ),
        );
        return rest;
      });
    },
    [difficulty, hintsUsed, mistakes, noteMode, scheduleResumeSave, timeSeconds],
  );

  const applyHint = useCallback(
    (opts: {
      puzzle: Board;
      solution: Board;
      given: boolean[][];
      onSolved: (meta?: { mistakes?: number; hintsUsed?: number }) => void;
    }) => {
      if (hintsUsed >= 3 || !selection || !board || !notes) return;
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
      setBoard(nb);
      setNotes(nn);
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

      const solved =
        nb.every((row) => row.every((v) => v !== 0)) &&
        nb.every((row, ri) => row.every((v, ci) => v === opts.solution[ri]![ci]));

      if (solved) {
        setRunning(false);
        clearResumeTimer();
        replaceResume(null);
        opts.onSolved({ mistakes, hintsUsed: nextHints });
        return;
      }

      scheduleResumeSave(
        buildResumePayload(
          difficulty,
          opts.puzzle,
          opts.solution,
          opts.given,
          nb,
          nn,
          mistakes,
          nextHints,
          timeSeconds,
          nextHistHint,
          noteMode,
        ),
      );
    },
    [
      board,
      checkComplete,
      difficulty,
      hintsUsed,
      history,
      mistakes,
      noteMode,
      notes,
      replaceResume,
      scheduleResumeSave,
      selection,
      timeSeconds,
    ],
  );

  const digitRemaining = board
    ? ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
        n === 0 ? 0 : 9 - board.flat().filter((v) => v === n).length,
      ) as number[])
    : Array(10).fill(9);

  const filledCount = board ? board.flat().filter((v) => v !== 0).length : 0;

  return {
    difficulty,
    puzzle,
    solution,
    given,
    board,
    notes,
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
    startNewGame,
    continueFromResume,
    exitToMenu,
    inputDigit,
    undo,
    applyHint,
    digitRemaining,
    filledCount,
    isConflict: (r: number, c: number) => (board && board[r]![c] ? isConflict(board, r, c) : false),
  };
}

export type GameSessionApi = ReturnType<typeof useGameSession>;
