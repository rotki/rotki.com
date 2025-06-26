export type PlanType = 'regular' | 'free' | 'custom';

export interface MappedPlan {
  name: string;
  displayedName: string;
  mainPriceDisplay: string;
  features: any[][];
  type: PlanType;
  isMostPopular?: boolean;
  secondaryPriceDisplay?: string;
}
