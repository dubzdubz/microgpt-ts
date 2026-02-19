import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CUSTOM_PRESET, CUSTOM_PRESET_ID, PRESETS } from "./presets";
import { SECTION_LABEL } from "./types";

type DatasetSidebarProps = {
  selectedId: string;
  disabled: boolean;
  wordCount: number;
  onSelect: (id: string) => void;
  onTrain: () => void;
};

function wordCountFor(words: string): number {
  return words.split("\n").filter((l) => l.trim().length > 0).length;
}

export function DatasetSidebar({
  selectedId,
  disabled,
  wordCount,
  onSelect,
  onTrain,
}: DatasetSidebarProps) {
  const all = [CUSTOM_PRESET, ...PRESETS];
  return (
    <div className="flex w-full md:w-48 shrink-0 flex-col gap-1">
      <p className={`mb-2 ${SECTION_LABEL}`}>Dataset</p>
      {all.map((preset) => {
        const Icon = preset.icon;
        const active = selectedId === preset.id;
        const count =
          preset.id === CUSTOM_PRESET_ID ? null : wordCountFor(preset.words);
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => !disabled && onSelect(preset.id)}
            className={cn(
              "flex items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate">{preset.title}</span>
                {count != null && (
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-tight font-normal text-muted-foreground">
                {preset.description}
              </p>
            </div>
          </button>
        );
      })}

      <div className="pt-4">
        <Button
          onClick={onTrain}
          disabled={disabled || wordCount === 0}
          className="w-full"
        >
          Train on this dataset
        </Button>
      </div>
    </div>
  );
}
