'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ProductAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Ask me anything about our products, prices, ingredients, or nutrition info!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-800/50 px-6 py-4">
        <h3 className="text-lg font-semibold">Product Assistant</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                msg.type === 'user'
                  ? 'bg-teal-800/60 text-teal-100'
                  : 'bg-zinc-800/60 text-zinc-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/60 text-zinc-100 rounded-2xl px-4 py-2">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-800/50 px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about our products..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-teal-600 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="rounded-lg border border-teal-700 bg-teal-800/70 px-4 py-2 text-sm font-medium hover:bg-teal-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
