import {
  addComponent,
  addImports,
  addPlugin,
  addTypeTemplate,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit';
import * as components from '@rotki/ui-library/components';
import * as composables from '@rotki/ui-library/composables';
import { ruiIconsPlugin } from '@rotki/ui-library/vite-plugin';
import defu from 'defu';

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  // Default configuration options of the Nuxt module
  defaults: {},
  meta: {
    configKey: '@rotki/ui-library',
    name: '@rotki/ui-library',
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url);

    addPlugin(resolver.resolve('./runtime/plugin'));
    addVitePlugin(ruiIconsPlugin());

    const typeDst = addTypeTemplate({
      filename: 'types/rotki-icons.d.ts',
      getContents: () => '/// <reference types="@rotki/ui-library/vite-plugin/client" />',
    }).dst;

    nuxt.options.typescript.tsConfig = defu(
      nuxt.options.typescript.tsConfig,
      { include: [typeDst] },
    );

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
