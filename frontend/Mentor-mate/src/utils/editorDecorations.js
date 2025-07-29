/**
 * Utility functions for creating editor decorations to highlight changes
 */

/**
 * Generate a consistent color based on a user ID
 * @param {string} userId - User ID to generate color for
 * @returns {string} - Hex color code
 */
export function getUserColor(userId) {
  // List of distinct colors for different users
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#FFD166", // Yellow
    "#6A0572", // Purple
    "#1A535C", // Dark teal
    "#FF9F1C", // Orange
    "#2EC4B6", // Turquoise
    "#E71D36", // Bright red
    "#FF9F1C", // Orange
    "#7209B7", // Violet
  ];

  // Generate a number from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Create decorations for text changes made by a specific user
 * @param {Object} monaco - Monaco editor instance
 * @param {Array} operations - Array of operations
 * @param {string} userId - ID of the user who made the changes
 * @param {Object} model - Monaco editor model
 * @returns {Array} - Array of editor decorations
 */
export function createChangeDecorations(monaco, operations, userId, model) {
  const decorations = [];
  let position = 0;

  // Get a color for this user
  const userColor = getUserColor(userId);

  for (const op of operations) {
    if (op.type === "insert") {
      // Convert position to line and column
      const startPos = model.getPositionAt(position);
      const endPos = model.getPositionAt(position + op.chars.length);

      // Create a decoration for inserted text
      decorations.push({
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        ),
        options: {
          inlineClassName: `inserted-text-${userId}`,
          className: `inserted-text-bg-${userId}`,
          hoverMessage: { value: `Added by user ${userId}` },
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          minimap: {
            color: userColor,
            position: monaco.editor.MinimapPosition.Inline,
          },
        },
      });
      position += op.chars.length;
    } else if (op.type === "retain") {
      position += op.count;
    }
    // We don't create decorations for delete operations as the text is already gone
  }

  return decorations;
}

/**
 * Add CSS styles for user-specific text highlighting
 * @param {string} userId - User ID to create styles for
 * @param {string} color - Color to use for highlighting
 */
export function addUserHighlightStyles(userId, color) {
  // Check if styles already exist
  const styleId = `user-highlight-${userId}`;
  if (document.getElementById(styleId)) {
    return;
  }

  // Create style element
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    .inserted-text-${userId} {
      border-bottom: 2px solid ${color};
    }
    .inserted-text-bg-${userId} {
      background-color: ${color}22; /* Color with low opacity */
      transition: background-color 2s ease-out;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Create a decoration for the cursor position of a user
 * @param {Object} monaco - Monaco editor instance
 * @param {number} position - Cursor position in the text
 * @param {string} userId - ID of the user
 * @param {string} userName - Name of the user
 * @param {Object} model - Monaco editor model
 * @returns {Object} - Editor decoration
 */
export function createCursorDecoration(
  monaco,
  position,
  userId,
  userName,
  model
) {
  const userColor = getUserColor(userId);
  const pos = model.getPositionAt(position);

  return {
    range: new monaco.Range(
      pos.lineNumber,
      pos.column,
      pos.lineNumber,
      pos.column
    ),
    options: {
      className: `cursor-${userId}`,
      hoverMessage: { value: userName },
      stickiness:
        monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      beforeContentClassName: `cursor-flag-${userId}`,
    },
  };
}

/**
 * Add CSS styles for user cursor
 * @param {string} userId - User ID to create styles for
 * @param {string} color - Color to use for cursor
 * @param {string} userName - Name of the user
 */
export function addUserCursorStyles(userId, color, userName) {
  // Check if styles already exist
  const styleId = `user-cursor-${userId}`;
  if (document.getElementById(styleId)) {
    return;
  }

  // Create style element
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    .cursor-${userId} {
      background-color: ${color};
      width: 2px !important;
      margin-left: -1px;
    }
    .cursor-flag-${userId}:before {
      content: "${userName}";
      background-color: ${color};
      color: white;
      font-size: 12px;
      padding: 2px 4px;
      border-radius: 3px;
      position: absolute;
      top: -20px;
      white-space: nowrap;
    }
  `;

  document.head.appendChild(style);
}
