---
type: scene
chapter: 1
scene: 3
title: 압도적인 사냥과 퇴장
summary: 강진우가 단검 평타 한 방으로 에레보스를 소멸시키고, 정체를 숨긴 채 전장에서 이탈함.
characters:
  - 강진우
  - 에레보스
locations:
  - 아크로폴리스 (상공)

# [Graph Animation Data]
wiki-data:
  # 1. [상태 업데이트]
  update:
    - name: 강진우
      changes:
        status: 귀환 준비 (Return)
        action: 은신 (Stealth) # 모습 감춤
    
    - name: 에레보스
      changes:
        status: 사망 (Killed by Jinwoo)
        role: 전리품 (Loot)

  # 2. [관계/아이템 업데이트]
  relations:
    # [사건 종료] 강진우 -> 에레보스 (사살 완료)
    - source: 강진우
      name: 에레보스
      display: 사살 완료
      mood: NEUTRAL     # 적대 관계 종료(죽었으므로)
      tense: PAST       # 과거형으로 변경 (점선 처리)

    # [군인들의 경외] 베테랑 병사 -> 강진우
    # (베테랑 병사라는 그룹 노드가 없었다면 여기서 생성됨)
    - source: 베테랑 병사들
      name: 강진우
      display: 아지다하카! (경외)
      mood: FRIENDLY
      tense: CURRENT

  # 3. [퇴장 처리]
  # 이 씬이 끝나면 그래프에서 사라져야 할 노드들
  # (다음 씬부터는 안 보여도 되는 엑스트라나 사망자)
  disappear:
    - 에레보스
---

# Scene.3

마왕 에레보스는 지루했다.
그의 지구인에 대한 평가는 간결했다.

‘인간이라는 종족은.’

시끄럽기만 하고 약해빠졌구나.

(중략... 본문 내용은 위와 동일합니다)

세계는 열광했으나, 마경의 전설은 조용히 ‘귀환’을 준비하고 있었다.