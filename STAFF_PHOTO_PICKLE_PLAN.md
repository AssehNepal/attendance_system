# Staff Photo Upload – Pickle Storage Plan

## Overview

Store staff profile photos as **Python pickle** serialized binary data directly in the PostgreSQL database (as a `bytea` column). This avoids external file storage (MinIO/S3) and keeps everything in one place.

> **Note:** Pickle is a Python-specific serialization format. Since this backend is **NestJS (Node.js)**, we have two approaches:

---

## Option A: Store as Raw Binary (bytea) – Recommended for Node.js

Since Node.js doesn't natively use pickle, the practical equivalent is storing the image as a **binary buffer** in a `bytea` column. If your boss specifically needs Python pickle format (e.g., for a Python ML pipeline to read), see Option B.

### Database Changes

```sql
-- Add photo column to staff table
ALTER TABLE "staff" ADD COLUMN "photo" bytea;
```

Migration file: `1747000000005-AddPhotoToStaff.ts`

### Flow

1. **Upload**: Client sends photo via `multipart/form-data`
2. **Validate**: Check file type (JPEG/PNG), max size (e.g., 2MB)
3. **Store**: Save `Buffer` directly into the `photo` bytea column
4. **Retrieve**: Return photo as base64 string or stream as binary response

### Files to Create/Modify

| File                                                       | Action                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/database/migrations/1747000000005-AddPhotoToStaff.ts` | New migration – add `photo bytea` column                                            |
| `src/staff/entities/staff.entity.ts`                       | Add `@Column({ type: 'bytea', nullable: true }) photo: Buffer`                      |
| `src/staff/staff.controller.ts`                            | Add `@Post(':id/photo')` endpoint with `@UseInterceptors(FileInterceptor('photo'))` |
| `src/staff/staff.service.ts`                               | Add `uploadPhoto(id, buffer)` and `getPhoto(id)` methods                            |
| `src/staff/dto/upload-photo.dto.ts`                        | Validation DTO (optional, for Swagger)                                              |

### Key Implementation Details

```text
Controller:
  @Patch(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(@Param('id') id, @UploadedFile() file: Express.Multer.File)
    → validate mimetype (image/jpeg, image/png)
    → validate size ≤ 2MB
    → call service.uploadPhoto(id, file.buffer)

  @Get(':id/photo')
  getPhoto(@Param('id') id, @Res() res)
    → fetch staff.photo buffer
    → set Content-Type header
    → stream buffer as response

Service:
  uploadPhoto(id: string, buffer: Buffer):
    → staffRepo.update(id, { photo: buffer })

  getPhoto(id: string):
    → return staffRepo.findOne({ where: { id }, select: ['id', 'photo'] })
```

---

## Option B: Store as Pickle Binary (for Python interop)

If the photo **must** be in pickle format (e.g., a Python service reads it for face recognition), serialize the image as a pickle-compatible byte stream.

### Approach

1. Create a small **Python helper script** that pickles the image bytes
2. Call it from Node.js via `child_process` or a Python microservice
3. Store the pickled output in `bytea`

### Pickle Script (`scripts/pickle_photo.py`)

```python
import sys
import pickle

# Read raw image bytes from stdin
image_bytes = sys.stdin.buffer.read()

# Pickle the image bytes (or a dict with metadata)
data = {
    "image": image_bytes,
    "format": sys.argv[1] if len(sys.argv) > 1 else "jpeg"
}

# Write pickled data to stdout
sys.stdout.buffer.write(pickle.dumps(data))
```

### Unpickle Script (`scripts/unpickle_photo.py`)

```python
import sys
import pickle

pickled_data = sys.stdin.buffer.read()
data = pickle.loads(pickled_data)

# Write raw image bytes to stdout
sys.stdout.buffer.write(data["image"])
```

### Node.js Integration (in staff.service.ts)

```typescript
import { execSync } from 'child_process';

// To pickle
const pickled = execSync('python3 scripts/pickle_photo.py jpeg', {
  input: file.buffer,
  maxBuffer: 5 * 1024 * 1024,
});
await this.staffRepo.update(id, { photo: pickled });

// To unpickle (for serving)
const raw = execSync('python3 scripts/unpickle_photo.py', {
  input: staff.photo,
  maxBuffer: 5 * 1024 * 1024,
});
```

### Files to Create/Modify

| File                                                       | Action                            |
| ---------------------------------------------------------- | --------------------------------- |
| `scripts/pickle_photo.py`                                  | Pickle image bytes                |
| `scripts/unpickle_photo.py`                                | Unpickle to raw image             |
| `src/database/migrations/1747000000005-AddPhotoToStaff.ts` | Add `photo bytea` column          |
| `src/staff/entities/staff.entity.ts`                       | Add `photo: Buffer` column        |
| `src/staff/staff.controller.ts`                            | Upload + retrieve endpoints       |
| `src/staff/staff.service.ts`                               | Pickle/unpickle via child_process |

---

## Option C: Use `pickle` npm Package (Pure JS)

There's an npm package [`picklejs`](https://www.npmjs.com/package/picklejs) that can read/write Python pickle format in Node.js.

```bash
npm install picklejs
```

This avoids spawning Python processes but has limited pickle protocol support.

---

## Recommendation

| Criteria             | Option A (bytea) | Option B (Python pickle) | Option C (picklejs) |
| -------------------- | ---------------- | ------------------------ | ------------------- |
| Simplicity           | ✅ Easiest       | ❌ Complex               | ⚠️ Medium           |
| No Python dependency | ✅               | ❌ Needs Python          | ✅                  |
| Python ML interop    | ❌               | ✅ Perfect               | ⚠️ Limited          |
| Performance          | ✅ Fast          | ⚠️ Spawn overhead        | ✅ Fast             |

**If the goal is just "store photo in DB"** → Use **Option A**.  
**If Python services need to `pickle.loads()` the data** → Use **Option B**.

---

## Validation Rules

- Max file size: **2 MB**
- Allowed MIME types: `image/jpeg`, `image/png`
- Staff must exist before uploading photo
- Return `404` if staff not found, `400` if invalid file

## Swagger Documentation

- `@ApiConsumes('multipart/form-data')`
- `@ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } })`
- `@ApiResponse({ status: 200, description: 'Photo uploaded successfully' })`

---

## Dependencies to Install

```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```
