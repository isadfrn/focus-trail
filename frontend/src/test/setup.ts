import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement these, but Radix UI calls them. Stub so components
// (e.g. the ToggleGroup on the login screen) render without throwing in tests.
const proto = Element.prototype as unknown as Record<string, unknown>;
if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
