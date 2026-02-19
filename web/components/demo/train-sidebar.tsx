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
import type { ModelConfig } from "../../../microgpt/model";
import { SECTION_LABEL, sliderVal } from "./types";

export type TrainingConfig = {
  learningRate: number;
  numSteps: number;
};

type TrainSidebarProps = {
  modelConfig: ModelConfig;
  trainingConfig: TrainingConfig;
  disabled: boolean;
  isTraining: boolean;
  isTrained: boolean;
  onModelChange: (c: ModelConfig) => void;
  onTrainingChange: (c: TrainingConfig) => void;
  onTrain: () => void;
  onStop: () => void;
  onSwitchToGenerate: () => void;
};

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

function SelectField({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  options: number[];
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={String(v)} className="text-xs">
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConfigFields({
  modelConfig,
  trainingConfig,
  disabled,
  onModelChange,
  onTrainingChange,
}: Pick<
  TrainSidebarProps,
  | "modelConfig"
  | "trainingConfig"
  | "disabled"
  | "onModelChange"
  | "onTrainingChange"
>) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <p className={SECTION_LABEL}>Model</p>
        <SelectField
          id="nEmbd"
          label="Embedding dim"
          value={modelConfig.nEmbd}
          options={[8, 16, 32]}
          disabled={disabled}
          onChange={(v) => onModelChange({ ...modelConfig, nEmbd: v })}
        />
        <SelectField
          id="nHead"
          label="Attention heads"
          value={modelConfig.nHead}
          options={[1, 2, 4]}
          disabled={disabled}
          onChange={(v) => onModelChange({ ...modelConfig, nHead: v })}
        />
        <SelectField
          id="nLayer"
          label="Layers"
          value={modelConfig.nLayer}
          options={[1, 2, 4]}
          disabled={disabled}
          onChange={(v) => onModelChange({ ...modelConfig, nLayer: v })}
        />
        <SelectField
          id="blockSize"
          label="Context length"
          value={modelConfig.blockSize}
          options={[8, 16, 32, 64]}
          disabled={disabled}
          onChange={(v) => onModelChange({ ...modelConfig, blockSize: v })}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className={SECTION_LABEL}>Training</p>

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
                learningRate: sliderToLr(sliderVal(vals)),
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
                numSteps: sliderVal(vals),
              })
            }
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}

export function TrainSidebar({
  modelConfig,
  trainingConfig,
  disabled,
  isTraining,
  isTrained,
  onModelChange,
  onTrainingChange,
  onTrain,
  onStop,
  onSwitchToGenerate,
}: TrainSidebarProps) {
  const configProps = {
    modelConfig,
    trainingConfig,
    disabled,
    onModelChange,
    onTrainingChange,
  };

  return (
    <div className="flex w-full md:w-48 shrink-0 flex-col gap-5">
      {/* Desktop: always visible */}
      <div className="hidden md:contents">
        <ConfigFields {...configProps} />
      </div>

      {/* Mobile: collapsible */}
      <details className="md:hidden">
        <summary
          className={`flex cursor-pointer list-none items-center gap-1.5 ${SECTION_LABEL} [&::-webkit-details-marker]:hidden`}
        >
          Settings
          <svg
            viewBox="0 0 10 6"
            className="h-2.5 w-2.5 transition-transform [[open]>&]:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </summary>
        <div className="mt-3 flex flex-col gap-5">
          <ConfigFields {...configProps} />
        </div>
      </details>

      <div className="flex flex-col gap-2 pt-4 md:pt-0">
        {isTraining ? (
          <Button variant="outline" onClick={onStop} className="w-full">
            Stop
          </Button>
        ) : (
          <Button onClick={onTrain} className="w-full">
            {isTrained ? "Re-train" : "Train"}
          </Button>
        )}
        {isTrained && (
          <Button
            variant="outline"
            onClick={onSwitchToGenerate}
            className="w-full"
          >
            Generate &rarr;
          </Button>
        )}
      </div>
    </div>
  );
}
