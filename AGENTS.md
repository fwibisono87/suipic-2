# Agent Working Guidelines

## Project Management
This project uses a structured management approach located in `/project-management/`.

### How to use
1.  **Check Progress**: Read `project-management/progress.md` to see the current milestone and status.
2.  **Follow Sprints**: Refer to the active `sprint-N.md` file for specific tasks to be implemented.
3.  **Update Progress**: When a task is completed, update the corresponding sprint document and optionally `progress.md`.
4.  **SRS Alignment**: Ensure all implementations align with the `srs.md` at the project root.
5.  **Conventions**: Follow the conventions in `project-management/conventions.md`.

## Technical Context
- **Stack**: SvelteKit, ElysiaJS, PostgreSQL, MinIO, Keycloak.
- **Workflow**: Background worker for image processing (WebP conversion).
- **Security**: Bearer JWTs via Keycloak, short-lived pre-signed URLs for media.
