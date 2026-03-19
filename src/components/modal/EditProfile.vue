<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, onMounted } from 'vue'
import { X, Camera, UserCircle } from 'lucide-vue-next'
import { useProfileStore } from '@/stores/profile'
import LabeledInput from '@/components/Input/LabeledInput.vue'
import RoundBox from '@/components/layout/RoundBox.vue'
import api from '@/api/profile'

import axios from 'axios'

/**
 * ==============================================================================
 * 2. CONFIG & STORES (설정 및 스토어 초기화)
 * ==============================================================================
 */
const profileStore = useProfileStore()
const emits = defineEmits(['modal'])

/**
 * ==============================================================================
 * 3. STATE & REFS (상태 변수 선언) - [변수]
 * ==============================================================================
 */
// 프로필 정보 로컬 복사본 (백엔드 필드명과 일치)
const localProfile = ref({
  nickname: '',
  phoneNumber: '',
  introduction: '',
  imageUrl: '',
  birth: '',
  gender: '',
})

// 업로드 중 상태 관리
const isUploading = ref(false)

/**
 * ==============================================================================
 * 5. METHODS - UI INTERACTION (화면 조작) - [기능 함수]
 * ==============================================================================
 */
// 이미지 업로드 (Presigned URL 방식)
const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 1. 미리보기 생성 (사용자 경험 향상)
  const reader = new FileReader()
  reader.onload = (e) => (localProfile.value.imageUrl = e.target.result)
  reader.readAsDataURL(file)

  try {
    isUploading.value = true

    // 2. 백엔드에 Presigned URL 요청
    const { data: { result } } = await api.getPresignedUrl(file.name, file.type)
    const { uploadUrl, finalUrl } = result

    // 3. S3/스토리지에 직접 파일 업로드 (PUT 요청)
    // 주의: 인터셉터가 없는 순수 axios를 사용하여 업로드 (헤더 충돌 방지)
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type }
    })

    // 4. 업로드 완료된 최종 URL을 로컬 상태에 저장
    localProfile.value.imageUrl = finalUrl
    console.log('이미지 업로드 성공:', finalUrl)
  } catch (error) {
    console.error('이미지 업로드 중 오류 발생:', error)
    alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
    // 실패 시 기존 이미지로 복구
    localProfile.value.imageUrl = profileStore.userInfo.profile.imageUrl
  } finally {
    isUploading.value = false
  }
}

/**
 * ==============================================================================
 * 6. METHODS - DATA & NETWORK (데이터 통신 및 소켓) - [연동 API 함수]
 * ==============================================================================
 */
// 변경사항 저장
const handleSave = async () => {
  try {
    const updatePayload = {
      nickname: localProfile.value.nickname,
      introduction: localProfile.value.introduction,
      imageUrl: localProfile.value.imageUrl,
    }

    const res = await api.update(updatePayload)
    console.log('프로필 업데이트 응답:', res.data)

    if (res.status === 200 || res.data?.result) {
      // 서버 응답 데이터가 있으면 사용하고, 없으면 요청했던 데이터 사용
      const updatedData = res.data?.result || updatePayload
      
      // 스토어 업데이트 (수정 불가 항목들도 함께 동기화)
      profileStore.loadProfile({
        ...updatedData,
        phoneNumber: localProfile.value.phoneNumber,
        birth: localProfile.value.birth,
        gender: localProfile.value.gender
      })
      
      alert('프로필 정보가 저장되었습니다.')
      handleClose()
    }
  } catch (error) {
    console.error('프로필 수정 중 오류 발생:', error)
    alert('저장에 실패했습니다. 다시 시도해주세요.')
  }
}

// 성별 표시 변환 함수
const formatGender = (gender) => {
  if (gender === 'M' || gender === 'MALE') return '남성'
  if (gender === 'W' || gender === 'F' || gender === 'FEMALE') return '여성'
  return gender || '미지정'
}

const handleClose = () => {
  emits('modal', 'none')
}

/**
 * ==============================================================================
 * 7. LIFECYCLE (생명주기 훅) - [마운트 관련]
 * ==============================================================================
 */
onMounted(() => {
  Object.assign(localProfile.value, JSON.parse(JSON.stringify(profileStore.userInfo.profile)))
})
</script>

<template>
  <div
    class="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
  >
    <RoundBox
      padding="0"
      class="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300"
      @click.stop
    >
      <!-- 모달 헤더 -->
      <div
        class="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-50 rounded-xl">
            <UserCircle class="w-5 h-5 text-indigo-600" />
          </div>
          <h2 class="text-xl font-bold text-slate-900">프로필 정보 수정</h2>
        </div>
        <button
          @click="handleClose"
          class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- 모달 본문 -->
      <div class="flex-1 overflow-y-auto p-8 space-y-10 custom-scroll">
        <!-- 프로필 이미지 수정 -->
        <div class="flex flex-col items-center">
          <div class="relative group">
            <div
              class="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50 transition-transform group-hover:scale-[1.02]"
            >
              <img
                :src="localProfile.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
                class="w-full h-full object-cover"
              />
            </div>
            <label
              class="absolute -bottom-1 -right-1 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl border-4 border-white cursor-pointer hover:bg-indigo-700 transition-all"
            >
              <Camera class="w-4 h-4" />
              <input type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
            </label>
          </div>
          <p class="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            클릭하여 사진 변경
          </p>
        </div>

        <!-- 입력 폼 -->
        <div class="space-y-6">
          <h3
            class="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"
          >
            기본 정보
          </h3>
          <div class="grid grid-cols-1 gap-6">
            <!-- 닉네임 -->
            <LabeledInput
              id="edit-nickname"
              v-model="localProfile.nickname"
              label="닉네임 *"
              placeholder="닉네임을 입력하세요"
              :length="{ max: 20 }"
            />

            <!-- 한 줄 소개 (닉네임 바로 밑으로 이동) -->
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2 ml-1">한 줄 소개</label>
              <textarea
                v-model="localProfile.introduction"
                placeholder="나를 소개해주세요."
                class="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-24 resize-none transition-all"
              ></textarea>
            </div>

            <!-- 생년월일 / 성별 (읽기 전용) -->
            <div class="grid grid-cols-2 gap-4">
              <LabeledInput
                id="edit-birth"
                :modelValue="localProfile.birth"
                label="생년월일"
                readonly
                class="opacity-60"
              />
              <LabeledInput
                id="edit-gender"
                :modelValue="formatGender(localProfile.gender)"
                label="성별"
                readonly
                class="opacity-60"
              />
            </div>

            <!-- 휴대폰 번호 (수정 불가 처리) -->
            <LabeledInput
              id="edit-phone"
              :modelValue="localProfile.phoneNumber"
              label="휴대폰 번호"
              readonly
              class="opacity-60"
            />
          </div>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
        <button
          @click="handleClose"
          class="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
        >
          취소
        </button>
        <button
          @click="handleSave"
          class="flex-[2] py-4 bg-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          변경사항 저장
        </button>
      </div>
    </RoundBox>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
