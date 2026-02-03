요청하신 **`status` Enum(열거형) 제약 조건**과 **스냅샷(Snapshot) 원칙**을 완벽하게 통합한 **[StoryPlay 씬 데이터 표준 프로토콜 v1.1]**입니다.

이 내용을 복사하여 다른 LLM에게 **"System Prompt"** 또는 **"작업 지시문"**으로 제공하면, 현재 개발 중인 시스템과 100% 호환되는 데이터를 생성할 것입니다.

---

# 📜 StoryPlay 씬 데이터 표준 프로토콜 (v1.1)

**Version:** 1.1 (Updated: 2026-02-03)

**Purpose:** 웹소설 창작 도구 'StoryPlay'의 타임라인 시각화를 위한 YAML 데이터 생성 표준 정의.

---

## 1. 파일 구조 및 메타데이터 (Frontmatter)

모든 씬 파일은 Markdown(`.md`) 형식이며, 상단에 필수 YAML Frontmatter를 포함해야 합니다.

### 필수 필드 정의

|**필드명**|**타입**|**설명**|**필수**|**제약조건**|
|---|---|---|---|---|
|`type`|string|파일 유형|**Yes**|고정값: `scene`|
|`chapter`|number|소속 챕터(화) 번호|**Yes**|정수 (1, 2...)|
|`scene`|number|씬 번호|**Yes**|정수 (1, 2...)|
|`title`|string|씬 제목|**Yes**|요약된 제목|
|`summary`|string|줄거리 요약|**Yes**|1~2문장 내외|
|`characters`|list|등장인물 목록|**Yes**|이름만 나열|
|`locations`|list|등장 장소 목록|**Yes**|장소명 나열|

### 예시

YAML

- `--type: scenechapter: 3scene: 1title: "악몽, 그리고 기일"summary: "진우는 꿈속에서 죽은 동료들을 만나지만 이내 악몽으로 변하고, 식은땀을 흘리며 깨어난다."characters: 강진우 천무진locations: 청호 고시원--`

---

## 2. 그래프 애니메이션 데이터 (`wiki-data`)

`wiki-data` 키 하위에 타임라인 변화를 기록합니다.

### 2.1 등장 (`appear`)

- **설명:** 해당 씬에 **새로 등장**하거나, 화면에 보여야 할 인물/사물.
- **타입:** `string[]`

### 2.2 상태 변경 (`update`) [핵심 변경]

- **원칙:** 씬 종료 시점의 **최종 상태(Snapshot)**만 1회 기록합니다.
- **구조:** `status`는 반드시 **제어 어휘(Enum)**를 사용해야 하며, 상세 행동은 `action`에 기술합니다.

YAML

`update:

- name: "캐릭터 이름" changes: role: string # 역할 (예: 조력자, 적) - 자유 텍스트 status: Enum # [중요] 하단 제어 어휘 참조 (ALIVE, DECEASED 등) affiliation: string # 소속 (변경된 경우만) mental: string # 심리 상태 (예: 공포, 안도) - 자유 텍스트 action: string # 행동 묘사 (예: 교전, 수면, 식사) - 자유 텍스트 image: string # (옵션) 이미지 경로 변경 시`

### 2.3 관계 변경 (`relations`)

- **설명:** 인물 간의 관계 변화를 기록합니다.
- **구조:**

YAML

`relations:

- source: "주체" name: "대상" # target display: string # 관계 레이블 (예: "배신감", "신뢰") mood: Enum # FRIENDLY | HOSTILE | NEUTRAL tense: Enum # CURRENT | PAST`

### 2.4 퇴장 (`disappear`)

- **설명:** 화면(무대)에서 완전히 사라지는 경우.
- **주의:** **사망(Dead) $\neq$ 퇴장(Disappear).** 시체가 남으면 `update`(`status: DECEASED`)로 처리합니다. 장소 이동이나 완전한 소멸 시에만 사용합니다.

---

## 3. 제어 어휘 (Controlled Vocabulary) [Strict]

데이터 일관성과 UI 렌더링(아이콘, 테두리 색상)을 위해 아래 값들을 **엄격하게 준수**해야 합니다.

### A. 캐릭터 상태 (`status`) - **[NEW]**

이 필드는 자유 텍스트가 아닌, **아래 6개 값 중 하나**여야 합니다.

|**값 (Value)**|**의미**|**시각적 효과 (UI)**|**사용 예시**|
|---|---|---|---|
|**`ALIVE`**|**생존 (기본)**|기본 이미지|일상, 대화, 전투 중|
|**`DECEASED`**|**사망**|**해골 아이콘**, 흑백, 적색 테두리|사망 확인, 시체, 전리품|
|**`INJURED`**|**부상**|붉은 펄스 효과|전투 후 부상, 출혈|
|**`STUNNED`**|**기절/무력화**|흐릿함(Dimmed), 회색 테두리|수면, 기절, 포박, 제압|
|**`UNKNOWN`**|**실종/미상**|물음표 아이콘, 점선|행방불명, 잠적|
|**`ILLUSION`**|**환영/유령**|반투명, 푸른빛|꿈, 회상, 홀로그램|

### B. 관계 분위기 (`mood`)

- `FRIENDLY`: 우호, 신뢰, 사랑, 동맹
- `HOSTILE`: 적대, 증오, 살의, 경쟁
- `NEUTRAL`: 무관심, 비즈니스, 초면

### C. 관계 시점 (`tense`)

- `CURRENT`: 현재 진행 중인 관계
- `PAST`: 과거의 기억, 청산된 관계

---

## 4. 데이터 로직 규칙 (Business Logic)

1. **스택(Stack) 원칙:** 이전 씬의 상태는 별도 언급이 없으면 유지된다. 변경된 점만 `update`에 기록한다.
2. **스냅샷(Snapshot) 원칙:** 씬 중간의 과정(Process)은 기록하지 않고, 씬이 끝난 직후의 **최종 결과값(Final State)**만 기록한다.
    - _예: 잠들었다가 깼다면 -> 최종 상태인 `ALIVE`(기상)만 기록._
3. **사망 처리:** 캐릭터 사망 시 `disappear`에 넣지 않는다. `status: "DECEASED"`로 업데이트하여 '시체'로 남긴다.
4. **장소 이동:** 씬 내에서 장소가 완전히 바뀌면, 이전 장소의 인물들은 `disappear` 처리한다.

---

## 5. LLM 입력용 프롬프트 템플릿

작업 요청 시 아래 블록을 복사해서 붙여넣으세요.

Markdown

`# Role You are a 'Scene Data Architect' for a web novel visualization tool. Your task is to extract event data from the provided novel text and format it into a specific YAML structure.

# Constraints & Rules (Strict)

1. **Output Format**: Strictly use valid YAML inside a markdown code block.
2. **Metadata**: Ensure `type: scene`, `chapter`, and `scene` fields are correct integers.
3. **Status Enum (Crucial)**:
    - The `status` field inside `update` MUST be one of: [`ALIVE`, `DECEASED`, `INJURED`, `STUNNED`, `UNKNOWN`, `ILLUSION`].
    - Do NOT use free text in `status`. Put descriptions in `action` or `mental`.
4. **Logic**:
    - **Death**: If a character dies, use `update` with `status: "DECEASED"`. DO NOT use `disappear`.
    - **Snapshot**: Record only the _final state_ of the character at the end of the scene.
    - **Disappear**: Use only when characters leave the location physically.

# Schema Example

---

type: scene chapter: <number> scene: <number> title: "<Title>" summary: "<Summary>" characters: ["Name1", "Name2"] locations: ["Location Name"] wiki-data: appear: ["Name1"] disappear: ["Name3"] update: - name: "Name1" changes: status: "ALIVE" # Must be Enum role: "Ally" action: "Waking up" # Free text description mental: "Relief" relations: - source: "Name1" name: "Name2" display: "Trust" mood: FRIENDLY tense: CURRENT ---`