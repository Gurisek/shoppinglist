"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

export interface MemberDetail {
  userId: string;
  name: string;
  surname: string;
  email: string;
}

export default function MembersSection({
  isOwner,
  currentUser,
  loading,
  members,
  candidates,
  selectedCandidate,
  setSelectedCandidate,
  removeMember,
  addMember,
  leaveList,
  memberIdStrings,
}: {
  isOwner: boolean;
  currentUser: { userId: string } | null;
  loading: boolean;
  members: MemberDetail[] | null;
  owner?: MemberDetail | null;
  candidates: MemberDetail[] | null;
  selectedCandidate: string;
  setSelectedCandidate: (v: string) => void;
  removeMember: (memberId: string) => void;
  addMember: () => void;
  leaveList: () => void;
  memberIdStrings: string[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-white">Členové</h3>
      <div className="flex flex-wrap gap-2">
        {members &&
          members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
            >
              <span title={m.email}>
                {m.userId === currentUser?.userId
                  ? "Ty"
                  : `${m.name} ${m.surname}`}
              </span>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 px-1"
                  onClick={() => removeMember(m.userId)}
                  disabled={loading}
                >
                  ×
                </Button>
              )}
            </div>
          ))}
        {(!members || members.length === 0) && (
          <p className="text-xs text-zinc-500">Žádní členové</p>
        )}
      </div>
      {isOwner && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMember();
          }}
          className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
        >
          <select
            aria-label="Vybrat uživatele k přidání"
            className="w-full sm:flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 h-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            disabled={loading}
          >
            <option value="">Přidat uživatele…</option>
            {candidates?.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.email} ({u.name})
              </option>
            ))}
          </select>
          <Button
            type="submit"
            disabled={loading || !selectedCandidate}
            className="w-full sm:w-auto bg-amber-500 hover:bg-yellow-400 text-black"
          >
            Přidat
          </Button>
        </form>
      )}
      {!isOwner &&
        currentUser &&
        memberIdStrings.includes(currentUser.userId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={leaveList}
            disabled={loading}
            className="text-red-400 hover:text-red-300"
          >
            Odejít ze seznamu
          </Button>
        )}
    </div>
  );
}
