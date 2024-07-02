import { z } from 'zod';

export const IntegrationItem = z.object({
  image: z.string(),
  label: z.string(),
});

export const IntegrationData = z.object({
  blockchains: z.array(IntegrationItem),
  exchanges: z.array(IntegrationItem),
  protocols: z.array(IntegrationItem),
});

export type IntegrationData = z.infer<typeof IntegrationData>;
