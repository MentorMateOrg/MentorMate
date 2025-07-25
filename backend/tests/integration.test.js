/**
 * Integration Tests for Operational Transformation
 *
 * This file contains integration tests for the operational transformation system,
 * testing the interaction between the server and clients through Socket.io.
 *
 * NOTE: These tests require the server to be running on localhost:5000
 */

const { io } = require('socket.io-client');
const { generateDeltas } = require('../utils/delta');
const { applyOperations } = require('../utils/applyOps');
const { transformOp } = require('../utils/transform');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_ROOM_ID = 'test-room-' + Date.now();
const TEST_USER_1 = { id: '1', fullName: 'Test User 1', token: 'mock-token-1' };
const TEST_USER_2 = { id: '2', fullName: 'Test User 2', token: 'mock-token-2' };

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((token) => {
    if (token === 'mock-token-1') {
      return { id: 1, fullName: 'Test User 1' };
    } else if (token === 'mock-token-2') {
      return { id: 2, fullName: 'Test User 2' };
    }
    throw new Error('Invalid token');
  })
}));

describe('Socket.io Integration Tests', () => {
  let socket1, socket2;

  beforeAll((done) => {
    // Connect first user
    socket1 = io(SERVER_URL, {
      withCredentials: true,
      forceNew: true,
    });

    socket1.on('connect', () => {
      // Connect second user after first one is connected
      socket2 = io(SERVER_URL, {
        withCredentials: true,
        forceNew: true,
      });

      socket2.on('connect', () => {
        done();
      });
    });
  });

  afterAll(() => {
    // Disconnect both sockets
    if (socket1 && socket1.connected) {
      socket1.disconnect();
    }
    if (socket2 && socket2.connected) {
      socket2.disconnect();
    }
  });

  test('should join room and receive room state', (done) => {
    // Set up event handlers for first user
    socket1.once('room-state', (data) => {
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('language');
      expect(data).toHaveProperty('users');
      expect(data.users).toContain(TEST_USER_1.fullName);

      // Now join with second user
      socket2.emit('join-room', TEST_ROOM_ID, TEST_USER_2.token, TEST_USER_2.fullName);
    });

    // Set up event handlers for second user
    socket2.once('room-state', (data) => {
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('language');
      expect(data).toHaveProperty('users');
      expect(data.users).toContain(TEST_USER_1.fullName);
      expect(data.users).toContain(TEST_USER_2.fullName);
      done();
    });

    // Join room with first user
    socket1.emit('join-room', TEST_ROOM_ID, TEST_USER_1.token, TEST_USER_1.fullName);
  });

  test('should propagate code changes to other users', (done) => {
    const initialCode = '// Welcome to collaborative coding!\n// Start typing to see real-time updates';
    const newCode = '// Welcome to collaborative coding!\n// This is a test\n// Start typing to see real-time updates';

    // Set up event handler for second user to receive code update
    socket2.once('code-update', (data) => {
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('operations');
      expect(data.code).toBe(newCode);
      expect(data.userId).toBe(TEST_USER_1.id);

      // Apply the operations to verify they produce the expected result
      const result = applyOperations(initialCode, data.operations);
      expect(result).toBe(newCode);
      done();
    });

    // First user makes a code change
    socket1.emit('code-change', { code: newCode, userId: TEST_USER_1.id });
  });

  test('should handle concurrent edits correctly', (done) => {
    const baseCode = '// Welcome to collaborative coding!\n// This is a test\n// Start typing to see real-time updates';
    const user1Change = '// Welcome to collaborative coding!\n// This is a test by User 1\n// Start typing to see real-time updates';
    const user2Change = '// Welcome to collaborative coding!\n// This is a test by User 2\n// Start typing to see real-time updates';

    let user1UpdateReceived = false;
    let user2UpdateReceived = false;

    // Set up event handler for first user to receive code update from second user
    socket1.once('code-update', (data) => {
      expect(data).toHaveProperty('code');
      expect(data.userId).toBe(TEST_USER_2.id);
      user1UpdateReceived = true;

      if (user1UpdateReceived && user2UpdateReceived) {
        done();
      }
    });

    // Set up event handler for second user to receive code update from first user
    socket2.once('code-update', (data) => {
      expect(data).toHaveProperty('code');
      expect(data.userId).toBe(TEST_USER_1.id);
      user2UpdateReceived = true;

      if (user1UpdateReceived && user2UpdateReceived) {
        done();
      }
    });

    // Both users make concurrent edits
    socket1.emit('code-change', { code: user1Change, userId: TEST_USER_1.id });
    socket2.emit('code-change', { code: user2Change, userId: TEST_USER_2.id });
  });

  test('should save and retrieve versions', (done) => {
    const currentCode = '// Welcome to collaborative coding!\n// This is a test by User 1\n// Start typing to see real-time updates';
    let versionId;

    // Set up event handler for version saved notification
    socket1.once('version-saved', (data) => {
      expect(data).toHaveProperty('versionId');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('userName');
      expect(data.userId).toBe(TEST_USER_1.id);
      versionId = data.versionId;

      // Now get version history
      socket1.emit('get-version-history', TEST_ROOM_ID);
    });

    // Set up event handler for version history response
    socket1.once('version-history', (data) => {
      expect(data).toHaveProperty('versions');
      expect(Array.isArray(data.versions)).toBe(true);
      expect(data.versions.length).toBeGreaterThan(0);

      // Find our saved version
      const savedVersion = data.versions.find(v => v.versionId === versionId);
      expect(savedVersion).toBeDefined();
      expect(savedVersion.userId.toString()).toBe(TEST_USER_1.id);

      // Now apply the version
      socket1.emit('apply-version', { roomId: TEST_ROOM_ID, versionId });
    });

    // Set up event handler for version applied notification
    socket1.once('version-applied', (data) => {
      expect(data).toHaveProperty('versionId');
      expect(data.versionId).toBe(versionId);
      done();
    });

    // Save the current version
    socket1.emit('save-version', { code: currentCode, userId: TEST_USER_1.id });
  });

  test('should handle cursor position updates', (done) => {
    // Set up event handler for cursor update
    socket2.once('cursor-update', (data) => {
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('fullName');
      expect(data).toHaveProperty('position');
      expect(data.userId).toBe(TEST_USER_1.id);
      expect(data.fullName).toBe(TEST_USER_1.fullName);
      expect(data.position).toBe(10);
      done();
    });

    // Send cursor position update
    socket1.emit('cursor-position', { position: 10, roomId: TEST_ROOM_ID, userId: TEST_USER_1.id });
  });

  test('should handle user disconnection', (done) => {
    // Set up event handler for user left notification
    socket1.once('user-left', (data) => {
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('userCount');
      expect(data.userId).toBe(TEST_USER_2.id);
      expect(data.users).not.toContain(TEST_USER_2.fullName);
      expect(data.userCount).toBe(1);
      done();
    });

    // Disconnect second user
    socket2.disconnect();
  });
});
