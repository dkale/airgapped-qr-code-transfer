const assert = require("assert");

const {
  findSupportedChunkSize,
  getTransferControls,
  getFinalChunkHoldMs,
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

console.log("generator-helpers.test.js passed");