"use client";

interface TradingNotActivatedNoticeProps {
  /** When false, the notice is shown */
  isTradingActive: boolean;
  /** Optional extra class for the wrapper */
  className?: string;
}

const MESSAGE =
  "Trading account not activated. Please deposit and contact admin to activate your trading account to unlock all benefits.";

export default function TradingNotActivatedNotice({
  isTradingActive,
  className = "",
}: TradingNotActivatedNoticeProps) {
  if (isTradingActive) return null;

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ${className}`}
    >
      <span className="text-lg shrink-0" aria-hidden>
        ⚠️
      </span>
      <p className="font-medium">{MESSAGE}</p>
    </div>
  );
}
