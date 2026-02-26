# Vibe-to-Spec V2
Repository: https://github.com/dudcjfsp-cyber/vive-to-spec-V2
Status: Bootstrap (Core migration prep)
Version: 0.1.0-alpha
Updated: 2026-02-26

## 한 줄 정의
Vibe-to-Spec V2는 비전공자의 막연한 요구를 실행 가능한 스펙으로 안전하게 변환하는 경량 엔진입니다.

## 누가/왜 쓰는지
- 누가: 비전공 PM, 1인 창업자, 주니어 개발자, 초기 제품팀
- 왜: 요구사항 누락/모호성/권한 실수를 줄이고 개발 핸드오프 품질을 높이기 위해

## V1과 차이
- V1: 단일 UI 중심 구조 (`App.jsx` 대형 파일 + lib 결합)
- V2: 코어 로직 분리 구조 (`/engine`, `/packs`, `/adapters`, `/ui`)
- V1: UI와 도메인 로직 결합
- V2: 엔진/데이터팩/어댑터 경계 고정으로 백엔드 전환 용이

## 데모/스크린샷
- Demo: 준비 중
- Screenshots: 준비 중 (`/docs/screenshots` 예정)

## 로드맵
1. Core extraction: V1 핵심 로직 분리 이관
2. Engine split: graph/validation/artifacts 세분화
3. Adapter hardening: 브라우저 직접 호출 -> 서버 프록시 전환 준비
4. UI rebuild: 질문 흐름/로드맵 UI를 컴포넌트 단위로 재구성
5. Quality gate: 회귀 테스트 + 오류 UX 표준화

## V2 초기 폴더 구조(추천)
```text
/engine
  /graph        # 그래프 실행/오케스트레이션
  /validation   # 출력 스키마 정규화/검증
  /state        # 세션 상태 모델(SpecState)
/packs
  /question-pack # 질문 팩 + 추론 규칙
  /terms         # 용어 사전 데이터
  /coaching      # 코칭 메시지/가이드 데이터
/ui
  /roadmap       # 진행 로드맵 UI 자산
  /questions     # 질문 컴포넌트
/adapters
  LLMAdapter.js  # 앱이 호출하는 단일 LLM 경계
  /providers     # provider별 구현(차후 분리)
```

## Local Development
```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Build check:
```bash
npm run build
```

## App 분리 원칙
- `ui/app/App.jsx`: 화면 조립만 담당
- `ui/app/hooks/useAppController.js`: 상태/유즈케이스 오케스트레이션
- `ui/app/services/sessionStore.js`: 스토리지/TTL 정책
- `ui/app/services/specStateShadow.js`: SpecState 기록 경계
