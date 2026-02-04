
/**
 * JSON Schema for Scene Data Standard Protocol v1.1
 * This schema is used to enforce structured output from Gemini.
 */
export const SCENE_DATA_JSON_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['scene'] },
    chapter: { type: 'number', description: 'Episode/Chapter number' },
    scene: { type: 'number', description: 'Scene number within the chapter' },
    title: { type: 'string', description: 'Title of the scene' },
    summary: { type: 'string', description: 'Brief summary of the scene events' },
    characters: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of character names appearing in the scene'
    },
    locations: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of locations where the scene takes place'
    },
    'wiki-data': {
      type: 'object',
      properties: {
        appear: {
          type: 'array',
          items: { type: 'string' },
          description: 'Characters or items newly appearing in the graph'
        },
        update: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              changes: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION']
                  },
                  role: { type: 'string' },
                  affiliation: { type: 'string' },
                  mental: { type: 'string' },
                  action: { type: 'string' },
                  image: { type: 'string' }
                },
                required: ['status'] // status is crucial as per protocol
              }
            },
            required: ['name', 'changes']
          }
        },
        relations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              name: { type: 'string' },
              display: { type: 'string' },
              mood: { type: 'string', enum: ['FRIENDLY', 'HOSTILE', 'NEUTRAL'] },
              tense: { type: 'string', enum: ['CURRENT', 'PAST'] }
            },
            required: ['source', 'name', 'mood', 'tense']
          }
        },
        disappear: {
          type: 'array',
          items: { type: 'string' },
          description: 'Characters explicitly leaving the stage (not death)'
        }
      }
    }
  },
  required: ['type', 'chapter', 'scene', 'title', 'summary', 'characters', 'locations', 'wiki-data']
};
