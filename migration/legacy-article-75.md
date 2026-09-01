# Articles legacyId=75 — Phase 4B-3 decision

## Record

| Field | Value |
| --- | --- |
| legacyId | 75 |
| title | 未命名 |
| slug | null |
| status | 0 (draft) |
| content length | ~1819 chars |
| preview | AI JSON 草稿：`构建高效数字体验：全栈开发者的技术哲学与实践` |

## Decision

**abandoned — not migrated**

Reasons:

1. No slug (cannot place under `content/articles/{slug}.md` without inventing one)
2. Title is placeholder「未命名」
3. Body looks like AI generation payload (JSON fence), not a finished article
4. Does not block Git SoT cutover (already excluded from export / content_ops)

## Next action (human)

If content is valuable later:

1. Manually choose a stable slug
2. Extract title/summary from the JSON payload
3. Create `content/articles/{slug}.md` with `status: draft` or `published`
4. Seed `content_ops` with `legacy_id=75` and original `view_count`

Do **not** auto-generate slug in scripts.
