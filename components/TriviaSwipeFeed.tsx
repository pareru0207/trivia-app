"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SwipeableCard, type SwipeTrivia } from "@/components/SwipeableCard";
import { getSupabaseClient } from "@/lib/supabase";

type TriviaRow = Record<string, unknown>;
const TAG_PRESETS = ["歴史", "科学", "宇宙", "生物", "地理", "文化", "スポーツ", "IT"] as const;

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
}

function normalizeTrivia(row: TriviaRow): SwipeTrivia | null {
  const idRaw = row.id ?? row.uuid ?? row.trivia_id ?? null;
  const id = typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : null;
  if (!id) return null;

  const content =
    typeof row.content === "string"
      ? row.content
      : typeof row.detail === "string"
        ? row.detail
        : typeof row.title === "string"
          ? row.title
          : null;
  if (!content) return null;

  const createdAtRaw = row.created_at ?? row.inserted_at ?? row.createdAt ?? null;
  const createdAt =
    typeof createdAtRaw === "string"
      ? createdAtRaw
      : createdAtRaw instanceof Date
        ? createdAtRaw.toISOString()
        : null;

  const tags = normalizeTags(row.tags);
  return { id, content, createdAt, tags };
}

export function TriviaSwipeFeed() {
  const [cards, setCards] = useState<SwipeTrivia[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const load = useCallback(async () => {
    if (!supabase) {
      setConnected(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("trivias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      setConnected(true);
      setLoading(false);
      setMessage(`取得に失敗しました: ${error.message}`);
      return;
    }

    const mapped = (data ?? [])
      .map((row) => normalizeTrivia(row as TriviaRow))
      .filter((v): v is SwipeTrivia => Boolean(v));

    setCards(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("trivias-realtime-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trivias" },
        (payload) => {
          const next = normalizeTrivia(payload.new as TriviaRow);
          if (!next) return;

          setCards((prev) => {
            if (prev.some((p) => p.id === next.id)) return prev;
            return [next, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function submitQuickPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    const content = draft.trim();
    if (!content || posting) return;
    const inputTags = normalizeTags(tagsInput);
    const mergedTags = Array.from(new Set([...inputTags, ...(selectedTag ? [selectedTag] : [])]));
    const tagsPayload = mergedTags.length > 0 ? mergedTags : null;

    setPosting(true);
    setMessage(null);

    // content カラムを第一候補にし、環境差異に対応するためフォールバックを用意
    const tryContent = await supabase
      .from("trivias")
      .insert({ content, tags: tagsPayload })
      .select("*")
      .single();
    if (!tryContent.error) {
      const created = normalizeTrivia(tryContent.data as TriviaRow);
      if (created) {
        setCards((prev) => (prev.some((v) => v.id === created.id) ? prev : [created, ...prev]));
      }
      setDraft("");
      setTagsInput("");
      setSelectedTag("");
      setPosting(false);
      return;
    }

    const fallback = await supabase
      .from("trivias")
      .insert({ title: content.slice(0, 32), detail: content, tags: tagsPayload })
      .select("*")
      .single();

    if (fallback.error) {
      setMessage(`投稿に失敗しました: ${fallback.error.message}`);
      setPosting(false);
      return;
    }

    const created = normalizeTrivia(fallback.data as TriviaRow);
    if (created) {
      setCards((prev) => (prev.some((v) => v.id === created.id) ? prev : [created, ...prev]));
    }
    setDraft("");
    setTagsInput("");
    setSelectedTag("");
    setPosting(false);
  }

  return (
    <section className="flex flex-col gap-5">
      {!connected ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-50/70 p-5 text-sm text-amber-900 ring-1 ring-amber-500/10 backdrop-blur dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/10">
          現在データベースに接続されていません。環境変数を設定してください
          （`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）。
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-black/10 bg-white/40 p-8 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          読み込み中...
        </div>
      ) : (
        <SwipeableCard
          cards={cards}
          onSwipe={(id) => {
            setCards((prev) => prev.filter((v) => v.id !== id));
          }}
        />
      )}

      <form
        onSubmit={submitQuickPost}
        className="mt-1 grid gap-3 rounded-3xl border border-black/5 bg-white/80 p-3 ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-black/30">
          <span className="text-zinc-500">💡</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="今の雑学、面白い！と思ったら一言投稿..."
            className="h-10 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="タグをカンマ区切りで入力（例: 歴史, 科学）"
            className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-black/30 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={!connected || posting || draft.trim().length === 0}
            className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {posting ? "投稿中..." : "投稿"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TAG_PRESETS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag((prev) => (prev === tag ? "" : tag))}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white"
                  : "border border-black/10 bg-white text-zinc-600 hover:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </form>

      {message ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          新しい投稿はリアルタイムでカードの先頭に追加されます（tags 対応）。
        </p>
      )}
    </section>
  );
}

