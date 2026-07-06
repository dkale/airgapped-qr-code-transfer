const assert = require("assert");

const { findSupportedChunkSize } = require("./generator-helpers.js");

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

console.log("generator-helpers.test.js passed");