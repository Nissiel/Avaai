import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./stories/**/*.{ts,tsx}",
  ],
  safelist: [
    "bg-brand-500",
    "text-brand-500",
    "bg-accent-500",
    "text-accent-500",
    "bg-status-success",
    "bg-status-warning",
    "bg-status-danger",
    "gradient-radial",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-jetbrains)", ...fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        brand: {
          50: "hsl(204 25% 97%)",
          100: "hsl(204 25% 94%)",
          200: "hsl(204 23% 88%)",
          300: "hsl(206 20% 72%)",
          400: "hsl(208 42% 54%)",
          500: "hsl(var(--brand))",
          600: "hsl(214 60% 38%)",
          700: "hsl(214 64% 30%)",
          800: "hsl(216 65% 22%)",
          900: "hsl(218 70% 16%)",
        },
        gold: {
          50: "hsl(48 100% 96%)",
          100: "hsl(48 95% 90%)",
          200: "hsl(46 90% 80%)",
          300: "hsl(43 85% 68%)",
          400: "hsl(40 80% 60%)",
          500: "hsl(var(--gold))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(160 70% 40%)",
        warning: "hsl(34 100% 50%)",
        info: "hsl(210 80% 45%)",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        status: {
          success: "hsl(152 65% 40%)",
          warning: "hsl(43 82% 52%)",
          danger: "hsl(360 80% 60%)",
          info: "hsl(213 94% 68%)",
        },
      },
      borderRadius: {
        none: "0",
        sm: "0.75rem",
        DEFAULT: "var(--radius)",
        lg: "calc(var(--radius) + 0.5rem)",
        xl: "calc(var(--radius) + 1rem)",
        "2xl": "calc(var(--radius) + 1.5rem)",
      },
      boxShadow: {
        subtle: "0 5px 25px -15px rgba(15, 23, 42, 0.45)",
        elevated: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
        outline: "0 0 0 1px rgba(148, 163, 184, 0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.2s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};

export default config;
