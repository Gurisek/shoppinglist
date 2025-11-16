"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export type CreateItem = {
  name: string;
  quantity: number;
  purchased?: boolean;
};

interface CreateListModalProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    items: CreateItem[];
  }) => void | Promise<void>;
}

export default function CreateListModal({
  open,
  loading = false,
  error,
  onClose,
  onSubmit,
}: CreateListModalProps) {
  const [title, setTitle] = React.useState("");
  const [itemName, setItemName] = React.useState("");
  const [itemQty, setItemQty] = React.useState<number>(1);
  const [items, setItems] = React.useState<CreateItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      // reset transient field errors only
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  const addItem = () => {
    const name = itemName.trim();
    const quantity =
      Number.isFinite(itemQty) && itemQty > 0 ? Math.floor(itemQty) : 1;
    if (!name) return;
    setItems((prev) => [...prev, { name, quantity, purchased: false }]);
    setItemName("");
    setItemQty(1);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => !loading && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Vytvořit seznam
        </h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t || loading) return;
            await onSubmit({ title: t, items });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-300">
              Název seznamu
            </Label>
            <Input
              id="title"
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Týdenní nákup"
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
              disabled={loading}
            />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">Položky</h3>
            <div className="flex gap-2">
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Název položky"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
                disabled={loading}
              />
              <Input
                type="number"
                min={1}
                value={itemQty}
                onChange={(e) =>
                  setItemQty(parseInt(e.target.value || "1", 10))
                }
                className="w-24 bg-zinc-950 border-zinc-800 text-white"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={addItem}
                disabled={loading || !itemName.trim()}
                className="bg-amber-500 hover:bg-lime-700 text-black"
              >
                Přidat
              </Button>
            </div>

            {items.length > 0 && (
              <ul className="mt-4 space-y-2">
                {items.map((it, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                  >
                    <div className="text-zinc-200 text-sm">
                      {it.name}{" "}
                      <span className="text-zinc-500">× {it.quantity}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removeItem(idx)}
                      disabled={loading}
                    >
                      Odebrat
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-300 hover:text-white"
              onClick={onClose}
              disabled={loading}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              className="bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Vytváření...
                </span>
              ) : (
                "Vytvořit"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
