import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => "/en/app/home",
    useSearchParams: () => new URLSearchParams(),
  };
});
