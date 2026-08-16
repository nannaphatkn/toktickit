# Lab 1 Tests

| Test File tests/lab-01/ | Tool | Test Description | Status |
| --- | --- | --- | --- |
| API-01 | Supertest | Health endpoint returns 200 and expected JSON | Pass |
| API-02 | Supertest | Categories endpoint returns the four seeded categories | Pass |
| UI-01 | Vitest | TokTickIT heading renders | Pass |
| UI-02 | Vitest | Loading state changes to category list | Pass |
| UI-03 | Vitest | API failure displays a useful error message | Pass |

## Evidence Output

### Client UI Tests (Vitest)
```
 ✓ src/App.test.tsx (3 tests) 55ms
   ✓ App - Category Client Test (3)
     ✓ renders initial state correctly 20ms
     ✓ fetches and displays categories when Check System is clicked 27ms
     ✓ displays error if fetch fails 7ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  13:13:06
   Duration  781ms (transform 36ms, setup 92ms, import 47ms, tests 55ms, environment 512ms)
```

### Server API Tests (Supertest)
```
 ✓ tests/health.test.ts (1)
 ✓ tests/category.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  13:12:34
   Duration  542ms (transform 153ms, setup 0ms, collect 484ms, tests 84ms, environment 0ms, prepare 237ms)
```
