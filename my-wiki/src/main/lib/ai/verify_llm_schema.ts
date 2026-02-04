
import { generateSceneAnalysisPrompt } from './promptBuilder';
import { SCENE_DATA_JSON_SCHEMA } from './geminiSchema';

const sampleText = "강진우는 피를 흘리며 쓰러졌다. 그의 눈앞에 에레보스가 나타났다.";

console.log('--- Testing JSON Schema ---');
console.log(JSON.stringify(SCENE_DATA_JSON_SCHEMA, null, 2));

console.log('\n--- Testing Prompt Generation ---');
const prompt = generateSceneAnalysisPrompt(sampleText);
console.log(prompt);

if (prompt.includes('ALIVE') && prompt.includes('DECEASED')) {
    console.log('\n[PASS] Status Enums found in prompt.');
} else {
    console.error('\n[FAIL] Status Enums MISSING in prompt.');
}

if (prompt.includes(sampleText)) {
    console.log('[PASS] Input text found in prompt.');
} else {
    console.error('[FAIL] Input text MISSING in prompt.');
}
