"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconOrb: a lit glass sphere that holds a single icon.
 * Radial light from the top-left, specular highlight, cerulean depth,
 * soft halo on hover. Gives flat line icons a physical, dimensional feel
 * that matches the Deep Signal design system.
 */
export function IconOrb({
  icon: Icon,
  size = 40,
  className,
  glow = true,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <span
      className={cn("icon-orb", glow && "icon-orb-glow", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon
        className="icon-orb-svg"
        style={{ width: Math.round(size * 0.46), height: Math.round(size * 0.46) }}
        strokeWidth={2}
      />
    </span>
  );
}
