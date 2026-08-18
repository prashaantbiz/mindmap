export interface FontOption {
  id: string;
  name: string;
  className: string;
  category: string;
  sample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    className: "font-inter",
    category: "Modern Sans",
    sample: "Default Clean & Balanced",
  },
  {
    id: "outfit",
    name: "Outfit",
    className: "font-outfit",
    category: "Geometric Sans",
    sample: "Friendly & Premium",
  },
  {
    id: "poppins",
    name: "Poppins",
    className: "font-poppins",
    category: "Rounded Sans",
    sample: "Vibrant & Geometric",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    className: "font-playfair",
    category: "Luxury Serif",
    sample: "Editorial & Elegant",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    className: "font-merriweather",
    category: "Classic Serif",
    sample: "Readable & Literary",
  },
  {
    id: "fira",
    name: "Fira Code",
    className: "font-fira",
    category: "Monospace",
    sample: "Code & Engineering",
  },
  {
    id: "caveat",
    name: "Caveat",
    className: "font-caveat",
    category: "Handwritten",
    sample: "Brainstorming Marker",
  },
  {
    id: "architects",
    name: "Architects Daughter",
    className: "font-architects",
    category: "Whiteboard Sketch",
    sample: "Casual & Expressive",
  },
];

export function getFontClass(fontId?: string | null): string {
  if (!fontId) return "font-inter";
  const found = FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.className : "font-inter";
}
