export default defineAppConfig({
  ui: {
    colors: { neutral: 'zinc' },
    input: {
      slots: {
        root: 'w-full',
        base: 'w-full rounded-xl bg-default text-highlighted placeholder:text-muted hover:bg-elevated focus-visible:ring-2 focus-visible:ring-primary',
      },
    },
    textarea: {
      slots: {
        root: 'w-full',
        base: 'w-full rounded-xl bg-default text-highlighted placeholder:text-muted hover:bg-elevated focus-visible:ring-2 focus-visible:ring-primary',
      },
    },
    select: {
      slots: {
        base: 'w-full rounded-xl bg-default text-highlighted hover:bg-elevated focus-visible:ring-2 focus-visible:ring-primary',
        content: 'bg-default text-highlighted ring-default',
        item: 'text-default data-highlighted:not-data-disabled:text-highlighted data-highlighted:not-data-disabled:before:bg-elevated',
        placeholder: 'text-muted',
      },
    },
  },
});
