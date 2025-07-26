/*
  Warnings:

  - You are about to drop the `GroupMembership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MentorshipGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_menteeId_fkey";

-- DropForeignKey
ALTER TABLE "MentorshipGroup" DROP CONSTRAINT "MentorshipGroup_mentorId_fkey";

-- DropTable
DROP TABLE "GroupMembership";

-- DropTable
DROP TABLE "MentorshipGroup";
