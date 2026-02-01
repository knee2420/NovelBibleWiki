// 플롯(스토리보드) 전용 타입 정의
export interface SceneCard {
  id: string // 파일 절대 경로
  fileName: string // 파일명 (예: 01_가짜영웅들의몰락.md)
  sceneNumber: number // 씬 번호
  title: string // 씬 제목 (Front-matter의 title)
  summary: string // 요약 (Front-matter의 summary)
  characters: string[] // 등장인물 태그
  isScripted: boolean // 본문 작성 여부
}

export interface ChapterColumn {
  id: string // 챕터 폴더 경로
  chapterNumber: number // 화 번호 (1화...)
  title: string // 챕터 제목
  scenes: SceneCard[] // 해당 화에 속한 씬들
}

export interface ActBoard {
  id: string
  path: string
  actNumber: number // 막 번호 (1막...)
  title: string // 막 제목
  chapters: ChapterColumn[]
}
