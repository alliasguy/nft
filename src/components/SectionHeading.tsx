interface SectionHeadingProps {
  /** Small uppercase label above the title (e.g. "Trending") */
  label?: string;
  title: string;
  /**
   * A substring of `title` that will be rendered with the crimson→magenta
   * gradient. Must match exactly (case-sensitive).
   */
  highlight?: string;
  /** Optional body copy beneath the title */
  subtitle?: string;
  /** If provided, a "View All →" link appears alongside the title */
  href?: string;
  /** Custom link label. Defaults to "View All". */
  linkText?: string;
  /** "left" (default) or "center" */
  align?: "left" | "center";
}

function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/** Splits `title` and wraps the matching `highlight` span with gradient text. */
function Title({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) {
    return <>{title}</>;
  }
  const idx   = title.indexOf(highlight);
  const before = title.slice(0, idx);
  const after  = title.slice(idx + highlight.length);
  return (
    <>
      {before}
      <span className="gradient-text">{highlight}</span>
      {after}
    </>
  );
}

export default function SectionHeading({
  label,
  title,
  highlight,
  subtitle,
  href,
  linkText = "View All",
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  const linkEl = href ? (
    <a href={href} className="section-heading__link" aria-label={`${linkText} — ${title}`}>
      {linkText}
      <IconArrow />
    </a>
  ) : null;

  return (
    <div
      className="section-heading"
      style={centered ? { alignItems: "center", textAlign: "center" } : undefined}
    >
      {label && (
        <p className="text-label section-heading__label">{label}</p>
      )}

      <div className="section-heading__title-row">
        <h2 className="text-headline section-heading__title">
          <Title title={title} highlight={highlight} />
        </h2>

        {/* Right-side link only when left-aligned */}
        {!centered && linkEl}
      </div>

      {subtitle && (
        <p className="section-heading__subtitle" style={centered ? { maxWidth: "52ch" } : { maxWidth: "62ch" }}>
          {subtitle}
        </p>
      )}

      {/* Centred variant: link appears below the subtitle */}
      {centered && linkEl && (
        <div style={{ marginTop: "1.25rem" }}>{linkEl}</div>
      )}
    </div>
  );
}
