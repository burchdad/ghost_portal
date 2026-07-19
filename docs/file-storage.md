# File Storage

Slice 2 implements safe file metadata and validation boundaries:

- allowed MIME types: PDF, PNG, JPEG, plain text
- maximum size: 10MB
- sanitized filenames
- metadata linked to tasks, approvals, reports, or feedback
- local-development storage key abstraction

Production UploadThing or another provider can be connected behind this metadata boundary. Storage secrets must never be exposed to the browser.
