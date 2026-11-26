import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AlertConfig {
  id: string;
  key: string;
  enabled: boolean;
}

// Generate simple beep sounds using Web Audio API
function createBeep(frequency: number, duration: number, volume = 0.3): () => void {
  return () => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.value = volume;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio not supported
    }
  };
}

// Different sounds for different events
const SOUNDS = {
  new_online_order: () => {
    // Triple beep - urgent
    const play = createBeep(880, 0.15, 0.4);
    play();
    setTimeout(play, 200);
    setTimeout(play, 400);
  },
  new_tab_opened: () => {
    // Single soft beep
    createBeep(660, 0.2, 0.2)();
  },
  item_to_kitchen: () => {
    // Double beep
    const play = createBeep(440, 0.1, 0.3);
    play();
    setTimeout(play, 150);
  },
};

export function useSoundAlerts() {
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const configsRef = useRef<AlertConfig[]>([]);

  const fetchConfigs = useCallback(async () => {
    const { data, error } = await supabase
      .from("alert_config")
      .select("*");

    if (!error && data) {
      const typed = data as AlertConfig[];
      setConfigs(typed);
      configsRef.current = typed;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const playSound = useCallback((key: keyof typeof SOUNDS) => {
    const config = configsRef.current.find((c) => c.key === key);
    if (config && config.enabled) {
      SOUNDS[key]();
    }
  }, []);

  const toggleAlert = useCallback(async (key: string, enabled: boolean) => {
    const { error } = await supabase
      .from("alert_config")
      .update({ enabled, updated_at: new Date().toISOString() } as any)
      .eq("key", key);

    if (!error) {
      setConfigs((prev) => {
        const updated = prev.map((c) => (c.key === key ? { ...c, enabled } : c));
        configsRef.current = updated;
        return updated;
      });
    }
    return { error };
  }, []);

  return {
    configs,
    loading,
    playSound,
    toggleAlert,
    refresh: fetchConfigs,
  };
}
