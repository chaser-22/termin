import { Bike, Dumbbell, Flower2, Scissors, Stethoscope, Trophy, type LucideProps } from "lucide-react";
import type { Vertical } from "@/lib/verticals";

const ICONS = { scissors: Scissors, tooth: Stethoscope, flower: Flower2, dumbbell: Dumbbell, trophy: Trophy, bike: Bike };

export function VerticalIcon({ icon, ...props }: { icon: Vertical["icon"] } & LucideProps) {
  const Icon = ICONS[icon];
  return <Icon {...props} />;
}
