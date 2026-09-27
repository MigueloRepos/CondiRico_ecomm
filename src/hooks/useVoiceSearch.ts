import { useState, useEffect, useCallback, useRef } from "react";
import { CategoryId } from "@/data/products";

// Declarations for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface VoiceCommandResult {
  rawTranscript: string;
  cleanQuery: string;
  action?: "search" | "navigate_store" | "navigate_offers" | "category" | "clear";
  targetCategory?: CategoryId;
}

interface UseVoiceSearchOptions {
  onResult?: (result: VoiceCommandResult) => void;
  onError?: (error: string) => void;
  autoStopDelay?: number;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { onResult, onError, autoStopDelay = 1800 } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalProcessedRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRec));
  }, []);

  // Parse voice commands in Spanish
  const parseCommand = useCallback((text: string): VoiceCommandResult => {
    const lower = text.toLowerCase().trim();

    // 1. Navigation Commands
    if (
      lower.includes("ir a la tienda") ||
      lower.includes("ver la tienda") ||
      lower.includes("abrir tienda") ||
      lower.includes("ir a tienda")
    ) {
      return { rawTranscript: text, cleanQuery: "", action: "navigate_store" };
    }

    if (
      lower.includes("ver ofertas") ||
      lower.includes("ir a ofertas") ||
      lower.includes("mostrar ofertas") ||
      lower.includes("descuentos")
    ) {
      return { rawTranscript: text, cleanQuery: "", action: "navigate_offers" };
    }

    // 2. Clear / Reset
    if (
      lower === "limpiar" ||
      lower === "borrar" ||
      lower === "limpiar búsqueda" ||
      lower === "borrar búsqueda"
    ) {
      return { rawTranscript: text, cleanQuery: "", action: "clear" };
    }

    // 3. Category Specific Navigation
    if (lower.includes("categoría alimentos") || lower.includes("ver alimentos")) {
      return { rawTranscript: text, cleanQuery: "alimentos", action: "category", targetCategory: "alimentos" };
    }
    if (lower.includes("categoría limpieza") || lower.includes("ver limpieza") || lower.includes("productos de limpieza")) {
      return { rawTranscript: text, cleanQuery: "limpieza", action: "category", targetCategory: "limpieza" };
    }
    if (lower.includes("primera necesidad") || lower.includes("básicos") || lower.includes("despensa básica")) {
      return { rawTranscript: text, cleanQuery: "primera necesidad", action: "category", targetCategory: "primera-necesidad" };
    }
    if (lower.includes("categoría útiles") || lower.includes("útiles del hogar") || lower.includes("ver útiles")) {
      return { rawTranscript: text, cleanQuery: "útiles", action: "category", targetCategory: "utiles" };
    }

    // 4. Query extraction by removing conversational filler
    let clean = lower;
    const prefixes = [
      /^busca\s+/i,
      /^buscar\s+/i,
      /^encuentra\s+/i,
      /^encontrar\s+/i,
      /^quiero\s+comprar\s+/i,
      /^quiero\s+/i,
      /^dame\s+/i,
      /^muéstrame\s+/i,
      /^muestrame\s+/i,
      /^ver\s+/i,
      /^poner\s+/i,
      /^agregar\s+/i,
    ];

    for (const prefix of prefixes) {
      if (prefix.test(clean)) {
        clean = clean.replace(prefix, "").trim();
        break;
      }
    }

    // Remove punctuation
    clean = clean.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();

    return {
      rawTranscript: text,
      cleanQuery: clean || text,
      action: "search",
    };
  }, []);

  const stopListening = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript("");
    setInterimTranscript("");
    finalProcessedRef.current = false;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      const err = "El reconocimiento de voz no está soportado en este navegador. Te sugerimos usar Chrome, Edge o Safari.";
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    // Cancel existing recognition instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-ES";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        if ("vibrate" in navigator) {
          try {
            navigator.vibrate(40);
          } catch {
            // Ignore
          }
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = "";
        let finalResult = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalResult += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        const effectiveText = (finalResult || currentInterim).trim();

        if (effectiveText) {
          setTranscript(effectiveText);

          // Reset auto stop timer on sound
          if (autoStopTimerRef.current) {
            clearTimeout(autoStopTimerRef.current);
          }

          autoStopTimerRef.current = setTimeout(() => {
            if (!finalProcessedRef.current && effectiveText) {
              finalProcessedRef.current = true;
              const parsed = parseCommand(effectiveText);
              onResult?.(parsed);
              stopListening();
            }
          }, autoStopDelay);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let msg = "Error en el reconocimiento de voz.";
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          msg = "Permiso de micrófono denegado. Por favor, habilita el micrófono en los permisos de tu navegador.";
        } else if (event.error === "no-speech") {
          msg = "No se detectó audio. Intenta hablar más cerca del micrófono.";
        } else if (event.error === "network") {
          msg = "Error de red al procesar el audio.";
        }

        setErrorMessage(msg);
        onError?.(msg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      const err = "No se pudo iniciar el micrófono: " + (e instanceof Error ? e.message : "Error desconocido");
      setErrorMessage(err);
      onError?.(err);
      setIsListening(false);
    }
  }, [autoStopDelay, onError, onResult, parseCommand, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript: transcript || interimTranscript,
    interimTranscript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    parseCommand,
    resetTranscript: () => {
      setTranscript("");
      setInterimTranscript("");
      setErrorMessage(null);
    },
  };
}
