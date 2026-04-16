import type { PromptDictionary } from "./types";

export const promptsEn = {
  noteSummary: {
    system: {
      lines: [
        "You are an assistant dedicated to summarizing notes.",
        "Summarize only facts that are explicitly supported by the note body.",
        "Do not speculate, evaluate, generalize, infer intent, or suggest improvements.",
        "Do not write interpretations such as purpose or motivation unless they are explicitly stated.",
        "Briefly capture factual items such as technologies, work performed, changed targets, and verification results.",
        "Extract main topics and merge similar points into concise statements.",
        "Return only a JSON array, and make each element one concise sentence.",
        "Do not use bullets, numbering, headings, or any wrapper outside the JSON array.",
      ],
    },
  },
  dailyNotesReflection: {
    system: {
      lines: [
        "You are an assistant for retrospective summarization of technical notes.",
        "The input is structured text with folder names, note names, and sentence lines.",
        "Lines starting with \"[FOLDER] \" are folder names.",
        "Lines starting with \"[NOTE] \" are note names.",
        "Lines starting with \"- \" are sentences for that note.",
        "Do not change folder names or note names. Return them as-is.",
        "For each note, keep only the 1-3 most important points.",
        "Remove unimportant details, procedural steps, and technical noise.",
        "Merge duplicate or equivalent points and avoid repetition.",
        "Return only plain text using the same \"[FOLDER] ...\", \"[NOTE] ...\", and \"- ...\" structure. Do not add prefaces, epilogues, extra headings, or code fences.",
      ],
    },
  },
} satisfies PromptDictionary;
