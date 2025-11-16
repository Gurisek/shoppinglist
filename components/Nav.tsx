"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";

export function Nav() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/Auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch {
      // no-op; keep UX simple
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between m-auto px-8 pt-3">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold">Shoplist</h1>
      </div>
      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant="default"
        className="bg-yellow-500 text-black hover:bg-yellow-400 border-none"
      >
        {isLoading ? "..." : "Logout"}
      </Button>
    </div>
  );
}
