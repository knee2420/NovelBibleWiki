---
type: scene
chapter: 6
scene: 3
title: "기분 좋은 날의 훼방꾼"
summary: "보육원에서 돌아와 평온함을 느끼던 진우는 고시원 앞을 점거한 철기 길드 패거리와 마력 역류로 괴로워하는 예린을 목격하고, 삼겹살 봉지를 든 채 그들 사이로 걸어 들어간다."
characters: 
  - 강진우
  - 한예린
  - 깡패들
locations: 
  - 청호 고시원 입구
wiki-data:
  appear: 
    - 강진우
    - 한예린
    - 깡패들
  update:
    - name: "강진우"
      changes:
        role: "귀가하는 입주민 (Intervener)"
        status: "ALIVE"
        mental: "평온함 속의 성가심"
        action: "머리에 꽃핀을 꽂고 삼겹살 봉지를 든 채 깡패들 사이를 당당하게 가로지름"
        affiliation: "청호 고시원 404호"
    - name: "한예린"
      changes:
        role: "건물주 (Critical Condition)"
        status: "INJURED"
        mental: "고통, 절박함"
        action: "식은땀을 흘리며 창백한 얼굴로 입구를 사수함"
    - name: "깡패들"
      changes:
        role: "철기 길드 하청 (Thugs)"
        status: "ALIVE"
        mental: "살기, 위협"
        action: "승합차로 입구를 막고 욕설을 퍼부으며 위협"
  relations:
    - source: "강진우"
      name: "한예린"
      display: "과거의 투영 (동질감)"
      mood: FRIENDLY
      tense: CURRENT
    - source: "깡패들"
      name: "한예린"
      display: "협박 (퇴거 요구)"
      mood: HOSTILE
      tense: CURRENT
    - source: "강진우"
      name: "깡패들"
      display: "저녁 식사의 방해꾼"
      mood: HOSTILE
      tense: CURRENT
---
