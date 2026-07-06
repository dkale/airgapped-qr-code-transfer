importScripts("https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.3/pako.min.js");

self.addEventListener("message", async (event) => {
  const { type, requestId, buffer } = event.data || {};

  if (type !== "compress" || !(buffer instanceof ArrayBuffer)) {
    return;
  }

  try {
    const compressed = pako.gzip(buffer, { level: 9 });
    self.postMessage(
      {
        type: "compressed",
        requestId,
        buffer: compressed.buffer,
      },
      [compressed.buffer]
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId,
      message: error && error.message ? error.message : "Compression failed",
    });
  }
});