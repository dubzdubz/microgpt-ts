import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type GenerateMode, sliderVal } from "./types";

type GenerateSidebarProps = {
  mode: GenerateMode;
  temperature: number;
  numSamples: number;
  isGenerating: boolean;
  exploreDone: boolean;
  prefix: string;
  maxPrefixLength: number;
  allowedChars: string[];
  onModeChange: (mode: GenerateMode) => void;
  onTemperatureChange: (t: number) => void;
  onNumSamplesChange: (n: number) => void;
  onPrefixChange: (prefix: string) => void;
  onGenerate: () => void;
  onNextToken: () => void;
  onResetExplore: () => void;
};

function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help">
        <CircleHelp className="size-3.5 text-muted-foreground/60" />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

export function GenerateSidebar({
  mode,
  temperature,
  numSamples,
  isGenerating,
  exploreDone,
  prefix,
  maxPrefixLength,
  allowedChars,
  onModeChange,
  onTemperatureChange,
  onNumSamplesChange,
  onPrefixChange,
  onGenerate,
  onNextToken,
  onResetExplore,
}: GenerateSidebarProps) {
  const isStepByStep = mode === "explore";

  return (
    <div className="flex w-full md:w-48 shrink-0 flex-col gap-5">
      <div className="flex items-center justify-between">
        <Label htmlFor="step-by-step" className="text-sm cursor-pointer">
          Step-by-step
        </Label>
        <Switch
          id="step-by-step"
          checked={isStepByStep}
          onCheckedChange={(checked) =>
            onModeChange(checked ? "explore" : "batch")
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="prefix" className="text-xs">
              Prefix
            </Label>
            <HintIcon text="Starting characters for generation" />
          </div>
          <Input
            id="prefix"
            value={prefix}
            onChange={(e) => {
              const filtered = [...e.target.value]
                .filter((ch) => allowedChars.includes(ch))
                .slice(0, maxPrefixLength)
                .join("");
              onPrefixChange(filtered);
            }}
            className="h-8 font-mono text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Temperature</Label>
              <HintIcon text="Higher = more random, lower = more confident" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[Math.round(temperature * 10)]}
            onValueChange={(vals) => onTemperatureChange(sliderVal(vals) / 10)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label
              className={`text-xs ${isStepByStep ? "text-muted-foreground" : ""}`}
            >
              Samples
            </Label>
            <span
              className={`font-mono text-xs ${isStepByStep ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              {numSamples}
            </span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[numSamples]}
            onValueChange={(vals) => onNumSamplesChange(sliderVal(vals))}
            disabled={isStepByStep}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        {isStepByStep ? (
          <>
            <Button
              onClick={onNextToken}
              disabled={exploreDone}
              className="w-full"
            >
              Next Token
            </Button>
            <Button
              variant="outline"
              onClick={onResetExplore}
              className="w-full"
            >
              Reset
            </Button>
          </>
        ) : (
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating\u2026" : "Generate"}
          </Button>
        )}
      </div>
    </div>
  );
}
