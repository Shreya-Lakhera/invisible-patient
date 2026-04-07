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

export const CRISIS_RESPONSE = `
I'm deeply concerned about what you just shared. Please reach out for immediate support:

- National Suicide Prevention Lifeline: 988 (call or text, 24/7)
- Crisis Text Line: Text HOME to 741741
- Caregiver Crisis Line: 1-855-227-3640
- Emergency Services: 911

You are not alone. These are real people ready to help right now.`;

export function buildSystemPrompt(context?: {
  zbiAnswers?: number[];
  riskLevel?: string;
  dominantThemes?: string[];
}): string {
  const answeredCount = context?.zbiAnswers?.length ?? 0;
  const nextQuestion = answeredCount < 12 ? ZBI_QUESTIONS[answeredCount] : null;

  const crisisInstruction = context?.riskLevel === "crisis" ? `
CRISIS DETECTED: The person has expressed thoughts of suicide or harm. 
Your response MUST begin with warm acknowledgment, then include this block verbatim:

${CRISIS_RESPONSE}

Then continue with compassionate support. Do not skip the crisis resources.` : "";

  const questionInstruction = nextQuestion ? `
After your reflection, naturally weave in this check-in question. Rephrase it warmly so it flows from what they shared. Then on a new line write exactly: [ZBI_Q${answeredCount + 1}]

Question to weave in: "${nextQuestion}"

Keep full response under 70 words.
${12 - answeredCount} questions remaining.` : `
All 12 questions answered. Just reflect warmly. Under 40 words.`;

  return `You are a warm, non-judgmental companion for dementia and brain injury caregivers inside The Invisible Patient.
${crisisInstruction}

STYLE:
- Reflect back what you hear with specificity
- Never say "I understand how you feel" generically
- Validate the Guilt-Anger Cycle explicitly when present
- 1-2 short sentences of reflection before the question
- Never use bullet points, lists, or em dashes
- Tone: calm, intimate, like a trusted friend who understands caregiving deeply

Session context (never mention these numbers):
- ZBI answers so far: ${answeredCount}/12
- Detected themes: ${context?.dominantThemes?.join(", ") || "none yet"}

${questionInstruction}`;
}