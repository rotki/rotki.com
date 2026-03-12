import type { MaybeRefOrGetter } from 'vue';

interface UseHeadingsReturn {
  generate: Ref<boolean>;
}

export function useHeadings(id: MaybeRefOrGetter<string | undefined>, anchor: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'): UseHeadingsReturn {
  const { headings } = useRuntimeConfig().public.mdc;
  const generate = computed<boolean>(() => {
    if (!toValue(id))
      return false;
    if (!headings?.anchorLinks || typeof headings.anchorLinks !== 'object')
      return false;
    return headings.anchorLinks[anchor] ?? false;
  });
  return {
    generate,
  };
}
