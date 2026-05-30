# @liveschema/core

## 1.1.0

### Minor Changes

- 1e3d626: rename active to reachable

## 1.0.3

### Patch Changes

- cb49924: update example links

## 1.0.2

### Patch Changes

- 4b5a490: update readme
- dec5ce8: update readme of core

## 1.0.1

### Major Changes

- 7fdf837: v1

## 1.0.0

### Major Changes

- 5f56592: init

## 0.1.0

### Minor Changes

- Renamed from `liveschema` to `@liveschema/core` so all packages live under the `@liveschema` npm org. Replace `from 'liveschema'` with `from '@liveschema/core'`; the runtime API is unchanged.
- New `declaredFields(schema, values)` walker — returns every declared field tagged with an `isReachable` flag (vs. `reachableFields` which only yields reachable ones). Used by the new framework wrappers but exported for direct use too.

## 0.0.2

### Patch Changes

- f87a69b: update readme and delete @liveschema/react-hook-form

## 0.0.1

### Patch Changes

- c872efe: Initial release
