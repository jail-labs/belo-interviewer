"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type InterviewState = "landing" | "setup" | "interview" | "complete";

export default function Home() {
  const [state, setState] = useState<InterviewState>("landing");
  const [respondentId, setRespondentId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Timer
  useEffect(() => {
    if (startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sendMessage = useCallback(
    async (userMessage?: string) => {
      const text = userMessage || input.trim();
      if (!text || isStreaming) return;

      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: text },
      ];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setStreamingText(accumulated);
                }
              } catch {
                // skip parse errors
              }
            }
          }
        }

        setMessages([
          ...newMessages,
          { role: "assistant", content: accumulated },
        ]);
        setStreamingText("");
      } catch (error) {
        console.error("Chat error:", error);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Could you try again?",
          },
        ]);
        setStreamingText("");
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, messages]
  );

  const startInterview = async () => {
    setState("interview");
    setStartTime(Date.now());
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                "[The respondent has joined and consented to the interview. Begin your introduction.]",
            },
          ],
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamingText(accumulated);
              }
            } catch {
              // skip
            }
          }
        }
      }

      setMessages([{ role: "assistant", content: accumulated }]);
      setStreamingText("");
    } catch (error) {
      console.error("Start error:", error);
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! Thanks for being here. I'm having a small technical issue — give me a moment and let's try again.",
        },
      ]);
      setStreamingText("");
    } finally {
      setIsStreaming(false);
    }
  };

  const endInterview = () => {
    setState("complete");
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const exportTranscript = async () => {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, respondentId }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `belo-interview-${respondentId || "anon"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Landing page
  if (state === "landing") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Logo area */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[var(--color-belo-teal)]" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-belo-teal)]">
                Belo Medical Group
              </span>
              <div className="w-2 h-2 rounded-full bg-[var(--color-belo-teal)]" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-semibold mb-4 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Campaign Research
              <br />
              <span className="text-[var(--color-belo-teal)]">Interview</span>
            </h1>
            <p className="text-[var(--color-belo-navy)]/60 text-sm leading-relaxed max-w-sm mx-auto">
              A conversation about skincare, beauty, and what matters to you.
              There are no right or wrong answers.
            </p>
          </div>

          {/* Info cards */}
          <div className="space-y-3 mb-10">
            {[
              {
                icon: "🕐",
                text: "Takes about 30 minutes",
              },
              {
                icon: "🔒",
                text: "Everything you share is completely anonymous",
              },
              {
                icon: "💬",
                text: "Just a casual chat — answer however feels natural",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/60 rounded-2xl px-5 py-4 border border-[var(--color-belo-navy)]/5"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-[var(--color-belo-navy)]/70">
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setState("setup")}
            className="w-full py-4 rounded-2xl text-white font-medium text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "var(--color-belo-teal)" }}
          >
            I&apos;m ready to start
          </button>
        </div>
      </div>
    );
  }

  // Setup — consent + optional name
  if (state === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <button
            onClick={() => setState("landing")}
            className="mb-8 text-sm text-[var(--color-belo-navy)]/40 hover:text-[var(--color-belo-navy)]/70 transition-colors"
          >
            ← Back
          </button>

          <h2
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Before we begin
          </h2>
          <p className="text-sm text-[var(--color-belo-navy)]/60 mb-8">
            Just a couple of things to set up.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-belo-navy)]/50 mb-2">
                Your first name or nickname (optional)
              </label>
              <input
                type="text"
                value={respondentId}
                onChange={(e) => setRespondentId(e.target.value)}
                placeholder="e.g., Mia"
                className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-belo-navy)]/10 text-sm focus:outline-none focus:border-[var(--color-belo-teal)] focus:ring-1 focus:ring-[var(--color-belo-teal)]/20 transition-all placeholder:text-[var(--color-belo-navy)]/25"
              />
              <p className="mt-1.5 text-xs text-[var(--color-belo-navy)]/40">
                Just so the conversation feels more natural. This won&apos;t be
                linked to your identity.
              </p>
            </div>

            <div className="bg-white/60 rounded-2xl p-5 border border-[var(--color-belo-navy)]/5">
              <h3 className="text-sm font-semibold mb-2">Consent</h3>
              <p className="text-xs text-[var(--color-belo-navy)]/60 leading-relaxed">
                By proceeding, you agree that your responses will be used
                anonymously for marketing research purposes. Your answers will be
                recorded as text. No personal identifying information will be
                stored or shared. You can stop the interview at any time.
              </p>
            </div>

            <button
              onClick={startInterview}
              className="w-full py-4 rounded-2xl text-white font-medium text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "var(--color-belo-teal)" }}
            >
              I agree — let&apos;s go
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete
  if (state === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="text-5xl mb-6">✨</div>
          <h2
            className="text-3xl font-semibold mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Thank you!
          </h2>
          <p className="text-sm text-[var(--color-belo-navy)]/60 mb-2">
            Interview duration: {formatTime(elapsed)}
          </p>
          <p className="text-sm text-[var(--color-belo-navy)]/60 mb-8">
            {messages.length} messages exchanged
          </p>

          <div className="space-y-3">
            <button
              onClick={exportTranscript}
              className="w-full py-4 rounded-2xl text-white font-medium text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "var(--color-belo-teal)" }}
            >
              Download Transcript
            </button>
            <button
              onClick={() => {
                setMessages([]);
                setInput("");
                setElapsed(0);
                setStartTime(null);
                setRespondentId("");
                setState("landing");
              }}
              className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide border border-[var(--color-belo-navy)]/10 text-[var(--color-belo-navy)]/60 hover:bg-white/50 transition-all"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview chat
  return (
    <div className="h-screen flex flex-col bg-[var(--color-belo-cream)]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[var(--color-belo-navy)]/5 bg-white/70 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-belo-teal)] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">B</span>
            </div>
            <div>
              <p className="text-sm font-medium">Belo Research</p>
              <p className="text-xs text-[var(--color-belo-navy)]/40">
                {isStreaming ? (
                  <span className="text-[var(--color-belo-teal)]">
                    typing...
                  </span>
                ) : (
                  `${formatTime(elapsed)} elapsed`
                )}
              </p>
            </div>
          </div>
          <button
            onClick={endInterview}
            className="text-xs font-medium px-4 py-2 rounded-full border border-[var(--color-belo-coral)]/20 text-[var(--color-belo-coral)] hover:bg-[var(--color-belo-coral)]/5 transition-colors"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`msg-enter flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--color-belo-navy)] text-white rounded-br-md"
                    : "bg-white text-[var(--color-belo-navy)] border border-[var(--color-belo-navy)]/5 rounded-bl-md shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingText && (
            <div className="flex justify-start msg-enter">
              <div className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-white text-[var(--color-belo-navy)] border border-[var(--color-belo-navy)]/5 shadow-sm text-sm leading-relaxed">
                <p className="whitespace-pre-wrap">{streamingText}</p>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingText && (
            <div className="flex justify-start msg-enter">
              <div className="rounded-2xl rounded-bl-md px-5 py-4 bg-white border border-[var(--color-belo-navy)]/5 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="typing-dot w-2 h-2 rounded-full bg-[var(--color-belo-teal)]" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-[var(--color-belo-teal)]" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-[var(--color-belo-teal)]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[var(--color-belo-navy)]/5 bg-white/70 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                rows={1}
                className="w-full resize-none rounded-2xl border border-[var(--color-belo-navy)]/10 bg-[var(--color-belo-cream)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-belo-teal)] focus:ring-1 focus:ring-[var(--color-belo-teal)]/20 transition-all placeholder:text-[var(--color-belo-navy)]/25"
                disabled={isStreaming}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30"
              style={{
                background:
                  input.trim() && !isStreaming
                    ? "var(--color-belo-teal)"
                    : "var(--color-belo-navy)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-[var(--color-belo-navy)]/25 mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
