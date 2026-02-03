---
type: scene
chapter: 2
scene: 2
title: "이질적인 평화 (공항 습격과 사라진 집)"
summary: "귀국한 강진우는 평화로운 공항에서 이질감을 느낀다. 갑작스러운 게이트 균열로 그렘린 늑대가 나타나 아이를 덮치려 하자, 진우는 '압축과 발산'으로 은밀하게 마물을 처리한다. 공을 가로챈 헌터들을 뒤로하고 옛집을 찾아가지만, 재개발로 사라진 집터를 보며 갈 곳 없는 처지를 깨닫는다."
characters:
  - 강진우
  - 그렘린 늑대
  - 초보 헌터들
locations:
  - 인천국제공항 입국장
  - 강북 재개발 지구 (구 붉은 벽돌집 터)

# [Graph Animation Data]
wiki-data:
  # 1. [등장] 평화로운 공항을 찢고 나타난 불청객들
  appear:
    - 그렘린 늑대
    - 초보 헌터들
    - 겁에 질린 아이

  # 2. [상태 업데이트]
  update:
    - name: 강진우
      changes:
        role: "민간인 (Civilian)"
        status: "노숙자 (Homeless)" # 집이 사라짐을 확인
        mental: "이질감 (Dissonance)" # 전장과 평화의 괴리
        action: "은밀한 구원 (Secret Save)" # 압축과 발산 사용

    - name: 그렘린 늑대
      changes:
        status: "사망 (Instant Kill)" # 진우의 딱밤 한 대에 즉사
        role: "배경 (Background)" # 헌터들의 사진 배경이 됨

    - name: 초보 헌터들
      changes:
        status: "의기양양 (Show off)"
        action: "성과 가로채기 (Stolen Credit)"

  # 3. [관계 업데이트]
  relations:
    # [사건] 진우 -> 늑대 (보이지 않는 일격)
    - source: 강진우
      name: 그렘린 늑대
      display: "압축과 발산 (은밀한 사살)"
      mood: HOSTILE
      tense: PAST
    
    # [구원] 진우 -> 아이
    - source: 강진우
      name: 겁에 질린 아이
      display: "구해줌 (아무도 모르게)"
      mood: FRIENDLY
      tense: CURRENT

    # [가로채기] 헌터들 -> 늑대 (막타 친 척)
    - source: 초보 헌터들
      name: 그렘린 늑대
      display: "내가 잡았어! (거짓)"
      mood: HOSTILE
      tense: CURRENT

    # [무관심] 진우 -> 헌터들
    - source: 강진우
      name: 초보 헌터들
      display: "한심함 / 무관심"
      mood: NEUTRAL
      tense: CURRENT

---

(본문 내용...)