"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, X, Volume2 } from "lucide-react";
import { analyzeConversation } from "@/lib/analysis";
import {
  saveCheckin,
  saveLastMentalState,
  generateId,
  getTodayDate,
  type Message,
} from "@/lib/store";

const ZBI_LABELS = ["Never", "Rarely", "Sometimes", "Frequently", "Nearly Always"];

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

function sanitize(text: string): string {
  return text.replace(/—/g, ",").replace(/–/g, ",").trim();
}

function parseZbiTag(content: string): { clean: string; qIndex: number | null } {
  const match = content.match(/\[ZBI_Q(\d+)\]/);
  if (!match) return { clean: sanitize(content), qIndex: null };

  return {
    clean: sanitize(content.replace(/\[ZBI_Q\d+\]/, "").trim()),
    qIndex: parseInt(match[1], 10) - 1,
  };
}

export default function VoicePage() {
  const router = useRouter();

  const initialMessage = useMemo<Message>(
    () => ({
      id: "init",
      role: "assistant",
      content: "I'm here whenever you're ready. How are you doing today?",
      timestamp: 0,
    }),
    []
  );

  const [mounted, setMounted] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [sessionId] = useState(() => generateId());
  const [zbiAnswers, setZbiAnswers] = useState<number[]>([]);
  const [pendingZbiQ, setPendingZbiQ] = useState<number>(-1);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [crisisTriggered, setCrisisTriggered] = useState(false);
  const [greetingSpoken, setGreetingSpoken] = useState(false);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const finalTranscriptRef = useRef("");
  const isProcessingRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const hasRecognition = !!(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      );
      const hasSynthesis = !!window.speechSynthesis;
      setVoiceSupported(hasRecognition && hasSynthesis);
    }

    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "I'm here whenever you're ready. How are you doing today?",
        timestamp: Date.now(),
      },
    ]);

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {}
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function getPreferredVoice(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      "Samantha",
      "Karen",
      "Moira",
      "Fiona",
      "Victoria",
      "Allison",
      "Ava",
      "Susan",
      "Google US English",
      "Microsoft Zira",
    ];

    for (const name of preferred) {
      const match = voices.find((v) => v.name.includes(name));
      if (match) return match;
    }

    return (
      voices.find((v) => v.lang === "en-US") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null
    );
  }

  function speak(text: string, onDone?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onDone?.();
      return;
    }

    window.speechSynthesis.cancel();

    const clean = text
      .replace(/\[ZBI_Q\d+\]/g, "")
      .replace(/\[Rating:.*?\]/g, "")
      .replace(/[*_`#]/g, "")
      .replace(/,+/g, ",")
      .trim();

    if (!clean) {
      onDone?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.08;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    utterance.lang = "en-US";

    utterance.onstart = () => {
      setVoiceState("speaking");
    };

    utterance.onend = () => {
      setVoiceState("idle");
      onDone?.();
    };

    utterance.onerror = () => {
      setVoiceState("idle");
      onDone?.();
    };

    const doSpeak = () => {
      const voice = getPreferredVoice();
      if (voice) utterance.voice = voice;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        doSpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }

  function stopSpeaking() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setVoiceState("idle");
  }

  function startListening() {
    if (typeof window === "undefined") return;
    if (voiceState === "thinking") return;
    if (isProcessingRef.current) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    try {
      recognitionRef.current?.abort();
    } catch {}

    finalTranscriptRef.current = "";
    setTranscript("");

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState("listening");
    };

    recognition.onresult = (e: any) => {
      let interim = "";
      let finalText = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += chunk + " ";
        } else {
          interim += chunk;
        }
      }

      if (finalText) {
        finalTranscriptRef.current += finalText;
      }

      const combined = `${finalTranscriptRef.current}${interim}`.trim();
      setTranscript(combined);
    };

    recognition.onerror = (e: any) => {
      if (e?.error !== "aborted") {
        setVoiceState("idle");
      }
    };

    recognition.onend = () => {
      if (!isProcessingRef.current) {
        setVoiceState("idle");
      }
    };

    recognition.start();
  }

  function stopListeningAndSubmit() {
    if (!recognitionRef.current) return;

    const finalText = transcript.trim();

    try {
      recognitionRef.current.stop();
    } catch {}

    setVoiceState("idle");

    if (!finalText) return;

    void handleFinalTranscript(finalText);
  }

  useEffect(() => {
    if (!mounted || !voiceSupported || greetingSpoken) return;

    const timer = setTimeout(() => {
      speak(initialMessage.content);
      setGreetingSpoken(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [mounted, voiceSupported, greetingSpoken, initialMessage.content]);

  async function handleFinalTranscript(text: string) {
    const cleanedText = text.trim();
    if (!cleanedText) return;
    if (isProcessingRef.current) return;

    if (pendingZbiQ >= 0 && selectedRating === null) {
      return;
    }

    isProcessingRef.current = true;
    setVoiceState("thinking");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content:
        pendingZbiQ >= 0 && selectedRating !== null
          ? `[Rating: ${selectedRating} - ${ZBI_LABELS[selectedRating]}] ${cleanedText}`
          : cleanedText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTranscript("");

    let updatedZbiAnswers = [...zbiAnswers];

    if (pendingZbiQ >= 0 && selectedRating !== null) {
      updatedZbiAnswers = [...zbiAnswers, selectedRating];
      setZbiAnswers(updatedZbiAnswers);
      setPendingZbiQ(-1);
      setSelectedRating(null);
    }

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
      isProcessingRef.current = false;
      setVoiceState("idle");
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

    const { clean, qIndex } = parseZbiTag(full);

    if (qIndex !== null && qIndex === updatedZbiAnswers.length) {
      setPendingZbiQ(qIndex);
      setSelectedRating(null);
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

    speak(clean, () => {
      isProcessingRef.current = false;
      setVoiceState("idle");
    });
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const displayAssistant = lastAssistantMsg
    ? parseZbiTag(lastAssistantMsg.content).clean
    : "";

  const ratingRequired = pendingZbiQ >= 0 && selectedRating === null;
  const canStartTalking =
    voiceSupported && voiceState !== "thinking" && voiceState !== "speaking" && !ratingRequired;
  const canStopTalking = voiceState === "listening";

  return (
    <main className="min-h-screen bg-[#090d15] flex flex-col items-center justify-between px-6 py-8 relative">
      <div className="w-full flex justify-between items-center pt-4">
        <button
          onClick={() => {
            stopSpeaking();
            try {
              recognitionRef.current?.abort();
            } catch {}
            router.push("/talk");
          }}
          className="flex items-center gap-2 text-[#A09890] hover:text-[#D4CEBD] transition-colors text-sm"
          type="button"
        >
          <X size={16} />
          Exit voice
        </button>

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
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-lg">
        {!voiceSupported && mounted ? (
          <div className="text-center px-4">
            <p className="text-[#D4CEBD] text-base leading-relaxed">
              Voice input is not available in this browser. Use Chrome for the best results.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center px-4">
              {voiceState === "thinking" ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#B2AC88] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#B2AC88] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#B2AC88] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <p
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-[#D4CEBD] text-xl font-light leading-relaxed"
                >
                  {displayAssistant}
                </p>
              )}
            </div>

            {pendingZbiQ >= 0 && (
              <div className="w-full flex flex-col gap-3">
                <p className="text-xs text-center text-[#A09890]">
                  How often do you feel this way?
                </p>

                <div className="flex gap-2">
                  {ZBI_LABELS.map((label, val) => (
                    <button
                      key={val}
                      onClick={() => setSelectedRating(val)}
                      className={`flex flex-col items-center px-2 py-3 rounded-2xl text-xs transition-all duration-200 border flex-1 ${
                        selectedRating === val
                          ? "bg-[#B2AC88]/25 border-[#B2AC88]/60 text-[#F5F0E8]"
                          : "border-white/10 text-[#A09890] hover:border-white/25 hover:text-[#D4CEBD]"
                      }`}
                      type="button"
                    >
                      <span
                        className="text-lg font-light"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {val}
                      </span>
                      <span className="text-[9px] mt-1 text-center leading-tight">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedRating !== null ? (
                  <p className="text-xs text-center text-[#B2AC88]/60">
                    Selected: <strong>{ZBI_LABELS[selectedRating]}</strong>. Now click Start talking and answer in words too.
                  </p>
                ) : (
                  <p className="text-xs text-center text-[#A09890]">
                    Select a rating first. Then click Start talking and answer in words.
                  </p>
                )}
              </div>
            )}

            {transcript && (
              <div className="w-full max-w-md rounded-2xl border border-[#B2AC88]/20 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-[#A09890] mb-1">
                  Live transcript
                </p>
                <p className="text-[#D4CEBD] text-sm italic leading-relaxed">
                  {transcript}
                </p>
              </div>
            )}

            {lastUserMsg && !transcript && voiceState !== "listening" && (
              <p className="text-[#A09890]/50 text-xs text-center px-8 truncate max-w-xs">
                You: {lastUserMsg.content.replace(/^\[Rating:.*?\]\s*/, "")}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 pb-8">
        {voiceState === "speaking" && (
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-[#B2AC88] animate-pulse" />
            <span className="text-xs text-[#A09890]">AI speaking...</span>
          </div>
        )}

        {voiceState === "listening" && (
          <div className="flex items-end gap-1 h-6">
            {[0, 1, 2, 3, 4, 3, 2].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#B2AC88] rounded-full animate-bounce"
                style={{ height: `${8 + h * 4}px`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              stopSpeaking();
              startListening();
            }}
            disabled={!canStartTalking}
            className="px-5 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 bg-[#B2AC88]/20 hover:bg-[#B2AC88]/30 border border-[#B2AC88]/30 text-[#F5F0E8]"
            type="button"
          >
            <Mic size={18} className="text-[#B2AC88]" />
            Start talking
          </button>

          <button
            onClick={stopListeningAndSubmit}
            disabled={!canStopTalking}
            className="px-5 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 bg-[#8B5A5A]/20 hover:bg-[#8B5A5A]/30 border border-[#8B5A5A]/30 text-[#F5F0E8]"
            type="button"
          >
            <MicOff size={18} className="text-[#D4CEBD]" />
            Stop talking
          </button>
        </div>

        <p className="text-xs text-[#A09890] text-center">
          {!voiceSupported
            ? "Voice input unavailable in this browser"
            : ratingRequired
            ? "Choose a rating first, then start talking"
            : voiceState === "idle"
            ? "Click Start talking when you're ready"
            : voiceState === "listening"
            ? "Speak freely, then click Stop talking"
            : voiceState === "thinking"
            ? "Processing..."
            : "AI is speaking"}
        </p>
      </div>

      {crisisTriggered && (
        <div className="absolute inset-x-4 top-20 z-50">
          <div className="bg-[#1A0D0D] border border-[#8B5A5A]/50 rounded-2xl p-4">
            <p className="text-[#F5F0E8] text-xs font-medium mb-3">
              Please reach out for immediate support:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <a href="tel:988" className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20">
                <span className="text-[#D4CEBD] text-xs">Crisis Lifeline</span>
                <span className="text-[#B2AC88] text-xs font-medium">988</span>
              </a>
              <a href="sms:741741" className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20">
                <span className="text-[#D4CEBD] text-xs">Crisis Text</span>
                <span className="text-[#B2AC88] text-xs font-medium">741741</span>
              </a>
              <a href="tel:18552273640" className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20">
                <span className="text-[#D4CEBD] text-xs">Caregiver Crisis</span>
                <span className="text-[#B2AC88] text-xs font-medium">1-855-227-3640</span>
              </a>
              <a href="tel:911" className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#8B5A5A]/20">
                <span className="text-[#D4CEBD] text-xs">Emergency</span>
                <span className="text-[#B2AC88] text-xs font-medium">911</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}