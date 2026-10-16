import { ORANGE } from "@/lib/theme";

/** Four orange "scanner" corner lines. Put it inside a `relative` box: it fills the box. */
export function FaceCorners({ length = 46, thickness = 4, radius = 18 }: {
  length?: number;
  thickness?: number;
  radius?: number;
}) {
  const base = {
    position: "absolute" as const,
    width: length,
    height: length,
    borderColor: ORANGE,
    borderStyle: "solid" as const,
    borderWidth: 0,
  };
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <span style={{ ...base, top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness, borderTopLeftRadius: radius }} />
      <span style={{ ...base, top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness, borderTopRightRadius: radius }} />
      <span style={{ ...base, bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness, borderBottomLeftRadius: radius }} />
      <span style={{ ...base, bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness, borderBottomRightRadius: radius }} />
    </div>
  );
}
