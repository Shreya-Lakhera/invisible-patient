"use client";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import ResonanceBattery from "@/components/ResonanceBattery";
import ResonanceChart from "@/components/ResonanceChart";
import { getLatestCheckin, getLast7DaysCheckins, type CheckinEntry } from "@/lib/store";

export default function InsightsPage() {
  const [latest, setLatest] = useState<CheckinEntry | null>(null);
  const [week, setWeek] = useState<CheckinEntry[]>([]);

  useEffect(() => {
    setLatest(getLatestCheckin());
    setWeek(getLast7DaysCheckins());
  }, []);

  return (
    <main className="min-h-screen bg-[#090d15] pt-20 px-4 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8" style={{ animation: "fadeUp 0.6s ease-out forwards", opacity: 0 }}>
          <p className="text-xs tracking-[0.2em] text-[#B2AC88] uppercase mb-2">Your Insights</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl text-[#F5F0E8] font-light mb-3">
            The Quiet Picture
          </h1>
          <p className="text-[#A09890] text-sm max-w-lg">
            These patterns are gathered silently from your conversations. No forms, no quizzes. Just your words, understood.
          </p>
        </div>

        {latest ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#111827] border border-[#B2AC88]/10 rounded-2xl p-6">
                <p className="text-[#A09890] text-xs tracking-widest uppercase mb-3">ZBI Estimate</p>
                <p style={{ fontFamily: "var(--font-display)", color: "#B2AC88" }} className="text-5xl font-light mb-2">
                  {Math.round(latest.zbiEstimate)}
                  <span className="text-xl text-[#A09890]">/48</span>
                </p>
                <p className="text-[#A09890] text-xs mb-4">
                  {(latest.zbiAnswers ?? []).length < 12
                    ? `Based on ${(latest.zbiAnswers ?? []).length} of 12 questions`
                    : "All 12 questions answered"}
                </p>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(latest.zbiEstimate / 48) * 100}%`,
                      backgroundColor: latest.zbiEstimate >= 36 ? "#8B5A5A"
                        : latest.zbiEstimate >= 24 ? "#8B8B5A"
                        : "#B2AC88",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#A09890]/60 mt-1">
                  <span>Low burden</span>
                  <span>Severe burden</span>
                </div>
              </div>

              <div className="bg-[#111827] border border-[#B2AC88]/10 rounded-2xl p-6 flex flex-col items-center">
                <p className="text-[#A09890] text-xs tracking-widest uppercase mb-4 self-start">Resonance Score</p>
                <ResonanceBattery value={latest.resonanceScore ?? 50} />
              </div>
            </div>

            <div className="bg-[#111827] border border-[#B2AC88]/10 rounded-2xl p-6">
              <p className="text-[#A09890] text-xs tracking-widest uppercase mb-4">Resonance — Last 7 Days</p>
              <ResonanceChart checkins={week} />
            </div>

            <div className="bg-[#111827] border border-[#B2AC88]/10 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#B2AC88]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield size={18} className="text-[#B2AC88]" />
              </div>
              {latest.riskLevel === "crisis" ? (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm mb-2">Please Reach Out Now</p>
                  <div className="flex flex-col gap-1.5">
                    <a href="tel:988" className="text-xs text-[#B2AC88] hover:underline">988 — Suicide & Crisis Lifeline (24/7)</a>
                    <a href="sms:741741" className="text-xs text-[#B2AC88] hover:underline">Text HOME to 741741 — Crisis Text Line</a>
                    <a href="tel:18552273640" className="text-xs text-[#B2AC88] hover:underline">1-855-227-3640 — Caregiver Crisis Line</a>
                    <a href="tel:911" className="text-xs text-[#B2AC88] hover:underline">911 — Emergency Services</a>
                  </div>
                </div>
              ) : latest.riskLevel === "high" ? (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm mb-1">Elevated Burden Detected</p>
                  <p className="text-[#A09890] text-xs">Consider speaking to a specialist. Caregiver helpline: <a href="tel:18884436933" className="text-[#B2AC88] hover:underline">1-888-443-6933</a></p>
                </div>
              ) : latest.riskLevel === "moderate" ? (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm mb-1">Some Strain Detected</p>
                  <p className="text-[#A09890] text-xs">Keep checking in. Patterns become clearer over time.</p>
                </div>
              ) : (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm mb-1">You're Holding Steady</p>
                  <p className="text-[#A09890] text-xs">No crisis indicators. Keep checking in, your words matter.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-[#A09890]">
            <p className="mb-2">No check-ins yet.</p>
            <a href="/talk" className="text-[#B2AC88] text-sm hover:underline">Start your first conversation</a>
          </div>
        )}
      </div>
    </main>
  );
}