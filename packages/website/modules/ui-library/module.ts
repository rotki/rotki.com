import {
  addComponent,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit';
import * as components from '@rotki/ui-library/components';
import * as composables from '@rotki/ui-library/composables';

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  // Default configuration options of the Nuxt module
  defaults: {},
  meta: {
    configKey: '@rotki/ui-library',
    name: '@rotki/ui-library',
  },
  async setup() {
    const resolver = createResolver(import.meta.url);

    addPlugin(resolver.resolve('./runtime/plugin'));

    for (const component in components) {
      addComponent({
        export: component,
        filePath: '@rotki/ui-library/components',
        name: component,
      });
    }

    for (const composable in composables) {
      if (composable === 'default') {
        continue;
      }
      addImports({
        as: composable,
        from: '@rotki/ui-library/composables',
        name: composable,
      });
    }
  },
});
