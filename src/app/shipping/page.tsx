import type { Metadata } from "next";
import ShippingClient from "./ShippingClient";

export const metadata: Metadata = {
  title: "Shipping, production and delivery | PurePaw Studio",
  description:
    "Current production and shipping timelines for PurePaw Studio orders, including UK delivery estimates and order support guidance.",
};

export default function ShippingPage() {
  return <ShippingClient />;
}