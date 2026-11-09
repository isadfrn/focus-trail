import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  HYDRATION_SNOOZE_MINUTES,
  useHydrationReminder,
} from "../../hooks/useHydrationReminder";
import { playSessionChime } from "../../lib/chime";
import { notify } from "../../lib/platform";
import { useAuth } from "../../providers/AuthProvider";
import { Button } from "../Button/Button";

export function HydrationReminder() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const intervalMinutes = user?.hydrationReminderMinutes ?? 0;
  const { due, acknowledge, snooze } = useHydrationReminder(intervalMinutes);

  useEffect(() => {
    if (!due) return;
    playSessionChime();
    if (document.hidden) {
      notify(t("hydration.notificationTitle"), t("hydration.message"));
    }
  }, [due, t]);

  if (!due) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-app animate-toast-in max-sm:flex-col max-sm:items-stretch"
    >
      <span aria-hidden="true" className="text-xl">
        💧
      </span>
      <span className="flex-1 font-medium">{t("hydration.message")}</span>
      <div className="flex gap-2 max-sm:justify-end">
        <Button type="button" onClick={snooze}>
          {t("hydration.snooze", { minutes: HYDRATION_SNOOZE_MINUTES })}
        </Button>
        <Button type="button" variant="primary" onClick={acknowledge}>
          {t("hydration.done")}
        </Button>
      </div>
    </div>
  );
}
