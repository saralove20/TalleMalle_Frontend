<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS (라이브러리 -> 스토어/API/Composable -> 컴포넌트)
 * ==============================================================================
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { CreditCard, X, ShieldCheck } from 'lucide-vue-next'
import LabeledInput from '@/components/Input/LabeledInput.vue'
import RoundBox from '@/components/layout/RoundBox.vue'
import { useProfileStore } from '@/stores/profile'

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
// 카드 정보 상태 관리
const cardNum = ref({ p1: '', p2: '', p3: '', p4: '' })
const expiry = reactive({
  month: '',
  year: '',
})
const cvc = ref('')
const ownerName = ref('')

/**
 * ==============================================================================
 * 4. COMPUTED (계산된 속성)
 * ==============================================================================
 */
// 화면 표시용 카드 번호
const displayCardNum = computed(() => {
  const n = cardNum.value
  const p1 = n.p1.padEnd(4, '•')
  const p2 = n.p2 ? '••••' : '••••'
  const p3 = n.p3 ? '••••' : '••••'
  const p4 = n.p4.padEnd(4, '•')
  return `${p1} ${p2} ${p3} ${p4}`
})

/**
 * ==============================================================================
 * 5. METHODS - UI INTERACTION (화면 조작) - [기능 함수]
 * ==============================================================================
 */
// 입력 핸들러: 4자리 입력 시 다음 포커스로 이동
const handleCardNum = (part, event, nextId) => {
  const val = event.target.value
  if (val.length === 4 && nextId) {
    document.getElementById(nextId)?.focus()
  }
}

const handleExpiry = (event, nextId) => {
  const val = event.target.value
  if (val.length === 2 && nextId) {
    document.getElementById(nextId)?.focus()
  }
}

const handleCvc = (event, nextId) => {
  const val = event.target.value
  if (val.length === 3 && nextId) {
    document.getElementById(nextId)?.focus()
  }
}

const handleClose = () => {
  emits('modal', 'none')
}

/**
 * ==============================================================================
 * 6. METHODS - DATA & NETWORK (데이터 통신 및 소켓) - [연동 API 함수]
 * ==============================================================================
 */
const handleSubmit = () => {
  // 1. 유효성 검사 (모든 필드가 채워졌는지 확인)
  if (
    cardNum.value.p1.length < 4 ||
    cardNum.value.p2.length < 4 ||
    cardNum.value.p3.length < 4 ||
    cardNum.value.p4.length < 4 ||
    expiry.month.length < 2 ||
    expiry.year.length < 2 ||
    cvc.value.length < 3 ||
    !ownerName.value
  ) {
    return
  }

  const randomId = Math.floor(Math.random() * 900) + 100

  let company = 'BC카드'
  const firstDigit = cardNum.value.p1[0]
  if (firstDigit === '4') company = '신한카드'
  else if (firstDigit === '5') company = '현대카드'
  else if (firstDigit === '3') company = '삼성카드'

  const newCard = {
    id: randomId,
    card_number: `${cardNum.value.p1}-${cardNum.value.p2}-${cardNum.value.p3}-${cardNum.value.p4}`,
    card_company: company,
    user_name: ownerName.value,
    expiry_date: `${expiry.month}/${expiry.year}`,
    cvc: cvc.value,
  }

  if (profileStore.userInfo.payment.method.length < 2) {
    profileStore.userInfo.payment.method.push(newCard)

    if (profileStore.userInfo.payment.method.length === 1) {
      profileStore.userInfo.payment.default = newCard.id
    }
  }

  handleClose()
}
</script>

<template>
  <div
    class="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
  >
    <div class="w-full max-w-md animate-in fade-in zoom-in duration-300" @click.stop>
      <RoundBox
        class="flex flex-col w-full max-w-[500px] max-h-[95vh] overflow-y-auto shadow-2xl border-none p-6 space-y-6 bg-white"
      >
        <!-- 1. 헤더 영역 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 bg-indigo-50 rounded-xl">
              <CreditCard class="w-5 h-5 text-indigo-600" />
            </div>
            <h1 class="text-xl font-bold text-slate-900 tracking-tight">결제 수단 추가</h1>
          </div>
          <button
            @click="handleClose"
            class="p-2 hover:bg-slate-100 rounded-full transition-colors group"
          >
            <X class="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        <!-- 2. 카드 미리보기 영역 -->
        <div class="flex justify-center py-2">
          <div
            class="w-full aspect-[1.58/1] rounded-[1.5rem] p-6 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600"
          >
            <div class="flex flex-col h-full justify-between relative z-10">
              <div class="flex justify-between items-start">
                <div class="w-10 h-7 bg-yellow-400/90 rounded-md shadow-inner"></div>
                <span class="text-[10px] font-black italic opacity-80 tracking-widest"
                  >PREMIUM</span
                >
              </div>

              <div class="space-y-4">
                <div class="text-xl font-mono tracking-[0.2em] drop-shadow-md">
                  {{ displayCardNum }}
                </div>
                <div class="flex justify-between items-end">
                  <div>
                    <p class="text-[8px] uppercase tracking-widest opacity-60 mb-1">Card Holder</p>
                    <p class="text-xs font-bold truncate max-w-[150px]">
                      {{ ownerName.toUpperCase() || 'YOUR NAME' }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-[8px] uppercase tracking-widest opacity-60 mb-1">Expires</p>
                    <p class="text-xs font-bold">
                      {{ expiry.month && expiry.year ? `${expiry.month}/${expiry.year}` : 'MM/YY' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <!-- 카드 배경 장식 -->
            <div
              class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            ></div>
            <div
              class="absolute -top-10 -left-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"
            ></div>
          </div>
        </div>

        <!-- 3. 입력 폼 영역 -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- 카드 번호 입력 -->
          <div class="space-y-2">
            <div class="grid grid-cols-4 gap-2 items-end">
              <LabeledInput
                id="p1"
                label="카드 번호"
                v-model="cardNum.p1"
                placeholder="0000"
                filterType="numeric"
                align="center"
                :length="{ max: 4 }"
                @input="handleCardNum('p1', $event, 'p2')"
              />
              <LabeledInput
                id="p2"
                v-model="cardNum.p2"
                type="password"
                placeholder="••••"
                filterType="numeric"
                align="center"
                :length="{ max: 4 }"
                @input="handleCardNum('p2', $event, 'p3')"
              />
              <LabeledInput
                id="p3"
                v-model="cardNum.p3"
                type="password"
                placeholder="••••"
                filterType="numeric"
                align="center"
                :length="{ max: 4 }"
                @input="handleCardNum('p3', $event, 'p4')"
              />
              <LabeledInput
                id="p4"
                v-model="cardNum.p4"
                placeholder="0000"
                filterType="numeric"
                align="center"
                :length="{ max: 4 }"
                @input="handleCardNum('p4', $event, 'expiryMonth')"
              />
            </div>
          </div>

          <!-- 유효기간 및 CVC -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="flex items-end gap-2">
                <LabeledInput
                  id="expiryMonth"
                  label="유효"
                  v-model="expiry.month"
                  placeholder="MM"
                  filterType="numeric"
                  align="center"
                  :length="{ max: 2 }"
                  @input="handleExpiry($event, 'expiryYear')"
                />
                <LabeledInput
                  id="expiryYear"
                  v-model="expiry.year"
                  placeholder="YY"
                  filterType="numeric"
                  align="center"
                  :length="{ max: 2 }"
                  @input="handleExpiry($event, 'cvc')"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-400 ml-1">CVC</label>
              <LabeledInput
                id="cvc"
                v-model="cvc"
                type="password"
                placeholder="3자리"
                filterType="numeric"
                align="center"
                :length="{ max: 3 }"
                @input="handleCvc($event, 'ownerName')"
              />
            </div>
          </div>

          <!-- 소유주 성명 -->
          <LabeledInput
            id="ownerName"
            v-model="ownerName"
            label="카드 소유주 성명"
            placeholder="영문 또는 한글 성명"
            filterType="text-only"
            :length="{ max: 20 }"
          />

          <!-- 보안 안내 -->
          <div
            class="p-4 bg-slate-50 rounded-[1.25rem] flex items-start gap-3 border border-slate-100"
          >
            <ShieldCheck class="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <p class="text-[11px] text-slate-500 leading-relaxed">
              입력하신 모든 결제 정보는 SSL 암호화 기술을 통해 안전하게 보호되며, 당사는 고객님의
              카드 번호 전채를 저장하지 않습니다.
            </p>
          </div>
        </form>

        <!-- 4. 하단 버튼 영역 -->
        <div class="flex gap-3 pt-2">
          <button
            @click="handleClose"
            class="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-[1.25rem] transition-all"
          >
            취소
          </button>
          <button
            @click="handleSubmit"
            class="flex-[2] py-4 bg-indigo-600 text-white text-sm font-bold rounded-[1.25rem] shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            카드 등록 완료
          </button>
        </div>
      </RoundBox>
    </div>
  </div>
</template>
