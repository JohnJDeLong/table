-- Rename Boardroom product concept to Table without dropping data.
ALTER TABLE "Boardroom" RENAME TO "Table";
ALTER TABLE "BoardroomAdvisor" RENAME TO "TableAdvisor";

ALTER TABLE "TableAdvisor" RENAME COLUMN "boardroomId" TO "tableId";
ALTER TABLE "Conversation" RENAME COLUMN "boardroomId" TO "tableId";

ALTER TABLE "Table" RENAME CONSTRAINT "Boardroom_pkey" TO "Table_pkey";
ALTER TABLE "TableAdvisor" RENAME CONSTRAINT "BoardroomAdvisor_pkey" TO "TableAdvisor_pkey";
ALTER TABLE "Table" RENAME CONSTRAINT "Boardroom_workspaceId_fkey" TO "Table_workspaceId_fkey";
ALTER TABLE "TableAdvisor" RENAME CONSTRAINT "BoardroomAdvisor_boardroomId_fkey" TO "TableAdvisor_tableId_fkey";
ALTER TABLE "TableAdvisor" RENAME CONSTRAINT "BoardroomAdvisor_advisorProfileId_fkey" TO "TableAdvisor_advisorProfileId_fkey";
ALTER TABLE "Conversation" RENAME CONSTRAINT "Conversation_boardroomId_fkey" TO "Conversation_tableId_fkey";

ALTER INDEX "Boardroom_workspaceId_idx" RENAME TO "Table_workspaceId_idx";
ALTER INDEX "BoardroomAdvisor_advisorProfileId_idx" RENAME TO "TableAdvisor_advisorProfileId_idx";
ALTER INDEX "BoardroomAdvisor_boardroomId_advisorProfileId_key" RENAME TO "TableAdvisor_tableId_advisorProfileId_key";
ALTER INDEX "Conversation_boardroomId_idx" RENAME TO "Conversation_tableId_idx";

UPDATE "Table"
SET "id" = 'seed_table_default'
WHERE "id" = 'seed_boardroom_default';

UPDATE "Table"
SET
    "name" = 'Default Table',
    "description" = 'The default MVP table for provider-backed advisors.'
WHERE "id" = 'seed_table_default';

UPDATE "TableAdvisor"
SET "id" = REPLACE("id", 'seed_boardroom_advisor_', 'seed_table_advisor_')
WHERE "id" LIKE 'seed_boardroom_advisor_%';
