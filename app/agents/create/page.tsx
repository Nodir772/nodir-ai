"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AgentBuilder } from "@/components/agents/AgentBuilder";
import { CardSkeleton } from "@/components/ui/loaders";

export default function CreateAgentPage() {
  const search = useSearchParams();
  const edit = search.get("edit");
  const [initial, setInitial] = useState<{
    id?: string;
    name: string;
    description: string;
    icon: string;
    instructions: string;
    allowedTools: string[];
    model: string;
  } | null>(edit ? null : { name: "", description: "", icon: "sparkles", instructions: "", allowedTools: ["writing"], model: "nodir-fast" });

  useEffect(() => {
    if (!edit) return;
    void fetch(`/api/agents/${edit}`)
      .then((response) => response.json())
      .then((json: { agent?: typeof initial }) => {
        if (json.agent) setInitial({ ...json.agent, id: edit });
        else setInitial({ name: "", description: "", icon: "sparkles", instructions: "", allowedTools: ["writing"], model: "nodir-fast" });
      });
  }, [edit]);

  if (!initial) return <CardSkeleton />;
  return <AgentBuilder initial={initial.id ? initial : undefined} />;
}
