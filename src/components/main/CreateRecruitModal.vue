<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 컴포넌트)
 * ==============================================================================
 */
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

// 분리한 컴포넌트들 가져오기
import LocationInput from '@/components/main/inputs/LocationInput.vue'
import TimeSelect from '@/components/main/inputs/TimeSelect.vue'
import MemberCounter from '@/components/main/inputs/MemberCounter.vue'
import TagInput from '@/components/main/inputs/TagInput.vue'
import Textarea from '@/components/main/inputs/Textarea.vue'

/**
 * ==============================================================================
 * 2. CONFIG & PROPS (설정 및 Props/Emits)
 * ==============================================================================
 */
defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'submit'])

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 선언)
 * ==============================================================================
 */
// 폼 데이터
const form = ref({
    start: '',
    startLat: null, // 출발지 위도
    startLng: null, // 출발지 경도
    dest: '',
    destLat: null,  // 도착지 위도
    destLng: null,  // 도착지 경도
    time: 'Now',
    maxMember: 3,
    tags: '',
    desc: ''
})

/**
 * ==============================================================================
 * 4. METHODS - UI & LOGIC (기능 처리 및 이벤트 핸들러)
 * ==============================================================================
 */
// 모달 닫기 핸들러
const handleClose = () => {
    emit('close')
}

// 출발지 선택 시 좌표 저장 핸들러
const handleStartSelect = (location) => {
    // console.log("출발지 선택됨:", location)
    form.value.start = location.name
    form.value.startLat = location.lat
    form.value.startLng = location.lng
}

// 목적지 선택 시 좌표 저장 핸들러
const handleDestSelect = (location) => {
    // console.log("목적지 선택됨:", location)
    form.value.dest = location.name
    form.value.destLat = location.lat
    form.value.destLng = location.lng
}

// 폼 제출 핸들러
const handleFormSubmit = () => {
    // 구조 분해 할당으로 폼 데이터 가져오기
    const { start, startLat, startLng, dest, destLat, destLng, time, maxMember, tags, desc } = form.value

    // 유효성 검사 (좌표가 있는지까지 확인하면 더 좋음)
    if (!start || !dest) {
        alert('출발지와 목적지를 입력해주세요.')
        return
    }

    // 좌표가 누락되었을 경우 (텍스트만 입력하고 리스트 선택 안 했을 때) 경고 처리 가능
    if (!startLat || !destLat) {
        alert('목록에서 정확한 장소를 선택해주세요.')
        return
    }

    const tagArray = tags ? tags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`) : []

    // 부모(HomeView)에게 데이터 전송 (좌표 포함)
    emit('submit', {
        start,
        startLat, // 전송 데이터에 포함
        startLng, // 전송 데이터에 포함
        dest,
        destLat,  // 전송 데이터에 포함
        destLng,  // 전송 데이터에 포함
        time,
        max: maxMember,
        tags: tagArray,
        desc
    })
}
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen"
            class="fixed inset-0 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm z-[100]">
            <div
                class="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 class="text-xl font-bold text-slate-900">동승 모집하기</h2>
                    <button @click="handleClose"
                        class="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">

                    <div class="grid grid-cols-2 gap-3">
                        <LocationInput label="출발지" v-model="form.start" @select-location="handleStartSelect"
                            placeholder="장소 검색" label-color="text-emerald-500" />
                        <LocationInput label="목적지" v-model="form.dest" @select-location="handleDestSelect"
                            placeholder="장소 검색" label-color="text-rose-500" />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <TimeSelect label="출발 시간" v-model="form.time" />
                        <MemberCounter label="모집 인원" v-model="form.maxMember" />
                    </div>

                    <TagInput label="태그 (선택)" v-model="form.tags" placeholder="예: #비흡연 #여성전용" />

                    <Textarea label="하고 싶은 말" v-model="form.desc" placeholder="예: 짐이 조금 있어요" />
                </div>

                <div class="p-6 border-t border-slate-100 bg-white">
                    <button @click="handleFormSubmit"
                        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
                        모집 시작하기
                    </button>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
    width: 5px;
}

.custom-scroll::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
</style>