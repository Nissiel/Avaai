import type { Meta, StoryObj } from "@storybook/react";
import { KpiCard } from "@/components/app/kpi-card";

const meta: Meta<typeof KpiCard> = {
  title: "App/KpiCard",
  component: KpiCard,
  args: {
    title: "Calls answered",
    value: 318,
    description: "Handled by Ava with human supervision.",
  },
};

export default meta;

type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {};

export const WithDelta: Story = {
  args: {
    delta: { value: 12, trend: "up", label: "week" },
  },
};
