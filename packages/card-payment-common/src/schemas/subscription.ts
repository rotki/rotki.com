import { z } from 'zod';

const StringArray = z.array(z.string());

// Subscription status enum
export const SubscriptionStatusSchema = z.enum([
  'Active',
  'Cancelled',
  'Cancelled but still active',
  'Pending',
  'Past Due',
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// Subscription schema - flexible to support both package needs
export const SubscriptionSchema = z.object({
  actions: StringArray,
  createdDate: z.string().datetime({ offset: true }),
  durationInMonths: z.number().nonnegative(),
  id: z.number().or(z.string()).transform(String),
  isActive: z.boolean(),
  isLegacy: z.boolean(),
  isSoftCanceled: z.boolean().default(false),
  nextActionDate: z.string(),
  nextBillingAmount: z.number(),
  paymentProvider: z.string(),
  pending: z.boolean().default(false),
  planName: z.string(),
  status: SubscriptionStatusSchema,
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// User subscriptions array
export const UserSubscriptionsSchema = z.array(SubscriptionSchema);

export type UserSubscriptions = z.infer<typeof UserSubscriptionsSchema>;

// User subscriptions response wrapper
export const UserSubscriptionsResponseSchema = z.object({
  message: z.string().optional(),
  result: UserSubscriptionsSchema.optional(),
});

export type UserSubscriptionsResponse = z.infer<typeof UserSubscriptionsResponseSchema>;
