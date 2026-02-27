export const todoKeys = {
  all: () => ['todos'] as const,
  lists: () => [...todoKeys.all(), 'list'] as const,
  list: (filters?: object) =>
    [...todoKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...todoKeys.all(), 'detail', id] as const,
}

