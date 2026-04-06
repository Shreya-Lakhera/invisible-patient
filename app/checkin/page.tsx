"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { saveCheckin, generateId, getTodayDate, getLastMentalState } from "@/lib/store";
import type { FormAnswers } from "@/lib/store";
import { analyzeConversation } from "@/lib/analysis";


const QUESTIONS = [
  { key: "q1", text: "I don't have enough time for myself.", max: 4 },
  { key: "q2", text: "I feel stressed trying to manage caregiving alongside other responsibilities.", max: 4 },
  { key: "q3", text: "I feel angry toward the person I care for.", max: 4 },
  { key: "q4", text: "I feel like I've lost control over my life.", max: 4 },
  { key: "q5", text: "My physical health has suffered because of caregiving.", max: 4 },
  { key: "q6", text: "I feel isolated and cut off from friends or family.", max: 4 },
  { key: "q7", text: "I feel uncertain about the future.", max: 4 },
  { key: "q8", text: "Over the past two weeks, I've felt down, hopeless, or depressed.", max: 3 },
  { key: "q9", text: "Over the past two weeks, I've had little interest or pleasure in things I normally enjoy.", max: 3 },
];

const SCALE_LABELS_4 = ["Never", "Rarely", "Sometimes", "Often", "Always"];
const SCALE_LABELS_3 = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

export default function CheckinFormPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<FormAnswers>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.key as keyof FormAnswers] !== undefined);

  function handleSubmit() {
  if (!allAnswered) return;
  const form = answers as FormAnswers;
  const analysis = analyzeConversation([], []);
  saveCheckin({
    id: generateId(),
    date: getTodayDate(),
    timestamp: Date.now(),
    messages: [],
    formAnswers: form,
    mentalState: getLastMentalState(),
    zbiEstimate: analysis.zbiEstimate,
    zbiAnswers: analysis.zbiAnswers,
    emotions: analysis.emotions,
    riskLevel: analysis.riskLevel,
  });
  setSubmitted(true);
  setTimeout(() => router.push("/insights"), 1500);
}

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#090d15] flex items-center justify-center">
        <Navbar />
        <div className="text-center" style={{ animation: "fadeUp 0.6s ease-out forwards", opacity: 0 }}>
          <p style={{ fontFamily: "var(--font-display)" }} className="text-3xl text-[#F5F0E8] font-light mb-2">Thank you</p>
          <p className="text-[#A09890] text-sm">Your insights are being updated.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090d15] pt-20 pb-12 px-4">
      <Navbar />
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-xs tracking-[0.2em] text-[#B2AC88] uppercase mb-2">Daily Check-in</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl text-[#F5F0E8] font-light">
            How have you been?
          </h1>
          <p className="text-[#A09890] text-sm mt-2">Rate each statement honestly. There are no wrong answers.</p>
        </div>

        <div className="flex flex-col gap-6">
          {QUESTIONS.map((q, i) => {
            const labels = q.max === 3 ? SCALE_LABELS_3 : SCALE_LABELS_4;
            const current = answers[q.key as keyof FormAnswers];
            return (
              <div key={q.key} className="bg-[#0D2137] border border-white/5 rounded-2xl p-5">
                <p className="text-[#D4CEBD] text-sm mb-4 leading-relaxed">
                  <span className="text-[#B2AC88] text-xs mr-2">{i + 1}.</span>
                  {q.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label, val) => (
                    <button key={val}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: val }))}
                      className={`flex-1 min-w-[80px] py-2 px-2 rounded-xl text-xs transition-all duration-200 border ${
                        current === val
                          ? "bg-[#B2AC88]/20 border-[#B2AC88]/50 text-[#F5F0E8]"
                          : "border-white/10 text-[#A09890] hover:border-white/20 hover:text-[#D4CEBD]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="mt-8 w-full py-4 rounded-2xl bg-[#B2AC88]/20 hover:bg-[#B2AC88]/30 disabled:opacity-30 transition-all text-[#F5F0E8] text-sm tracking-wide border border-[#B2AC88]/20">
          Submit Check-in
        </button>
      </div>
    </main>
  );
}