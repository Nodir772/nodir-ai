"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/components/chat/ChatProvider";
import { ttsUnavailableMessage } from "@/lib/voice/config";

type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

const STATUS: Record<VoiceState, string> = {
  idle: "Mikrofonni bosing",
  listening: "Men sizni tinglayapman",
  processing: "Javob tayyorlanmoqda",
  speaking: "Javob o'qilmoqda",
  error: "Xatolik yuz berdi",
};

export function VoiceStudio() {
  const { sendMessage, generating, streaming, settings, updateSettings, active } = useChat();
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [ttsConfigured, setTtsConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void fetch("/api/voice/tts")
      .then((response) => response.json())
      .then((json: { configured?: boolean }) => setTtsConfigured(Boolean(json.configured)))
      .catch(() => setTtsConfigured(false));
  }, []);

  function startListen() {
    const Ctor =
      (window as Window & { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec })
        .SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;
    if (!Ctor) {
      setState("error");
      setError("Ovozli kiritish ushbu brauzerda qo'llab-quvvatlanmaydi.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "uz-UZ";
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(text);
    };
    recognition.onerror = () => {
      setState("error");
      setError("Ovozni aniqlab bo'lmadi.");
    };
    recognition.onend = () => {
      setState("idle");
    };
    setError(null);
    setState("listening");
    recognition.start();
  }

  async function send() {
    const text = transcript.trim();
    if (!text) return;
    setState("processing");
    const ok = await sendMessage(text, []);
    if (!ok) {
      setState("error");
      setError("Internet aloqasida muammo yuz berdi. Qayta urinib ko'ring.");
      return;
    }
    setTranscript("");
    setState("idle");
  }

  async function speak(text: string) {
    if (ttsConfigured === false) {
      setError(ttsUnavailableMessage());
      setState("idle");
      return;
    }
    setState("speaking");
    try {
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: settings.voiceId, speed: settings.voiceSpeed }),
      });
      if (response.status === 503) {
        setError(ttsUnavailableMessage());
        setState("idle");
        return;
      }
      if (!response.ok) {
        setState("error");
        setError("Xizmatda vaqtinchalik muammo yuz berdi.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setHasAudio(true);
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setState("error");
      setError("Ovozni ijro etib bo'lmadi.");
    }
  }

  const lastAssistant = [...(active?.messages ?? [])].reverse().find((message) => message.role === "assistant");

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center px-4 py-10 text-center">
      <Logo showWordmark={false} size="lg" />
      <p className="mt-6 font-display text-2xl font-semibold">{STATUS[state]}</p>
      {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
      {ttsConfigured === false ? <p className="mt-2 text-sm text-muted">{ttsUnavailableMessage()}</p> : null}
      <button
        type="button"
        onClick={startListen}
        aria-label="Mikrofon"
        className={`mt-10 grid h-28 w-28 place-items-center rounded-full text-white shadow-[0_20px_50px_-20px_rgba(99,102,241,1)] ${
          state === "listening"
            ? "bg-red-500"
            : "bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)]"
        }`}
      >
        <span className="text-lg font-medium">Mic</span>
      </button>
      <label className="mt-8 w-full text-left text-sm">
        Transkripsiya
        <textarea
          className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background p-3"
          value={transcript || streaming?.content || ""}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Matn shu yerda. Yuborishdan oldin tahrirlang."
        />
      </label>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button disabled={!transcript.trim() || generating} onClick={() => void send()}>
          Yuborish
        </Button>
        <Button
          variant="outline"
          disabled={!lastAssistant?.content || ttsConfigured === false}
          onClick={() => lastAssistant && void speak(lastAssistant.content)}
        >
          O&apos;qib berish
        </Button>
        <Button variant="outline" onClick={() => audioRef.current?.play()} disabled={!hasAudio}>
          Play
        </Button>
        <Button variant="outline" onClick={() => audioRef.current?.pause()}>
          Pause
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
            setState("idle");
          }}
        >
          Stop
        </Button>
      </div>
      <div className="mt-8 w-full space-y-3 text-left text-sm">
        <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          Voice
          <input
            type="checkbox"
            checked={settings.voiceEnabled}
            onChange={(event) => void updateSettings({ voiceEnabled: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          Avto-ijro
          <input
            type="checkbox"
            checked={settings.voiceAutoplay}
            onChange={(event) => void updateSettings({ voiceAutoplay: event.target.checked })}
          />
        </label>
        <label className="block">
          Tezlik
          <input
            type="range"
            min={0.75}
            max={1.5}
            step={0.05}
            value={settings.voiceSpeed}
            onChange={(event) => void updateSettings({ voiceSpeed: Number(event.target.value) })}
            className="mt-2 w-full"
          />
        </label>
        <label className="block">
          Ovoz
          <select
            className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3"
            value={settings.voiceId}
            onChange={(event) => void updateSettings({ voiceId: event.target.value })}
          >
            {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </label>
      </div>
      {lastAssistant ? (
        <p className="mt-6 line-clamp-6 text-left text-sm text-muted">{lastAssistant.content}</p>
      ) : null}
    </div>
  );
}

type Rec = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
