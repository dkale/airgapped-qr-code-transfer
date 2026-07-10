const assert = require("assert");

const {
  findSupportedChunkSize,
  getTransferControls,
  getFinalChunkHoldMs,
  parseRecoveryIndexes,
  formatRecoveryIndexes,
  getMissingChunkSummary,
} = require("./generator-helpers.js");

(() => {
  let metadataChecks = 0;
  let chunkChecks = 0;

  const result = findSupportedChunkSize({
    dataLength: 5000,
    initialChunkSize: 250,
    minimumChunkSize: 1,
    canRenderMetadata: () => {
      metadataChecks += 1;
      return true;
    },
    canRenderChunk: () => {
      chunkChecks += 1;
      return true;
    },
  });

  assert.deepStrictEqual(result, { chunkSize: 250, totalChunks: 20 });
  assert.strictEqual(metadataChecks, 1);
  assert.strictEqual(chunkChecks, 1);
})();

(() => {
  assert.deepStrictEqual(
    getTransferControls({
      hasPreparedTransfer: false,
      isPreparing: false,
      isTransferring: false,
      isPaused: false,
      nextChunkIndex: 0,
      totalChunks: 0,
    }),
    {
      primaryLabel: "Prepare & Start Transfer",
      primaryDisabled: false,
      showPrimary: true,
      showPause: false,
      showReset: false,
      progressLabel: "No transfer in progress",
    }
  );

  assert.deepStrictEqual(
    getTransferControls({
      hasPreparedTransfer: true,
      isPreparing: false,
      isTransferring: false,
      isPaused: true,
      nextChunkIndex: 8,
      totalChunks: 20,
    }),
    {
      primaryLabel: "Resume Transfer",
      primaryDisabled: false,
      showPrimary: true,
      showPause: false,
      showReset: true,
      progressLabel: "Paused at chunk 9 of 20",
    }
  );
  // The last chunk must remain visible long enough for the scanner to capture it.
  assert.strictEqual(getFinalChunkHoldMs(50), 120);
  assert.strictEqual(getFinalChunkHoldMs(180), 180);
})();

(() => {
  const validResult = parseRecoveryIndexes("5, 22, 35-60, 121, 250-255, 322", 400);
  assert.deepStrictEqual(validResult, {
    ok: true,
    indexes: [5, 22, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 121, 250, 251, 252, 253, 254, 255, 322],
  });
  assert.strictEqual(formatRecoveryIndexes([5, 22, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 121, 250, 251, 252, 253, 254, 255, 322]), "5, 22, 35-60, 121, 250-255, 322");
  assert.strictEqual(getMissingChunkSummary({ totalChunks: 10, receivedIndexes: [0, 1, 2, 4, 5, 7] }), "3, 6, 8-9");
})();

(() => {
  assert.deepStrictEqual(parseRecoveryIndexes("5-2", 20), {
    ok: false,
    error: "Ranges must be entered as start-end with the start value coming first.",
  });
  assert.deepStrictEqual(parseRecoveryIndexes("abc", 20), {
    ok: false,
    error: "Please enter only whole numbers or ranges like 5-12.",
  });
  assert.deepStrictEqual(parseRecoveryIndexes("20", 10), {
    ok: false,
    error: "Chunk index 20 is outside the valid range 0-9.",
  });
  assert.deepStrictEqual(parseRecoveryIndexes("5, 5", 10), {
    ok: false,
    error: "Duplicate chunk index 5 detected.",
  });
})();

console.log("generator-helpers.test.js passed");