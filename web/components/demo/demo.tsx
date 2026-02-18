"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type TrainHandle, trainAsync } from "../../../microgpt/browser";
import {
  buildTokenizer,
  DEFAULT_CONFIG,
  getParams,
  inference,
  initStateDict,
  type ModelConfig,
  type StateDict,
  type Tokenizer,
} from "../../../microgpt/model";
import {
  type AdamConfig,
  type AdamState,
  initAdamState,
} from "../../../microgpt/train";
import { parseDocs } from "../../../microgpt/utils";
import { DatasetSidebar } from "./dataset-sidebar";
import { DatasetTab } from "./dataset-tab";
import { GenerateSidebar } from "./generate-sidebar";
import { GenerateTab } from "./generate-tab";
import type { LiveGenEntry } from "./live-gen-stream";
import type { LossPoint } from "./loss-chart";
import { CUSTOM_PRESET_ID, PRESETS } from "./presets";
import { type TrainingConfig, TrainSidebar } from "./train-sidebar";
import { TrainTab } from "./train-tab";

// --- Constants ---

const LIVE_GEN_INTERVAL = 100;
const LIVE_GEN_SAMPLES = 5;
const MAX_LIVE_GEN = 15;
const DEFAULT_NUM_SAMPLES = 20;

// --- Types ---

type Status = "idle" | "training" | "trained";
type TabId = "dataset" | "train" | "generate";

// --- Main Demo ---

export function TrainDemo() {
  const [tab, setTab] = useState<TabId>("dataset");
  const [selectedPresetId, setSelectedPresetId] = useState("baby-names");
  const [customText, setCustomText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState(0);
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
  const temperatureRef = useRef(temperature);
  useEffect(() => {
    temperatureRef.current = temperature;
  }, [temperature]);

  const namesText =
    selectedPresetId === CUSTOM_PRESET_ID
      ? customText
      : (PRESETS.find((p) => p.id === selectedPresetId)?.words ?? "");

  const wordCount = namesText
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
    setTab("train");
    setStatus("training");
    setStep(0);
    setLoss(0);
    setLossHistory([]);
    setLiveGenEntries([]);
    setOutput([]);
    setElapsed(0);
    lossBufferRef.current = [];

    const docs = parseDocs(namesText);
    const tokenizer = buildTokenizer(docs);
    const stateDict = initStateDict(tokenizer.vocabSize, modelConfig);
    const adamState = initAdamState(getParams(stateDict).length);

    const adamConfig: AdamConfig = {
      learningRate: trainingConfig.learningRate,
      beta1: 0.85,
      beta2: 0.99,
      eps: 1e-8,
    };

    modelRef.current = { stateDict, adamState, tokenizer, modelConfig };

    const handle = trainAsync(
      stateDict,
      adamState,
      docs,
      tokenizer,
      trainingConfig.numSteps,
      adamConfig,
      modelConfig,
      (info) => {
        const s = info.step + 1;
        setStep(s);
        setLoss(info.smoothLoss);
        lossBufferRef.current.push({ step: s, loss: info.smoothLoss });
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
    );
    handleRef.current = handle;

    await handle.promise;
    handleRef.current = null;
    setLossHistory([...lossBufferRef.current]);
    setStatus((prev) => (prev === "training" ? "trained" : prev));
  }, [namesText, modelConfig, trainingConfig]);

  const handleStop = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    setStatus("trained");
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const genAbortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(() => {
    if (!modelRef.current) return;
    genAbortRef.current?.abort();
    const abort = new AbortController();
    genAbortRef.current = abort;

    const { stateDict, tokenizer, modelConfig: mc } = modelRef.current;
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
      const word = inference(stateDict, tokenizer, temperature, mc);
      setOutput((prev) => [...prev, word]);
      i++;
      setTimeout(tick, 80);
    };
    tick();
  }, [temperature, numSamples]);

  const isTraining = status === "training";
  const isTrained = status === "trained";

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabId)}
      className="flex w-full max-w-5xl flex-1 flex-col min-h-0"
    >
      <TabsList className="mb-6 w-full max-w-md self-center">
        <TabsTrigger value="dataset">Dataset</TabsTrigger>
        <TabsTrigger value="train">Train</TabsTrigger>
        <TabsTrigger value="generate" disabled={!isTrained && !isTraining}>
          Generate
        </TabsTrigger>
      </TabsList>

      <div className="flex flex-1 gap-8 min-h-0">
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
              handleGenerate();
            }}
          />
        )}
        {tab === "generate" && (
          <GenerateSidebar
            temperature={temperature}
            numSamples={numSamples}
            isGenerating={isGenerating}
            onTemperatureChange={setTemperature}
            onNumSamplesChange={setNumSamples}
            onGenerate={handleGenerate}
          />
        )}

        <Separator orientation="vertical" className="h-auto" />

        {/* Main content area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TabsContent value="dataset" className="mt-0 flex min-h-0 flex-col">
            <DatasetTab
              namesText={namesText}
              customText={customText}
              selectedPresetId={selectedPresetId}
              onCustomTextChange={setCustomText}
            />
          </TabsContent>

          <TabsContent value="train" className="mt-0">
            <TrainTab
              status={status}
              step={step}
              loss={loss}
              elapsed={elapsed}
              trainingConfig={trainingConfig}
              lossHistory={lossHistory}
              liveGenEntries={liveGenEntries}
            />
          </TabsContent>

          <TabsContent value="generate" className="mt-0 flex min-h-0 flex-col">
            <GenerateTab
              status={status}
              output={output}
              isGenerating={isGenerating}
              onSwitchToTrain={() => setTab("train")}
            />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
