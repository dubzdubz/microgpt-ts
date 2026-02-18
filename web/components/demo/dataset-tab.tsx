import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOM_PRESET_ID } from "./presets";

export function DatasetTab({
  namesText,
  customText,
  selectedPresetId,
  wordCount,
  disabled,
  onCustomTextChange,
  onTrain,
}: {
  namesText: string;
  customText: string;
  selectedPresetId: string;
  wordCount: number;
  disabled: boolean;
  onCustomTextChange: (text: string) => void;
  onTrain: () => void;
}) {
  const isCustom = selectedPresetId === CUSTOM_PRESET_ID;
  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={isCustom ? customText : namesText}
        onChange={
          isCustom ? (e) => onCustomTextChange(e.target.value) : undefined
        }
        readOnly={!isCustom}
        rows={20}
        className="font-mono text-sm resize-none"
        placeholder={isCustom ? "Enter words, one per line..." : ""}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </p>
        <Button onClick={onTrain} disabled={disabled || wordCount === 0}>
          Train on this dataset
        </Button>
      </div>
    </div>
  );
}
