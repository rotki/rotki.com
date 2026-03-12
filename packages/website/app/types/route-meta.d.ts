declare module '#app' {
  interface PageMeta {
    landing?: boolean;
    auth?: boolean;
    guestOnly?: boolean;
    requiresVerified?: boolean;
    requiresSubscriber?: boolean;
    backendRequired?: boolean;
  }
}

export {};
