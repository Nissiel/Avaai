export type RealtimeEventType =
  | 'CALL_STARTED'
  | 'CALL_UPDATED'
  | 'CALL_ENDED'
  | 'TRANSCRIPT_CHUNK'
  | 'FUNCTION_EXECUTED'
  | 'ASSISTANT_STATUS_CHANGED';

export interface BaseRealtimeEvent<T extends RealtimeEventType = RealtimeEventType> {
  type: T;
  timestamp: string;
  payload: unknown;
}

export type CallStartedEvent = BaseRealtimeEvent<'CALL_STARTED'> & {
  payload: {
    callId: string;
    assistantId: string;
    startedAt: string;
  };
};

export type CallUpdatedEvent = BaseRealtimeEvent<'CALL_UPDATED'> & {
  payload: {
    callId: string;
    status: string;
    durationSeconds?: number;
  };
};

export type CallEndedEvent = BaseRealtimeEvent<'CALL_ENDED'> & {
  payload: {
    callId: string;
    endedAt: string;
    transcript?: string;
  };
};

export type TranscriptChunkEvent = BaseRealtimeEvent<'TRANSCRIPT_CHUNK'> & {
  payload: {
    callId: string;
    text: string;
    role: 'assistant' | 'customer';
  };
};

export type FunctionExecutedEvent = BaseRealtimeEvent<'FUNCTION_EXECUTED'> & {
  payload: {
    callId: string;
    functionName: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
  };
};

export type AssistantStatusChangedEvent = BaseRealtimeEvent<'ASSISTANT_STATUS_CHANGED'> & {
  payload: {
    assistantId: string;
    status: 'online' | 'offline' | 'degraded';
  };
};

export type RealtimeEvent =
  | CallStartedEvent
  | CallUpdatedEvent
  | CallEndedEvent
  | TranscriptChunkEvent
  | FunctionExecutedEvent
  | AssistantStatusChangedEvent;

export type RealtimeEventHandler = (event: RealtimeEvent) => void;
