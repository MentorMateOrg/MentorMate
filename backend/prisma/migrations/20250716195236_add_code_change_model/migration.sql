-- CreateTable
CREATE TABLE "CodeChange" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "versionId" TEXT NOT NULL,
    "parentId" TEXT,
    "operations" JSONB NOT NULL,

    CONSTRAINT "CodeChange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CodeChange" ADD CONSTRAINT "CodeChange_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeChange" ADD CONSTRAINT "CodeChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
