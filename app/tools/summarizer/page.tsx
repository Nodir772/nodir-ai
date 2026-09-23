import type { Metadata } from "next";
import { SummarizerTool } from "@/components/tools/SummarizerTool";

export const metadata: Metadata = { title: "Qisqartirish" };

export default function Page() {
  return <SummarizerTool />;
}
