// Small shared hooks. Kept out of App.tsx so Fast Refresh keeps working.

import { useSyncExternalStore } from "react";
import { audio, type AudioSettings } from "./audio";

export function useAudioSettings(): [AudioSettings, (p: Partial<AudioSettings>) => void] {
  const settings = useSyncExternalStore(
    (fn) => audio.subscribe(fn),
    () => audio.settings,
    () => audio.settings,
  );
  return [settings, (p) => audio.setSettings(p)];
}
