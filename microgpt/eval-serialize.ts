import type { StateDict } from "./model";
import { Value } from "./value";

type Num<T> = T extends Value ? number : T extends (infer U)[] ? Num<U>[] : T;
export type NumericStateDict = { [K in keyof StateDict]: Num<StateDict[K]> };

function mapLeaves(x: unknown, fn: (leaf: unknown) => unknown): unknown {
  return Array.isArray(x) ? x.map((el) => mapLeaves(el, fn)) : fn(x);
}

export function snapshotWeights(sd: StateDict): NumericStateDict {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(sd))
    out[k] = mapLeaves(sd[k as keyof StateDict], (v) => (v as Value).data);
  return out as NumericStateDict;
}

export function restoreStateDict(snap: NumericStateDict): StateDict {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(snap))
    out[k] = mapLeaves(
      snap[k as keyof NumericStateDict],
      (n) => new Value(n as number),
    );
  return out as StateDict;
}
