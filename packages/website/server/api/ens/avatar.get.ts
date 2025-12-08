import { z } from 'zod';
import { imageCoreService } from '~~/server/features/sponsorship/images/core';
import { handleApiError } from '~~/server/utils/errors';

// Request validation schema
const QuerySchema = z.object({
  name: z.string().regex(/^[\dA-Za-z-]+\.[\dA-Za-z]+$/, 'Invalid ENS name format'),
  network: z.enum(['mainnet', 'sepolia']).default('mainnet').optional(),
});

export default defineEventHandler(async (event) => {
  let ensName: string | undefined;

  try {
    // Validate query parameters
    const { name, network = 'mainnet' } = await getValidatedQuery(event, data => QuerySchema.parse(data));
    ensName = name;

    // Construct ENS metadata URL
    const metadataUrl = `https://metadata.ens.domains/${network}/avatar/${ensName}`;

    // Check conditional request headers for cached metadata (including cached 404s)
    if (await imageCoreService.handleConditionalRequest(event, metadataUrl)) {
      return; // 304 response already sent
    }

    // Use the image core service to handle streaming and caching
    await imageCoreService.streamImageWithCache(event, metadataUrl);
  }
  catch (error: any) {
    // Set cache headers for error responses to prevent caching errors
    setResponseHeaders(event, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });

    // Handle 404 errors specifically (ENS name has no avatar)
    if (error.statusCode === 404 || error.statusMessage?.includes('404')) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No avatar found for this ENS name',
      });
    }

    // Use enhanced error handling for other errors
    handleApiError(event, error);
  }
});
