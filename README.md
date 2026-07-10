# Tower of Cardborn

직업별 덱을 구성하며 3개의 분기형 액트를 등반하는 덱빌딩 로그라이크 게임입니다. React·TypeScript·Vite 웹 앱을 Capacitor Android 앱으로 패키징합니다.

## 개발 환경

- Node.js 22 이상
- npm 10 이상
- JDK 17 이상
- Android Studio Otter 2025.2.1 이상
- Android SDK 36

## 주요 명령어

- 개발 서버: `npm run dev`
- lint: `npm run lint`
- 타입 검사: `npm run typecheck`
- 단위 테스트: `npm test`
- 웹 빌드: `npm run build`
- Android 동기화: `npm run cap:sync`
- Android Studio 실행: `npm run cap:open`

## 프로젝트 구조

- `packages/game-core`: 전투·맵·이벤트·카드 로직과 공용 타입
- `src/components`: 타이틀·맵·전투·설정 화면
- `src/hooks`: 게임 상태·전투·Android 수명주기 연결
- `src/utils/game-state.ts`: 기본 상태와 저장 복원 정규화
- `src/utils/game-transitions.ts`: 화면별 순수 상태 전환
- `src/i18n`: 한국어·영어·중국어 번역
- `public/assets`: 카드·캐릭터·몬스터·배경·효과음
- `android`: Capacitor Android 네이티브 프로젝트

## 조작

- 카드 사용: 전장으로 드래그 또는 키보드 포커스 후 Enter·Space
- 적 선택: 클릭·탭 또는 키보드 포커스 후 Enter·Space
- 턴 종료: 턴 종료 버튼 또는 Space
- 모달 닫기: Escape
- Android 뒤로가기: 활성 모달 닫기 또는 종료 확인

## 저장과 개인정보

- 현재 런·설정·통계를 기기 `localStorage`에만 저장
- 저장 포맷 버전과 카드·적·이벤트·맵 연결 구조 검증
- 외부 분석·광고·추적 SDK 미사용
- Android 자동 백업과 평문 네트워크 통신 비활성화

## Android 릴리스

- 버전 코드: Gradle `VERSION_CODE` 속성
- 버전 이름: Gradle `VERSION_NAME` 속성
- 기본 빌드값: `versionCode 1`, `versionName 1.0.0`
- 릴리스 전 Node.js 22 환경에서 lint·타입 검사·테스트·웹 빌드·Capacitor 동기화 필요

## 에셋 생성

- 카드 이미지: `npm run generate:card-art`
- 직업 이미지: `npm run generate:class-art`
- 월드 이미지: `npm run generate:world-art`
- 효과음: `npm run generate:sfx`
- 릴리스 이미지 최적화: `npm run optimize:assets`
- 웹 빌드 전 카드·캐릭터·몬스터·배경 WebP 파생본 자동 갱신
- 프로덕션 산출물에는 실제 사용하는 최적화 자산만 포함
- 생성 API 키는 환경 변수로만 전달하고 저장소에 포함하지 않음
