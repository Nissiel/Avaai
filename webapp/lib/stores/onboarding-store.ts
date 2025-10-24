import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingData {
  phoneSetup: {
    provider: 'vapi' | 'twilio' | null;
    phoneNumber: string | null;
  };
  industry: string | null;
  customization: {
    name: string;
    tone: string;
    greeting: string;
  };
  testCallCompleted: boolean;
}

interface OnboardingStore {
  data: OnboardingData;
  currentStep: number;
  updatePhoneSetup: (provider: 'vapi' | 'twilio', phoneNumber?: string) => void;
  updateIndustry: (industry: string) => void;
  updateCustomization: (customization: Partial<OnboardingData['customization']>) => void;
  markTestCompleted: () => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

const initialData: OnboardingData = {
  phoneSetup: {
    provider: null,
    phoneNumber: null,
  },
  industry: null,
  customization: {
    name: 'AVA',
    tone: 'warm',
    greeting: 'Hello! How can I help you today?',
  },
  testCallCompleted: false,
};

export const useOnboarding = create<OnboardingStore>()(
  persist(
    (set) => ({
      data: initialData,
      currentStep: 0,

      updatePhoneSetup: (provider, phoneNumber) =>
        set((state) => ({
          data: {
            ...state.data,
            phoneSetup: { provider, phoneNumber: phoneNumber || null },
          },
        })),

      updateIndustry: (industry) =>
        set((state) => ({
          data: { ...state.data, industry },
        })),

      updateCustomization: (customization) =>
        set((state) => ({
          data: {
            ...state.data,
            customization: { ...state.data.customization, ...customization },
          },
        })),

      markTestCompleted: () =>
        set((state) => ({
          data: { ...state.data, testCallCompleted: true },
        })),

      setCurrentStep: (step) => set({ currentStep: step }),

      reset: () =>
        set({
          data: initialData,
          currentStep: 0,
        }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
