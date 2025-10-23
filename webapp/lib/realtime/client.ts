import { RealtimeEvent, RealtimeEventHandler } from "./events";

type RealtimeClientOptions = {
  url: string;
  onEvent?: RealtimeEventHandler;
  onStatusChange?: (status: RealtimeStatus) => void;
  reconnect?: boolean;
};

export type RealtimeStatus = "idle" | "connecting" | "connected" | "disconnected";

export function createRealtimeClient({ url, onEvent, onStatusChange, reconnect = true }: RealtimeClientOptions) {
  let socket: WebSocket | null = null;
  let status: RealtimeStatus = "idle";
  let reconnectAttempts = 0;
  let shouldReconnect = reconnect;

  const notifyStatus = (next: RealtimeStatus) => {
    status = next;
    onStatusChange?.(status);
  };

  const connect = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    notifyStatus("connecting");
    socket = new WebSocket(url);

    socket.onopen = () => {
      reconnectAttempts = 0;
      notifyStatus("connected");
    };

    socket.onclose = () => {
      notifyStatus("disconnected");
      if (shouldReconnect) {
        const timeout = Math.min(5000, 500 * 2 ** reconnectAttempts);
        reconnectAttempts += 1;
        setTimeout(connect, timeout);
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeEvent;
        onEvent?.(payload);
      } catch (error) {
        console.warn("Failed to parse realtime event", error);
      }
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  const send = (message: unknown) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("Realtime socket not connected");
      return;
    }
    socket.send(JSON.stringify(message));
  };

  const disconnect = () => {
    shouldReconnect = false;
    socket?.close();
    socket = null;
  };

  connect();

  return {
    send,
    disconnect,
    get status() {
      return status;
    },
  };
}
