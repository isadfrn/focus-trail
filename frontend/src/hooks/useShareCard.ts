import { useEffect, useRef, useState } from "react";

import type { ShareCardContent, ShareFormat } from "../lib/share/share-card";
import { canvasToBlob, renderShareCard } from "../lib/share/share-render";
import type { CharacterTheme } from "../types/character";

export type ShareCardStatus = "idle" | "rendering" | "ready" | "error";

interface UseShareCardParams {
  character: CharacterTheme;
  format: ShareFormat;
  content: ShareCardContent | null;
  logoUrl: string;
  linkLabel: string;
}

interface ShareCardState {
  status: ShareCardStatus;
  blob: Blob | null;
  previewUrl: string | null;
}

const IDLE_STATE: ShareCardState = {
  status: "idle",
  blob: null,
  previewUrl: null,
};

export function useShareCard({
  character,
  format,
  content,
  logoUrl,
  linkLabel,
}: UseShareCardParams): ShareCardState {
  const [state, setState] = useState<ShareCardState>(IDLE_STATE);
  const objectUrlRef = useRef<string | null>(null);
  const contentKey = content ? JSON.stringify(content) : "";

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!content) {
      setState(IDLE_STATE);
      return;
    }
    let cancelled = false;
    setState((current) => ({ ...current, status: "rendering" }));

    renderShareCard({ character, format, content, logoUrl, linkLabel })
      .then(canvasToBlob)
      .then((blob) => {
        if (cancelled) return;
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const previewUrl = URL.createObjectURL(blob);
        objectUrlRef.current = previewUrl;
        setState({ status: "ready", blob, previewUrl });
      })
      .catch(() => {
        if (!cancelled) setState({ ...IDLE_STATE, status: "error" });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, character, format, logoUrl, linkLabel]);

  return state;
}
