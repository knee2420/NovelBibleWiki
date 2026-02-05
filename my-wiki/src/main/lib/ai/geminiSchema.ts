import { Schema, SchemaType } from '@google/generative-ai'

/**
 * JSON Schema for Scene Data Standard Protocol v1.1
 * This schema is used to enforce structured output from Gemini.
 */
export const SCENE_DATA_JSON_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, enum: ['scene'], format: 'enum' },
    chapter: { type: SchemaType.NUMBER, description: 'Episode/Chapter number' },
    scene: { type: SchemaType.NUMBER, description: 'Scene number within the chapter' },
    title: { type: SchemaType.STRING, description: 'Title of the scene' },
    summary: { type: SchemaType.STRING, description: 'Brief summary of the scene events' },
    characters: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of character names appearing in the scene'
    },
    locations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of locations where the scene takes place'
    },
    'wiki-data': {
      type: SchemaType.OBJECT,
      properties: {
        appear: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Characters or items newly appearing in the graph'
        },
        update: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              changes: {
                type: SchemaType.OBJECT,
                properties: {
                  status: {
                    type: SchemaType.STRING,
                    enum: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION'],
                    format: 'enum'
                  },
                  role: { type: SchemaType.STRING },
                  affiliation: { type: SchemaType.STRING },
                  mental: { type: SchemaType.STRING },
                  action: { type: SchemaType.STRING },
                  image: { type: SchemaType.STRING }
                },
                required: ['status'] // status is crucial as per protocol
              }
            },
            required: ['name', 'changes']
          }
        },
        relations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              source: { type: SchemaType.STRING },
              name: { type: SchemaType.STRING },
              display: { type: SchemaType.STRING },
              mood: { type: SchemaType.STRING, enum: ['FRIENDLY', 'HOSTILE', 'NEUTRAL'], format: 'enum' },
              tense: { type: SchemaType.STRING, enum: ['CURRENT', 'PAST'], format: 'enum' }
            },
            required: ['source', 'name', 'mood', 'tense']
          }
        },
        disappear: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Characters explicitly leaving the stage (not death)'
        }
      }
    }
  },
  required: ['type', 'chapter', 'scene', 'title', 'summary', 'characters', 'locations', 'wiki-data']
};
