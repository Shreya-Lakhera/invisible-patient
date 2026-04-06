"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Aura from "@/components/Aura";
import { ensureProfile, getLastMentalState, STATE_LABELS, type MentalState } from "@/lib/store";

export default function HomePage() {
  const [username, setUsername] = useState("CAREGIVER");
  const [state, setState] = useState<MentalState>("restless");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const profile = ensureProfile();
    setUsername(profile.username);
    setState(getLastMentalState());
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <main className="min-h-screen bg-[#090d15] flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 pt-20">
        <div className="text-center" style={{ animation: "fadeUp 0.6s ease-out forwards", opacity: 0 }}>
          <p className="text-xs tracking-[0.25em] text-[#B2AC88] uppercase mb-3">
            {greeting}, {username}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl md:text-5xl text-[#F5F0E8] font-light">
            How are you, really?
          </h1>
        </div>

        <div style={{ animation: "fadeUp 0.6s ease-out 0.2s forwards", opacity: 0 }}>
          <Aura state={state} />
        </div>

        <div className="text-center" style={{ animation: "fadeUp 0.6s ease-out 0.4s forwards", opacity: 0 }}>
          <p className="text-xs tracking-[0.2em] text-[#A09890] uppercase mb-2">Current State</p>
          <p style={{ fontFamily: "var(--font-display)", color: "#B2AC88" }} className="text-3xl font-light italic">
            {STATE_LABELS[state]}
          </p>
        </div>

        <div style={{ animation: "fadeUp 0.6s ease-out 0.6s forwards", opacity: 0 }}>
          <Link href="/talk"
            className="mb-10 flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-[#F5F0E8] text-sm tracking-wide">
            <MessageCircle size={16} className="text-[#B2AC88]" />
            Begin Check-in
          </Link>
        </div>

        {/* <p className="text-xs text-[#A09890] pb-8" style={{ animation: "fadeUp 0.6s ease-out 0.8s forwards", opacity: 0 }}>
          Just talk. We'll listen for what matters.
        </p> */}
      </div>
    </main>
  );
}