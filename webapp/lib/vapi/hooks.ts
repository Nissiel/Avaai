/**
 * ============================================================================
 * USE VAPI - React Hook for Client-Side Integration
 * ============================================================================
 * Divine hook for managing Vapi calls from the browser
 * Real-time call handling, status updates, and event streaming
 * ============================================================================
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { toast } from 'sonner';

export type CallStatus =
  | 'inactive'
  | 'loading'
  | 'active'
  | 'ended'
  | 'error';

export interface UseVapiOptions {
  publicKey: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

export interface UseVapiReturn {
  // State
  callStatus: CallStatus;
  isMuted: boolean;
  volume: number;
  messages: any[];
  
  // Actions
  startCall: (assistantId: string) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  sendMessage: (message: string) => void;
  
  // Utilities
  isCallActive: boolean;
  error: Error | null;
}

/**
 * Main Vapi Hook
 * 
 * @example
 * ```tsx
 * const { startCall, endCall, callStatus } = useVapi({
 *   publicKey: 'your-public-key',
 *   onCallStart: () => console.log('Call started!'),
 * });
 * 
 * // Start a call
 * <button onClick={() => startCall('assistant-id')}>
 *   Call
 * </button>
 * ```
 */
export function useVapi(options: UseVapiOptions): UseVapiReturn {
  const { publicKey, onCallStart, onCallEnd, onMessage, onError } = options;

  // Refs
  const vapiRef = useRef<Vapi | null>(null);

  // State
  const [callStatus, setCallStatus] = useState<CallStatus>('inactive');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize Vapi instance
   */
  useEffect(() => {
    if (!publicKey) {
      console.warn('⚠️ Vapi public key not provided');
      return;
    }

    try {
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      // Event listeners
      vapi.on('call-start', () => {
        console.log('✅ Call started');
        setCallStatus('active');
        onCallStart?.();
      });

      vapi.on('call-end', () => {
        console.log('📞 Call ended');
        setCallStatus('ended');
        onCallEnd?.();
      });

      vapi.on('message', (message) => {
        console.log('💬 Message received:', message);
        setMessages((prev) => [...prev, message]);
        onMessage?.(message);
      });

      vapi.on('error', (err) => {
        console.error('❌ Vapi error:', err);
        setError(err);
        setCallStatus('error');
        onError?.(err);
        toast.error('Call error: ' + err.message);
      });

      return () => {
        vapi.stop();
      };
    } catch (err: any) {
      console.error('❌ Failed to initialize Vapi:', err);
      setError(err);
    }
  }, [publicKey, onCallStart, onCallEnd, onMessage, onError]);

  /**
   * Start a call with an assistant
   */
  const startCall = useCallback(
    async (assistantId: string) => {
      if (!vapiRef.current) {
        toast.error('Vapi not initialized');
        return;
      }

      try {
        setCallStatus('loading');
        setError(null);
        setMessages([]);

        await vapiRef.current.start(assistantId);
        toast.success('Call connected!');
      } catch (err: any) {
        console.error('❌ Failed to start call:', err);
        setError(err);
        setCallStatus('error');
        toast.error('Failed to start call: ' + err.message);
      }
    },
    []
  );

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.stop();
      setCallStatus('ended');
      toast.success('Call ended');
    } catch (err: any) {
      console.error('❌ Failed to end call:', err);
      toast.error('Failed to end call');
    }
  }, []);

  /**
   * Toggle microphone mute
   */
  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
      toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    } catch (err: any) {
      console.error('❌ Failed to toggle mute:', err);
    }
  }, [isMuted]);

  /**
   * Set output volume
   */
  const setVolume = useCallback((newVolume: number) => {
    if (!vapiRef.current) return;

    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      vapiRef.current.setVolume(clampedVolume);
      setVolumeState(clampedVolume);
    } catch (err: any) {
      console.error('❌ Failed to set volume:', err);
    }
  }, []);

  /**
   * Send a text message during call
   */
  const sendMessage = useCallback((message: string) => {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: message,
        },
      });
    } catch (err: any) {
      console.error('❌ Failed to send message:', err);
    }
  }, []);

  return {
    // State
    callStatus,
    isMuted,
    volume,
    messages,
    error,

    // Actions
    startCall,
    endCall,
    toggleMute,
    setVolume,
    sendMessage,

    // Computed
    isCallActive: callStatus === 'active',
  };
}

/**
 * ============================================================================
 * EXAMPLE USAGE
 * ============================================================================
 * 
 * ```tsx
 * 'use client';
 * 
 * import { useVapi } from '@/lib/vapi/hooks';
 * import { Button } from '@/components/ui/button';
 * 
 * export function CallButton({ assistantId }: { assistantId: string }) {
 *   const { startCall, endCall, callStatus, isCallActive } = useVapi({
 *     publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!,
 *     onCallStart: () => console.log('Call started'),
 *     onCallEnd: () => console.log('Call ended'),
 *   });
 * 
 *   return (
 *     <Button
 *       onClick={() => isCallActive ? endCall() : startCall(assistantId)}
 *       variant={isCallActive ? 'destructive' : 'default'}
 *     >
 *       {isCallActive ? 'End Call' : 'Start Call'}
 *       {callStatus === 'loading' && ' (Connecting...)'}
 *     </Button>
 *   );
 * }
 * ```
 */
