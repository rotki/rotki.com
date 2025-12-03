import { z } from 'zod';

const Action = z.object({
  text: z.string(),
  url: z.string(),
});

const VisiblityPeriod = z.object({
  end: z.number().positive(),
  start: z.number().positive(),
});

export type VisibilityPeriod = z.infer<typeof VisiblityPeriod>;

const DashboardMessage = z.object({
  action: Action.optional(),
  message: z.string(),
  messageHighlight: z.string().optional(),
  period: VisiblityPeriod,
});

export type DashboardMessage = z.infer<typeof DashboardMessage>;

export const DashboardSchema = z.array(DashboardMessage);

export type DashboardSchema = z.infer<typeof DashboardSchema>;
