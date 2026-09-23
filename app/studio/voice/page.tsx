import { StudioShell } from "@/components/studio/StudioShell";
import { VoiceStudio } from "@/components/voice/VoiceStudio";

export default function Page() {
  return (
    <StudioShell title="Ovoz studiyasi" subtitle="Mikrofon avtomatik yoqilmaydi.">
      <div className="p-4 sm:p-6">
        <VoiceStudio />
      </div>
    </StudioShell>
  );
}
