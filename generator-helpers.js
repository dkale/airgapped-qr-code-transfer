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

  const api = {
    buildTransferName,
    findSupportedChunkSize,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GeneratorHelpers = api;
})(typeof globalThis !== "undefined" ? globalThis : window);