export default defineOAuthGitHubEventHandler({
  config: { scope: [] },
  async onSuccess(event, { user }) {
    const allowedId = useRuntimeConfig(event).adminGithubId
    if (!allowedId || String(user.id) !== String(allowedId)) {
      await clearUserSession(event)
      return sendRedirect(event, '/admin/login?error=access')
    }
    await replaceUserSession(event, { user: { githubId: String(user.id), login: user.login, name: user.name || user.login, avatarUrl: user.avatar_url } })
    return sendRedirect(event, '/admin/research')
  },
  onError(event) {
    return sendRedirect(event, '/admin/login?error=login')
  },
})
