export default defineEventHandler(event => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const config = useRuntimeConfig(event)
  return { loginReady: Boolean(config.adminGithubId && config.oauth.github.clientId && config.oauth.github.clientSecret) }
})
