/** @deprecated 请从 constants/work-ia 导入 WORK_MORE_NAV；保留 re-export 兼容旧引用 */
export { WORK_MORE_NAV as moreNavItems } from '~/constants/work-ia'

import { WORK_MORE_NAV } from '~/constants/work-ia'

export const moreNavPaths = WORK_MORE_NAV.map((item) => item.path)
