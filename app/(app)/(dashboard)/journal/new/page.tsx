import type { Metadata } from "next";
import { Editor } from "../editor";

export const metadata: Metadata = { title: "New entry — Journal" };

export default function NewEntryPage() {
  return <Editor entry={{ id: null, text: "", pinned: false, createdLabel: null }} />;
}
