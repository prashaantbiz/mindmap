import { toPng, toSvg } from "html-to-image";
import jsPDF from "jspdf";

export interface CanvasExportOptions {
  projectTitle: string;
  isDark?: boolean;
  nodes?: any[];
  edges?: any[];
  project?: any;
}

function downloadFile(contentUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = contentUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function sanitizeFileName(name: string): string {
  return (name || "mind-map").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
}

function getFlowElement(): HTMLElement | null {
  return document.querySelector(".react-flow__viewport") as HTMLElement | null;
}

// 1. PNG Export (High-Resolution 2x)
export async function exportCanvasAsPng({
  projectTitle,
  isDark = true,
}: CanvasExportOptions) {
  const element = document.querySelector(".react-flow") as HTMLElement | null;
  if (!element) throw new Error("Canvas container not found");

  const bgColor = isDark ? "#0E0F12" : "#FBFBFA";

  const dataUrl = await toPng(element, {
    backgroundColor: bgColor,
    pixelRatio: 2,
    filter: (node) => {
      // Exclude controls & inspector panels from export image
      const classList = (node as HTMLElement)?.classList;
      if (!classList) return true;
      return (
        !classList.contains("react-flow__minimap") &&
        !classList.contains("react-flow__controls")
      );
    },
  });

  const fileName = `${sanitizeFileName(projectTitle)}.png`;
  downloadFile(dataUrl, fileName);
  return fileName;
}

// 2. SVG Vector Export
export async function exportCanvasAsSvg({
  projectTitle,
  isDark = true,
}: CanvasExportOptions) {
  const element = document.querySelector(".react-flow") as HTMLElement | null;
  if (!element) throw new Error("Canvas container not found");

  const bgColor = isDark ? "#0E0F12" : "#FBFBFA";

  const dataUrl = await toSvg(element, {
    backgroundColor: bgColor,
    filter: (node) => {
      const classList = (node as HTMLElement)?.classList;
      if (!classList) return true;
      return (
        !classList.contains("react-flow__minimap") &&
        !classList.contains("react-flow__controls")
      );
    },
  });

  const fileName = `${sanitizeFileName(projectTitle)}.svg`;
  downloadFile(dataUrl, fileName);
  return fileName;
}

// 3. PDF Document Export
export async function exportCanvasAsPdf({
  projectTitle,
  isDark = true,
}: CanvasExportOptions) {
  const element = document.querySelector(".react-flow") as HTMLElement | null;
  if (!element) throw new Error("Canvas container not found");

  const bgColor = isDark ? "#0E0F12" : "#FBFBFA";

  const dataUrl = await toPng(element, {
    backgroundColor: bgColor,
    pixelRatio: 2,
    filter: (node) => {
      const classList = (node as HTMLElement)?.classList;
      if (!classList) return true;
      return (
        !classList.contains("react-flow__minimap") &&
        !classList.contains("react-flow__controls")
      );
    },
  });

  // Calculate PDF dimensions (A4 Landscape)
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(dataUrl);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth - 20; // 10mm margins
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  const yPos = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 10;

  pdf.addImage(dataUrl, "PNG", 10, yPos, imgWidth, imgHeight);
  const fileName = `${sanitizeFileName(projectTitle)}.pdf`;
  pdf.save(fileName);
  return fileName;
}

// 4. Structured JSON Export (Re-importable format)
export function exportCanvasAsJson({
  projectTitle,
  project,
  nodes = [],
  edges = [],
}: CanvasExportOptions) {
  const payload = {
    version: "1.0.0",
    schema: "antigravity.mindmap",
    exportedAt: new Date().toISOString(),
    project: {
      title: projectTitle,
      description: project?.description || null,
      folder: project?.folder || null,
      tags: project?.tags || [],
    },
    nodes: nodes.map((n) => ({
      id: n.id,
      parentId: n.data?.parentId || null,
      text: n.data?.text || "Untitled",
      description: n.data?.description || null,
      icon: n.data?.icon || null,
      color: n.data?.color || "#6366f1",
      position: n.position || { x: 0, y: 0 },
      collapsed: Boolean(n.data?.collapsed),
      isRoot: Boolean(n.data?.isRoot),
      imageUrl: n.data?.imageUrl || null,
      videoUrl: n.data?.videoUrl || null,
      linkUrl: n.data?.linkUrl || null,
      linkLabel: n.data?.linkLabel || null,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      color: (e.data as any)?.color || "#6366f1",
      animated: Boolean(e.animated),
    })),
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const fileName = `${sanitizeFileName(projectTitle)}.json`;
  downloadFile(url, fileName);
  URL.revokeObjectURL(url);
  return fileName;
}
