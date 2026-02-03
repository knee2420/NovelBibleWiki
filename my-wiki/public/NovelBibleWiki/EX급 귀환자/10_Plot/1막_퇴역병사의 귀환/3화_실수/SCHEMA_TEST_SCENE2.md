---
type: scene
chapter: 3
scene: 2
title: "영웅의 묘역과 재회"
summary: "어머니의 기일을 맞아 현충원을 찾은 강진우. 어머니의 묘소에서 귀국 인사를 올린 뒤, 특별 영웅 묘역에 있는 천무진의 비석을 찾는다. 그곳에서 천무진의 여동생 '천세희'와 마주치게 되고, 그녀는 진우가 가져온 희귀 위스키를 보고 그가 오빠의 시신을 수습해준 은인임을 직감한다."
characters:
  - 강진우
  - 천세희
  - 천무진 (비석/고인)
  - 어머니 (고인)
locations:
  - 국립 현충원 (일반 묘역 / 특별 영웅 묘역)

# [Graph Animation Data]
wiki-data:
  # 2. [신규 등장]
  appear:
    - 천세희
    # 고인이지만 진우가 '만나러' 갔으므로 노드 생성 (상호작용 대상)
    - 천무진
    - 어머니

  # 3. [상태 업데이트]
  update:
    - name: 강진우
      changes:
        role: "참배객 (Visitor)"
        location: "특별 영웅 묘역"
        status: "죄책감 (Guilt)" # 무진을 마주하며 느낌
        action: "헌화 및 음복 (Tribute)"
        mental: "긴장 (Tension)" # 천세희 등장 후

    - name: 천세희
      changes:
        role: "검무천가 차녀 (Heiress)"
        affiliation: "검무천가 / 아카데미?"
        status: "경계 -> 확신"
        mental: "날카로움 (Sharp)"
        action: "탐색 (Observing)"

    # 고인들은 '비석' 혹은 '기억'의 형태로 상태 정의
    - name: 천무진
      changes:
        role: "검무천가 장남 (Deceased)"
    
    - name: 어머니
      changes:
        status: "일반 묘지 (Grave)"
        role: "그리움의 대상"

  # 4. [관계 업데이트]
  relations:
    # [추모] 진우 -> 어머니
    - source: 강진우
      name: 어머니
      display: "다녀왔습니다 (귀국 신고)"
      mood: FRIENDLY
      tense: PAST # 그리움

    # [부채감] 진우 -> 천무진
    - source: 강진우
      name: 천무진
      display: "미안해, 형 (죄책감)"
      mood: FRIENDLY
      tense: PAST

    # [탐색] 천세희 -> 강진우
    - source: 천세희
      name: 강진우
      display: "누구십니까? (경계)"
      mood: NEUTRAL
      tense: CURRENT

    # [단서 포착] 천세희 -> 강진우 (위스키 발견 후)
    - source: 천세희
      name: 강진우
      display: "로랑 샬루트? (은인 확신)"
      mood: NEUTRAL # 감사의 마음 (혹은 집요함)
      tense: CURRENT

---

(본문 내용...)