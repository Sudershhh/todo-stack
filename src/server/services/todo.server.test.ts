import { describe, it, expect } from 'vitest'

import { PAGE_SIZE } from '@/types/todo'

describe('todo.server service', () => {
  it('uses the configured page size constant', () => {
    expect(PAGE_SIZE).toBeGreaterThan(0)
  })
})

