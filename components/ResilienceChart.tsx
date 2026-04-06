"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { CheckinEntry } from "@/lib/store";
import { format } from "date-fns";

export default function ResilienceChart({ checkins }: { checkins: CheckinEntry[] }) {
  const data = checkins.map((c) => ({
    day: format(new Date(c.timestamp), "EEE"),
    resilience: Math.round(c.resilience),
    complexity: Math.round(c.complexity),
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-[#A09890] text-sm">
        No data yet — start a check-in
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis dataKey="day" stroke="#A09890" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} stroke="#A09890" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "#0D2137", border: "1px solid #B2AC8830", borderRadius: 8, color: "#F5F0E8", fontSize: 12 }}
          cursor={{ stroke: "#B2AC8830" }}
        />
        <Line type="monotone" dataKey="resilience" stroke="#B2AC88" strokeWidth={2} dot={false} name="Resilience" />
        <Line type="monotone" dataKey="complexity" stroke="#6B8FA3" strokeWidth={2} dot={false} name="Complexity" />
      </LineChart>
    </ResponsiveContainer>
  );
}