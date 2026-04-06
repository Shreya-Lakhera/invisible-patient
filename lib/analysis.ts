import type { MentalState, RiskLevel } from "./store";

const ZBI_CLUSTERS = {
  timeDeprivation:   ["no time","never have time","can't rest","always on","no break","around the clock","24/7","constant","never sleep","can't sleep"],
  socialIsolation:   ["alone","isolated","lonely","no one understands","no friends","can't go out","stuck at home","no life","disconnected","cut off"],
  guiltyAnger:       ["angry at him","angry at her","hate myself","feel guilty","guilt","bad person","shouldn't feel","hate being angry","ashamed","monster","awful person"],
  lossOfSelf:        ["lost myself","lost my identity","don't know who i am","used to be","forgot what i like","given up everything","nothing left for me","invisible"],
  financialStress:   ["can't afford","money","financial","bills","debt","expensive","broke","no money","insurance"],
  relationshipStrain:["family doesn't help","no support","doing it alone","all on me","burden","no one helps"],
};

const CRISIS_KEYWORDS = [
  "want to die","don't want to be here","better off dead","end it","can't go on","no reason to live","suicide"
];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

export interface AnalysisResult {
  mentalState: MentalState;
  zbiEstimate: number;
  zbiAnswers: number[];
  emotions: string[];
  riskLevel: RiskLevel;
  dominantThemes: string[];
  hasCrisisSignals: boolean;
}

export function analyzeConversation(
  messages: { role: string; content: string }[],
  zbiAnswers: number[] = []
): AnalysisResult {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  const zbiScores = {
    timeDeprivation:   countMatches(userText, ZBI_CLUSTERS.timeDeprivation) * 6,
    socialIsolation:   countMatches(userText, ZBI_CLUSTERS.socialIsolation) * 7,
    guiltyAnger:       countMatches(userText, ZBI_CLUSTERS.guiltyAnger) * 8,
    lossOfSelf:        countMatches(userText, ZBI_CLUSTERS.lossOfSelf) * 7,
    financialStress:   countMatches(userText, ZBI_CLUSTERS.financialStress) * 5,
    relationshipStrain:countMatches(userText, ZBI_CLUSTERS.relationshipStrain) * 5,
  };

  const zbiEstimate = zbiAnswers.length > 0
    ? Math.round((zbiAnswers.reduce((a, b) => a + b, 0) / (zbiAnswers.length * 4)) * 48)
    : Math.min(48, Object.values(zbiScores).reduce((a, b) => a + b, 0));

  const hasCrisisSignals = countMatches(userText, CRISIS_KEYWORDS) > 0;

  const dominantThemes: string[] = [];
  if (zbiScores.guiltyAnger >= 8)     dominantThemes.push("Guilt-Anger Cycle");
  if (zbiScores.lossOfSelf >= 7)      dominantThemes.push("Identity Loss");
  if (zbiScores.socialIsolation >= 7) dominantThemes.push("Social Isolation");
  if (zbiScores.timeDeprivation >= 6) dominantThemes.push("Time Deprivation");
  if (zbiScores.financialStress >= 5) dominantThemes.push("Financial Stress");

  const lower = userText.toLowerCase();
  const emotions: string[] = [];
  if (lower.match(/\bangry?\b|\bfurious\b/))  emotions.push("anger");
  if (lower.match(/\bguilty?\b|\bashamed\b/)) emotions.push("guilt");
  if (lower.match(/\btired\b|\bexhausted\b/)) emotions.push("exhaustion");
  if (lower.match(/\blonely\b|\balone\b/))    emotions.push("isolation");
  if (lower.match(/\bhopeless\b/))            emotions.push("hopelessness");
  if (lower.match(/\banxious\b|\bworried\b/)) emotions.push("anxiety");
  if (lower.match(/\bsad\b|\bcrying\b/))      emotions.push("sadness");
  if (lower.match(/\bproud\b|\bgrateful\b/))  emotions.push("pride");
  if (lower.match(/\boverwhelmed\b/))         emotions.push("overwhelm");
  if (lower.match(/\bfrustrat/))              emotions.push("frustration");
  if (lower.match(/\bhelpless\b/))            emotions.push("helplessness");

  let riskLevel: RiskLevel = "low";
  if (hasCrisisSignals)       riskLevel = "crisis";
  else if (zbiEstimate >= 60) riskLevel = "high";
  else if (zbiEstimate >= 40) riskLevel = "moderate";

  const positiveCount = countMatches(userText, ["proud","managed","grateful","laughed","hopeful","better","strength"]);

  let mentalState: MentalState = "calm";
  if (hasCrisisSignals)                    mentalState = "overwhelmed";
  else if (zbiScores.guiltyAnger >= 8)     mentalState = "anxious";
  else if (zbiScores.socialIsolation >= 7) mentalState = "restless";
  else if (zbiScores.timeDeprivation >= 6) mentalState = "tired";
  else if (positiveCount >= 2)             mentalState = "hopeful";
  else if (zbiEstimate > 10)               mentalState = "restless";

  return {
    mentalState,
    zbiEstimate,
    zbiAnswers,
    emotions,
    riskLevel,
    dominantThemes,
    hasCrisisSignals,
  };
}