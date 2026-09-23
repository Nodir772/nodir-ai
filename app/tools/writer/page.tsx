import type { Metadata } from "next";
import { WriterTool } from "@/components/tools/WriterTool";

export const metadata: Metadata = { title: "Yozish yordamchisi" };

export default function Page() {
  return <WriterTool />;
}
