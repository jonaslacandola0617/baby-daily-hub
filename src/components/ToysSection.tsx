"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Check,
  X,
  Pencil,
  Star,
  Heart,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Package,
  PackageOpen,
  Clock,
  History,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  SectionLabel,
  Spinner,
} from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Toy {
  id: string;
  name: string;
  category: ToyCategory;
  description: string | null;
  emoji: string;
  isActive: boolean;
  isFavourite: boolean;
  loveCount: number;
  lastActiveAt: string | null;
  order: number;
}

interface RotationLog {
  id: string;
  rotatedAt: string;
  theme: string | null;
  activeSetIds: string;
  inIds: string;
  outIds: string;
  notes: string | null;
}

interface RotationSettings {
  id: string;
  activeSetSize: number;
  scheduleDays: number;
  lastRotatedAt: string | null;
  nextRotationAt: string | null;
}

type ToyCategory =
  | "sensory"
  | "creative"
  | "physical"
  | "learning"
  | "imaginative"
  | "outdoor";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: {
  value: ToyCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  {
    value: "sensory",
    label: "Sensory",
    emoji: "🎨",
    color: "bg-pink-100 text-pink-700",
  },
  {
    value: "creative",
    label: "Creative",
    emoji: "✏️",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "physical",
    label: "Physical",
    emoji: "⚽",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "learning",
    label: "Learning",
    emoji: "📚",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "imaginative",
    label: "Imaginative",
    emoji: "🦄",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "outdoor",
    label: "Outdoor",
    emoji: "🌳",
    color: "bg-teal-100 text-teal-700",
  },
];

const THEMES = [
  "Free play",
  "Outdoor week",
  "Creative week",
  "Learning week",
  "Sensory week",
  "Imaginative week",
];

const TOY_EMOJIS = [
  "🧸",
  "🪀",
  "🎨",
  "🧩",
  "🎭",
  "⚽",
  "🪁",
  "🎪",
  "🧲",
  "🪆",
  "🎯",
  "🎲",
  "🪅",
  "🎠",
  "🧶",
  "🪃",
  "🥁",
  "🎹",
  "🌈",
  "🦕",
];

const emptyToyForm = {
  name: "",
  category: "sensory" as ToyCategory,
  description: "",
  emoji: "🧸",
};

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatRelativeDate(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ToysSection() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"shelf" | "all" | "history">(
    "shelf",
  );

  const { data, isLoading, refetch } = useQuery<{
    settings: RotationSettings | null;
    logs: RotationLog[];
    toys: Toy[];
  }>({
    queryKey: ["rotation"],
    queryFn: () => axios.get("/api/rotation").then((r) => r.data),
  });

  const rotateMutation = useMutation({
    mutationFn: (payload: {
      theme?: string;
      notes?: string;
      forcedActiveIds?: string[];
    }) => axios.post("/api/rotation", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation"] });
      toast.success("Toys rotated! 🎉");
    },
    onError: () => toast.error("Rotation failed"),
  });

  const settingsMutation = useMutation({
    mutationFn: (data: Partial<RotationSettings>) =>
      axios.patch("/api/rotation", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation"] });
      toast.success("Settings saved!");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading) return <Spinner />;

  const toys = data?.toys ?? [];
  const logs = data?.logs ?? [];
  const settings = data?.settings ?? {
    id: "",
    activeSetSize: 4,
    scheduleDays: 7,
    lastRotatedAt: null,
    nextRotationAt: null,
  };

  const activeToys = toys.filter((t) => t.isActive);
  const storageToys = toys.filter((t) => !t.isActive);
  const dueToRotate = settings.nextRotationAt
    ? daysUntil(settings.nextRotationAt) <= 0
    : false;
  const daysLeft = settings.nextRotationAt
    ? daysUntil(settings.nextRotationAt)
    : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── Due to rotate banner ── */}
      <AnimatePresence>
        {dueToRotate && toys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-gradient-to-r from-brand-50 to-purple-50 border border-orange-200 rounded-2xl px-4 py-3.5 flex items-center gap-3"
          >
            <span className="text-2xl">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-brand-600">
                Time to rotate!
              </p>
              <p className="text-xs text-gray-500 font-semibold">
                It's been {settings.scheduleDays} days — fresh toys make
                everything exciting again
              </p>
            </div>
            <Button
              onClick={() => rotateMutation.mutate({})}
              disabled={rotateMutation.isPending}
              className="flex-shrink-0 text-xs py-2 px-3"
            >
              <Shuffle size={13} /> Rotate now
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sub-tab switcher ── */}
      <div className="flex bg-orange-50 rounded-2xl p-1 gap-1 border border-orange-100">
        {(
          [
            { id: "shelf", label: "Active shelf", icon: "🪄" },
            { id: "all", label: "All toys", icon: "📦" },
            { id: "history", label: "History", icon: "📜" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-brand-500 shadow-sm border border-orange-100"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Active shelf tab ── */}
      {activeTab === "shelf" && (
        <ShelfTab
          activeToys={activeToys}
          storageToys={storageToys}
          allToys={toys}
          settings={settings}
          daysLeft={daysLeft}
          isRotating={rotateMutation.isPending}
          onRotate={(opts) => rotateMutation.mutate(opts)}
          onUpdateSettings={(s) => settingsMutation.mutate(s)}
          onLove={(toy) => {
            axios
              .patch(`/api/toys/${toy.id}`, { loveCount: toy.loveCount + 1 })
              .then(() => qc.invalidateQueries({ queryKey: ["rotation"] }));
          }}
          qc={qc}
        />
      )}

      {/* ── All toys tab ── */}
      {activeTab === "all" && (
        <AllToysTab toys={toys} qc={qc} onRefetch={refetch} />
      )}

      {/* ── History tab ── */}
      {activeTab === "history" && <HistoryTab logs={logs} toys={toys} />}
    </div>
  );
}

// ── Shelf tab ─────────────────────────────────────────────────────────────────

function ShelfTab({
  activeToys,
  storageToys,
  allToys,
  settings,
  daysLeft,
  isRotating,
  onRotate,
  onUpdateSettings,
  onLove,
  qc,
}: {
  activeToys: Toy[];
  storageToys: Toy[];
  allToys: Toy[];
  settings: RotationSettings;
  daysLeft: number | null;
  isRotating: boolean;
  onRotate: (opts: {
    theme?: string;
    notes?: string;
    forcedActiveIds?: string[];
  }) => void;
  onUpdateSettings: (s: Partial<RotationSettings>) => void;
  onLove: (toy: Toy) => void;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("");
  const [notes, setNotes] = useState("");
  const [setSize, setSetSize] = useState(settings.activeSetSize);
  const [scheduleDays, setScheduleDays] = useState(settings.scheduleDays);

  function doRotate() {
    onRotate({ theme: theme || undefined, notes: notes || undefined });
    setShowRotateModal(false);
    setTheme("");
    setNotes("");
  }

  const noToys = allToys.length === 0;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-orange-100 rounded-2xl py-3 px-2 text-center">
          <p className="font-fredoka text-2xl text-brand-500">
            {activeToys.length}
          </p>
          <p className="text-[10px] font-bold text-gray-400">On shelf</p>
        </div>
        <div className="bg-white border border-orange-100 rounded-2xl py-3 px-2 text-center">
          <p className="font-fredoka text-2xl text-purple-500">
            {storageToys.length}
          </p>
          <p className="text-[10px] font-bold text-gray-400">In storage</p>
        </div>
        <div className="bg-white border border-orange-100 rounded-2xl py-3 px-2 text-center">
          <p className="font-fredoka text-2xl text-teal-500">
            {daysLeft !== null ? (daysLeft <= 0 ? "🔔" : daysLeft) : "—"}
          </p>
          <p className="text-[10px] font-bold text-gray-400">
            {daysLeft !== null
              ? daysLeft <= 0
                ? "Rotate!"
                : "Days left"
              : "Manual"}
          </p>
        </div>
      </div>

      {/* Active shelf */}
      <Card>
        <CardHeader icon="🪄" title="Currently on the shelf">
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-orange-50 transition-colors"
            >
              <Settings size={14} />
            </button>
            <Button
              onClick={() => setShowRotateModal(true)}
              disabled={isRotating || noToys}
              className="text-xs py-1.5 px-3"
            >
              <Shuffle size={13} /> Rotate
            </Button>
          </div>
        </CardHeader>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-orange-100"
            >
              <div className="px-4 sm:px-5 py-4 bg-orange-50/50 space-y-3">
                <SectionLabel>Rotation settings</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1.5">
                      Active set size
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSetSize(n)}
                          className={`w-9 h-9 rounded-xl text-sm font-extrabold border transition-all ${setSize === n ? "bg-brand-500 text-white border-brand-500" : "bg-white border-gray-200 text-gray-500"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1.5">
                      Rotate every
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { label: "Manual", days: 0 },
                        { label: "5d", days: 5 },
                        { label: "7d", days: 7 },
                        { label: "10d", days: 10 },
                      ].map((o) => (
                        <button
                          key={o.days}
                          onClick={() => setScheduleDays(o.days)}
                          className={`px-2.5 h-9 rounded-xl text-xs font-extrabold border transition-all ${scheduleDays === o.days ? "bg-brand-500 text-white border-brand-500" : "bg-white border-gray-200 text-gray-500"}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onUpdateSettings({
                        activeSetSize: setSize,
                        scheduleDays,
                      });
                      setShowSettings(false);
                    }}
                  >
                    <Check size={13} /> Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSettings(false)}
                  >
                    <X size={13} /> Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardBody className={noToys ? "" : "p-0"}>
          {noToys ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">🧸</p>
              <p className="text-sm font-bold text-gray-400">
                No toys added yet
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Go to "All toys" to add Lia's collection
              </p>
            </div>
          ) : activeToys.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm font-bold text-gray-400">
                No toys on the shelf yet
              </p>
              <Button className="mt-3" onClick={() => onRotate({})}>
                <Shuffle size={13} /> Start first rotation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-orange-50">
              {activeToys.map((toy, i) => (
                <motion.div
                  key={toy.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5"
                >
                  {/* Emoji */}
                  <span className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center bg-orange-50 rounded-xl">
                    {toy.emoji}
                  </span>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-800 truncate">
                      {toy.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CategoryPill category={toy.category} />
                      {toy.loveCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-pink-400">
                          <Heart size={9} fill="currentColor" /> {toy.loveCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Love button */}
                  <button
                    onClick={() => onLove(toy)}
                    className="p-2 rounded-xl hover:bg-pink-50 text-gray-300 hover:text-pink-400 transition-all active:scale-90 flex-shrink-0 group"
                  >
                    <Heart
                      size={16}
                      className="group-hover:fill-pink-400 transition-all"
                    />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Storage preview */}
      {storageToys.length > 0 && (
        <Card>
          <CardHeader icon="📦" title={`In storage (${storageToys.length})`} />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {storageToys.map((toy) => (
                <div
                  key={toy.id}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2"
                >
                  <span className="text-base">{toy.emoji}</span>
                  <span className="text-xs font-bold text-gray-500">
                    {toy.name}
                  </span>
                  {toy.isFavourite && (
                    <Star
                      size={10}
                      className="text-amber-400"
                      fill="currentColor"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Rotate modal */}
      <AnimatePresence>
        {showRotateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowRotateModal(false);
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-fredoka text-xl text-gray-800">
                  Rotate toys 🎲
                </h3>
                <button
                  onClick={() => setShowRotateModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-gray-500 font-semibold">
                The app will swap in{" "}
                <strong className="text-gray-800">
                  {settings.activeSetSize} toys
                </strong>{" "}
                — mixing favourites, fresh picks, and category variety.
              </p>

              {/* Theme picker */}
              <div>
                <SectionLabel>Theme this week (optional)</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(theme === t ? "" : t)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${theme === t ? "bg-brand-500 text-white border-brand-500" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-brand-300"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <SectionLabel>Notes (optional)</SectionLabel>
                <Input
                  placeholder="e.g. She seemed bored with blocks — more sensory this week"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={doRotate}
                  disabled={isRotating}
                  className="flex-1 justify-center py-3"
                >
                  <Shuffle size={14} />{" "}
                  {isRotating ? "Rotating..." : "Rotate now!"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowRotateModal(false)}
                  className="py-3"
                >
                  <X size={14} />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── All toys tab ──────────────────────────────────────────────────────────────

function AllToysTab({
  toys,
  qc,
  onRefetch,
}: {
  toys: Toy[];
  qc: ReturnType<typeof useQueryClient>;
  onRefetch: () => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyToyForm);
  const [filterCat, setFilterCat] = useState<ToyCategory | "all">("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyToyForm) =>
      axios.post("/api/toys", data).then((r) => r.data),
    onSuccess: (created: Toy) => {
      qc.setQueryData(["rotation"], (old: any) =>
        old ? { ...old, toys: [...(old.toys ?? []), created] } : old,
      );
      toast.success(`${created.name} added!`);
      setAddingNew(false);
      setForm(emptyToyForm);
    },
    onError: () => toast.error("Failed to add toy"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<typeof emptyToyForm>;
    }) => axios.patch(`/api/toys/${id}`, data).then((r) => r.data),
    onSuccess: (updated: Toy) => {
      qc.setQueryData(["rotation"], (old: any) =>
        old
          ? {
              ...old,
              toys: old.toys.map((t: Toy) =>
                t.id === updated.id ? updated : t,
              ),
            }
          : old,
      );
      toast.success("Updated!");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/toys/${id}`).then(() => id),
    onSuccess: (id: string) => {
      qc.setQueryData(["rotation"], (old: any) =>
        old ? { ...old, toys: old.toys.filter((t: Toy) => t.id !== id) } : old,
      );
      toast.success("Toy removed");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleFavMutation = useMutation({
    mutationFn: ({ id, isFavourite }: { id: string; isFavourite: boolean }) =>
      axios.patch(`/api/toys/${id}`, { isFavourite }).then((r) => r.data),
    onSuccess: (updated: Toy) => {
      qc.setQueryData(["rotation"], (old: any) =>
        old
          ? {
              ...old,
              toys: old.toys.map((t: Toy) =>
                t.id === updated.id ? updated : t,
              ),
            }
          : old,
      );
    },
  });

  function startEdit(toy: Toy) {
    setEditingId(toy.id);
    setForm({
      name: toy.name,
      category: toy.category,
      description: toy.description ?? "",
      emoji: toy.emoji,
    });
  }

  function submitNew() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate(form);
  }

  function saveEdit(id: string) {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({ id, data: form });
  }

  const filtered =
    filterCat === "all" ? toys : toys.filter((t) => t.category === filterCat);

  return (
    <div className="space-y-3">
      {/* Add + filter row */}
      <div className="flex gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          <button
            onClick={() => setFilterCat("all")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filterCat === "all" ? "bg-brand-500 text-white border-brand-500" : "bg-white border-gray-200 text-gray-500"}`}
          >
            All ({toys.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = toys.filter((t) => t.category === c.value).length;
            if (count === 0) return null;
            return (
              <button
                key={c.value}
                onClick={() => setFilterCat(c.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filterCat === c.value ? "bg-brand-500 text-white border-brand-500" : "bg-white border-gray-200 text-gray-500"}`}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
        <Button
          onClick={() => {
            setAddingNew(true);
            setForm(emptyToyForm);
          }}
          className="flex-shrink-0"
        >
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* Add form */}
      {addingNew && (
        <ToyForm
          form={form}
          setForm={setForm}
          onSave={submitNew}
          onCancel={() => {
            setAddingNew(false);
            setForm(emptyToyForm);
          }}
          isSaving={createMutation.isPending}
          title="Add a toy"
        />
      )}

      {/* Empty state */}
      {filtered.length === 0 && !addingNew && (
        <div className="py-12 text-center">
          <p className="text-4xl mb-3">🧸</p>
          <p className="text-sm font-bold text-gray-400">
            {toys.length === 0
              ? "No toys yet — add Lia's collection!"
              : "No toys in this category"}
          </p>
          {toys.length === 0 && (
            <button
              onClick={() => setAddingNew(true)}
              className="mt-3 text-sm font-bold text-brand-500 hover:underline"
            >
              Add first toy →
            </button>
          )}
        </div>
      )}

      {/* Toy list */}
      <div className="space-y-2">
        {filtered.map((toy) => (
          <div
            key={toy.id}
            className={`bg-white rounded-2xl border transition-all ${toy.isActive ? "border-orange-200" : "border-orange-100"}`}
          >
            {editingId === toy.id ? (
              <div className="p-4">
                <ToyForm
                  form={form}
                  setForm={setForm}
                  onSave={() => saveEdit(toy.id)}
                  onCancel={() => setEditingId(null)}
                  isSaving={updateMutation.isPending}
                  title="Edit toy"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5 group">
                {/* Emoji + active indicator */}
                <div className="relative flex-shrink-0">
                  <span className="text-2xl w-10 h-10 flex items-center justify-center bg-orange-50 rounded-xl">
                    {toy.emoji}
                  </span>
                  {toy.isActive && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"
                      title="On shelf"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-gray-800 truncate">
                      {toy.name}
                    </p>
                    {toy.isActive && (
                      <span className="text-[9px] font-extrabold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        ON SHELF
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <CategoryPill category={toy.category} />
                    {toy.loveCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-pink-400">
                        <Heart size={9} fill="currentColor" /> {toy.loveCount}
                      </span>
                    )}
                    {toy.lastActiveAt && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-300">
                        <Clock size={9} />{" "}
                        {formatRelativeDate(toy.lastActiveAt)}
                      </span>
                    )}
                  </div>
                  {toy.description && (
                    <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                      {toy.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                      toggleFavMutation.mutate({
                        id: toy.id,
                        isFavourite: !toy.isFavourite,
                      })
                    }
                    className={`p-2 rounded-lg transition-colors ${toy.isFavourite ? "text-amber-400" : "text-gray-200 hover:text-amber-300"}`}
                  >
                    <Star
                      size={14}
                      fill={toy.isFavourite ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => startEdit(toy)}
                    className="p-2 rounded-lg text-gray-200 hover:text-brand-500 hover:bg-orange-50 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(toy.id)}
                    className="p-2 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab({ logs, toys }: { logs: RotationLog[]; toys: Toy[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toyMap = Object.fromEntries(toys.map((t) => [t.id, t]));

  function getToyNames(ids: string): Toy[] {
    return ids
      .split(",")
      .filter(Boolean)
      .map((id) => toyMap[id])
      .filter(Boolean);
  }

  if (logs.length === 0) {
    return (
      <div className="py-16 text-center">
        <History size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-400">No rotations yet</p>
        <p className="text-xs text-gray-300 mt-1">
          Your rotation history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-400 px-1">
        Showing last {logs.length} rotation{logs.length !== 1 ? "s" : ""}
      </p>
      {logs.map((log, i) => {
        const isExpanded = expandedId === log.id;
        const activeToys = getToyNames(log.activeSetIds);
        const inToys = getToyNames(log.inIds);
        const outToys = getToyNames(log.outIds);
        const rotatedDate = new Date(log.rotatedAt);

        return (
          <div
            key={log.id}
            className="bg-white rounded-2xl border border-orange-100"
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-orange-50/50 transition-colors active:bg-orange-50"
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
            >
              {/* Rotation number badge */}
              <span className="w-7 h-7 rounded-full bg-orange-100 text-brand-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                #{logs.length - i}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-extrabold text-gray-800">
                    {rotatedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {log.theme && (
                    <span className="text-[10px] font-extrabold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      {log.theme}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  {activeToys.map((t) => t.emoji).join(" ")} {activeToys.length}{" "}
                  toys on shelf
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-orange-100 px-4 py-4 space-y-3">
                {/* Active set */}
                <div>
                  <SectionLabel>Active shelf this rotation</SectionLabel>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {activeToys.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-1.5 bg-orange-50 rounded-xl px-2.5 py-1.5 border border-orange-100"
                      >
                        <span className="text-base">{t.emoji}</span>
                        <span className="text-xs font-bold text-gray-700">
                          {t.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In/out */}
                {(inToys.length > 0 || outToys.length > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {inToys.length > 0 && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-500 mb-1.5">
                          ↑ Came in
                        </p>
                        <div className="space-y-1">
                          {inToys.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-1.5 text-xs font-bold text-gray-600"
                            >
                              <span>{t.emoji}</span> {t.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {outToys.length > 0 && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">
                          ↓ Went to storage
                        </p>
                        <div className="space-y-1">
                          {outToys.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-1.5 text-xs font-bold text-gray-400"
                            >
                              <span>{t.emoji}</span> {t.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {log.notes && (
                  <div className="border-l-3 border-purple-200 pl-3 border-l-4">
                    <p className="text-xs font-bold text-purple-400 mb-0.5">
                      Notes
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">
                      {log.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Toy form ──────────────────────────────────────────────────────────────────

function ToyForm({
  form,
  setForm,
  onSave,
  onCancel,
  isSaving,
  title,
}: {
  form: typeof emptyToyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyToyForm>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  title: string;
}) {
  const [showEmojis, setShowEmojis] = useState(false);

  return (
    <div className="bg-orange-50/60 rounded-2xl border border-orange-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={15} />
        </button>
      </div>

      {/* Emoji picker + name */}
      <div className="flex gap-2">
        <div className="relative">
          <button
            onClick={() => setShowEmojis((s) => !s)}
            className="w-12 h-12 text-2xl rounded-xl bg-white border border-orange-100 hover:border-brand-300 transition-colors flex items-center justify-center flex-shrink-0"
          >
            {form.emoji}
          </button>
          {showEmojis && (
            <div className="absolute top-14 left-0 z-20 bg-white rounded-2xl border border-orange-100 shadow-lg p-3 grid grid-cols-5 gap-1.5 w-52">
              {TOY_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setForm((f) => ({ ...f, emoji: e }));
                    setShowEmojis(false);
                  }}
                  className={`text-xl w-8 h-8 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center ${form.emoji === e ? "bg-orange-100" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <Input
          placeholder="Toy name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="flex-1"
        />
      </div>

      {/* Category */}
      <div>
        <SectionLabel>Category</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setForm((f) => ({ ...f, category: c.value }))}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                form.category === c.value
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white border-gray-200 text-gray-500 hover:border-brand-300"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <Input
        placeholder="Description (optional) — e.g. Red stacking rings"
        value={form.description}
        onChange={(e) =>
          setForm((f) => ({ ...f, description: e.target.value }))
        }
      />

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={isSaving}>
          <Check size={13} /> {isSaving ? "Saving..." : "Save toy"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          <X size={13} /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Category pill ─────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  if (!cat) return null;
  return (
    <span
      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cat.color}`}
    >
      {cat.emoji} {cat.label}
    </span>
  );
}
