# "정면배치" 버튼 클릭 시 실행 흐름 정밀 분석

> 작성일: 2025-08-28  
> 목적: 정면배치 버튼 클릭 시 코드 실행 흐름을 정확한 파일명과 라인 번호와 함께 문서화

## 📖 개요

"정면배치" 버튼을 클릭하면 평면 배치 모드에서 세로 배치 모드로 전환되며, 락커들이 일렬로 재배치됩니다.

## 🔧 실행 흐름 상세 분석

### 1. 버튼 클릭 이벤트
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:175`
```javascript
@click="setViewMode('front')"
```
- 사용자가 "정면배치" 버튼을 클릭하면 `setViewMode` 함수가 'front' 파라미터와 함께 호출됨

### 2. setViewMode('front') 실행
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3436-3455`

주요 동작:
- `currentViewMode.value = 'front'` 설정 (3438번 라인)
- `updateViewMode()` 호출 (3440번 라인)
- 스케일 변경 로그 출력 (3443-3447번 라인)
- `nextTick`으로 캔버스 크기 재계산 (3450-3454번 라인)

### 3. updateViewMode() 실행
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3458-3514`

주요 동작:
- **검증 수행**: `validateLockerPlacement()` 호출 (3464번 라인)
  - 검증 실패 시: 에러 메시지 표시하고 floor 뷰로 복귀 (3468-3477번 라인)
  - 검증 성공 시: 계속 진행
- `isVerticalMode.value = true` 설정 (3493번 라인)
- **Front View 모드 설정**:
  - 락커 선택 해제 (3497-3498번 라인)
  - 드래그 비활성화 (3499번 라인)
  - 선택 UI 숨김 (3500번 라인)
- `lockerStore.setPlacementMode('vertical')` 호출 (3513번 라인)

### 4. Watch 트리거
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:6404-6426`

`currentViewMode.value` 변경 감지:
- `loadLockers()` 호출하여 락커 데이터 재로드 (6408번 라인)
  - Front View에서는 자식 락커(Tier)도 포함하여 로드
  - Floor View에서는 부모 락커만 로드
- Front View일 경우 `nextTick`에서 `transformToFrontViewNew()` 실행 (6415번 라인)

### 5. transformToFrontViewNew() 실행
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3916-4200대`

Front View 변환 알고리즘의 핵심 프로세스:

#### 5-1. 대그룹(Major Group) 탐지
- `groupNearbyLockers()` 호출 (3707번 라인에서 참조)
- 10px 이내 락커들을 하나의 대그룹으로 묶음
- 독립 락커도 하나의 대그룹으로 처리

#### 5-2. 대그룹 정렬
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3720-3732`
- `sortMajorGroups()`: 위→아래, 왼쪽→오른쪽 순서로 정렬
- Y 좌표 우선, 같으면 X 좌표로 정렬

#### 5-3. 각 대그룹 내 소그룹(Minor Group) 분류
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3764-3810`
- `findMinorGroups()` 호출
- 같은 문방향 + 인접(1px 이내) = 하나의 소그룹
- 다른 문방향 또는 인접하지 않음 = 다른 소그룹

#### 5-4. 소그룹 정렬 및 회전 처리
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3816-3882`

- `sortMinorGroups()`: 위→아래, 왼쪽→오른쪽 순서 (3816-3829번 라인)
- `applyRotationToMinorGroup()`: 문방향에 따른 순서 조정 (3838-3882번 라인)
  - **0° (아래)**: 변화 없음 (3849-3854번 라인)
  - **90° (왼쪽)**: 상하 순서 유지 (3856-3861번 라인)
  - **180° (위)**: 좌우 반전 `b.x - a.x` (3863-3868번 라인)
  - **270° (오른쪽)**: 상하 반전 `b.y - a.y` (3870-3875번 라인) ✅ 수정됨

#### 5-5. 하단 배치 계산
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:4019-4126`

- 각 락커를 순차적으로 배치 (4022-4024번 라인)
- **간격 계산** (4036-4046번 라인):
  - 같은 소그룹 내: 0px (인접)
  - 소그룹 간: 10px
  - 대그룹 간: 20px
- `frontViewX`, `frontViewY` 계산 및 저장 (4055-4060번 라인)
- 자식 락커(Tier) 위치 계산 (4063-4113번 라인)

#### 5-6. 전체 중앙 정렬
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:4128-4144`

- 전체 너비 계산 (4129번 라인)
- 중앙 오프셋 계산 (4130번 라인)
- 모든 락커에 오프셋 적용 (4134-4143번 라인)

### 6. displayLockers 재계산
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:1452-1500`

`currentLockers.value` 변경으로 computed property 재계산:
- **Front View 모드일 때**:
  - `locker.frontViewX`, `locker.frontViewY` 사용 (1474-1476번 라인)
  - 높이는 `actualHeight` 사용 (depth 대신) (1460, 1476번 라인)
- 스케일 적용하여 최종 디스플레이 좌표 계산

### 7. 렌더링
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:200-400대` (Template 부분)

SVG로 Front View 렌더링:
- 바닥선(FLOOR_Y = 550)에 정렬 (758번 라인)
- 문방향 표시 안 함
- 둥근 모서리 적용
- 락커 번호와 타입 표시

## 📋 핵심 수정 사항 (2025-08-28)

### 270도 회전 처리 수정
**파일**: `/mnt/d/Projects/Locker4/frontend/src/pages/LockerPlacementFigma.vue:3870-3875`

`applyRotationToMinorGroup()` 함수의 270도 회전 처리:
- **수정 전**: `a.y - b.y` (위에서 아래로)
- **수정 후**: `b.y - a.y` (상하 반전, 아래에서 위로)
- **결과**: 270도 회전 시 L12→L11→L10 순서로 올바르게 렌더링됨

## 🔍 관련 함수들

| 함수명 | 파일 위치 | 설명 |
|--------|---------|------|
| `normalizeRotation()` | `LockerPlacementFigma.vue:3662-3669` | 회전각을 0-360° 범위로 정규화 |
| `getMinDistance()` | `LockerPlacementFigma.vue:3675-3702` | 두 락커 사이의 최단거리 계산 |
| `isAdjacent()` | `LockerPlacementFigma.vue:5744-5753` | 두 락커가 인접한지 확인 |
| `isConnected()` | `LockerPlacementFigma.vue:5710-5742` | 두 락커가 연결되어 있는지 확인 |
| `groupNearbyLockers()` | 참조됨 | 대그룹 형성 |
| `validateLockerPlacement()` | 참조됨 | 락커 배치 규칙 검증 |

## 💡 중요 상수

- **FLOOR_Y**: 550 (바닥선 Y 위치)
- **LOCKER_VISUAL_SCALE**: 2.0 (락커 시각적 스케일)
- **ADJACENT_THRESHOLD**: 1px (인접 판단 거리)
- **CONNECTION_THRESHOLD**: 10px (연결 판단 거리)
- **MINOR_GROUP_GAP**: 10px (소그룹 간격)
- **MAJOR_GROUP_GAP**: 20px (대그룹 간격)

## 📌 참고사항

1. **Front View 검증**: 세로 모드 진입 전 락커 배치 규칙을 검증하여 잘못된 배치 시 진입을 차단
2. **자식 락커 처리**: Front View에서는 Tier(자식) 락커도 함께 로드되어 부모 락커 위에 스택 형태로 표시
3. **회전 정규화**: -90°와 270°를 같은 값으로 처리하여 일관된 그룹 형성 보장
4. **중앙 정렬**: 모든 락커 배치 후 전체를 캔버스 중앙에 정렬