// Default picture: the FIRST LETTER of the name on a soft gradient, used when
// a user has no photo. The gradient depends on the name, so people look different.
const PALETTES: Array<[string, string]> = [
  ["#1B2C4F", "#0F1B33"], // navy
  ["#24406B", "#122240"], // blue
  ["#2A3550", "#141B2E"], // slate
  ["#4A2A22", "#1F1311"], // dark copper
  ["#1F3B4D", "#0E1C27"], // petrol
];

function pick(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function DefaultAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const [a, b] = pick(name || "?");
  const letter = (Array.from((name || "?").trim())[0] ?? "?").toUpperCase();
  const id = `da-${(name || "x").replace(/[^a-z0-9]/gi, "").slice(0, 8)}-${a.slice(1)}`;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      {/* first letter of the name */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize="46"
        fontWeight="700"
        fontFamily="var(--font-sora), var(--font-arabic), system-ui, sans-serif"
      >
        {letter}
      </text>
    </svg>
  );
}
