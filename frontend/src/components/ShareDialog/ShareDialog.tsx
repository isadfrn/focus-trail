import * as Dialog from "@radix-ui/react-dialog";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useMemo, useState } from "react";

import logoUrl from "../../assets/logo.png";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useShareCard } from "../../hooks/useShareCard";
import { useShareData } from "../../hooks/useShareData";
import {
  buildLinkedInShareUrl,
  buildShareFileName,
  buildXIntentUrl,
  canShareFile,
  copyImageToClipboard,
  copyTextToClipboard,
  createShareFile,
  downloadBlob,
  openInNewTab,
  shareFile,
} from "../../lib/share/share-actions";
import {
  buildCardContent,
  buildShareCaption,
  buildShareText,
  formatShareDuration,
  SHARE_FORMATS,
  type ShareFormatId,
  type ShareSubject,
} from "../../lib/share/share-card";
import { buildTrackedShareUrl, getShareLabel } from "../../lib/share/share-config";
import { useAuth } from "../../providers/AuthProvider";
import { useCharacter } from "../../providers/CharacterProvider";
import { useToast } from "../../providers/ToastProvider";
import type { TaskSummary } from "../../types/session";
import { Button } from "../Button/Button";

export type ShareScope = "day" | "task";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScope?: ShareScope;
  date?: Date;
  initialTaskLabel?: string;
}

const toggleItem =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary data-[state=on]:border-primary data-[state=on]:font-semibold data-[state=on]:text-primary";

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

const MOBILE_QUERY = "(max-width: 639px)";

function taskKey(label: string): string {
  return label.trim().toLowerCase();
}

function findTask(
  tasks: TaskSummary[],
  key: string | null,
): TaskSummary | undefined {
  return key ? tasks.find((task) => taskKey(task.label) === key) : undefined;
}

interface ShareDialogBodyProps {
  initialScope: ShareScope;
  date: Date;
  initialTaskLabel?: string;
}

function ShareDialogBody({
  initialScope,
  date,
  initialTaskLabel,
}: ShareDialogBodyProps) {
  const { character } = useCharacter();
  const { user } = useAuth();
  const toast = useToast();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const goalMinutes = user?.dailyFocusGoalMinutes ?? 0;
  const [scope, setScope] = useState<ShareScope>(initialScope);
  const [formatId, setFormatId] = useState<ShareFormatId>(
    isMobile ? "story" : "square",
  );
  const [showTaskLabel, setShowTaskLabel] = useState(true);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(
    initialTaskLabel ? taskKey(initialTaskLabel) : null,
  );

  const data = useShareData({ enabled: true, date, goalMinutes });
  const selectedTask =
    findTask(data.tasks, selectedTaskKey) ?? data.tasks[0] ?? null;

  const subject = useMemo<ShareSubject | null>(() => {
    if (scope === "day") {
      return data.day ? { kind: "day", date, goalMinutes, ...data.day } : null;
    }
    return selectedTask
      ? {
          kind: "task",
          label: selectedTask.label,
          showLabel: showTaskLabel,
          focusSeconds: selectedTask.focusSeconds,
          completedFocus: selectedTask.completedFocus,
          activeDays: selectedTask.activeDays,
          firstAt: new Date(selectedTask.firstAt),
        }
      : null;
  }, [scope, data.day, date, goalMinutes, selectedTask, showTaskLabel]);

  const content = useMemo(
    () => (subject ? buildCardContent(subject) : null),
    [subject],
  );
  const format = SHARE_FORMATS[formatId];
  const card = useShareCard({
    character,
    format,
    content,
    logoUrl,
    linkLabel: getShareLabel(),
  });

  const fileName = buildShareFileName(scope);
  const file = useMemo(
    () => (card.blob ? createShareFile(card.blob, fileName) : null),
    [card.blob, fileName],
  );
  const nativeShareAvailable = file ? canShareFile(file) : false;
  const ready = card.status === "ready" && card.blob !== null && subject !== null;

  const caption = subject
    ? buildShareCaption(subject, buildTrackedShareUrl(scope, "share"))
    : "";

  const handleNativeShare = async () => {
    if (!file) return;
    const outcome = await shareFile(file, caption);
    if (outcome === "failed") {
      toast("Não consegui abrir o compartilhamento. Baixe a imagem e publique manualmente.");
    }
  };

  const handleDownload = () => {
    if (!card.blob) return;
    downloadBlob(card.blob, fileName);
    toast("Imagem baixada.");
  };

  const handleCopyImage = async () => {
    if (!card.blob) return;
    const copied = await copyImageToClipboard(card.blob);
    toast(
      copied
        ? "Imagem copiada."
        : "Seu navegador não permite copiar imagens. Use “Baixar imagem”.",
    );
  };

  const handleCopyCaption = async () => {
    const copied = await copyTextToClipboard(caption);
    toast(copied ? "Legenda copiada." : "Não consegui copiar a legenda.");
  };

  const openComposer = (composerUrl: string) => {
    if (!card.blob) return;
    const copied = copyImageToClipboard(card.blob);
    openInNewTab(composerUrl);
    void copied.then((success) =>
      toast(
        success
          ? "Imagem copiada. Cole no post com Ctrl+V (ou Cmd+V)."
          : "Baixe a imagem e anexe ao post.",
      ),
    );
  };

  const handleX = () => {
    if (!subject) return;
    openComposer(
      buildXIntentUrl(buildShareText(subject), buildTrackedShareUrl(scope, "x")),
    );
  };

  const handleLinkedIn = () =>
    openComposer(buildLinkedInShareUrl(buildTrackedShareUrl(scope, "linkedin")));

  const previewMaxWidth = formatId === "story" ? "max-w-[240px]" : "max-w-[320px]";

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="flex items-start justify-center">
        <div
          className={`w-full ${previewMaxWidth} overflow-hidden rounded-xl border border-border bg-background`}
          style={{ aspectRatio: `${format.width} / ${format.height}` }}
        >
          {card.previewUrl ? (
            <img
              src={card.previewUrl}
              alt="Pré-visualização do card de compartilhamento"
              className="block h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-muted">
              {data.error ??
                (card.status === "error"
                  ? "Não consegui gerar a imagem."
                  : subject === null && !data.loading
                    ? "Nada para compartilhar ainda."
                    : "Gerando imagem...")}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-muted">O que compartilhar</span>
          <ToggleGroup.Root
            type="single"
            value={scope}
            aria-label="O que compartilhar"
            onValueChange={(value) => {
              if (value === "day" || value === "task") setScope(value);
            }}
            className="flex gap-2"
          >
            <ToggleGroup.Item value="day" className={toggleItem}>
              Dia
            </ToggleGroup.Item>
            <ToggleGroup.Item value="task" className={toggleItem}>
              Tarefa
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>

        {scope === "task" &&
          (data.tasks.length === 0 ? (
            <p className="m-0 text-sm text-muted">
              Você ainda não tem foco registrado com tarefa. Preencha “No que vou
              focar?” no timer para acompanhar seus totais.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-muted">
                Tarefa
                <select
                  value={selectedTask ? taskKey(selectedTask.label) : ""}
                  onChange={(event) => setSelectedTaskKey(event.target.value)}
                  className={`${fieldClass} normal-case tracking-normal`}
                >
                  {data.tasks.map((task) => (
                    <option key={taskKey(task.label)} value={taskKey(task.label)}>
                      {task.label} · {formatShareDuration(task.focusSeconds)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={showTaskLabel}
                  onChange={(event) => setShowTaskLabel(event.target.checked)}
                  className="size-4 cursor-pointer accent-primary"
                />
                Mostrar o nome da tarefa
              </label>
            </div>
          ))}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-muted">Formato</span>
          <ToggleGroup.Root
            type="single"
            value={formatId}
            aria-label="Formato da imagem"
            onValueChange={(value) => {
              if (value === "story" || value === "square") setFormatId(value);
            }}
            className="flex flex-wrap gap-2"
          >
            {Object.values(SHARE_FORMATS).map((option) => (
              <ToggleGroup.Item key={option.id} value={option.id} className={toggleItem}>
                {option.label}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>

        <div className="flex flex-col gap-2">
          {nativeShareAvailable ? (
            <Button variant="primary" disabled={!ready} onClick={handleNativeShare}>
              Compartilhar
            </Button>
          ) : (
            <Button variant="primary" disabled={!ready} onClick={handleDownload}>
              Baixar imagem
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            {nativeShareAvailable && (
              <Button disabled={!ready} onClick={handleDownload}>
                Baixar imagem
              </Button>
            )}
            <Button disabled={!ready} onClick={handleCopyImage}>
              Copiar imagem
            </Button>
            <Button disabled={!ready} onClick={handleX}>
              Postar no X
            </Button>
            <Button disabled={!ready} onClick={handleLinkedIn}>
              Postar no LinkedIn
            </Button>
            <Button disabled={!ready} onClick={handleCopyCaption}>
              Copiar legenda
            </Button>
          </div>
          <p className="m-0 text-xs text-muted">
            Instagram e TikTok: no celular use “Compartilhar”; no computador baixe
            a imagem e publique pelo app. O link aparece na imagem e na legenda.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  initialScope = "day",
  date,
  initialTaskLabel,
}: ShareDialogProps) {
  const referenceDate = useMemo(
    () => date ?? new Date(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date?.getTime(), open],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-charcoal-blue-950/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[min(94vw,860px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto scrollbar-thin rounded-2xl border border-border bg-surface p-5 shadow-app outline-none data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="m-0 text-lg font-bold text-foreground">
              Compartilhar
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted cursor-pointer outline-none hover:bg-background"
            >
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                <path
                  d="M2 2 12 12 M12 2 2 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </Dialog.Close>
          </div>
          <ShareDialogBody
            initialScope={initialScope}
            date={referenceDate}
            initialTaskLabel={initialTaskLabel}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
