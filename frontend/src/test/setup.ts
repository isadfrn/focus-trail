import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

import i18n from "../i18n";

await i18n.changeLanguage("pt");

beforeEach(async () => {
  await i18n.changeLanguage("pt");
});

const proto = Element.prototype as unknown as Record<string, unknown>;
proto.hasPointerCapture ??= () => false;
proto.setPointerCapture ??= () => {};
proto.releasePointerCapture ??= () => {};
proto.scrollIntoView ??= () => {};

const media = HTMLMediaElement.prototype as unknown as Record<string, unknown>;
media.play = function play() {
  return Promise.resolve();
};
media.pause = function pause() {};

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
