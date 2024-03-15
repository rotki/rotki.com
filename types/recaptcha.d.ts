declare global {
  interface Window {
    grecaptcha: {
      render: (
        el: string | HTMLElement,
        options: {
          'sitekey': string;
          'callback': (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          'theme'?: 'light' | 'dark';
          'size'?: 'compact' | 'normal';
        },
      ) => number;
      reset: (id?: number) => void;
    };

    onRecaptchaLoaded: () => void;
  }
}

export default {};
