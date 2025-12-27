# Remediation Report

**Generated**: 2025-12-26  
**Based on**: `srs.md` (v0.1 MVP) and `project-management/conventions.md`

---

## Summary

This document identifies deviations and defects found in the codebase when compared against the SRS and project conventions. Items are categorized by severity and type.

---

## 1. Convention Violations

### 1.1 Enum Naming Convention Violations

**Convention**: Enums should begin with `E`, e.g., `EUserType`.

| File | Issue | Current | Expected |
|------|-------|---------|----------|
| [schema.ts](file:///home/francis/code/suipic-2/apps/backend/src/db/schema.ts#L6) | Enum naming | `imageStatusEnum` | `EImageStatus` |
| [schema.ts](file:///home/francis/code/suipic-2/apps/backend/src/db/schema.ts#L7) | Enum naming | `feedbackFlagEnum` | `EFeedbackFlag` |

> [!NOTE]
> The `EUserRole` enum on line 4 follows the convention correctly.

---

### 1.2 Use of `let` Instead of `const`

**Convention**: Use `const` by default.

The following files use `let` where `const` might be preferred:

| File | Line(s) | Description |
|------|---------|-------------|
| [image.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/image.ts#L164) | 164 | `let filtered = imageRecords;` - could be refactored to avoid mutation |
| [dashboard.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/dashboard.ts#L31-33) | 31-33 | `let totalPicks`, `let totalRatings`, `let ratingCount` - used in accumulator pattern |
| [cleanup.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/cleanup.ts#L27) | 27 | `let deletedCount = 0;` - used in accumulator pattern |

> [!TIP]
> Some `let` usages are necessary for accumulator patterns. Consider using `reduce()` or `Array.prototype.reduce()` where feasible.

---

### 1.3 Excessive Use of `any` Type

**Convention**: Avoid implicit or explicit `any` types.

The backend has extensive use of `any` types throughout `index.ts` and other files:

| File | Approximate Count | Examples |
|------|-------------------|----------|
| [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts) | ~46+ instances | Type casts like `as any`, handler type annotations |
| [dashboard.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/dashboard.ts#L90) | 1 | `const allFeedback: any[] = [];` |
| [album.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/album.ts#L55) | 1 | `as any` cast |
| [auth.ts](file:///home/francis/code/suipic-2/apps/backend/src/auth.ts#L30-37) | 2 | `(payload as any)`, `{ user: any; set: any }` |

> [!WARNING]
> The heavy reliance on `any` types defeats the purpose of TypeScript's type safety and should be properly typed.

---

### 1.4 `@ts-ignore` Comments

**Convention**: Avoid type suppressions; properly type code instead.

| File | Line(s) | Context |
|------|---------|---------|
| [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts#L272) | 272 | Suppressing `.derive()` type error |
| [album.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/album.ts#L161) | 161 | Order by clause type issue |
| [image.test.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/image.test.ts) | 67, 69, 105, 126 | Multiple test suppressions |
| [schema.test.ts](file:///home/francis/code/suipic-2/apps/backend/src/db/schema.test.ts) | 112, 114, 130, 132, 134, 138, 141 | Coverage-related suppressions |

---

### 1.5 Frontend Component Convention

**Convention**: Only create custom components if DaisyUI does not have one for the purpose.

| File | Issue |
|------|-------|
| [ImageMetadata.svelte](file:///home/francis/code/suipic-2/apps/frontend/src/lib/components/ImageMetadata.svelte) | Uses hard-coded CSS colors (`bg-gray-50`, `text-gray-500`) instead of DaisyUI theme variables (`bg-base-200`, `text-base-content/50`) |

> [!NOTE]
> The styling in this component doesn't follow the DaisyUI theming pattern used elsewhere in the application.

---

## 2. SRS Deviations

### 2.1 Missing Photographer Endpoint for Single Image

**SRS Requirement** (Section 5.2): "Read image detail (scoped)" for photographers.

| Issue | Current State |
|-------|---------------|
| No dedicated `GET /api/photographer/albums/:id/images/:imageId` endpoint | Photographers can list images but no direct single image fetch endpoint exists |

The [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts) file has client image detail endpoint at line 300 but no equivalent photographer endpoint.

---

### 2.2 Missing Album Comments Functionality

**SRS Requirement** (Section 4.5.1): "Comments can be attached to either: Album (general notes) OR Image (specific feedback)"

| Issue | Current State |
|-------|---------------|
| No endpoint for fetching album-level comments | Only `GET /api/comments/images/:id` exists for image comments |
| Frontend lacks album comments UI | [+page.svelte](file:///home/francis/code/suipic-2/apps/frontend/src/routes/albums/%5Bid%5D/+page.svelte) has no album comments section |

The [comment.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/comment.ts#L31) service only has `getCommentsForImage()`, missing `getCommentsForAlbum()`.

---

### 2.3 Client Album Detail View Missing

**SRS Requirement** (Section 5.1 - Client UI): "Album detail: image grid, album comments"

| Issue | Current State |
|-------|---------------|
| No dedicated client album detail page | Client can fetch images via API but no `/client/albums/:id` route exists |

The frontend has only photographer-focused routes:
- `/albums` - photographer albums list
- `/albums/[id]` - photographer album detail

---

### 2.4 Client Image Detail View Missing

**SRS Requirement** (Section 5.1 - Client UI): "Image detail: set flag, set rating, comments thread"

| Issue | Current State |
|-------|---------------|
| No client image detail page with feedback controls | Photographers have `/albums/[id]/images/[imageId]` but clients have no equivalent |

---

### 2.5 Dashboard Sorting by Comment Count Missing

**SRS Requirement** (Section 4.6.3): Photographers must be able to "Sort by: ... comment count"

| Issue | Current State |
|-------|---------------|
| Frontend sorting doesn't include comment count | [albums/[id]/+page.svelte](file:///home/francis/code/suipic-2/apps/frontend/src/routes/albums/%5Bid%5D/+page.svelte#L267-270) only supports: date-desc, date-asc, rating-desc, picks-desc |

---

### 2.6 Access Control Returns 404 Instead of 403

**SRS Requirement** (Section 4.1.4): "If a user attempts to access a resource without membership, API must return **403**."

| File | Issue |
|------|-------|
| [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts#L156) | Returns `error(404, 'Album not found')` when album access is denied |
| [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts#L185) | Returns `error(404, 'Album not found')` for membership operations |

> [!IMPORTANT]
> Per SRS 4.1.4, unauthorized access should return 403 Forbidden, not 404 Not Found. Returning 404 leaks information about resource existence.

---

### 2.7 Collaborator Permissions Not Fully Enforced

**SRS Requirement** (Section 3.2): Collaborators "May not manage membership (clients/photographers)"

| Issue | Current State |
|-------|---------------|
| Client management endpoints don't verify owner-only | [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts#L183-200) allows any photographer with album access to add/remove clients |

The client management endpoints at lines 183-200 use `getAlbumForPhotographer()` which allows collaborators, but per SRS only the owner should manage clients.

---

### 2.8 MinIO Object Layout Deviation

**SRS Requirement** (Section 6.2): 
- Full: `albums/{albumId}/images/{imageId}.webp`
- Thumb: `albums/{albumId}/thumbs/{imageId}.webp`

| Actual Implementation | Expected per SRS |
|-----------------------|------------------|
| `albums/{albumId}/{imageId}/full.webp` | `albums/{albumId}/images/{imageId}.webp` |
| `albums/{albumId}/{imageId}/thumb.webp` | `albums/{albumId}/thumbs/{imageId}.webp` |

See [image.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/image.ts#L58-59)

---

## 3. Code Quality Issues

### 3.1 Test Route Exposed in Production

| File | Issue |
|------|-------|
| [index.ts](file:///home/francis/code/suipic-2/apps/backend/src/index.ts#L357-382) | `/test/upload` endpoint exists outside of test context |

While it has `requireAuth: ['admin']`, a test endpoint should not be in production code.

---

### 3.2 Missing Tests for Backend Worker

**Convention**: All functions and API endpoints must have corresponding tests.

| File | Issue |
|------|-------|
| [worker.ts](file:///home/francis/code/suipic-2/apps/backend/src/worker.ts) | No `worker.test.ts` found |

---

### 3.3 TAlbum Type Mismatch Between Frontend and Backend

| Frontend ([types.ts](file:///home/francis/code/suipic-2/apps/frontend/src/lib/types.ts#L28-39)) | Backend ([schema.ts](file:///home/francis/code/suipic-2/apps/backend/src/db/schema.ts#L175)) |
|---------|---------|
| Has `isDeleted: boolean` field | Uses `deletedAt: timestamp` (nullable) |

The frontend type expects a boolean flag but the backend uses a soft-delete timestamp pattern.

---

### 3.4 Unused Labels in Dashboard Service

| File | Issue |
|------|-------|
| [dashboard.ts](file:///home/francis/code/suipic-2/apps/backend/src/services/dashboard.ts#L91) | `messages:` label is declared but never used as a jump target |

---

### 3.5 Frontend API URL Hardcoding

| File | Issue |
|------|-------|
| [auth.ts](file:///home/francis/code/suipic-2/apps/frontend/src/lib/services/auth.ts#L24) | Uses relative URL `/api/users/me` while other services use `${API_URL}/api/...` |

---

## 4. Missing Functionality Checklist

Based on SRS Section 8 (MVP Acceptance Criteria):

| Criterion | Status | Notes |
|-----------|--------|-------|
| Seeded admin exists and can create users | ⚠️ Partial | Bootstrap exists but verification of seeding unclear |
| No registration flow exists | ✅ | No public registration implemented |
| Photographer can create albums and assign clients | ✅ | Implemented |
| Albums support multiple clients and multiple photographers | ✅ | Implemented |
| Upload pipeline stores only WebP derivatives | ✅ | Implemented correctly |
| Clients can access only assigned albums | ✅ | Implemented |
| Clients can comment and set flag/rating per image | ⚠️ Partial | API exists, UI missing |
| Photographers can reply to comments | ✅ | Implemented |
| Photographer dashboard supports filtering and sorting per MVP requirements | ⚠️ Partial | Missing comment count sort |

---

## Recommendations

1. **High Priority**: Fix 403 vs 404 response codes for unauthorized access
2. **High Priority**: Implement owner-only checks for client management endpoints  
3. **Medium Priority**: Add missing client UI routes (album detail, image detail with feedback)
4. **Medium Priority**: Rename enums to follow `E` prefix convention
5. **Medium Priority**: Add album comments endpoint and UI
6. **Low Priority**: Refactor `any` types to proper interfaces/types
7. **Low Priority**: Align MinIO storage paths with SRS specification
8. **Low Priority**: Remove or properly guard test endpoint
