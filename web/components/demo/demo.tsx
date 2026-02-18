"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type TrainHandle, trainAsync } from "../../../microgpt/browser";
import {
  buildTokenizer,
  getParams,
  inference,
  initStateDict,
  type StateDict,
  type Tokenizer,
} from "../../../microgpt/model";
import {
  type AdamConfig,
  type AdamState,
  initAdamState,
} from "../../../microgpt/train";
import { parseDocs } from "../../../microgpt/utils";

const SAMPLE_NAMES = `emma
olivia
ava
sophia
isabella
mia
charlotte
amelia
harper
evelyn
abigail
emily
elizabeth
avery
ella
scarlett
grace
chloe
victoria
riley
aria
lily
aurora
zoey
penelope
nora
camila
elena
maya
luna
savannah
willow
hazel
stella
ellie
claire
violet
paisley
skylar
isla
madelyn
naomi
hannah
brooklyn
aaliyah
bella
lucy
anna
leah
natalie`;

const NUM_STEPS = 1000;
const NUM_SAMPLES = 10;

const ADAM_CONFIG: AdamConfig = {
  learningRate: 0.01,
  beta1: 0.85,
  beta2: 0.99,
  eps: 1e-8,
};

type Status = "idle" | "training" | "trained";

export function TrainDemo() {
  const [namesText, setNamesText] = useState(SAMPLE_NAMES);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState(0);
  const [output, setOutput] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const handleRef = useRef<TrainHandle | null>(null);
  const modelRef = useRef<{
    stateDict: StateDict;
    adamState: AdamState;
    tokenizer: Tokenizer;
  } | null>(null);

  useEffect(() => {
    if (status !== "training") return;
    const id = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  const handleTrain = useCallback(async () => {
    setStatus("training");
    setStep(0);
    setLoss(0);
    setOutput([]);
    setElapsed(0);

    const docs = parseDocs(namesText);
    const tokenizer = buildTokenizer(docs);
    const stateDict = initStateDict(tokenizer.vocabSize);
    const adamState = initAdamState(getParams(stateDict).length);

    modelRef.current = { stateDict, adamState, tokenizer };

    const handle = trainAsync(
      stateDict,
      adamState,
      docs,
      tokenizer,
      NUM_STEPS,
      ADAM_CONFIG,
      (info) => {
        setStep(info.step + 1);
        setLoss(info.smoothLoss);
      },
    );
    handleRef.current = handle;

    await handle.promise;
    handleRef.current = null;
    setStatus((prev) => (prev === "training" ? "trained" : prev));
  }, [namesText]);

  const handleStop = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    setStatus("trained");
  }, []);

  const handleGenerate = useCallback(() => {
    if (!modelRef.current) return;
    const { stateDict, tokenizer } = modelRef.current;
    const names: string[] = [];
    for (let i = 0; i < NUM_SAMPLES; i++) {
      names.push(inference(stateDict, tokenizer));
    }
    setOutput(names);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Textarea
        value={namesText}
        onChange={(e) => setNamesText(e.target.value)}
        rows={10}
        disabled={status === "training"}
        className="max-h-[calc(15*1.5em+1rem)] font-mono text-sm"
        placeholder="Enter names, one per line..."
      />

      <div className="flex items-center gap-3">
        <Button onClick={handleTrain} disabled={status === "training"}>
          Train
        </Button>
        {status === "training" && (
          <Button variant="outline" onClick={handleStop}>
            Stop
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={handleGenerate}
          disabled={status !== "trained"}
        >
          Generate
        </Button>
      </div>

      {(status === "training" || status === "trained") && (
        <p className="font-mono text-sm text-muted-foreground">
          step {step} / {NUM_STEPS} | loss: {loss.toFixed(4)} |{" "}
          {(elapsed / 1000).toFixed(1)}s
        </p>
      )}

      {output.length > 0 && (
        <div className="rounded-md border p-4">
          <p className="mb-2 text-sm font-medium">Generated names:</p>
          <ul className="font-mono text-sm">
            {output.map((name, i) => (
              <li key={`${i}-${name}`}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
