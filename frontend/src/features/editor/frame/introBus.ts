import { create } from 'zustand'

/**
 * زرار «الافتتاحية» في شريط المعاينة بيزوّد العدّاد، و‎PreviewPane‎ بيبعت للإطار يعيد عرضها.
 * عدّاد منفصل عن ستور المحرر: ده أمر لحظي للمعاينة مش جزء من حالة المستند.
 */
interface IntroBus {
  count: number
  show: () => void
}

export const useIntroBus = create<IntroBus>()((set) => ({
  count: 0,
  show: () => set((state) => ({ count: state.count + 1 })),
}))
