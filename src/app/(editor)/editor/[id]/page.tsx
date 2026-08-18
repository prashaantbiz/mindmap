import * as React from "react";
import { Metadata } from "next";
import { MindMapCanvas } from "@/components/canvas/mind-map-canvas";

export const metadata: Metadata = {
  title: "Mind Map Editor | mindmap.prashaant.biz",
  description: "Infinite interactive canvas for visual brainstorming and mind mapping by prashaant.biz.",
};

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="w-screen h-screen overflow-hidden bg-background">
      <MindMapCanvas projectId={id} />
    </main>
  );
}
