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
      progressLabel: "",
    };
  };

  const getFinalChunkHoldMs = (frameDelayMs) =>
    Math.max(120, Number(frameDelayMs) || 0);

  const parseRecoveryIndexes = (input, totalChunks) => {
    if (typeof input !== "string") {
      return { ok: false, error: "Please enter a list of chunk indexes or ranges." };
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return { ok: false, error: "Please enter at least one chunk index or range." };
    }

    const tokens = trimmed.split(",").map((token) => token.trim()).filter(Boolean);
    if (!tokens.length) {
      return { ok: false, error: "Please enter at least one chunk index or range." };
    }

    const seen = new Set();
    const indexes = [];

    for (const token of tokens) {
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (start > end) {
          return {
            ok: false,
            error: "Ranges must be entered as start-end with the start value coming first.",
          };
        }
        for (let index = start; index <= end; index += 1) {
          if (index < 0 || index >= totalChunks) {
            return {
              ok: false,
              error: `Chunk index ${index} is outside the valid range 0-${Math.max(totalChunks - 1, 0)}.`,
            };
          }
          if (seen.has(index)) {
            return {
              ok: false,
              error: `Duplicate chunk index ${index} detected.`,
            };
          }
          seen.add(index);
          indexes.push(index);
        }
        continue;
      }

      const singleValueMatch = token.match(/^\d+$/);
      if (!singleValueMatch) {
        return {
          ok: false,
          error: "Please enter only whole numbers or ranges like 5-12.",
        };
      }

      const index = Number(token);
      if (index < 0 || index >= totalChunks) {
        return {
          ok: false,
          error: `Chunk index ${index} is outside the valid range 0-${Math.max(totalChunks - 1, 0)}.`,
        };
      }
      if (seen.has(index)) {
        return {
          ok: false,
          error: `Duplicate chunk index ${index} detected.`,
        };
      }
      seen.add(index);
      indexes.push(index);
    }

    return { ok: true, indexes };
  };

  const formatRecoveryIndexes = (indexes) => {
    if (!Array.isArray(indexes) || !indexes.length) {
      return "";
    }

    const sortedIndexes = [...indexes].sort((left, right) => left - right);
    const parts = [];
    let start = sortedIndexes[0];
    let previous = sortedIndexes[0];

    for (let i = 1; i < sortedIndexes.length; i += 1) {
      const current = sortedIndexes[i];
      if (current === previous + 1) {
        previous = current;
        continue;
      }

      if (start === previous) {
        parts.push(String(start));
      } else {
        parts.push(`${start}-${previous}`);
      }
      start = current;
      previous = current;
    }

    if (start === previous) {
      parts.push(String(start));
    } else {
      parts.push(`${start}-${previous}`);
    }

    return parts.join(", ");
  };

  const getMissingChunkSummary = ({ totalChunks, receivedIndexes }) => {
    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
      return "";
    }

    const receivedSet = new Set(Array.isArray(receivedIndexes) ? receivedIndexes : []);
    const missingIndexes = [];
    for (let index = 0; index < totalChunks; index += 1) {
      if (!receivedSet.has(index)) {
        missingIndexes.push(index);
      }
    }
    return formatRecoveryIndexes(missingIndexes);
  };

  const api = {
    buildTransferName,
    findSupportedChunkSize,
    getTransferControls,
    getFinalChunkHoldMs,
    parseRecoveryIndexes,
    formatRecoveryIndexes,
    getMissingChunkSummary,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GeneratorHelpers = api;
})(typeof globalThis !== "undefined" ? globalThis : window);