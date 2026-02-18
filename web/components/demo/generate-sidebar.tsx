import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type GenerateSidebarProps = {
  temperature: number;
  numSamples: number;
  isGenerating: boolean;
  onTemperatureChange: (t: number) => void;
  onNumSamplesChange: (n: number) => void;
  onGenerate: () => void;
};

export function GenerateSidebar({
  temperature,
  numSamples,
  isGenerating,
  onTemperatureChange,
  onNumSamplesChange,
  onGenerate,
}: GenerateSidebarProps) {
  return (
    <div className="flex w-48 shrink-0 flex-col gap-5">
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
      </div>

      <div className="pt-4">
        <Button onClick={onGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? "Generating\u2026" : "Generate"}
        </Button>
      </div>
    </div>
  );
}
