import { prisma } from "../config/prisma.js";
import {
  AdvisorOwnerType,
  AdvisorVisibility,
  Provider,
  WorkspaceRole,
} from "../generated/prisma/enums.js";

const defaultWorkspaceId = "seed_workspace_default";
const defaultBoardroomId = "seed_boardroom_default";
const defaultUserEmail = "john@table.local";

const defaultAdvisors = [
  {
    id: "seed_advisor_anthropic",
    displayName: "Anthropic",
    description: "You are the Anthropic advisor at Table",
    provider: Provider.anthropic,
    ratingModel: "claude-haiku-4-5-20251001",
    responseModel: "claude-haiku-4-5-20251001",
    enabled: true,
    systemPrompt:
      "You are the Anthropic advisor at Table. Speak when you can add meaningful value.",
  },
  {
    id: "seed_advisor_openai",
    displayName: "OpenAI",
    description: "You are the OpenAI advisor at Table",
    provider: Provider.openai,
    ratingModel: "gpt-5.5",
    responseModel: "gpt-5.5",
    enabled: true,
    systemPrompt:
      "You are the OpenAI advisor at Table. Speak when you can add meaningful value.",
  },
  {
    id: "seed_advisor_gemini",
    displayName: "Gemini",
    description: "You are the Gemini advisor at Table",
    provider: Provider.gemini,
    ratingModel: "not-configured-yet",
    responseModel: "not-configured-yet",
    enabled: false,
    systemPrompt:
      "You are the Gemini advisor at Table. Speak when you can add meaningful value.",
  },
  {
    id: "seed_advisor_grok",
    displayName: "Grok",
    description: "You are the Grok advisor at Table",
    provider: Provider.grok,
    ratingModel: "not-configured-yet",
    responseModel: "not-configured-yet",
    enabled: false,
    systemPrompt:
      "You are the Grok advisor at Table. Speak when you can add meaningful value.",
  },
];



async function main() {
  const user = await prisma.user.upsert({
    where: { email: defaultUserEmail },
    update: { displayName: "John" },
    create: {
      email: defaultUserEmail,
      displayName: "John",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: defaultWorkspaceId },
    update: { name: "Default Workspace" },
    create: {
      id: defaultWorkspaceId,
      name: "Default Workspace",
    },
  });

  await prisma.workspaceMember.upsert({
    where: { id: "seed_workspace_member_owner" },
    update: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.owner,
    },
    create: {
      id: "seed_workspace_member_owner",
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.owner,
    },
  });

  const boardroom = await prisma.boardroom.upsert({
    where: { id: defaultBoardroomId },
    update: {
      workspaceId: workspace.id,
      name: "Default Boardroom",
      description: "The default MVP room for provider-backed advisors.",
      pauseThreshold: 3,
      maxTurnsPerRound: 10,
    },
    create: {
      id: defaultBoardroomId,
      workspaceId: workspace.id,
      name: "Default Boardroom",
      description: "The default MVP room for provider-backed advisors.",
      pauseThreshold: 3,
      maxTurnsPerRound: 10,
    },
  });

  for (const [index, advisor] of defaultAdvisors.entries()) {
    const profile = await prisma.advisorProfile.upsert({
      where: { id: advisor.id },
      update: {
        ownerType: AdvisorOwnerType.workspace,
        ownerWorkspaceId: workspace.id,
        ownerUserId: null,
        visibility: AdvisorVisibility.workspace,
        canCopy: true,
        displayName: advisor.displayName,
        description: advisor.description,
        provider: advisor.provider,
        systemPrompt: advisor.systemPrompt,
        ratingModel: advisor.ratingModel,
        responseModel: advisor.responseModel,
      },
      create: {
        id: advisor.id,
        ownerType: AdvisorOwnerType.workspace,
        ownerWorkspaceId: workspace.id,
        visibility: AdvisorVisibility.workspace,
        canCopy: true,
        displayName: advisor.displayName,
        description: advisor.description,
        provider: advisor.provider,
        systemPrompt: advisor.systemPrompt,
        ratingModel: advisor.ratingModel,
        responseModel: advisor.responseModel,
      },
    });

    await prisma.boardroomAdvisor.upsert({
      where: { id: `seed_boardroom_advisor_${advisor.provider}` },
      update: {
        boardroomId: boardroom.id,
        advisorProfileId: profile.id,
        enabled: advisor.enabled,
        position: index + 1,
      },
      create: {
        id: `seed_boardroom_advisor_${advisor.provider}`,
        boardroomId: boardroom.id,
        advisorProfileId: profile.id,
        enabled: advisor.enabled,
        position: index + 1,
      },
    });
  }

  console.log("Seeded default Table workspace, boardroom, and advisors.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
