import type { Metadata } from "next";
import { ImageTool } from "@/components/tools/ImageTool";

export const metadata: Metadata = { title: "Rasm yaratish" };

export default function Page() {
  return <ImageTool />;
}
