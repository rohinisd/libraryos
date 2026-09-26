// LibraryOS mark: books on a shelf, one green book leaning in. The gradient is a
// CSS background (not an SVG <defs> id) so several logos can share a page
// without duplicate-id clashes. Keep in sync with public/icon.svg.
export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: "linear-gradient(135deg, #3B4FD8, #8B5CF6)",
      }}
      role="img"
      aria-label="LibraryOS"
    >
      <svg viewBox="0 0 512 512" width="100%" height="100%" aria-hidden="true">
        <g fill="#fff">
          <rect x="112" y="150" width="64" height="222" rx="14" />
          <rect x="188" y="196" width="64" height="176" rx="14" fillOpacity=".85" />
          <rect x="264" y="118" width="64" height="254" rx="14" />
          <rect x="342" y="170" width="64" height="202" rx="14" fill="#34D399" transform="rotate(9 374 372)" />
        </g>
        <rect x="92" y="388" width="328" height="18" rx="9" fill="#fff" fillOpacity=".9" />
      </svg>
    </span>
  );
}
