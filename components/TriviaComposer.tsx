"use client";

import { useMemo, useState } from "react";

type Props = {
  endpoint?: string;
};

export function TriviaComposer({ endpoint = "/api/quizzes" }: Props) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && detail.trim().length > 0 && !submitting;
  }, [detail, submitting, title]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), detail: detail.trim() }),
      });

      const json = (await res.json()) as { error?: string; details?: string };
      if (!res.ok) {
        setMessage(json.details ? `${json.error}\n${json.details}` : json.error ?? "投稿に失敗しました");
        return;
      }

      setTitle("");
      setDetail("");
      setMessage("投稿しました。下の一覧に反映するには再読み込みしてください。");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-black/5 bg-white/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          雑学を投稿
        </h2>
        <span className="rounded-full border border-black/5 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          表/裏
        </span>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            表（タイトル）
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例）カレーが日本に広まった意外な経路"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-black/30 dark:text-zinc-50"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            裏（詳細内容）
          </span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="例）明治期に海軍の食事として…（根拠や補足もOK）"
            rows={4}
            className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-black/30 dark:text-zinc-50"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
          {message ? (
            <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">
              {message}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              投稿後は下のカードを左右にスワイプできます
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

