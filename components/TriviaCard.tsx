"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";

export type TriviaCardData = {
  id: string;
  title: string;
  detail: string;
  tags?: string[];
  createdAt?: string | null;
  sourceTable?: "quizzes" | "trivias" | string;
};

export function TriviaCard({ data }: { data: TriviaCardData }) {
  const [flipped, setFlipped] = useState(false);
  const titleId = useId();

  return (
    <motion.button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-labelledby={titleId}
      className="group relative w-full text-left [perspective:1200px]"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <motion.div
        className="relative aspect-square w-full rounded-[1.6rem] border border-black/5 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 表（タイトル） */}
        <div
          className="absolute inset-0 flex flex-col gap-3 p-5"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between gap-3">
            <h3
              id={titleId}
              className="line-clamp-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              {data.title}
            </h3>
            <span className="shrink-0 rounded-full border border-black/5 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              表
            </span>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            クリックで裏面（詳細）を表示
          </p>
          {data.tags && data.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-700 dark:text-indigo-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="truncate">
              {data.sourceTable ? `元: ${data.sourceTable}` : ""}
            </span>
            <span className="truncate">{data.createdAt ? new Date(data.createdAt).toLocaleString() : ""}</span>
          </div>
        </div>

        {/* 裏（詳細） */}
        <div
          className="absolute inset-0 flex flex-col gap-3 p-5"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              裏（詳細）
            </p>
            <span className="shrink-0 rounded-full border border-black/5 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              裏
            </span>
          </div>
          <p className="line-clamp-6 text-sm leading-6 text-zinc-800 dark:text-zinc-100">
            {data.detail}
          </p>
          <div className="mt-auto text-[11px] text-zinc-500 dark:text-zinc-400">
            クリックで表に戻る
          </div>
        </div>

        {/* ふわっとした光 */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(80%_80%_at_30%_0%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(80%_80%_at_80%_60%,rgba(16,185,129,0.22),transparent_55%)]" />
        </div>
      </motion.div>
    </motion.button>
  );
}

