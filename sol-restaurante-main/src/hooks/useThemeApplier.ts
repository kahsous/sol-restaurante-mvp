import { useEffect } from "react";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

/**
 * Converts a hex color (#rrggbb) to HSL string "h s% l%"
 * suitable for CSS variable usage.
 */
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useThemeApplier() {
  const { settings, loading } = useRestaurantSettings();

  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;

    if (settings.primary_color) {
      const hsl = hexToHsl(settings.primary_color);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
      }
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    }

    if (settings.accent_color) {
      const hsl = hexToHsl(settings.accent_color);
      if (hsl) {
        root.style.setProperty("--accent", hsl);
      }
    } else {
      root.style.removeProperty("--accent");
    }
  }, [settings.primary_color, settings.accent_color, loading]);
}
