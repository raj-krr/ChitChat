import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Mic, Download, X, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

export type FileKind = "image" | "video" | "audio" | "pdf" | "doc" | "excel" | "file";

export function getFileKind(urlOrName: string, mimeType?: string): FileKind {
  if (mimeType) {
    if (mimeType.startsWith("image/"))  return "image";
    if (mimeType.startsWith("video/"))  return "video";
    if (mimeType.startsWith("audio/"))  return "audio";
    if (mimeType === "application/pdf") return "pdf";
  }

  const cleanPath = urlOrName.split("?")[0].split("#")[0];
  const ext = cleanPath.split(".").pop()?.toLowerCase() ?? "";

  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv"].includes(ext))                 return "video";
  if (ext === "webm" && mimeType?.startsWith("audio/"))           return "audio";
  if (ext === "webm")                                             return "video";
  if (["mp3", "ogg", "wav", "m4a", "aac", "opus"].includes(ext))   return "audio";
  if (ext === "pdf")                                              return "pdf";
  if (["doc", "docx"].includes(ext))                             return "doc";
  if (["xls", "xlsx"].includes(ext))                             return "excel";

  const lower = urlOrName.toLowerCase();
  if (/[./]opus|[./]ogg|[./]m4a|[./]aac|[./]mp3|[./]wav|audio/.test(lower)) return "audio";
  if (/[./]mp4|[./]mov|[./]webm|video/.test(lower))                          return "video";
  if (/[./]jpg|[./]jpeg|[./]png|[./]webp|[./]gif|image/.test(lower))        return "image";

  return "file";
}

function fmtTime(s: number) {
  if (!s || !isFinite(s) || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

const DOC_META: Record<string, { emoji: string; label: string }> = {
  pdf:   { emoji: "📄", label: "PDF Document" },
  doc:   { emoji: "📝", label: "Word Document" },
  excel: { emoji: "📊", label: "Spreadsheet" },
  file:  { emoji: "📎", label: "File Attachment" },
};

const BAR_COUNT = 32;
function getBars(src: string): number[] {
  const seed = src.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const x = Math.sin(seed + i * 127.1) * 43758.5453;
    return 0.15 + (x - Math.floor(x)) * 0.85;
  });
}

function VoicePlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const ref        = useRef<HTMLAudioElement>(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const bars = getBars(src);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;

    const updateDuration = () => {
      if (a.duration === Infinity || isNaN(a.duration)) {
        a.currentTime = 1e101;
        const handleTimeUpdate = () => {
          a.removeEventListener("timeupdate", handleTimeUpdate);
          a.currentTime = 0;
          if (isFinite(a.duration)) {
            setDuration(a.duration);
          }
        };
        a.addEventListener("timeupdate", handleTimeUpdate);
      } else if (isFinite(a.duration)) {
        setDuration(a.duration);
      }
    };

    const play  = () => setPlaying(true);
    const pause = () => setPlaying(false);
    const end   = () => { setPlaying(false); setProgress(0); setElapsed(0); a.currentTime = 0; };
    const tick  = () => {
      if (isFinite(a.currentTime)) setElapsed(a.currentTime);
      if (isFinite(a.duration) && a.duration > 0) setProgress(a.currentTime / a.duration);
    };

    a.addEventListener("play",            play);
    a.addEventListener("pause",           pause);
    a.addEventListener("ended",           end);
    a.addEventListener("loadedmetadata",  updateDuration);
    a.addEventListener("durationchange",  updateDuration);
    a.addEventListener("timeupdate",      tick);

    if (a.readyState >= 1) {
      updateDuration();
    }

    return () => {
      a.removeEventListener("play",            play);
      a.removeEventListener("pause",           pause);
      a.removeEventListener("ended",           end);
      a.removeEventListener("loadedmetadata",  updateDuration);
      a.removeEventListener("durationchange",  updateDuration);
      a.removeEventListener("timeupdate",      tick);
    };
  }, [src]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    playing ? ref.current?.pause() : ref.current?.play();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const a = ref.current;
    if (!a?.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  };

  const lit = Math.round(progress * BAR_COUNT);

  return (
    <div
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-xl w-[220px] sm:w-[240px]
        ${isMe ? "bg-black/20" : "bg-black/20"}
      `}
      onClick={e => e.stopPropagation()}
    >
      <audio ref={ref} src={src} preload="metadata" />

      <button
        onClick={toggle}
        className="
          shrink-0 w-9 h-9 rounded-full
          flex items-center justify-center
          bg-white/25 hover:bg-white/35
          active:scale-90 transition-all duration-150 shadow-sm
        "
      >
        {playing
          ? <Pause size={16} fill="white" className="text-white" />
          : <Play  size={16} fill="white" className="text-white" style={{ marginLeft: 2 }} />
        }
      </button>

      <div className="flex flex-col gap-[3px] flex-1 min-w-0">
        <div
          className="flex items-center gap-[2px] h-5 cursor-pointer select-none"
          onClick={seek}
        >
          {bars.map((h, i) => (
            <div
              key={i}
              className={`
                rounded-full flex-1 transition-all duration-75
                ${i < lit ? "bg-white" : "bg-white/30"}
              `}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-white/70 tabular-nums leading-none font-mono">
          {playing || elapsed > 0 ? fmtTime(elapsed) : fmtTime(duration)}
        </span>
      </div>

      <Mic size={13} className="shrink-0 text-white/40" />
    </div>
  );
}

interface FilePreviewProps {
  file?: string;
  attachment?: File;
  mimeType?: string;
  isMe: boolean;
}

export default function FilePreview({ file, attachment, mimeType, isMe }: FilePreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const name = file ?? attachment?.name ?? "";
  const kind = getFileKind(name, mimeType);

  const url: string | null = (() => {
    if (file) return file;
    if (attachment && typeof attachment === "object" && "size" in attachment && typeof (attachment as any).arrayBuffer === "function") return URL.createObjectURL(attachment as File);
    return null;
  })();

  useEffect(() => {
    if (!showLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLightbox(false);
        setIsZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox]);

  if (!url) return null;

  const fileNameDisplay = name.split("/").pop()?.split("\\").pop() || "Media preview";

  return (
    <>
      {/* ── IMAGE ── */}
      {kind === "image" && (
        <div
          className="relative mt-1 group overflow-hidden rounded-xl cursor-pointer max-w-[280px] sm:max-w-[320px] shadow-md border border-white/10"
          onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
        >
          <img
            src={url}
            alt="attachment"
            className="w-full max-h-[300px] sm:max-h-[360px] object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-md">
              <Maximize2 size={18} />
            </span>
          </div>
        </div>
      )}

      {/* ── VIDEO ── */}
      {kind === "video" && (
        <div
          className="relative mt-1 rounded-xl overflow-hidden bg-black/60 max-w-[280px] sm:max-w-[320px] shadow-md border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <video
            src={url}
            controls
            preload="metadata"
            playsInline
            className="w-full max-h-[300px] sm:max-h-[360px] object-contain rounded-xl"
          />
        </div>
      )}

      {/* ── AUDIO / VOICE ── */}
      {kind === "audio" && (
        <div className="mt-1">
          <VoicePlayer src={url} isMe={isMe} />
        </div>
      )}

      {/* ── DOCUMENT / FILE ── */}
      {kind !== "image" && kind !== "video" && kind !== "audio" && (
        <div
          onClick={(e) => { e.stopPropagation(); if (file) window.open(file, "_blank"); }}
          className="
            mt-1 flex items-center gap-2.5 px-3 py-2 rounded-xl
            bg-black/20 hover:bg-black/30 border border-white/10
            cursor-pointer transition-colors duration-150
            max-w-[260px] sm:max-w-[300px]
          "
        >
          <span className="text-2xl shrink-0">{(DOC_META[kind] ?? DOC_META.file).emoji}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-white truncate">
              {fileNameDisplay}
            </span>
            <span className="text-[10px] text-white/50">
              {(DOC_META[kind] ?? DOC_META.file).label} · Tap to open
            </span>
          </div>
          <Download size={15} className="shrink-0 text-white/50 ml-auto hover:text-white transition" />
        </div>
      )}

      {/* ── WHATSAPP-STYLE LIGHTBOX PORTAL OVERLAY ── */}
      {showLightbox && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => { setShowLightbox(false); setIsZoomed(false); }}
        >
          {/* HEADER BAR */}
          <div
            className="w-full flex items-center justify-between z-10 px-2 sm:px-6 py-2 bg-gradient-to-b from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-white/90 text-sm font-medium truncate max-w-[60%]">
              <span className="truncate">{fileNameDisplay}</span>
            </div>

            <div className="flex items-center gap-3">
              {kind === "image" && (
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                  title={isZoomed ? "Zoom out" : "Zoom in"}
                >
                  {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </button>
              )}

              <a
                href={url}
                download={fileNameDisplay}
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                title="Download media"
              >
                <Download size={20} />
              </a>

              <button
                onClick={() => { setShowLightbox(false); setIsZoomed(false); }}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MAIN MEDIA DISPLAY */}
          <div
            className="relative flex-1 w-full max-w-7xl flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {kind === "image" && (
              <img
                src={url}
                alt="Full preview"
                onClick={() => setIsZoomed(!isZoomed)}
                className={`
                  object-contain rounded-xl shadow-2xl transition-all duration-300
                  ${isZoomed ? "max-w-none max-h-none scale-125 cursor-zoom-out" : "max-w-full max-h-[85vh] cursor-zoom-in"}
                `}
              />
            )}
            {kind === "video" && (
              <video
                src={url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>

          {/* FOOTER BAR */}
          <div className="w-full text-center py-2 text-xs text-white/50 z-10">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">ESC</kbd> or click outside to close
          </div>
        </div>,
        document.body
      )}
    </>
  );
}