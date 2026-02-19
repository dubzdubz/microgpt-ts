import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Clapperboard,
  Martini,
  PenLine,
  ScrollText,
  Zap,
} from "lucide-react";

import { babyNames } from "../../../datasets/baby-names";
import { cocktails } from "../../../datasets/cocktails";
import { fortunes } from "../../../datasets/fortunes";
import { movieTitles } from "../../../datasets/movie-titles";
import { pokemon } from "../../../datasets/pokemon";

export type Preset = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  words: string;
};

export const CUSTOM_PRESET_ID = "custom";

const lines = (arr: string[]) => arr.join("\n");

export const PRESETS: Preset[] = [
  {
    id: "baby-names",
    title: "Baby Names",
    description: "Soft vowels and flowing endings",
    icon: Baby,
    words: lines(babyNames),
  },
  {
    id: "pokemon",
    title: "Pokémon",
    description: "Punchy sounds and iconic suffixes",
    icon: Zap,
    words: lines(pokemon),
  },
  {
    id: "cocktails",
    title: "Cocktails",
    description: "Punchy sounds and iconic suffixes",
    icon: Martini,
    words: lines(cocktails),
  },
  {
    id: "movie-titles",
    title: "Movie Titles",
    description: "Real film titles with cinematic rhythm",
    icon: Clapperboard,
    words: lines(movieTitles),
  },
  {
    id: "fortunes",
    title: "Fortunes",
    description: "Short, shareable one-liners",
    icon: ScrollText,
    words: lines(fortunes),
  },
];

export const CUSTOM_PRESET: Preset = {
  id: CUSTOM_PRESET_ID,
  title: "Custom",
  description: "Paste your own word list",
  icon: PenLine,
  words: "",
};
