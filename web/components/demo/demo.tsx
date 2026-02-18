"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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

const NUM_SAMPLES = 10;

type TrainingConfig = {
  learningRate: number;
  numSteps: number;
};

type FullTrainConfig = {
  model: ModelConfig;
  training: TrainingConfig;
};

type Status = "idle" | "training" | "trained";

function configsEqual(a: FullTrainConfig, b: FullTrainConfig): boolean {
  return (
    a.model.nEmbd === b.model.nEmbd &&
    a.model.nHead === b.model.nHead &&
    a.model.nLayer === b.model.nLayer &&
    a.model.blockSize === b.model.blockSize &&
    a.training.learningRate === b.training.learningRate &&
    a.training.numSteps === b.training.numSteps
  );
}

// --- Hyperparameter Panel ---

type HyperparamPanelProps = {
  modelConfig: ModelConfig;
  trainingConfig: TrainingConfig;
  temperature: number;
  requiresRetrain: boolean;
  disabled: boolean;
  onModelChange: (c: ModelConfig) => void;
  onTrainingChange: (c: TrainingConfig) => void;
  onTemperatureChange: (t: number) => void;
};

function HyperparamPanel({
  modelConfig,
  trainingConfig,
  temperature,
  requiresRetrain,
  disabled,
  onModelChange,
  onTrainingChange,
  onTemperatureChange,
}: HyperparamPanelProps) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Hyperparameters</p>
        {requiresRetrain && (
          <Badge variant="destructive" className="text-xs">
            Re-train required
          </Badge>
        )}
      </div>

      {/* Model config */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Model
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nEmbd" className="text-xs">
            Embedding dim
          </Label>
          <Select
            value={String(modelConfig.nEmbd)}
            onValueChange={(v) =>
              onModelChange({ ...modelConfig, nEmbd: Number(v) })
            }
            disabled={disabled}
          >
            <SelectTrigger id="nEmbd" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 16, 32].map((v) => (
                <SelectItem key={v} value={String(v)} className="text-xs">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nHead" className="text-xs">
            Attention heads
          </Label>
          <Select
            value={String(modelConfig.nHead)}
            onValueChange={(v) =>
              onModelChange({ ...modelConfig, nHead: Number(v) })
            }
            disabled={disabled}
          >
            <SelectTrigger id="nHead" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 4].map((v) => (
                <SelectItem key={v} value={String(v)} className="text-xs">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nLayer" className="text-xs">
            Layers
          </Label>
          <Select
            value={String(modelConfig.nLayer)}
            onValueChange={(v) =>
              onModelChange({ ...modelConfig, nLayer: Number(v) })
            }
            disabled={disabled}
          >
            <SelectTrigger id="nLayer" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 4].map((v) => (
                <SelectItem key={v} value={String(v)} className="text-xs">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blockSize" className="text-xs">
            Context length
          </Label>
          <Select
            value={String(modelConfig.blockSize)}
            onValueChange={(v) =>
              onModelChange({ ...modelConfig, blockSize: Number(v) })
            }
            disabled={disabled}
          >
            <SelectTrigger id="blockSize" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 16].map((v) => (
                <SelectItem key={v} value={String(v)} className="text-xs">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Training config */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Training
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Learning rate</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {trainingConfig.learningRate.toPrecision(2)}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[lrToSlider(trainingConfig.learningRate)]}
            onValueChange={(vals) =>
              onTrainingChange({
                ...trainingConfig,
                learningRate: sliderToLr(Array.isArray(vals) ? vals[0] : vals),
              })
            }
            disabled={disabled}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Training steps</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {trainingConfig.numSteps}
            </span>
          </div>
          <Slider
            min={100}
            max={10000}
            step={100}
            value={[trainingConfig.numSteps]}
            onValueChange={(vals) =>
              onTrainingChange({
                ...trainingConfig,
                numSteps: Array.isArray(vals) ? vals[0] : vals,
              })
            }
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Generation config */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Generation
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Temperature</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[Math.round(temperature * 10)]}
            onValueChange={(vals) =>
              onTemperatureChange((Array.isArray(vals) ? vals[0] : vals) / 10)
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

const LR_MIN = 0.001;
const LR_MAX = 0.5;
const LR_LOG_MIN = Math.log10(LR_MIN);
const LR_LOG_MAX = Math.log10(LR_MAX);

function sliderToLr(v: number): number {
  return 10 ** (LR_LOG_MIN + (v / 100) * (LR_LOG_MAX - LR_LOG_MIN));
}

function lrToSlider(lr: number): number {
  return Math.round(
    ((Math.log10(lr) - LR_LOG_MIN) / (LR_LOG_MAX - LR_LOG_MIN)) * 100,
  );
}

// --- Main Demo ---

export function TrainDemo() {
  const [namesText, setNamesText] = useState(SAMPLE_NAMES);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState(0);
  const [output, setOutput] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    learningRate: 0.01,
    numSteps: 1000,
  });
  const [temperature, setTemperature] = useState(0.5);

  const trainedConfigRef = useRef<FullTrainConfig | null>(null);

  const requiresRetrain =
    status === "trained" &&
    trainedConfigRef.current !== null &&
    !configsEqual(trainedConfigRef.current, {
      model: modelConfig,
      training: trainingConfig,
    });

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

  const handleTrain = useCallback(async () => {
    setStatus("training");
    setStep(0);
    setLoss(0);
    setOutput([]);
    setElapsed(0);

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
        setStep(info.step + 1);
        setLoss(info.smoothLoss);
      },
    );
    handleRef.current = handle;

    await handle.promise;
    handleRef.current = null;
    trainedConfigRef.current = { model: modelConfig, training: trainingConfig };
    setStatus((prev) => (prev === "training" ? "trained" : prev));
  }, [namesText, modelConfig, trainingConfig]);

  const handleStop = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    trainedConfigRef.current = { model: modelConfig, training: trainingConfig };
    setStatus("trained");
  }, [modelConfig, trainingConfig]);

  const handleGenerate = useCallback(() => {
    if (!modelRef.current) return;
    const { stateDict, tokenizer, modelConfig: mc } = modelRef.current;
    const names: string[] = [];
    for (let i = 0; i < NUM_SAMPLES; i++) {
      names.push(inference(stateDict, tokenizer, temperature, mc));
    }
    setOutput(names);
  }, [temperature]);

  return (
    <div className="flex w-full max-w-3xl gap-8">
      <HyperparamPanel
        modelConfig={modelConfig}
        trainingConfig={trainingConfig}
        temperature={temperature}
        requiresRetrain={requiresRetrain}
        disabled={status === "training"}
        onModelChange={setModelConfig}
        onTrainingChange={setTrainingConfig}
        onTemperatureChange={setTemperature}
      />

      <Separator orientation="vertical" className="h-auto" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
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
            step {step} / {trainingConfig.numSteps} | loss: {loss.toFixed(4)} |{" "}
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
    </div>
  );
}
