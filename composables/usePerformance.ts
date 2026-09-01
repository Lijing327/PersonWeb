/**
 * 性能监控 Composable
 *
 * 提供性能指标收集和分析功能
 */

import { ref, onMounted, onUnmounted } from 'vue'

// 性能指标类型
export interface PerformanceMetrics {
  // 首次内容绘制
  fcp?: number
  // 最大内容绘制
  lcp?: number
  // 首次输入延迟
  fid?: number
  // 首次字节
  fbi?: number
  // 累积布局偏移
  cls?: number
  // 首次有意义的绘制
  fmp?: number
  // 交互时间到下一次绘制
  inp?: number
  // 总阻塞时间
  tbt?: number
  // 页面加载时间
  plt?: number
}

// 性能标记配置
interface PerformanceMarkConfig {
  name: string
  type?: 'measure' | 'mark'
  detail?: string
}

// 性能监控器类
class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, any> = new Map()

  /**
   * 创建性能标记
   */
  mark(config: PerformanceMarkConfig): void {
    const { name, type = 'mark', detail } = config
    const timestamp = performance.now()

    if (type === 'mark') {
      performance.mark(`${name}${detail ? `:${detail}` : ''}`)
    }

    this.marks.set(name, timestamp)
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(name: string, startMark: string, endMark: string): number {
    const startTimestamp = this.marks.get(startMark)
    const endTimestamp = performance.marks.get(endMark)

    if (startTimestamp && endTimestamp) {
      const duration = endTimestamp - startTimestamp
      this.measures.set(name, {
        start: startTimestamp,
        end: endTimestamp,
        duration
      })

      // 创建 Performance Measure
      performance.measure(
        name,
        `${startMark} (start)`,
        `${endMark} (end)`
      )

      return duration
    }

    throw new Error(`Missing marks for measure: ${startMark}, ${endMark}`)
  }

  /**
   * 测量函数执行时间
   */
  measureFn<T extends any[], R>(name: string, fn: (...args: T) => R): (...args: T) => R {
    return (...args) => {
      this.mark({ name: `${name}-start`, type: 'mark' })
      const result = fn(...args)
      this.mark({ name: `${name}-end`, type: 'mark' })
      this.measure(name, `${name}-start`, `${name}-end`)
      return result
    }
  }

  /**
   * 获取所有标记
   */
  getMarks(): Map<string, number> {
    return new Map(this.marks)
  }

  /**
   * 获取所有测量
   */
  getMeasures(): Map<string, any> {
    return new Map(this.measures)
  }

  /**
   * 清除所有标记和测量
   */
  clear(): void {
    this.marks.clear()
    this.measures.clear()
    performance.clearMarks()
    performance.clearMeasures()
  }

  /**
   * 获取 Web Vitals 指标
   */
  async getWebVitals(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {}

    try {
      // 首次内容绘制
      if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime
            } else if (entry.name === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime
            }
          }
        })
        paintObserver.observe({ type: 'paint', buffered: true })

        // 等待 LCP
        await new Promise(resolve => setTimeout(resolve, 3000))
        paintObserver.disconnect()
      }
    } catch (e) {
      console.warn('PerformanceObserver not supported for paint', e)
    }

    // 首次输入延迟
    try {
      if (PerformanceObserver.supportedEntryTypes.includes('first-input')) {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-input' && !entry.processingStart) {
              metrics.fid = entry.startTime
            }
          }
        })
        fidObserver.observe({ type: 'first-input', buffered: true })

        await new Promise(resolve => setTimeout(resolve, 5000))
        fidObserver.disconnect()
      }
    } catch (e) {
      console.warn('PerformanceObserver not supported for first-input', e)
    }

    // 首次字节
    try {
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        const fbiObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'largest-contentful-paint') {
              metrics.fbi = (entry as any).firstByteToFCP
            }
          }
        })
        fbiObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        await new Promise(resolve => setTimeout(resolve, 3000))
        fbiObserver.disconnect()
      }
    } catch (e) {
      console.warn('PerformanceObserver not supported for largest-contentful-paint', e)
    }

    // 累积布局偏移
    try {
      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        let clsScore = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              const score = (entry as any).value * (1 + ((entry as any).entries?.length || 0))
              clsScore = Math.max(clsScore, score)
            }
          }
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })

        await new Promise(resolve => setTimeout(resolve, 3000))
        clsObserver.disconnect()

        metrics.cls = clsScore
      }
    } catch (e) {
      console.warn('PerformanceObserver not supported for layout-shift', e)
    }

    return metrics
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const lines: string[] = ['=== 性能报告 ===', '']

    lines.push('--- 标记 ---')
    for (const [name, timestamp] of this.marks.entries()) {
      lines.push(`${name}: ${timestamp.toFixed(2)}ms`)
    }

    lines.push('\n--- 测量 ---')
    for (const [name, data] of this.measures.entries()) {
      lines.push(`${name}: ${(data.duration || 0).toFixed(2)}ms`)
    }

    return lines.join('\n')
  }
}

// 创建全局监控器实例
const globalMonitor = new PerformanceMonitor()

/**
 * 使用性能监控的 Composable
 */
export function usePerformance() {
  const metrics = ref<PerformanceMetrics>({})
  const isMonitoring = ref(false)

  // 页面可见性变化处理
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isMonitoring.value) {
      // 页面变为可见时，开始监控
      startMonitoring()
    }
  }

  // 开始监控
  const startMonitoring = () => {
    if (isMonitoring.value) return

    isMonitoring.value = true
    globalMonitor.mark({ name: 'page-visibility', type: 'mark' })

    // 收集 Web Vitals
    globalMonitor.getWebVitals().then(vitals => {
      metrics.value = vitals
      console.log('Web Vitals:', vitals)
    })
  }

  // 停止监控
  const stopMonitoring = () => {
    isMonitoring.value = false
    globalMonitor.mark({ name: 'page-hidden', type: 'mark' })
  }

  // 测量函数执行时间
  const measure = (name: string, fn: () => void) => {
    return globalMonitor.measureFn(name, fn)
  }

  // 创建性能标记
  const mark = (name: string, detail?: string) => {
    globalMonitor.mark({ name, detail })
  }

  // 生成报告
  const generateReport = () => {
    return globalMonitor.generateReport()
  }

  // 检查性能指标
  const checkScore = () => {
    const { fcp, lcp, fid, cls } = metrics.value

    let score = 0
    let issues: string[] = []

    // FCP 评分（目标 < 1.8s）
    if (fcp && fcp < 1800) {
      score += 25
    } else if (fcp && fcp < 2500) {
      score += 15
      issues.push('FCP 较慢，建议优化首屏加载')
    } else if (fcp) {
      issues.push('FCP 过慢，严重性能问题')
    }

    // LCP 评分（目标 < 2.5s）
    if (lcp && lcp < 2500) {
      score += 25
    } else if (lcp && lcp < 4000) {
      score += 15
      issues.push('LCP 较慢，建议优化关键资源')
    } else if (lcp) {
      issues.push('LCP 过慢，严重性能问题')
    }

    // FID 评分（目标 < 100ms）
    if (fid && fid < 100) {
      score += 25
    } else if (fid && fid < 300) {
      score += 15
      issues.push('输入响应较慢，建议减少 JS 执行')
    } else if (fid) {
      issues.push('输入响应过慢，严重性能问题')
    }

    // CLS 评分（目标 < 0.1）
    if (cls && cls < 0.1) {
      score += 25
    } else if (cls && cls < 0.25) {
      score += 15
      issues.push('布局偏移较多，建议减少动态元素')
    } else if (cls) {
      issues.push('布局偏移过多，严重性能问题')
    }

    return {
      score: Math.min(score, 100),
      grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D',
      issues
    }
  }

  // 组件挂载时自动开始监控
  onMounted(() => {
    // 延迟启动，等待页面稳定
    setTimeout(() => {
      startMonitoring()
    }, 1000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  // 组件卸载时停止监控
  onUnmounted(() => {
    stopMonitoring()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measure,
    mark,
    generateReport,
    checkScore,
    globalMonitor
  }
}

/**
 * 性能装饰器工厂
 */
export function withPerformance<T extends Function>(name: string) {
  return function (this: any, ...args: any[]) {
    globalMonitor.mark({ name: `${name}-start`, type: 'mark' })
    const result = name.apply(this, args)
    globalMonitor.mark({ name: `${name}-end`, type: 'mark' })
    globalMonitor.measure(name, `${name}-start`, `${name}-end`)

    return result
  }
}

// 导出类型
export type { PerformanceMetrics, PerformanceMarkConfig }
