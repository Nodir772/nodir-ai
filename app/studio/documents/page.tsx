import { StudioShell } from "@/components/studio/StudioShell";
import { DocumentsTool } from "@/components/tools/DocumentsTool";

export default function Page() {
  return (
    <StudioShell title="Hujjat studiyasi" subtitle="Mavjud tahlil backendidan foydalaniladi.">
      <DocumentsTool embed />
    </StudioShell>
  );
}
