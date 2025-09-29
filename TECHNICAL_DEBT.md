# Technical Debt Analysis

## Major Issues in /src/apps/shared/index.ts

### 1. **Duplication Between App Registry and Import Mapping**

**Problem**: The system maintains two separate lists of applications:
- `apps.json` contains complete app metadata
- `shared/index.ts` manually duplicates all app keys in `importMap`

**Impact**:
- High maintenance burden - every new app requires updates in two places
- Risk of inconsistency between registry and import mappings
- Manual synchronization prone to human error

### 2. **Unnecessary Legacy "Stories" Concept**

**Problem**: The `Stories` proxy (lines 109-122) exists purely for backward compatibility
- Uses complex Proxy pattern for simple app loading
- Adds unnecessary abstraction layer
- Confusing naming ("Stories" vs "Apps")

**Impact**:
- Code complexity without functional benefit
- Developer confusion about which system to use
- Maintenance overhead for deprecated pattern

### 3. **Manual Import Mapping Maintenance**

**Problem**: The `importMap` object (lines 32-74) requires manual maintenance for each app
- Hardcoded import paths for every application
- Must be kept in sync with `apps.json` manually
- No validation that all apps have corresponding imports

**Impact**:
- Frequent merge conflicts in this file
- Risk of broken apps due to missing imports
- Time-consuming app registration process

## Recommended Solutions

### Option 1: **Auto-Generate Import Mapping** (Recommended)

Generate the import mapping dynamically from `apps.json` at build time:

```typescript
// Generate importMap from apps.json automatically
export function generateImportMap(): Record<string, () => Promise<any>> {
  const importMap: Record<string, () => Promise<any>> = {};

  Object.values(APP_REGISTRY).forEach(category => {
    Object.entries(category).forEach(([key, app]) => {
      const entryPath = app.entry.replace('./src/apps/', '../').replace('./apps/', '../');
      importMap[key] = () => import(entryPath);
    });
  });

  return importMap;
}
```

**Benefits**:
- Single source of truth in `apps.json`
- Automatic import mapping generation
- No manual synchronization needed
- Reduced risk of missing imports

### Option 2: **Direct Dynamic Imports** (Alternative)

Replace the import mapping with direct dynamic imports based on app metadata:

```typescript
export async function loadApp(appKey: string, options: StoryOptions): Promise<void> {
  const app = getAppConfig(appKey);
  if (!app) {
    throw new Error(`App '${appKey}' not found in registry`);
  }

  // Convert entry path to import path
  const importPath = app.entry.replace('./src/apps/', '../').replace('./apps/', '../');

  try {
    const appModule = await import(importPath);
    return appModule.default.load(options);
  } catch (error) {
    throw new Error(`Failed to load app '${appKey}': ${error}`);
  }
}
```

**Benefits**:
- No import mapping maintenance
- Completely driven by `apps.json`
- Simpler code structure

### Option 3: **Remove Stories Concept Entirely**

Phase out the `Stories` proxy and update all consumers to use `loadApp` directly:

```typescript
// Remove this entire section:
const Stories = new Proxy({} as Record<string, any>, {
  get(_, prop: string) {
    // ... complex proxy logic
  },
});
```

**Migration Path**:
1. Update all callers to use `loadApp(appKey, options)` instead of `Stories[appKey].load(options)`
2. Remove the Stories export
3. Remove the proxy implementation

## Implementation Priority

1. **High Priority**: Fix duplication with Option 1 or 2
2. **Medium Priority**: Remove Stories concept (Option 3)
3. **Low Priority**: Refactor file structure for better organization

## Files to Update

- `src/apps/shared/index.ts` - Main refactor
- Any files importing `Stories` - Update to use `loadApp`
- Build configuration - May need webpack updates for dynamic imports

## Benefits After Refactor

- Single source of truth for app configuration
- Automatic import mapping
- Reduced maintenance burden
- Lower risk of configuration errors
- Cleaner, more understandable code