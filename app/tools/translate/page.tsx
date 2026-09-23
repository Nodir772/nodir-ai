import type { Metadata } from "next";
import { TranslateTool } from "@/components/tools/TranslateTool";

export const metadata: Metadata = { title: "Tarjima" };

export default function Page() {
  return <TranslateTool />;
}
