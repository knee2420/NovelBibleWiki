---
type: scene
chapter: 4
scene: 3
title: 404호의 개입
summary: 귀갓길 골목에서 폭력배들과 싸우던 한예린이 기습을 당하려는 찰나, 강진우가 개입하여 암살자를 제압하고 그녀를 구해낸다.
characters:
  - 강진우
  - 한예린
  - 폭력배들
locations:
  - 재개발 지구 골목 (청호 고시원 인근)
wiki-data:
  appear:
    - 강진우
    - 한예린
    - 폭력배들
  disappear: []
  update:
    - name: 강진우
      changes:
        role: 해결사 (Intervener)
        status: ALIVE
        mental: 냉철함, 분석적
        action: 암살자의 손목을 꺾어 기절시키고 무심하게 서 있음
        affiliation: 청호 고시원 404호
    - name: 한예린
      changes:
        role: 고시원 총무 (Hidden Ability)
        status: ALIVE
        mental: 경악, 안도, 혼란
        action: 거친 숨을 몰아쉬며 진우를 멍하니 응시함
    - name: 폭력배들
      changes:
        role: 습격자
        status: STUNNED
        mental: 고통, 기절
        action: 관절이 꺾이거나 기절하여 전원 무력화됨
  relations:
    - source: 한예린
      name: 강진우
      display: 정체에 대한 충격
      mood: NEUTRAL
      tense: CURRENT
    - source: 강진우
      name: 한예린
      display: 실력 평가 (흥미)
      mood: NEUTRAL
      tense: CURRENT
    - source: 폭력배들
      name: 한예린
      display: 제거 대상 (실패)
      mood: HOSTILE
      tense: CURRENT
---
