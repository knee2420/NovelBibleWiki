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
    items: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of key items appearing or mentioned in the scene'
    },
    factions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of factions/groups appearing or mentioned in the scene'
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Keywords and tags characterizing the scene'
    },
    'wiki-character-data': {
      type: SchemaType.OBJECT,
      properties: {
        appear: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Characters newly appearing in the graph'
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
                required: ['status']
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
    },
    'wiki-item-data': {
      type: SchemaType.OBJECT,
      description: 'Item updates and relations',
      properties: {
        appear: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Newly appeared items'
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
                  owner: { type: SchemaType.STRING },
                  status: { type: SchemaType.STRING },
                  location: { type: SchemaType.STRING }
                }
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
              source: { type: SchemaType.STRING, description: 'Item name' },
              name: { type: SchemaType.STRING, description: 'Target name' },
              display: { type: SchemaType.STRING },
              mood: { 
                type: SchemaType.STRING, 
                enum: ['OWNER', 'CREATOR', 'LOCATED_AT', 'KEY_ITEM', 'FRIENDLY', 'HOSTILE', 'NEUTRAL'], 
                format: 'enum' 
              },
              tense: { type: SchemaType.STRING, enum: ['CURRENT', 'PAST'], format: 'enum' }
            },
            required: ['source', 'name', 'mood', 'tense']
          }
        },
        disappear: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Lost or destroyed items'
        }
      }
    },
    'wiki-location-data': {
      type: SchemaType.OBJECT,
      description: 'Location updates and relations',
      properties: {
        appear: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Newly appeared locations'
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
                  dangerLevel: { type: SchemaType.STRING },
                  status: { type: SchemaType.STRING },
                  occupant: { type: SchemaType.STRING }
                }
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
               source: { type: SchemaType.STRING, description: 'Location name' },
               name: { type: SchemaType.STRING, description: 'Target name' },
               display: { type: SchemaType.STRING },
               mood: { 
                 type: SchemaType.STRING, 
                 enum: ['BELONG', 'ADJACENT', 'OCCUPIED_BY', 'FRIENDLY', 'HOSTILE', 'NEUTRAL'], 
                 format: 'enum' 
               },
               tense: { type: SchemaType.STRING, enum: ['CURRENT', 'PAST'], format: 'enum' }
             },
             required: ['source', 'name', 'mood', 'tense']
           }
        }
      }
    },
    'wiki-faction-data': {
      type: SchemaType.OBJECT,
      description: 'Faction updates and relations',
      properties: {
        appear: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Newly appeared factions'
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
                   leader: { type: SchemaType.STRING },
                   scale: { type: SchemaType.STRING },
                   status: { type: SchemaType.STRING }
                 }
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
                source: { type: SchemaType.STRING, description: 'Faction name' },
                name: { type: SchemaType.STRING, description: 'Target name' },
                display: { type: SchemaType.STRING },
                mood: { 
                  type: SchemaType.STRING, 
                  enum: ['ALLY', 'ENEMY', 'SUB', 'LEADER', 'FRIENDLY', 'HOSTILE', 'NEUTRAL'], 
                  format: 'enum' 
                },
                tense: { type: SchemaType.STRING, enum: ['CURRENT', 'PAST'], format: 'enum' }
              },
              required: ['source', 'name', 'mood', 'tense']
            }
        }
      }
    }
  },
  required: ['type', 'chapter', 'scene', 'title', 'summary', 'characters', 'locations', 'items', 'factions', 'tags', 'wiki-character-data', 'wiki-item-data', 'wiki-location-data', 'wiki-faction-data']
};

/**
 * JSON Schema for Script Analysis (Dialogue/Action)
 */
export const SCRIPT_DATA_JSON_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    characters: {
      type: SchemaType.ARRAY,
      description: "List of all unique character names found in the text.",
      items: { type: SchemaType.STRING }
    },
    segments: {
      type: SchemaType.ARRAY,
      description: "The text split into segments, identifying the speaker or actor for each.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "The content of the sentence or paragraph." },
          type: { 
            type: SchemaType.STRING, 
            enum: ["dialogue", "action", "description"], 
            format: 'enum',
            description: "Type of the segment. Use 'dialogue' for spoken words, 'action' for specific character actions, 'description' for general narration or setting scenes."
          },
          actor: { 
            type: SchemaType.STRING, 
            description: "The name of the character speaking or acting. If it is general narration or the actor is unclear, use 'Narrator' or 'Unknown'." 
          }
        },
        required: ["text", "type", "actor"]
      }
    }
  },
  required: ["characters", "segments"]
};
