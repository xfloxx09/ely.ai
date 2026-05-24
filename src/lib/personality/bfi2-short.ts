export type BfiItem = {
  id: number;
  text: string;
  trait: "O" | "C" | "E" | "A" | "N";
  reverse: boolean;
};

/** IPIP-style short form (30 items) — research-inspired, not a licensed BFI-2 reproduction */
export const BFI2_SHORT_ITEMS: BfiItem[] = [
  { id: 1, text: "I have a vivid imagination.", trait: "O", reverse: false },
  { id: 2, text: "I get chores done right away.", trait: "C", reverse: false },
  { id: 3, text: "I feel comfortable around people.", trait: "E", reverse: false },
  { id: 4, text: "I sympathize with others' feelings.", trait: "A", reverse: false },
  { id: 5, text: "I worry about things.", trait: "N", reverse: false },
  { id: 6, text: "I enjoy thinking about abstract ideas.", trait: "O", reverse: false },
  { id: 7, text: "I often forget to put things back in place.", trait: "C", reverse: true },
  { id: 8, text: "I keep in the background at parties.", trait: "E", reverse: true },
  { id: 9, text: "I am not interested in other people's problems.", trait: "A", reverse: true },
  { id: 10, text: "I am relaxed most of the time.", trait: "N", reverse: true },
  { id: 11, text: "I enjoy trying new experiences.", trait: "O", reverse: false },
  { id: 12, text: "I like order and structure.", trait: "C", reverse: false },
  { id: 13, text: "I start conversations easily.", trait: "E", reverse: false },
  { id: 14, text: "I take time for others.", trait: "A", reverse: false },
  { id: 15, text: "I get stressed out easily.", trait: "N", reverse: false },
  { id: 16, text: "I prefer variety to routine.", trait: "O", reverse: false },
  { id: 17, text: "I make plans and stick to them.", trait: "C", reverse: false },
  { id: 18, text: "I talk to many different people at events.", trait: "E", reverse: false },
  { id: 19, text: "I feel others' emotions.", trait: "A", reverse: false },
  { id: 20, text: "I get irritated quickly.", trait: "N", reverse: false },
  { id: 21, text: "I enjoy art and beauty.", trait: "O", reverse: false },
  { id: 22, text: "I am always prepared.", trait: "C", reverse: false },
  { id: 23, text: "I am the life of the party.", trait: "E", reverse: false },
  { id: 24, text: "I make people feel at ease.", trait: "A", reverse: false },
  { id: 25, text: "I often feel blue.", trait: "N", reverse: false },
  { id: 26, text: "I am curious about many things.", trait: "O", reverse: false },
  { id: 27, text: "I pay attention to details.", trait: "C", reverse: false },
  { id: 28, text: "I don't mind being the center of attention.", trait: "E", reverse: false },
  { id: 29, text: "I insult people sometimes.", trait: "A", reverse: true },
  { id: 30, text: "I seldom feel anxious.", trait: "N", reverse: true },
];

export const LIKERT_LABELS = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
] as const;
