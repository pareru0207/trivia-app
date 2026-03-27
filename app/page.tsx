import { TriviaSwipeFeed } from "@/components/TriviaSwipeFeed";

export default async function Home() {
  return (
    <div className="min-h-full flex flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_70%_at_50%_0%,rgba(99,102,241,0.25),transparent_70%),radial-gradient(50%_60%_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(40%_50%_at_80%_35%,rgba(236,72,153,0.14),transparent_60%)]" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            みんなの雑学共有スワイプアプリ
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            新しい投稿順で雑学カードを読み進められます。右スワイプで既読/お気に入り、左スワイプで次へ。
          </p>
        </header>

        <TriviaSwipeFeed />
      </main>
    </div>
  );
}
