import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import logo from "../../assets/logo.png";
import { cn } from "../../lib/cn";
import { useAuth } from "../../providers/AuthProvider";
import { AudioControls } from "../AudioControls/AudioControls";
import { ScenarioRadioGroup } from "../ScenarioPicker/ScenarioPicker";

const separator = "mx-1 my-1.5 h-px bg-border";

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (!user) return null;

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
            aria-label="Menu"
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
            <Dialog.Overlay className="fixed inset-0 z-40 bg-charcoal-blue-950/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
            <Dialog.Content
              aria-describedby={undefined}
              className={cn(
                "fixed z-50 flex flex-col gap-0.5 overflow-y-auto border border-border bg-surface shadow-app outline-none",
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
              <div className={separator} />

              <Link className={navLink("/")} to="/" onClick={close}>
                Timer
              </Link>
              <Link className={navLink("/history")} to="/history" onClick={close}>
                Historico
              </Link>
              <Link className={navLink("/profile")} to="/profile" onClick={close}>
                Perfil
              </Link>

              <div className={separator} />
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
                Cenario
              </p>
              <ScenarioRadioGroup />

              <div className={separator} />
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted">
                Som
              </p>
              <AudioControls />

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
                Sair
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
