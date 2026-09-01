import { listAggregatedArticles } from '../../../utils/articles-aggregate'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=60')

  const query = getQuery(event)
  const page = Number(query.page || 1)
  const pageSize = Number(query.pageSize || 20)
  const status = typeof query.status === 'string' ? query.status : undefined
  const category = typeof query.category === 'string' ? query.category : undefined
  const search = typeof query.search === 'string' ? query.search : undefined
  const includeAll = query.includeAll === '1' || query.includeAll === 'true'

  // Public consumers: only effectivePublished. Admin can pass includeAll=1.
  const { total, blogList } = await listAggregatedArticles({
    publicOnly: !includeAll,
    status: includeAll ? status : undefined,
    category,
    search,
    page,
    pageSize,
  })

  return {
    code: 0,
    message: 'ok',
    data: {
      Total: total,
      List: blogList,
      total,
      list: blogList,
    },
  }
})
