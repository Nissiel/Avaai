import { useEffect, useRef, useState } from "react";

import { RealtimeEvent, RealtimeEventHandler } from "@/lib/realtime/events";
import { createRealtimeClient, RealtimeStatus } from "@/lib/realtime/client";

type UseRealtimeOptions = {
  url: string;
  onEvent?: RealtimeEventHandler;
  autoReconnect?: boolean;
};

type UseRealtimeReturn = {
  status: RealtimeStatus;
  send: (payload: unknown) => void;
};

export function useRealtime({ url, onEvent, autoReconnect = true }: UseRealtimeOptions): UseRealtimeReturn {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const clientRef = useRef<ReturnType<typeof createRealtimeClient> | null>(null);
  const eventHandlerRef = useRef<RealtimeEventHandler | undefined>(onEvent);

  useEffect(() => {
    eventHandlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    clientRef.current = createRealtimeClient({
      url,
      reconnect: autoReconnect,
      onStatusChange: setStatus,
      onEvent: (event: RealtimeEvent) => eventHandlerRef.current?.(event),
    });

    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [url, autoReconnect]);

  const send = (payload: unknown) => {
    clientRef.current?.send(payload);
  };

  return {
    status,
    send,
  };
}
