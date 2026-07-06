(function (globalScope) {
  const createTransferId = () =>
    `transfer-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  const buildTransferMetadata = ({
    transferId,
    name,
    totalChunks,
    status = "ready",
    nextChunkIndex = 0,
  }) => ({
    transfer_id: transferId,
    name,
    chunks: totalChunks,
    status,
    next_chunk: nextChunkIndex,
    protocol_version: 2,
  });

  const parseTransferMetadata = (payload) => {
    try {
      const parsed = JSON.parse(payload);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.transfer_id !== "string" ||
        typeof parsed.name !== "string" ||
        typeof parsed.chunks !== "number"
      ) {
        return null;
      }

      return {
        transfer_id: parsed.transfer_id,
        name: parsed.name,
        chunks: parsed.chunks,
        status: typeof parsed.status === "string" ? parsed.status : "ready",
        next_chunk:
          typeof parsed.next_chunk === "number" ? parsed.next_chunk : 0,
        protocol_version:
          typeof parsed.protocol_version === "number"
            ? parsed.protocol_version
            : 1,
      };
    } catch (error) {
      return null;
    }
  };

  const isTransferMetadataPayload = (payload) =>
    parseTransferMetadata(payload) !== null;

  const shouldResetDecodedChunks = (currentMetadata, incomingMetadata) => {
    if (!incomingMetadata || !incomingMetadata.transfer_id) {
      return true;
    }

    if (!currentMetadata || !currentMetadata.transfer_id) {
      return true;
    }

    return (
      currentMetadata.transfer_id !== incomingMetadata.transfer_id ||
      currentMetadata.name !== incomingMetadata.name ||
      currentMetadata.chunks !== incomingMetadata.chunks
    );
  };

  const describeReceiverStatus = ({ metadata, decodedChunkCount }) => {
    if (!metadata || !metadata.name) {
      return "Click receive button to start receiving";
    }

    const totalChunks = metadata.chunks || 0;
    const nextChunkNumber = Math.min(
      (typeof metadata.next_chunk === "number"
        ? metadata.next_chunk
        : decodedChunkCount) + 1,
      Math.max(totalChunks, 1)
    );

    if (metadata.status === "paused") {
      return `Sender paused at chunk ${nextChunkNumber} of ${totalChunks}`;
    }

    if (metadata.status === "resume") {
      return `Transfer resumed. Waiting for chunk ${nextChunkNumber} of ${totalChunks}`;
    }

    if (metadata.status === "ready") {
      return `Ready to receive ${metadata.name}`;
    }

    return `Receiving ${metadata.name}: ${decodedChunkCount} / ${totalChunks} chunks`;
  };

  const api = {
    createTransferId,
    buildTransferMetadata,
    parseTransferMetadata,
    isTransferMetadataPayload,
    shouldResetDecodedChunks,
    describeReceiverStatus,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.TransferProtocol = api;
})(typeof globalThis !== "undefined" ? globalThis : window);