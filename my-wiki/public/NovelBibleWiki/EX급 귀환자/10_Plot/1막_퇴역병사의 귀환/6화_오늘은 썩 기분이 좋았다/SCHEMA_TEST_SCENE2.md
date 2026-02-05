---
type: scene
chapter: 6
scene: 2
title: "설원 위의 강철 요새"
summary: "진우는 아이들과 놀아주며 '지키는 감각'을 배우고, 서준은 이능으로 진우의 내면(설원과 요새)을 훔쳐보다 들켜 경고를 받는다."
characters: 
  - 강진우
  - 윤서준
  - 아이들
locations: 
  - 해와 달 보육원 (놀이터)
wiki-data:
  appear: 
    - 강진우
    - 윤서준
    - 아이들
  update:
    - name: "강진우"
      changes:
        role: "수호자 (Mental Fortress)"
        status: "ALIVE"
        mental: "경계 (Boundaries), 낯선 충만감"
        action: "흙 묻은 옷을 털며 서준에게 이능 사용 금지를 경고함"
        affiliation: "더 레스트 (방문객)"
    - name: "윤서준"
      changes:
        role: "관찰자 (Mental Intruder)"
        status: "ALIVE"
        mental: "경외감, 긴장 (식은땀)"
        action: "안경을 고쳐 쓰며 당황함을 숨기려 애씀"
        affiliation: "더 레스트"
    - name: "아이들"
      changes:
        role: "보호 대상"
        status: "ALIVE"
        mental: "안도, 즐거움"
        action: "진우에게 호감을 느낌"
  relations:
    - source: "강진우"
      name: "윤서준"
      display: "선 넘지 마시오 (경고)"
      mood: NEUTRAL
      tense: CURRENT
    - source: "윤서준"
      name: "강진우"
      display: "규격 외의 거물 (경외)"
      mood: NEUTRAL
      tense: CURRENT
    - source: "강진우"
      name: "아이들"
      display: "지켜야 할 존재"
      mood: FRIENDLY
      tense: CURRENT
---