import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrainDemo } from "./demo";

const meta: Meta<typeof TrainDemo> = {
  title: "Demo/TrainDemo",
  component: TrainDemo,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TrainDemo>;

export const Default: Story = {};
