// 统一 API 响应接口
interface ApiResponse<T> {
    code: number
    message: string
    data: T
}

export const useApi = () => {
    const config = useRuntimeConfig()

    /**
     * 根据当前环境自动获取 API 基础路径
     * - 本地开发（localhost/127.0.0.1）: 使用本地 API
     * - 生产环境（xifg.com.cn）: 使用 https://api.xifg.com.cn/api
     * - 生产环境（xing.com.cn）: 使用 https://api.xing.com.cn/api
     */
    const getApiBaseUrl = (): string => {
        // 客户端运行时，根据当前域名自动判断
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname

            // 本地开发环境
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
                return 'http://localhost:5234/api'
            }

            // 生产环境（xifg.com.cn 域名）
            if (hostname.includes('xifg.com.cn')) {
                return 'https://api.xifg.com.cn/api'
            }

            // 生产环境（xing.com.cn 域名）
            if (hostname.includes('xing.com.cn')) {
                return 'https://api.xing.com.cn/api'
            }

            // 其他域名（自建服务器/临时域名/IP）默认走同源 /api，避免误回退到 localhost
            // 若需跨域后端，可通过 NUXT_PUBLIC_API_BASE 显式覆盖
            if (!config.public.apiBase || config.public.apiBase.includes('localhost:5234')) {
                return `${window.location.origin}/api`
            }
        }

        // 服务端渲染或未匹配域名，使用环境变量配置
        return config.public.apiBase
    }
    
    // 动态获取 API 基础路径
    const baseUrl = getApiBaseUrl()

    // 通用请求处理
    const request = async <T>(url: string, options: any = {}) => {
        const { silent, ...fetchOptions } = options
        try {
            // 判断是否为 Nuxt server API（以 /api/ 开头）
            const isNuxtServerAPI = url.startsWith('/api/')
            
            let finalBaseURL: string | undefined = undefined
            
            if (isNuxtServerAPI) {
                // Nitro API：同源 cookie 鉴权，禁止注入 localStorage Bearer
                finalBaseURL = undefined
                fetchOptions.credentials = fetchOptions.credentials ?? 'include'
            } else {
                // .NET 后端 API
                finalBaseURL = baseUrl
            }
            
            const response = await $fetch<ApiResponse<T>>(url, {
                baseURL: finalBaseURL,
                ...fetchOptions
            })

            // 统一错误处理
            // 兼容两种格式：
            // 1. 标准格式 { code: 0, data: ... }
            // 2. 直接返回数据 (code 为 undefined)
            if (response.code !== undefined && response.code !== 0) {
                // 后端返回错误时，message 字段包含错误信息
                const errorMessage = response.message || '请求失败'
                const error = new Error(errorMessage)
                // 添加 code 属性，方便错误处理
                ;(error as any).code = response.code
                throw error
            }

            // 如果是标准格式，返回 data；否则直接返回 response
            const result = response.code === 0 ? response.data : response
            return result
        } catch (error: any) {
            if (!silent && typeof window !== 'undefined') {
                console.error('API Error:', error)
                console.error('API Error URL:', url)
                console.error('API Error Response:', error.response)
            }
            // Nitro Admin API 401 → 清残留 legacy 存储并跳转登录
            const status = error?.response?.status ?? error?.statusCode ?? error?.status
            if (status === 401 && typeof window !== 'undefined' && url.startsWith('/api/')) {
                localStorage.removeItem('admin_token')
                localStorage.removeItem('admin_user')
                navigateTo('/admin/login')
            }
            throw error
        }
    }

    // GET 请求
    const get = <T>(url: string, options = {}) => {
        return request<T>(url, { method: 'GET', ...options })
    }

    // POST 请求
    const post = <T>(url: string, body: unknown, options = {}) => {
        return request<T>(url, { method: 'POST', body, ...options })
    }

    // PUT 请求
    const put = <T>(url: string, body: unknown, options = {}) => {
        return request<T>(url, { method: 'PUT', body, ...options })
    }

    // PATCH 请求
    const patch = <T>(url: string, body: unknown, options = {}) => {
        return request<T>(url, { method: 'PATCH', body, ...options })
    }

    // DELETE 请求
    const del = <T>(url: string, options = {}) => {
        return request<T>(url, { method: 'DELETE', ...options })
    }

    // DELETE 别名（更符合常见命名习惯）
    const deleteMethod = del

    return {
        get,
        post,
        put,
        patch,
        del,
        delete: deleteMethod, // 添加 delete 方法作为 del 的别名
        baseUrl // 暴露 baseUrl 用于调试
    }
}
