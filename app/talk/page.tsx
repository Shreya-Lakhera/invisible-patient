"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Volume2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { analyzeConversation } from "@/lib/analysis";
import {
  saveCheckin,
  saveLastMentalState,
  generateId,
  getTodayDate,
  type Message,
} from "@/lib/store";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import { useRouter } from "next/navigation";

function sanitize(text: string): string {
  return text.replace(/—/g, ",").replace(/–/g, ",").trim();
}

const ZBI_LABELS = ["Never", "Rarely", "Sometimes", "Frequently", "Nearly Always"];

function parseZbiTag(content: string): { clean: string; qIndex: number | null } {
  const match = content.match(/\[ZBI_Q(\d+)\]/);
  if (!match) return { clean: sanitize(content), qIndex: null };

  return {
    clean: sanitize(content.replace(/\[ZBI_Q\d+\]/, "").trim()),
    qIndex: parseInt(match[1], 10) - 1,
  };
}

export default function TalkPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "I'm here whenever you're ready. How are you doing today?",
      timestamp: 0,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => generateId());
  const [crisisTriggered, setCrisisTriggered] = useState(false);
  const [zbiAnswers, setZbiAnswers] = useState<number[]>([]);
  const [pendingZbiQ, setPendingZbiQ] = useState<number>(-1);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    listening,
    supported: sttSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const { speaking, speak, stopSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "I'm here whenever you're ready. How are you doing today?",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingZbiQ]);

  useEffect(() => {
    if (!voiceMode) stopSpeaking();
  }, [voiceMode, stopSpeaking]);

  const canSend =
    pendingZbiQ >= 0
      ? selectedRating !== null && input.trim().length > 0
      : input.trim().length > 0;

  function handleTranscript(text: string) {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    inputRef.current?.focus();
  }



  async function callApiAndStream(
    newMessages: Message[],
    updatedZbiAnswers: number[]
  ) {
    const analysis = analyzeConversation(newMessages, updatedZbiAnswers);

    saveLastMentalState(analysis.mentalState);

    if (analysis.riskLevel === "crisis") {
      setCrisisTriggered(true);
    }

    saveCheckin({
      id: sessionId,
      date: getTodayDate(),
      timestamp: Date.now(),
      messages: newMessages,
      zbiAnswers: updatedZbiAnswers,
      mentalState: analysis.mentalState,
      zbiEstimate: analysis.zbiEstimate,
      resonanceScore: analysis.resonanceScore,
      emotions: analysis.emotions,
      riskLevel: analysis.riskLevel,
    });

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context: {
          zbiAnswers: updatedZbiAnswers,
          riskLevel: analysis.riskLevel,
          dominantThemes: analysis.dominantThemes,
        },
      }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const assistantMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      full += decoder.decode(value, { stream: true });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: sanitize(full) } : m
        )
      );
    }

    setLoading(false);

    const { clean, qIndex } = parseZbiTag(full);

    if (qIndex !== null && qIndex === updatedZbiAnswers.length) {
      setPendingZbiQ(qIndex);
      setSelectedRating(null);
    }

    if (voiceMode) {
      speak(clean);
    }

    const finalMessages = [
      ...newMessages,
      { ...assistantMsg, content: sanitize(full) },
    ];

    saveCheckin({
      id: sessionId,
      date: getTodayDate(),
      timestamp: Date.now(),
      messages: finalMessages,
      zbiAnswers: updatedZbiAnswers,
      mentalState: analysis.mentalState,
      zbiEstimate: analysis.zbiEstimate,
      resonanceScore: analysis.resonanceScore,
      emotions: analysis.emotions,
      riskLevel: analysis.riskLevel,
    });
  }

  async function sendMessage() {
    if (!canSend || loading) return;

    if (listening) stopListening();
    if (speaking) stopSpeaking();

    const text = input.trim();

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content:
        pendingZbiQ >= 0
          ? `[Rating: ${selectedRating} - ${ZBI_LABELS[selectedRating!]}] ${text}`
          : text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    let updatedZbiAnswers = [...zbiAnswers];

    if (pendingZbiQ >= 0 && selectedRating !== null) {
      updatedZbiAnswers = [...zbiAnswers, selectedRating];
      setZbiAnswers(updatedZbiAnswers);
      setPendingZbiQ(-1);
      setSelectedRating(null);
    }

    await callApiAndStream(newMessages, updatedZbiAnswers);
  }

  return (
    <main className="min-h-screen bg-[#090d15] flex flex-col">
      <Navbar />

      <div className="fixed top-16 left-0 right-0 z-40 flex items-center justify-end px-6 py-2.5 bg-[#090d15]/90 backdrop-blur-sm border-b border-white/5">
        {zbiAnswers.length < 12 ? (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i < zbiAnswers.length ? 7 : 5,
                  height: i < zbiAnswers.length ? 7 : 5,
                  backgroundColor:
                    i < zbiAnswers.length ? "#B2AC88" : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-[#B2AC88] tracking-widest uppercase">
            Complete
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full pt-28 pb-40 px-4">
        <div className="flex-1 flex flex-col gap-4 py-4">
          {messages.map((msg) => {
            const { clean, qIndex } = parseZbiTag(msg.content);
            const isActiveZbiMsg =
              qIndex !== null && qIndex === pendingZbiQ && msg.role === "assistant";

            const displayContent =
              msg.role === "user"
                ? clean.replace(/^\[Rating: \d+ - [^\]]+\]\s*/, "")
                : clean;

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                  } gap-3`}
                style={{ animation: "fadeUp 0.3s ease-out forwards" }}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#B2AC88]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${speaking
                        ? "bg-[#B2AC88] animate-pulse scale-110"
                        : "bg-[#B2AC88]/60"
                        }`}
                    />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-3 ${msg.role === "user" ? "items-end" : "items-start"
                    } max-w-sm`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-[#1C3A5E] text-[#E8E4D8] rounded-tr-sm"
                      : "bg-[#111827] text-[#D4CEBD] border border-[#B2AC88]/10 rounded-tl-sm"
                      }`}
                  >
                    {displayContent ||
                      (msg.role === "assistant" && (
                        <span className="inline-flex gap-1 py-0.5">
                          <span
                            className="w-1.5 h-1.5 bg-[#B2AC88] rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-[#B2AC88] rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-[#B2AC88] rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </span>
                      ))}
                  </div>

                  {isActiveZbiMsg && (
                    <div className="flex flex-col gap-2 w-full">
                      <p className="text-xs text-[#A09890]">
                        How often do you feel this way?
                      </p>

                      <div className="flex gap-1.5">
                        {ZBI_LABELS.map((label, val) => (
                          <button
                            key={val}
                            onClick={() => setSelectedRating(val)}
                            disabled={loading}
                            className={`flex flex-col items-center px-2 py-2 rounded-xl text-xs transition-all duration-200 border flex-1 ${selectedRating === val
                              ? "bg-[#B2AC88]/25 border-[#B2AC88]/60 text-[#F5F0E8]"
                              : "border-white/10 text-[#A09890] hover:border-white/25 hover:text-[#D4CEBD]"
                              }`}
                          >
                            <span
                              className="text-base font-light"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {val}
                            </span>
                            <span className="text-[9px] mt-0.5 text-center leading-tight">
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {selectedRating !== null && (
                        <p className="text-xs text-[#B2AC88]/60">
                          Selected: <strong>{ZBI_LABELS[selectedRating]}</strong>.
                          {" "}Now share a few words below, then send.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {crisisTriggered && (
        <div className="fixed bottom-28 left-0 right-0 px-4 z-50">
          <div className="max-w-2xl mx-auto bg-[#1A0D0D] border border-[#8B5A5A]/50 rounded-2xl p-4">
            <p className="text-[#F5F0E8] text-xs font-medium mb-3">
              If you or someone is in immediate danger, please reach out now:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:988"
                className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20 hover:bg-[#8B5A5A]/30 transition-all"
              >
                <span className="text-[#D4CEBD] text-xs">Crisis Lifeline</span>
                <span className="text-[#B2AC88] text-xs font-medium">988</span>
              </a>

              <a
                href="sms:741741"
                className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20 hover:bg-[#8B5A5A]/30 transition-all"
              >
                <span className="text-[#D4CEBD] text-xs">Crisis Text</span>
                <span className="text-[#B2AC88] text-xs font-medium">741741</span>
              </a>

              <a
                href="tel:18552273640"
                className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20 hover:bg-[#8B5A5A]/30 transition-all"
              >
                <span className="text-[#D4CEBD] text-xs">Caregiver Crisis</span>
                <span className="text-[#B2AC88] text-xs font-medium">
                  1-855-227-3640
                </span>
              </a>

              <a
                href="tel:911"
                className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20 hover:bg-[#8B5A5A]/30 transition-all"
              >
                <span className="text-[#D4CEBD] text-xs">Emergency</span>
                <span className="text-[#B2AC88] text-xs font-medium">911</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-[#090d15] via-[#090d15] to-transparent">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {pendingZbiQ >= 0 && (
            <p className="text-xs text-center text-[#A09890]">
              {selectedRating === null
                ? "Select a rating above, then share your thoughts"
                : "Add a few words, then press send"}
            </p>
          )}

          {voiceMode && (
            <div className="flex items-center justify-center gap-2 mb-1 h-5">
              {listening ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#B2AC88] rounded-full animate-bounce"
                        style={{
                          height: `${8 + (i % 3) * 5}px`,
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#B2AC88]">Listening...</span>
                </div>
              ) : speaking ? (
                <div className="flex items-center gap-2">
                  <Volume2 size={12} className="text-[#B2AC88] animate-pulse" />
                  <span className="text-xs text-[#A09890]">Speaking...</span>
                  <button
                    onClick={stopSpeaking}
                    className="text-xs text-[#A09890] hover:text-[#D4CEBD] underline"
                  >
                    stop
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#A09890]">Tap mic to speak</span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                listening
                  ? "Listening..."
                  : pendingZbiQ >= 0 && selectedRating === null
                    ? "Select a rating first..."
                    : "Share what's on your mind..."
              }
              disabled={loading || (pendingZbiQ >= 0 && selectedRating === null)}
              className="flex-1 bg-[#111827] border border-white/10 rounded-2xl px-5 py-3.5 text-[#F5F0E8] placeholder-[#A09890] text-sm outline-none focus:border-[#B2AC88]/40 transition-all disabled:opacity-40"
            />

            {mounted && sttSupported && (
              <button
                onClick={() => router.push("/talk/voice")}
                className="w-12 h-12 rounded-2xl transition-all flex items-center justify-center flex-shrink-0 border bg-white/5 hover:bg-white/10 border-transparent"
                type="button"
              >
                <Mic size={16} className="text-[#A09890]" />
              </button>
            )}

            <button
              onClick={sendMessage}
              disabled={!canSend || loading}
              className="w-12 h-12 rounded-2xl bg-[#B2AC88]/20 hover:bg-[#B2AC88]/30 disabled:opacity-40 transition-all flex items-center justify-center text-[#B2AC88] flex-shrink-0"
              type="button"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}