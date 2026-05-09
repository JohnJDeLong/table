import { useEffect, useState } from "react";
import type { SidebarData } from "../types/sidebar";

export function useSidebarData() {
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSidebar() {
      const res = await fetch("/api/sidebar");
      const data = (await res.json()) as SidebarData;

      setSidebarData(data);
    }

    void loadSidebar();
  }, []);

  const activeWorkspace =
    sidebarData?.workspaces.find(
      (workspace) => workspace.id === selectedWorkspaceId
    ) ??
    sidebarData?.workspaces[0] ??
    null;

  const activeTable =
    activeWorkspace?.tables.find((table) => table.id === selectedTableId) ??
    activeWorkspace?.tables[0] ??
    null;

  const sidebarAdvisors = activeTable?.advisors ?? [];

  const advisorDisplayNames = Object.fromEntries(
    sidebarAdvisors.map((advisor) => [advisor.speakerId, advisor.name])
  );

  function getSpeakerName(speakerId: string) {
    return advisorDisplayNames[speakerId] ?? speakerId;
  }

  function selectActiveTable() {
    if (activeWorkspace) {
      setSelectedWorkspaceId(activeWorkspace.id);
    }

    if (activeTable) {
      setSelectedTableId(activeTable.id);
    }
  }

  return {
    activeWorkspace,
    activeTable,
    sidebarAdvisors,
    selectActiveTable,
    getSpeakerName,
  };
}
