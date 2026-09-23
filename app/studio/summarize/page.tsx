import { StudioShell } from "@/components/studio/StudioShell";
import { SummarizerTool } from "@/components/tools/SummarizerTool";

export default function Page() {
  return (
    <StudioShell title="Xulosa studiyasi">
      <SummarizerTool embed />
    </StudioShell>
  );
}
