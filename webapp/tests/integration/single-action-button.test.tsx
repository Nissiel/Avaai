import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";
import { useSingleAction } from "@/lib/hooks/use-single-action";

function TestButton() {
  const [count, setCount] = React.useState(0);
  const { run } = useSingleAction(async () => {
    setCount((value) => value + 1);
    await new Promise((resolve) => setTimeout(resolve, 1));
  });

  return (
    <div>
      <button type="button" onClick={() => run()} data-testid="action-button">
        Trigger
      </button>
      <span data-testid="count">{count}</span>
    </div>
  );
}

describe("Single action UI integration", () => {
  it("only applies mutation once under rapid clicks", async () => {
    render(<TestButton />);
    const button = screen.getByTestId("action-button");

    for (let i = 0; i < 20; i += 1) {
      fireEvent.click(button);
    }

    await screen.findByText("1");
    expect(screen.getByTestId("count").textContent).toBe("1");
  });
});
