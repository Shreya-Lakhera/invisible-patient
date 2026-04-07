"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import type { CheckinEntry } from "@/lib/store";

const DUMMY_DATA = [
  { day: "Mon", score: 42 },
  { day: "Tue", score: 38 },
  { day: "Wed", score: 55 },
  { day: "Thu", score: 47 },
  { day: "Fri", score: 61 },
  { day: "Sat", score: 53 },
  { day: "Sun", score: 68 },
];

export default function ResonanceChart({ checkins }: { checkins: CheckinEntry[] }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const day = format(subDays(new Date(), 6 - i), "EEE");
    const entry = checkins.find((c) => c.date === date);
    return { day, score: entry ? Math.round(entry.resonanceScore ?? 50) : null };
  });

  const realPoints = last7.filter((d) => d.score !== null).length;
  const useDummy = realPoints < 3;
  const data = useDummy ? DUMMY_DATA : last7.map((d) => ({ day: d.day, score: d.score ?? undefined }));

  return (
    <div className="w-full">
      {useDummy && (
        <p className="text-[10px] text-[#A09890]/40 mb-3 text-right italic">
          Sample data — your trends will appear after a few check-ins
        </p>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="resonanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B2AC88" stopOpacity={0.4} />
              <stop offset="60%" stopColor="#B2AC88" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#B2AC88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            stroke="transparent"
            tick={{ fontSize: 11, fill: "#A09890" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="transparent"
            tick={{ fontSize: 11, fill: "#A09890" }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(178,172,136,0.2)",
              borderRadius: 12,
              color: "#F5F0E8",
              fontSize: 12,
              padding: "8px 12px",
            }}
            cursor={{ stroke: "#B2AC88", strokeOpacity: 0.15, strokeWidth: 1 }}
            formatter={(val) => [`${val}`, "Resonance"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#B2AC88"
            strokeWidth={2}
            fill="url(#resonanceGrad)"
            dot={{ fill: "#B2AC88", r: 4, strokeWidth: 0 }}
            activeDot={{ fill: "#F5F0E8", r: 5, strokeWidth: 0, filter: "drop-shadow(0 0 6px #B2AC88)" }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}