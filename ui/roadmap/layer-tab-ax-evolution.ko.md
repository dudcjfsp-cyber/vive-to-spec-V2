# Layer Tab AX Evolution Record

- Date: 2026-02-26
- Scope: `[레이어 탭]` 변화 기록
- Non-Scope: 전체 코드 구조/폴더 구조 개편 논의

## 1) 기록 목적
이 문서는 Vibe-to-Spec의 L1~L5를 AX(Agentic Experience) 방향으로 강화할 때,
기존 레이어 탭이 사용자 관점에서 어떻게 바뀌는지 별도로 기록하기 위한 문서다.

핵심 원칙:
1. 비전공자/초보자는 "진단 결과"보다 "다음 행동"을 먼저 본다.
2. 레이어 탭은 문서 뷰가 아니라 "수정 가능한 작동 상태 뷰"가 된다.
3. AI는 선제 가설을 제시하고, 사용자는 확인/수정 중심으로 상호작용한다.

## 2) 기존 레이어 탭 (Baseline)
1. L1 Problem Interview
- 사용자 입력 중심(누가/언제/무엇/왜/성공기준)
- 추가 질문 3개 제공

2. L2 Spec Structuring
- 역할, 기능, 5단계 흐름, 입력 필드, 권한 정의

3. L3 Request Conversion
- short/standard/detailed 요청문 생성

4. L4 Execution Validation
- 완성도 점수, 누락 경고, 영향도 미리보기

5. L5 Learning/Action
- 오늘 할 일 3가지 제시

## 3) AX 강화 후 레이어 탭 (Target)
1. L1 Intent Extractor
- 자동 완성형 인터뷰: 한 문장에서 누락 칸을 AI가 가설로 선제시
- 사용자 액션: "새로 쓰기"보다 "수정/확정"
- 탭의 기본 CTA: `가설 확정`

2. L2 Logic Mapper
- 텍스트/DB/API/UI를 동시 생성하고 상호 연동
- 한 축 변경 시 관련 축 동기화 제안
- 탭의 기본 CTA: `연동 반영`

3. L3 Context Optimizer
- 동일 의미를 수신자별 포맷으로 재구성
  - 개발자용(엄격 타입)
  - 비전공자용(행동/비유)
  - AI 코딩용(실행 프롬프트)
- 탭의 기본 CTA: `대상별 내보내기`

4. L4 Integrity Simulator
- 3중 상호 참조 검증
  - Data-Flow Alignment
  - Permission-Action Conflict
  - Intent-Spec Coherence
- 탭의 기본 CTA: `자동 보정 제안 적용`

5. L5 Action Binder
- 실행 단계 직결 산출물 제공(v0/Cursor 투입형 코드 파편)
- L4 게이트 상태에 따라 진입 제어
- 탭의 기본 CTA: `실행 팩 생성`

## 4) 레이어 탭 UX 변화 (사용자 체감)
1. Before: "탭에서 읽고 복사"
2. After: "탭에서 확인/수정/적용"

1. Before: 점수 중심 피드백
2. After: 행동 중심 피드백

1. Before: 레이어 간 단방향
2. After: 레이어 간 영향 전파(변경 시 연쇄 안내)

## 5) AX 운영 원칙 (레이어 탭 한정)
1. 기술 에러명은 숨기고 사용자 행동 문장을 먼저 보여준다.
- 예: "정합성 오류" 대신 "이 정보를 입력받는 단계가 빠져 있어요."

2. 경고는 최대 3개만 우선 노출한다.
- 나머지는 "자세히 보기"에서 확장한다.

3. 모든 경고에는 즉시 선택 가능한 수정 액션 1~2개를 붙인다.

4. 권한/삭제/보안 관련 자동 수정은 사용자 승인 없이는 적용하지 않는다.

5. L4 상태가 `blocked`이면 L5 탭의 실행 CTA를 비활성화한다.

## 6) 기존->신규 레이어 매핑표
| Baseline Layer | AX Layer | 변화 핵심 |
| --- | --- | --- |
| L1 Problem Interview | L1 Intent Extractor | 입력형 -> 가설 확정형 |
| L2 Spec Structuring | L2 Logic Mapper | 단일 문서 -> 동기화 스펙 맵 |
| L3 Request Conversion | L3 Context Optimizer | 단순 변환 -> 수신자별 인코딩 |
| L4 Execution Validation | L4 Integrity Simulator | 점수 -> 충돌 탐지/보정 |
| L5 Learning/Action | L5 Action Binder | 가이드 -> 실행 팩 |

## 7) 완료 정의 (Layer Tab 기준)
다음 조건을 만족하면 레이어 탭 AX 전환이 적용된 것으로 본다.

1. 각 레이어 탭에 기본 CTA가 존재한다.
2. L1은 가설 제시 -> 사용자 확정 흐름을 가진다.
3. L2는 변경 연동 영향 안내를 제공한다.
4. L3는 최소 3개 대상(개발자/비전공자/AI코딩) 출력을 제공한다.
5. L4는 충돌 탐지 + 자동 보정 제안을 제공한다.
6. L5는 L4 게이트 상태에 따라 실행 가능 여부가 제어된다.

