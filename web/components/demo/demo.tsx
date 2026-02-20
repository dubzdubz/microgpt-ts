"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { type TrainHandle, trainAsync } from "../../../microgpt/browser";
import {
  buildTokenizer,
  DEFAULT_CONFIG,
  getParams,
  type InferenceStep,
  inference,
  inferenceStepwise,
  initStateDict,
  type ModelConfig,
  type StateDict,
  type Tokenizer,
} from "../../../microgpt/model";
import {
  type AdamState,
  DEFAULT_ADAM_CONFIG,
  initAdamState,
} from "../../../microgpt/train";
import { parseDocs, splitDocs } from "../../../microgpt/utils";
import { DatasetSidebar } from "./dataset-sidebar";
import { DatasetTab } from "./dataset-tab";
import { GenerateSidebar } from "./generate-sidebar";
import { GenerateTab } from "./generate-tab";
import type { LiveGenEntry } from "./live-gen-stream";
import type { LossPoint } from "./loss-chart";
import { CUSTOM_PRESET_ID, PRESETS } from "./presets";
import { type TrainingConfig, TrainSidebar } from "./train-sidebar";
import { TrainTab } from "./train-tab";
import type { GenerateMode, Status } from "./types";

// --- Constants ---

const LIVE_GEN_INTERVAL = 100;
const LIVE_GEN_SAMPLES = 5;
const MAX_LIVE_GEN = 15;
const DEFAULT_NUM_SAMPLES = 20;

type TabId = "dataset" | "train" | "generate";

// --- Main Demo ---

export function TrainDemo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (searchParams.get("tab") ?? "dataset") as TabId;
  const setTab = (newTab: TabId) => router.replace(`${pathname}?tab=${newTab}`);
  const [selectedPresetId, setSelectedPresetId] = useState("baby-names");
  const [customText, setCustomText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState(0);
  const [evalLoss, setEvalLoss] = useState<number | undefined>(undefined);
  const [lossHistory, setLossHistory] = useState<LossPoint[]>([]);
  const [liveGenEntries, setLiveGenEntries] = useState<LiveGenEntry[]>([]);
  const [output, setOutput] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    learningRate: 0.01,
    numSteps: 1000,
  });
  const [temperature, setTemperature] = useState(0.5);
  const [numSamples, setNumSamples] = useState(DEFAULT_NUM_SAMPLES);
  const [prefix, setPrefix] = useState("");
  const temperatureRef = useRef(temperature);
  useEffect(() => {
    temperatureRef.current = temperature;
  }, [temperature]);

  const datasetText =
    selectedPresetId === CUSTOM_PRESET_ID
      ? customText
      : (PRESETS.find((p) => p.id === selectedPresetId)?.words ?? "");

  const wordCount = datasetText
    .split("\n")
    .filter((l) => l.trim().length > 0).length;

  const handleRef = useRef<TrainHandle | null>(null);
  const modelRef = useRef<{
    stateDict: StateDict;
    adamState: AdamState;
    tokenizer: Tokenizer;
    modelConfig: ModelConfig;
  } | null>(null);

  useEffect(() => {
    if (status !== "training") return;
    const id = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  const lossBufferRef = useRef<LossPoint[]>([]);

  const handleTrain = useCallback(async () => {
    router.replace(`${pathname}?tab=train`);
    setStatus("training");
    setStep(0);
    setLoss(0);
    setEvalLoss(undefined);
    setLossHistory([]);
    setLiveGenEntries([]);
    setOutput([]);
    setElapsed(0);
    lossBufferRef.current = [];

    const allDocs = parseDocs(datasetText);
    const { train: trainDocs, eval: evalDocsSplit } = splitDocs(allDocs);
    const tokenizer = buildTokenizer(allDocs);
    const stateDict = initStateDict(tokenizer.vocabSize, modelConfig);
    const adamState = initAdamState(getParams(stateDict).length);

    const adamConfig = {
      ...DEFAULT_ADAM_CONFIG,
      learningRate: trainingConfig.learningRate,
    };

    modelRef.current = { stateDict, adamState, tokenizer, modelConfig };

    const handle = trainAsync(
      stateDict,
      adamState,
      trainDocs,
      tokenizer,
      trainingConfig.numSteps,
      adamConfig,
      modelConfig,
      (info) => {
        const s = info.step + 1;
        setStep(s);
        setLoss(info.smoothLoss);
        lossBufferRef.current.push({
          step: s,
          loss: info.smoothLoss,
        });
        if (s % 10 === 0 || s === info.numSteps) {
          setLossHistory([...lossBufferRef.current]);
        }
        if (s % LIVE_GEN_INTERVAL === 0) {
          const words = Array.from({ length: LIVE_GEN_SAMPLES }, () =>
            inference(
              stateDict,
              tokenizer,
              temperatureRef.current,
              modelConfig,
            ),
          );
          setLiveGenEntries((prev) => {
            const next = [...prev, { step: s, words }];
            return next.length > MAX_LIVE_GEN
              ? next.slice(next.length - MAX_LIVE_GEN)
              : next;
          });
        }
      },
      {
        docs: evalDocsSplit,
        onEval: (evalInfo) => {
          setEvalLoss(evalInfo.evalLoss);
          const evalS = evalInfo.evalStep + 1;
          const target = lossBufferRef.current.find((p) => p.step === evalS);
          if (target) target.evalLoss = evalInfo.evalLoss;
          setLossHistory([...lossBufferRef.current]);
        },
        createWorker: () =>
          new Worker(new URL("../../workers/eval-worker.ts", import.meta.url)),
      },
    );
    handleRef.current = handle;

    await handle.promise;
    handleRef.current = null;
    setLossHistory([...lossBufferRef.current]);
    setStatus((prev) => (prev === "training" ? "trained" : prev));
  }, [datasetText, modelConfig, trainingConfig, router, pathname]);

  const handleStop = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    setStatus("trained");
  }, []);

  const [generateMode, setGenerateMode] = useState<GenerateMode>("explore");
  const [exploreSteps, setExploreSteps] = useState<InferenceStep[]>([]);
  const [exploreDone, setExploreDone] = useState(false);
  const generatorRef = useRef<Generator<InferenceStep> | null>(null);

  const encodePrefixTokens = useCallback((): number[] => {
    if (!modelRef.current || prefix.length === 0) return [];
    const { chars } = modelRef.current.tokenizer;
    return [...prefix].map((ch) => chars.indexOf(ch)).filter((id) => id >= 0);
  }, [prefix]);

  const handleNextToken = useCallback(() => {
    if (!modelRef.current) return;
    const { stateDict, tokenizer, modelConfig: mc } = modelRef.current;
    if (!generatorRef.current) {
      generatorRef.current = inferenceStepwise(
        stateDict,
        tokenizer,
        temperature,
        mc,
        encodePrefixTokens(),
      );
    }
    const result = generatorRef.current.next();
    if (result.done) return;
    setExploreSteps((prev) => [...prev, result.value]);
    if (result.value.tokenId === tokenizer.BOS) {
      setExploreDone(true);
      generatorRef.current = null;
    }
  }, [temperature, encodePrefixTokens]);

  const handleResetExplore = useCallback(() => {
    generatorRef.current = null;
    setExploreSteps([]);
    setExploreDone(false);
  }, []);

  const handlePrefixChange = useCallback(
    (newPrefix: string) => {
      setPrefix(newPrefix);
      handleResetExplore();
    },
    [handleResetExplore],
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const genAbortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(() => {
    if (!modelRef.current) return;
    genAbortRef.current?.abort();
    const abort = new AbortController();
    genAbortRef.current = abort;

    const { stateDict, tokenizer, modelConfig: mc } = modelRef.current;
    const pfx = encodePrefixTokens();
    setOutput([]);
    setIsGenerating(true);

    let i = 0;
    const tick = () => {
      if (abort.signal.aborted) return;
      if (i >= numSamples) {
        setIsGenerating(false);
        genAbortRef.current = null;
        return;
      }
      const word = inference(stateDict, tokenizer, temperature, mc, pfx);
      setOutput((prev) => [...prev, word]);
      i++;
      setTimeout(tick, 80);
    };
    tick();
  }, [temperature, numSamples, encodePrefixTokens]);

  const isTraining = status === "training";
  const isTrained = status === "trained";

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col min-h-0">
      <div className="flex flex-1 flex-col md:flex-row gap-4 md:gap-8 min-h-0">
        {/* Adaptive sidebar */}
        {tab === "dataset" && (
          <DatasetSidebar
            selectedId={selectedPresetId}
            disabled={isTraining}
            wordCount={wordCount}
            onSelect={setSelectedPresetId}
            onTrain={handleTrain}
          />
        )}
        {tab === "train" && (
          <TrainSidebar
            modelConfig={modelConfig}
            trainingConfig={trainingConfig}
            disabled={isTraining}
            isTraining={isTraining}
            isTrained={isTrained}
            onModelChange={setModelConfig}
            onTrainingChange={setTrainingConfig}
            onTrain={handleTrain}
            onStop={handleStop}
            onSwitchToGenerate={() => {
              setTab("generate");
              setGenerateMode("explore");
              handleResetExplore();
              handleNextToken();
            }}
          />
        )}
        {tab === "generate" && (
          <GenerateSidebar
            mode={generateMode}
            temperature={temperature}
            numSamples={numSamples}
            isGenerating={isGenerating}
            exploreDone={exploreDone}
            prefix={prefix}
            maxPrefixLength={
              (modelRef.current?.modelConfig.blockSize ??
                DEFAULT_CONFIG.blockSize) - 1
            }
            allowedChars={modelRef.current?.tokenizer.chars ?? []}
            onModeChange={setGenerateMode}
            onTemperatureChange={setTemperature}
            onNumSamplesChange={setNumSamples}
            onPrefixChange={handlePrefixChange}
            onGenerate={handleGenerate}
            onNextToken={handleNextToken}
            onResetExplore={handleResetExplore}
          />
        )}

        <Separator orientation="vertical" className="hidden md:block h-auto" />
        <Separator className="md:hidden" />

        {/* Main content area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {tab === "dataset" && (
            <div className="flex flex-1 min-h-0 flex-col">
              <DatasetTab
                datasetText={datasetText}
                customText={customText}
                selectedPresetId={selectedPresetId}
                onCustomTextChange={setCustomText}
              />
            </div>
          )}

          {tab === "train" && (
            <div className="flex flex-1 min-h-0 flex-col">
              <TrainTab
                status={status}
                step={step}
                loss={loss}
                evalLoss={evalLoss}
                elapsed={elapsed}
                trainingConfig={trainingConfig}
                lossHistory={lossHistory}
                liveGenEntries={liveGenEntries}
              />
            </div>
          )}

          {tab === "generate" && (
            <div className="flex flex-1 min-h-0 flex-col">
              <GenerateTab
                status={status}
                mode={generateMode}
                output={output}
                isGenerating={isGenerating}
                exploreSteps={exploreSteps}
                exploreDone={exploreDone}
                vocabLabels={
                  modelRef.current
                    ? [...modelRef.current.tokenizer.chars, "·"]
                    : []
                }
                BOS={modelRef.current?.tokenizer.BOS ?? 0}
                prefixChars={[...prefix]}
                onSwitchToTrain={() => setTab("train")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
