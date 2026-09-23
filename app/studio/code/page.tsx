import { StudioShell } from "@/components/studio/StudioShell";
import { CodeStudio } from "@/components/studio/CodeStudio";

export default function Page() {
  return (
    <StudioShell title="Kod studiyasi" subtitle="Kod serverda bajarilmaydi.">
      <CodeStudio />
    </StudioShell>
  );
}
