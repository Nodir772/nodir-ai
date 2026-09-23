"use client";

import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { VoiceStudio } from "@/components/voice/VoiceStudio";

export default function VoicePage() {
  return (
    <WorkspaceFrame title="Ovozli yordamchi" subtitle="Tinglash, transkripsiya, so'ng yuborish.">
      <VoiceStudio />
    </WorkspaceFrame>
  );
}
