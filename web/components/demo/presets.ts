import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Clapperboard,
  Martini,
  PenLine,
  ScrollText,
  Smile,
  Zap,
} from "lucide-react";

import { babyNames } from "../../../datasets/baby-names";
import { cocktails } from "../../../datasets/cocktails";
import { emojiMiniStories } from "../../../datasets/emoji-mini-stories";
import { fortunes } from "../../../datasets/fortunes";
import { movieTitles } from "../../../datasets/movie-titles";
import { pokemon } from "../../../datasets/pokemon";

export type Preset = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  examples: [string, string, string];
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
    examples: ["aurora", "luna", "aria"],
    words: lines(babyNames),
  },
  {
    id: "pokemon",
    title: "Pokémon",
    description: "Punchy sounds and iconic suffixes",
    icon: Zap,
    examples: ["pikachu", "gengar", "eevee"],
    words: lines(pokemon),
  },
  {
    id: "cocktails",
    title: "Cocktails",
    description: "Punchy sounds and iconic suffixes",
    icon: Martini,
    examples: ["martini", "mojito", "manhattan"],
    words: lines(cocktails),
  },
  {
    id: "movie-titles",
    title: "Movie Titles",
    description: "Real film titles with cinematic rhythm",
    icon: Clapperboard,
    examples: ["The Matrix", "Back to the Future", "No Country for Old Men"],
    words: lines(movieTitles),
  },
  {
    id: "emoji-mini-stories",
    title: "Emoji Mini Stories",
    description: "Tiny emoji narratives with strong vibes",
    icon: Smile,
    examples: ["🌧☕📚🕯😌", "🎬🍿😱🙈🤣", "🏔🥾🗺📸🌅"],
    words: lines(emojiMiniStories),
  },
  {
    id: "fortunes",
    title: "Fortunes",
    description: "Short, shareable one-liners",
    icon: ScrollText,
    examples: [
      "A small change will unlock a big win.",
      "You will tune one number and smile.",
      "The weird sample is the most memorable.",
    ],
    words: lines(fortunes),
  },
];

export const CUSTOM_PRESET: Preset = {
  id: CUSTOM_PRESET_ID,
  title: "Custom",
  description: "Paste your own word list",
  icon: PenLine,
  examples: ["your", "words", "here"],
  words: "",
};
