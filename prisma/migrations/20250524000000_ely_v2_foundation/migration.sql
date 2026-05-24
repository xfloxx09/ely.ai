-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('REGISTERED', 'PERSONALITY', 'COMPLETE');
CREATE TYPE "PersonalityVersion" AS ENUM ('SHORT', 'FULL');
CREATE TYPE "MemoryType" AS ENUM ('FACT', 'PREFERENCE', 'EVENT');
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'USAGE', 'BONUS');
CREATE TYPE "QuestStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'COMPLETED');

-- AlterEnum
ALTER TYPE "AiModule" ADD VALUE 'SCRIBE';
ALTER TYPE "AiModule" ADD VALUE 'KITCHEN';
ALTER TYPE "AiModule" ADD VALUE 'HABIT';
ALTER TYPE "AiModule" ADD VALUE 'RESEARCHER';
ALTER TYPE "AiModule" ADD VALUE 'MONEY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'REGISTERED';
ALTER TABLE "User" ADD COLUMN "personalityCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "soulSeekerProgress" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PersonalityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openness" INTEGER NOT NULL,
    "conscientiousness" INTEGER NOT NULL,
    "extraversion" INTEGER NOT NULL,
    "agreeableness" INTEGER NOT NULL,
    "neuroticism" INTEGER NOT NULL,
    "version" "PersonalityVersion" NOT NULL DEFAULT 'SHORT',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retakeCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PersonalityProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonaSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optOutPersonalization" BOOLEAN NOT NULL DEFAULT false,
    "toneOverride" TEXT,
    "communicationStyleSummary" TEXT,
    "shareTraitsWithNexus" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PersonaSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL DEFAULT 'FACT',
    "content" TEXT NOT NULL,
    "embeddingId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvatarProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rpmAvatarId" TEXT,
    "rpmUrl" TEXT,
    "traitSnapshot" JSONB,
    "evolutionStage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvatarProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvatarCosmetic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AvatarCosmetic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserCosmetic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cosmeticId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NexusUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "NexusUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElyCredits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ElyCredits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonaQuest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PersonaQuest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserQuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'LOCKED',
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "UserQuestProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MirrorReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MirrorReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityProfile_userId_key" ON "PersonalityProfile"("userId");
CREATE INDEX "PersonalityProfile_userId_idx" ON "PersonalityProfile"("userId");
CREATE UNIQUE INDEX "PersonaSettings_userId_key" ON "PersonaSettings"("userId");
CREATE INDEX "MemoryEntry_userId_createdAt_idx" ON "MemoryEntry"("userId", "createdAt");
CREATE UNIQUE INDEX "AvatarProfile_userId_key" ON "AvatarProfile"("userId");
CREATE UNIQUE INDEX "AvatarCosmetic_slug_key" ON "AvatarCosmetic"("slug");
CREATE UNIQUE INDEX "UserCosmetic_userId_cosmeticId_key" ON "UserCosmetic"("userId", "cosmeticId");
CREATE UNIQUE INDEX "NexusUsage_userId_period_key" ON "NexusUsage"("userId", "period");
CREATE UNIQUE INDEX "ElyCredits_userId_key" ON "ElyCredits"("userId");
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");
CREATE UNIQUE INDEX "PersonaQuest_slug_key" ON "PersonaQuest"("slug");
CREATE UNIQUE INDEX "UserQuestProgress_userId_questId_key" ON "UserQuestProgress"("userId", "questId");
CREATE UNIQUE INDEX "MirrorReport_userId_period_key" ON "MirrorReport"("userId", "period");
CREATE UNIQUE INDEX "UserApiKey_userId_provider_key" ON "UserApiKey"("userId", "provider");

-- AddForeignKey
ALTER TABLE "PersonalityProfile" ADD CONSTRAINT "PersonalityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonaSettings" ADD CONSTRAINT "PersonaSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvatarProfile" ADD CONSTRAINT "AvatarProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "AvatarCosmetic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NexusUsage" ADD CONSTRAINT "NexusUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElyCredits" ADD CONSTRAINT "ElyCredits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "PersonaQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MirrorReport" ADD CONSTRAINT "MirrorReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default persona quests
INSERT INTO "PersonaQuest" ("id", "slug", "title", "description", "xpReward", "active") VALUES
  ('quest_personality', 'complete-personality', 'Know Thyself', 'Complete your BFI-2 personality snapshot.', 25, true),
  ('quest_first_chat', 'first-ely-message', 'Say Hello', 'Send your first message to ELY.', 10, true),
  ('quest_heartfelt', 'heartfelt-message', 'From the Heart', 'Ask ELY to help you write a heartfelt message.', 15, true);

-- Mark existing users as complete (avoid forced re-onboarding)
UPDATE "User" SET "onboardingStep" = 'COMPLETE' WHERE "onboardingStep" = 'REGISTERED';
