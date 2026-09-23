import { FavoritesView } from "@/components/favorites/FavoritesView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sevimlilar",
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
