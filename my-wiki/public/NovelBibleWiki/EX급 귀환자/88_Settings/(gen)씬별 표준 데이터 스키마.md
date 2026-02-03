| **속성 (Key)** | **설명**     | **허용 값 (Enum)**                                                                                               | **시각화 (Graph View)** |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------- | -------------------- |
| **target**   | 대상 캐릭터/아이템 | (문서 파일명)                                                                                                      | 화살표가 향하는 노드          |
| **display**  | 관계 명칭      | 텍스트 (예: 주치의, 적)                                                                                               | 엣지(Edge) 위의 라벨       |
| **mood**     | 관계의 분위기    | `FRIENDLY` (우호)<br><br>  <br><br>`HOSTILE` (적대)<br><br>  <br><br>`NEUTRAL` (중립)<br><br>  <br><br>`TRUST` (신뢰) | 선 색상 (파랑/빨강/회색/녹색)   |
| **tense**    | 관계의 시점     | `CURRENT` (현재)<br><br>  <br><br>`PAST` (과거)                                                                   | 선 스타일 (실선/점선)        |
| **desc**     | (선택) 상세 설명 | 텍스트                                                                                                           | 마우스 오버 시 툴팁          |

네, 맞습니다. 데이터 마이그레이션(변환) 비용을 최소화하는 것이 가장 중요합니다.

작가님이 이미 정리해두신 **`name` (대상), `display` (표기명), `mood` (분위기), `tense` (시점)** 키워드를 그대로 살려서 **'표준 스키마'**를 확정하겠습니다. 코드 쪽에서 이 속성명을 읽도록 맞추면 됩니다.

정리해주신 속성을 반영한 **[최종 데이터 구조]**입니다.

---

### 1. 관계(Relation) 데이터 표준

기존에 작성하신 YAML의 `relations` 리스트 구조를 **100% 유지**합니다.

- **`name`**: 대상 캐릭터의 파일명 (기존 `target` 대신 사용)
- **`display`**: 그래프 선 위에 표시될 텍스트
- **`mood`**: `FRIENDLY` | `HOSTILE` | `NEUTRAL` (색상 결정)
- **`tense`**: `CURRENT` | `PAST` (선 스타일 결정)

---

### 2. 파일별 적용 예시

### A. 씬 (Scene) 파일 : "변화값(Delta) 기록용"

_여기서도 작가님의 속성명을 그대로 사용합니다._

**파일명: `1화.이름 없는 영웅.md`**

YAML

- `--type: scenechapter: 1scene: 2title: 이름 없는 영웅# ... (기본 정보) ...# [그래프 애니메이션용 변화 데이터]delta:# 1. 상태 업데이트 (Status Update)# 작가님이 쓰시는 status, rank, affiliation 등의 키를 그대로 업데이트합니다.status: name: 강진우 # 대상 (파일 주인의 name)changes: # 변경할 속성들status: "Active (PTSD)"rank: "병장 (Sergeant)"image: "./99_Assets/images/ghost_mask.png" name: 레오하르트changes:status: "부상 (Recovery)"role: "패배자"# 2. 관계 업데이트 (Relation Update)# 기존 속성명(name, display...)을 그대로 사용relations: source: 강진우 # [필수] 관계의 주체 (누가?)name: 에레보스 # [기존유지] 대상 (누구를?)display: 사살 대상 # [기존유지]mood: HOSTILE # [기존유지]tense: CURRENT # [기존유지] source: 레오하르트name: 에레보스display: 공포/패배mood: HOSTILEtense: CURRENT--`

### B. 캐릭터 (Character) 파일 : "최신 상태 스냅샷"

_작가님이 공유해주신 양식 그대로입니다. 수정할 필요 없습니다._

**파일명: `강진우.md`**

YAML

- `--name: 강진우grade: MAINrole: 주인공alias: 아지다하카 (Azhi Dahaka)affiliation: 무소속 (전 민간인)rank: 예비역 병장 / 해결사status: Active (PTSD) # 최신 상태image: ./99_Assets/images/Gemini_Generated_Image.pngtype: character# [최신화 기준 누적된 관계]relations: name: 한예린 # (기존 target 대신 name 유지)display: 러닝 메이트mood: FRIENDLYtense: CURRENT name: 카이저display: 옛 상관mood: FRIENDLYtense: PAST name: 에레보스display: 사살 대상mood: HOSTILEtense: PAST--`

---

### 3. 개발 시 수정 포인트 (개발자 노트)

이 구조를 구현하기 위해, 앞서 드린 코드에서 `Relation` 인터페이스만 아래와 같이 작가님 데이터에 맞춰 수정하면 됩니다.

**`types/wiki.ts` (수정본)**

TypeScript

`export interface Relation { name: string; // [변경] target -> name (작가님 데이터 존중) display?: string; // [유지] 관계 명칭 mood?: RelationMood; // [유지] tense?: RelationTense; // [유지] type?: string; // [유지] 아이템 등 특수 타입용 }

// 씬(Scene) 파일에서 사용할 변화값 타입 export interface SceneDelta { status?: { name: string; // 대상 캐릭터 이름 changes: Record<string, any>; // 바꿀 속성 (rank, status 등) }[]; relations?: (Relation & { source: string })[]; // source 추가 }`

이렇게 하면 **기존에 정리해두신 데이터를 단 하나도 고치지 않고**, 앞으로 작성할 Scene 파일에만 `delta` 항목을 추가하여 애니메이션을 구현할 수 있습니다.

아주 좋은 질문입니다. 관계(Relation)는 '선(Edge)'의 문제라면, 등장, 소속 변경, 아이템 획득은 **'점(Node)의 속성'** 문제입니다.

작가님의 기존 데이터 구조(`relations`에 아이템을 포함하던 방식)를 유지하면서, 가장 직관적으로 관리할 수 있는 **통합 스키마**를 제안합니다.

복잡하게 쪼개지 말고, **`delta` (변화값)** 항목 안에서 딱 3가지 카테고리로 관리하세요.

1. **`appear`**: 첫 등장 (그래프에 노드 생성)
2. **`update`**: 상태/소속/이미지 변경 (노드 정보 갱신)
3. **`relations`**: 관계/아이템 획득 및 상실 (엣지 연결/해제)

---

### [Scene 파일] Delta 표준 양식

이 코드를 복사해서 Scene 파일 템플릿으로 쓰시면 됩니다.

YAML

- `--type: scenechapter: 2scene: 1title: 전역, 귀환# ... (기본 정보) ...# [그래프 애니메이션용 변화 데이터]delta:# 1. [첫 등장] 이 화에서 그래프에 처음 나타나야 할 인물/아이템# (이전 화까지는 hidden 상태였다가, 이 화부터 visible이 됩니다)appear: 김민규 (찜질방 사장) MK-3 (강화복)# 2. [상태/소속 업데이트] 노드의 텍스트 정보를 바꿀 때update: name: 강진우changes:rank: 민간인 (Civilian) # [신분 변화] 병장 -> 민간인affiliation: 무소속 # [소속 변화] 군대 -> 무소속status: 은퇴 (Burnout) # [상태 변화] Active -> 은퇴image: "./assets/jinwoo_civilian.png" # [이미지 변화] 군복 -> 사복 name: 레오하르트changes:status: 입원 (Recovers)affiliation: 새벽의 방패 (지부장 박탈) # [소속 강등 예시]# 3. [관계/아이템 업데이트] 선을 잇거나 끊을 때# 작가님은 '아이템'도 Relation으로 관리하시므로 여기서 처리합니다.relations:# [아이템 획득] (강진우 -> 티켓 연결) source: 강진우name: 비행기 티켓type: 아이템 # 그래프 필터링용display: 귀환 티켓mood: FRIENDLY # 내 물건은 파랑(FRIENDLY) or 중립tense: CURRENT # 현재 소유 중# [아이템 소실/파괴] (강진우 -> MK-3 연결 끊기) source: 강진우name: MK-3type: 장비display: 반납 완료tense: PAST # [핵심] 소유권이 떠났으므로 PAST로 변경 (점선 처리)# [관계 변화] source: 강진우name: 김민규display: 손님과 사장mood: FRIENDLYtense: CURRENT--`

---

### 항목별 상세 가이드

### 1. 첫 등장 (`appear`)

- **기능:** 리스트에 적힌 이름의 노드를 그래프상에서 `visible: true`로 바꿉니다.
- **용도:** 1화에는 없다가 10화에 갑자기 튀어나오는 '히든 보스'나 '신규 조력자'를 처리할 때 씁니다.
- **팁:** 만약 아이템도 그래프의 '노드(Node)'로 띄우고 싶다면, 아이템 이름도 여기에 적어주세요.

### 2. 상태/소속 변경 (`update`)

- **기능:** 해당 캐릭터 노드(`name`)를 찾아가서 `changes` 안에 있는 속성만 덮어씌웁니다(Overwrite).
- **소속 변경:** `affiliation` 값을 바꾸면 됩니다.
    - 예: `affiliation: 제국군` $\rightarrow$ `affiliation: 혁명군`
- **팁:** `changes` 안의 키값(`rank`, `status` 등)은 작가님이 캐릭터 시트(`강진우.md`)에서 쓰는 키값과 동일하게 맞춰주시면 됩니다.

### 3. 아이템 획득/상실 (`relations`)

작가님은 이미 **"아이템도 강진우와의 관계(Relation)다"**라고 정의하셨습니다. 아주 훌륭한 추상화입니다. 이 규칙을 그대로 따릅니다.

- **아이템 획득 (Get):**
    - `tense: CURRENT`
    - 그래프에 **실선**으로 연결됨 (현재 가지고 있음).
- **아이템 분실/파괴/사용 (Lost/Used):**
    - `tense: PAST`
    - 그래프에 **점선**으로 남거나(기록용), 아예 관계를 삭제.
    - _추천:_ "내가 예전에 썼던 무기"라는 기록을 남기려면 `PAST`가 좋습니다.

---

### 개발 시 고려사항 (프로젝트 적용 팁)

이 구조를 코드(`RelationBoard.tsx`)에 적용할 때, **아이템 노드 처리**만 조금 신경 쓰시면 됩니다.

1. **아이템이 '노드'로 존재해야 함:**
    - `relations`에 `name: 비행기 티켓`이 있다면, 프로젝트는 `비행기 티켓.md` 파일이 없더라도 **가상의 노드(Virtual Node)**를 생성해서 강진우 옆에 띄워줘야 합니다.
    - 안 그러면 "비행기 티켓 파일이 없는데요?" 하고 에러가 날 수 있습니다.
2. **타입 구분:**
    - `type: 아이템` 속성을 활용해, 아이템 노드는 캐릭터 노드보다 조금 **작게(Small size)** 그리거나 **모양을 다르게(Square/Icon)** 그리면 시각적으로 구분이 확 됩니다.

이 방식이면 **씬 파일 하나만 수정**해도, 화수별로 **[누가 등장했는지 / 상태가 어떤지 / 무슨 템을 꼈는지]** 완벽하게 재생할 수 있습니다.