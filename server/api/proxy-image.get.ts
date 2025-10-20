export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const imageUrl = query.url as string;

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing image URL parameter'
    });
  }

  try {
    // Fetch the image from the external URL
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch image: ${response.statusText}`
      });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Set appropriate headers
    setHeader(event, 'Content-Type', contentType);
    setHeader(event, 'Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    setHeader(event, 'Access-Control-Allow-Origin', '*');
    setHeader(event, 'Access-Control-Allow-Methods', 'GET');
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type');

    // Return the image data
    return Buffer.from(imageBuffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to proxy image'
    });
  }
});