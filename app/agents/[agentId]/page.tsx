import { AgentDetail } from "@/components/agents/AgentDetail";

export default async function AgentPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <AgentDetail agentId={agentId} />;
}
