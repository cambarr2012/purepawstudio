import type { Metadata } from "next";
import OrderHelpClient from "./OrderHelpClient";

export const metadata: Metadata = {
  title: "Order help",
  description:
    "Get help with an order, shipping changes, or damaged items. Contact PurePawStudio support and track your order status.",
};

export default function OrderHelpPage() {
  return <OrderHelpClient />;
}
