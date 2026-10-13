export interface GaplessLoop {
  load(url: string): Promise<void>;
  start(): void;
  stop(): void;
  setVolume(volume: number): void;
  dispose(): void;
}

interface WindowWithLegacyAudio {
  webkitAudioContext?: typeof AudioContext;
}

function resolveAudioContextClass(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as WindowWithLegacyAudio).webkitAudioContext
  );
}

export function isGaplessLoopSupported(): boolean {
  return resolveAudioContextClass() !== undefined;
}

export function createGaplessLoop(): GaplessLoop | null {
  const ContextClass = resolveAudioContextClass();
  if (!ContextClass) return null;

  const context = new ContextClass();
  const gain = context.createGain();
  gain.connect(context.destination);

  let buffer: AudioBuffer | null = null;
  let loadedUrl: string | null = null;
  let source: AudioBufferSourceNode | null = null;
  let wantsPlaying = false;
  let offsetSeconds = 0;
  let startedAtContextTime = 0;
  let loadToken = 0;
  let pendingLoad: { url: string; promise: Promise<void> } | null = null;

  const silence = () => {
    if (!source) return;
    offsetSeconds = buffer
      ? (context.currentTime - startedAtContextTime) % buffer.duration
      : 0;
    source.stop();
    source.disconnect();
    source = null;
  };

  const begin = () => {
    if (!buffer || source) return;
    const node = context.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    node.connect(gain);
    node.start(0, offsetSeconds);
    startedAtContextTime = context.currentTime - offsetSeconds;
    source = node;
  };

  return {
    load(url) {
      if (buffer && url === loadedUrl) return Promise.resolve();
      if (pendingLoad?.url === url) return pendingLoad.promise;

      const token = ++loadToken;
      const promise = (async () => {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(
            `gapless loop: failed to fetch ${url} (${response.status})`,
          );
        const decoded = await context.decodeAudioData(
          await response.arrayBuffer(),
        );
        if (token !== loadToken) return;
        silence();
        buffer = decoded;
        loadedUrl = url;
        offsetSeconds = 0;
        if (wantsPlaying) begin();
      })().finally(() => {
        if (pendingLoad?.promise === promise) pendingLoad = null;
      });
      pendingLoad = { url, promise };
      return promise;
    },
    start() {
      wantsPlaying = true;
      void context.resume().catch(() => {});
      begin();
    },
    stop() {
      wantsPlaying = false;
      silence();
    },
    setVolume(volume) {
      gain.gain.value = volume;
    },
    dispose() {
      wantsPlaying = false;
      loadToken += 1;
      silence();
      void context.close().catch(() => {});
    },
  };
}
