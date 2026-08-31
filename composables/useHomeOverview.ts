import type { HomeOverview } from '~/types/home'

/** Empty overview when API unavailable — never invent stats. */
const EMPTY_OVERVIEW: HomeOverview = {
  stats: { projects: 0, articles: 0, tools: 0 },
  featuredProjects: [],
  featuredArticle: null,
  latestArticles: [],
  nowBuilding: [],
  journey: [],
}

export const useHomeOverview = () => {
  const { data, pending, error } = useAsyncData(
    'home-overview',
    () => $fetch<HomeOverview>('/api/home/overview'),
  )

  const overview = computed<HomeOverview>(() => data.value ?? EMPTY_OVERVIEW)
  const loading = computed(() => pending.value)
  const unavailable = computed(() => Boolean(error.value) && !data.value)

  return { overview, loading, error, unavailable }
}
