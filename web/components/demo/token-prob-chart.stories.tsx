import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TokenProbChart } from "./token-prob-chart";

const VOCAB = [..."abcdefghijklmnopqrstuvwxyz", "·"];
const makeProbs = (peakIdx: number) => {
  const raw = VOCAB.map((_, i) => (i === peakIdx ? 4 : Math.random()));
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / total);
};

const meta: Meta<typeof TokenProbChart> = {
  title: "Demo/TokenProbChart",
  component: TokenProbChart,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TokenProbChart>;

export const Default: Story = {
  args: {
    probs: makeProbs(0),
    sampledId: 0,
    vocabLabels: VOCAB,
  },
};

export const MidWordSample: Story = {
  args: {
    probs: makeProbs(13),
    sampledId: 13,
    vocabLabels: VOCAB,
  },
};

export const EOSToken: Story = {
  args: {
    probs: makeProbs(26),
    sampledId: 26,
    vocabLabels: VOCAB,
  },
};
