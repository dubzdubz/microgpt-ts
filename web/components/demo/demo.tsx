"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import type { TrainWorkerIn, TrainWorkerOut } from "../../../microgpt/browser";
import { DEFAULT_CONFIG, type InferenceStep, type ModelConfig } from "../../../microgpt/model";
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

const MAX_LIVE_GEN = 15;
const DEFAULT_NUM_SAMPLES = 20;

type TabId = "dataset" | "train" | "generate";

type TokenizerInfo = {
  chars: string[];
  BOS: number;
  vocabSize: number;
  blockSize: number;
};

// --- Main Demo ---

export function TrainDemo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (searchParams.get("tab") ?? "dataset") as TabId;
  const setTab = (newTab: TabId) => router.replace(`${pathname}?tab=${newTab}`);
  const [selectedPresetId, setSelectedPresetId] = useState("baby-names-simple");
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
    learningRate: 0.001,
    numSteps: 1000,
  });
  const [temperature, setTemperature] = useState(0.5);
  const [numSamples, setNumSamples] = useState(DEFAULT_NUM_SAMPLES);
  const [prefix, setPrefix] = useState("");

  const handlePresetSelect = useCallback((id: string) => {
    setSelectedPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    setModelConfig({ ...DEFAULT_CONFIG, ...preset?.modelConfig });
    setTrainingConfig({
      learningRate: 0.01,
      numSteps: 1000,
      ...preset?.trainingConfig,
    });
  }, []);

  const datasetText =
    selectedPresetId === CUSTOM_PRESET_ID
      ? customText
      : (PRESETS.find((p) => p.id === selectedPresetId)?.words ?? "");

  const wordCount = datasetText.split("\n").filter((l) => l.trim()).length;

  const trainWorkerRef = useRef<Worker | null>(null);
  const evalWorkerRef = useRef<Worker | null>(null);
  const tokenizerInfoRef = useRef<TokenizerInfo | null>(null);
  const lossBufferRef = useRef<LossPoint[]>([]);
  const evalStepMapRef = useRef<Record<number, number>>({});
  useEffect(() => {
    if (status !== "training") return;
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  const terminateWorkers = useCallback(() => {
    trainWorkerRef.current?.terminate();
    trainWorkerRef.current = null;
    evalWorkerRef.current?.terminate();
    evalWorkerRef.current = null;
  }, []);

  useEffect(() => terminateWorkers, [terminateWorkers]);

  const sendTrain = useCallback((msg: TrainWorkerIn) => {
    trainWorkerRef.current?.postMessage(msg);
  }, []);

  const handleTrain = useCallback(() => {
    terminateWorkers();
    router.replace(`${pathname}?tab=train`);
    setStatus("training");
    setStep(0);
    setLoss(0);
    setEvalLoss(undefined);
    setLossHistory([]);
    setLiveGenEntries([]);
    setOutput([]);
    setElapsed(0);
    setExploreSteps([]);
    setExploreDone(false);
    setIsGenerating(false);
    lossBufferRef.current = [];
    evalStepMapRef.current = {};

    const evalWorker = new Worker(new URL("../../workers/eval-worker.ts", import.meta.url));
    evalWorkerRef.current = evalWorker;
    evalWorker.onmessage = (e: MessageEvent<{ id: number; avgLoss: number }>) => {
      const { id, avgLoss } = e.data;
      const step = evalStepMapRef.current[id];
      if (step === undefined) return;
      delete evalStepMapRef.current[id];
      setEvalLoss(avgLoss);
      const target = lossBufferRef.current.find((p) => p.step === step);
      if (target) target.evalLoss = avgLoss;
      setLossHistory([...lossBufferRef.current]);
    };

    const trainWorker = new Worker(new URL("../../workers/train-worker.ts", import.meta.url));
    trainWorkerRef.current = trainWorker;
    trainWorker.onmessage = (e: MessageEvent<TrainWorkerOut>) => {
      const msg = e.data;
      switch (msg.type) {
        case "ready":
          tokenizerInfoRef.current = msg.tokenizer;
          break;

        case "steps":
          for (const s of msg.batch) {
            lossBufferRef.current.push({ step: s.step, loss: s.smoothLoss });
          }
          {
            const last = msg.batch[msg.batch.length - 1];
            setStep(last.step);
            setLoss(last.smoothLoss);
          }
          setLossHistory([...lossBufferRef.current]);
          break;

        case "live-gen":
          setLiveGenEntries((prev) => {
            const next = [...prev, { step: msg.step, words: msg.words }];
            return next.length > MAX_LIVE_GEN ? next.slice(next.length - MAX_LIVE_GEN) : next;
          });
          break;

        case "eval-snapshot":
          evalStepMapRef.current[msg.id] = msg.step;
          evalWorker.postMessage({
            id: msg.id,
            weights: msg.weights,
            encodedDocs: msg.encodedEvalDocs,
            config: msg.modelConfig,
          });
          break;

        case "done":
          setLossHistory([...lossBufferRef.current]);
          setStatus((prev) => (prev === "training" ? "trained" : prev));
          break;

        case "gen-word":
          setOutput((prev) => [...prev, msg.word]);
          break;

        case "gen-done":
          setIsGenerating(false);
          break;

        case "explore-step":
          setExploreSteps((prev) => [...prev, msg.step]);
          if (tokenizerInfoRef.current && msg.step.tokenId === tokenizerInfoRef.current.BOS) {
            setExploreDone(true);
          }
          break;
      }
    };

    sendTrain({
      type: "init",
      datasetText,
      modelConfig,
      numSteps: trainingConfig.numSteps,
      learningRate: trainingConfig.learningRate,
      temperature,
    });
  }, [
    datasetText,
    modelConfig,
    trainingConfig,
    temperature,
    router,
    pathname,
    terminateWorkers,
    sendTrain,
  ]);

  const handleStop = useCallback(() => {
    sendTrain({ type: "abort" });
    evalWorkerRef.current?.terminate();
    evalWorkerRef.current = null;
    setStatus("trained");
  }, [sendTrain]);

  const [generateMode, setGenerateMode] = useState<GenerateMode>("explore");
  const [exploreSteps, setExploreSteps] = useState<InferenceStep[]>([]);
  const [exploreDone, setExploreDone] = useState(false);

  const encodePrefixTokens = useCallback((): number[] => {
    if (!tokenizerInfoRef.current || prefix.length === 0) return [];
    const { chars } = tokenizerInfoRef.current;
    return [...prefix].map((ch) => chars.indexOf(ch)).filter((id) => id >= 0);
  }, [prefix]);

  const handleNextToken = useCallback(() => {
    if (!trainWorkerRef.current) return;
    if (exploreSteps.length === 0 && !exploreDone) {
      sendTrain({
        type: "explore-start",
        temperature,
        prefixTokens: encodePrefixTokens(),
      });
    } else {
      sendTrain({ type: "explore-next" });
    }
  }, [temperature, encodePrefixTokens, exploreSteps.length, exploreDone, sendTrain]);

  const handleResetExplore = useCallback(() => {
    sendTrain({ type: "explore-reset" });
    setExploreSteps([]);
    setExploreDone(false);
  }, [sendTrain]);

  const handlePrefixChange = useCallback(
    (newPrefix: string) => {
      setPrefix(newPrefix);
      handleResetExplore();
    },
    [handleResetExplore],
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!trainWorkerRef.current) return;
    setOutput([]);
    setIsGenerating(true);
    sendTrain({
      type: "generate",
      temperature,
      prefixTokens: encodePrefixTokens(),
      numSamples,
    });
  }, [temperature, numSamples, encodePrefixTokens, sendTrain]);

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
            onSelect={handlePresetSelect}
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
            maxPrefixLength={(tokenizerInfoRef.current?.blockSize ?? DEFAULT_CONFIG.blockSize) - 1}
            allowedChars={tokenizerInfoRef.current?.chars ?? []}
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
                  tokenizerInfoRef.current ? [...tokenizerInfoRef.current.chars, "·"] : []
                }
                BOS={tokenizerInfoRef.current?.BOS ?? 0}
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
