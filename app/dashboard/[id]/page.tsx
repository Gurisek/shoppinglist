/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";
import data from "../../data";

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const resolvedParams =
    params && typeof (params as any).then === "function"
      ? await (params as any)
      : params;
  const id = parseInt(resolvedParams.id, 10);
  const list = data.find((l) => l.id === id);

  if (!list) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              {list.title}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Vlastník: {list.ownerName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-600 dark:text-zinc-400"
            >
              Zpět na dashboard
            </Link>
          </div>
        </div>

        <section className="rounded-md border bg-white p-4 shadow-sm dark:bg-[#0b0b0b]">
          <h2 className="mb-3 text-lg font-medium text-black dark:text-zinc-50">
            Položky
          </h2>
          <ul className="space-y-2">
            {list.items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {item.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Množství: {item.quantity}
                  </p>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.resolved ? "Koupeno" : "Nekoupeno"}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Stav seznamu: {list.completed ? "Dokončeno" : "Neukončeno"}
          </p>
        </div>
      </main>
    </div>
  );
}
