# Front View 렌더링 알고리즘

> 작성일: 2025-08-22  
> 목적: 평면 배치된 락커들을 세로 모드에서 일렬로 배치하는 알고리즘

## 📖 알고리즘 개요 (서술식)

### 1. 대그룹 (Major Group) 정의
두 개의 락커 간 최단 거리가 10px보다 작을 때 연결되었다고 본다. 연결은 2개 이상일 수도 있으며, 연결된 락커들의 집합을 **대그룹**이라고 한다. 단, 연결된 것이 없을 때에는 1개의 독립 락커도 하나의 대그룹으로 본다.

### 2. 소그룹 (Minor Group) 정의  
대그룹은 소그룹으로 나뉠 수 있다:
- **같은 문방향 + 인접(붙어있음)**: 1개의 소그룹이 된다
- **다른 문방향**: 인접해있어도 각각 다른 소그룹이 된다
- **같은 문방향이지만 인접하지 않음**: 연결(10px 이내)되어 있어도 각각 다른 소그룹이 된다

**인접 vs 연결의 차이:**
- **연결**: 10px 이내 거리 또는 일부분만 붙어있음 (대그룹 기준)
- **인접**: 한 면 전체가 완전히 붙어있음 (소그룹 기준)

**예시:**
- L1의 오른쪽 면 전체와 L2의 왼쪽 면 전체가 붙어있음 → **인접**
- L1과 L2가 T자 형태로 일부만 붙어있음 → **연결** (인접 아님)
- L1과 L2가 5px 떨어져 있음 → **연결**
- L1과 L2가 15px 떨어져 있음 → 연결도 아님

### 3. 렌더링 우선순위 결정
먼저 **위에서 아래, 왼쪽에서 오른쪽** 순서로 대그룹을 찾으면서 렌더링 우선순위를 정한다. 좌표 기준으로 예를 들면 (1,2), (1,3), (2,4) 이런 식이며, 가장 윗쪽 가장 왼쪽에 있는 것이 우선이다. 그 중에서도 **윗쪽에 있는 것이 더 우선**이다.

### 4. 소그룹 분류 및 우선순위
찾아진 대그룹을 이제 소그룹으로 나눈다. 대그룹 중 락커가 1개 있는 대그룹은 그 자체가 소그룹이 되며 소그룹의 락커가 된다.

가장 먼저 찾아진 대그룹을 소그룹으로 쪼개고 락커 단위로 쪼개는 로직은 다음과 같다:
- 먼저 소그룹 원칙을 적용해서 소그룹을 분리해낸다
- 소그룹 1번째는 **가장 윗쪽 가장 왼쪽**에 있는 것이 1번이다
- 우선순위는 **위가 먼저**이고 그 다음이 **왼쪽**이다

### 5. 문방향 회전 처리
소그룹은 어떤 락커는 문방향이 아래, 어떤 락커는 문방향이 위 또는 좌, 우로 배치된 경우가 있다. 이를 모두 **문방향이 아래로 향하게** 해서 왼쪽부터 읽혀지는 락커 순서대로 하단에 배치한다.

회전 시 순서 변화:
- **180° (위) → 0° (아래)**: 좌우 반전 (L1,L2 → L2,L1)
- **270° (우) → 0° (아래)**: 상하 반전 (L2(위),L1(아래) → L1,L2)
- **90° (좌) → 0° (아래)**: 상하 순서 유지 (L1(위),L2(아래) → L1,L2)
- **0° (아래) → 0° (아래)**: 변화 없음

### 6. 하단 배치 규칙
렌더링은 대그룹 → 소그룹 → 락커 우선순위로 **왼쪽에서부터 오른쪽으로** 락커가 일렬로 위치한다.

**간격 규칙:**
- **소그룹이 바뀌는 시점**: 10px 간격
- **대그룹이 바뀌는 시점**: 20px 간격  
- **그렇지 않으면**: 락커를 인접시킴 (0px)

**정렬 및 렌더링:**
- **하단 바닥선 정렬**이며 **전체 중앙정렬**
- **높이는 `height`를 이용**해서 그림 (평면모드의 `depth` 대신)
- **모서리 부분이 조금 더 둥글게** 처리
- **세로배치모드시 문방향은 표시하지 않음**

---

## 🔧 구체적 구현 로직

### 1단계: 대그룹 탐지
```javascript
function findMajorGroups(lockers) {
  // 락커 간 최단거리 < 10px → 연결된 대그룹
  // 연결이 없으면 독립 락커 = 1개 대그룹
  const groups = []
  const visited = new Set()
  
  lockers.forEach(locker => {
    if (visited.has(locker.id)) return
    
    const group = []
    const queue = [locker]
    
    while (queue.length > 0) {
      const current = queue.shift()
      if (visited.has(current.id)) continue
      
      visited.add(current.id)
      group.push(current)
      
      // 10px 이내의 다른 락커들을 찾아서 그룹에 추가
      lockers.forEach(other => {
        if (!visited.has(other.id) && getMinDistance(current, other) < 10) {
          queue.push(other)
        }
      })
    }
    
    groups.push(group)
  })
  
  return groups
}

function getMinDistance(locker1, locker2) {
  // 두 락커 사이의 최단거리 계산
  const rect1 = {
    left: locker1.x,
    right: locker1.x + locker1.width,
    top: locker1.y,
    bottom: locker1.y + (locker1.depth || locker1.height)
  }
  const rect2 = {
    left: locker2.x,
    right: locker2.x + locker2.width,
    top: locker2.y,
    bottom: locker2.y + (locker2.depth || locker2.height)
  }
  
  const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right))
  const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom))
  
  return Math.sqrt(dx * dx + dy * dy)
}
```

### 2단계: 대그룹 우선순위
```javascript
function sortMajorGroups(majorGroups) {
  return majorGroups.sort((a, b) => {
    const aTopLeft = getTopLeftLocker(a)
    const bTopLeft = getTopLeftLocker(b)
    
    // 위쪽 우선, 그 다음 왼쪽 우선
    if (aTopLeft.y !== bTopLeft.y) return aTopLeft.y - bTopLeft.y
    return aTopLeft.x - bTopLeft.x
  })
}

function getTopLeftLocker(group) {
  return group.reduce((topLeft, locker) => {
    if (locker.y < topLeft.y) return locker
    if (locker.y === topLeft.y && locker.x < topLeft.x) return locker
    return topLeft
  })
}
```

### 3단계: 소그룹 분류
```javascript
function findMinorGroups(majorGroup) {
  const minorGroups = []
  const visited = new Set()
  
  majorGroup.forEach(locker => {
    if (visited.has(locker.id)) return
    
    const minorGroup = []
    const queue = [locker]
    
    while (queue.length > 0) {
      const current = queue.shift()
      if (visited.has(current.id)) continue
      
      visited.add(current.id)
      minorGroup.push(current)
      
      // 같은 문방향 + 인접한 락커들을 찾아서 소그룹에 추가
      majorGroup.forEach(other => {
        if (!visited.has(other.id) && 
            current.rotation === other.rotation && // 같은 문방향
            areAdjacent(current, other)) { // 인접
          queue.push(other)
        }
      })
    }
    
    minorGroups.push(minorGroup)
  })
  
  return minorGroups
}

function areAdjacent(locker1, locker2) {
  // 두 락커가 인접한지 확인 (같은 면이 붙어있는지)
  return getMinDistance(locker1, locker2) < 1
}
```

### 4단계: 소그룹 우선순위 및 회전 처리
```javascript
function sortMinorGroups(minorGroups) {
  return minorGroups.sort((a, b) => {
    const aTopLeft = getTopLeftLocker(a)
    const bTopLeft = getTopLeftLocker(b)
    
    if (aTopLeft.y !== bTopLeft.y) return aTopLeft.y - bTopLeft.y
    return aTopLeft.x - bTopLeft.x
  })
}

function applyRotationToMinorGroup(minorGroup) {
  const direction = minorGroup[0].rotation || 0
  
  // 소그룹 내 락커들을 적절한 순서로 정렬
  let sortedLockers = [...minorGroup]
  
  switch (direction) {
    case 0:   // 아래 방향 - 변화없음
      sortedLockers.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      })
      break
      
    case 90:  // 왼쪽 방향 - 상하 순서 유지
      sortedLockers.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      })
      break
      
    case 180: // 위 방향 - 좌우 반전
      sortedLockers.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return b.x - a.x // 좌우 반전
      })
      break
      
    case 270: // 오른쪽 방향 - 상하 반전
      sortedLockers.sort((a, b) => {
        if (a.x !== b.x) return a.x - b.x
        return b.y - a.y // 상하 반전
      })
      break
  }
  
  return sortedLockers
}
```

### 5단계: 하단 배치 및 렌더링
```javascript
function renderFrontView(sortedMajorGroups) {
  const VISUAL_SCALE = 2.0
  const MINOR_GROUP_GAP = 10
  const MAJOR_GROUP_GAP = 20
  
  let currentX = 0
  const renderData = []
  
  sortedMajorGroups.forEach((majorGroup, majorIndex) => {
    // 대그룹 간격
    if (majorIndex > 0) {
      currentX += MAJOR_GROUP_GAP
    }
    
    const sortedMinorGroups = sortMinorGroups(findMinorGroups(majorGroup))
    
    sortedMinorGroups.forEach((minorGroup, minorIndex) => {
      // 소그룹 간격
      if (minorIndex > 0) {
        currentX += MINOR_GROUP_GAP
      }
      
      const rotatedLockers = applyRotationToMinorGroup(minorGroup)
      
      rotatedLockers.forEach(locker => {
        const width = locker.width * VISUAL_SCALE
        const height = locker.height * VISUAL_SCALE // height 사용!
        
        renderData.push({
          id: locker.id,
          x: currentX,
          y: FLOOR_Y - height, // 바닥선 정렬
          width: width,
          height: height,
          rotation: 0, // 모든 락커 아래 방향
          showDoorDirection: false, // 문방향 표시 안함
          borderRadius: 4, // 둥근 모서리
        })
        
        currentX += width // 인접 배치 (0px 간격)
      })
    })
  })
  
  // 전체 중앙 정렬
  const totalWidth = currentX
  const centerOffset = (canvasWidth.value - totalWidth) / 2
  
  renderData.forEach(item => {
    item.x += centerOffset
  })
  
  return renderData
}
```

## 📋 주요 구현 체크리스트

- [x] 대그룹 탐지 (10px 이내 연결)
- [x] 대그룹 우선순위 (위→아래, 좌→우)
- [x] 소그룹 분류 (같은 방향 + 인접)
- [x] 소그룹 우선순위 (위→아래, 좌→우)
- [x] 회전 처리 및 순서 변화 적용
- [x] 간격 규칙 (소그룹: 10px, 대그룹: 20px)
- [x] 높이 렌더링 (height 사용)
- [x] 문방향 표시 제거
- [x] 둥근 모서리 적용
- [x] 바닥선 정렬 + 전체 중앙정렬

## 🔍 테스트 케이스

### 케이스 1: 단순 가로 배치
```
L1 - L2 - L3 (모두 아래 방향)
결과: L1 → L2 → L3 (변화없음)
```

### 케이스 2: 위 방향 락커들
```
L1 - L2 (모두 위 방향, 180°)
결과: L2 → L1 (좌우 반전)
```

### 케이스 3: 세로 배치 우측 방향
```
L2 (위, 우측 방향)
|
L1 (아래, 우측 방향)
결과: L1 → L2 (상하 반전)
```

### 케이스 4: 혼합 방향
```
대그룹1: L1(아래) - L2(아래)  → L1 → L2
[20px 간격]
대그룹2: L3(위) - L4(위)      → L4 → L3 (좌우 반전)
```