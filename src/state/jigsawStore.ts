import { atom } from "jotai";
import {
  DEFAULT_JIGSAW_PARAMETERS,
  DEFAULT_RANDOM_TARGETS,
} from "../constants/defaults";
import type {
  BoundaryLine,
  JigsawParameters,
  RandomTargets,
  RecordingState,
} from "../types/jigsaw";

export const jigsawParamsAtom = atom<JigsawParameters>(
  DEFAULT_JIGSAW_PARAMETERS,
);

export const colorGridAtom = atom<string[][]>([]);
export const horizontalLinesAtom = atom<BoundaryLine[]>([]);
export const verticalLinesAtom = atom<BoundaryLine[]>([]);

export const historyStackAtom = atom<JigsawParameters[]>([
  JSON.parse(JSON.stringify(DEFAULT_JIGSAW_PARAMETERS)),
]);
export const historyPointerAtom = atom<number>(0);

export const isPanelOpenAtom = atom<boolean>(true);

export const recordingStateAtom = atom<RecordingState>({
  isRecording: false,
  elapsedSeconds: 0,
  isLoopMode: false,
  currentLoop: 1,
  totalLoops: 1,
  loopIntervalMs: 2000,
});

export const randomTargetsAtom = atom<RandomTargets>(
  DEFAULT_RANDOM_TARGETS,
);

export const autoRandomIntervalMsAtom = atom<number>(4000);
export const isAutoRandomActiveAtom = atom<boolean>(false);

export const targetLoopsCountAtom = atom<number>(2);
export const isLoopRecordingActiveAtom = atom<boolean>(false);

export interface ToastInfo {
  id: string;
  message: string;
}
export const toastsAtom = atom<ToastInfo[]>([]);
