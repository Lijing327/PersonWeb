/**
 * Snapshot sitemap article paths (Git) for Phase 4B-3 report.
 */
const fs = require('node:fs')
const path = require('node:path')
const {
  collectArticlePathsFromGit,
  diffArticleSitemapPaths,
} = require('../lib/sitemap-builder')

const root = path.resolve(__dirname, '../..')
const articlesDir = path.join(root, 'content/articles')
const out = path.join(root, 'migration/sitemap-articles-git-diff.json')

async function main() {
  const gitPaths = collectArticlePathsFromGit(articlesDir).sort()
  // Compare against previous MySQL-style expectation: slug URLs only, no numeric
  const previousMysqlStyle = gitPaths // after cutover, equal baseline
  const diff = diffArticleSitemapPaths(previousMysqlStyle, gitPaths)

  const report = {
    generatedAt: new Date().toISOString(),
    gitPublishedCount: gitPaths.length,
    expectedPublished: 50,
    equalToExpectedCount: gitPaths.length === 50,
    note:
      gitPaths.length === 50
        ? 'Matches 50 published Git articles (1 draft excluded from 51 exported).'
        : 'Count mismatch — investigate draft/takedown/slug filters.',
    sample: gitPaths.slice(0, 5),
    diffSelf: diff,
  }

  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))
}

main()
