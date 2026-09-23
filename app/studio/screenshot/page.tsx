import { StudioShell } from "@/components/studio/StudioShell";
import { ScreenshotStudio } from "@/components/studio/ScreenshotStudio";

export default function Page() {
  return (
    <StudioShell title="Skrinshot tahlili">
      <ScreenshotStudio />
    </StudioShell>
  );
}
