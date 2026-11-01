// The editor's single "⋯" menu, on every screen size: the occasional actions (export, panels,
// centering, help) live here so the toolbar only carries what is used while editing.
import { useEffect, useRef, useState } from "react";
import {
  Braces,
  Check,
  CircleHelp,
  Crosshair,
  FileText,
  Image,
  Map as MiniMapIcon,
  MoreHorizontal,
  Shapes,
  SlidersHorizontal,
} from "lucide-react";
import type { ExportFormat } from "@/lib/export";
import type { PanelId } from "@/features/editor/panelLayout";
import { useEditorPanels } from "@/features/editor/panelsStore";

const EXPORTS: { format: ExportFormat; label: string; hint: string; icon: React.ReactNode }[] = [
  { format: "png", label: "Imagem PNG", hint: "Para apresentações", icon: <Image size={16} /> },
  { format: "svg", label: "Imagem SVG", hint: "Vetorial, sem perda", icon: <Shapes size={16} /> },
  { format: "markdown", label: "Markdown", hint: "Tópicos em lista", icon: <FileText size={16} /> },
  {
    format: "json",
    label: "Mindora JSON",
    hint: "Backup reimportável",
    icon: <Braces size={16} />,
  },
];

const PANELS: { id: PanelId; label: string; icon: React.ReactNode }[] = [
  { id: "inspector", label: "Propriedades", icon: <SlidersHorizontal size={16} /> },
  { id: "minimap", label: "Minimapa", icon: <MiniMapIcon size={16} /> },
];

const ITEM =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-muted pointer-coarse:min-h-11";
const SECTION = "px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground";

export function EditorMoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useEditorPanels((state) => state.visible);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as globalThis.Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`grid h-9 w-9 place-items-center rounded-lg pointer-coarse:h-11 pointer-coarse:w-11 ${open ? "bg-muted" : "hover:bg-muted"}`}
        aria-label="Mais ações"
        title="Exportar, painéis e ajuda"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-5rem)] w-64 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          <p className={SECTION}>Exportar</p>
          {EXPORTS.map((item) => (
            <button
              key={item.format}
              type="button"
              role="menuitem"
              onClick={run(() =>
                window.dispatchEvent(
                  new CustomEvent("mm-export", { detail: { format: item.format } }),
                ),
              )}
              className={ITEM}
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            </button>
          ))}

          <div className="my-1 h-px bg-border" />
          <p className={SECTION}>Painéis</p>
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={visible[panel.id]}
              onClick={() => useEditorPanels.getState().set(panel.id, (value) => !value)}
              className={ITEM}
            >
              <span className="text-muted-foreground">{panel.icon}</span>
              <span className="flex-1">{panel.label}</span>
              {visible[panel.id] && <Check size={15} className="text-primary" />}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={run(() => useEditorPanels.getState().reset())}
            className={`${ITEM} text-muted-foreground`}
          >
            <span className="w-4" aria-hidden />
            Reorganizar painéis
          </button>

          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={run(() => window.dispatchEvent(new Event("mm-center")))}
            className={ITEM}
          >
            <Crosshair size={16} className="text-muted-foreground" /> Centralizar mapa
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={run(() => window.dispatchEvent(new Event("mm-help")))}
            className={ITEM}
          >
            <CircleHelp size={16} className="text-muted-foreground" /> Atalhos e ajuda
          </button>
        </div>
      )}
    </div>
  );
}
