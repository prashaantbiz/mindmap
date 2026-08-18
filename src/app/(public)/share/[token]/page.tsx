import * as React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";
import { PublicCanvasViewer } from "@/components/canvas/public-canvas-viewer";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Lock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const share = await db.projectShare.findFirst({ where: { token } });
  if (!share) {
    return { title: "Shared Mind Map | Not Found" };
  }
  const project = await db.project.findUnique({ where: { id: share.projectId } });
  return {
    title: `${project?.title || "Mind Map"} | mindmap.prashaant.biz`,
    description: project?.description || "Interactive shared mind map built with mindmap.prashaant.biz.",
  };
}

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await db.projectShare.findFirst({ where: { token } });

  if (!share) {
    return (
      <main className="w-screen h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md p-8 rounded-2xl border border-border/80 bg-card shadow-xl space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-foreground">Link Expired or Private</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This mind map is either private or the share link has been revoked by the owner.
            </p>
          </div>
          <Button asChild className="w-full text-xs font-semibold">
            <Link href="/login">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>Go to mindmap.prashaant.biz</span>
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const project = await db.project.findUnique({ where: { id: share.projectId } });
  if (!project) {
    notFound();
  }

  const canvas = await db.canvas.getProjectCanvas(project.id, project.title);

  return (
    <main className="w-screen h-screen overflow-hidden bg-background">
      <PublicCanvasViewer
        project={{
          id: project.id,
          title: project.title,
          description: project.description,
          folder: project.folder,
          tags: project.tags,
        }}
        accessLevel={share.accessLevel}
        initialNodes={canvas.nodes}
        initialEdges={canvas.edges}
      />
    </main>
  );
}
