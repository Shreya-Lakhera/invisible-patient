"use client";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getLatestCheckin, type CheckinEntry } from "@/lib/store";

export default function InsightsPage() {
  const [latest, setLatest] = useState<CheckinEntry | null>(null);

  useEffect(() => {
    setLatest(getLatestCheckin());
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
          {/* <p className="text-[#A09890] text-sm max-w-lg">
            These patterns are gathered silently from your conversations — no forms, no quizzes. Just your words, understood.
          </p> */}
        </div>

        {latest ? (
          <>
            {/* ZBI only */}
            <div className="mb-6 max-w-xs">
              <div className="bg-[#0D2137] border border-white/5 rounded-2xl p-5">
                <p className="text-[#A09890] text-xs tracking-widest uppercase mb-3">ZBI Estimate</p>
                <p style={{ fontFamily: "var(--font-display)", color: "#B2AC88" }} className="text-4xl font-light">
                  {Math.round(latest.zbiEstimate)}
                  <span className="text-lg text-[#A09890]">/48</span>
                </p>
                <p className="text-[#A09890] text-xs mt-2">
                  {(latest.zbiAnswers ?? []).length < 12
                    ? `Based on ${(latest.zbiAnswers ?? []).length} of 12 questions answered`
                    : "Based on all 12 questions"}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-[#0D2137] border border-white/5 rounded-2xl p-6 flex items-center gap-4 max-w-sm">
              <div className="w-10 h-10 rounded-full bg-[#B2AC88]/10 flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-[#B2AC88]" />
              </div>
              {latest.riskLevel === "crisis" ? (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm">Reach Out Now</p>
                  <p className="text-[#A09890] text-xs mt-0.5">
                    <a href="tel:18884436933" className="text-[#B2AC88] hover:underline">Call 1-888-443-6933</a>
                  </p>
                </div>
              ) : latest.riskLevel === "high" ? (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm">Elevated Burden Detected</p>
                  <p className="text-[#A09890] text-xs mt-0.5">Consider speaking to a caregiver support specialist.</p>
                </div>
              ) : latest.riskLevel === "moderate" ? (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm">Some Strain Detected</p>
                  <p className="text-[#A09890] text-xs mt-0.5">Keep checking in — patterns become clearer over time.</p>
                </div>
              ) : (
                <div>
                  <p className="text-[#F5F0E8] font-medium text-sm">You're Holding Steady</p>
                  <p className="text-[#A09890] text-xs mt-0.5">No crisis indicators detected. Keep checking in.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-[#A09890]">
            <p className="mb-2">No Check-ins yet.</p>
            <a href="/talk" className="text-[#B2AC88] text-sm hover:underline">Start your first conversation →</a>
          </div>
        )}
      </div>
    </main>
  );
}