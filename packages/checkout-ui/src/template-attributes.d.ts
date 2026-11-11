/*
 * Strict templates reject attributes an element's or component's type does not list, and neither
 * lists `data-*` attributes. The templates use them as test and styling hooks (`data-testid`, `data-id`),
 * so elements accept any of them and components the two the templates put on them. On a component
 * the name arrives camelized (`dataTestid`).
 */
export {};

declare module '@vue/runtime-dom' {
  interface HTMLAttributes {
    [key: `data-${string}`]: string | number | boolean | undefined;
  }
}

declare module '@vue/runtime-core' {
  interface AllowedComponentProps {
    dataTestid?: string;
    dataId?: string | number;
  }
}
