import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/useShareData", () => ({ useShareData: vi.fn() }));
vi.mock("../../hooks/useShareCard", () => ({ useShareCard: vi.fn() }));
vi.mock("../../providers/AuthProvider", () => ({
  useAuth: () => ({ user: { dailyFocusGoalMinutes: 180 } }),
}));
vi.mock("../../providers/CharacterProvider", () => ({
  useCharacter: () => ({
    character: {
      id: "x",
      name: "X",
      skyColor: "#000000",
      background: "bg",
      terrain: "terrain",
      sheet: "sheet",
    },
  }),
}));
const toast = vi.fn();
vi.mock("../../providers/ToastProvider", () => ({ useToast: () => toast }));
vi.mock("../../lib/share/share-actions", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/share/share-actions")
  >("../../lib/share/share-actions");
  return {
    ...actual,
    canShareFile: vi.fn(),
    shareFile: vi.fn(),
    downloadBlob: vi.fn(),
    copyImageToClipboard: vi.fn(),
    copyTextToClipboard: vi.fn(),
    openInNewTab: vi.fn(),
  };
});

import { useShareCard } from "../../hooks/useShareCard";
import { useShareData } from "../../hooks/useShareData";
import * as actions from "../../lib/share/share-actions";
import type { TaskSummary } from "../../types/session";
import { ShareDialog } from "./ShareDialog";

const tasks: TaskSummary[] = [
  {
    label: "Estudar inglês",
    focusSeconds: 45600,
    completedFocus: 34,
    sessions: 40,
    activeDays: 9,
    firstAt: "2026-09-02T10:00:00.000Z",
    lastAt: "2026-09-25T10:00:00.000Z",
  },
  {
    label: "Refatorar API",
    focusSeconds: 22500,
    completedFocus: 15,
    sessions: 16,
    activeDays: 4,
    firstAt: "2026-09-18T10:00:00.000Z",
    lastAt: "2026-09-24T10:00:00.000Z",
  },
];

const readyCard = {
  status: "ready" as const,
  blob: new Blob(["png"], { type: "image/png" }),
  previewUrl: "blob:preview",
};

function mockData(overrides: Partial<ReturnType<typeof useShareData>> = {}) {
  vi.mocked(useShareData).mockReturnValue({
    day: { focusSeconds: 9300, completedFocus: 6, interruptedFocus: 0, streak: 5 },
    tasks,
    loading: false,
    error: null,
    ...overrides,
  });
}

function lastCardParams() {
  const calls = vi.mocked(useShareCard).mock.calls;
  return calls[calls.length - 1][0];
}

function renderDialog(props: Partial<Parameters<typeof ShareDialog>[0]> = {}) {
  return render(
    <ShareDialog open onOpenChange={() => {}} {...props} />,
  );
}

describe("ShareDialog", () => {
  beforeEach(() => {
    mockData();
    vi.mocked(useShareCard).mockReturnValue(readyCard);
    vi.mocked(actions.canShareFile).mockReturnValue(false);
    vi.mocked(actions.copyImageToClipboard).mockResolvedValue(true);
    vi.mocked(actions.copyTextToClipboard).mockResolvedValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it("renders nothing while closed", () => {
    render(<ShareDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Compartilhar")).not.toBeInTheDocument();
  });

  it("previews the day card built from the loaded totals", () => {
    renderDialog();
    expect(
      screen.getByAltText("Pré-visualização do card de compartilhamento"),
    ).toHaveAttribute("src", "blob:preview");

    const params = lastCardParams();
    expect(params.format.id).toBe("square");
    expect(params.content).toMatchObject({
      kind: "day",
      kicker: "FOCO DE HOJE",
      seconds: 9300,
    });
    expect(params.content?.goal?.leftLabel).toBe("Meta diária · 3h");
    expect(params.linkLabel).toBe("isabellanunes.dev/focus");
  });

  it("shows loading and error placeholders instead of a preview", () => {
    mockData({ day: null, loading: true });
    vi.mocked(useShareCard).mockReturnValue({ status: "idle", blob: null, previewUrl: null });
    const { unmount } = renderDialog();
    expect(screen.getByText("Gerando imagem...")).toBeInTheDocument();
    unmount();

    mockData({ day: null, error: "Não consegui carregar seus dados de foco." });
    renderDialog();
    expect(
      screen.getByText("Não consegui carregar seus dados de foco."),
    ).toBeInTheDocument();
  });

  it("reports a render failure and disables the actions", () => {
    vi.mocked(useShareCard).mockReturnValue({ status: "error", blob: null, previewUrl: null });
    renderDialog();
    expect(screen.getByText("Não consegui gerar a imagem.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar imagem" })).toBeDisabled();
  });

  it("explains when there is nothing to share", () => {
    mockData({ day: null });
    vi.mocked(useShareCard).mockReturnValue({ status: "idle", blob: null, previewUrl: null });
    renderDialog();
    expect(screen.getByText("Nada para compartilhar ainda.")).toBeInTheDocument();
  });

  it("switches to the task card and preselects the given task", async () => {
    const user = userEvent.setup();
    renderDialog({ initialTaskLabel: "  refatorar api " });
    await user.click(screen.getByRole("radio", { name: "Tarefa" }));

    expect(screen.getByRole("combobox")).toHaveValue("refatorar api");
    expect(lastCardParams().content).toMatchObject({
      kind: "task",
      title: "Refatorar API",
      seconds: 22500,
    });
  });

  it("changes the selected task and hides its name on request", async () => {
    const user = userEvent.setup();
    renderDialog({ initialScope: "task" });
    expect(lastCardParams().content?.title).toBe("Estudar inglês");

    await user.selectOptions(screen.getByRole("combobox"), "refatorar api");
    expect(lastCardParams().content?.title).toBe("Refatorar API");

    await user.click(screen.getByRole("checkbox", { name: "Mostrar o nome da tarefa" }));
    expect(lastCardParams().content?.title).toBeUndefined();
  });

  it("guides the user when there are no tasks yet", async () => {
    mockData({ tasks: [] });
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("radio", { name: "Tarefa" }));
    expect(screen.getByText(/ainda não tem foco registrado com tarefa/)).toBeInTheDocument();
    expect(lastCardParams().content).toBeNull();
  });

  it("switches the export format", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("radio", { name: "Story 9:16" }));
    expect(lastCardParams().format.id).toBe("story");
  });

  it("downloads the image when native sharing is unavailable", async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.queryByRole("button", { name: "Compartilhar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Baixar imagem" }));
    expect(actions.downloadBlob).toHaveBeenCalledWith(
      readyCard.blob,
      expect.stringMatching(/^focus-trail-dia-\d{4}-\d{2}-\d{2}\.png$/),
    );
    expect(toast).toHaveBeenCalledWith("Imagem baixada.");
  });

  it("shares the file through the native sheet when available", async () => {
    vi.mocked(actions.canShareFile).mockReturnValue(true);
    vi.mocked(actions.shareFile).mockResolvedValue("shared");
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Compartilhar" }));
    expect(actions.shareFile).toHaveBeenCalledWith(
      expect.any(File),
      expect.stringContaining("Hoje eu foquei 2h 35min no Focus Trail"),
    );
    expect(toast).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Baixar imagem" })).toBeInTheDocument();
  });

  it("warns when the native sheet fails", async () => {
    vi.mocked(actions.canShareFile).mockReturnValue(true);
    vi.mocked(actions.shareFile).mockResolvedValue("failed");
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Compartilhar" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining("Não consegui abrir o compartilhamento"),
      ),
    );
  });

  it("copies the image and reports unsupported browsers", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Copiar imagem" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Imagem copiada."));

    vi.mocked(actions.copyImageToClipboard).mockResolvedValue(false);
    await user.click(screen.getByRole("button", { name: "Copiar imagem" }));
    await waitFor(() =>
      expect(toast).toHaveBeenLastCalledWith(
        expect.stringContaining("não permite copiar imagens"),
      ),
    );
  });

  it("copies the caption with a tracked link", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Copiar legenda" }));

    const caption = vi.mocked(actions.copyTextToClipboard).mock.calls[0][0];
    expect(caption).toContain("Hoje eu foquei 2h 35min");
    expect(caption).toContain("https://isabellanunes.dev/focus/?utm_source=focus-trail-share");
    expect(caption).toContain("utm_campaign=day");
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Legenda copiada."));

    vi.mocked(actions.copyTextToClipboard).mockResolvedValue(false);
    await user.click(screen.getByRole("button", { name: "Copiar legenda" }));
    await waitFor(() =>
      expect(toast).toHaveBeenLastCalledWith("Não consegui copiar a legenda."),
    );
  });

  it("opens the X composer with the image copied for pasting", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Postar no X" }));

    expect(actions.copyImageToClipboard).toHaveBeenCalledWith(readyCard.blob);
    const composer = new URL(vi.mocked(actions.openInNewTab).mock.calls[0][0]);
    expect(composer.origin + composer.pathname).toBe("https://x.com/intent/post");
    expect(composer.searchParams.get("text")).toBe(
      "Hoje eu foquei 2h 35min no Focus Trail 🍅",
    );
    expect(composer.searchParams.get("url")).toContain("utm_medium=x");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.stringContaining("Imagem copiada. Cole")),
    );
  });

  it("opens the LinkedIn share page and asks to attach the image when copy fails", async () => {
    vi.mocked(actions.copyImageToClipboard).mockResolvedValue(false);
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Postar no LinkedIn" }));

    const composer = new URL(vi.mocked(actions.openInNewTab).mock.calls[0][0]);
    expect(composer.origin + composer.pathname).toBe(
      "https://www.linkedin.com/sharing/share-offsite/",
    );
    expect(composer.searchParams.get("url")).toContain("utm_medium=linkedin");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Baixe a imagem e anexe ao post."),
    );
  });
});
