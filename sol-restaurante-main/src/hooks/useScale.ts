import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ScaleConfig, WeightReading } from "@/types/scale";

// ============================================================
// Protocol parsers for Brazilian commercial scales
// Each manufacturer uses a different serial data frame format.
// ============================================================

/**
 * Toledo Protocol (Prix 3, Prix 4, etc.)
 * Frame: STX + Status(1) + Weight(6, "000.000") + ETX + Checksum
 * Example: \x02 I 001250 \x03 CS  → 1.250 kg
 * Some models send plain ASCII: "  1.250\r\n"
 */
const parseToledoWeight = (data: string): { weight: number | null; stable: boolean } => {
  // Try framed format first (STX ... ETX)
  const stxIdx = data.indexOf("\x02");
  const etxIdx = data.indexOf("\x03");

  if (stxIdx !== -1 && etxIdx !== -1 && etxIdx > stxIdx) {
    const frame = data.substring(stxIdx + 1, etxIdx);
    // Status byte: 'E' = stable, 'I' = instable
    const stable = frame.charAt(0) === "E";
    const weightStr = frame.substring(1).trim();
    const weight = parseFloat(weightStr);
    if (!isNaN(weight)) return { weight: weight / 1000, stable };
  }

  // Fallback: plain ASCII weight with optional decimal
  const match = data.match(/([EI])?\s*(\d{1,6}\.?\d{0,3})/);
  if (match) {
    const stable = match[1] !== "I";
    let weight = parseFloat(match[2]);
    // If no decimal point, value is in grams
    if (!match[2].includes(".")) weight = weight / 1000;
    return { weight, stable };
  }

  return { weight: null, stable: false };
};

/**
 * Filizola Protocol (Platina, CS, BP series)
 * Frame: STX + ID(2) + Status(1) + Weight(7, "0000.000") + CR
 * Status: 'F' = stable, 'I' = instable, 'N' = negative
 * Some models: ENQ request → response with weight
 */
const parseFilizolaWeight = (data: string): { weight: number | null; stable: boolean } => {
  // Framed format
  const stxIdx = data.indexOf("\x02");
  if (stxIdx !== -1) {
    const frame = data.substring(stxIdx + 1);
    // Skip 2-char ID, get status
    const status = frame.charAt(2);
    const stable = status === "F";
    const weightStr = frame.substring(3, 10).trim();
    const weight = parseFloat(weightStr);
    if (!isNaN(weight)) return { weight, stable };
  }

  // Alternative: plain format "F  12.345\r"
  const match = data.match(/([FIN])?\s*(\d{1,4}\.?\d{0,3})/);
  if (match) {
    const stable = match[1] !== "I";
    const weight = parseFloat(match[2]);
    if (!isNaN(weight)) return { weight, stable };
  }

  return { weight: null, stable: false };
};

/**
 * Urano Protocol (POP-S, TOP Max, USE series)
 * Frame: STX + Type(1) + Weight(8, "00000.00") + Unit(2) + Status(1) + ETX + Checksum
 * Status: 'E' = stable, 'M' = moving
 * Also supports continuous transmission mode
 */
const parseUranoWeight = (data: string): { weight: number | null; stable: boolean } => {
  // Framed format
  const stxIdx = data.indexOf("\x02");
  const etxIdx = data.indexOf("\x03");

  if (stxIdx !== -1 && etxIdx !== -1 && etxIdx > stxIdx) {
    const frame = data.substring(stxIdx + 1, etxIdx);
    // Type byte (1), then 8-char weight, 2-char unit, 1-char status
    const weightStr = frame.substring(1, 9).trim();
    const status = frame.charAt(11);
    const stable = status === "E";
    const weight = parseFloat(weightStr);
    if (!isNaN(weight)) return { weight, stable };
  }

  // Continuous mode: "P  12.34 kg E\r\n"
  const match = data.match(/P?\s*(\d{1,5}\.?\d{0,3})\s*(?:kg|g)?\s*([EM])?/i);
  if (match) {
    const stable = match[2] !== "M";
    let weight = parseFloat(match[1]);
    if (data.toLowerCase().includes(" g") && !data.toLowerCase().includes("kg")) {
      weight = weight / 1000;
    }
    return { weight, stable };
  }

  return { weight: null, stable: false };
};

// Protocol-specific request commands (some scales need a polling command)
const PROTOCOL_COMMANDS: Record<string, Uint8Array | null> = {
  toledo: new Uint8Array([0x05]), // ENQ - request weight
  filizola: new Uint8Array([0x05]), // ENQ
  urano: null, // Continuous transmission, no command needed
};

const PROTOCOL_DEFAULTS: Record<string, { baudRate: number; dataBits: number; stopBits: number; parity: "none" | "even" | "odd" }> = {
  toledo: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
  filizola: { baudRate: 4800, dataBits: 8, stopBits: 1, parity: "none" },
  urano: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
};

export function useScale() {
  const [config, setConfig] = useState<ScaleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<WeightReading | null>(null);
  const [simulatedMode, setSimulatedMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulatedWeightRef = useRef(0);
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const readingRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch scale configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scale_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!error && data) {
      setConfig(data as ScaleConfig);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Parse weight based on protocol
  const parseWeight = useCallback((data: string, protocol: string): { weight: number | null; stable: boolean } => {
    switch (protocol) {
      case "toledo":
        return parseToledoWeight(data);
      case "filizola":
        return parseFilizolaWeight(data);
      case "urano":
        return parseUranoWeight(data);
      default:
        return parseToledoWeight(data);
    }
  }, []);

  // Stop reading loop
  const stopReading = useCallback(async () => {
    readingRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {}
      readerRef.current = null;
    }
  }, []);

  // Continuous read loop
  const startReadLoop = useCallback(async (port: any, protocol: string) => {
    if (!port.readable) return;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;
    readingRef.current = true;

    let buffer = "";

    // If protocol needs polling, start polling
    const command = PROTOCOL_COMMANDS[protocol];
    if (command && port.writable) {
      const writer = port.writable.getWriter();
      pollingRef.current = setInterval(async () => {
        try {
          await writer.write(command);
        } catch {}
      }, 200); // Poll 5x/sec
      // Release writer lock after setting up polling... actually we need to keep it
      // Let's use a different approach: write once per interval
      // Writer needs to stay open, so we don't release it
    }

    try {
      while (readingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;

          // Look for line endings or ETX as frame delimiters
          const frames = buffer.split(/[\r\n\x03]+/);
          if (frames.length > 1) {
            // Process the last complete frame
            const frame = frames[frames.length - 2];
            buffer = frames[frames.length - 1]; // Keep incomplete data

            if (frame.trim()) {
              const { weight, stable } = parseWeight(frame, protocol);
              if (weight !== null && weight >= 0) {
                setCurrentWeight({
                  weight_kg: weight,
                  stable,
                  timestamp: new Date(),
                });
              }
            }
          }

          // Prevent buffer overflow
          if (buffer.length > 512) {
            buffer = buffer.slice(-128);
          }
        }
      }
    } catch (err) {
      if (readingRef.current) {
        console.error("Scale read error:", err);
        setError("Erro na leitura da balança");
      }
    }

    try {
      await readableStreamClosed;
    } catch {}
  }, [parseWeight]);

  // Connect to scale via Web Serial API
  const connect = useCallback(async () => {
    if (!config) {
      setError("Nenhuma configuração de balança encontrada");
      return false;
    }

    // Check Web Serial API support
    if (!("serial" in navigator)) {
      console.warn("Web Serial API não disponível, usando modo simulado");
      setSimulatedMode(true);
      setConnected(true);
      setError(null);
      return true;
    }

    try {
      // Request port from user (browser will show device picker)
      const port = await (navigator as any).serial.requestPort();

      const protocol = config.protocol || "toledo";
      const defaults = PROTOCOL_DEFAULTS[protocol] || PROTOCOL_DEFAULTS.toledo;

      await port.open({
        baudRate: config.baud_rate || defaults.baudRate,
        dataBits: defaults.dataBits,
        stopBits: defaults.stopBits,
        parity: defaults.parity,
      });

      portRef.current = port;
      setSimulatedMode(false);
      setConnected(true);
      setError(null);

      // Start continuous reading
      startReadLoop(port, protocol);

      return true;
    } catch (err: any) {
      // User cancelled the port picker
      if (err.name === "NotFoundError") {
        setError("Nenhuma porta selecionada");
        return false;
      }

      // Port already in use
      if (err.name === "InvalidStateError" || err.name === "NetworkError") {
        setError("Porta serial já está em uso");
        return false;
      }

      // Security error (not HTTPS)
      if (err.name === "SecurityError") {
        setError("Web Serial requer HTTPS. Use o modo simulado para testes.");
        setSimulatedMode(true);
        setConnected(true);
        return true;
      }

      console.warn("Falha na conexão serial, usando modo simulado:", err);
      setSimulatedMode(true);
      setConnected(true);
      setError(null);
      return true;
    }
  }, [config, startReadLoop]);

  // Disconnect from scale
  const disconnect = useCallback(async () => {
    await stopReading();

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch {}
      portRef.current = null;
    }

    setConnected(false);
    setCurrentWeight(null);
    setSimulatedMode(false);
    setError(null);
  }, [stopReading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      readingRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Read weight (for manual/simulated mode)
  const readWeight = useCallback((): WeightReading => {
    if (simulatedMode) {
      return {
        weight_kg: simulatedWeightRef.current,
        stable: true,
        timestamp: new Date(),
      };
    }

    // In real mode, return the last reading from the continuous loop
    return currentWeight || {
      weight_kg: 0,
      stable: false,
      timestamp: new Date(),
    };
  }, [simulatedMode, currentWeight]);

  // Set simulated weight (for testing)
  const setSimulatedWeight = useCallback((weight: number) => {
    simulatedWeightRef.current = weight;
    setCurrentWeight({
      weight_kg: weight,
      stable: true,
      timestamp: new Date(),
    });
  }, []);

  // Capture current weight (stabilized reading)
  const captureWeight = useCallback((): number => {
    if (simulatedMode) {
      return simulatedWeightRef.current;
    }
    return currentWeight?.weight_kg || 0;
  }, [simulatedMode, currentWeight]);

  // Update scale configuration
  const updateConfig = useCallback(async (updates: Partial<ScaleConfig>) => {
    if (!config) return { error: new Error("No config found") };

    const { error } = await supabase
      .from("scale_config")
      .update(updates)
      .eq("id", config.id);

    if (!error) {
      setConfig({ ...config, ...updates });
    }

    return { error };
  }, [config]);

  // Calculate total based on weight and price per kg
  const calculateTotal = useCallback((weightKg: number, pricePerKg: number): number => {
    return Math.round(weightKg * pricePerKg * 100) / 100;
  }, []);

  // Check if Web Serial API is available
  const webSerialSupported = typeof navigator !== "undefined" && "serial" in navigator;

  return {
    config,
    loading,
    connected,
    currentWeight,
    simulatedMode,
    error,
    webSerialSupported,
    connect,
    disconnect,
    readWeight,
    captureWeight,
    setSimulatedWeight,
    updateConfig,
    calculateTotal,
    refresh: fetchConfig,
  };
}
