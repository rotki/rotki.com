# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **rotki.com** website - a Nuxt 3 website for a cryptocurrency portfolio management service. The site handles premium subscriptions, payment processing, user account management, and content delivery.

## Development Commands

### Core Development

```bash
pnpm dev          # Start development server
pnpm build        # Production build with type checking
pnpm preview      # Preview production build
```

### Code Quality

```bash
pnpm lint         # Lint TypeScript/Vue files
pnpm lint:fix     # Fix linting issues
pnpm typecheck    # Type checking without build
pnpm test         # Run unit tests with Vitest
pnpm test:watch   # Run tests in watch mode
```

### Testing

```bash
pnpm cypress:run  # Run e2e tests headless
pnpm cypress:open # Open Cypress UI
```

### Release Management

```bash
pnpm release      # Bump version and generate changelog
```

## Architecture Overview

### Tech Stack

- **Framework**: Nuxt 3.17.5 with Vue 3.5.17 and TypeScript
- **UI Library**: @rotki/ui-library (custom component library)
- **Styling**: TailwindCSS + SCSS
- **State Management**: Pinia with composition API
- **Content**: @nuxt/content for markdown-based content
- **Payment**: Braintree, PayPal, and crypto payments (Ethers.js)
- **Testing**: Vitest + Cypress
- **Package Manager**: pnpm

### Key Architectural Patterns

1. **Component Organization**: Components organized by feature domain (`components/account/`, `components/checkout/`, etc.)

2. **Composables Pattern**: Business logic extracted into composables:

   - `useAuth()` - Authentication state
   - `useWeb3Payment()` - Crypto payment handling
   - `useRotkiSponsorship()` - NFT sponsorship functionality

3. **Type Safety**: Comprehensive TypeScript with Zod schemas for runtime validation

4. **Content Management**: Markdown-based content with dynamic loading from local/remote sources

5. **Payment Processing**: Multi-method payment system with proper error handling and state management

### Store Structure

The main Pinia store (`store/index.ts`) handles:

- User authentication and session management
- Account data and preferences
- Payment processing and plan management
- Auto-logout functionality

### Web3 Integration

- **Wallet Connection**: @reown/appkit for wallet connections
- **Multi-chain Support**: Ethereum, Arbitrum, Base, Optimism, Gnosis
- **Payment Tokens**: ETH and USDC support
- **Network Switching**: Automatic network detection and switching

## Development Guidelines

### File Structure Conventions

- `components/` - Organized by feature (account, checkout, common, content)
- `composables/` - Business logic and state management
- `pages/` - File-based routing with nested layouts
- `layouts/` - Shared layouts (default, account, landing, jobs, sponsor)
- `types/` - TypeScript type definitions
- `utils/` - Pure utility functions

### Vue/TypeScript Coding Standards

#### Component Setup Script Order

Follow this order in `<script setup>`:

1. Imports
2. Definitions (`defineOptions`, `defineProps`, `defineEmits`)
3. I18n & vue-router
4. Reactive state variables
5. Pinia stores
6. Composables
7. Computed properties
8. Methods
9. Watchers
10. Lifecycle hooks
11. Exposed methods

#### Component Patterns

- Use `<script setup>` syntax for all components
- Props defined with TypeScript interfaces using `defineProps<{}>()` syntax
- Emit events with explicit typing using short-style syntax:

```typescript
const emit = defineEmits<{
  'update:msg': [msg: string];
}>();
```

#### Explicit TypeScript Typing Requirements

- **Always use explicit types for refs**: `ref<boolean>(false)` instead of `ref(false)`
- **Always use explicit types for computed**: `computed<boolean>(() => ...)` instead of `computed(() => ...)`
- **Always return explicit types from functions**: `function getName(): string { ... }`
- **Always type reactive variables**: `const isLoading = ref<boolean>(false)`
- **Always type computed properties**: `const fullName = computed<string>(() => ...)`

#### VueUse get/set Pattern

- **Always use `get()` and `set()` from VueUse** instead of `.value` for reading and updating reactive properties
- Import `get` and `set` from `@vueuse/shared`
- This provides better consistency and readability across the codebase

#### Prefer `undefined` instead of `null`

- If you have to create a ref where there is a possibility for it to be empty, always use `const name = ref<string>()` instead of `const name = ref<string | null>(null)`.

#### Correct Examples:

```typescript
// ✅ Correct - Explicit typing with VueUse get/set
import { get, set } from '@vueuse/shared';

const isVisible = ref<boolean>(true);
const count = ref<number>(0);
const items = ref<string[]>([]);
const user = ref<User>();

const isEven = computed<boolean>(() => get(count) % 2 === 0);
const formattedName = computed<string>(() => `${get(firstName)} ${get(lastName)}`);

function getUserById(id: number): User | undefined {
  return get(users).find(user => user.id === id) || undefined;
}

function updateCount(newValue: number): void {
  set(count, newValue);
}

async function fetchData(): Promise<ApiResponse> {
  return await $fetch('/api/data');
}
```

#### Incorrect Examples:

```typescript
// ❌ Incorrect - Missing explicit types
const isVisible = ref(true);
const count = ref(0);
const items = ref([]);
const user = ref();

const isEven = computed(() => count.value % 2 === 0);
const formattedName = computed(() => `${firstName.value} ${lastName.value}`);

function getUserById(id: number) {
  return users.value.find(user => user.id === id) || undefined;
}

async function fetchData() {
  return await $fetch('/api/data');
}
```

#### Pinia Store Structure

Follow this order in Pinia stores using `defineStore` with composition API:

```typescript
import { get, set } from '@vueuse/shared';

export const useCounterStore = defineStore('counter', () => {
  // 1. State
  const count = ref<number>(0);
  const name = ref<string>('');

  // 2. Getters
  const doubleCount = computed<number>(() => get(count) * 2);
  const isEven = computed<boolean>(() => get(count) % 2 === 0);

  // 3. Actions
  function increment(): void {
    set(count, get(count) + 1);
  }

  async function fetchData(): Promise<void> {
    // async logic
  }

  // 4. Watchers
  watch(count, (newCount) => {
    console.log('Count changed:', newCount);
  });

  return {
    // State
    count,
    // Getters
    doubleCount,
    fetchData,
    // Actions
    increment,
    isEven,
    name,
  };
});
```

### State Management

- Use Pinia stores for global state
- Composables for component-specific state
- VueUse utilities for common reactive patterns

### Error Handling

- Global error boundaries implemented
- User-friendly error messages with i18n
- Proper logging with configurable levels

### Form Validation

- Vuelidate for client-side validation
- Zod schemas for API data validation
- Accessible form components with proper ARIA attributes

### Payment Integration

- Braintree SDK for card payments
- PayPal integration for alternative payments
- Crypto payments with proper network validation
- CSRF protection for all payment endpoints

## Important Configuration

### Environment Variables

```env
NUXT_PUBLIC_BASE_URL=http://localhost:3000
NUXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_key
PROXY_DOMAIN=rotki.com  # or staging.rotki.com
PROXY_INSECURE=true     # for http proxy in development
```

### Runtime Config

- `nuxt.config.ts` contains environment-specific settings
- API proxy configuration for backend integration
- reCAPTCHA and OAuth client configuration

## Content Management

### Content Structure

- `content/` directory for markdown files
- Collections: documents, jobs, testimonials, legal
- Dynamic content loading with remote/local fallback
- Configurable content sources via environment variables

### Content Types

- **Documents**: General site content
- **Jobs**: Job postings with structured data
- **Testimonials**: Customer testimonials
- **Legal**: Privacy policy, terms of service

## Testing Strategy

### Unit Tests (Vitest)

- Test utilities and composables
- Component testing with Vue Test Utils
- API mocking with MSW

### E2E Tests (Cypress)

- Critical user flows (registration, payment, subscription)
- Cross-browser compatibility
- Mobile responsiveness testing

## Payment Processing

### Supported Payment Methods

1. **Credit/Debit Cards**: Braintree integration
2. **PayPal**: Direct PayPal integration
3. **Cryptocurrency**: ETH and USDC on multiple networks

### Payment Flow

1. Plan selection with proper validation
2. Payment method selection
3. Payment processing with proper error handling
4. Subscription activation and confirmation

### Security Considerations

- CSRF protection on all payment endpoints
- PCI compliance through Braintree
- Secure session management with auto-logout
- Content Security Policy implementation

## Internationalization

### Current Setup

- Single locale (en-US) with extensible i18n structure
- Translation files in JSON format (`i18n/locales/`)
- Proper pluralization and interpolation support

### Key i18n Patterns

- Use `useI18n()` composable in components
- Namespace translations by feature
- Include translation keys in component props for reusability

## Deployment

### Build Process

- **SSR (Server-Side Rendering)** with `pnpm build` for production
- **Universal rendering** for optimal SEO and performance
- Proper asset optimization and code splitting
- Environment-specific configuration handling

### Docker Support

- Dockerfile included for containerized deployment
- PM2 ecosystem configuration for process management
- SSR-enabled Node.js server for production

## Common Development Tasks

### Adding New Payment Methods

1. Update payment types in `types/index.ts`
2. Add UI components in `components/checkout/`
3. Create composable for payment logic
4. Update store methods for state management
5. Add proper error handling and validation

### Adding New Content Types

1. Create content collection in `content/`
2. Add type definitions in `types/`
3. Create display components in `components/content/`
4. Update content queries in pages

### Web3 Integration

- Use `useWeb3Connection()` composable for wallet connections
- Handle network switching and validation
- Implement proper error handling for blockchain interactions
- Use `useRotkiSponsorship()` for NFT-related functionality

## Security Best Practices

- Always validate user input with Zod schemas
- Use CSRF tokens for state-changing operations
- Implement proper session management
- Sanitize user content before rendering
- Use environment variables for sensitive configuration
