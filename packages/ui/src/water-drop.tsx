import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

const DROP_PATH = "M100 8 C100 8 28 104 28 164 A72 72 0 0 0 172 164 C172 104 100 8 100 8 Z";
const DROP_TOP = 8;
const DROP_BOTTOM = 236;
const WAVE_PATH =
  "M0 0 Q 25 -9 50 0 T 100 0 T 150 0 T 200 0 T 250 0 T 300 0 T 350 0 T 400 0 V 260 H 0 Z";

export function WaterDrop({ progress }: { progress: number }) {
  const clipId = useId();
  const reduceMotion = useReducedMotion();
  const level = Math.min(Math.max(progress, 0), 1);
  const waterTop = DROP_BOTTOM - level * (DROP_BOTTOM - DROP_TOP);
  const wave = (offset: number, duration: number) =>
    reduceMotion
      ? { initial: false, animate: { x: -offset } }
      : {
          initial: { x: -offset },
          animate: { x: [-offset, -offset - 100] },
          transition: { duration, ease: "linear" as const, repeat: Number.POSITIVE_INFINITY },
        };

  return (
    <svg viewBox="0 0 200 244" className="h-full w-full" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d={DROP_PATH} />
        </clipPath>
      </defs>
      <path d={DROP_PATH} className="fill-sunken" />
      <g clipPath={`url(#${clipId})`} opacity={level > 0 ? 1 : 0}>
        <motion.g
          initial={false}
          animate={{ y: waterTop }}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 18 }
          }
        >
          <motion.path d={WAVE_PATH} className="fill-accent opacity-35" {...wave(50, 7)} />
          <motion.path d={WAVE_PATH} className="fill-accent opacity-80" {...wave(0, 4.5)} />
        </motion.g>
      </g>
      <path d={DROP_PATH} className="fill-none stroke-line" strokeWidth={2} />
    </svg>
  );
}
