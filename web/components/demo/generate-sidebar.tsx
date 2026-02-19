import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GenerateMode = "batch" | "explore";

type GenerateSidebarProps = {
  mode: GenerateMode;
  temperature: number;
  numSamples: number;
  isGenerating: boolean;
  exploreDone: boolean;
  onModeChange: (mode: GenerateMode) => void;
  onTemperatureChange: (t: number) => void;
  onNumSamplesChange: (n: number) => void;
  onGenerate: () => void;
  onNextToken: () => void;
  onResetExplore: () => void;
};

export function GenerateSidebar({
  mode,
  temperature,
  numSamples,
  isGenerating,
  exploreDone,
  onModeChange,
  onTemperatureChange,
  onNumSamplesChange,
  onGenerate,
  onNextToken,
  onResetExplore,
}: GenerateSidebarProps) {
  return (
    <div className="flex w-full md:w-48 shrink-0 flex-col gap-5">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as GenerateMode)}>
        <TabsList className="w-full">
          <TabsTrigger value="batch" className="flex-1">
            Batch
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex-1">
            Explore
          </TabsTrigger>
        </TabsList>
      </Tabs>

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

        {mode === "batch" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Samples</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {numSamples}
              </span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[numSamples]}
              onValueChange={(vals) =>
                onNumSamplesChange(Array.isArray(vals) ? vals[0] : vals)
              }
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-4">
        {mode === "batch" ? (
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating\u2026" : "Generate"}
          </Button>
        ) : (
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
        )}
      </div>
    </div>
  );
}
