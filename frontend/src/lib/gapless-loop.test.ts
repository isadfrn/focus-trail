import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createGaplessLoop, isGaplessLoopSupported } from "./gapless-loop";

class FakeBufferSource {
  buffer: unknown = null;
  loop = false;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  currentTime = 0;
  destination = {};
  gainNode = { gain: { value: 1 }, connect: vi.fn() };
  sources: FakeBufferSource[] = [];
  decodeAudioData = vi.fn(async () => ({ duration: 10 }) as AudioBuffer);
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createGain() {
    return this.gainNode;
  }

  createBufferSource() {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source;
  }
}

function lastContext(): FakeAudioContext {
  return FakeAudioContext.instances[FakeAudioContext.instances.length - 1];
}

function stubFetch(ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 404,
    arrayBuffer: async () => new ArrayBuffer(8),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  vi.stubGlobal("AudioContext", FakeAudioContext);
  window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, "AudioContext");
});

describe("gapless loop", () => {
  it("reports no support and returns null when Web Audio is missing", () => {
    Reflect.deleteProperty(window, "AudioContext");
    vi.unstubAllGlobals();

    expect(isGaplessLoopSupported()).toBe(false);
    expect(createGaplessLoop()).toBeNull();
  });

  it("reports support when an AudioContext exists", () => {
    expect(isGaplessLoopSupported()).toBe(true);
  });

  it("loads the file and plays a looping buffer source from the start", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");

    loop.start();
    await loop.load("rain.mp3");

    const [source] = lastContext().sources;
    expect(source.loop).toBe(true);
    expect(source.connect).toHaveBeenCalledWith(lastContext().gainNode);
    expect(source.start).toHaveBeenCalledWith(0, 0);
    expect(lastContext().resume).toHaveBeenCalled();
  });

  it("does not play until started, even after the file is loaded", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");

    await loop.load("rain.mp3");
    expect(lastContext().sources).toHaveLength(0);

    loop.start();
    expect(lastContext().sources).toHaveLength(1);
  });

  it("resumes from where it stopped, wrapped inside the buffer duration", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");
    loop.start();
    await loop.load("rain.mp3");
    const context = lastContext();

    context.currentTime = 25;
    loop.stop();
    expect(context.sources[0].stop).toHaveBeenCalled();
    expect(context.sources[0].disconnect).toHaveBeenCalled();

    context.currentTime = 40;
    loop.start();
    expect(context.sources[1].start).toHaveBeenCalledWith(0, 5);
  });

  it("ignores a second start while already playing", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");
    await loop.load("rain.mp3");

    loop.start();
    loop.start();

    expect(lastContext().sources).toHaveLength(1);
  });

  it("applies the volume to the gain node", () => {
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");

    loop.setVolume(0.35);

    expect(lastContext().gainNode.gain.value).toBe(0.35);
  });

  it("fetches a file only once and shares an in-flight load", async () => {
    const fetchMock = stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");

    await Promise.all([loop.load("rain.mp3"), loop.load("rain.mp3")]);
    await loop.load("rain.mp3");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("swaps to the new file while playing", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");
    loop.start();
    await loop.load("rain.mp3");
    const context = lastContext();

    await loop.load("birds.mp3");

    expect(context.sources[0].stop).toHaveBeenCalled();
    expect(context.sources).toHaveLength(2);
    expect(context.sources[1].start).toHaveBeenCalledWith(0, 0);
  });

  it("keeps the latest file when an older load finishes last", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");
    const context = lastContext();

    let releaseFirst: (buffer: AudioBuffer) => void = () => {};
    context.decodeAudioData
      .mockImplementationOnce(
        () => new Promise<AudioBuffer>((resolve) => (releaseFirst = resolve)),
      )
      .mockImplementationOnce(async () => ({ duration: 20 }) as AudioBuffer);

    const first = loop.load("rain.mp3");
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledTimes(1));
    const second = loop.load("birds.mp3");
    await second;
    releaseFirst({ duration: 10 } as AudioBuffer);
    await first;

    loop.start();
    expect(context.sources).toHaveLength(1);
    expect(context.sources[0].buffer).toEqual({ duration: 20 });
  });

  it("rejects when the file cannot be fetched", async () => {
    stubFetch(false);
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");

    await expect(loop.load("missing.mp3")).rejects.toThrow("failed to fetch");
  });

  it("allows retrying a file after a failed load", async () => {
    stubFetch(false);
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");
    await expect(loop.load("rain.mp3")).rejects.toThrow();

    const fetchMock = stubFetch(true);
    await loop.load("rain.mp3");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops and closes the context on dispose", async () => {
    stubFetch();
    const loop = createGaplessLoop();
    if (!loop) throw new Error("expected a loop");
    loop.start();
    await loop.load("rain.mp3");
    const context = lastContext();

    loop.dispose();

    expect(context.sources[0].stop).toHaveBeenCalled();
    expect(context.close).toHaveBeenCalled();
  });
});
