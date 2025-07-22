import { PrismaClient } from "@prisma/client";
import { composeOps } from "./operationUtils.js";

const prisma = new PrismaClient();

/**
 * Get the chain of operations between two versions
 * @param {string} fromVersionId - The starting version ID
 * @param {string} toVersionId - The target version ID
 * @param {string} roomId - The room ID string
 * @returns {Promise<{operations: Array, baseText: string}>} - The composed operations and base text
 */
export async function getOperationChain(fromVersionId, toVersionId, roomId) {
  // First, find the room by roomId
  const room = await prisma.room.findUnique({
    where: { roomId }
  });

  if (!room) {
    throw new Error(`Room with ID ${roomId} not found`);
  }

  // If fromVersionId is null, we're starting from the beginning
  if (!fromVersionId) {
    // Get the target version
    const targetVersion = await prisma.codeChange.findFirst({
      where: { versionId: toVersionId, roomId: room.id }
    });

    if (!targetVersion) {
      throw new Error("Target version not found");
    }

    return {
      operations: targetVersion.operations,
      baseText: "" // Starting with empty text
    };
  }

  // Get all versions in the room
  const allVersions = await prisma.codeChange.findMany({
    where: { roomId: room.id },
    orderBy: { timestamp: 'asc' }
  });

  // Build a map of version IDs to their index in the array
  const versionMap = new Map();
  allVersions.forEach((version, index) => {
    versionMap.set(version.versionId, index);
  });

  const fromIndex = versionMap.get(fromVersionId);
  const toIndex = versionMap.get(toVersionId);

  if (fromIndex === undefined || toIndex === undefined) {
    throw new Error("Version not found");
  }

  // Determine if we're going forward or backward in history
  if (fromIndex < toIndex) {
    // Going forward: compose operations from fromIndex to toIndex
    let composedOps = allVersions[fromIndex].operations;

    for (let i = fromIndex + 1; i <= toIndex; i++) {
      composedOps = composeOps(composedOps, allVersions[i].operations);
    }

    return {
      operations: composedOps,
      baseText: "" // The caller should have the base text
    };
  } else if (fromIndex > toIndex) {

    return {
      operations: allVersions[toIndex].operations,
      baseText: "" // The caller should reconstruct the base text
    };
  } else {
    // Same version, no change
    return {
      operations: [],
      baseText: "" // No change needed
    };
  }
}

/**
 * Get the full version history for a room with user information
 * @param {string} roomId - The room ID string
 * @returns {Promise<Array>} - The version history
 */
export async function getVersionHistory(roomId) {
  // First, find the room by roomId
  const room = await prisma.room.findUnique({
    where: { roomId }
  });

  if (!room) {
    throw new Error(`Room with ID ${roomId} not found`);
  }

  // Then find all code changes for that room
  return prisma.codeChange.findMany({
    where: { roomId: room.id }, // Use the room's numeric ID
    orderBy: { timestamp: 'desc' },
    include: { user: { include: { profile: true } } }
  });
}

/**
 * Find the common ancestor of two versions
 * @param {string} versionId1 - First version ID
 * @param {string} versionId2 - Second version ID
 * @param {string} roomId - The room ID string
 * @returns {Promise<string>} - The common ancestor version ID
 */
export async function findCommonAncestor(versionId1, versionId2, roomId) {
  // First, find the room by roomId
  const room = await prisma.room.findUnique({
    where: { roomId }
  });

  if (!room) {
    throw new Error(`Room with ID ${roomId} not found`);
  }

  // Get all versions in the room
  const allVersions = await prisma.codeChange.findMany({
    where: { roomId: room.id },
    orderBy: { timestamp: 'asc' }
  });

  // Build the version tree
  const versionTree = new Map();
  allVersions.forEach(version => {
    versionTree.set(version.versionId, version.parentId);
  });

  // Get the path from versionId1 to root
  const path1 = new Set();
  let current = versionId1;
  while (current) {
    path1.add(current);
    current = versionTree.get(current);
  }

  // Find the first ancestor of versionId2 that's in path1
  current = versionId2;
  while (current) {
    if (path1.has(current)) {
      return current; // This is the common ancestor
    }
    current = versionTree.get(current);
  }

  return null; // No common ancestor found
}
