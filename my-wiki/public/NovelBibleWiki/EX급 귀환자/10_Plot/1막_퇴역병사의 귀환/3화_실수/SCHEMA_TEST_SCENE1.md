---
type: scene
chapter: 3
scene: 1
title: "악몽, 그리고 기일"
summary: "진우는 꿈속에서 과거 '그린 헬' 시절의 동료들, 특히 '천무진'과 재회한다. 하지만 따뜻했던 기억은 이내 끔찍한 시체로 변하는 악몽으로 바뀐다. 식은땀을 흘리며 고시원 바닥에서 깨어난 진우는 오늘이 어머니의 기일임을 깨닫는다."
characters:
  - 강진우
  - 천무진
  - 블랙맘바 대원들
locations:
  - 청호 고시원 (현실)

# [Graph Animation Data]
wiki-data:
  appear:
    - 천무진

  # 2. [상태 업데이트: 최종 결과값(Final State)만 기록]
  update:
    # [강진우: 꿈에서 깬 직후의 상태]
    - name: 강진우
      changes:
        role: "고시원 입실자"
        status: "기상 (Waking Up)"     # 꿈(Dreaming) -> 기상(Waking)
        location: "청호 고시원"        # 그린 헬(꿈) -> 고시원(현실)
        mental: "추모 (Memorial)"      # 어머니 기일 자각
        action: "식은땀 닦기"

    # [천무진: 악몽 속의 모습으로 기록]
    - name: 천무진
      changes:
        role: "과거의 망령 (Phantom)"
        status: "사망 (Deceased)"      # 살아있는 모습이 아닌, 죽은 상태로 확정
        affiliation: "블랙맘바 (Past)"

  # 3. [관계 업데이트]
  relations:
    # 꿈을 통해 과거의 감정이 되살아남
    - source: 강진우
      name: 천무진
      display: "지키지 못한 형 (죄책감)"
      mood: TRUST
      tense: PAST

  # 4. [퇴장]
  # 꿈에서 깼으므로 망령들은 바로 사라지는 게 맞습니다.
  # (만약 그래프에 잔상을 남기고 싶다면 이 부분을 제거하세요)
  disappear:
    - 블랙맘바 대원들 # 엑스트라들은 바로 퇴장
    # 천무진은 '비석'이나 '기억'으로 남겨둘지, 퇴장시킬지 선택 (여기선 남겨둠)
---

(본문 내용...)