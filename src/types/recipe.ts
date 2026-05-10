// Add this to your existing src/types/index.ts file

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  description: string | null;
  ingredients: string; // newline-separated
  steps: string; // newline-separated
  prepTime: string | null;
  tags: string | null; // comma-separated
  isFavourite: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type RecipeCategory = "breakfast" | "lunch" | "dinner" | "snack" | "any";
