import { ORANGE } from "@/lib/theme";

/** Writes a title with its LAST word in orange (works in every language). */
export function AccentTitle({ text }: { text: string }) {
  const i = text.lastIndexOf(" ");
  if (i < 0) return <span style={{ color: ORANGE }}>{text}</span>;
  return (
    <>
      {text.slice(0, i + 1)}
      <span style={{ color: ORANGE }}>{text.slice(i + 1)}</span>
    </>
  );
}
