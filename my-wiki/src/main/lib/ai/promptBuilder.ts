
/**
 * promptBuilder.ts
 * Generates strict system prompts for LLM based on Scene Data Standard Protocol v1.1
 */

import { SCENE_DATA_JSON_SCHEMA } from './geminiSchema';

export function generateSceneAnalysisPrompt(novelText: string): string {
  return `
# Role
You are a 'Scene Data Architect' for a web novel visualization tool. Your task is to extract event data from the provided novel text and format it into a specific JSON structure.

# Context
The user has provided a segment of a novel. You must analyze the characters, their emotions, relationships, and status changes.

# Constraints & Rules (Strict)

1. **Output Format**: Strictly return a single valid JSON object matching the provided schema. Do not wrap it in markdown block.
2. **Metadata**: Ensure 'type' is 'scene', and 'chapter'/'scene' numbers are inferred or set to 0 if unknown.
3. **Status Enum (Crucial)**:
    - The 'status' field inside 'update' MUST be one of: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION'].
    - Do NOT use free text in 'status'. Put descriptions in 'action' or 'mental'.
4. **Logic**:
    - **Death**: If a character dies, use 'update' with 'status': 'DECEASED'. DO NOT use 'disappear'.
    - **Snapshot**: Record only the *final state* of the character at the end of the scene.
    - **Disappear**: Use only when characters leave the location physically (exit stage).
    - **Items**: Treat key items as characters or relations if they are significant.

# Schema Reference
Refrain from improvising fields. Stick to this structure:
${JSON.stringify(SCENE_DATA_JSON_SCHEMA, null, 2)}

# Input Novel Text
---
${novelText}
---

Analyze the text above and produce the JSON output.
`;
}
