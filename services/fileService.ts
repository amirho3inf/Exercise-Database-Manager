
import { Exercise } from '../types';

export const sanitizeExercises = (data: any[]): Exercise[] => {
  if (!Array.isArray(data)) {
    console.warn("Loaded data is not an array. Returning empty array.");
    return [];
  }

  return data.map((item: any, index: number) => ({
    id: typeof item.id === 'number' ? item.id : Date.now() + index,
    name: item.name ?? '',
    name_en: item.name_en ?? '',
    category: item.category ?? 'strength',
    equipment: Array.isArray(item.equipment) ? item.equipment : [],
    primary_muscles: Array.isArray(item.primary_muscles) ? item.primary_muscles : [],
    secondary_muscles: Array.isArray(item.secondary_muscles) ? item.secondary_muscles : [],
    description: item.description ?? '',
    description_fa: item.description_fa ?? '',
    instructions: Array.isArray(item.instructions) ? item.instructions : [],
    instructions_fa: Array.isArray(item.instructions_fa) ? item.instructions_fa : [],
    video: item.video ?? null,
    images: Array.isArray(item.images) ? item.images : [],
    aliases: Array.isArray(item.aliases) ? item.aliases : [],
    variation_on: Array.isArray(item.variation_on) ? item.variation_on : [],
  }));
};