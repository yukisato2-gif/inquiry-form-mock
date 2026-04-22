"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export default function RootPage() {
  const router = useRouter();
  const currentRole = useAppStore((s) => s.currentRole);

  useEffect(() => {
    switch (currentRole) {
      case "poster":
        router.replace("/post");
        break;
      case "reception":
      case "management":
        router.replace("/admin/dashboard");
        break;
    }
  }, [currentRole, router]);

  return null;
}
