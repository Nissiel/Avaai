import { useEffect, useState } from "react";

// Custom hook to fetch backend tools repeatedly with cancellation awareness.
export function useBackendTools(url: string, intervalMs: number) {
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const fetchTools = async () => {
      if (cancelled) {
        return;
      }

      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setTools((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
        }
      } catch (error) {
        const err = error as Error;
        if (err.name !== "AbortError") {
          console.error("Error fetching backend tools:", err);
        }
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(fetchTools, intervalMs);
        }
      }
    };

    fetchTools();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller?.abort();
    };
  }, [url, intervalMs]);

  return tools;
}
