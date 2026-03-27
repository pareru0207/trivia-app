import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type TriviaInsert = {
  title: string;
  detail: string;
};

type QuizInsert = {
  question: string;
  choices: string[];
  answer_index: number;
  category?: string | null;
  difficulty?: string | null;
};

function toInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function selectFromFirstExistingTable<T extends Record<string, unknown>>(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  tables: string[],
  build: (table: string) => Promise<{ data: T[] | null; error: { message: string } | null }>,
) {
  let lastError: string | null = null;
  for (const table of tables) {
    const { data, error } = await build(table);
    if (!error) {
      return { table, data: data ?? [] as T[] };
    }
    lastError = error.message;
  }
  return { table: tables[0] ?? "unknown", data: null, error: lastError ?? "unknown error" };
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  const limit = Math.min(100, Math.max(1, toInt(request.nextUrl.searchParams.get("limit"), 20)));
  const category = request.nextUrl.searchParams.get("category");

  const result = await selectFromFirstExistingTable<Record<string, unknown>>(
    supabase,
    ["quizzes", "trivias"],
    async (table) => {
      let query = supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      return { data, error };
    },
  );

  if ("error" in result && result.error) {
    return Response.json(
      { error: "クイズの取得に失敗しました", details: result.error },
      { status: 500 },
    );
  }

  return Response.json({ table: result.table, data: result.data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSONの解析に失敗しました" }, { status: 400 });
  }

  const asRecord = body as Record<string, unknown>;

  // 雑学投稿（タイトル/詳細）
  if (typeof asRecord.title === "string" || typeof asRecord.detail === "string") {
    const input = asRecord as Partial<TriviaInsert>;

    if (!input.title || typeof input.title !== "string") {
      return Response.json({ error: "title は必須です" }, { status: 400 });
    }
    if (!input.detail || typeof input.detail !== "string") {
      return Response.json({ error: "detail は必須です" }, { status: 400 });
    }

    // まず trivias に入れて、だめなら quizzes にフォールバック
    const tryTrivias = await supabase
      .from("trivias")
      .insert({ title: input.title, detail: input.detail })
      .select("*")
      .single();

    if (!tryTrivias.error) {
      return Response.json({ table: "trivias", data: tryTrivias.data }, { status: 201 });
    }

    // quizzes しかない場合でも動くように、detail を choices[0] として保存
    const fallbackQuiz: QuizInsert = {
      question: input.title,
      choices: [input.detail],
      answer_index: 0,
      category: null,
      difficulty: null,
    };

    const tryQuizzes = await supabase.from("quizzes").insert(fallbackQuiz).select("*").single();

    if (tryQuizzes.error) {
      return Response.json(
        {
          error: "投稿に失敗しました",
          details: `trivias: ${tryTrivias.error.message} / quizzes: ${tryQuizzes.error.message}`,
        },
        { status: 500 },
      );
    }

    return Response.json({ table: "quizzes", data: tryQuizzes.data }, { status: 201 });
  }

  // 既存のクイズ投稿
  const input = body as Partial<QuizInsert>;

  if (!input.question || typeof input.question !== "string") {
    return Response.json({ error: "question は必須です" }, { status: 400 });
  }
  if (!Array.isArray(input.choices) || input.choices.some((c) => typeof c !== "string")) {
    return Response.json({ error: "choices は文字列配列で必須です" }, { status: 400 });
  }
  if (typeof input.answer_index !== "number" || !Number.isInteger(input.answer_index)) {
    return Response.json({ error: "answer_index は整数で必須です" }, { status: 400 });
  }
  if (input.answer_index < 0 || input.answer_index >= input.choices.length) {
    return Response.json({ error: "answer_index が choices の範囲外です" }, { status: 400 });
  }

  const insert: QuizInsert = {
    question: input.question,
    choices: input.choices,
    answer_index: input.answer_index,
    category: input.category ?? null,
    difficulty: input.difficulty ?? null,
  };

  const { data, error } = await supabase.from("quizzes").insert(insert).select("*").single();

  if (error) {
    return Response.json(
      { error: "クイズの作成に失敗しました", details: error.message },
      { status: 500 },
    );
  }

  return Response.json({ data }, { status: 201 });
}

