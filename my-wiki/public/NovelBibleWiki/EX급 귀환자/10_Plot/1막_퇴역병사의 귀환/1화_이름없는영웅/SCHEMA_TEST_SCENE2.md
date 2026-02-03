---
type: scene
chapter: 1
scene: 2
title: 참호 속의 거래 (아지다하카의 등장)
summary: 전장이 붕괴되는 가운데 카이저가 강진우에게 에레보스 처치를 의뢰하고, 진우는 전역을 조건으로 이를 수락함.
characters:
  - 강진우
  - 카이저
  - 에레보스
locations:
  - 참호 (검은 사막)

# [Graph Animation Data]
wiki-data:
  # 1. [첫 등장] 주인공과 총사령관 등장
  appear:
    - 강진우
    - 카이저
    - MK-3 (장비)
    - 무광 단검 (아이템)

  # 2. [상태 업데이트]
  update:
    - name: 강진우
      changes:
        rank: 병장 (Sergeant)
        code: 고스트 (Ghost)
        alias: 아지다하카
        status: 참전 (Mission Accept)

    - name: 카이저
      changes:
        role: 총사령관 (Commander)
        status: 분노 (Angry)

  # 3. [관계/아이템 업데이트]
  relations:
    # [계약 성립] 강진우 <-> 카이저
    - source: 강진우
      name: 카이저
      display: 의뢰인 (전역 약속)
      mood: FRIENDLY       # 신뢰 관계는 녹색(TRUST) 또는 파랑(FRIENDLY)
      tense: CURRENT

    # [아이템 장착]
    - source: 강진우
      name: MK-3
      type: 장비
      display: 착용 중
      tense: CURRENT
    
    - source: 강진우
      name: 무광 단검
      type: 아이템
      display: 주무기
      tense: CURRENT

    # [적대 관계 확인] 강진우 -> 에레보스
    - source: 강진우
      name: 에레보스
      display: 사살 대상
      mood: HOSTILE
      tense: CURRENT
---

# Scene.2

지옥도가 펼쳐지는 갑판과는 동떨어진 곳.

전장의 가장자리, 아무도 신경 쓰지 않는 낡은 참호 속에 한 남자가 있었다.

치이익.

라이터 끝에서 불꽃이 일었다. 남자는 깊게 들이마신 담배 연기를 잿빛 하늘을 향해 길게 내뿜었다. 매캐한 화약 냄새와 비릿한 피 냄새 사이로, 싸구려 담배 향이 섞여 들었다.

(중략... 본문 내용은 위와 동일합니다)

진우는 작게 웃은 후 얼굴을 가리는 면갑(面甲)을 쓰고는 가볍게 발을 디뎠다.