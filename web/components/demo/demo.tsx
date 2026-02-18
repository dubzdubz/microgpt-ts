"use client";

import type { LucideIcon } from "lucide-react";
import { Baby, Gem, Globe, PenLine, Wine, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import { cn } from "@/lib/utils";
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

// --- Preset datasets ---

type Preset = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  examples: [string, string, string];
  words: string;
};

const PRESET_BABY_NAMES = `emma
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

const PRESET_POKEMON = `pikachu
bulbasaur
charmander
squirtle
eevee
gengar
mewtwo
charizard
blastoise
venusaur
snorlax
gyarados
dragonite
lapras
jigglypuff
clefairy
vulpix
ninetales
psyduck
golduck
machamp
alakazam
abra
haunter
gastly
onix
raichu
sandslash
nidorina
nidoking
wigglytuff
zubat
golbat
oddish
vileplume
diglett
meowth
persian
mankey
primeape
growlithe
arcanine
poliwag
kadabra
geodude
graveler
golem
ponyta
rapidash
slowpoke
magnemite
doduo
seel
grimer
shellder
cloyster
drowzee
hypno
krabby
voltorb
electrode
exeggcute
cubone
hitmonlee
hitmonchan
lickitung
koffing
weezing
rhyhorn
chansey
kangaskhan
scyther
electabuzz
magmar
pinsir
tauros
magikarp
ditto
porygon
omanyte
omastar
kabuto
aerodactyl
articuno
zapdos
moltres
dratini
dragonair
mew`;

const PRESET_COCKTAILS = `mojito
negroni
cosmopolitan
martini
margarita
daiquiri
sidecar
gimlet
sazerac
manhattan
bellini
caipirinha
zombie
hurricane
bramble
spritz
americano
stinger
sangria
mimosa
fizz
smash
julep
cobbler
swizzle
rickey
toddy
sling
highball
mudslide
aperol
campari
fernet
amaretto
sambuca
absinthe
calvados
bourbon
tequila
mezcal
pisco
cognac
armagnac
vermouth
drambuie
kahlua
cointreau
chartreuse
benedictine
midori
frangelico
chambord
disaronno
malibu
galliano
limoncello
grappa
pastis
baileys
cynar
lillet`;

const PRESET_MINERALS = `quartz
amethyst
diamond
emerald
sapphire
ruby
topaz
opal
garnet
tourmaline
beryl
aquamarine
turquoise
malachite
obsidian
onyx
jasper
agate
carnelian
citrine
peridot
spinel
alexandrite
kunzite
tanzanite
zircon
pyrite
hematite
fluorite
calcite
gypsum
celestite
amazonite
rhodonite
labradorite
sodalite
diopside
actinolite
talc
kyanite
sillimanite
staurolite
epidote
zoisite
titanite
apatite
cassiterite
sphalerite
galena
cinnabar
marcasite
covellite
barite
anhydrite
magnetite
chromite
cordierite
iolite
wollastonite
chalcedony`;

const PRESET_COUNTRIES = `albania
algeria
argentina
armenia
australia
austria
azerbaijan
bahamas
bangladesh
barbados
belarus
belgium
belize
benin
bhutan
bolivia
botswana
brazil
brunei
bulgaria
cameroon
canada
chile
colombia
croatia
cuba
cyprus
denmark
ecuador
egypt
eritrea
estonia
ethiopia
fiji
finland
france
gabon
gambia
georgia
germany
ghana
greece
grenada
guatemala
guyana
haiti
honduras
hungary
iceland
india
indonesia
iran
ireland
israel
italy
jamaica
japan
jordan
kazakhstan
kenya
kiribati
kuwait
laos
latvia
lebanon
lesotho
liberia
luxembourg
madagascar
malawi
malaysia
mali
malta
mauritania
mauritius
mexico
moldova
monaco
mongolia
montenegro
morocco
mozambique
myanmar
namibia
nauru
nepal
nicaragua
nigeria
norway
oman
pakistan
panama
paraguay
peru
philippines
poland
portugal
qatar
romania
russia
rwanda
samoa
senegal
serbia
seychelles
singapore
slovakia
slovenia
somalia
spain
sweden
switzerland
tajikistan
tanzania
thailand
tonga
tunisia
turkey
tuvalu
uganda
ukraine
uruguay
uzbekistan
vanuatu
venezuela
vietnam
yemen
zambia
zimbabwe`;

const PRESETS: Preset[] = [
  {
    id: "baby-names",
    title: "Baby Names",
    description: "Soft vowels and flowing endings",
    icon: Baby,
    examples: ["aurora", "luna", "aria"],
    words: PRESET_BABY_NAMES,
  },
  {
    id: "pokemon",
    title: "Pokémon",
    description: "Punchy sounds and iconic suffixes",
    icon: Zap,
    examples: ["pikachu", "gengar", "eevee"],
    words: PRESET_POKEMON,
  },
  {
    id: "cocktails",
    title: "Cocktails",
    description: "Exotic letters and spirited flair",
    icon: Wine,
    examples: ["negroni", "gimlet", "sazerac"],
    words: PRESET_COCKTAILS,
  },
  {
    id: "minerals",
    title: "Minerals",
    description: "Latinate suffixes and crystalline sounds",
    icon: Gem,
    examples: ["zircon", "epidote", "kunzite"],
    words: PRESET_MINERALS,
  },
  {
    id: "countries",
    title: "Countries",
    description: "Diverse origins from every corner of the world",
    icon: Globe,
    examples: ["fiji", "tuvalu", "grenada"],
    words: PRESET_COUNTRIES,
  },
];

const CUSTOM_PRESET_ID = "custom";

// --- PresetPicker ---

type PresetPickerProps = {
  selectedId: string;
  customText: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onCustomTextChange: (text: string) => void;
};

function PresetPicker({
  selectedId,
  customText,
  disabled,
  onSelect,
  onCustomTextChange,
}: PresetPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = selectedId === preset.id;
          return (
            <Card
              key={preset.id}
              onClick={() => !disabled && onSelect(preset.id)}
              className={cn(
                "cursor-pointer p-3 transition-all select-none",
                isActive
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {preset.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2 leading-snug">
                {preset.description}
              </p>
              <p className="font-mono text-xs text-muted-foreground/60 truncate">
                {preset.examples.join(" · ")}
              </p>
            </Card>
          );
        })}
        <Card
          onClick={() => !disabled && onSelect(CUSTOM_PRESET_ID)}
          className={cn(
            "cursor-pointer p-3 transition-all select-none",
            selectedId === CUSTOM_PRESET_ID
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <PenLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium">Custom</span>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            Paste your own word list
          </p>
        </Card>
      </div>

      {selectedId === CUSTOM_PRESET_ID && (
        <Textarea
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          rows={8}
          disabled={disabled}
          className="font-mono text-sm"
          placeholder="Enter words, one per line..."
        />
      )}
    </div>
  );
}

// --- Hyperparameter Panel ---

type TrainingConfig = {
  learningRate: number;
  numSteps: number;
};

type FullTrainConfig = {
  model: ModelConfig;
  training: TrainingConfig;
};

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

// --- Loss Chart ---

type LossPoint = { step: number; loss: number };

const MAX_CHART_POINTS = 200;

function downsample(points: LossPoint[]): LossPoint[] {
  if (points.length <= MAX_CHART_POINTS) return points;
  const every = Math.ceil(points.length / MAX_CHART_POINTS);
  const result: LossPoint[] = [];
  for (let i = 0; i < points.length; i += every) result.push(points[i]);
  if (result[result.length - 1] !== points[points.length - 1])
    result.push(points[points.length - 1]);
  return result;
}

const lossChartConfig = {
  loss: { label: "Loss", color: "var(--chart-1)" },
} satisfies ChartConfig;

function LossChart({
  data,
  numSteps,
  currentLoss,
}: {
  data: LossPoint[];
  numSteps: number;
  currentLoss: number;
}) {
  const display = downsample(data);
  const yMax = data.length > 0 ? Math.ceil(data[0].loss) : 4;
  const lastStep = data.length > 0 ? data[data.length - 1].step : 0;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Training Loss</CardTitle>
        <CardDescription>
          Smoothed loss over {lastStep.toLocaleString()} /{" "}
          {numSteps.toLocaleString()} steps — current:{" "}
          <span className="font-mono font-medium text-foreground">
            {currentLoss.toFixed(4)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={lossChartConfig} className="h-48 w-full">
          <AreaChart data={display} accessibilityLayer>
            <defs>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-loss)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-loss)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="step"
              type="number"
              domain={[0, numSteps]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, yMax]}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as LossPoint | undefined;
                    return p ? `Step ${p.step}` : "";
                  }}
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {(value as number).toFixed(4)}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="loss"
              type="monotone"
              stroke="var(--color-loss)"
              strokeWidth={2}
              fill="url(#lossGradient)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// --- Live Gen Stream ---

type LiveGenEntry = { step: number; words: string[] };

const MAX_LIVE_GEN = 15;
const LIVE_GEN_INTERVAL = 100;
const LIVE_GEN_SAMPLES = 3;

function LiveGenStream({ entries }: { entries: LiveGenEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new entries
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Live samples
      </p>
      <div
        ref={scrollRef}
        className="h-36 overflow-y-auto rounded-md border bg-muted/30 p-3"
      >
        {entries.map((entry) => (
          <div
            key={entry.step}
            className="flex gap-3 font-mono text-xs leading-relaxed"
          >
            <span className="shrink-0 text-muted-foreground/50 tabular-nums">
              {String(entry.step).padStart(5, "\u2007")}
            </span>
            <span className="text-muted-foreground">—</span>
            <span>{entry.words.join(" · ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Demo ---

type Status = "idle" | "training" | "trained";

const NUM_SAMPLES = 10;

export function TrainDemo() {
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
  const temperatureRef = useRef(temperature);
  useEffect(() => {
    temperatureRef.current = temperature;
  }, [temperature]);

  const namesText =
    selectedPresetId === CUSTOM_PRESET_ID
      ? customText
      : (PRESETS.find((p) => p.id === selectedPresetId)?.words ?? "");

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

  const lossBufferRef = useRef<LossPoint[]>([]);

  const handleTrain = useCallback(async () => {
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
    <div className="flex w-full max-w-4xl gap-8">
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
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dataset
          </p>
          <PresetPicker
            selectedId={selectedPresetId}
            customText={customText}
            disabled={status === "training"}
            onSelect={setSelectedPresetId}
            onCustomTextChange={setCustomText}
          />
        </div>

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
          <div className="flex flex-col gap-3">
            <p className="font-mono text-sm text-muted-foreground">
              step {step} / {trainingConfig.numSteps} | loss: {loss.toFixed(4)}{" "}
              | {(elapsed / 1000).toFixed(1)}s
            </p>
            {lossHistory.length > 1 && (
              <LossChart
                data={lossHistory}
                numSteps={trainingConfig.numSteps}
                currentLoss={loss}
              />
            )}
          </div>
        )}

        <LiveGenStream entries={liveGenEntries} />

        {output.length > 0 && (
          <div className="rounded-md border p-4">
            <p className="mb-2 text-sm font-medium">Generated:</p>
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
