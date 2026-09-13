import * as Toast from "@radix-ui/react-toast";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string) => {
    setItems((prev) => [...prev, { id: Date.now() + Math.random(), message }]);
  }, []);

  const dismiss = (id: number) =>
    setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      <ToastContext.Provider value={show}>{children}</ToastContext.Provider>

      {items.map((t) => (
        <Toast.Root
          key={t.id}
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
          className="flex items-center rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-app outline-none data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=end]:animate-toast-out"
        >
          <Toast.Description>{t.message}</Toast.Description>
        </Toast.Root>
      ))}

      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] m-0 flex w-96 max-w-[100vw] list-none flex-col gap-2 p-4 outline-none" />
    </Toast.Provider>
  );
}
