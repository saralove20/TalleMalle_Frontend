<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { ref, shallowRef, onMounted, watch, nextTick } from 'vue'
import taxiImg from '@/assets/images/taxi.png'

/**
 * ==============================================================================
 * 2. CONFIG & PROPS
 * ==============================================================================
 */
// 부모(Main.vue)에게 받는 데이터
const props = defineProps({
    recruitList: { type: Array, default: () => [] },
    // 중심 이동 오프셋 (px 단위)
    centerOffset: { type: Number, default: 0 }
})

const emit = defineEmits(['update-location', 'marker-click', 'update-visible-list'])

/**
 * ==============================================================================
 * 3. STATE & REFS
 * ==============================================================================
 */
const mapContainer = ref(null)
const mapInstance = shallowRef(null)
const myMarker = shallowRef(null)
const driverMarker = shallowRef(null)
const recruitMarkers = shallowRef(new Map())
let polyline = null // 경로 선 객체

// 초기 위치 (강남역 부근)
const lat = ref(37.498095)
const lng = ref(127.02761)


/**
 * ==============================================================================
 * 4. METHODS - UI & LOGIC (기능 처리 및 이벤트 핸들러)
 * ==============================================================================
 */
// 오프셋을 적용한 좌표 이동 핸들러
// 지도 중심 이동 (오프셋 적용)
const handleMoveWithOffset = (targetLat, targetLng) => {
    if (!mapInstance.value || !targetLat || !targetLng) return

    const map = mapInstance.value
    const targetPosition = new window.kakao.maps.LatLng(targetLat, targetLng)

    // 오프셋이 없으면 그냥 이동
    if (props.centerOffset === 0) {
        map.panTo(targetPosition)
        return
    }

    // [카카오 지도 Projection 사용]
    // 1. 위도/경도를 화면상의 픽셀 좌표(Point)로 변환
    const projection = map.getProjection()
    const targetPoint = projection.pointFromCoords(targetPosition)

    // 2. 오프셋만큼 중심점을 왼쪽(-)으로 이동
    // (지도의 중심을 왼쪽으로 옮겨야, 우리가 원하는 타겟 마커가 화면 오른쪽에 옴)
    const newCenterPoint = new window.kakao.maps.Point(
        targetPoint.x - props.centerOffset,
        targetPoint.y
    )

    // 3. 다시 픽셀 좌표를 위도/경도로 변환
    const newCenterPosition = projection.coordsFromPoint(newCenterPoint)

    // 4. 이동
    map.panTo(newCenterPosition)
}

// 화면에 보이는 마커만 표시 핸들러
const handleUpdateVisibleMarkers = () => {
    // Map size 체크
    if (!mapInstance.value || recruitMarkers.value.size === 0) return

    // 현재 지도의 영역(Bounds) 가져오기
    const bounds = mapInstance.value.getBounds()
    // 화면에 보이는 모집글 ID들을 담을 배열
    const visibleIds = []

    // Map.forEach는 (value, key) 순서로 들어옴 value가 마커 객체
    recruitMarkers.value.forEach((marker) => {
        // 마커의 위치가 현재 영역 안에 있는지 확인 (카카오 API 제공)
        if (bounds.contain(marker.getPosition())) {
            // 영역 안이면 보이기
            if (!marker.getMap()) marker.setMap(mapInstance.value)
            // 보이는 마커의 ID를 배열에 추가
            if (marker.recruitId) visibleIds.push(marker.recruitId)
        } else {
            // 영역 밖이면 숨기기
            if (marker.getMap()) marker.setMap(null)
        }
    })
    emit('update-visible-list', visibleIds)
}

// --- 모집글 마커 업데이트 핸들러 (Diffing 로직 적용) ---
// 모집글 마커 업데이트
const handleUpdateRecruitMarkers = () => {
    if (!mapInstance.value) return

    // 새로운 데이터의 ID 목록을 Set으로 만들기
    const newRecruitIds = new Set(props.recruitList.map(r => r.id))

    // 리스트에 없는 마커 제거
    // recruitMarkers Map을 순회하면서 검사
    for (const [id, marker] of recruitMarkers.value) {
        if (!newRecruitIds.has(id)) {
            // 지도에서 제거
            marker.setMap(null)
            // 메모리에서 제거
            recruitMarkers.value.delete(id)
        }
    }

    // 리스트에는 있는데 맵에 없는 마커 생성
    props.recruitList.forEach(recruit => {
        // 이미 존재하는 마커면 건너뛰기
        if (recruitMarkers.value.has(recruit.id)) return
        // 좌표 유효성 검사
        if (!recruit.startLat || !recruit.startLng) return

        const loc = new window.kakao.maps.LatLng(recruit.startLat, recruit.startLng)

        // 마커 디자인 (HTML)
        const content = document.createElement('div')
        content.className = 'marker-pin'
        content.innerHTML = `
            <div class="pin-head"><span class="text-xs font-bold">${recruit.cur}/${recruit.max}</span></div>
            <div class="pin-tail"></div>
        `
        // 마커 클릭 시 이벤트 발생
        content.addEventListener('click', () => emit('marker-click', recruit))

        // 지도에 표시하고 Map에 저장
        const overlay = new window.kakao.maps.CustomOverlay({
            position: loc,
            content: content,
            yAnchor: 1,
            zIndex: 50
        })

        // 지도에 표시하고 Map에 저장
        overlay.setMap(mapInstance.value)
        overlay.recruitId = recruit.id // visible 체크용 ID 주입
        recruitMarkers.value.set(recruit.id, overlay)
    })
    // 보이는 목록 갱신
    handleUpdateVisibleMarkers()
}

// 내 위치 마커 업데이트 핸들러
const handleUpdateMyMarker = () => {
    if (!mapInstance.value || !window.kakao) return
    const loc = new window.kakao.maps.LatLng(lat.value, lng.value)

    if (!myMarker.value) {
        const content = '<div class="w-6 h-6 bg-indigo-600 rounded-full border-[3px] border-white shadow-lg pulse-animation"></div>'
        myMarker.value = new window.kakao.maps.CustomOverlay({
            map: mapInstance.value,
            position: loc,
            content: content,
            yAnchor: 0.5,
            zIndex: 100
        })
        handleMoveWithOffset(lat.value, lng.value)
    } else {
        myMarker.value.setPosition(loc)
    }
}

// 기사님 차량 마커 업데이트 핸들러
const handleUpdateDriverMarker = ({ lat, lng, bearing }) => {
    if (!mapInstance.value || !window.kakao) return

    const loc = new window.kakao.maps.LatLng(lat, lng)

    if (!driverMarker.value) {
        const wrapper = document.createElement('div')
        wrapper.className = 'driver-marker-wrapper'

        const carImg = document.createElement('img')
        carImg.src = taxiImg
        carImg.className = 'driver-car-img'

        wrapper.appendChild(carImg)

        const overlay = new window.kakao.maps.CustomOverlay({
            map: mapInstance.value,
            position: loc,
            content: wrapper,
            yAnchor: 0.5,
            zIndex: 200
        })
        overlay.carElement = carImg
        driverMarker.value = overlay
    } else {
        driverMarker.value.setPosition(loc)
        if (driverMarker.value.carElement) {
            driverMarker.value.carElement.style.transform = `rotate(${bearing}deg)`
        }
    }
}

// 경로 선 그리기 핸들러
const handleDrawPath = (pathData) => {
    if (!mapInstance.value || !pathData) return

    if (polyline) polyline.setMap(null)

    const linePath = pathData.map(p => new window.kakao.maps.LatLng(p.lat, p.lng))

    polyline = new window.kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 6,
        strokeColor: '#6366f1',
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
    })
    polyline.setMap(mapInstance.value)
}

// 줌 인 핸들러
const handleZoomIn = () => mapInstance.value?.setLevel(mapInstance.value.getLevel() - 1)
// 줌 아웃 핸들러
const handleZoomOut = () => mapInstance.value?.setLevel(mapInstance.value.getLevel() + 1)
// 내 위치로 이동 핸들러
const handlePanToCurrent = () => handleMoveWithOffset(lat.value, lng.value)
// 특정 위치로 이동 핸들러
const handleMoveToLocation = (tLat, tLng) => handleMoveWithOffset(tLat, tLng)

/**
 * ==============================================================================
 * 5. METHODS - DATA & NETWORK (데이터 초기화)
 * ==============================================================================
 */
const initializeGeolocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
            lat.value = pos.coords.latitude
            lng.value = pos.coords.longitude
            handleUpdateMyMarker()
            emit('update-location', { lat: lat.value, lng: lng.value })
        }, (err) => console.warn(err), { enableHighAccuracy: true, timeout: 5000 })
    }
}

// recruitList가 변하면(글이 추가되면) 마커를 다시 그립니다.
watch(() => props.recruitList, () => {
    handleUpdateRecruitMarkers()
}, { deep: true })

/**
 * ==============================================================================
 * 6. LIFECYCLE
 * ==============================================================================
 */
onMounted(() => {
    console.log("🚀 onMounted 실행! 지도 그리기 시작!")

    const initMap = () => {
        if (!mapContainer.value) return

        const options = {
            center: new window.kakao.maps.LatLng(lat.value, lng.value),
            level: 3
        }

        mapInstance.value = new window.kakao.maps.Map(mapContainer.value, options)

        initializeGeolocation()

        window.kakao.maps.event.addListener(mapInstance.value, 'idle', handleUpdateVisibleMarkers)
        if (props.recruitList.length > 0) {
            handleUpdateRecruitMarkers()
        }

        const resizeObserver = new ResizeObserver(() => {
            if (mapInstance.value && mapContainer.value.clientWidth > 0) {
                mapInstance.value.relayout()
            }
        })

        resizeObserver.observe(mapContainer.value)
    }

    nextTick(() => {
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(initMap);
        } else {
            console.error("Kakao Maps script not loaded");
        }
    })
})

defineExpose({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    panToCurrent: handlePanToCurrent,
    moveToLocation: handleMoveToLocation,
    updateDriverMarker: handleUpdateDriverMarker,
    drawPath: handleDrawPath
})
</script>

<template>
    <div ref="mapContainer" class="absolute inset-0 w-full h-full z-0"></div>
</template>

<style>
/* 전역 스타일 */
.pulse-animation {
    animation: pulse 2s infinite;
}

/* 모집글 마커 스타일 */
.marker-pin {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
    transition: transform 0.2s;
}

.marker-pin:hover {
    transform: scale(1.1) translateY(-5px);
    z-index: 100;
}

.pin-head {
    width: 40px;
    height: 40px;
    background-color: #f43f5e;
    /* Rose-500 */
    border: 3px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.pin-tail {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 10px solid #f43f5e;
    margin-top: -2px;
}

.driver-marker-wrapper {
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
}

.driver-car-body {
    width: 22px;
    height: 42px;
    background-color: #4f46e5;
    border: 2px solid white;
    border-radius: 6px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    position: relative;
    transition: transform 0.1s linear;
}

.driver-car-body::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 2px;
    right: 2px;
    height: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
    }
}
</style>