export type PlanType = 'regular' | 'free' | 'custom';

export type FeatureValue = string | number | boolean | undefined;

export interface MappedPlan {
  name: string;
  displayedName: string;
  mainPriceDisplay: string;
  type: PlanType;
  isMostPopular: boolean;
  secondaryPriceDisplay?: string;
  features: FeatureValue[];
}
