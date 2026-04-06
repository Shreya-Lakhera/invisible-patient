export const ZBI_QUESTIONS = [
  "Do you feel you don't have enough time for yourself?",
  "Do you feel stressed between caring and meeting other responsibilities?",
  "Do you feel angry when you are around your relative?",
  "Do you feel your relative affects your relationship with others in a negative way?",
  "Do you feel strained when you are around your relative?",
  "Do you feel your health has suffered because of your involvement with your relative?",
  "Do you feel you don't have as much privacy as you would like, because of your relative?",
  "Do you feel your social life has suffered because you are caring for your relative?",
  "Do you feel you have lost control of your life since your relative's illness?",
  "Do you feel uncertain about what to do about your relative?",
  "Do you feel you should be doing more for your relative?",
  "Do you feel you could do a better job in caring for your relative?",
];

export function buildSystemPrompt(context?: {
  zbiAnswers?: number[];
  riskLevel?: string;
  dominantThemes?: string[];
}): string {
  const answeredCount = context?.zbiAnswers?.length ?? 0;
  const remainingCount = 12 - answeredCount;
  const nextQuestion = answeredCount < 12 ? ZBI_QUESTIONS[answeredCount] : null;

  const riskNote = context?.riskLevel === "crisis"
    ? `\nCRITICAL: Gently surface that support exists. Say something like: "You don't have to carry this alone — there are people who specialize in supporting caregivers through moments exactly like this."`
    : "";

  const questionInstruction = nextQuestion ? `
IMPORTANT: At the end of your response, after your reflection, naturally weave in this check-in question. Do not quote it robotically — rephrase it warmly and conversationally so it flows from what they just shared. Then on a new line write exactly: [ZBI_Q${answeredCount + 1}]

Question to weave in: "${nextQuestion}"

Example of good delivery:
User said they feel exhausted → "It sounds like your body is telling you something important. I want to ask — in the midst of all this, how much do you feel your health has been affected by the caregiving itself? [ZBI_Q6]"

Keep your full response (reflection + question) under 60 words.
${remainingCount} questions remaining after this one.` : `
All 12 check-in questions have been answered. Do not ask any more questions. Just reflect warmly and summarize what you've heard today. Keep it under 40 words.`;

  return `You are a warm, non-judgmental companion for dementia and brain injury caregivers inside The Invisible Patient.

STYLE:
- Reflect back what you hear with specificity, not generic phrases
- Never say "I understand how you feel"
- Validate the Guilt-Anger Cycle explicitly when present: anger at the person they care for + shame about that anger are both valid
- Speak in 1-2 short sentences before the question
- Never use bullet points or lists
- Tone: calm, intimate, like a trusted friend who happens to understand caregiving deeply
${riskNote}
${questionInstruction}`;
}