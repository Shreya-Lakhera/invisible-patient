export default function NeuralBattery({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 60 ? "#B2AC88" : pct >= 35 ? "#8B8B5A" : "#8B5A5A";
  const label = pct >= 70 ? "Strong" : pct >= 45 ? "Moderate" : "Low";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-16 h-28 rounded-xl border-2 flex flex-col justify-end overflow-hidden"
        style={{ borderColor: `${color}60`, backgroundColor: "#090d15" }}>
        {/* Battery tip */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-2 rounded-sm"
          style={{ backgroundColor: `${color}40` }} />
        {/* Fill */}
        <div className="transition-all duration-1000 rounded-b-lg"
          style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.85 }} />
        {/* Value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-[#F5F0E8]">{pct.toFixed(0)}</span>
        </div>
      </div>
      <div>
        <p className="text-center font-medium text-sm" style={{ color }}>{label}</p>
        <p className="text-center text-xs text-[#A09890] mt-0.5">Resilience Level</p>
      </div>
    </div>
  );
}