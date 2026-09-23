import type { Metadata } from "next";
import { DocumentsTool } from "@/components/tools/DocumentsTool";

export const metadata: Metadata = { title: "Hujjat tahlili" };

export default function Page() {
  return <DocumentsTool />;
}
