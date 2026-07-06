const assert = require("assert");

const {
  buildTransferMetadata,
  shouldResetDecodedChunks,
  describeReceiverStatus,
} = require("./transfer-protocol.js");

(() => {
  assert.deepStrictEqual(
    buildTransferMetadata({
      transferId: "transfer-1",
      name: "demo.bin",
      totalChunks: 12,
      status: "paused",
      nextChunkIndex: 4,
    }),
    {
      transfer_id: "transfer-1",
      name: "demo.bin",
      chunks: 12,
      status: "paused",
      next_chunk: 4,
      protocol_version: 2,
    }
  );
})();

(() => {
  assert.strictEqual(
    shouldResetDecodedChunks(
      { transfer_id: "transfer-1", name: "demo.bin", chunks: 12 },
      { transfer_id: "transfer-1", name: "demo.bin", chunks: 12, status: "resume" }
    ),
    false
  );

  assert.strictEqual(
    shouldResetDecodedChunks(
      { transfer_id: "transfer-1", name: "demo.bin", chunks: 12 },
      { transfer_id: "transfer-2", name: "demo.bin", chunks: 12, status: "ready" }
    ),
    true
  );
})();

(() => {
  assert.strictEqual(
    describeReceiverStatus({
      metadata: {
        transfer_id: "transfer-1",
        name: "demo.bin",
        chunks: 12,
        status: "paused",
        next_chunk: 4,
      },
      decodedChunkCount: 4,
    }),
    "Sender paused at chunk 5 of 12"
  );

  assert.strictEqual(
    describeReceiverStatus({
      metadata: {
        transfer_id: "transfer-1",
        name: "demo.bin",
        chunks: 12,
        status: "resume",
        next_chunk: 4,
      },
      decodedChunkCount: 4,
    }),
    "Transfer resumed. Waiting for chunk 5 of 12"
  );
})();

console.log("transfer-protocol.test.js passed");