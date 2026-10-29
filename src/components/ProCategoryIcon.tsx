import type { ReactNode } from "react";

/**
 * Hand-drawn duotone SVG icons for the services (same keys as the `icon` column of
 * Category). Clean 1.7px strokes + a soft tint, drawn on a 24×24 grid so they stay
 * sharp at any size on phones.
 */
export function ProCategoryIcon({
  icon,
  size = 28,
  color = "#F56124",
  className,
}: {
  icon: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const tint = { fill: color, fillOpacity: 0.18 };
  let body: ReactNode;

  switch (icon) {
    case "Zap": // electricity
      body = <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8z" {...tint} />;
      break;
    case "Droplets": // plumbing
      body = (
        <>
          <path d="M12 3c3.6 4.1 6 7.1 6 10.4a6 6 0 0 1-12 0C6 10.1 8.4 7.1 12 3z" {...tint} />
          <path d="M9.2 14.200a3 3 0 0 0 2.6 2.6" />
        </>
      );
      break;
    case "AirVent": // air conditioning
      body = (
        <>
          <rect x="3" y="4" width="18" height="8" rx="2.2" {...tint} />
          <path d="M6.5 8.500h11" />
          <path d="M7 15.500c0 1.5-1 2-1 3.500M12 15.500c0 1.5-1 2-1 3.500M17 15.500c0 1.5-1 2-1 3.5" />
        </>
      );
      break;
    case "WashingMachine":
      body = (
        <>
          <rect x="4" y="2.5" width="16" height="19" rx="3" {...tint} />
          <path d="M4 8h16M7.5 5.300h.01M11 5.300h.01" />
          <circle cx="12" cy="14.5" r="4.2" />
          <path d="M9.8 14.800c1.1-.9 2.3.9 4.4-.2" />
        </>
      );
      break;
    case "Refrigerator":
      body = (
        <>
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" {...tint} />
          <path d="M6 10.500h12M9.2 6v2M9.2 13.500v3" />
        </>
      );
      break;
    case "Tv":
      body = (
        <>
          <rect x="3" y="4.5" width="18" height="12.5" rx="2.5" {...tint} />
          <path d="M8 21h8M12 17v4" />
        </>
      );
      break;
    case "Hammer":
      body = (
        <>
          <path d="M12.5 8.5 16 5l4.5 4.500L17 13z" {...tint} />
          <path d="M14.8 11.2 5 21M10 4.200l3 3" />
        </>
      );
      break;
    case "KeyRound": // locksmith
      body = (
        <>
          <circle cx="8" cy="15.5" r="4.5" {...tint} />
          <path d="M11.3 12.3 20.5 3M16.5 7l3 3M18.5 5l2 2" />
          <path d="M8 15.500h.01" />
        </>
      );
      break;
    case "PaintRoller":
      body = (
        <>
          <rect x="3" y="3" width="14" height="6" rx="2" {...tint} />
          <path d="M17 6h1.500A2.5 2.5 0 0 1 21 8.500v1A2.5 2.5 0 0 1 18.5 12H12v3" />
          <rect x="10" y="15" width="4" height="6.5" rx="1.2" {...tint} />
        </>
      );
      break;
    case "Sparkles": // cleaning
      body = (
        <>
          <path d="m11 3 1.9 5.100L18 10l-5.1 1.900L11 17l-1.9-5.100L4 10l5.1-1.900z" {...tint} />
          <path d="m19 15 .8 2.200L22 18l-2.2.8L19 21l-.8-2.200L16 18l2.2-.8z" />
        </>
      );
      break;
    case "SatelliteDish":
      body = (
        <>
          <path d="M4 10a7.3 7.3 0 0 0 10 10z" {...tint} />
          <path d="m9 15 3-3M17 13a6 6 0 0 0-6-6M21 13A10 10 0 0 0 11 3" />
        </>
      );
      break;
    case "Sun": // solar panels
      body = (
        <>
          <circle cx="12" cy="12" r="4" {...tint} />
          <path d="M12 2.500v2M12 19.500v2M4.6 4.6 6 6M18 18l1.4 1.400M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </>
      );
      break;
    default: // wrench
      body = (
        <path
          d="M14.7 6.300a1 1 0 0 0 0 1.400l1.6 1.600a1 1 0 0 0 1.4 0l3.770-3.770a6 6 0 0 1-7.940 7.940l-6.910 6.910a2.120 2.120 0 0 1-3-3l6.910-6.910a6 6 0 0 1 7.940-7.940z"
          {...tint}
        />
      );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {body}
    </svg>
  );
}
