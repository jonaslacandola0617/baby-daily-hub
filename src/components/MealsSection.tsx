"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Pencil,
  Clock,
  Tag,
  BookOpen,
  UtensilsCrossed,
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
import { today } from "@/lib/utils";
import type { MealLog } from "@/types";
import type { Recipe, RecipeCategory } from "@/types/recipe";

// ── Constants ─────────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  {
    key: "breakfast" as const,
    icon: "🌅",
    label: "Breakfast",
    placeholder: "e.g. Oatmeal + banana\nWhole milk",
  },
  {
    key: "lunch" as const,
    icon: "☀️",
    label: "Lunch",
    placeholder: "e.g. Rice + chicken\nSteamed veggies",
  },
  {
    key: "dinner" as const,
    icon: "🌙",
    label: "Dinner",
    placeholder: "e.g. Pasta + veggies\nSoft fruit",
  },
  {
    key: "snacks" as const,
    icon: "🍎",
    label: "Snacks",
    placeholder: "e.g. Crackers + fruit at 4pm",
  },
];

const CATEGORIES: { value: RecipeCategory; label: string; emoji: string }[] = [
  { value: "any", label: "Any meal", emoji: "🍴" },
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
  { value: "snack", label: "Snack", emoji: "🍎" },
];

const CAT_COLORS: Record<RecipeCategory, string> = {
  any: "bg-gray-100 text-gray-600",
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-green-100 text-green-700",
  dinner: "bg-blue-100 text-blue-700",
  snack: "bg-purple-100 text-purple-700",
};

const VITAMIN_LIST_KEY = "babyhub_vitaminList";
function loadVitaminList(): string[] {
  if (typeof window === "undefined") return ["Vitamin C"];
  try {
    const s = localStorage.getItem(VITAMIN_LIST_KEY);
    return s ? JSON.parse(s) : ["Vitamin C"];
  } catch {
    return ["Vitamin C"];
  }
}
function saveVitaminList(list: string[]) {
  localStorage.setItem(VITAMIN_LIST_KEY, JSON.stringify(list));
}

const emptyRecipeForm = {
  name: "",
  category: "any" as RecipeCategory,
  description: "",
  prepTime: "",
  tags: "",
  ingredients: "",
  steps: "",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function MealsSection() {
  const qc = useQueryClient();
  const date = today();
  const [activeTab, setActiveTab] = useState<"log" | "recipes">("log");

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex bg-orange-50 rounded-2xl p-1 gap-1 border border-orange-100">
        {(
          [
            { id: "log", label: "Today's Log", icon: "📋" },
            { id: "recipes", label: "Recipe Library", icon: "📖" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-brand-500 shadow-sm border border-orange-100"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "log" && <MealLogTab date={date} qc={qc} />}
      {activeTab === "recipes" && <RecipeLibraryTab qc={qc} />}
    </div>
  );
}

// ── Today's meal log tab ──────────────────────────────────────────────────────

function MealLogTab({
  date,
  qc,
}: {
  date: string;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [vitaminList, setVitaminList] = useState<string[]>(loadVitaminList);
  const [addingVitamin, setAddingVitamin] = useState(false);
  const [newVitamin, setNewVitamin] = useState("");

  const { data: meals, isLoading } = useQuery<MealLog>({
    queryKey: ["meals", date],
    queryFn: () => axios.get(`/api/meals?date=${date}`).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<MealLog> & { date: string }) =>
      axios.put("/api/meals", data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["meals", date], data);
    },
    onError: () => toast.error("Failed to save"),
  });

  function update(field: keyof MealLog, value: unknown) {
    mutation.mutate({ date, [field]: value });
  }

  function toggleVitamin(name: string) {
    const current = meals?.vitamins ?? {};
    update("vitamins", { ...current, [name]: !current[name] });
  }

  function addVitamin() {
    const name = newVitamin.trim();
    if (!name) return;
    if (vitaminList.includes(name)) {
      toast.error("Already in list");
      return;
    }
    const next = [...vitaminList, name];
    setVitaminList(next);
    saveVitaminList(next);
    setNewVitamin("");
    setAddingVitamin(false);
    toast.success(`${name} added!`);
  }

  function removeVitamin(name: string) {
    const next = vitaminList.filter((v) => v !== name);
    setVitaminList(next);
    saveVitaminList(next);
    const nextVitamins = { ...(meals?.vitamins ?? {}) };
    delete nextVitamins[name];
    update("vitamins", nextVitamins);
  }

  if (isLoading) return <Spinner />;
  if (!meals) return null;

  const vitamins = meals.vitamins ?? {};

  return (
    <>
      <Card>
        <CardHeader icon="🍽️" title="Today's Meals" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEAL_SLOTS.map((slot) => (
              <div
                key={slot.key}
                className="bg-orange-50 rounded-xl p-3.5 border border-orange-100"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                  {slot.icon} {slot.label}
                </p>
                <MealTextarea
                  value={meals[slot.key] ?? ""}
                  placeholder={slot.placeholder}
                  onCommit={(v) => update(slot.key, v)}
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon="💊" title="Vitamins & Supplements">
          <Button
            variant="ghost"
            onClick={() => setAddingVitamin(true)}
            className="text-xs py-1.5 px-3"
          >
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody>
          {addingVitamin && (
            <div className="flex gap-2 mb-4">
              <Input
                autoFocus
                placeholder="e.g. Vitamin D, Iron..."
                value={newVitamin}
                onChange={(e) => setNewVitamin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addVitamin();
                  if (e.key === "Escape") {
                    setAddingVitamin(false);
                    setNewVitamin("");
                  }
                }}
                className="flex-1"
              />
              <button
                onClick={addVitamin}
                className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex-shrink-0"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setAddingVitamin(false);
                  setNewVitamin("");
                }}
                className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {vitaminList.length === 0 && (
            <p className="text-sm text-gray-400 font-semibold py-2">
              No vitamins added — click Add above
            </p>
          )}
          <SectionLabel>Tap to mark as given today</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {vitaminList.map((v) => {
              const done = !!vitamins[v];
              return (
                <div key={v} className="relative group">
                  <button
                    onClick={() => toggleVitamin(v)}
                    className={`w-full py-3.5 px-3 rounded-xl border-2 font-bold transition-all active:scale-95 text-center ${
                      done
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    <span className="block text-xl mb-1">
                      {done ? "✅" : "💊"}
                    </span>
                    <span className="text-xs leading-tight">{v}</span>
                  </button>
                  <button
                    onClick={() => removeVitamin(v)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-200 active:scale-95"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

// ── Recipe library tab ────────────────────────────────────────────────────────

function RecipeLibraryTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [filterCat, setFilterCat] = useState<RecipeCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(emptyRecipeForm);
  const [search, setSearch] = useState("");

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: () => axios.get("/api/recipes").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyRecipeForm) =>
      axios.post("/api/recipes", data).then((r) => r.data),
    onSuccess: (created: Recipe) => {
      qc.setQueryData(["recipes"], (old: Recipe[] = []) => [...old, created]);
      toast.success("Recipe saved!");
      setAddingNew(false);
      setForm(emptyRecipeForm);
    },
    onError: () => toast.error("Failed to save recipe"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<typeof emptyRecipeForm>;
    }) => axios.patch(`/api/recipes/${id}`, data).then((r) => r.data),
    onSuccess: (updated: Recipe) => {
      qc.setQueryData(["recipes"], (old: Recipe[] = []) =>
        old.map((r) => (r.id === updated.id ? updated : r)),
      );
      toast.success("Recipe updated!");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update recipe"),
  });

  const toggleFavMutation = useMutation({
    mutationFn: ({ id, isFavourite }: { id: string; isFavourite: boolean }) =>
      axios.patch(`/api/recipes/${id}`, { isFavourite }).then((r) => r.data),
    onSuccess: (updated: Recipe) => {
      qc.setQueryData(["recipes"], (old: Recipe[] = []) =>
        old.map((r) => (r.id === updated.id ? updated : r)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`/api/recipes/${id}`).then(() => id),
    onSuccess: (id: string) => {
      qc.setQueryData(["recipes"], (old: Recipe[] = []) =>
        old.filter((r) => r.id !== id),
      );
      toast.success("Recipe removed");
      if (expandedId === id) setExpandedId(null);
    },
    onError: () => toast.error("Failed to delete recipe"),
  });

  function startEdit(recipe: Recipe) {
    setEditingId(recipe.id);
    setExpandedId(recipe.id);
    setForm({
      name: recipe.name,
      category: recipe.category,
      description: recipe.description ?? "",
      prepTime: recipe.prepTime ?? "",
      tags: recipe.tags ?? "",
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    });
  }

  function saveEdit(id: string) {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({ id, data: form });
  }

  function submitNew() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate(form);
  }

  // Filter + search
  const filtered = recipes.filter((r) => {
    const matchCat = filterCat === "all" || r.category === filterCat;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.tags ?? "").toLowerCase().includes(q) ||
      r.ingredients.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Group: favourites first, then by category label
  const favourites = filtered.filter((r) => r.isFavourite);
  const rest = filtered.filter((r) => !r.isFavourite);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-3">
      {/* Search + add row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <BookOpen
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
          <input
            placeholder="Search recipes, ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 focus:bg-white transition-colors placeholder:text-gray-300"
          />
        </div>
        <Button
          onClick={() => {
            setAddingNew(true);
            setForm(emptyRecipeForm);
            setExpandedId(null);
          }}
          className="flex-shrink-0"
        >
          <Plus size={14} /> Add recipe
        </Button>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filterCat === "all" ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"}`}
        >
          All ({recipes.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = recipes.filter((r) => r.category === c.value).length;
          if (count === 0) return null;
          return (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filterCat === c.value ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"}`}
            >
              {c.emoji} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add new form */}
      {addingNew && (
        <RecipeForm
          form={form}
          setForm={setForm}
          onSave={submitNew}
          onCancel={() => {
            setAddingNew(false);
            setForm(emptyRecipeForm);
          }}
          isSaving={createMutation.isPending}
          title="New recipe"
        />
      )}

      {/* Empty state */}
      {!addingNew && filtered.length === 0 && (
        <div className="py-12 text-center">
          <UtensilsCrossed size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">
            {recipes.length === 0
              ? "No recipes yet — add Lia's favourites!"
              : "No recipes match your search"}
          </p>
          {recipes.length === 0 && (
            <button
              onClick={() => {
                setAddingNew(true);
                setForm(emptyRecipeForm);
              }}
              className="mt-3 text-sm font-bold text-brand-500 hover:underline"
            >
              Add your first recipe →
            </button>
          )}
        </div>
      )}

      {/* Favourites group */}
      {favourites.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">
              ⭐ Favourites
            </span>
            <div className="flex-1 h-px bg-amber-100" />
          </div>
          {favourites.map((recipe) => (
            <RecipeAccordion
              key={recipe.id}
              recipe={recipe}
              isExpanded={expandedId === recipe.id}
              isEditing={editingId === recipe.id}
              form={form}
              setForm={setForm}
              onToggle={() => {
                setExpandedId(expandedId === recipe.id ? null : recipe.id);
                setEditingId(null);
              }}
              onEdit={() => startEdit(recipe)}
              onSaveEdit={() => saveEdit(recipe.id)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => deleteMutation.mutate(recipe.id)}
              onToggleFav={() =>
                toggleFavMutation.mutate({
                  id: recipe.id,
                  isFavourite: !recipe.isFavourite,
                })
              }
              isSaving={updateMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Rest of recipes */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {favourites.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                All recipes
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          )}
          {rest.map((recipe) => (
            <RecipeAccordion
              key={recipe.id}
              recipe={recipe}
              isExpanded={expandedId === recipe.id}
              isEditing={editingId === recipe.id}
              form={form}
              setForm={setForm}
              onToggle={() => {
                setExpandedId(expandedId === recipe.id ? null : recipe.id);
                setEditingId(null);
              }}
              onEdit={() => startEdit(recipe)}
              onSaveEdit={() => saveEdit(recipe.id)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => deleteMutation.mutate(recipe.id)}
              onToggleFav={() =>
                toggleFavMutation.mutate({
                  id: recipe.id,
                  isFavourite: !recipe.isFavourite,
                })
              }
              isSaving={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single accordion recipe card ─────────────────────────────────────────────

interface AccordionProps {
  recipe: Recipe;
  isExpanded: boolean;
  isEditing: boolean;
  form: typeof emptyRecipeForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyRecipeForm>>;
  onToggle: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
  isSaving: boolean;
}

function RecipeAccordion({
  recipe,
  isExpanded,
  isEditing,
  form,
  setForm,
  onToggle,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleFav,
  isSaving,
}: AccordionProps) {
  const catInfo =
    CATEGORIES.find((c) => c.value === recipe.category) ?? CATEGORIES[0];
  const tags = recipe.tags
    ? recipe.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const ingredients = recipe.ingredients.split("\n").filter(Boolean);
  const steps = recipe.steps.split("\n").filter(Boolean);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${isExpanded ? "border-orange-200 shadow-sm" : "border-orange-100"}`}
    >
      {/* ── Header row (always visible) ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Expand toggle */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <span className="text-2xl flex-shrink-0">{catInfo.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-gray-800 truncate">
              {recipe.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[recipe.category]}`}
              >
                {catInfo.label}
              </span>
              {recipe.prepTime && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400">
                  <Clock size={9} /> {recipe.prepTime}
                </span>
              )}
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400"
                >
                  <Tag size={9} /> {tag}
                </span>
              ))}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          )}
        </button>

        {/* Favourite + actions */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${recipe.isFavourite ? "text-amber-400 hover:text-amber-500" : "text-gray-200 hover:text-amber-300"}`}
        >
          <Star size={15} fill={recipe.isFavourite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* ── Expanded content ── */}
      {isExpanded && (
        <div className="border-t border-orange-100">
          {isEditing ? (
            <div className="px-4 py-4">
              <RecipeForm
                form={form}
                setForm={setForm}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                isSaving={isSaving}
                title="Edit recipe"
              />
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {/* Description */}
              {recipe.description && (
                <p className="text-sm text-gray-500 font-semibold italic leading-relaxed">
                  {recipe.description}
                </p>
              )}

              {/* Two-column: ingredients + steps */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Ingredients */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <UtensilsCrossed size={12} className="text-brand-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                      Ingredients
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0 mt-1.5" />
                        <span className="text-sm font-semibold text-gray-700 leading-snug">
                          {ing}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen
                      size={12}
                      className="text-ai"
                      style={{ color: "#5B4FCF" }}
                    />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                      Steps
                    </span>
                  </div>
                  <ol className="space-y-2">
                    {steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-brand-500 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 leading-snug">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* All tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Edit / delete actions */}
              <div className="flex gap-2 pt-2 border-t border-orange-50">
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-brand-500 transition-colors py-1 px-2 rounded-lg hover:bg-orange-50"
                >
                  <Pencil size={12} /> Edit recipe
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-1 px-2 rounded-lg hover:bg-red-50 ml-auto"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Recipe form (shared by add + edit) ───────────────────────────────────────

function RecipeForm({
  form,
  setForm,
  onSave,
  onCancel,
  isSaving,
  title,
}: {
  form: typeof emptyRecipeForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyRecipeForm>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  title: string;
}) {
  function f(field: keyof typeof emptyRecipeForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

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

      {/* Name + category row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          placeholder="Recipe name *"
          value={form.name}
          onChange={f("name")}
        />
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setForm((p) => ({ ...p, category: c.value }))}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all flex-1 min-w-[56px] ${
                form.category === c.value
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description + prep time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2">
          <Input
            placeholder="Short description (optional)"
            value={form.description}
            onChange={f("description")}
          />
        </div>
        <Input
          placeholder="⏱ Prep time (e.g. 10 mins)"
          value={form.prepTime}
          onChange={f("prepTime")}
        />
      </div>

      {/* Ingredients */}
      <div>
        <SectionLabel>Ingredients * — one per line</SectionLabel>
        <textarea
          placeholder={
            "1 cup oatmeal\n1 banana, mashed\n½ cup whole milk\nPinch of cinnamon"
          }
          value={form.ingredients}
          onChange={f("ingredients")}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-white font-nunito text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
        />
      </div>

      {/* Steps */}
      <div>
        <SectionLabel>Steps * — one step per line</SectionLabel>
        <textarea
          placeholder={
            "Cook oatmeal with milk until soft\nMash banana and stir in\nSprinkle cinnamon on top\nServe warm — let it cool before giving"
          }
          value={form.steps}
          onChange={f("steps")}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-white font-nunito text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
        />
      </div>

      {/* Tags */}
      <Input
        placeholder="Tags (optional) — e.g. quick, finger-food, no-cook, soft"
        value={form.tags}
        onChange={f("tags")}
      />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={isSaving}>
          <Check size={13} /> {isSaving ? "Saving..." : "Save recipe"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          <X size={13} /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Shared: autosave textarea ─────────────────────────────────────────────────

function MealTextarea({
  value,
  onCommit,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  const commit = useCallback(() => {
    if (local !== value) onCommit(local);
  }, [local, value, onCommit]);
  return (
    <textarea
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      rows={3}
      className="w-full bg-transparent font-nunito text-sm font-semibold text-gray-700 outline-none resize-none placeholder:text-gray-300 leading-relaxed"
    />
  );
}
