/**
 * The recurring "claim vs reality" motif: a torn-ticket perforation.
 * Two eyelets punched at the ends of a dashed rule — the same device used
 * at every scale, from a thin row divider up to the model-detail spine.
 */
export function Perforation({
  className = "",
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  const eyelet = (
    <span className="h-2 w-2 shrink-0 rounded-full bg-bg ring-1 ring-hairline" />
  );

  if (orientation === "vertical") {
    return (
      <div
        role="presentation"
        className={`relative flex flex-col items-center ${className}`}
      >
        {eyelet}
        <span
          className="my-1 w-px flex-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--color-hairline) 0 4px, transparent 4px 8px)",
          }}
        />
        {eyelet}
      </div>
    );
  }

  return (
    <div
      role="presentation"
      className={`relative flex items-center ${className}`}
    >
      {eyelet}
      <span
        className="mx-1 h-px flex-1"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--color-hairline) 0 4px, transparent 4px 8px)",
        }}
      />
      {eyelet}
    </div>
  );
}
