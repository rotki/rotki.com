export type PlanType = 'regular' | 'free' | 'custom';

export type FeatureValue = string | number | boolean | undefined;

export type PlanBase = Omit<MappedPlan, 'features'>;

export type FeatureDescriptionMap = Map<string, Map<string, FeatureValue>>;

export interface MappedPlan {
  id?: number;
  name: string;
  displayedName: string;
  mainPriceDisplay: string;
  type: PlanType;
  isMostPopular: boolean;
  hidden: boolean;
  secondaryPriceDisplay?: string;
  features: FeatureValue[];
}
