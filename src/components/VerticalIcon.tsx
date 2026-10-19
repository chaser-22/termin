import { Bike, Dumbbell, Flower2, LayoutGrid, Scissors, Sparkles, Stethoscope, Trophy, type LucideProps } from "lucide-react";
import type { Vertical } from "@/lib/verticals";

const ICONS = { scissors: Scissors, tooth: Stethoscope, sparkles: Sparkles, flower: Flower2, dumbbell: Dumbbell, trophy: Trophy, bike: Bike, more: LayoutGrid };

export function VerticalIcon({ icon, ...props }: { icon: Vertical["icon"] | "more" } & LucideProps) {
  const Icon = ICONS[icon];
  return <Icon {...props} />;
}
