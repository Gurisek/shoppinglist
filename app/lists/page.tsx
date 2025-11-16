"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
// import Link from "next/link"; // Replaced by sheet trigger later
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  const isOwner = (list: ListItem) => {
    if (!currentUser) return false;
    const ownerId =
      typeof list.ownerId === "string" ? list.ownerId : list.ownerId?._id;
    return ownerId === currentUser.userId;
  };

  const deleteList = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ShoppingList/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Nepodařilo se smazat seznam");

      setLists((prev) => (prev ? prev.filter((l) => l._id !== id) : []));
      if (selected?._id === id) {
        setOpenDetail(false);
        setSelected(null);
      }
      setAlertState({ type: "success", message: "Seznam byl úspěšně smazán." });
    } catch (e) {
      setAlertState({
        type: "error",
        message: e instanceof Error ? e.message : "Chyba při mazání seznamu",
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!alertState) return;
    const t = setTimeout(() => setAlertState(null), 3500);
    return () => clearTimeout(t);
  }, [alertState]);

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

        {alertState && (
          <div className="mb-4">
            <Alert
              variant={alertState.type === "error" ? "destructive" : "default"}
            >
              <AlertTitle>
                {alertState.type === "error" ? "Chyba" : "Hotovo"}
              </AlertTitle>
              <AlertDescription>{alertState.message}</AlertDescription>
            </Alert>
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
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg font-medium text-white">
                          {list.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getBadgeClass(list.status)}>
                            {list.status}
                          </Badge>
                          {isOwner(list) && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0"
                              title="Smazat seznam"
                              disabled={deletingId === list._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmId(list._id);
                              }}
                            >
                              {deletingId === list._id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Trash className="h-5 w-5 text-red-500" />
                              )}
                            </Button>
                          )}
                        </div>
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

        <AlertDialog
          open={!!confirmId}
          onOpenChange={(open) => {
            if (!open) setConfirmId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Opravdu smazat tento seznam?</AlertDialogTitle>
              <AlertDialogDescription>
                Tato akce je nevratná. Seznam bude smazán včetně položek.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zrušit</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (confirmId) {
                    await deleteList(confirmId);
                    setConfirmId(null);
                  }
                }}
              >
                Smazat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
