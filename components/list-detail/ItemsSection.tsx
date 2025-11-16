"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Item {
  _id: string;
  name: string;
  quantity: number;
  purchased: boolean;
}

export default function ItemsSection({
  isOwner,
  currentUser,
  loading,
  filter,
  setFilter,
  itemName,
  setItemName,
  itemQty,
  setItemQty,
  visibleItems,
  addItem,
  togglePurchased,
  removeItem,
  memberIdStrings,
}: {
  isOwner: boolean;
  currentUser: { userId: string } | null;
  loading: boolean;
  filter: "open" | "all";
  setFilter: (v: "open" | "all") => void;
  itemName: string;
  setItemName: (v: string) => void;
  itemQty: number;
  setItemQty: (v: number) => void;
  visibleItems: Item[];
  addItem: () => void;
  togglePurchased: (itemId: string, purchased: boolean) => void;
  removeItem: (itemId: string) => void;
  memberIdStrings: string[];
}) {
  const canEdit =
    isOwner || (currentUser && memberIdStrings.includes(currentUser.userId));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Položky</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "open" ? "default" : "ghost"}
            onClick={() => setFilter("open")}
          >
            Nezakoupené
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            onClick={() => setFilter("all")}
          >
            Vše
          </Button>
        </div>
      </div>
      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
          className="flex gap-2"
        >
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Název"
            className="flex-1"
            disabled={loading}
          />
          <Input
            type="number"
            min={1}
            value={itemQty}
            onChange={(e) => setItemQty(parseInt(e.target.value || "1", 10))}
            className="w-20"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !itemName.trim()}
            className="bg-amber-500 hover:bg-lime-700 text-black"
          >
            Přidat
          </Button>
        </form>
      )}
      <ul className="space-y-2">
        {visibleItems.map((it) => (
          <li
            key={it._id}
            className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
          >
            <button
              type="button"
              onClick={() => togglePurchased(it._id, !it.purchased)}
              className={cn(
                "h-4 w-4 rounded border flex items-center justify-center",
                it.purchased
                  ? "bg-green-500 border-green-500"
                  : "border-zinc-600"
              )}
              aria-label="Toggle purchased"
              disabled={loading}
            >
              {it.purchased && <span className="text-white text-xs">✓</span>}
            </button>
            <span
              className={cn(
                "flex-1",
                it.purchased && "line-through text-zinc-500"
              )}
            >
              {it.name} <span className="text-zinc-500">× {it.quantity}</span>
            </span>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => removeItem(it._id)}
                disabled={loading}
              >
                Odstranit
              </Button>
            )}
          </li>
        ))}
        {visibleItems.length === 0 && (
          <li className="text-xs text-zinc-500">Žádné položky</li>
        )}
      </ul>
    </div>
  );
}
