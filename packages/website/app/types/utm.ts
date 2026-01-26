export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
  capturedAt?: string;
}

export interface TrackingSession {
  sessionId: string;
  utm: UtmParams;
}
