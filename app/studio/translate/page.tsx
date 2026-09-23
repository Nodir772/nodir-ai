import { StudioShell } from "@/components/studio/StudioShell";
import { TranslateTool } from "@/components/tools/TranslateTool";

export default function Page() {
  return (
    <StudioShell title="Tarjima studiyasi">
      <TranslateTool embed />
    </StudioShell>
  );
}
