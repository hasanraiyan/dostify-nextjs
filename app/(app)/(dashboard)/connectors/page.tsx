import type { Metadata } from "next";
import { ConnectorsView } from "./connectors-view";

export const metadata: Metadata = { title: "Connectors — Dostify" };

export default function ConnectorsPage() {
  return <ConnectorsView />;
}
