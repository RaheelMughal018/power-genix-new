'use client';

import { use } from 'react';
import { RecipeForm } from '@/app/_shared/components/forms/recipeForm/recipeForm';

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RecipeForm recipeId={Number(id)} />;
}
