// src/app/page.tsx
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "PurePawStudio",
  description:
    "Personalised stainless steel flasks featuring your pet’s portrait. Preview your flask design before you order. UK fulfilment.",
};

export default function Page() {
  return <HomeClient />;
}
