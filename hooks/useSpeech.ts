"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionInstance = any;

export function useSpeechRecognition() {
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const transcriptTimeoutRef = useRef<number | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
    setSupported(ok);

    return () => {
      if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
      if (transcriptTimeoutRef.current) window.clearTimeout(transcriptTimeoutRef.current);
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (transcriptTimeoutRef.current) {
      window.clearTimeout(transcriptTimeoutRef.current);
      transcriptTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    clearTimers();
    setListening(false);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, [clearTimers]);

  const startListening = useCallback(
    ({
      onFinalTranscript,
      onInterimTranscript,
      autoRestart = true,
      silenceMs = 1400,
    }: {
      onFinalTranscript: (text: string) => void;
      onInterimTranscript?: (text: string) => void;
      autoRestart?: boolean;
      silenceMs?: number;
    }) => {
      if (typeof window === "undefined") return;
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) return;

      shouldKeepListeningRef.current = autoRestart;
      clearTimers();
      finalTranscriptRef.current = "";
      setLiveTranscript("");

      try {
        recognitionRef.current?.abort();
      } catch {}

      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (e: any) => {
        let interim = "";
        let finalChunk = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalChunk += text + " ";
          } else {
            interim += text;
          }
        }

        if (finalChunk) {
          finalTranscriptRef.current += finalChunk;
        }

        const combined = `${finalTranscriptRef.current}${interim}`.trim();
        setLiveTranscript(combined);
        onInterimTranscript?.(combined);

        if (transcriptTimeoutRef.current) {
          window.clearTimeout(transcriptTimeoutRef.current);
        }

        if (combined) {
          transcriptTimeoutRef.current = window.setTimeout(() => {
            const finalText = `${finalTranscriptRef.current}${interim}`.trim();
            if (!finalText) return;

            shouldKeepListeningRef.current = false;
            setListening(false);
            setLiveTranscript("");
            finalTranscriptRef.current = "";

            try {
              recognition.stop();
            } catch {}

            onFinalTranscript(finalText);
          }, silenceMs);
        }
      };

      recognition.onerror = (e: any) => {
        setListening(false);

        const benign =
          e?.error === "no-speech" ||
          e?.error === "aborted" ||
          e?.error === "audio-capture";

        if (autoRestart && shouldKeepListeningRef.current && benign) {
          restartTimeoutRef.current = window.setTimeout(() => {
            startListening({
              onFinalTranscript,
              onInterimTranscript,
              autoRestart,
              silenceMs,
            });
          }, 500);
        }
      };

      recognition.onend = () => {
        setListening(false);

        if (autoRestart && shouldKeepListeningRef.current) {
          restartTimeoutRef.current = window.setTimeout(() => {
            startListening({
              onFinalTranscript,
              onInterimTranscript,
              autoRestart,
              silenceMs,
            });
          }, 400);
        }
      };

      try {
        recognition.start();
      } catch {}
    },
    [clearTimers]
  );

  return {
    supported,
    listening,
    liveTranscript,
    startListening,
    stopListening,
  };
}

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
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
      voices.find(
        (v) =>
          v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
      ) ??
      voices.find((v) => v.lang === "en-US") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null
    );
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
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
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      utterance.lang = "en-US";

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onDone?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onDone?.();
      };

      const run = () => {
        const voice = getFemaleVoice();
        if (voice) utterance.voice = voice;
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        run();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          run();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    },
    [getFemaleVoice]
  );

  return { speaking, speak, stopSpeaking };
}