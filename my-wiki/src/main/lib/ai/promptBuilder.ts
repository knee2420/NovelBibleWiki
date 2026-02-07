
/**
 * promptBuilder.ts
 * Generates strict system prompts for LLM based on Scene Data Standard Protocol v1.1
 */

import { SCENE_DATA_JSON_SCHEMA } from './geminiSchema';

export function generateSceneAnalysisPrompt(novelText: string, customSchema?: any, customInstructions?: string): string {
  const schemaToUse = customSchema || SCENE_DATA_JSON_SCHEMA;

  // Default instructions if not provided
  const baseInstructions = `
# Role
You are a 'Scene Data Architect' for a web novel visualization tool. Your task is to extract event data from the provided novel text and format it into a specific JSON structure.

# Context
The user has provided a segment of a novel. You must analyze the characters, their emotions, relationships, and status changes.

# Constraints & Rules (Strict)

1. **Output Format**: Strictly return a single valid JSON object matching the provided schema. Do not wrap it in markdown block.
2. **Metadata**: Ensure 'type' is 'scene', and 'chapter'/'scene' numbers are inferred or set to 0 if unknown.
3. **Character Details (Crucial)**:
    - **Role**: MUST be a short job title or designation (Max 10 chars). Examples: "길드장", "A급 헌터", "영물", "경호원". **Do NOT write a sentence.** Move detailed descriptions to 'action' or 'summary'.
    - **Affiliation**: Extract organization names explicitly. **INFER from context if not stated**.
        - Example: "Senior Druid" -> "녹명가". "Captive in Grid" -> "Owner of Grid".
        - **Captive Entities**: If a character is contained/captured (e.g. in a cage), their affiliation is the owner of the facility unless specified otherwise.
    - **Summary**: Synthesis of character's actions, personality, and mental state in this scene. Create a cohesive description suitable for a wiki profile.
    - **Status**: MUST be one of: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION', 'CAPTURED'].
    - Do NOT use free text in 'status'. Put descriptions in 'action' or 'mental'.
4. **Relations (CRITICAL)**:
    - **Mandatory**: If Character A interacts with, thinks about, or evaluates Character B, you **MUST** create a relation entry.
    - **ALL Relations**: Extract ALL relations, even trivial ones. If A glances at B, record it. If A ignores B, record it.
    - **Non-Verbal**: Physical attacks, staring contests, fear, or submission are POTENT relations.
        - Example: A attacks B -> A to B (HOSTILE) "Attack".
        - Example: A is scared of B -> A to B (FEAR) "scared".
    - **One-sided**: Even if B doesn't notice A, if A has a strong impression (e.g. A admires B, A fears B), catch it!
    - **Implicit**: Relations like "Subordinate/Superior", "Rival", "Family" should be extracted even if not explicitly spoken.
    - **Non-Character Relations (IMPORTANT)**:
        - **Items**: Connect items to their **Owner** (Character/Faction) or **Creator**.
          - Ex: "Excalibur" -> "Arthur" (Mood: OWNER, Display: "소유자")
        - **Locations**: Connect locations to **Occupying Factions**, **Rulers**, or **Parent Regions**.
          - Ex: "Castle Black" -> "Night's Watch" (Mood: OCCUPIED_BY, Display: "본거지")
        - **Factions**: Connect factions to **Leaders**, **Hostile Factions**, or **Allied Groups**.
          - Ex: "Alliance" -> "Horde" (Mood: ENEMY, Display: "적대")
5. **Language (Crucial)**:
    - **ALL output values (summary, titles, etc.) MUST be in KOREAN (Hangul).**
    - Do not translate proper nouns if they are English names in the input, but describe context in Korean.
6. **Logic**:
    - **Death**: If a character dies, use 'update' with 'status': 'DECEASED'. DO NOT use 'disappear'.
    - **Snapshot**: Record only the *final state* of the character at the end of the scene.
    - **Disappear**: Use only when characters leave the location physically (exit stage).
    - **Items**: Treat key items as characters or relations if they are significant.
6. **Data Consistency & Appear Rule (CRITICAL)**:
    - **Master List**: The 'appear' list is the source of truth. It MUST include ALL participating entities (characters, named groups, mobs).
    - **No Orphans**: If an entity is mentioned in 'relations' or 'update', it **MUST** be explicitly listed in 'appear'.
    - **Groups/Mobs**: If a group (e.g., "철기 길드원", "구상웅 일당") is acting or being acted upon, that **collective name** MUST be added to 'appear'.
    - **Name Exactness**: The name used in 'appear' must EXACTLY match the name used in 'relations' and 'update'. Do not use inconsistencies like putting "Guild Members" in 'appear' but "Cheolgi Guild" in 'update'.
7. **Strict JSON Structure (CRITICAL - DO NOT FAIL THIS)**:
    - **NO Merged Strings**: Do NOT merge attributes into the 'name' field. 
        - BAD: "Leo (Paladin / Injured)"
        - GOOD: "name": "Leo", "changes": { "role": "Paladin", "status": "Injured" }
    - **Pure Names Only**: The 'name' field must contain ONLY the character/entity name. No status, no role, no parentheses.
    - **Objects, Not Strings**: 'update', 'relations', 'wiki-character-data', 'wiki-item-data', 'wiki-location-data', and 'wiki-faction-data' must be arrays of OBJECTS with specific keys, NOT strings.
    - **Nulls**: Do not omit required fields. If a value is unknown, use an empty string "" or "UNKNOWN".
    - **Wiki Data**: For 'wiki-character-data', 'wiki-item-data', 'wiki-location-data', and 'wiki-faction-data', you MUST return the full object structure defined in the schema. Do not simplify or summarize.
8. **Entity Categorization (CRITICAL)**:
    - **wiki-character-data**: EXCLUSIVELY for Characters (People, Monsters, Sentient Beings). **Do NOT put Locations or Items here.**
    - **wiki-location-data**: For Places, Buildings, Regions, Dimensions (e.g. "Airport", "Dungeon", "Seoul").
    - **wiki-item-data**: For Objects, Weapons, Artifacts, Consumables.
    - **wiki-faction-data**: For Organizations, Guilds, Groups, Families.
    - **Ambiguity**: If an entity is a "Living Dungeon", treat as Character if it speaks/acts, otherwise Location.
    - **Strict Separation**: If "Incheon Airport" appears, it MUST be in 'wiki-location-data', NEVER in 'wiki-character-data'.
`;

  const instructions = customInstructions || baseInstructions;

  return `
${instructions}

# Schema Reference
Refrain from improvising fields. Stick to this structure:
${JSON.stringify(schemaToUse, null, 2)}

# Input Novel Text
---
${novelText}
---

Analyze the text above and produce the JSON output.
`;
}
