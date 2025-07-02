/*
  Warnings:

  - You are about to drop the column `github_url` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin_url` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "github_url",
DROP COLUMN "linkedin_url",
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT;
