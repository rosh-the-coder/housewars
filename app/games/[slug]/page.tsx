import { notFound } from "next/navigation";
import { GameEmbed } from "@/components/game-embed";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("games")
    .select("id,name,source,type,embed_url,is_active")
    .eq("is_active", true);
  const games = data ?? [];
  const game = games.find((item) => slugify(item.name) === slug);

  if (!game) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">{game.name}</h1>
        <p className="mt-2 text-zinc-600">
          Source: {game.source} • Type: {game.type}
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between text-sm text-zinc-600">
          <span>Game Session</span>
          <span>ID: {game.id}</span>
        </div>
        <GameEmbed embedUrl={game.embed_url} title={game.name} sessionGameId={game.id} />
      </div>
    </section>
  );
}
