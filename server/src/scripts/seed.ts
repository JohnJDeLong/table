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

function createAdvisorPrompt(advisorName: string) {
  return `You are the ${advisorName} advisor inside Table, a multi-advisor room with a human user and other AI advisors.

Important context:
- You are not the only AI participant in this product.
- Other advisors may speak before or after you in the same visible conversation.
- The Table orchestrator controls which advisors speak.
- Do not explain that you cannot trigger or control other advisors.
- If the user asks for multiple advisors, answer only as yourself and trust the system to route the others.
- Do not tell the user that you are the only assistant or only AI in the conversation.
- Speak only as the ${advisorName} advisor.
- Speak when you can add meaningful value.`;
}


const defaultAdvisors = [
  {
    id: "seed_advisor_anthropic",
    displayName: "Claude",
    description: "You are the Claude advisor at Table",
    provider: Provider.anthropic,
    ratingModel: "claude-haiku-4-5-20251001",
    responseModel: "claude-haiku-4-5-20251001",
    enabled: true,
    systemPrompt: createAdvisorPrompt("Claude"),
  },
  {
    id: "seed_advisor_openai",
    displayName: "OpenAI",
    description: "You are the OpenAI advisor at Table",
    provider: Provider.openai,
    ratingModel: "gpt-5.5",
    responseModel: "gpt-5.5",
    enabled: true,
    systemPrompt: createAdvisorPrompt("OpenAI"),
  },
  {
    id: "seed_advisor_gemini",
    displayName: "Gemini",
    description: "You are the Gemini advisor at Table",
    provider: Provider.gemini,
    ratingModel: "gemini-2.5-flash-lite",
    responseModel: "gemini-2.5-flash",
    enabled: true,
    systemPrompt: createAdvisorPrompt("Gemini"),
  },
  {
    id: "seed_advisor_grok",
    displayName: "Grok",
    description: "You are the Grok advisor at Table",
    provider: Provider.grok,
    ratingModel: "grok-4-1-fast-non-reasoning",
    responseModel: "grok-4.3",
    enabled: true,
    systemPrompt: createAdvisorPrompt("Grok"),
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
