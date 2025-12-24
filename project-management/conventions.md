This document contains code conventions.

# General Conventions

1. Use `const` by default.
2. Use `type` instead of `interface`.
3. Always create enums for constants.
4. types should begin with `T`, i.e. `TUser`.
5. enums should begin with `E`, i.e. `EUserType`.
6. true constants (that never change) should be in `SCREAMING_SNAKE_CASE`, i.e. `MAX_USERS`.


# Frontend-specific Conventions

1. For data fetching and mutations, use Tanstack Query.
2. If anything might be long-running, add loading states.
3. If something is used commonnly (i.e. dialog, toast, etc), create a component and a composable.
4. Only create custom components if DaisyUI does not have one for the purpose.
5. Use mutation and fetch keys for efficent data.
