'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/handle-api-error';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';
import { Loader2, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

export type MonoContext = {
  route: string;
  selectedDocumentId?: string;
  selectedUnifiedItemId?: string;
  filters?: Record<string, any>;
};

export type MonoPaneProps = {
  context: MonoContext;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function MonoPane({ context }: MonoPaneProps) {
  const { toast } = useToast();
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Maestro, your AI assistant. I can help you organize documents, analyze content, and automate workflows. What would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Get current user ID to pass to API for auth
      let currentUserId: string | null = null;
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          currentUserId = user.id;
        }
      } catch {
        // Ignore errors, will fall back to cookie-based auth
      }

      const response = await fetch('/api/mono', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
          ...(currentUserId && { 'x-user-id': currentUserId }),
        },
        body: JSON.stringify({
          message: currentInput,
          context,
        }),
      });

      const status = response.status;
      let data: any;
      let errorMessage = '';

      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : { ok: false, error: 'Empty response' };
      } catch (parseError) {
        data = { ok: false, error: 'Failed to parse response', rawStatus: status };
      }

      const isError = !response.ok || data?.ok === false;

      if (isError) {
        // Extract error message with fallbacks
        errorMessage = data?.error || data?.message || data?.reason || `Request failed with status ${status}`;

        // Ensure we always have a non-empty error message
        if (!errorMessage || errorMessage.trim() === '') {
          errorMessage = `Request failed with status ${status}`;
        }

        const result = handleApiError({
          status,
          errorMessage,
          toast,
          context: "mono",
        });

        if (result === "auth") {
          // Auth handled by toast; do not append a reply.
          return;
        }

        // Non-auth error: optional friendly assistant fallback message
        const friendlyMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage.includes("not configured")
            ? "I couldn't process that request. Maestro might not be fully configured yet."
            : "I couldn't process that request. Please try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, friendlyMessage]);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'I received your message, but I don\'t have a response yet.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[mono] Unexpected error", error);
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error';

      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;

      const result = handleApiError({
        status,
        errorMessage,
        toast,
        context: "mono",
      });

      if (result === "auth") {
        // Auth handled by toast; do not append a reply.
        return;
      }

      // Non-auth error: add a friendly assistant message
      const friendlyMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, friendlyMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-mono flex items-center justify-center flex-shrink-0">
                  <span className="text-mono-foreground text-sm font-semibold">M</span>
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-4 py-2.5 max-w-[280px]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-mono flex items-center justify-center flex-shrink-0">
                <span className="text-mono-foreground text-sm font-semibold">M</span>
              </div>
              <div className="rounded-lg px-4 py-2.5 bg-muted text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Maestro anything..."
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={handleSend} size="icon" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

