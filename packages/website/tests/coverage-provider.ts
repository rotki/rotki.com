import v8CoverageModule from '@vitest/coverage-v8';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';

/* Vitest types are taken from the V8 provider rather than imported from `vitest/node`: the lockfile
   holds several copies of vitest (one per @types/node version), and their classes do not type-check
   against each other. */
type Vitest = Parameters<V8CoverageProvider['createUncoveredFileTransformer']>[0];

type UncoveredFileTransformer = ReturnType<V8CoverageProvider['createUncoveredFileTransformer']>;

/** Test environments that run in a DOM, whose modules Vite compiles for the client. */
const CLIENT_ENVIRONMENTS = new Set(['happy-dom', 'jsdom', 'nuxt']);

/**
 * The V8 coverage provider, compiling files no test loaded the same way as the ones tests did load.
 *
 * @remarks
 * Vitest still compiles untested files to list their lines as uncovered, choosing Vite's `client` or
 * `ssr` compilation by environment name: only `jsdom` and `happy-dom` count as client. The `nuxt`
 * environment from `@nuxt/test-utils` runs on happy-dom and declares itself a client environment, but
 * by name it gets the SSR compilation. For a Vue file that is a different render function, so an
 * untested component reported lines the browser never runs (115 of 116 Vue files whose unit and e2e
 * lines disagreed were untested ones), and Codecov could not line the unit report up with the e2e one.
 *
 * Everything else is the stock provider: tested files, the runtime collection and the reports.
 */
class ClientAwareCoverageProvider extends V8CoverageProvider {
  override createUncoveredFileTransformer(ctx: Vitest): UncoveredFileTransformer {
    const projects = new Set([...ctx.projects, ctx.getRootProject()]);
    return async (filename) => {
      let lastError: unknown;
      for (const project of projects) {
        const { environment, root } = project.config;
        if (!filename.startsWith(root) && !filename.startsWith(`/${root}`))
          continue;
        try {
          const viteEnvironment = CLIENT_ENVIRONMENTS.has(environment) || project.isBrowserEnabled() ? 'client' : 'ssr';
          return await this.transformFile(filename, project, viteEnvironment);
        }
        catch (error) {
          lastError = error;
        }
      }
      throw lastError instanceof Error ? lastError : new Error(`No project could transform ${filename}`, { cause: lastError });
    };
  }
}

const coverageProviderModule: typeof v8CoverageModule = {
  ...v8CoverageModule,
  getProvider: () => new ClientAwareCoverageProvider(),
};

export default coverageProviderModule;
