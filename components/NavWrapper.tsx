"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Nav } from "./Nav";

export function NavWrapper() {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register"
  )
    return null;
  return <Nav />;
}
