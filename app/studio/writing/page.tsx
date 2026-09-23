import { StudioShell } from "@/components/studio/StudioShell";
import { WritingStudio } from "@/components/studio/WritingStudio";

export default function Page() {
  return (
    <StudioShell title="Yozish studiyasi">
      <WritingStudio />
    </StudioShell>
  );
}
