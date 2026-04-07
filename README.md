Problem Statement (inspiration)
The moment that started this was not in a research lab. It was at our own home, at 3:00 AM, watching someone we love stand completely still in the middle of the room, not lost, exactly, but no longer quite findable. A family member had been caring for a relative with Alzheimer's for two years by then. She had stopped sleeping in full nights. She had stopped finishing sentences about herself. She had started saying "I'm fine" the way people say it when they have forgotten what "fine" actually feels like. We are a team with backgrounds in health-tech, data science, and AI. We know what data looks like and we know what burnout looks like firsthand. But we had never felt it like we felt it watching her disappear quietly, without anyone noticing, without any system designed to catch her or support her over the years.

Project Title & Summary (what it does)
She was The Invisible Patient. Nobody was measuring her. Nobody had built anything for her. That is the problem we built for.

In 2023, 11.5 million family and other caregivers of people living with Alzheimer's or other dementias provided an estimated 18.4 billion hours of unpaid care, as reported by the Alzheimer's Association . That is nearly 31 hours per caregiver per week. And 2 in 3 of those caregivers report difficulty finding resources and support for their own needs.

The neuroscience of what this does to a human brain is not soft. Chronic caregiving stress produces measurable neurological damage. Sustained cortisol elevation accelerates hippocampal atrophy, the same structure Alzheimer's attacks first. The aggregate prevalence of depression among Alzheimer's caregivers is 34%, anxiety at 43.6% (PubMed), rates significantly higher than the general population and higher than caregivers of patients with other illnesses. Spousal caregivers may experience cognitive decline themselves, and face a six-fold higher risk of developing dementia (PubMed Central). The caregiver's brain is under siege. The healthcare system, organized entirely around the diagnosed patient, does not see it happening.

The validated tools exist. The Zarit Burden Interview. Clinicians know how to measure caregiver burden. But a caregiver who has been awake since 4am is not going to open a clinical survey. The gap is not diagnostic. It is delivery. It is the fact that no one has ever made the measurement feel like care.

That is what we built.

Innovation & Differentiation
The Invisible Patient is a conversational AI mental health companion designed specifically for a caregiver’s mental health. At its surface, it is simply a conversation, a calm, empathetic presence available at 2am, during the drive home from the memory care unit, during the five quiet minutes before it starts again. It asks: “How are you doing today?” Underneath that conversation, a silent diagnostic architecture runs continuously. Every message the caregiver sends is analyzed across four linguistic dimensions that together produce a Resonance Score , our core metric for psychological coherence based on Lexical diversity (Type-Token Ratio), Mean sentence length, Elaboration ratio and Contextually-weighted sentiment. The system understands negation, irony, and emotional complexity because caregivers speak in complexity.

Simultaneously, the Zarit Burden Interview (12-item version) is administered, not as a form, not as a survey, but woven into natural conversation. The AI rephrases each clinical question as a moment of genuine human curiosity: "Caring for someone you love while the rest of life keeps moving, work, family, everything else, can feel like being pulled in all directions. How often does that tension feel overwhelming for you?" The caregiver can tap a 0–4 response button or type freely. Both are captured. The clinical assessment happens without the caregiver ever knowing they are being assessed.

We also built The Circle , a small, anonymous forum purpose built for caregivers, because isolation is its own neurological threat. Posts are anonymous by default. An AI moderator watches for crisis language and surfaces resources immediately. Every week, the AI generates a digest: "This week, caregivers in this community shared that sundowning got worse in cold weather. You are not alone." When two caregivers share the same disease stage and overlapping emotional patterns, the system quietly suggests they find each other.

Proposed Solution (how we built it)
Built with a React frontend and CSS keyframe animations. The AI companion runs on Anthropic Claude Opus via the Messages API, operating under a carefully engineered system prompt built around Reflective Validation, a therapeutic communication framework that mirrors emotions back without judgment, never offers unsolicited advice, and names patterns like the Guilt-Anger Cycle, Identity Loss, and Time Deprivation with clinical precision and human warmth.

The Resonance Score is computed client-side in TypeScript, weighted at 40% contextual sentiment ratio, 30% lexical diversity, 15% mean sentence length, and 15% elaboration ratio, producing a stable longitudinal metric that updates with every conversation. ZBI estimates and Resonance Scores are stored as check-in records across time, feeding the 7-day Resonance trend chart that makes emotional trajectory legible at a glance. The ZBI Estimate tracks caregiver burden directly, lower is better. The Resonance Score tracks linguistic and emotional wellbeing, higher is better.

Voice input runs on the Web Speech API, because some caregivers are too exhausted to type at 2am. AI responses are delivered in audio using SpeechSynthesis, slow enough to feel unhurried, warm enough to feel present.

Impact & Feasibility
The Invisible Patient addresses a massive, underserved gap in the global healthcare economy. By transforming clinical assessment into empathetic dialogue, we provide a scalable solution for the *11.5 million*caregivers.

Beneficiaries & Outcomes
The primary beneficiary is the caregiver, this can be a family member or an appointed nurse, whose neurological health is preserved through early intervention. However, the impact extends further:

For Patients: Higher quality of home-based care and a reduction in emergency incidents.

For Health Systems: A significant reduction in "Dual-Patient" crises, where a caregiver’s health collapse leads to the immediate institutionalization of the patient.

For Employers such as Hospitals: Mitigation of workforce attrition and productivity loss associated with chronic caregiving stress.

Technical Readiness & Scalability
The project is currently at TRL 6 (Technology Readiness Level). We have moved beyond research into an operational prototype featuring **Proprietary Resonance Scoring that converts linguistic markers into psychological health metrics in real-time. The healthcare system is currently blind to caregiver burnout until it reaches the point of medical emergency. We have built the first early-warning system that is technically robust enough for clinical integration and human enough for a 3:00 AM crisis.

Challenges We Ran Into
The hardest part was not the algorithm. We know how to build algorithms. The hardest part was reading our own test conversations and asking: ”Would this response have been worthy of our family member, at 3am, in that kitchen?”

We rewrote the system prompt many times. We ran the demo input "I feel like I'm failing. I'm angry at him for forgetting, and then I hate myself for being angry" and watched the AI name the Guilt-Anger Cycle. We ran it until it felt like care, not software.

The second major challenge was clinical integrity. We refused to let the system make hard diagnostic claims it could not support. The Resonance Score is not a diagnosis. The ZBI estimate is an inference. The language we use everywhere in the app reflects this precision. It does not offer a verdict.

Accomplishments That We're Proud Of
We are proud of building one of the first tools built for the "INVISIBLE PATIENT", the caregiver.

We are proud that the app never asks a caregiver to fill out a form. Not once. The entire clinical assessment, ZBI-12, sentiment mapping, linguistic analysis happens inside a conversation that feels like being heard. That is a design accomplishment as much as a technical one.

We are proud of the Resonance Score as a metric. It is not borrowed from another domain. It was designed from first principles, weighted to reflect how emotional distress actually manifests in language: narrowing, fragmentation, withdrawal. It is ours.

And we are proud that we are building to support the caregiver, at their most alone, most exhausted, most desperate version

What We Learned
The most powerful feature in brain health technology is not the model. It is the moment someone feels understood.

Every technical decision exists in service of that moment. We started with technology and arrived at humanity. We should have started with humanity. That is the lesson we will carry into everything we build next.

We also learned that clinical rigor and emotional warmth are not in tension. The most validated, precise diagnostic framework in caregiver research, the Zarit Burden Interview becomes more powerful, not less, when it is delivered with gentleness.

What's Next For The Invisible Patient
The next step is to build infrastructure that is HIPAA-ready. What we need now is a cohort of real caregivers and a six-week longitudinal study to validate the Resonance Score against gold-standard ZBI administered by clinicians. We want to know how early the system can detect deterioration. We believe the answer is, Earlier than anyone is currently catching it.

The immediate next step is a pilot with a hospital system or memory care network.

Beyond the pilot, we see three expansions:

Clinical Integration: A dashboard for care coordinators and social workers that surfaces caregiver risk scores alongside patient records. When a patient comes in for a checkup, the system can flag if their caregiver's Burden Weight has climbed significantly (e.g., 18 points in three weeks) and recommends a timely intervention.

Population-Level Insight: Across tens of thousands of caregivers, the longitudinal data The Invisible Patient generates is epidemiologically unprecedented. We aim to answer critical questions: When does caregiver burden peak in the disease progression? Which linguistic markers predict hospitalization of the caregiver? Which interventions actually reduce the score?

Language Expansion: Caregiving is a global challenge. We intend to make it available in other languages.

The caregiver has been the invisible patient for decades. We want to build the system that finally sees them.
