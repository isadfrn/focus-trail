import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import logo from "../../assets/logo.png";
import { cn } from "../../lib/cn";
import { useAuth } from "../../providers/AuthProvider";
import { AudioControls } from "../AudioControls/AudioControls";
import { LanguageSelect } from "../LanguageSelect/LanguageSelect";
import { ScenarioRadioGroup } from "../ScenarioPicker/ScenarioPicker";
import { ThemeSelect } from "../ThemeSelect/ThemeSelect";

const separator = "mx-1 my-1.5 h-px bg-border";

export function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (!user) {
    return (
      <header className="absolute right-0 top-0 z-10 flex w-[300px] gap-2 px-4 py-3 lg:px-6">
        <ThemeSelect />
        <LanguageSelect />
      </header>
    );
  }

  const isTimer = location.pathname === "/";
  const close = () => setOpen(false);
  const navLink = (path: string) =>
    cn(
      "block rounded-lg px-3 py-2.5 text-[15px] no-underline outline-none hover:bg-background",
      location.pathname === path
        ? "font-semibold text-primary"
        : "text-foreground",
    );

  return (
    <header
      className={cn(
        "z-10 w-full",
        isTimer
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "relative border-b border-border bg-surface",
      )}
    >
      <div className="flex w-full items-center justify-start px-4 py-3 lg:px-6">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            aria-label={t("menu.open")}
            className={cn(
              "flex h-10 w-10 flex-col justify-center gap-[5px] rounded-[10px] border border-border p-2.5 cursor-pointer outline-none",
              isTimer ? "bg-surface/90 backdrop-blur-sm" : "bg-surface",
            )}
          >
            <span className="block h-0.5 w-full rounded-[1px] bg-foreground" />
            <span className="block h-0.5 w-full rounded-[1px] bg-foreground" />
            <span className="block h-0.5 w-full rounded-[1px] bg-foreground" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
            <Dialog.Content
              aria-describedby={undefined}
              className={cn(
                "fixed z-50 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin border border-border bg-surface shadow-app outline-none",
                "left-3 top-16 max-h-[calc(100dvh-5rem)] w-[240px] rounded-xl p-2",
                "lg:left-0 lg:top-0 lg:h-dvh lg:max-h-none lg:w-[320px] lg:rounded-none lg:rounded-r-2xl lg:border-y-0 lg:border-l-0 lg:p-4",
                "data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out",
                "lg:data-[state=open]:animate-drawer-in lg:data-[state=closed]:animate-drawer-out",
              )}
            >
              <div className="flex items-center justify-between pb-1.5">
                <Dialog.Title className="px-2">
                  <img src={logo} alt="Focus Trail" className="h-10 w-auto" />
                </Dialog.Title>
                <Dialog.Close
                  aria-label={t("menu.close")}
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
              <div className={separator} />

              <Link className={navLink("/")} to="/" onClick={close}>
                {t("menu.timer")}
              </Link>
              <Link className={navLink("/history")} to="/history" onClick={close}>
                {t("menu.history")}
              </Link>
              <Link
                className={navLink("/performance")}
                to="/performance"
                onClick={close}
              >
                {t("menu.performance")}
              </Link>
              <Link className={navLink("/profile")} to="/profile" onClick={close}>
                {t("menu.profile")}
              </Link>

              <div className={separator} />
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
                {t("menu.scenario")}
              </p>
              <ScenarioRadioGroup />

              <div className={separator} />
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
                {t("menu.sound")}
              </p>
              <AudioControls />

              <div className={separator} />
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
                {t("language.label")}
              </p>
              <div className="px-2.5 pb-1">
                <LanguageSelect />
              </div>

              <div className={separator} />
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
                {t("theme.label")}
              </p>
              <div className="px-2.5 pb-1">
                <ThemeSelect />
              </div>

              <div className={separator} />
              <p className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1 text-[13px] text-muted">
                {user.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  close();
                  void logout();
                }}
                className="rounded-lg px-3 py-2.5 text-left text-[15px] text-foreground cursor-pointer outline-none hover:bg-background"
              >
                {t("menu.logout")}
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
