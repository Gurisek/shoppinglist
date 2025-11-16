"use client";
import * as React from "react";
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import MembersSection from "@/components/list-detail/MembersSection";
import ItemsSection from "@/components/list-detail/ItemsSection";

interface Item {
  _id: string;
  name: string;
  quantity: number;
  purchased: boolean;
}
type OwnerRef =
  | string
  | { _id: string; email?: string; name?: string; surname?: string };
interface ListData {
  _id: string;
  title: string;
  status: "active" | "completed" | "archived";
  ownerId: OwnerRef;
  memberIds: (string | OwnerRef)[];
  items?: Item[];
}
interface UserInfo {
  userId: string;
  email: string;
  name: string;
  surname: string;
}
interface MemberDetail {
  userId: string;
  name: string;
  surname: string;
  email: string;
}

interface ListDetailSheetProps {
  list: ListData | null;
  open: boolean;
  currentUser: UserInfo | null;
  onClose: () => void;
  onListUpdate: (list: ListData) => void;
  refreshLists: () => Promise<void>;
}

export default function ListDetailSheet({
  list,
  open,
  currentUser,
  onClose,
  onListUpdate,
  refreshLists,
}: ListDetailSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [titleValue, setTitleValue] = React.useState("");
  const [itemName, setItemName] = React.useState("");
  const [itemQty, setItemQty] = React.useState(1);
  const [filter, setFilter] = React.useState<"open" | "all">("open");
  const [detail, setDetail] = React.useState<ListData | null>(list);
  const [error, setError] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<MemberDetail[] | null>(null);
  const [owner, setOwner] = React.useState<MemberDetail | null>(null);
  const [candidates, setCandidates] = React.useState<MemberDetail[] | null>(
    null
  );
  const [selectedCandidate, setSelectedCandidate] = React.useState<string>("");
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const resolvedOwnerId =
    typeof detail?.ownerId === "object" && detail?.ownerId !== null
      ? (detail.ownerId as { _id: string })._id
      : detail?.ownerId;
  const isOwner = !!(
    currentUser &&
    resolvedOwnerId &&
    currentUser.userId === resolvedOwnerId
  );

  React.useEffect(() => {
    setDetail(list);
    setEditingTitle(false);
    setTitleValue(list?.title || "");
    setError(null);
    setMembers(null);
    setOwner(null);
  }, [list]);

  React.useEffect(() => {
    const fetchDetail = async () => {
      if (!open || !list) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/ShoppingList/${list._id}`);
        if (!res.ok) throw new Error("Nelze načíst detail");
        const data = await res.json();
        if (data.shoppingList) setDetail(data.shoppingList);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chyba načítání");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [open, list]);

  React.useEffect(() => {
    const fetchMembers = async () => {
      if (!open || !detail) return;
      try {
        const res = await fetch(`/api/ShoppingList/${detail._id}/members`);
        if (!res.ok) return; // ignore silently
        const data = await res.json();
        if (data.members) setMembers(data.members);
        if (data.owner) setOwner(data.owner);
        if (isOwner) {
          const candRes = await fetch(
            `/api/ShoppingList/${detail._id}/members/candidates`
          );
          if (candRes.ok) {
            const cd = await candRes.json();
            setCandidates(cd.candidates || []);
          }
        } else {
          setCandidates(null);
          setSelectedCandidate("");
        }
      } catch {
        // ignore
      }
    };
    fetchMembers();
  }, [open, detail, isOwner]);

  const updateTitle = async () => {
    if (!detail) return;
    const newTitle = titleValue.trim();
    if (!newTitle) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ShoppingList/${detail._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error("Nepodařilo se upravit název");
      const data = await res.json();
      setDetail(data.shoppingList);
      onListUpdate(data.shoppingList);
      setEditingTitle(false);
      await refreshLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba úpravy názvu");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    newStatus: "active" | "completed" | "archived"
  ) => {
    if (!detail) return;
    try {
      setUpdatingStatus(true);
      setError(null);
      const res = await fetch(`/api/ShoppingList/${detail._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Nepodařilo se změnit stav");
      const data = await res.json();
      setDetail(data.shoppingList);
      onListUpdate(data.shoppingList);
      await refreshLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba změny stavu");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addMember = async () => {
    if (!detail) return;
    const userId = selectedCandidate;
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ShoppingList/${detail._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Nepodařilo se přidat člena");
      setSelectedCandidate("");
      // refetch detail
      const ref = await fetch(`/api/ShoppingList/${detail._id}`);
      if (ref.ok) {
        const d = await ref.json();
        setDetail(d.shoppingList);
        onListUpdate(d.shoppingList);
      }
      await refreshLists();
      // refresh member details
      const mem = await fetch(`/api/ShoppingList/${detail._id}/members`);
      if (mem.ok) {
        const md = await mem.json();
        setMembers(md.members);
      }
      // refresh candidates
      const candRes = await fetch(
        `/api/ShoppingList/${detail._id}/members/candidates`
      );
      if (candRes.ok) {
        const cd = await candRes.json();
        setCandidates(cd.candidates || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba přidání člena");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!detail) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/ShoppingList/${detail._id}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Chyba odebrání člena");
      const ref = await fetch(`/api/ShoppingList/${detail._id}`);
      if (ref.ok) {
        const d = await ref.json();
        setDetail(d.shoppingList);
        onListUpdate(d.shoppingList);
      }
      await refreshLists();
      const mem = await fetch(`/api/ShoppingList/${detail._id}/members`);
      if (mem.ok) {
        const md = await mem.json();
        setMembers(md.members);
      }
      const candRes = await fetch(
        `/api/ShoppingList/${detail._id}/members/candidates`
      );
      if (candRes.ok) {
        const cd = await candRes.json();
        setCandidates(cd.candidates || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba odebrání člena");
    } finally {
      setLoading(false);
    }
  };

  const leaveList = async () => {
    if (!detail) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ShoppingList/${detail._id}/leave`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Chyba opuštění");
      await refreshLists();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba opuštění seznamu");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!detail) return;
    const name = itemName.trim();
    const qty = itemQty > 0 ? itemQty : 1;
    if (!name) return;
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic: Item = {
      _id: tempId,
      name,
      quantity: qty,
      purchased: false,
    };
    setDetail((d) =>
      d ? { ...d, items: [...(d.items || []), optimistic] } : d
    );
    setItemName("");
    setItemQty(1);
    try {
      const res = await fetch(`/api/ShoppingList/${detail._id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity: qty }),
      });
      if (!res.ok) throw new Error("Chyba přidání položky");
      const ref = await fetch(`/api/ShoppingList/${detail._id}`);
      if (ref.ok) {
        const d = await ref.json();
        setDetail(d.shoppingList);
        onListUpdate(d.shoppingList);
      }
      await refreshLists();
    } catch (e) {
      // rollback
      setDetail((d) =>
        d ? { ...d, items: (d.items || []).filter((i) => i._id !== tempId) } : d
      );
      setError(e instanceof Error ? e.message : "Chyba přidání položky");
    }
  };

  const removeItem = async (itemId: string) => {
    if (!detail) return;
    const prevItems = detail.items || [];
    setDetail((d) =>
      d ? { ...d, items: prevItems.filter((i) => i._id !== itemId) } : d
    );
    try {
      const res = await fetch(
        `/api/ShoppingList/${detail._id}/items/${itemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Chyba odebrání položky");
      const ref = await fetch(`/api/ShoppingList/${detail._id}`);
      if (ref.ok) {
        const d = await ref.json();
        setDetail(d.shoppingList);
        onListUpdate(d.shoppingList);
      }
      await refreshLists();
    } catch (e) {
      // rollback
      setDetail((d) => (d ? { ...d, items: prevItems } : d));
      setError(e instanceof Error ? e.message : "Chyba odebrání položky");
    }
  };

  const togglePurchased = async (itemId: string, purchased: boolean) => {
    if (!detail) return;
    const prevItems = detail.items || [];
    setDetail((d) =>
      d
        ? {
            ...d,
            items: prevItems.map((i) =>
              i._id === itemId ? { ...i, purchased } : i
            ),
          }
        : d
    );
    try {
      const res = await fetch(
        `/api/ShoppingList/${detail._id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchased }),
        }
      );
      if (!res.ok) throw new Error("Chyba změny položky");
      const ref = await fetch(`/api/ShoppingList/${detail._id}`);
      if (ref.ok) {
        const d = await ref.json();
        setDetail(d.shoppingList);
        onListUpdate(d.shoppingList);
      }
      await refreshLists();
    } catch (e) {
      // rollback
      setDetail((d) => (d ? { ...d, items: prevItems } : d));
      setError(e instanceof Error ? e.message : "Chyba změny položky");
    }
  };

  const visibleItems = (detail?.items || []).filter(
    (it) => filter === "all" || !it.purchased
  );
  const isRefObject = (
    x: string | OwnerRef
  ): x is { _id: string; email?: string; name?: string; surname?: string } =>
    typeof x === "object" && x !== null && "_id" in x;
  const memberIdStrings: string[] = React.useMemo(
    () =>
      (detail?.memberIds || [])
        .map((m: string | OwnerRef) => (isRefObject(m) ? m._id : (m as string)))
        .filter(Boolean) as string[],
    [detail?.memberIds]
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} side="right">
      <SheetHeader>
        {editingTitle && isOwner ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTitle();
            }}
            className="flex items-center gap-2 w-full"
          >
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={loading || !titleValue.trim()}
              className="bg-yellow-500 text-black hover:bg-yellow-400"
            >
              Uložit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingTitle(false);
                setTitleValue(detail?.title || "");
              }}
            >
              Zrušit
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="truncate">
                <SheetTitle>{detail?.title || "Seznam"}</SheetTitle>
              </div>
              <Badge
                className={cn(
                  detail?.status === "active" && "bg-yellow-500 text-black",
                  detail?.status === "completed" && "bg-green-500 text-black",
                  detail?.status === "archived" && "bg-gray-600 text-white"
                )}
              >
                {detail?.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <select
                  aria-label="Změnit stav seznamu"
                  className="bg-zinc-950 border border-zinc-800 rounded-md px-2 h-9 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                  value={detail?.status}
                  onChange={(e) =>
                    updateStatus(
                      e.target.value as "active" | "completed" | "archived"
                    )
                  }
                  disabled={updatingStatus}
                >
                  <option value="active">active</option>
                  <option value="completed">completed</option>
                  <option value="archived">archived</option>
                </select>
              )}
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTitle(true)}
                >
                  Upravit název
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetHeader>
      <SheetContent>
        {loading && (
          <div className="flex justify-center">
            <Spinner className="h-5 w-5" />
          </div>
        )}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {detail && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>
                Vlastník:{" "}
                {isOwner
                  ? "Ty"
                  : owner
                  ? `${owner.name} ${owner.surname}`
                  : typeof detail.ownerId === "object" && detail.ownerId
                  ? detail.ownerId.name ||
                    detail.ownerId.email ||
                    detail.ownerId._id
                  : detail.ownerId}
              </span>
            </div>

            <MembersSection
              isOwner={isOwner}
              currentUser={currentUser}
              loading={loading}
              members={members}
              candidates={candidates}
              selectedCandidate={selectedCandidate}
              setSelectedCandidate={setSelectedCandidate}
              removeMember={removeMember}
              addMember={addMember}
              leaveList={leaveList}
              memberIdStrings={memberIdStrings}
            />

            <ItemsSection
              isOwner={isOwner}
              currentUser={currentUser}
              loading={loading}
              filter={filter}
              setFilter={setFilter}
              itemName={itemName}
              setItemName={setItemName}
              itemQty={itemQty}
              setItemQty={setItemQty}
              visibleItems={visibleItems}
              addItem={addItem}
              togglePurchased={togglePurchased}
              removeItem={removeItem}
              memberIdStrings={memberIdStrings}
            />
          </div>
        )}
      </SheetContent>
      <SheetFooter>
        <Button variant="ghost" onClick={onClose}>
          Zavřít
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
