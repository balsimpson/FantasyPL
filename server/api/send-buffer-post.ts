export default defineEventHandler(async (event) => {
  const { caption, image_url } = await readBody(event);
  const config = useRuntimeConfig();
  const webhookUrl = config.MAKE_WEBHOOK_URL || config.public.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    throw createError({ statusCode: 500, statusMessage: 'MAKE_WEBHOOK_URL is not configured' });
  }

  if (!image_url) {
    throw createError({ statusCode: 400, statusMessage: 'image_url is required' });
  }

  const params = new URLSearchParams({ caption: caption || '', image_url: image_url || '' }).toString();
  let response;

  try {
    response = await $fetch.raw(`${webhookUrl}?${params}`, {
      method: 'GET',
      timeout: 8_000,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      return {
        success: true,
        queued: true,
        warning: 'Buffer webhook did not respond before the Vercel limit',
      };
    }

    throw error;
  }

  if (response.status < 200 || response.status >= 300) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Buffer returned ${response.status}`,
    });
  }

  return response._data ?? { success: true };
});
