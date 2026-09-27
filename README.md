# Tower of Cardborn

직업별 덱·유물·포션을 구성하며 3개의 분기형 액트를 등반하는 덱빌딩 로그라이크 게임입니다. React·TypeScript·Vite 웹 앱을 Capacitor Android 앱으로 패키징합니다.

## 개발 환경

- Node.js 22 이상
- npm 10 이상
- JDK 21 이상
- Android Studio Otter 2025.2.1 이상
- Android SDK 36

## 주요 콘텐츠

- 4개 직업별 시작 덱과 전용 카드 보상 풀 (독·다단히트·광역·지속 파워 아키타입)
- 취약·약화·힘·독·손상·민첩 상태이상과 매 턴 발동 지속 파워
- 3개 액트별 일반 적·엘리트 풀과 액트별 복수 보스 로테이션
- 분기형 맵과 전투·휴식·상점(카드·유물·포션·강화·제거)·보물 상자·액트별 21종 이벤트·저주 카드
- 카드 희귀도·강화·제거와 턴 발동 포함 일반/보스 등급 유물 15종·포션 6종 성장
- 승천 난이도(엘리트·상점 규칙 변화 포함)·직업 고정 일일 도전·시드 입력 재현·최근 런 기록·업적 7종
- 런 점수 기반 인게임 순위표(전체/일일)와 강화석으로 성장하는 영구 장비 6종
- 클리어 후 무한 등반 엔들리스 모드 (액트 누진 강화·보스 로테이션·기록 자동 갱신)
- 화면별 배경음악과 효과음 개별 볼륨 설정
- 웹 설치와 재방문 오프라인 실행 지원

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

- 카드 사용: 터치 화면에서 손패를 한 번 펼친 뒤 탭·전장으로 드래그 또는 키보드 포커스 후 Enter·Space
- 적 선택: 클릭·탭 또는 키보드 포커스 후 Enter·Space
- 턴 종료: 턴 종료 버튼 또는 Space
- 포션 사용: 포션 버튼 또는 숫자 1·2
- 모달 닫기: Escape
- Android 뒤로가기: 활성 모달 닫기 또는 종료 확인

## 저장과 개인정보

- 현재 런·설정·통계·장비 진행도를 기기 `localStorage`에만 저장
- 저장 포맷 버전과 카드·적·이벤트·맵 연결 구조 검증
- 외부 분석·광고·추적 SDK 미사용
- Android 자동 백업과 평문 네트워크 통신 비활성화

## Android 릴리스

- 스토어 배포본: `package.json` 버전과 같은 `vX.Y.Z` 태그 푸시 시 CI 가 서명 빌드 생성
- 태그 빌드 버전: `versionName X.Y.Z`, `versionCode X×1000000 + Y×1000 + Z`
- 태그 빌드 서명 시크릿 필수: `ANDROID_KEYSTORE_BASE64`·`ANDROID_KEYSTORE_PASSWORD`·`ANDROID_KEY_ALIAS`·`ANDROID_KEY_PASSWORD`
- 브랜치·PR 빌드: `versionName <버전>-ci.<실행번호>`, 시크릿 미설정 시 `-unsigned` 산출물
- 산출물 보관: 태그 빌드 90일, 그 외 14일 (`mapping.txt` 포함)
- 로컬 릴리스 빌드: `./gradlew bundleRelease -PVERSION_CODE=<코드> -PVERSION_NAME=<이름>` (미지정 시 `versionCode 1`)
- 릴리스 전 Node.js 22 환경에서 lint·타입 검사·테스트·웹 빌드·Capacitor 동기화(`npm run cap:build`) 필요

## 에셋 생성

- 카드 이미지: `npm run generate:card-art`
- 앱 아이콘: `npm run generate:app-icon`
- 직업 이미지: `npm run generate:class-art`
- 월드 이미지: `npm run generate:world-art`
- 효과음: `npm run generate:sfx`
- 릴리스 이미지 최적화: `npm run optimize:assets`
- 웹 빌드 전 카드·캐릭터·몬스터·배경 WebP 파생본 자동 갱신
- 프로덕션 산출물에는 실제 사용하는 최적화 자산만 포함
- 생성 API 키는 환경 변수로만 전달하고 저장소에 포함하지 않음
