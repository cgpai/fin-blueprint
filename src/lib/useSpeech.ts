import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
}

/**
 * Thin wrapper over the Web Speech API. Streams final transcript chunks to
 * `onChunk`; exposes `supported` so the UI can hide the mic gracefully.
 */
export function useSpeech(onChunk: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;
  const supported = Boolean(SpeechRecognitionCtor);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = () => {
    if (!SpeechRecognitionCtor || listening) return;
    setError(null);
    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          onChunkRef.current(result[0].transcript.trim() + ' ');
        }
      }
    };
    recognition.onerror = (event: any) => {
      setError(event?.error === 'not-allowed' ? 'Microphone access was blocked.' : 'Speech recognition hiccup — try again.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { supported, listening, error, start, stop };
}
