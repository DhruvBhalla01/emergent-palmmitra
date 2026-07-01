# Image Integration Testing Rules

- Always use base64-encoded images.
- Accepted formats: JPEG, PNG, WEBP only.
- Never upload blank/solid-color/uniform images.
- Every image must contain real visual features (edges, textures).
- If not JPEG/PNG/WEBP, transcode to PNG or JPEG first.
- Extract first frame from animated GIF/APNG/WEBP.
- Resize large images to reasonable bounds.
