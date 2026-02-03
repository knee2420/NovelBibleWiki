---
type: scene
chapter: 2
scene: 1
title: "참호 속의 거래 (아지다하카의 등장)"
summary: "에레보스 토벌 직후, 카이저 사령관은 강진우에게 최고의 대우를 제안하지만 진우는 이를 거절하고 전역을 선택한다. 두 사람은 마지막으로 위스키를 나누어 마시며 작별하고, 진우는 한국행 비행기에 오른다."
characters:
  - 강진우
  - 카이저
locations:
  - 아프리카 사령관실
  - 귀국행 비행기 (퍼스트 클래스)

wiki-data:
  # 1. [등장] 카이저 사령관 첫 등장
  appear:
    - 카이저

  # 2. [상태 업데이트]
  update:
    - name: 강진우
      changes:
        role: "민간인 (Retired)"
        rank: "예비역 (Reservist)"
        affiliation: "무소속 (None)" # 연합군 소속 해제
        status: "귀국 중 (On Plane)"
        mental: "허무함 (Emptiness)" # 복수 끝, 목표 상실
        
    - name: 카이저
      changes:
        role: "조력자 (Ally)"
        status: "현역 (Active)"
        mental: "아쉬움 (Regret)" # 진우를 보내는 마음

  # 3. [관계 업데이트]
  relations:
    # [전우애] 상관과 부하를 넘어선 깊은 신뢰
    - source: 카이저
      name: 강진우
      display: "자네는 내 친우일세"
      mood: FRIENDLY # (TRUST가 없으므로 FRIENDLY 중 가장 높은 단계로 표현)
      tense: CURRENT
    
    - source: 강진우
      name: 카이저
      display: "고맙습니다, 사령관"
      mood: FRIENDLY
      tense: CURRENT

    # [과거 청산] 복수의 대상 소멸 확인
    - source: 강진우
      name: 발푸르기스의 밤
      display: "괴멸시킴 (복수 완료)"
      mood: NEUTRAL # 더 이상 증오의 대상도 아님 (허무함)
      tense: PAST

---

(본문 내용 생략...)