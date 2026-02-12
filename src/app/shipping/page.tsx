import type { Metadata } from "next";
import ShippingClient from "./ShippingClient";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "Production and delivery timelines for PurePawStudio flasks, with clear costs shown at checkout.",
};

export default function ShippingPage() {
  return <ShippingClient />;
}
