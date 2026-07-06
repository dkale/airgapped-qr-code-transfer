(function (globalScope) {
  const buildTransferName = (fileName, maxTransferNameLength = 60) => {
    let dotIndex = fileName.lastIndexOf(".");
    let extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";
    let baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    let sanitizedBase = baseName
      .replace(/[^A-Za-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!sanitizedBase) {
      sanitizedBase = "transfer";
    }
    let maxBaseLength = Math.max(1, maxTransferNameLength - extension.length);
    if (sanitizedBase.length > maxBaseLength) {
      sanitizedBase = sanitizedBase.slice(0, maxBaseLength);
    }
    return sanitizedBase + extension;
  };

  const findSupportedChunkSize = ({
    dataLength,
    initialChunkSize,
    minimumChunkSize,
    canRenderMetadata,
    canRenderChunk,
    buildMetadata = () => undefined,
    buildChunkPayload = () => undefined,
  }) => {
    let activeChunkSize = initialChunkSize;

    while (activeChunkSize >= minimumChunkSize) {
      let totalChunks = Math.ceil(dataLength / activeChunkSize);
      let metadataPayload = buildMetadata({
        chunkSize: activeChunkSize,
        dataLength,
        totalChunks,
      });

      if (!canRenderMetadata(metadataPayload)) {
        if (activeChunkSize === minimumChunkSize) {
          break;
        }
        activeChunkSize = Math.max(minimumChunkSize, Math.floor(activeChunkSize * 0.8));
        continue;
      }

      if (totalChunks > 0) {
        let samplePayload = buildChunkPayload({
          chunkIndex: 0,
          chunkSize: activeChunkSize,
          dataLength,
          totalChunks,
        });

        if (!canRenderChunk(samplePayload)) {
          if (activeChunkSize === minimumChunkSize) {
            break;
          }
          activeChunkSize = Math.max(minimumChunkSize, Math.floor(activeChunkSize * 0.8));
          continue;
        }
      }

      return {
        chunkSize: activeChunkSize,
        totalChunks,
      };
    }

    return null;
  };

  const getTransferControls = ({
    hasPreparedTransfer,
    isPreparing,
    isTransferring,
    isPaused,
    nextChunkIndex,
    totalChunks,
  }) => {
    if (isPreparing) {
      return {
        primaryLabel: "Preparing Transfer...",
        primaryDisabled: true,
        showPrimary: true,
        showPause: false,
        showReset: false,
        progressLabel: "Preparing transfer data",
      };
    }

    if (isTransferring) {
      return {
        primaryLabel: "Transfer Running",
        primaryDisabled: true,
        showPrimary: false,
        showPause: true,
        showReset: false,
        progressLabel:
          totalChunks > 0
            ? `Sending chunk ${Math.min(nextChunkIndex + 1, totalChunks)} of ${totalChunks}`
            : "Sending transfer",
      };
    }

    if (isPaused) {
      return {
        primaryLabel: "Resume Transfer",
        primaryDisabled: false,
        showPrimary: true,
        showPause: false,
        showReset: true,
        progressLabel:
          totalChunks > 0
            ? `Paused at chunk ${Math.min(nextChunkIndex + 1, totalChunks)} of ${totalChunks}`
            : "Transfer paused",
      };
    }

    if (hasPreparedTransfer) {
      return {
        primaryLabel: nextChunkIndex > 0 ? "Resume Transfer" : "Start Transfer",
        primaryDisabled: false,
        showPrimary: true,
        showPause: false,
        showReset: true,
        progressLabel:
          totalChunks > 0
            ? `Ready to send ${totalChunks} chunks`
            : "Transfer is ready",
      };
    }

    return {
      primaryLabel: "Prepare & Start Transfer",
      primaryDisabled: false,
      showPrimary: true,
      showPause: false,
      showReset: false,
      progressLabel: "No transfer in progress",
    };
  };

  const api = {
    buildTransferName,
    findSupportedChunkSize,
    getTransferControls,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GeneratorHelpers = api;
})(typeof globalThis !== "undefined" ? globalThis : window);