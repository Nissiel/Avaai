import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";

const meta: Meta<typeof OnboardingChecklist> = {
  title: "App/OnboardingChecklist",
  component: OnboardingChecklist,
};

export default meta;

type Story = StoryObj<typeof OnboardingChecklist>;

export const Default: Story = {
  args: {
    items: [
      {
        id: "voice",
        title: "Provision voice number",
        description: "Purchase your Twilio number or attach SIP.",
        completed: true,
      },
      {
        id: "playbook",
        title: "Publish Ava playbook",
        description: "Review tone, guardrails, and fallback.",
        completed: false,
        actionLabel: "Open Ava Studio",
      },
    ],
  },
};
