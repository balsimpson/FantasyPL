export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const imageUrl = query.url as string;

	if (!imageUrl) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Image URL is required'
		});
	}

	try {
		// Fetch the image from the external source
		const response = await fetch(imageUrl);
		
		if (!response.ok) {
			throw createError({
				statusCode: response.status,
				statusMessage: 'Failed to fetch image'
			});
		}

		const imageBuffer = await response.arrayBuffer();
		const contentType = response.headers.get('content-type') || 'image/png';

		// Set appropriate headers
		setHeader(event, 'Content-Type', contentType);
		setHeader(event, 'Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

		return Buffer.from(imageBuffer);
	} catch (error) {
		console.error('Error proxying image:', error);
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to proxy image'
		});
	}
});
