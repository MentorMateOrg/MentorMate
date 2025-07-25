/**
 * Operational Transformation Unit Tests
 *
 * This file contains comprehensive unit tests for the operational transformation system.
 * It tests the core functionality of generating deltas, applying operations, and transforming
 * concurrent operations to ensure the system correctly handles simultaneous edits.
 */

import generateDeltas from '../utils/delta.js';
import { applyOperations } from '../utils/applyOps.js';
import { transformOp } from '../utils/transform.js';
import { OP_INSERT, OP_DELETE, OP_RETAIN } from '../constants/operationTypes.js';
import { expect, describe, test } from '@jest/globals';
import { createInsertOp, createDeleteOp, createRetainOp } from '../utils/operationUtils.js';

describe('Operational Transformation Core Functionality', () => {
  describe('Delta Generation', () => {
    test('should generate deltas for text changes', () => {
      const oldText = 'Hello World';
      const newText = 'Hello Beautiful World';

      const operations = generateDeltas(oldText, newText);

      // Verify operations contain an insert
      expect(operations.some(op => op.type === OP_INSERT)).toBe(true);
      // Verify the inserted text is present
      const insertOp = operations.find(op => op.type === OP_INSERT);
      expect(insertOp.chars).toContain('Beautiful');
    });

    test('should generate deltas for deletion', () => {
      const oldText = 'Hello Beautiful World';
      const newText = 'Hello World';

      const operations = generateDeltas(oldText, newText);

      // Verify operations contain a delete
      expect(operations.some(op => op.type === OP_DELETE)).toBe(true);
    });

    test('should handle empty text correctly', () => {
      const oldText = '';
      const newText = 'Hello World';

      const operations = generateDeltas(oldText, newText);

      // Verify operations contain an insert with the full text
      const insertOp = operations.find(op => op.type === OP_INSERT);
      expect(insertOp).toBeDefined();
      expect(insertOp.chars).toBe('Hello World');
    });

    test('should handle complete text replacement', () => {
      const oldText = 'Hello World';
      const newText = 'Goodbye Universe';

      const operations = generateDeltas(oldText, newText);

      // Should delete the entire old text and insert the new text
      expect(operations.some(op => op.type === OP_DELETE)).toBe(true);
      expect(operations.some(op => op.type === OP_INSERT)).toBe(true);
    });
  });

  describe('Operation Application', () => {
    test('should apply insert operations correctly', () => {
      const text = 'Hello World';
      // Create operations that insert at the beginning
      const operations = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Beautiful '), // Insert "Beautiful "
        createRetainOp(5) // Retain "World"
      ];

      const result = applyOperations(text, operations);

      expect(result).toBe('Hello Beautiful World');
    });

    test('should apply delete operations correctly', () => {
      const text = 'Hello Beautiful World';
      // Create operations that delete "Beautiful "
      const operations = [
        createRetainOp(6), // Retain "Hello "
        createDeleteOp(10), // Delete "Beautiful "
        createRetainOp(5) // Retain "World"
      ];

      const result = applyOperations(text, operations);

      expect(result).toBe('Hello World');
    });

    test('should apply multiple operations in sequence', () => {
      const text = 'Hello World';
      const operations = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Beautiful '), // Insert "Beautiful "
        createRetainOp(0), // No-op
        createInsertOp('Amazing '), // Insert "Amazing "
        createRetainOp(5) // Retain "World"
      ];

      const result = applyOperations(text, operations);

      expect(result).toBe('Hello Beautiful Amazing World');
    });
  });

  describe('Operation Transformation', () => {
    test('should transform concurrent inserts at same position', () => {
      // User 1 inserts "Beautiful " after "Hello "
      const op1 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Beautiful ') // Insert "Beautiful "
      ];

      // User 2 inserts "Amazing " at the same position
      const op2 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Amazing ') // Insert "Amazing "
      ];

      // Transform op2 against op1
      const transformedOp2 = transformOp(op2, op1);

      // Apply operations to verify the result
      const baseText = 'Hello World';
      const afterOp1 = applyOperations(baseText, op1);
      const finalText = applyOperations(afterOp1, transformedOp2);

      // The final text should have both insertions
      expect(finalText).toContain('Beautiful');
      expect(finalText).toContain('Amazing');
      expect(finalText).toContain('Hello');
      expect(finalText).toContain('World');
    });

    test('should transform insert against delete', () => {
      // User 1 deletes "World"
      const op1 = [
        createRetainOp(6), // Retain "Hello "
        createDeleteOp(5) // Delete "World"
      ];

      // User 2 inserts "Amazing " before "World"
      const op2 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Amazing ') // Insert "Amazing "
      ];

      // Transform op2 against op1
      const transformedOp2 = transformOp(op2, op1);

      // Apply operations to verify the result
      const baseText = 'Hello World';
      const afterOp1 = applyOperations(baseText, op1);
      const finalText = applyOperations(afterOp1, transformedOp2);

      // The final text should have the insertion but not the deleted text
      expect(finalText).toBe('Hello Amazing ');
    });

    test('should transform delete against insert', () => {
      // User 1 inserts "Beautiful " after "Hello "
      const op1 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Beautiful ') // Insert "Beautiful "
      ];

      // User 2 deletes "World"
      const op2 = [
        createRetainOp(6), // Retain "Hello "
        createDeleteOp(5) // Delete "World"
      ];

      // Transform op2 against op1
      const transformedOp2 = transformOp(op2, op1);

      // Apply operations to verify the result
      const baseText = 'Hello World';
      const afterOp1 = applyOperations(baseText, op1);
      const finalText = applyOperations(afterOp1, transformedOp2);

      // The final text should have the insertion but not the deleted text
      expect(finalText).toBe('Hello Beautiful ');
    });

    test('should handle overlapping delete operations', () => {
      // User 1 deletes "Hello "
      const op1 = [
        createDeleteOp(6) // Delete "Hello "
      ];

      // User 2 deletes "Hello World"
      const op2 = [
        createDeleteOp(11) // Delete "Hello World"
      ];

      // Transform op2 against op1
      const transformedOp2 = transformOp(op2, op1);

      // Apply operations to verify the result
      const baseText = 'Hello World';
      const afterOp1 = applyOperations(baseText, op1);
      const finalText = applyOperations(afterOp1, transformedOp2);

      // The final text should be empty
      expect(finalText).toBe('');
    });
  });

  describe('Multi-user Scenarios', () => {
    test('should handle three users editing simultaneously', () => {
      const baseText = 'Hello World';

      // User 1 inserts "Beautiful " after "Hello "
      const op1 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Beautiful ') // Insert "Beautiful "
      ];

      // User 2 inserts "Amazing " after "Hello "
      const op2 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Amazing ') // Insert "Amazing "
      ];

      // User 3 inserts "Wonderful " after "Hello "
      const op3 = [
        createRetainOp(6), // Retain "Hello "
        createInsertOp('Wonderful ') // Insert "Wonderful "
      ];

      // Apply operations in sequence with transformations
      const afterOp1 = applyOperations(baseText, op1);

      // Transform op2 against op1
      const transformedOp2 = transformOp(op2, op1);
      const afterOp2 = applyOperations(afterOp1, transformedOp2);

      // Transform op3 against op1 and then against transformedOp2
      let transformedOp3 = transformOp(op3, op1);
      transformedOp3 = transformOp(transformedOp3, transformedOp2);
      const finalText = applyOperations(afterOp2, transformedOp3);

      // The final text should have all three insertions
      expect(finalText).toContain('Beautiful');
      expect(finalText).toContain('Amazing');
      expect(finalText).toContain('Wonderful');
      expect(finalText).toContain('Hello');
      expect(finalText).toContain('World');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty operations array', () => {
      const text = 'Hello World';
      const operations = [];

      const result = applyOperations(text, operations);

      expect(result).toBe('Hello World');
    });

    test('should handle operations on empty text', () => {
      const text = '';
      const operations = [
        createInsertOp('Hello World')
      ];

      const result = applyOperations(text, operations);

      expect(result).toBe('Hello World');
    });

    test('should handle large text efficiently', () => {
      // Create a large text (10KB)
      const largeText = 'a'.repeat(10000);
      const newText = largeText + 'b'.repeat(100);

      // Measure performance
      const startTime = performance.now();
      const operations = generateDeltas(largeText, newText);
      const result = applyOperations(largeText, operations);
      const endTime = performance.now();

      // Operations should complete in a reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result).toBe(newText);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle code editing scenario', () => {
      const oldCode = 'function hello() {\n  console.log("Hello");\n}';
      const newCode = 'function hello(name) {\n  console.log(`Hello ${name}`);\n}';

      const operations = generateDeltas(oldCode, newCode);
      const result = applyOperations(oldCode, operations);

      expect(result).toBe(newCode);
    });

    test('should handle JSON editing scenario', () => {
      const oldJson = '{\n  "name": "John",\n  "age": 30\n}';
      const newJson = '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}';

      const operations = generateDeltas(oldJson, newJson);
      const result = applyOperations(oldJson, operations);

      expect(result).toBe(newJson);
    });
  });
});
