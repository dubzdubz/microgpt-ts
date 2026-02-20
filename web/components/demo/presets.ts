import type { LucideIcon } from "lucide-react";
import { Baby, Clapperboard, Martini, PenLine, Zap } from "lucide-react";

import { babyNames } from "../../../datasets/baby-names";
import { babyNamesSimple } from "../../../datasets/baby-names-simple";
import { cocktails } from "../../../datasets/cocktails";
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
    id: "baby-names-simple",
    title: "Baby Names",
    description: "50 popular names with soft vowels",
    icon: Baby,
    words: lines(babyNamesSimple),
  },
  {
    id: "baby-names",
    title: "Baby Names (1k)",
    description: "1000 diverse names from around the world",
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
  // {
  //   id: "fortunes",
  //   title: "Fortunes",
  //   description: "Short, shareable one-liners",
  //   icon: ScrollText,
  //   words: lines(fortunes),
  // },
];

export const CUSTOM_PRESET: Preset = {
  id: CUSTOM_PRESET_ID,
  title: "Custom",
  description: "Paste your own word list",
  icon: PenLine,
  words: "",
};
