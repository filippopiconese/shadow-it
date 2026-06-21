import { useEffect } from "react";

interface HeadOptions {
  title: string;
  description?: string;
}

const SITE_NAME = "ShadowGuard";
const DEFAULT_DESC =
  "Discover and risk-score every unauthorized OAuth app connected to your Google Workspace or Microsoft 365. No agents, 1-click connect.";

export function useDocumentHead({ title, description }: HeadOptions) {
  useEffect(() => {
    const full = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = full;

    const desc = description ?? DEFAULT_DESC;
    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDesc) metaDesc.content = desc;

    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = full;
    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = desc;

    const twTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = full;
    const twDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = desc;
  }, [title, description]);
}
