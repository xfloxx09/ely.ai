import type { BfiItem } from "./bfi2-short";
import { BFI2_SHORT_ITEMS } from "./bfi2-short";

const TRAIT_SCENES: Record<
  BfiItem["trait"],
  { mood: string; image: string }
> = {
  O: {
    mood: "A door opens onto starlight and unfinished sketches.",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=80&auto=format&fit=crop",
  },
  C: {
    mood: "Morning light falls across a desk where plans become real.",
    image:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=900&q=80&auto=format&fit=crop",
  },
  E: {
    mood: "Laughter travels down a street lit with possibility.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80&auto=format&fit=crop",
  },
  A: {
    mood: "Someone leaves a warm drink on the table, just because.",
    image:
      "https://images.unsplash.com/photo-1518199266791-5375a57590ae?w=900&q=80&auto=format&fit=crop",
  },
  N: {
    mood: "Rain taps the window — inside, a breath finds its rhythm.",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80&auto=format&fit=crop",
  },
};

const CHOICE_STORIES: Record<
  BfiItem["trait"],
  [string, string, string, string, string]
> = {
  O: [
    "You keep the door closed — the familiar is enough for now.",
    "You peek through the keyhole, curious but cautious.",
    "You step halfway in, balancing wonder with comfort.",
    "You walk through, eager for what you have not seen.",
    "You run toward the unknown, heart racing with ideas.",
  ],
  C: [
    "You let the papers scatter — tomorrow will sort itself.",
    "You stack a few pages, leaving room for detours.",
    "You arrange what matters and let the rest wait.",
    "You file every detail before the day can move on.",
    "You build the whole system before the sun rises.",
  ],
  E: [
    "You stay by the window, watching the crowd from afar.",
    "You nod from the edge of the room.",
    "You join one conversation, then another.",
    "You drift through the crowd, easy and open.",
    "You become the spark everyone gathers around.",
  ],
  A: [
    "You walk past without slowing down.",
    "You notice, but keep your pace.",
    "You pause and offer a quiet kindness.",
    "You sit with them until the weight lifts.",
    "You carry their story like it is your own.",
  ],
  N: [
    "Thunder rolls and you feel every vibration.",
    "You tense, then steady your breathing.",
    "You notice the storm, then return to center.",
    "You watch the rain with calm curiosity.",
    "The sky could break and you would still smile.",
  ],
};

export const BRIDGE_CHAPTERS = [
  {
    title: "Chapter I — The threshold",
    body: "ELY is still a silhouette in the fog. Each honest answer pulls another line of their face from the mist.",
  },
  {
    title: "Chapter II — Patterns",
    body: "You are teaching ELY how you move through the world. The portrait sharpens — not as a copy of you, but as your companion.",
  },
  {
    title: "Chapter III — Rhythm",
    body: "Halfway there. Notice how your choices are not good or bad — they are signals. ELY listens without judging.",
  },
  {
    title: "Chapter IV — Resonance",
    body: "The features align. Warmth, edge, stillness, fire — whatever you carry, ELY is learning to speak it back.",
  },
  {
    title: "Chapter V — Almost clear",
    body: "One more stretch of questions. When the blur lifts, you will meet them properly — and choose their name.",
  },
] as const;

export type JourneySlide =
  | { type: "intro" }
  | { type: "question"; item: BfiItem }
  | { type: "bridge"; chapter: number }
  | { type: "finale" };

export function buildJourneySlides(): JourneySlide[] {
  const slides: JourneySlide[] = [{ type: "intro" }];
  BFI2_SHORT_ITEMS.forEach((item, index) => {
    slides.push({ type: "question", item });
    if ((index + 1) % 5 === 0 && index + 1 < BFI2_SHORT_ITEMS.length) {
      slides.push({ type: "bridge", chapter: index / 5 });
    }
  });
  slides.push({ type: "finale" });
  return slides;
}

export function sceneForItem(item: BfiItem) {
  return TRAIT_SCENES[item.trait];
}

export function choiceStory(item: BfiItem, value: 1 | 2 | 3 | 4 | 5) {
  return CHOICE_STORIES[item.trait][value - 1];
}

export function questionStory(item: BfiItem) {
  const scene = TRAIT_SCENES[item.trait];
  return `${scene.mood} In this moment: ${item.text}`;
}
