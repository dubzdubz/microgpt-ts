import { Textarea } from "@/components/ui/textarea";
import { CUSTOM_PRESET_ID } from "./presets";

export function DatasetTab({
  namesText,
  customText,
  selectedPresetId,
  onCustomTextChange,
}: {
  namesText: string;
  customText: string;
  selectedPresetId: string;
  onCustomTextChange: (text: string) => void;
}) {
  const isCustom = selectedPresetId === CUSTOM_PRESET_ID;
  return (
    <Textarea
      value={isCustom ? customText : namesText}
      onChange={
        isCustom ? (e) => onCustomTextChange(e.target.value) : undefined
      }
      readOnly={!isCustom}
      className="min-h-0 flex-1 field-sizing-fixed overflow-y-auto rounded-lg font-mono text-sm resize-none"
      placeholder={isCustom ? "Enter words, one per line..." : ""}
    />
  );
}
