import { houseColors, users } from "@/lib/mock-data";

export default function ProfilePage() {
  const currentUser = users[0];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="mt-2 text-zinc-600">Manage your player identity and stats.</p>
      </header>

      <article className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-zinc-100 text-xl font-bold">
            {currentUser.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          <div>
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <p className="text-sm text-zinc-600">Player ID: {currentUser.id}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">House</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: houseColors[currentUser.house] }}
              />
              <p className="font-semibold">{currentUser.house} House</p>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">Total points</p>
            <p className="mt-2 text-2xl font-black">{currentUser.totalPoints}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
