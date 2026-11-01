import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
  Lightbulb,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Upload,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { downloadFile, parseImportedMap } from "@/lib/export";
import { FolderTree, type DragItem } from "@/features/folders/components/FolderTree";
import {
  buildFolderExport,
  canMoveFolder,
  isFolderExport,
  parseFolderImport,
} from "@/features/folders/folderTree";
import { reportActionError, runAction } from "@/lib/feedback";
import { PlanUsageBadge, useEntitlements } from "@/features/subscriptions";
import { RenewalBanner } from "@/features/billing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/store/auth";
import {
  createBlankMap,
  createFolder,
  createMapFromTemplate,
  deleteFolder,
  deleteMap,
  loadFolders,
  loadMaps,
  upsertFolder,
  upsertMap,
  type MindFolder,
  type MindMap,
  type TemplateId,
} from "@/store/maps";

const TEMPLATES: {
  id: TemplateId;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}[] = [
  {
    id: "blank",
    icon: <Plus size={22} />,
    title: "Em branco",
    desc: "Só a ideia central",
    color: "from-slate-500 to-slate-600",
  },
  {
    id: "brainstorm",
    icon: <Lightbulb size={22} />,
    title: "Brainstorm",
    desc: "Ideias em volta de um tema",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "study",
    icon: <BookOpen size={22} />,
    title: "Estudo",
    desc: "Conteúdo em tópicos, para revisar",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "project",
    icon: <ListChecks size={22} />,
    title: "Projeto",
    desc: "Fases e tarefas com checklist",
    color: "from-emerald-500 to-teal-600",
  },
];

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Meus mapas - Mindora" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, initialized, init } = useAuth();
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [folders, setFolders] = useState<MindFolder[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const refreshEntitlements = useEntitlements((state) => state.refresh);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<"create" | "rename">("create");
  const [folderBeingEdited, setFolderBeingEdited] = useState<MindFolder | null>(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<MindFolder | null>(null);
  const [confirmDeleteMap, setConfirmDeleteMap] = useState<MindMap | null>(null);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<TemplateId>("blank");
  const [folderName, setFolderName] = useState("");
  const [mapToRename, setMapToRename] = useState<MindMap | null>(null);
  const [mapToMove, setMapToMove] = useState<MindMap | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dragged, setDragged] = useState<DragItem>(null);
  const [mapDropTarget, setMapDropTarget] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    if (user.role !== "superadmin" && !user.accessGranted) {
      navigate({ to: "/activate" });
    }
  }, [initialized, user, navigate]);

  const userId = user?.id;
  const userEmail = user?.email;
  const hasAccess = Boolean(user && (user.role === "superadmin" || user.accessGranted));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId || !userEmail || !hasAccess) {
        setLoadingMaps(false);
        return;
      }

      setLoadingMaps(true);

      try {
        const [loadedMaps, loadedFolders] = await Promise.all([
          loadMaps({ id: userId, email: userEmail }),
          loadFolders({ id: userId, email: userEmail }),
        ]);
        void refreshEntitlements();
        if (!cancelled) {
          setMaps(loadedMaps.sort((a, b) => b.updatedAt - a.updatedAt));
          setFolders(loadedFolders);
          setExpandedFolders((current) => ({
            ...Object.fromEntries(loadedFolders.map((folder) => [folder.id, true])),
            ...current,
          }));
        }
      } catch (error) {
        console.error("Falha ao carregar dashboard", error);
        if (!cancelled) {
          setMaps([]);
          setFolders([]);
          toast.error("Não foi possível carregar os mapas.");
        }
      } finally {
        if (!cancelled) setLoadingMaps(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [userId, userEmail, hasAccess, refreshEntitlements]);

  const folderChildren = useMemo(() => {
    const map = new Map<string | null, MindFolder[]>();
    folders.forEach((folder) => {
      const key = folder.parentId || null;
      const current = map.get(key) || [];
      current.push(folder);
      map.set(
        key,
        current.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      );
    });
    return map;
  }, [folders]);

  const folderMap = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);

  const breadcrumbs = useMemo(() => {
    if (!selectedFolderId) return [];
    const chain: MindFolder[] = [];
    let current = folderMap.get(selectedFolderId) || null;
    while (current) {
      chain.unshift(current);
      current = current.parentId ? folderMap.get(current.parentId) || null : null;
    }
    return chain;
  }, [folderMap, selectedFolderId]);

  const favoriteMaps = useMemo(() => maps.filter((map) => map.isFavorite), [maps]);

  const filteredMaps = useMemo(() => {
    const normalizedSearch = search
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
    return maps
      .filter((map) => (selectedFolderId ? map.folderId === selectedFolderId : true))
      .filter((map) => {
        if (!normalizedSearch) return true;
        const haystack = map.title
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
  }, [maps, search, selectedFolderId]);

  const refreshData = async () => {
    if (!user) return;
    const [loadedMaps, loadedFolders] = await Promise.all([
      loadMaps({ id: user.id, email: user.email }),
      loadFolders({ id: user.id, email: user.email }),
    ]);
    setMaps(loadedMaps.sort((a, b) => b.updatedAt - a.updatedAt));
    setFolders(loadedFolders);
  };

  /** Creates a map from a template; a typed title also names the central idea. */
  const createMap = async (templateId: TemplateId, customTitle = "") => {
    if (!user) return;
    await runAction(async () => {
      const map = createMapFromTemplate({ id: user.id, email: user.email }, templateId, {
        folderId: selectedFolderId,
      });
      const name = customTitle.trim();
      if (name) {
        map.title = name;
        map.nodes = map.nodes.map((node) =>
          node.data.isRoot ? { ...node, data: { ...node.data, label: name } } : node,
        );
      }
      await upsertMap(map);
      void refreshEntitlements();
      setShowMapModal(false);
      navigate({ to: "/editor/$id", params: { id: map.id } });
    }, "Não foi possível criar o mapa agora.");
  };

  const openNewMap = () => {
    setTitle("");
    setTemplate("blank");
    setShowMapModal(true);
  };

  const renameMap = (map: MindMap, name: string) =>
    runAction(async () => {
      const updated = { ...map, title: name, updatedAt: Date.now() };
      setMaps((current) => current.map((entry) => (entry.id === map.id ? updated : entry)));
      await upsertMap(updated);
    }, "Não foi possível renomear o mapa agora.");

  const importMapFile = async (file: File) => {
    if (!user) return;
    let raw: string;
    let parsed: unknown;
    try {
      raw = await file.text();
      parsed = JSON.parse(raw);
    } catch {
      toast.error("O arquivo não é um JSON válido.");
      return;
    }
    if (isFolderExport(parsed)) {
      await importFolderTree(raw);
      return;
    }
    let imported: ReturnType<typeof parseImportedMap>;
    try {
      imported = parseImportedMap(raw);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler o arquivo.");
      return;
    }
    await runAction(async () => {
      const map = {
        ...createBlankMap({ id: user.id, email: user.email }, imported.title, imported.mode, {
          folderId: selectedFolderId,
          viewport: imported.viewport,
        }),
        nodes: imported.nodes,
        edges: imported.edges,
      };
      await upsertMap(map);
      void refreshEntitlements();
      toast.success("Mapa importado com sucesso.");
      navigate({ to: "/editor/$id", params: { id: map.id } });
    }, "Não foi possível importar o mapa agora.");
  };

  /** Recreates an exported folder (subfolders + maps) inside the current folder. */
  const importFolderTree = async (raw: string) => {
    if (!user) return;
    let tree: ReturnType<typeof parseFolderImport>;
    try {
      tree = parseFolderImport(raw);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler a pasta.");
      return;
    }
    const owner = { id: user.id, email: user.email };
    const idOf = new Map<string, string>();
    let foldersDone = 0;
    let mapsDone = 0;
    try {
      for (const entry of tree.folders) {
        const parentId = entry.parentKey ? (idOf.get(entry.parentKey) ?? null) : selectedFolderId;
        const folder = createFolder(owner, entry.name, parentId);
        await upsertFolder(folder);
        idOf.set(entry.key, folder.id);
        foldersDone += 1;
      }
      for (const { folderKey, map: imported } of tree.maps) {
        await upsertMap({
          ...createBlankMap(owner, imported.title, imported.mode, {
            folderId: idOf.get(folderKey) ?? null,
            viewport: imported.viewport,
          }),
          nodes: imported.nodes,
          edges: imported.edges,
        });
        mapsDone += 1;
      }
      toast.success(
        `Pasta “${tree.name}” importada: ${foldersDone} pasta(s) e ${mapsDone} mapa(s).`,
      );
    } catch (error) {
      reportActionError(error, "A importação parou no meio.");
      if (foldersDone || mapsDone) {
        toast.message(`Importado até aqui: ${foldersDone} pasta(s) e ${mapsDone} mapa(s).`);
      }
    } finally {
      await refreshData();
      void refreshEntitlements();
    }
  };

  const exportFolder = (folder: MindFolder) => {
    const data = buildFolderExport(folder.id, folders, maps);
    const slug =
      folder.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "pasta";
    downloadFile(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      `pasta-${slug}.json`,
    );
    toast.success(
      `Pasta exportada com ${data.maps.length} mapa(s). Importe em qualquer conta pelo botão Importar.`,
    );
  };

  const moveFolder = (folderId: string, parentId: string | null) =>
    runAction(async () => {
      const folder = folders.find((entry) => entry.id === folderId);
      if (!folder || folder.parentId === parentId || !canMoveFolder(folderId, parentId, folders))
        return;
      await upsertFolder({ ...folder, parentId, updatedAt: Date.now() });
      if (parentId) setExpandedFolders((current) => ({ ...current, [parentId]: true }));
      await refreshData();
      toast.success(parentId ? "Pasta movida." : "Pasta movida para o topo.");
    }, "Não foi possível mover a pasta agora.");

  const renameFolder = (folder: MindFolder, name: string) =>
    runAction(async () => {
      const updated = { ...folder, name, updatedAt: Date.now() };
      setFolders((current) => current.map((entry) => (entry.id === folder.id ? updated : entry)));
      await upsertFolder(updated);
    }, "Não foi possível renomear a pasta agora.");

  /** New folder (named inline right away); optionally moving maps into it. */
  const createFolderInline = (parentId: string | null, mapsToMove: MindMap[] = []) =>
    runAction(async () => {
      if (!user) return;
      const folder = createFolder({ id: user.id, email: user.email }, "Nova pasta", parentId);
      await upsertFolder(folder);
      for (const map of mapsToMove)
        await upsertMap({ ...map, folderId: folder.id, updatedAt: Date.now() });
      if (parentId) setExpandedFolders((current) => ({ ...current, [parentId]: true }));
      setOrganizationOpen(true);
      await refreshData();
      void refreshEntitlements();
      setRenamingFolderId(folder.id);
      if (mapsToMove.length) toast.success("Pasta criada com os dois mapas. Dê um nome a ela.");
    }, "Não foi possível criar a pasta agora.");

  const submitFolderModal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    await runAction(async () => {
      await saveFolderModal();
      setFolderName("");
      setFolderBeingEdited(null);
      setShowFolderModal(false);
    }, "Não foi possível salvar a pasta agora.");
  };

  const saveFolderModal = async () => {
    if (!user) return;
    if (folderModalMode === "create") {
      const folder = createFolder(
        { id: user.id, email: user.email },
        folderName || "Nova pasta",
        selectedFolderId,
      );
      await upsertFolder(folder);
      void refreshEntitlements();
      setFolders((current) =>
        [...current, folder].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      );
      setExpandedFolders((current) => ({ ...current, [folder.id]: true }));
      toast.success("Pasta criada.");
    } else if (folderBeingEdited) {
      const updatedFolder = {
        ...folderBeingEdited,
        name: folderName.trim() || folderBeingEdited.name,
        updatedAt: Date.now(),
      };
      await upsertFolder(updatedFolder);
      await refreshData();
      toast.success("Pasta renomeada.");
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((current) => ({ ...current, [folderId]: !current[folderId] }));
  };

  const openCreateFolderModal = () => {
    setFolderModalMode("create");
    setFolderName("");
    setFolderBeingEdited(null);
    setShowFolderModal(true);
  };

  const openRenameFolderModal = (folder: MindFolder) => {
    setFolderModalMode("rename");
    setFolderName(folder.name);
    setFolderBeingEdited(folder);
    setShowFolderModal(true);
  };

  const toggleFavorite = (map: MindMap) =>
    runAction(async () => {
      await upsertMap({ ...map, isFavorite: !map.isFavorite, updatedAt: Date.now() });
      await refreshData();
      toast.success(
        map.isFavorite ? "Mapa removido dos favoritos." : "Mapa adicionado aos favoritos.",
      );
    }, "Não foi possível atualizar os favoritos agora.");

  const moveMapHandler = (map: MindMap, folderId: string | null) =>
    runAction(async () => {
      await upsertMap({ ...map, folderId, updatedAt: Date.now() });
      await refreshData();
      toast.success(
        folderId
          ? `Mapa movido para “${folders.find((folder) => folder.id === folderId)?.name ?? "a pasta"}”.`
          : "Mapa movido para Início.",
      );
    }, "Não foi possível mover o mapa agora.");

  if (!initialized) return null;
  if (!user) return null;
  if (user.role !== "superadmin" && !user.accessGranted) return null;

  const currentFolderName = selectedFolderId ? folderMap.get(selectedFolderId)?.name : null;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-border bg-card/90 p-4 shadow-[var(--shadow-soft)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-2 lg:mb-3">
              {/* Phones: the whole panel collapses to this row so maps come first. */}
              <button
                type="button"
                onClick={() => setOrganizationOpen((open) => !open)}
                className="flex min-h-11 flex-1 items-center gap-2 text-left lg:pointer-events-none lg:min-h-0"
                aria-expanded={organizationOpen}
              >
                <h2 className="text-sm font-semibold">Pastas</h2>
                {folders.length > 0 && (
                  <span className="text-xs text-muted-foreground lg:hidden">
                    ({folders.length})
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={`ml-auto text-muted-foreground transition-transform lg:hidden ${organizationOpen ? "rotate-180" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={openCreateFolderModal}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted pointer-coarse:min-h-11"
                title={
                  currentFolderName ? `Nova pasta dentro de “${currentFolderName}”` : "Nova pasta"
                }
              >
                <Plus size={12} /> Pasta
              </button>
            </div>

            <div className={organizationOpen ? "mt-4 lg:mt-0" : "hidden lg:block"}>
              <FolderTree
                folders={folders}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
                expanded={expandedFolders}
                onToggle={toggleFolder}
                dragged={dragged}
                onDragChange={setDragged}
                onMoveMap={(mapId, folderId) => {
                  const map = maps.find((entry) => entry.id === mapId);
                  if (map && map.folderId !== folderId) void moveMapHandler(map, folderId);
                }}
                onMoveFolder={(folderId, parentId) => void moveFolder(folderId, parentId)}
                renamingId={renamingFolderId}
                onRenamingChange={setRenamingFolderId}
                onRename={(folder, name) => void renameFolder(folder, name)}
                onCreateSubfolder={(parentId) => void createFolderInline(parentId)}
                onExport={exportFolder}
                onDelete={setConfirmDeleteFolder}
              />
              {maps.length > 1 && (
                <p className="mt-3 hidden text-xs leading-relaxed text-muted-foreground pointer-fine:block">
                  Dica: arraste um mapa até uma pasta para guardá-lo, ou sobre outro mapa para criar
                  uma pasta com os dois.
                </p>
              )}

              {favoriteMaps.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Favoritos
                  </h3>
                  <div className="space-y-1">
                    {favoriteMaps.map((map) => (
                      <button
                        key={map.id}
                        type="button"
                        onClick={() => navigate({ to: "/editor/$id", params: { id: map.id } })}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted pointer-coarse:min-h-11"
                      >
                        <Star size={14} className="shrink-0 fill-current text-amber-500" />
                        <span className="truncate">{map.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0 rounded-3xl border border-border bg-card/90 p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-5 empty:hidden">
              <RenewalBanner />
            </div>
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                {breadcrumbs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(null)}
                      className="hover:text-foreground pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                    >
                      Meus mapas
                    </button>
                    {breadcrumbs.map((folder) => (
                      <span key={folder.id} className="inline-flex items-center gap-2">
                        <ChevronRight size={12} />
                        <button
                          type="button"
                          onClick={() => setSelectedFolderId(folder.id)}
                          className="hover:text-foreground pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                        >
                          {folder.name}
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="mt-1 truncate text-3xl font-bold tracking-tight">
                  {currentFolderName ?? "Meus mapas"}
                </h1>
                {!loadingMaps && maps.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plural(filteredMaps.length, "mapa", "mapas")}
                    {search.trim() ? " encontrados" : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <PlanUsageBadge />
                {maps.length > 0 && (
                  <label className="relative order-last block w-full sm:order-none sm:w-auto sm:min-w-[220px]">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar mapas"
                      aria-label="Buscar mapas pelo nome"
                      className="w-full rounded-xl border border-border bg-background px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                )}
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    setShowMapModal(false);
                    if (file) void importMapFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={openNewMap}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-hero)] px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 pointer-coarse:min-h-11 sm:ml-0"
                >
                  <Plus size={18} /> Novo mapa
                </button>
              </div>
            </div>

            {loadingMaps ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-background/60 py-24 text-muted-foreground">
                <div className="h-10 w-10 animate-pulse rounded-2xl bg-[image:var(--gradient-hero)] opacity-60" />
                <span className="text-sm">Carregando mapas...</span>
              </div>
            ) : maps.length === 0 ? (
              /* ── Welcome screen for first-time users ── */
              <div className="flex flex-col items-center px-4 py-10">
                <div className="mb-3 inline-grid h-14 w-14 place-items-center rounded-3xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-lg">
                  <Sparkles size={26} />
                </div>
                <h2 className="mb-1 text-center text-2xl font-bold tracking-tight">
                  Olá, {user?.name?.split(" ")[0]}! Vamos criar seu primeiro mapa?
                </h2>
                <p className="mb-8 text-center text-sm text-muted-foreground">
                  Escolha um ponto de partida. Dá para mudar tudo depois.
                </p>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {TEMPLATES.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onClick={() => void createMap(tpl.id)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
                >
                  <Upload size={14} /> Já tem um mapa exportado? Importar arquivo JSON
                </button>
              </div>
            ) : filteredMaps.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-3" />
                {search.trim() ? (
                  <>
                    Nenhum mapa com “{search.trim()}”.{" "}
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="font-medium text-primary hover:underline"
                    >
                      Limpar busca
                    </button>
                  </>
                ) : (
                  <>
                    Esta pasta está vazia. Crie um mapa aqui ou arraste um mapa até ela.
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={openNewMap}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-medium text-foreground hover:bg-muted"
                      >
                        <Plus size={14} /> Novo mapa nesta pasta
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMaps.map((map) => (
                  <div
                    key={map.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", map.title);
                      setDragged({ type: "map", id: map.id });
                    }}
                    onDragEnd={() => {
                      setDragged(null);
                      setMapDropTarget(null);
                    }}
                    onDragOver={(event) => {
                      if (dragged?.type !== "map" || dragged.id === map.id) return;
                      event.preventDefault();
                      setMapDropTarget(map.id);
                    }}
                    onDragLeave={() =>
                      setMapDropTarget((current) => (current === map.id ? null : current))
                    }
                    onDrop={(event) => {
                      event.preventDefault();
                      setMapDropTarget(null);
                      const source =
                        dragged?.type === "map"
                          ? maps.find((entry) => entry.id === dragged.id)
                          : null;
                      setDragged(null);
                      if (!source || source.id === map.id) return;
                      // Like app icons on a phone: dropping a map on another groups both in a new folder.
                      void createFolderInline(map.folderId ?? null, [map, source]);
                    }}
                    className={`group flex items-start gap-2 rounded-2xl border bg-background/70 p-4 transition hover:border-primary/60 hover:shadow-[var(--shadow-soft)] ${
                      mapDropTarget === map.id
                        ? "border-primary ring-4 ring-primary/20 scale-[1.02]"
                        : "border-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/editor/$id", params: { id: map.id } })}
                      className="min-w-0 flex-1 py-1 text-left"
                    >
                      <h3 className="truncate font-semibold">{map.title}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {plural(map.nodes.length, "ideia", "ideias")} · editado em{" "}
                        {new Date(map.updatedAt).toLocaleDateString("pt-BR")}
                        {!selectedFolderId && map.folderId && folderMap.get(map.folderId) && (
                          <span className="mt-1 flex items-center gap-1">
                            <Folder size={12} /> {folderMap.get(map.folderId)?.name}
                          </span>
                        )}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(map)}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors pointer-coarse:h-11 pointer-coarse:w-11 ${map.isFavorite ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
                      title={map.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      aria-label={
                        map.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
                      }
                      aria-pressed={map.isFavorite}
                    >
                      <Star size={16} className={map.isFavorite ? "fill-current" : ""} />
                    </button>
                    <MapCardMenu
                      onRename={() => setMapToRename(map)}
                      onMove={() => setMapToMove(map)}
                      onDelete={() => setConfirmDeleteMap(map)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Novo mapa</DialogTitle>
            <DialogDescription>
              {currentFolderName
                ? `Escolha um ponto de partida. O mapa fica na pasta “${currentFolderName}”.`
                : "Escolha um ponto de partida. Dá para mudar tudo depois."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createMap(template, title);
            }}
            className="space-y-4"
          >
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nome do mapa (opcional)"
              aria-label="Nome do mapa"
              maxLength={120}
              className="w-full rounded-xl border border-border bg-input px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Modelo">
              {TEMPLATES.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  compact
                  selected={template === tpl.id}
                  onClick={() => setTemplate(tpl.id)}
                />
              ))}
            </div>
            <DialogFooter className="items-center gap-2 sm:justify-between">
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Criar a partir de um mapa ou pasta exportados em JSON"
              >
                <Upload size={15} /> Importar arquivo
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="rounded-xl px-4 py-2 hover:bg-muted"
                >
                  Cancelar
                </button>
                <button className="rounded-xl bg-[image:var(--gradient-hero)] px-4 py-2 font-medium text-primary-foreground">
                  Criar mapa
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <NameDialog
        open={Boolean(mapToRename)}
        title="Renomear mapa"
        label="Nome do mapa"
        initialValue={mapToRename?.title ?? ""}
        onClose={() => setMapToRename(null)}
        onSubmit={(name) => {
          if (mapToRename && name !== mapToRename.title) void renameMap(mapToRename, name);
          setMapToRename(null);
        }}
      />

      <Dialog open={Boolean(mapToMove)} onOpenChange={(open) => !open && setMapToMove(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mover mapa</DialogTitle>
            <DialogDescription>
              {mapToMove ? `Para onde vai “${mapToMove.title}”?` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {[{ id: null as string | null, name: "Meus mapas (sem pasta)", depth: 0 }]
              .concat(flattenFolders(folderChildren, null, 0))
              .map((entry) => {
                const current = (mapToMove?.folderId ?? null) === entry.id;
                return (
                  <button
                    key={entry.id ?? "root"}
                    type="button"
                    disabled={current}
                    onClick={() => {
                      if (mapToMove) void moveMapHandler(mapToMove, entry.id);
                      setMapToMove(null);
                    }}
                    style={{ paddingLeft: `${0.75 + entry.depth * 1}rem` }}
                    className="flex min-h-10 w-full items-center gap-2 rounded-lg pr-3 text-left text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11"
                  >
                    {entry.id ? (
                      <Folder size={15} className="shrink-0 text-muted-foreground" />
                    ) : (
                      <FolderOpen size={15} className="shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{entry.name}</span>
                    {current && <span className="ml-auto text-xs">(atual)</span>}
                  </button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFolderModal}
        onOpenChange={(open) => {
          setShowFolderModal(open);
          if (!open) {
            setFolderName("");
            setFolderBeingEdited(null);
          }
        }}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {folderModalMode === "create" ? "Nova pasta" : "Renomear pasta"}
            </DialogTitle>
            <DialogDescription>
              {folderModalMode === "create"
                ? currentFolderName
                  ? `A pasta será criada dentro de “${currentFolderName}”.`
                  : "Use pastas para separar mapas por assunto."
                : "Atualize o nome da pasta."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitFolderModal} className="space-y-4">
            <input
              autoFocus
              required
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Nome da pasta"
              className="w-full rounded-xl border border-border bg-input px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-xl px-4 py-2 hover:bg-muted"
              >
                Cancelar
              </button>
              <button className="rounded-xl bg-[image:var(--gradient-hero)] px-4 py-2 font-medium text-primary-foreground">
                {folderModalMode === "create" ? "Criar pasta" : "Salvar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmDeleteFolder)}
        onOpenChange={(open) => !open && setConfirmDeleteFolder(null)}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Excluir pasta</DialogTitle>
            <DialogDescription>
              {confirmDeleteFolder
                ? `A pasta “${confirmDeleteFolder.name}” será excluída. Os mapas dela não são apagados: voltam para Meus mapas.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmDeleteFolder(null)}
              className="rounded-xl px-4 py-2 hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmDeleteFolder || !user) return;
                void runAction(async () => {
                  await deleteFolder(confirmDeleteFolder.id, { id: user.id, email: user.email });
                  if (selectedFolderId === confirmDeleteFolder.id) setSelectedFolderId(null);
                  setConfirmDeleteFolder(null);
                  await refreshData();
                  void refreshEntitlements();
                  toast.success("Pasta excluída.");
                }, "Não foi possível excluir a pasta agora.");
              }}
              className="rounded-xl bg-destructive px-4 py-2 font-medium text-destructive-foreground"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmDeleteMap)}
        onOpenChange={(open) => !open && setConfirmDeleteMap(null)}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Excluir mapa</DialogTitle>
            <DialogDescription>
              {confirmDeleteMap
                ? `O mapa “${confirmDeleteMap.title}” será apagado para sempre. Isso não pode ser desfeito.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmDeleteMap(null)}
              className="rounded-xl px-4 py-2 hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmDeleteMap || !user) return;
                void runAction(async () => {
                  await deleteMap(confirmDeleteMap.id, { id: user.id, email: user.email });
                  setConfirmDeleteMap(null);
                  await refreshData();
                  void refreshEntitlements();
                  toast.success("Mapa excluído.");
                }, "Não foi possível excluir o mapa agora.");
              }}
              className="rounded-xl bg-destructive px-4 py-2 font-medium text-destructive-foreground"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function flattenFolders(
  children: Map<string | null, MindFolder[]>,
  parentId: string | null,
  depth: number,
): { id: string | null; name: string; depth: number }[] {
  return (children.get(parentId) ?? []).flatMap((folder) => [
    { id: folder.id as string | null, name: folder.name, depth: depth + 1 },
    ...flattenFolders(children, folder.id, depth + 1),
  ]);
}

function TemplateCard({
  template,
  onClick,
  compact = false,
  selected = false,
}: {
  template: (typeof TEMPLATES)[number];
  onClick: () => void;
  compact?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={compact ? "radio" : undefined}
      aria-checked={compact ? selected : undefined}
      className={`group flex items-center gap-3 rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        compact ? "p-3" : "bg-card/80 p-4 shadow-sm hover:shadow-[var(--shadow-soft)]"
      } ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
    >
      <span
        className={`inline-grid shrink-0 place-items-center rounded-xl bg-gradient-to-br ${template.color} text-white shadow ${compact ? "h-9 w-9" : "h-11 w-11"}`}
      >
        {template.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{template.title}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{template.desc}</span>
      </span>
    </button>
  );
}

/** The occasional actions of a map card, behind one "⋯" button. */
function MapCardMenu({
  onRename,
  onMove,
  onDelete,
}: {
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as globalThis.Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-muted pointer-coarse:min-h-11";
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:h-11 pointer-coarse:w-11 ${open ? "bg-muted text-foreground" : ""}`}
        aria-label="Ações do mapa"
        title="Renomear, mover ou excluir"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 w-48 rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          <button type="button" role="menuitem" onClick={run(onRename)} className={item}>
            <Pencil size={15} className="text-muted-foreground" /> Renomear
          </button>
          <button type="button" role="menuitem" onClick={run(onMove)} className={item}>
            <FolderInput size={15} className="text-muted-foreground" /> Mover para pasta
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={run(onDelete)}
            className={`${item} text-destructive`}
          >
            <Trash2 size={15} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function NameDialog({
  open,
  title,
  label,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  label: string;
  initialValue: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{label}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (value.trim()) onSubmit(value.trim());
          }}
          className="space-y-4"
        >
          <input
            autoFocus
            required
            value={value}
            maxLength={120}
            onChange={(event) => setValue(event.target.value)}
            aria-label={label}
            className="w-full rounded-xl border border-border bg-input px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 hover:bg-muted">
              Cancelar
            </button>
            <button className="rounded-xl bg-[image:var(--gradient-hero)] px-4 py-2 font-medium text-primary-foreground">
              Salvar
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
