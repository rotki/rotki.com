export interface RegularPlan {
  name: string;
  displayedName: string;
  mainPriceDisplay: string;
  secondaryPriceDisplay: string;
  isMostPopular: boolean;
  features: any[][];
}

export interface StarterPlan {
  name: string;
  displayedName: string;
  mainPriceDisplay: string;
  isStarter: true;
  features: any[][];
}

export interface CustomPlan {
  name: string;
  displayedName: string;
  isCustom: true;
  features: any[][];
}

export type MappedPlan = StarterPlan | RegularPlan | CustomPlan;
