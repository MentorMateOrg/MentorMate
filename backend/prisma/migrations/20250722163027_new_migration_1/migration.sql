-- DropForeignKey
ALTER TABLE "CodeChange" DROP CONSTRAINT "CodeChange_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomSession" DROP CONSTRAINT "RoomSession_roomId_fkey";

-- AlterTable
ALTER TABLE "CodeChange" ALTER COLUMN "roomId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RoomSession" ALTER COLUMN "roomId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "RoomSession" ADD CONSTRAINT "RoomSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeChange" ADD CONSTRAINT "CodeChange_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;
