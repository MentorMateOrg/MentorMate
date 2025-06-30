-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "fieldOfKnowledge" TEXT,
ALTER COLUMN "github_url" DROP NOT NULL,
ALTER COLUMN "linkedin_url" DROP NOT NULL;
