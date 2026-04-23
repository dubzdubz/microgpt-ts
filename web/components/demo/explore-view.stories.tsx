import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { InferenceStep } from "../../../microgpt/model";
import { ExploreView } from "./explore-view";

const VOCAB = [..."abcdefghijklmnopqrstuvwxyz", "·"];
const BOS = 26;

const makeProbs = (peakIdx: number) => {
  const raw = VOCAB.map((_, i) => (i === peakIdx ? 4 : Math.random()));
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / total);
};

const makeStep = (posId: number, tokenId: number, prevTokens: number[]): InferenceStep => ({
  posId,
  probs: makeProbs(tokenId),
  tokenId,
  prevTokens,
});

const meta: Meta<typeof ExploreView> = {
  title: "Demo/ExploreView",
  component: ExploreView,
  parameters: { layout: "padded" },
  args: {
    vocabLabels: VOCAB,
    BOS,
  },
};

export default meta;
type Story = StoryObj<typeof ExploreView>;

export const Empty: Story = {
  args: { steps: [], done: false },
};

export const InProgress: Story = {
  args: {
    steps: [
      makeStep(0, 4, []), // 'e'
      makeStep(1, 11, [4]), // 'l'
      makeStep(2, 11, [4, 11]), // 'l'
    ],
    done: false,
  },
};

export const WordComplete: Story = {
  args: {
    steps: [
      makeStep(0, 4, []), // 'e'
      makeStep(1, 11, [4]), // 'l'
      makeStep(2, 11, [4, 11]), // 'l'
      makeStep(3, 14, [4, 11, 11]), // 'o'
      makeStep(4, BOS, [4, 11, 11, 14]),
    ],
    done: true,
  },
};

export const WithPrefix: Story = {
  args: {
    steps: [
      makeStep(2, 11, [4, 11]), // 'l' (prefix fed 'e','l')
      makeStep(3, 14, [4, 11, 11]), // 'o'
    ],
    done: false,
    prefixChars: ["e", "l"],
  },
};

export const EmptyWithPrefix: Story = {
  args: { steps: [], done: false, prefixChars: ["a", "n"] },
};
