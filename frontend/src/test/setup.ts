import "@testing-library/jest-dom/vitest";

const proto = Element.prototype as unknown as Record<string, unknown>;
if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
if (!proto.scrollIntoView) proto.scrollIntoView = () => {};

const media = HTMLMediaElement.prototype as unknown as Record<string, unknown>;
media.play = function play() {
  return Promise.resolve();
};
media.pause = function pause() {};
