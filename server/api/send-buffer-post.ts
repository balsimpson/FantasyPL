export default defineEventHandler(async (event) => {
  const { caption, image_url } = await readBody(event);
  const webhookUrl = useRuntimeConfig().public.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MAKE_WEBHOOK_URL is not configured' });
  }

  const params = new URLSearchParams({ caption: caption || '', image_url: image_url || '' }).toString();
  const response = await $fetch.raw(`${webhookUrl}?${params}`, { method: 'GET' });

  if (response.status < 200 || response.status >= 300) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Buffer returned ${response.status}`,
    });
  }

  return response._data ?? { success: true };
});
