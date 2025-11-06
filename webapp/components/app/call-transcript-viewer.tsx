/**
 * ============================================================================
 * CALL TRANSCRIPT VIEWER - Divine Conversation Display
 * ============================================================================
 * Beautiful, readable transcript with AI/User alternation
 * Glassmorphism design with smooth animations
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Clock, DollarSign, Phone, Mail, Download, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { cn } from '@/lib/utils';

interface CallTranscriptViewerProps {
  call: {
    id: string;
    customerNumber: string;
    transcript?: string;
    duration?: string;
    cost?: number;
    status?: string;
    createdAt?: string;
  };
  onClose?: () => void;
  onSendEmail?: (callId: string) => Promise<void>;
}

interface TranscriptLine {
  speaker: 'AI' | 'User';
  text: string;
}

/**
 * Parse transcript string into structured lines
 * Format: "AI: text\nUser: text\nAI: text..."
 */
function parseTranscript(transcript: string): TranscriptLine[] {
  if (!transcript) return [];

  const lines = transcript.split('\n').filter(Boolean);
  const parsed: TranscriptLine[] = [];

  for (const line of lines) {
    if (line.startsWith('AI:')) {
      parsed.push({ speaker: 'AI', text: line.substring(3).trim() });
    } else if (line.startsWith('User:')) {
      parsed.push({ speaker: 'User', text: line.substring(5).trim() });
    }
  }

  return parsed;
}

export function CallTranscriptViewer({ call, onClose, onSendEmail }: CallTranscriptViewerProps) {
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const lines = parseTranscript(call.transcript || '');

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    
    setSendingEmail(true);
    try {
      await onSendEmail(call.id);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl"
      >
        <GlassCard className="flex h-full max-h-[85vh] flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Call Transcript</h2>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {call.customerNumber}
                </span>
                {call.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {call.duration}
                  </span>
                )}
                {call.cost !== undefined && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${call.cost.toFixed(4)}
                  </span>
                )}
                {call.status && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    call.status === 'ended' 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {call.status}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onSendEmail && (
                <FuturisticButton
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  variant="primary"
                  size="sm"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {sendingEmail ? 'Sending...' : 'Email'}
                </FuturisticButton>
              )}
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto p-6 pr-8 space-y-4">
            {lines.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transcript available for this call</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {lines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex gap-4 items-start",
                      line.speaker === 'User' ? "flex-row-reverse" : ""
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      line.speaker === 'AI'
                        ? "bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary"
                        : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400"
                    )}>
                      {line.speaker === 'AI' ? (
                        <Bot className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={cn(
                      "flex-1 max-w-[70%] rounded-2xl p-4 backdrop-blur-sm",
                      line.speaker === 'AI'
                        ? "bg-white/5 border border-white/10"
                        : "bg-primary/10 border border-primary/20"
                    )}>
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {line.speaker}
                      </div>
                      <div className="text-sm leading-relaxed">
                        {line.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-center text-xs text-muted-foreground">
            Call ID: {call.id}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
