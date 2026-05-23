import confetti from "canvas-confetti";

export function triggerConfetti() {
  confetti({
    particleCount: 110,
    spread: 72,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  });
}
