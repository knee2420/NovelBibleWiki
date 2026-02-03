---
type: scene
chapter: 6
scene: 1
title: "술래잡기와 은폐 엄폐"
summary: "아이들의 야유에 자존심이 상한 진우는 숨바꼭질이 시작되자, 놀이가 아닌 실전처럼 군용 은폐술을 시전하여 사라진다."
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
        role: "술래잡기 참여자 (Hider)"
        status: "ALIVE"
        mental: "승부욕, 진지함"
        action: "군용 은폐술(Stealth)을 시전하여 시야에서 사라짐"
        affiliation: "더 레스트 (방문객)"
    - name: "아이들"
      changes:
        role: "술래 (Tag)"
        status: "ALIVE"
        mental: "기대감, 흥미"
        action: "눈을 가리고 숫자를 셈"
    - name: "윤서준"
      changes:
        role: "관찰자"
        status: "ALIVE"
        mental: "즐거움, 흥미진진"
        action: "담벼락 아래에서 웃음을 참으며 관찰함"
  relations:
    - source: "강진우"
      name: "아이들"
      display: "명예 회복의 대상"
      mood: FRIENDLY
      tense: CURRENT
    - source: "아이들"
      name: "강진우"
      display: "못하는 아저씨 -> 숨은 아저씨"
      mood: FRIENDLY
      tense: CURRENT
    - source: "강진우"
      name: "윤서준"
      display: "얄미움"
      mood: NEUTRAL
      tense: CURRENT
---