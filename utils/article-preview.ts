export const getArticlePreviewPath = (slug: string) =>
  `/__og-image__/image/blog/${encodeURIComponent(slug)}/og.png`
