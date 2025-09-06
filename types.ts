
export type Category =
    | "strength"
    | "stretching"
    | "plyometrics"
    | "strongman"
    | "cardio"
    | "olympic weightlifting"
    | "crossfit"
    | "calisthenics";

export type Equipment =
    | "ez curl bar"
    | "barbell"
    | "dumbbell"
    | "gym mat"
    | "exercise ball"
    | "medicine ball"
    | "pull-up bar"
    | "bench"
    | "incline bench"
    | "kettlebell"
    | "machine"
    | "cable"
    | "bands"
    | "foam roll"
    | "other";

export type Muscle =
    | "abductors"
    | "abs"
    | "adductors"
    | "biceps"
    | "brachialis"
    | "calves"
    | "chest"
    | "forearms"
    | "glutes"
    | "hamstrings"
    | "lats"
    | "lower back"
    | "middle back"
    | "neck"
    | "quads"
    | "shoulders"
    | "soleus"
    | "traps"
    | "triceps";

export interface Exercise {
    id: number;
    name: string;
    name_en: string;
    category: Category;
    equipment: Equipment[];
    primary_muscles: Muscle[];
    secondary_muscles: Muscle[];
    description: string;
    instructions: string[];
    video: string | null;
    images: string[];
    aliases: string[];
    tips: string[];
    variation_on: string[];
}
