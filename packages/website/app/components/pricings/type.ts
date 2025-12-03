export type PlanType = 'regular' | 'free' | 'custom';

export type FeatureValue = string | number | boolean | undefined;

export interface PlanPrices {
  monthlyPrice: number;
  yearlyPrice: number;
}

export type PlanBase = Omit<MappedPlan, 'features'>;

export type FeatureDescriptionMap = Map<string, Map<string, FeatureValue>>;

export interface MappedPlan {
  id?: number;
  name: string;
  displayedName: string;
  mainPriceDisplay: string;
  type: PlanType;
  isMostPopular: boolean;
  secondaryPriceDisplay?: string;
  features: FeatureValue[];
}
