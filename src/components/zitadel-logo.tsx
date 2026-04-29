// Backward-compatible alias — VisOpus rebrand replaces the upstream Zitadel mark.
// New code should import { Logo } from "@/components/logo".
import { Logo } from "@/components/logo";

type Props = {
  height?: number;
  width?: number;
};

export function ZitadelLogo({ height = 64, width = 64 }: Props) {
  return <Logo height={height} width={width} />;
}
