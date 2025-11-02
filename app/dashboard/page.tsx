import Link from "next/link";
import data from "../data";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Dashboard nákupních seznamů
          </h1>
          <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400">
            Zpět domů
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-1">
          {data.map((list) => (
            <li
              key={list.id}
              className="rounded-md border bg-white p-4 shadow-sm dark:bg-[#0b0b0b]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                    {list.title}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Vlastník: {list.ownerName}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Položek: {list.items.length} •{" "}
                    {list.completed ? "Dokončeno" : "Neukončeno"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/${list.id}`}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-95"
                  >
                    Otevřít
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
