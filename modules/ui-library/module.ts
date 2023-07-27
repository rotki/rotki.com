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
  meta: {
    name: '@rotki/ui-library',
    configKey: '@rotki/ui-library',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup() {
    const resolver = createResolver(import.meta.url);

    addPlugin(resolver.resolve('./runtime/plugin'));

    for (const component in components) {
      await addComponent({
        name: component,
        export: component,
        filePath: '@rotki/ui-library/components',
      });
    }

    for (const composable in composables) {
      addImports({
        name: composable,
        as: composable,
        from: '@rotki/ui-library/composables',
      });
    }
  },
});
