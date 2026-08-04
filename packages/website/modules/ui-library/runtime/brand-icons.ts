/**
 * Brand logos, registered by this app rather than by `@rotki/ui-library`.
 *
 * lucide v1 removed every brand/logo glyph on purpose — brand marks are
 * third-party trademarks with their own usage rules — and the library followed
 * suit, dropping the logos it used to ship as custom SVGs. Anything an app
 * renders must now be registered here or it renders blank.
 *
 * The marks are used nominatively: each one links to the corresponding service
 * or indicates a platform.
 *
 * Crypto network marks (`lu-bitcoin-accounts`, `lu-solana-accounts-fill`,
 * `lu-substrate-accounts`) stay in the library and need no registration.
 */

interface BrandIcon {
  name: string;
  components: [string, Record<string, string>][];
}

export const github: BrandIcon = {
  name: 'lu-github',
  components: [
    ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' }],
    ['path', { d: 'M9 18c-4.51 2-5-2-7-2' }],
  ],
};

export const discord: BrandIcon = {
  name: 'lu-discord',
  components: [
    ['path', { d: 'M15.5007 17.75L16.7941 19.5205C16.9155 19.7127 17.1488 19.7985 17.3618 19.7224C18.1656 19.4353 20.1579 18.6572 21.7983 17.4725C21.9262 17.3801 22.0001 17.2261 21.9991 17.0673C21.9991 8.25 19.5007 5.75 19.5007 5.75C19.5007 5.75 17.5007 4.60213 15.3546 4.25602C15.1435 4.22196 14.9367 4.33509 14.8428 4.52891L14.3978 5.44677C14.3978 5.44677 13.2852 5.21397 11.9999 5.21397C10.7146 5.21397 9.60204 5.44677 9.60204 5.44677L9.15705 4.52891C9.06308 4.33509 8.85638 4.22196 8.64523 4.25602C6.50073 4.60187 4.50073 5.75 4.50073 5.75C4.50073 5.75 2.00074 8.25 2.00074 17.0673C1.99974 17.2261 2.07359 17.3801 2.20153 17.4725C3.8419 18.6572 5.83424 19.4353 6.638 19.7224C6.85099 19.7985 7.08431 19.7127 7.20576 19.5205L8.50073 17.75 M17.5007 16.75C17.5007 16.75 15.2056 18.25 12.0007 18.25C8.79581 18.25 6.50073 16.75 6.50073 16.75 M17.2507 12.25C17.2507 13.3546 16.4672 14.25 15.5007 14.25C14.5342 14.25 13.7507 13.3546 13.7507 12.25C13.7507 11.1454 14.5342 10.25 15.5007 10.25C16.4672 10.25 17.2507 11.1454 17.2507 12.25Z M10.2507 12.25C10.2507 13.3546 9.46723 14.25 8.50073 14.25C7.53424 14.25 6.75073 13.3546 6.75073 12.25C6.75073 11.1454 7.53424 10.25 8.50073 10.25C9.46723 10.25 10.2507 11.1454 10.2507 12.25Z', stroke: 'currentColor' }],
  ],
};

export const xTwitter: BrandIcon = {
  name: 'lu-x-twitter',
  components: [
    ['path', { 'd': 'M3 21L10.5484 13.4516M10.5484 13.4516L3 3H8L13.4516 10.5484M10.5484 13.4516L16 21H21L13.4516 10.5484M21 3L13.4516 10.5484', 'stroke': 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
  ],
};

export const reddit: BrandIcon = {
  name: 'lu-reddit',
  components: [
    ['path', { d: 'M12 8c2.648 0 5.028 .826 6.675 2.14a2.5 2.5 0 0 1 2.326 4.36c0 3.59 -4.03 6.5 -9 6.5c-4.875 0 -8.845 -2.8 -9 -6.294l-1 -.206a2.5 2.5 0 0 1 2.326 -4.36c1.646 -1.313 4.026 -2.14 6.674 -2.14l.999 0 M12 8l1 -5l6 1 M18 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M8.5 13a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0 M14.5 13a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0 M10 17c.667 .333 1.333 .5 2 .5s1.333 -.167 2 -.5', stroke: 'currentColor' }],
  ],
};

export const paypal: BrandIcon = {
  name: 'lu-paypal',
  components: [
    ['path', { 'd': 'M6.29358 4.83499L4.16511 17.6712C3.98586 18.7522 3.89623 19.2927 4.19427 19.6464C4.49231 20 5.03749 20 6.12785 20H6.53027C7.35308 20 7.76448 20 8.04501 19.7555C8.32554 19.5109 8.38372 19.1016 8.50008 18.2828L8.96761 14.9934C9.00457 14.7333 9.02305 14.6033 9.05213 14.492C9.26041 13.6948 9.93391 13.1077 10.7485 13.0132C10.8622 13 10.9929 13 11.2543 13H12.4163C15.5113 13 18.1943 10.8473 18.8803 7.81384C19.5536 4.83576 17.3016 2 14.2631 2H9.62312C8.5093 2 7.95239 2 7.51383 2.2348C7.26304 2.36907 7.04377 2.55577 6.87077 2.78235C6.56824 3.17856 6.47669 3.7307 6.29358 4.83499Z', 'stroke': 'currentColor', 'stroke-width': '1.5' }],
    ['path', { 'd': 'M8.24315 19.4988L8.01451 20.8315C7.90978 21.4419 8.38532 21.9988 9.01128 21.9988H11.0018C11.4961 21.9988 11.9179 21.6454 11.9991 21.1632L12.7285 16.8344C12.8098 16.3523 13.2316 15.9988 13.7258 15.9988H15.5289C18.11 15.9988 20.3448 14.2257 20.9047 11.7335C21.2967 9.98906 20.4437 8.30895 19 7.5', 'stroke': 'currentColor', 'stroke-width': '1.5' }],
  ],
};

export const osApple: BrandIcon = {
  name: 'lu-os-apple',
  components: [
    ['path', { 'd': 'M12 5.75C12 3.75 13.5 1.75 15.5 1.75C15.5 3.75 14 5.75 12 5.75Z', 'stroke': 'currentColor', 'stroke-width': '1.5', 'stroke-linejoin': 'round' }],
    ['path', { 'd': 'M12.5 8.09001C11.9851 8.09001 11.5867 7.92646 11.1414 7.74368C10.5776 7.51225 9.93875 7.25 8.89334 7.25C7.02235 7.25 4 8.74945 4 12.7495C4 17.4016 7.10471 22.25 9.10471 22.25C9.77426 22.25 10.3775 21.9871 10.954 21.7359C11.4815 21.5059 11.9868 21.2857 12.5 21.2857C13.0132 21.2857 13.5185 21.5059 14.046 21.7359C14.6225 21.9871 15.2257 22.25 15.8953 22.25C17.2879 22.25 18.9573 19.8992 20 16.9008C18.3793 16.2202 17.338 14.618 17.338 12.75C17.338 11.121 18.2036 10.0398 19.5 9.25C18.5 7.75 17.0134 7.25 15.9447 7.25C14.8993 7.25 14.2604 7.51225 13.6966 7.74368C13.2514 7.92646 13.0149 8.09001 12.5 8.09001Z', 'stroke': 'currentColor', 'stroke-width': '1.5', 'stroke-linejoin': 'round' }],
  ],
};

export const osWindows: BrandIcon = {
  name: 'lu-os-windows',
  components: [
    ['path', { 'd': 'M18.6712 3.02771L4.6712 5.36104C3.70683 5.52177 3 6.35615 3 7.33383V16.6667C3 17.6443 3.70683 18.4787 4.6712 18.6395L18.6712 20.9728C19.8903 21.176 21 20.2359 21 19V5.00049C21 3.76462 19.8903 2.82453 18.6712 3.02771Z', 'stroke': 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
    ['path', { 'd': 'M11 4.5V19.5M3 12H21', 'stroke': 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
  ],
};

export const brandIcons: BrandIcon[] = [github, discord, xTwitter, reddit, paypal, osApple, osWindows];

/** Names the vite plugin must allow-list so it does not try to import them from the library. */
export const brandIconNames: string[] = brandIcons.map(icon => icon.name);
