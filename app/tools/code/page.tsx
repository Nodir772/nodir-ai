import type { Metadata } from "next";
import { CodeTool } from "@/components/tools/CodeTool";

export const metadata: Metadata = { title: "Kod yordamchisi" };

export default function Page() {
  return <CodeTool />;
}
