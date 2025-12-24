# Software Requirements Specification (SRS) — SuiPic (MVP)

**Version:** 0.1 (MVP defaults baked in)
**Last updated:** 2025-12-23

---

## 1. Introduction

### 1.1 Purpose

SuiPic is an invite-only photographer CMS to share rushes/proofs with clients, collect structured feedback (comments, picks/rejects, ratings), and help photographers prioritize editing.

### 1.2 Scope

SuiPic MVP supports:

* Invite-only access (no public registration)
* Administrator-managed Photographer and Client accounts
* Photographer-managed Client accounts
* Albums with membership (multiple photographers + multiple clients)
* Image uploads with conversion to WebP and storage in object storage (no originals kept)
* Client feedback per-image (comments, flags, ratings)
* Photographer replies and dashboard views (filters + summaries)

Out of scope for MVP (explicitly):

* Public sharing links
* Downloading originals / RAW handling
* E-commerce, invoices, payments
* Advanced notification system (email/push)
* CDN integration (optional later)

### 1.3 Definitions

* **Album:** Container for many images, shared with one or more clients.
* **Image:** Atomic unit for feedback. Stored only as WebP derivative (plus thumbnail WebP).
* **Flag:** Client selection signal: `NULL | pick | reject`.
* **Rating:** Client rating: `NULL | 1..5`.
* **Per-client feedback:** Each client has independent flag/rating per image.

### 1.4 Target Technology Stack

* Frontend: Svelte/SvelteKit + TailwindCSS + DaisyUI + Iconify (Bun)
* Backend: ElysiaJS (Bun)
* Database: PostgreSQL
* Object Storage: MinIO (S3-compatible)
* Authentication/IAM: Keycloak (OIDC)

---

## 2. Product Overview

### 2.1 Product Perspective

SuiPic is a web app with:

* Keycloak for authentication and role claims
* Backend API for albums/images/comments/feedback
* MinIO for private storage of WebP images and thumbnails

### 2.2 Users and Roles

* **Administrator (seeded)**

  * Exists at first boot
  * Creates Photographer and Client accounts
  * Full access to all data

* **Photographer**

  * Creates Client accounts
  * Creates and manages albums
  * Uploads images
  * Replies to comments
  * Reviews client feedback

* **Client**

  * Views assigned albums
  * Adds comments
  * Sets per-image flag/rating

### 2.3 Tenant Model (MVP Decision)

**MVP is single-tenant.**

* One workspace in a deployment.
* Admin is the single platform/studio admin.

---

## 3. Decisions Locked for MVP

### 3.1 Access & Onboarding

* No self-registration flow.
* Accounts are created by Admin or Photographer.
* Invite onboarding uses Keycloak capabilities:

  * New users must set a password on first login (Keycloak Required Actions).
  * Invite link may be shared manually (email automation is out of scope for MVP).
* Identity: **email as username**.

### 3.2 Album Ownership & Collaboration

* Each album has a single **Owner Photographer**.
* Albums may have multiple **Collaborator Photographers**.
* Collaborator permissions (MVP):

  * May upload images
  * May reply to comments
  * May view dashboard
  * **May not** delete album
  * **May not** manage membership (clients/photographers)
* Only owner can:

  * Delete album
  * Add/remove clients
  * Add/remove photographers

### 3.3 Feedback Semantics

* Feedback is **per-client per-image**.
* Each client may set/overwrite their own flag/rating any time.
* Rating meaning: “How much you like this photo.”
* Reject does **not** hide images (label only).

### 3.4 Comments

* Comments can be attached to either:

  * Album (general notes)
  * Image (specific feedback)
* Comments support threading via `parentCommentId`.
* Comment editing is not supported in MVP.
* Comment deletion is **soft-delete**.

### 3.5 Image Derivatives

* System stores only:

  * WebP full-size
  * WebP thumbnail
* Originals are never retained after successful conversion.

### 3.6 Image Serving

* Images are served to the browser via **short-lived pre-signed URLs** from MinIO.

### 3.7 Upload Processing

* Upload pipeline uses a **processing state** + worker pattern.
* A background worker (separate process/service) converts images and generates thumbnails.

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

#### 4.1.1 Authentication

* All users authenticate via Keycloak using OIDC.
* Backend must validate bearer JWTs on every API request (except health endpoints).

#### 4.1.2 Roles

* Backend must interpret user roles from token claims.
* Roles: `admin`, `photographer`, `client`.

#### 4.1.3 Authorization (MVP Rules)

* Admin:

  * Full CRUD for users, albums, images, comments, feedback.
* Photographer:

  * Can CRUD albums they own.
  * Can view albums where they are owner/collaborator.
  * Can upload images to albums they own/collaborate on.
  * Can respond to comments in albums they own/collaborate on.
  * Can manage membership only for albums they own.
* Client:

  * Can view only albums assigned to them.
  * Can create comments within those albums/images.
  * Can set flag/rating for images within those albums.

#### 4.1.4 Access Control Behavior

* If a user attempts to access a resource (album/image) without membership, API must return **403**.

---

### 4.2 User Management

#### 4.2.1 Seeded Admin

* On first boot, the system must ensure an administrator account exists.
* Admin bootstrap credentials must be provided via environment variables OR printed as one-time output.

#### 4.2.2 Create Photographer (Admin)

* Admin can create Photographer accounts with:

  * display name
  * email (unique)
  * status: active/disabled

#### 4.2.3 Create Client (Admin/Photographer)

* Admin and Photographers can create Client accounts with:

  * display name
  * email (unique)
  * status: active/disabled

---

### 4.3 Album Management

#### 4.3.1 Album Entity

Album fields:

* `id`
* `title` (required)
* `description` (optional)
* `ownerPhotographerId` (required)
* `createdAt`, `modifiedAt`

Relationships:

* many-to-many: album ↔ collaborator photographers
* many-to-many: album ↔ clients
* one-to-many: album → images
* one-to-many: album → comments

#### 4.3.2 Album Operations

* Photographer (owner) can:

  * Create album
  * Edit title/description
  * Add/remove clients
  * Add/remove collaborator photographers
  * Soft-delete album
* Photographer (collaborator) can:

  * View album
  * Upload images
  * Reply to comments
* Client can:

  * View assigned album
  * Comment on album

#### 4.3.3 Album Membership

* Album must support many clients.
* Album must support many photographers.
* Removing a client must immediately remove album visibility for that client.

---

### 4.4 Image Management

#### 4.4.1 Image Entity (Stored)

Image fields:

* `id`
* `albumId`
* `uploaderPhotographerId` (required)
* `filename` (original name, for display/reference)
* `title` (optional)
* `description` (optional)
* `createdAt`, `modifiedAt`
* `status`: `processing | ready | failed`
* `storageKeyFull` (MinIO key for WebP)
* `storageKeyThumb` (MinIO key for thumbnail WebP)
* Camera metadata:

  * common typed fields (make, model, lens, ISO, shutter, aperture, focalLength, capturedAt)
  * `metadataJson` (JSONB) for extra fields

#### 4.4.2 Upload Pipeline (Mandatory)

When a photographer uploads an image:

1. Backend accepts upload and creates an Image row with `status=processing`.
2. System extracts metadata from the upload and stores metadata fields.
3. Worker converts to **WebP full-size**.
4. Worker generates **WebP thumbnail**.
5. Worker uploads both objects to MinIO.
6. Worker updates Image row with storage keys and `status=ready`.
7. System must not store the original file after successful conversion.

Failure behavior:

* If conversion or upload fails, Image row must be marked `status=failed`.
* A cleanup process must remove orphaned objects/rows created by partial failures.

#### 4.4.3 Image Viewing

* UI must display only the WebP derivative.
* Metadata must be displayed from DB, not embedded in the served image.

---

### 4.5 Comments

#### 4.5.1 Comment Entity

Comment fields:

* `id`
* `authorUserId`
* `albumId` XOR `imageId` (exactly one)
* `body`
* `parentCommentId` (optional)
* `createdAt`, `modifiedAt`
* `deletedAt` (optional, for soft delete)

#### 4.5.2 Comment Permissions

* Any member of an album (assigned client or album photographer) may create comments.
* Photographers may reply to client comments.
* Clients may reply (threaded discussion).

#### 4.5.3 Deletion

* Users may soft-delete their own comments.
* Admin may soft-delete any comment.

---

### 4.6 Feedback (Flags & Ratings)

#### 4.6.1 ImageFeedback Entity (Per-Client)

Fields:

* `imageId`
* `clientUserId`
* `flag`: `NULL | pick | reject`
* `rating`: `NULL | 1..5`
* `createdAt`, `modifiedAt`

Constraints:

* Unique `(imageId, clientUserId)`.

#### 4.6.2 Feedback Operations

* Client can create or update feedback for an image in an assigned album.
* Updating overwrites previous values.

#### 4.6.3 Photographer Dashboard Requirements (MVP)

For a given album, photographer must be able to:

* Filter images by selected client
* Filter by `pick` / `reject` / `no feedback`
* Sort by:

  * average rating
  * pick count
  * comment count
* View per-image summary:

  * pick count
  * reject count
  * average rating
  * latest comments

---

## 5. External Interface Requirements

### 5.1 UI Screens (MVP)

#### Admin

* Login
* User management:

  * list users
  * create photographer
  * create client
  * disable/enable user

#### Photographer

* Albums:

  * list
  * create
  * edit
  * soft-delete
* Album detail:

  * manage membership (owner only)
  * upload images
  * view image grid
  * album comments
* Image detail:

  * view full WebP
  * view metadata
  * comments thread
  * feedback summary
* Album dashboard:

  * filters + sorting

#### Client

* Albums list (assigned)
* Album detail:

  * image grid
  * album comments
* Image detail:

  * set flag
  * set rating
  * comments thread

### 5.2 API Capabilities (Conceptual)

(Exact routes are implementation-defined; API must support these actions.)

* Users

  * Create photographer (admin)
  * Create client (admin/photographer)
  * Read current user

* Albums

  * Create album (photographer)
  * List albums (scoped)
  * Read album (scoped)
  * Update album (owner)
  * Add/remove clients (owner)
  * Add/remove photographers (owner)
  * Soft-delete album (owner)

* Images

  * Upload images to album (photographer owner/collab)
  * List images in album (scoped)
  * Read image detail (scoped)
  * Get pre-signed URLs for full/thumbnail (scoped)

* Comments

  * Create comment on album/image (scoped)
  * List comments for album/image (scoped)
  * Soft-delete comment (author/admin)

* Feedback

  * Upsert feedback for image (client)
  * Read feedback summary for image/album (photographer)

---

## 6. Data Requirements

### 6.1 PostgreSQL (MVP Logical Model)

Minimum tables:

* `user_profile` (optional local profile; Keycloak is auth source)
* `albums`
* `album_photographers`
* `album_clients`
* `images`
* `comments`
* `image_feedback`

### 6.2 MinIO Object Layout

Bucket: `suipic`

* Full: `albums/{albumId}/images/{imageId}.webp`
* Thumb: `albums/{albumId}/thumbs/{imageId}.webp`

Objects must be private; access is via pre-signed URLs.

---

## 7. Non-Functional Requirements

### 7.1 Security

* Enforce authorization on every resource access.
* Use short-lived pre-signed URLs (TTL target: 1–5 minutes).
* Rate limit uploads.

### 7.2 Performance

* Image grids must use thumbnails.
* Pagination/infinite scroll must be supported for large albums.

### 7.3 Reliability

* Upload pipeline must handle partial failures safely.
* Orphan cleanup must exist.

### 7.4 Data Retention

* Originals are not stored.
* Soft-deleted records may be purged later (out of MVP).

---

## 8. MVP Acceptance Criteria

* [ ] Seeded admin exists and can create users.
* [ ] No registration flow exists.
* [ ] Photographer can create albums and assign clients.
* [ ] Albums support multiple clients and multiple photographers.
* [ ] Upload pipeline stores only WebP derivatives (full + thumbnail) and does not retain originals.
* [ ] Clients can access only assigned albums.
* [ ] Clients can comment and set flag/rating per image.
* [ ] Photographers can reply to comments.
* [ ] Photographer dashboard supports filtering and sorting per MVP requirements.
