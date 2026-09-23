import { StudioShell } from "@/components/studio/StudioShell";
import { ImageTool } from "@/components/tools/ImageTool";

export default function Page() {
  return (
    <StudioShell title="Rasm studiyasi" subtitle="Faqat sozlangan rasm API parametrlari.">
      <ImageTool embed />
    </StudioShell>
  );
}
