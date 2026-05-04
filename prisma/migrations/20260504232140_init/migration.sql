-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('anthropic', 'openai', 'gemini', 'grok');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "AdvisorOwnerType" AS ENUM ('user', 'workspace');

-- CreateEnum
CREATE TYPE "AdvisorVisibility" AS ENUM ('private', 'workspace');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'complete', 'archived', 'error');

-- CreateEnum
CREATE TYPE "SpeakerType" AS ENUM ('user', 'advisor');

-- CreateEnum
CREATE TYPE "RoundEventType" AS ENUM ('urgency_scores', 'speaker_start', 'token', 'speaker_end', 'round_end', 'turn_cap_reached', 'user_interrupt', 'error');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorProfile" (
    "id" TEXT NOT NULL,
    "ownerType" "AdvisorOwnerType" NOT NULL,
    "ownerUserId" TEXT,
    "ownerWorkspaceId" TEXT,
    "visibility" "AdvisorVisibility" NOT NULL DEFAULT 'private',
    "canCopy" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "provider" "Provider" NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "ratingModel" TEXT NOT NULL,
    "responseModel" TEXT NOT NULL,
    "copiedFromAdvisorProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boardroom" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pauseThreshold" INTEGER NOT NULL DEFAULT 3,
    "maxTurnsPerRound" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boardroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardroomAdvisor" (
    "id" TEXT NOT NULL,
    "boardroomId" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardroomAdvisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "boardroomId" TEXT NOT NULL,
    "title" TEXT,
    "initialPrompt" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "pauseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "speakerType" "SpeakerType" NOT NULL,
    "speakerId" TEXT,
    "provider" "Provider",
    "turnIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UrgencyRating" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "advisorProfileId" TEXT,
    "advisorId" TEXT NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "urgency" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UrgencyRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundEvent" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "RoundEventType" NOT NULL,
    "advisorProfileId" TEXT,
    "advisorId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "AdvisorProfile_ownerUserId_idx" ON "AdvisorProfile"("ownerUserId");

-- CreateIndex
CREATE INDEX "AdvisorProfile_ownerWorkspaceId_idx" ON "AdvisorProfile"("ownerWorkspaceId");

-- CreateIndex
CREATE INDEX "AdvisorProfile_provider_idx" ON "AdvisorProfile"("provider");

-- CreateIndex
CREATE INDEX "Boardroom_workspaceId_idx" ON "Boardroom"("workspaceId");

-- CreateIndex
CREATE INDEX "BoardroomAdvisor_advisorProfileId_idx" ON "BoardroomAdvisor"("advisorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardroomAdvisor_boardroomId_advisorProfileId_key" ON "BoardroomAdvisor"("boardroomId", "advisorProfileId");

-- CreateIndex
CREATE INDEX "Conversation_workspaceId_idx" ON "Conversation"("workspaceId");

-- CreateIndex
CREATE INDEX "Conversation_boardroomId_idx" ON "Conversation"("boardroomId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_speakerType_idx" ON "Message"("speakerType");

-- CreateIndex
CREATE INDEX "Message_turnIndex_idx" ON "Message"("turnIndex");

-- CreateIndex
CREATE INDEX "UrgencyRating_conversationId_idx" ON "UrgencyRating"("conversationId");

-- CreateIndex
CREATE INDEX "UrgencyRating_advisorProfileId_idx" ON "UrgencyRating"("advisorProfileId");

-- CreateIndex
CREATE INDEX "UrgencyRating_advisorId_idx" ON "UrgencyRating"("advisorId");

-- CreateIndex
CREATE INDEX "UrgencyRating_turnIndex_idx" ON "UrgencyRating"("turnIndex");

-- CreateIndex
CREATE INDEX "RoundEvent_conversationId_idx" ON "RoundEvent"("conversationId");

-- CreateIndex
CREATE INDEX "RoundEvent_advisorProfileId_idx" ON "RoundEvent"("advisorProfileId");

-- CreateIndex
CREATE INDEX "RoundEvent_advisorId_idx" ON "RoundEvent"("advisorId");

-- CreateIndex
CREATE INDEX "RoundEvent_type_idx" ON "RoundEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "RoundEvent_conversationId_sequence_key" ON "RoundEvent"("conversationId", "sequence");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT "AdvisorProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT "AdvisorProfile_ownerWorkspaceId_fkey" FOREIGN KEY ("ownerWorkspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT "AdvisorProfile_copiedFromAdvisorProfileId_fkey" FOREIGN KEY ("copiedFromAdvisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boardroom" ADD CONSTRAINT "Boardroom_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardroomAdvisor" ADD CONSTRAINT "BoardroomAdvisor_boardroomId_fkey" FOREIGN KEY ("boardroomId") REFERENCES "Boardroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardroomAdvisor" ADD CONSTRAINT "BoardroomAdvisor_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_boardroomId_fkey" FOREIGN KEY ("boardroomId") REFERENCES "Boardroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UrgencyRating" ADD CONSTRAINT "UrgencyRating_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UrgencyRating" ADD CONSTRAINT "UrgencyRating_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundEvent" ADD CONSTRAINT "RoundEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundEvent" ADD CONSTRAINT "RoundEvent_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
