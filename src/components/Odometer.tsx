// Digits that roll into place, like an odometer. Each digit is a column of
// 0–9 moved with a transform, so it stays smooth on any phone. On first render
// the columns roll up from 0; later value changes roll from the old digit.

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Odometer({ value, className = "" }: { value: string; className?: string }) {
  const chars = value.split("");
  return (
    <span className={`inline-flex leading-none tabular-nums ${className}`} aria-label={value} role="img">
      {chars.map((ch, i) => {
        const d = Number(ch);
        if (!/\d/.test(ch)) {
          return (
            <span key={i} aria-hidden className="opacity-60">
              {ch}
            </span>
          );
        }
        return (
          <span key={i} aria-hidden className="inline-block h-[1em] overflow-hidden">
            <span
              className="odometer-col flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateY(-${d * 10}%)`, transitionDelay: `${i * 35}ms`, animationDelay: `${i * 60}ms` }}
            >
              {DIGITS.map((n) => (
                <span key={n} className="h-[1em] text-center">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
