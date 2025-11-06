import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSingleAction } from "../use-single-action";

describe("useSingleAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs action only once while pending", async () => {
    const spy = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 50);
        }),
    );

    const { result } = renderHook(() => useSingleAction(spy));

    act(() => {
      result.current.run("a" as never);
      result.current.run("b" as never);
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("allows sequential runs after completion", async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSingleAction(spy));

    await act(async () => {
      await result.current.run();
      await result.current.run();
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
