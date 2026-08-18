"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Download,
  Image as ImageIcon,
  FileText,
  Code,
  FileCode,
  Loader2,
  Share2,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  exportCanvasAsPng,
  exportCanvasAsPdf,
  exportCanvasAsSvg,
  exportCanvasAsJson,
} from "@/lib/canvas-export";
import { toast } from "sonner";

interface ExportDropdownProps {
  projectTitle: string;
  project: any;
  nodes: any[];
  edges: any[];
}

export function ExportDropdown({
  projectTitle,
  project,
  nodes,
  edges,
}: ExportDropdownProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportType, setExportType] = React.useState<string | null>(null);

  const handleExport = async (type: "png" | "pdf" | "svg" | "json") => {
    try {
      setIsExporting(true);
      setExportType(type);

      if (type === "png") {
        const file = await exportCanvasAsPng({ projectTitle, isDark });
        toast.success(`Exported ${file}`);
      } else if (type === "pdf") {
        const file = await exportCanvasAsPdf({ projectTitle, isDark });
        toast.success(`Exported ${file}`);
      } else if (type === "svg") {
        const file = await exportCanvasAsSvg({ projectTitle, isDark });
        toast.success(`Exported ${file}`);
      } else if (type === "json") {
        const file = exportCanvasAsJson({ projectTitle, project, nodes, edges });
        toast.success(`Exported ${file}`);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Failed to export mind map");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-2.5 rounded-lg text-xs font-semibold gap-1.5 border-border/80 bg-card hover:bg-muted"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Download className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export mind map as PNG, PDF, SVG, or JSON</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel className="text-xs px-2 py-1.5">Export Map Format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport("png")}
          disabled={isExporting}
          className="cursor-pointer text-xs flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-indigo-500" />
            <div>
              <span className="font-medium">PNG Image</span>
              <p className="text-[10px] text-muted-foreground">High-res 2x image</p>
            </div>
          </div>
          {exportType === "png" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
          className="cursor-pointer text-xs flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-rose-500" />
            <div>
              <span className="font-medium">PDF Document</span>
              <p className="text-[10px] text-muted-foreground">Fit to page printable PDF</p>
            </div>
          </div>
          {exportType === "pdf" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport("svg")}
          disabled={isExporting}
          className="cursor-pointer text-xs flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-emerald-500" />
            <div>
              <span className="font-medium">SVG Vector</span>
              <p className="text-[10px] text-muted-foreground">Scalable vector graphics</p>
            </div>
          </div>
          {exportType === "svg" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport("json")}
          disabled={isExporting}
          className="cursor-pointer text-xs flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-cyan-500" />
            <div>
              <span className="font-medium">JSON Data</span>
              <p className="text-[10px] text-muted-foreground">Structured re-importable format</p>
            </div>
          </div>
          {exportType === "json" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
