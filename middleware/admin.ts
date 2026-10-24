export default defineNuxtRouteMiddleware(async () => {
  const fetch = useRequestFetch()
  try { await fetch('/api/admin/session') }
  catch (error: any) {
    if ([401, 403].includes(error.statusCode || error.response?.status)) return navigateTo('/admin/login')
    throw createError({ statusCode: 503, statusMessage: 'Admin access could not be checked. Please reload.' })
  }
})
