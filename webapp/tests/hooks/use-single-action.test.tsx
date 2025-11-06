import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSingleAction } from "@/lib/hooks/use-single-action";

describe("useSingleAction", () => {
  it("deduplicates concurrent executions", async () => {
    const spy = vi.fn(async (value: number) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return value * 2;
    });

    const { result } = renderHook(() => useSingleAction(spy));

    await act(async () => {
      const { run } = result.current;
      await Promise.all([run(2), run(2), run(2), run(2)]);
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("resolves with the underlying function result", async () => {
    const { result } = renderHook(() =>
      useSingleAction(async (value: number) => {
        return value + 1;
      }),
    );

    await act(async () => {
      const { run } = result.current;
      await expect(run(4)).resolves.toBe(5);
    });
  });
});
