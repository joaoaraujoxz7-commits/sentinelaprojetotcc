import type { AccessibilityPreferences } from "./auth";

export function applyAccessibilityPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.style.fontSize = `${preferences.textScale}%`;
  root.classList.toggle("a11y-high-contrast", preferences.highContrast);
  root.classList.toggle("a11y-reduce-motion", preferences.reduceMotion);
  root.classList.toggle("a11y-screen-reader", preferences.screenReader);
}
