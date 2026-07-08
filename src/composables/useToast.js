import { ref } from 'vue'

// 全局 Toast 实例引用
const toastRef = ref(null)

export function useToast() {
  function setRef(ref) {
    toastRef.value = ref
  }

  function toast(msg, type = 'info') {
    toastRef.value?.addToast(msg, type)
  }

  return { toast, setRef }
}

// 全局 Confirm 实例引用
const confirmRef = ref(null)

export function useConfirm() {
  function setRef(ref) {
    confirmRef.value = ref
  }

  function confirm(msg) {
    return confirmRef.value?.show(msg) || Promise.resolve(false)
  }

  return { confirm, setRef }
}
