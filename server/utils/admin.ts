import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const session = await requireUserSession(event)
  const allowedId = useRuntimeConfig(event).adminGithubId
  if (!allowedId || session.user.githubId !== String(allowedId)) throw createError({ statusCode: 403, statusMessage: 'This GitHub account does not have admin access.' })
  return session.user
}

export function requireAdminOrigin(event: H3Event) {
  const origin = getHeader(event, 'origin')
  if (!origin || origin !== getRequestURL(event).origin) throw createError({ statusCode: 403, statusMessage: 'Save articles from the admin workspace.' })
}
