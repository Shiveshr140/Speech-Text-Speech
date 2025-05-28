"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

type Language = "english" | "hindi" | "hinglish";

interface Props {
  originalAudioUrl: string;
  docId: string;
}

// Why Uint8Array used as Type==> Uint8Array is a built-in JavaScript class (constructor function) and Clases are type
// Why do we need this ==> Incoming network data arrives in chunks (Uint8Array).
function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

export default function AudioPlayerWithStreaming({
  originalAudioUrl,
  docId,
}: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<
    Language | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);


  // We have just created references to AudioContext and playback time. which will not cause re-renders and will persist across renders.It will use later below useEffect hooks.
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AudioContext is part of the Web Audio API — a powerful browser API for processing and synthesizing audio in web applications.
  // It allows you to create, manipulate, and play audio in a web application.
  // Why did we clear it ===> when user refresh or close player or select the another audio so you you do not want stale audio you want fresh audio
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    playbackTimeRef.current = audioContextRef.current.currentTime;

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Stop all playing sources on language change
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      playbackTimeRef.current = audioContextRef.current.currentTime;
    }
  }, [selectedLanguage]);

  // This generator function reads from the stream and yields chunks
  async function* readLengthPrefixedChunks(
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) {
    // You keep a buffer to accumulate bytes that you have received but not yet processed.
    // This is important because stream chunks may split length headers or audio data arbitrarily.
    // You need to wait until you have enough bytes to fully parse a chunk.
    let buffer: Uint8Array = new Uint8Array(0);

    function toPlainArrayBuffer(u8: Uint8Array): ArrayBuffer {
      const plainBuffer = new ArrayBuffer(u8.byteLength);
      const plainView = new Uint8Array(plainBuffer);
      plainView.set(u8);
      return plainBuffer;
    }

    // Read from stream asynchronously.
    // If no data or stream ended, handle accordingly.
    // Append new bytes to leftover buffer for processing.
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      // Convert to plain ArrayBuffer and wrap in Uint8Array
      const safeValue = new Uint8Array(toPlainArrayBuffer(value));

      buffer = concatUint8Arrays(buffer, safeValue);

      while (buffer.length >= 4) {
        const length =
          (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];

        if (buffer.length < 4 + length) break;

        const chunk = buffer.slice(4, 4 + length);
        buffer = buffer.slice(4 + length);
        yield chunk;
      }
    }
  }

  const playChunk = async (chunk: Uint8Array) => {
    if (!audioContextRef.current) return;
    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        chunk.buffer as ArrayBuffer
      );
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      if (playbackTimeRef.current < audioContextRef.current.currentTime) {
        playbackTimeRef.current = audioContextRef.current.currentTime + 0.05;
      }
      source.start(playbackTimeRef.current);
      playbackTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(
          (s) => s !== source
        );
      };
    } catch (e) {
      console.error("Error decoding or playing chunk:", e);
    }
  };

  useEffect(() => {
    if (!selectedLanguage || !isStreaming) return;

    setIsLoading(true);
    setError(null);

    // Cancel previous fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Stop and clear current audio sources
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];

    // Reset playback time
    if (audioContextRef.current) {
      playbackTimeRef.current = audioContextRef.current.currentTime;
    }

    const streamAudio = async () => {
      try {
        const response = await fetch("/api/streaming", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioUrl: originalAudioUrl,
            targetLanguage: selectedLanguage,
            docId,
          }),
          signal: controller.signal,
        });

        if (!response.ok)
          throw new Error(`Streaming failed: ${response.statusText}`);

        const reader = response.body!.getReader();
        for await (const chunk of readLengthPrefixedChunks(reader)) {
          if (controller.signal.aborted) break; // Stop reading if aborted
          playChunk(chunk);
        }

        setIsLoading(false);
      } catch (err: any) {
        if (err.name === "AbortError") {
          // fetch aborted: expected when switching language
        } else {
          setError(err.message);
        }
        setIsLoading(false);
      }
    };

    streamAudio();

    // Cleanup when effect re-runs or unmounts
    return () => {
      controller.abort();
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      });
      activeSourcesRef.current = [];
    };
  }, [selectedLanguage, originalAudioUrl, docId, isStreaming]);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    setIsLoading(false);
    setError(null);
    setIsStreaming(false)
  };

  const languageLabels: Record<Language, string> = {
    english: "English",
    hindi: "Hindi",
    hinglish: "Hinglish",
  };

  return (
    <Card className="w-full mt-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">
          Play Streaming in Different Languages
        </h3>

        <Tabs
          value={selectedLanguage}
          onValueChange={(val) => setSelectedLanguage(val as Language)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="english">English</TabsTrigger>
            <TabsTrigger value="hindi">Hindi</TabsTrigger>
            <TabsTrigger value="hinglish">Hinglish</TabsTrigger>
          </TabsList>

          {Object.entries(languageLabels).map(([lang, label]) => (
            <TabsContent key={lang} value={lang} className="py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{label}</h4>
                  {lang !== "english" && (
                    <div className="text-xs text-gray-500">
                      Translated from original
                    </div>
                  )}
                </div>

                {isLoading && isStreaming  && selectedLanguage === lang ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Translating to {label}...</span>
                    <Button
                      onClick={stopStreaming}
                      variant="destructive"
                      className="mt-4 ml-3"
                    >
                      Stop
                    </Button>
                  </div>
                ) : error && selectedLanguage === lang ? (
                  <div className="text-red-500">Error: {error}</div>
                ) : selectedLanguage === lang && !isLoading ? (
                  <Button
                    onClick={() => {
                        setSelectedLanguage(lang as Language)
                        setIsStreaming(true)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Play {label}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSelectedLanguage(lang as Language)}
                    variant="outline"
                    className="w-full"
                  >
                    Translate to {label}
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
