"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type SwipeAction = "favorite" | "next";

const SWIPE_THRESHOLD = 120;

export type SwipeTrivia = {
  id: string;
  content: string;
  tags?: string[];
  createdAt?: string | null;
};

type Props = {
  cards: SwipeTrivia[];
  onSwipe?: (id: string, action: SwipeAction) => void;
};

export function SwipeableCard({ cards, onSwipe }: Props) {
  const [leaving, setLeaving] = useState<SwipeAction | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const likeOpacity = useTransform(x, [0, 80, 160], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [-160, -80, 0], [1, 0.5, 0]);

  const current = cards[0] ?? null;
  const next = cards[1] ?? null;
  const remain = cards.length;

  const empty = useMemo(() => cards.length === 0 || !current, [cards.length, current]);
  const direction = leaving === "favorite" ? 1 : leaving === "next" ? -1 : 0;

  useEffect(() => {
    if (!leaving) x.set(0);
  }, [leaving, x]);

  if (empty) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white/40 p-10 text-center text-sm text-zinc-600 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
        カードがありません。新しい雑学が投稿されるとここに追加されます。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-square w-full max-w-[28rem] [perspective:1600px]">
        {next ? (
          <motion.div
            key={`next-${next.id}`}
            initial={{ y: 36, opacity: 0.4, scale: 0.95 }}
            animate={{ y: 20, opacity: 0.8, scale: 0.97 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 rounded-[2rem] border border-black/5 bg-white/65 shadow-[0_20px_45px_rgba(0,0,0,0.1)] ring-1 ring-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
          />
        ) : null}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.article
            key={current.id}
            custom={direction}
            initial={{ y: 44, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{
              x: direction * 520,
              rotate: direction * 18,
              opacity: 0,
              transition: { duration: 0.28, ease: "easeOut" },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            style={{ x, rotate }}
            onDragEnd={(_e, info) => {
              if (info.offset.x > SWIPE_THRESHOLD) {
                setLeaving("favorite");
                setLeavingId(current.id);
                return;
              }
              if (info.offset.x < -SWIPE_THRESHOLD) {
                setLeaving("next");
                setLeavingId(current.id);
                return;
              }
            }}
            onAnimationComplete={() => {
              if (leaving && leavingId && onSwipe) {
                onSwipe(leavingId, leaving);
              }
              if (leaving) {
                setLeaving(null);
                setLeavingId(null);
              }
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <div className="relative h-full rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)] ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 dark:ring-white/10">
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute left-5 top-5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
              >
                既読 / お気に入り
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute right-5 top-5 rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300"
              >
                次へ
              </motion.div>

              <div className="flex h-full flex-col">
                <p className="mb-5 rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  みんなの雑学
                </p>
                <p className="my-auto text-xl leading-9 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl sm:leading-10">
                  {current.content}
                </p>

                {current.tags && current.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {current.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>左右にスワイプ</span>
                  <span>
                    {current.createdAt ? new Date(current.createdAt).toLocaleString() : ""}
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3 text-xs text-zinc-600 ring-1 ring-black/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
        <span>左スワイプ: 次へ</span>
        <span>残り {remain} 枚</span>
        <span>右スワイプ: 既読 / お気に入り</span>
      </div>
    </div>
  );
}

