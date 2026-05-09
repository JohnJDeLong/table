export type SidebarAdvisor = {
  id: string;
  profileId: string;
  speakerId: string;
  name: string;
  provider: string;
  enabled: boolean;
  position: number;
};

export type SidebarTable = {
  id: string;
  name: string;
  description: string | null;
  pauseThreshold: number;
  maxTurnsPerRound: number;
  advisors: SidebarAdvisor[];
};

export type SidebarWorkspace = {
  id: string;
  name: string;
  tables: SidebarTable[];
};

export type SidebarData = {
  workspaces: SidebarWorkspace[];
};
