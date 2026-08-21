import { ArrowClockwise, Info, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface PageStateProps {
  tone?: "neutral" | "warning";
  title: string;
  description: string;
  action?: ReactNode;
  onRetry?: () => void;
}

export function PageState({ tone = "neutral", title, description, action, onRetry }: PageStateProps) {
  const Icon = tone === "warning" ? WarningCircle : Info;
  return (
    <section className={`page-state ${tone}`}>
      <span className="page-state-icon"><Icon aria-hidden="true" /></span>
      <div><h2>{title}</h2><p>{description}</p>{action}</div>
      {onRetry ? <button className="button secondary" type="button" onClick={onRetry}><ArrowClockwise aria-hidden="true" /> Retry read</button> : null}
    </section>
  );
}
