import { useEffect, useState } from "react";
import type { SidebarData } from "../types/sidebar";

export function useSidebarData() {
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);

  useEffect(() => {
    async function loadSidebar() {
      const res = await fetch("/api/sidebar");
      const data = (await res.json()) as SidebarData;

      setSidebarData(data);
    }

    void loadSidebar();
  }, []);

  return { sidebarData };
}
