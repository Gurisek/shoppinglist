"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
// import Link from "next/link"; // Replaced by sheet trigger later
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import CreateListModal, { type CreateItem } from "@/components/CreateListModal";
import ListDetailSheet from "@/components/ListDetailSheet";

type Status = "active" | "completed" | "archived";

interface ListItemItem {
  _id: string;
  name: string;
  quantity: number;
  purchased: boolean;
}

type OwnerRef = {
  _id: string;
  email?: string;
  name?: string;
  surname?: string;
};

interface ListItem {
  _id: string;
  title: string;
  status: Status;
  ownerId: string | OwnerRef;
  memberIds: (string | OwnerRef)[];
  items?: ListItemItem[];
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Status>("active");
  const [openCreate, setOpenCreate] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    name: string;
    surname: string;
  } | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<ListItem | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/ShoppingList", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load lists");
      const data = await res.json();
      setLists(data.shoppingLists ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load lists");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/Auth/verify", { cache: "no-store" });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data.valid && data.user) setCurrentUser(data.user);
      } catch {
        // ignore error
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (openCreate) {
      setSubmitError(null);
    }
  }, [openCreate]);

  const getBadgeClass = (status: Status) => {
    if (status === "active")
      return "bg-yellow-500 text-black hover:bg-yellow-400";
    if (status === "completed")
      return "bg-green-500 text-white hover:bg-green-400";
    return "bg-zinc-700 text-white hover:bg-zinc-600";
  };

  const createList = async (data: { title: string; items: CreateItem[] }) => {
    const { title, items } = data;
    if (!title || !title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/ShoppingList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), items }),
      });
      if (!res.ok) throw new Error("Nepodařilo se vytvořit seznam");
      await load();
      setOpenCreate(false);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Chyba při vytváření seznamu"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Tabs (interactive) */}
        <div className="mb-6 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={
              filter === "active" ? getBadgeClass("active") : "text-zinc-400"
            }
            onClick={() => setFilter("active")}
          >
            Active
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              filter === "completed"
                ? getBadgeClass("completed")
                : "text-zinc-400"
            }
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              filter === "archived"
                ? getBadgeClass("archived")
                : "text-zinc-400"
            }
            onClick={() => setFilter("archived")}
          >
            Archived
          </Button>
        </div>

        {!lists && !error && (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500 p-4 text-red-500">
            Chyba při načítání seznamů: {error}
          </div>
        )}

        {lists && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists
              .filter((list) => list.status === filter)
              .map((list) => (
                <button
                  key={list._id}
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setSelected(list);
                    setOpenDetail(true);
                  }}
                >
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-medium text-white">
                          {list.title}
                        </CardTitle>
                        <Badge className={getBadgeClass(list.status)}>
                          {list.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-zinc-400">
                        {list.items?.length ?? 0} položek
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
          </div>
        )}

        {/* Create modal trigger */}
        <Button
          onClick={() => setOpenCreate(true)}
          disabled={creating}
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        <CreateListModal
          open={openCreate}
          loading={creating}
          error={submitError}
          onClose={() => setOpenCreate(false)}
          onSubmit={createList}
        />

        <ListDetailSheet
          list={selected}
          open={openDetail}
          currentUser={currentUser}
          onClose={() => setOpenDetail(false)}
          onListUpdate={(updated) => {
            setLists(
              (prev) =>
                prev &&
                prev.map((l) =>
                  l._id === updated._id ? { ...l, ...updated } : l
                )
            );
            setSelected((prev) =>
              prev && prev._id === updated._id ? { ...prev, ...updated } : prev
            );
          }}
          refreshLists={load}
        />
      </div>
    </div>
  );
}
