"use client";
import {
  ArrowLeftDoubleIcon,
  ArrowShrinkIcon,
  FullScreenIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Props = {
  src: string;
  className?: string;
};

export default function CuteVideoPlayer({ src, className }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const idleRef = useRef<number | null>(null);
  const insideRef = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setProgress(v.currentTime || 0);
    const onDur = () => setDuration(v.duration || 0);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const resetIdle = () => {
    setShowControls(true);
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      if (!insideRef.current) return setShowControls(false);
      setShowControls(false);
    }, 2000);
  };

  const handleMouseMove = () => {
    insideRef.current = true;
    resetIdle();
  };

  const handleMouseEnter = () => {
    insideRef.current = true;
    resetIdle();
  };

  const handleMouseLeave = () => {
    insideRef.current = false;
    setShowControls(false);
    if (idleRef.current) window.clearTimeout(idleRef.current);
  };

  const toggle = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
    resetIdle();
  };

  const seek = (to: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration || 0, to));
    resetIdle();
  };

  const toggleFullscreen = async (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const container = ref.current?.parentElement;
    if (!container) return;
    try {
      if (!document.fullscreenElement) await container.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
    resetIdle();
  };

  return (
    <div className={`w-full ${className || ""}`}>
      <div
        className={`relative overflow-hidden rounded-xl bg-black ${isFs ? "flex items-center justify-center h-screen" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={toggle}
      >
        <video
          ref={ref}
          className={`block mx-auto w-full h-auto bg-black object-contain ${
            isFs
              ? "max-w-[90vw] max-h-[90vh]"
              : "max-h-[40vh] md:max-h-[52vh] lg:max-h-[64vh]"
          }`}
          src={src}
          playsInline
          controls={false}
        />

        <button
          onClick={toggle}
          title={playing ? "Pause" : "Play"}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 p-4 text-black shadow-lg"
          aria-label="Play Pause"
        >
          {playing ? (
            <Icon icon={PauseIcon} className="size-6" />
          ) : (
            <Icon icon={PlayIcon} className="size-6" />
          )}
        </button>

        <div
          className={`absolute bottom-2 left-2 right-2 flex items-center gap-3 rounded px-2 transition-opacity ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => seek((ref.current?.currentTime || 0) - 5)}
            title="Back 5s"
            className="rounded-lg bg-white/10 p-2 text-white flex items-center"
            aria-label="Back 5s"
          >
            <Icon icon={ArrowLeftDoubleIcon} />
          </button>

          <input
            aria-label="progress"
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 flex-1 appearance-none rounded"
            style={{
              background: `linear-gradient(to right, var(--primary) ${
                duration ? (progress / duration) * 100 : 0
              }%, rgba(255,255,255,0.12) ${duration ? (progress / duration) * 100 : 0}%)`,
            }}
          />

          <button
            onClick={toggleFullscreen}
            title={isFs ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="rounded-lg bg-white/10 p-2 text-white flex items-center"
            aria-label="Fullscreen"
          >
            <Icon icon={isFs ? ArrowShrinkIcon : FullScreenIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
