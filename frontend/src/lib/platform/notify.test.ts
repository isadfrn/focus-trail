import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isTauriMock = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ isTauri: () => isTauriMock() }));

const isPermissionGranted = vi.fn();
const requestPermission = vi.fn();
const sendNotification = vi.fn();
vi.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted: () => isPermissionGranted(),
  requestPermission: () => requestPermission(),
  sendNotification: (options: unknown) => sendNotification(options),
}));

async function loadNotify() {
  vi.resetModules();
  return import("./notify");
}

function stubWebNotification(permission: NotificationPermission) {
  const constructor = vi.fn();
  const requestWebPermission = vi.fn(() => Promise.resolve("granted"));
  Object.assign(constructor, {
    permission,
    requestPermission: requestWebPermission,
  });
  vi.stubGlobal("Notification", constructor);
  return { constructor, requestWebPermission };
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => isTauriMock.mockReturnValue(false));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("notifications on the web", () => {
  it("cannot notify when the browser has no Notification support", async () => {
    const { canNotify, requestNotifyPermission } = await loadNotify();
    vi.stubGlobal("Notification", undefined);
    expect(await canNotify()).toBe(false);
    expect(await requestNotifyPermission()).toBe(false);
  });

  it("can notify only when permission is granted", async () => {
    const { canNotify } = await loadNotify();
    stubWebNotification("default");
    expect(await canNotify()).toBe(false);
    stubWebNotification("granted");
    expect(await canNotify()).toBe(true);
  });

  it("does not ask again once permission is granted or denied", async () => {
    const { requestNotifyPermission } = await loadNotify();
    const granted = stubWebNotification("granted");
    expect(await requestNotifyPermission()).toBe(true);
    const denied = stubWebNotification("denied");
    expect(await requestNotifyPermission()).toBe(false);
    expect(granted.requestWebPermission).not.toHaveBeenCalled();
    expect(denied.requestWebPermission).not.toHaveBeenCalled();
  });

  it("asks for permission when it is still undecided", async () => {
    const { requestNotifyPermission } = await loadNotify();
    const { requestWebPermission } = stubWebNotification("default");
    expect(await requestNotifyPermission()).toBe(true);
    expect(requestWebPermission).toHaveBeenCalledTimes(1);
  });

  it("shows a notification with title and body when granted", async () => {
    const { notify } = await loadNotify();
    const { constructor } = stubWebNotification("granted");
    notify("Title", "Body");
    await flushPromises();
    expect(constructor).toHaveBeenCalledWith("Title", { body: "Body" });
  });

  it("shows a notification without options when there is no body", async () => {
    const { notify } = await loadNotify();
    const { constructor } = stubWebNotification("granted");
    notify("Title");
    await flushPromises();
    expect(constructor).toHaveBeenCalledWith("Title", undefined);
  });

  it("stays silent when permission is not granted", async () => {
    const { notify } = await loadNotify();
    const { constructor } = stubWebNotification("default");
    notify("Title", "Body");
    await flushPromises();
    expect(constructor).not.toHaveBeenCalled();
  });

  it("swallows errors thrown by the Notification constructor", async () => {
    const { notify } = await loadNotify();
    const { constructor } = stubWebNotification("granted");
    constructor.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => notify("Title", "Body")).not.toThrow();
    await flushPromises();
  });
});

describe("notifications on the desktop app", () => {
  beforeEach(() => {
    isTauriMock.mockReturnValue(true);
    stubWebNotification("denied");
  });

  it("reports the native permission instead of the web one", async () => {
    const { canNotify } = await loadNotify();
    isPermissionGranted.mockResolvedValue(true);
    expect(await canNotify()).toBe(true);
  });

  it("cannot notify when the native check fails", async () => {
    const { canNotify } = await loadNotify();
    isPermissionGranted.mockRejectedValue(new Error("ipc denied"));
    expect(await canNotify()).toBe(false);
  });

  it("does not request permission when it is already granted", async () => {
    const { requestNotifyPermission } = await loadNotify();
    isPermissionGranted.mockResolvedValue(true);
    expect(await requestNotifyPermission()).toBe(true);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("requests native permission when not yet granted", async () => {
    const { requestNotifyPermission } = await loadNotify();
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("granted");
    expect(await requestNotifyPermission()).toBe(true);
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("denied");
    expect(await requestNotifyPermission()).toBe(false);
  });

  it("reports failure when the native permission request throws", async () => {
    const { requestNotifyPermission } = await loadNotify();
    isPermissionGranted.mockRejectedValue(new Error("ipc denied"));
    expect(await requestNotifyPermission()).toBe(false);
  });

  it("sends a native notification with title and body", async () => {
    const { notify } = await loadNotify();
    isPermissionGranted.mockResolvedValue(true);
    notify("Title", "Body");
    await flushPromises();
    expect(sendNotification).toHaveBeenCalledWith({
      title: "Title",
      body: "Body",
    });
  });

  it("sends a native notification with only the title", async () => {
    const { notify } = await loadNotify();
    isPermissionGranted.mockResolvedValue(true);
    notify("Title");
    await flushPromises();
    expect(sendNotification).toHaveBeenCalledWith({ title: "Title" });
  });

  it("does not send a native notification without permission", async () => {
    const { notify } = await loadNotify();
    isPermissionGranted.mockResolvedValue(false);
    notify("Title", "Body");
    await flushPromises();
    expect(sendNotification).not.toHaveBeenCalled();
  });
});
