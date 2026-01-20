# Testing Patterns

**Analysis Date:** 2026-01-20

## Test Framework

**Runner:**
- Not configured
- No test framework detected in `package.json`
- No test configuration files found (jest.config.*, vitest.config.*, etc.)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test scripts defined in package.json
# Current scripts:
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

## Test File Organization

**Location:**
- No test files found in the codebase
- Pattern: Not established

**Naming:**
- Not established (no test files exist)

**Structure:**
- Not established

## Test Structure

**Suite Organization:**
- Not applicable - no tests exist

**Recommended Pattern for this codebase (based on structure):**
```typescript
// Example: src/features/groups/hooks/__tests__/useGroups.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { useGroups } from '../useGroups';

describe('useGroups', () => {
  describe('fetchGroups', () => {
    it('should return empty array when user is not authenticated', async () => {
      // ...
    });

    it('should fetch groups for authenticated user', async () => {
      // ...
    });
  });

  describe('createGroup', () => {
    it('should create a group and refresh the list', async () => {
      // ...
    });
  });
});
```

## Mocking

**Framework:**
- Not configured

**Recommended Mocking Approach:**
```typescript
// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock useAuth hook
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));
```

**What to Mock:**
- Supabase client (`@/lib/supabase`)
- Auth context/hooks
- Toast context for notification assertions
- External API calls (Gemini AI service)
- Browser APIs (localStorage, FileReader, Canvas for image utils)

**What NOT to Mock:**
- React hooks (useState, useEffect, useMemo)
- Pure utility functions (`formatCurrency`, `getCategoryConfig`)
- Type definitions

## Fixtures and Factories

**Test Data:**
- Mock data exists in `src/lib/constants.ts` (can be used as fixtures)
```typescript
// src/lib/constants.ts
export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Vos',
  avatar: '...',
};

export const GROUP_MEMBERS: User[] = [...];
export const MOCK_TRANSACTIONS: Transaction[] = [...];
export const MOCK_GROUPS: Group[] = [...];
```

**Recommended Test Factory Pattern:**
```typescript
// src/__tests__/factories/user.ts
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  name: 'Test User',
  avatar: 'https://example.com/avatar.png',
  email: 'test@example.com',
  ...overrides,
});

// src/__tests__/factories/group.ts
export const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: 'test-group-id',
  name: 'Test Group',
  type: 'other',
  members: [createMockUser()],
  userBalance: 0,
  currency: 'ARS',
  lastActivity: 'Hace 1 hora',
  createdBy: 'test-user-id',
  ...overrides,
});
```

**Location:**
- Fixtures currently in `src/lib/constants.ts`
- Recommended: `src/__tests__/fixtures/` or `src/__tests__/factories/`

## Coverage

**Requirements:**
- None enforced (no test configuration)

**View Coverage:**
```bash
# Not configured
# Recommended setup with Vitest:
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Not implemented
- Recommended scope:
  - Custom hooks (`useGroups`, `useTransactions`, `usePersonalTransactions`, `useCategoryStats`)
  - Utility functions (`compressToWebP`, `getCategoryConfig`, `formatCurrency`)
  - AI service functions (`validateGeminiKey`, `getGeminiClient`)

**Integration Tests:**
- Not implemented
- Recommended scope:
  - Page components with data fetching
  - Form submissions (CreateGroupModal, TransactionModal)
  - Auth flow (login, logout, protected routes)

**E2E Tests:**
- Not implemented
- Framework recommendation: Playwright or Cypress
- Recommended scope:
  - Complete user flows (onboarding, create group, add transaction)
  - Auth flows with Supabase

## Common Patterns

**Async Testing (Recommended):**
```typescript
// For hooks that fetch data
import { renderHook, waitFor } from '@testing-library/react';

it('should fetch transactions', async () => {
  const { result } = renderHook(() => usePersonalTransactions());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.transactions).toHaveLength(expectedLength);
});
```

**Error Testing (Recommended):**
```typescript
it('should handle API error', async () => {
  // Mock Supabase to return error
  (supabase.from as jest.Mock).mockImplementation(() => ({
    select: jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    }),
  }));

  const { result } = renderHook(() => useGroups());

  await waitFor(() => {
    expect(result.current.error).toBe('Database error');
  });
});
```

**Component Testing (Recommended):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Groups from '../pages/Groups';

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {component}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

it('should display create group button', () => {
  renderWithProviders(<Groups />);
  expect(screen.getByText('Nuevo grupo')).toBeInTheDocument();
});
```

## Recommended Test Setup

**Install Dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/react-hooks @testing-library/jest-dom jsdom
```

**Create Vitest Config:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Create Test Setup:**
```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
  },
}));
```

**Add Scripts to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Priority Testing Areas

**High Priority (Critical Business Logic):**
1. `src/features/groups/hooks/useGroups.ts` - Group CRUD operations
2. `src/features/dashboard/hooks/usePersonalTransactions.ts` - Transaction management
3. `src/features/auth/hooks/useAuth.ts` - Authentication flow
4. `src/services/ai.ts` - AI expense extraction

**Medium Priority:**
1. `src/features/expenses/hooks/useTransactions.ts` - Group transactions
2. `src/features/analytics/hooks/useCategoryStats.ts` - Analytics calculations
3. `src/lib/image-utils.ts` - Image compression
4. `src/lib/constants.ts` - Category configuration logic

**Low Priority (UI Components):**
1. Page components (snapshot/interaction tests)
2. Layout components (Sidebar, Header, BottomNav)
3. Modal components

---

*Testing analysis: 2026-01-20*
