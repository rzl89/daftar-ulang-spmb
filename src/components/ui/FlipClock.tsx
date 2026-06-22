interface FlipClockProps {
  value: number;
  label: string;
}

export function FlipClock({ value, label }: FlipClockProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-24 md:w-24 md:h-28 glass-card rounded-2xl flex items-center justify-center mb-3 shadow-2xl border-white/40 group overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-transparent opacity-50 z-0 pointer-events-none" />
        
        {/* Number display */}
        <span className="text-4xl md:text-5xl font-black font-heading text-primary z-10 drop-shadow-md tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
        
        {/* Decorative middle line for the "flip clock" look */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary/10 z-20" />
        
        {/* Highlight effect on hover */}
        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-500 z-0" />
      </div>
      <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-white/90 font-bold drop-shadow-sm">
        {label}
      </span>
    </div>
  );
}
