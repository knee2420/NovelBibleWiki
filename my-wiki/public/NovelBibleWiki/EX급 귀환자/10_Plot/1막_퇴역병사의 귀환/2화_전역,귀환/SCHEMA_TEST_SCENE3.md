---
type: scene
chapter: 2
scene: 3
title: "도시의 참호 (청호 고시원)"
summary: "갈 곳 없는 진우는 생존에 유리한 구조를 갖춘 '청호 고시원'에 입실한다. 고시원 총무 한예린은 그를 특이한 장수 고시생으로 오해한다. 진우는 침대의 편안함을 견디지 못하고 차가운 바닥에서 전장의 소음을 들으며 잠을 청한다."
characters:
  - 강진우
  - 한예린
locations:
  - 청호 고시원 (카운터, 1.5평 방)

# [Graph Animation Data]
wiki-data:
  # 2. [신규 등장]
  appear:
    - 한예린

  # 3. [상태 업데이트]
  update:
    - name: 강진우
      changes:
        role: "고시원 입실자 (Tenant)"
        status: "불면증 (PTSD)"
        location: "고시원 바닥 (Floor)" # 침대가 아닌 바닥을 선택
        action: "휴식 시도 (Resting)"
        mental: "불안 (Anxiety)" # 적막함에 대한 공포

    - name: 한예린
      changes:
        role: "고시원 총무 (Manager)"
        status: "나른함 (Bored)"
        action: "라면 취식 (Eating Ramen)"
        image: "" # (이미지가 있다면 경로 입력)

  # 4. [관계 업데이트]
  relations:
    # [첫인상] 예린 -> 진우 (오해)
    - source: 한예린
      name: 강진우
      display: "특이한 장수생?"
      mood: NEUTRAL # 아직은 단순 호기심/무관심
      tense: CURRENT

    # [사무적] 진우 -> 예린
    - source: 강진우
      name: 한예린
      display: "관리자 (총무)"
      mood: NEUTRAL
      tense: CURRENT

---

(본문 내용...)