import { SceneSchema } from '../../../shared/types/scene-schema'

// Mock delay to simulate network request
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockAIService = {
  // 1. Single Scene Analysis
  analyzeScene: async (text: string): Promise<Partial<SceneSchema>> => {
    await delay(1500) // Simulate processing time

    // Return dummy data based on schema
    return {
      title: '참호 속의 거래 (아지다하카의 등장)',
      summary: '전장이 붕괴되는 가운데 카이저가 강진우에게 에레보스 처치를 의뢰하고, 진우는 전역을 조건으로 이를 수락함.',
      characters: ['강진우', '카이저', '에레보스'],
      locations: ['참호 (검은 사막)'],
      tags: ['거래', '전쟁', '각성'],
      'wiki-data': {
        appear: ['강진우', '카이저', 'MK-3 (장비)', '무광 단검 (아이템)'],
        update: [
          { 
              name: '강진우', 
              changes: { 
                  rank: '병장 (Sergeant)', 
                  code: '고스트 (Ghost)', 
                  alias: '아지다하카', 
                  status: 'ALIVE',
                  action: '참전 (Mission Accept)'
              } 
          },
          { 
              name: '카이저', 
              changes: { 
                  role: '총사령관 (Commander)', 
                  status: 'ALIVE', 
                  mental: '분노 (Angry)' 
              } 
          }
        ],
        relations: [
          { source: '강진우', name: '카이저', display: '의뢰인 (전역 약속)', mood: 'FRIENDLY', tense: 'CURRENT' },
          { source: '강진우', name: 'MK-3', display: '착용 중', mood: 'NEUTRAL', tense: 'CURRENT' },
          { source: '강진우', name: '에레보스', display: '사살 대상', mood: 'HOSTILE', tense: 'CURRENT' }
        ]
      }
    }
  },

  // 2. Bulk (Chapter/Scene) Structure Parsing
  parseStructure: async (fullText: string) => {
    await delay(2000)

    // Simple heuristic: split by "제N화" or "***"
    // This is just a mock, so we return fixed structure for demo
    return [
      {
        chapterNumber: 1,
        title: '귀환, 그리고 시작',
        scenes: [
          {
            sceneNumber: 1,
            content: '강진우가 눈을 떴다. 익숙한 천장이었다... (1화 1씬 내용)',
            title: '병원에서 눈을 뜨다'
          },
          {
            sceneNumber: 2,
            content: '의사가 들어와서 말을 건다. "괜찮으십니까?"... (1화 2씬 내용)',
            title: '의사와의 대화'
          }
        ]
      },
      {
        chapterNumber: 2,
        title: '새로운 능력',
        scenes: [
          {
            sceneNumber: 1,
            content: '그는 손을 내려다보았다. 희미한 푸른 빛이 감돌고 있었다... (2화 1씬 내용)',
            title: '상태창 확인'
          }
        ]
      }
    ]
  }
}
