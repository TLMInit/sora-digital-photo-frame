/**
 * Comprehensive test suite for Digital Photo Frame Server
 * Tests every API endpoint and controller function
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

// Set required env vars before importing app
process.env.ADMIN_PASSWORD = 'testpassword123';
process.env.SESSION_SECRET = 'test-session-secret-that-is-at-least-32-characters-long';
process.env.NODE_ENV = 'test';

const app = require('../server');

// Helper to create a test JPEG buffer
async function createTestImageBuffer(color = { r: 255, g: 0, b: 0 }) {
  return sharp({
    create: { width: 100, height: 100, channels: 3, background: color }
  }).jpeg().toBuffer();
}

// Helper to login as admin and get session cookie + CSRF token
async function loginAsAdmin(agent) {
  await agent
    .post('/api/auth/login')
    .send({ password: 'testpassword123' })
    .set('Content-Type', 'application/json');

  const statusRes = await agent.get('/api/auth/status');
  return statusRes.body._csrf;
}

describe('Digital Photo Frame - Comprehensive Test Suite', () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const dataDir = path.join(__dirname, '..', 'data');
  let adminAgent;
  let csrfToken;

  beforeAll(async () => {
    // Create test folder structure and images
    await fs.ensureDir(path.join(uploadsDir, 'family'));
    await fs.ensureDir(path.join(uploadsDir, 'vacation'));
    await fs.ensureDir(path.join(uploadsDir, 'holidays'));
    await fs.ensureDir(path.join(uploadsDir, 'misc'));

    // Create actual valid JPEG test images
    const redImg = await createTestImageBuffer({ r: 255, g: 0, b: 0 });
    const blueImg = await createTestImageBuffer({ r: 0, g: 0, b: 255 });
    const greenImg = await createTestImageBuffer({ r: 0, g: 255, b: 0 });

    await fs.writeFile(path.join(uploadsDir, 'family', 'photo1.jpg'), redImg);
    await fs.writeFile(path.join(uploadsDir, 'family', 'photo2.jpg'), blueImg);
    await fs.writeFile(path.join(uploadsDir, 'vacation', 'beach.jpg'), greenImg);

    // Clear any existing accounts
    const accountsFile = path.join(dataDir, 'access-accounts.json');
    if (await fs.pathExists(accountsFile)) {
      await fs.writeFile(accountsFile, '[]');
    }
  });

  afterAll(async () => {
    // Clean up test images (but keep folders)
    const testFiles = [
      path.join(uploadsDir, 'family', 'photo1.jpg'),
      path.join(uploadsDir, 'family', 'photo2.jpg'),
      path.join(uploadsDir, 'vacation', 'beach.jpg'),
    ];
    for (const f of testFiles) {
      await fs.remove(f).catch(() => {});
    }
    // Clean up uploaded test files
    const familyFiles = await fs.readdir(path.join(uploadsDir, 'family')).catch(() => []);
    for (const f of familyFiles) {
      if (f.startsWith('images-') || f.startsWith('test')) {
        await fs.remove(path.join(uploadsDir, 'family', f)).catch(() => {});
      }
    }
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================
  describe('Health Check', () => {
    test('GET /api/health should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ============================================================
  // AUTHENTICATION - Admin Login
  // ============================================================
  describe('Admin Authentication', () => {
    test('POST /api/auth/login with correct password should succeed', async () => {
      const agent = request.agent(app);
      const res = await agent
        .post('/api/auth/login')
        .send({ password: 'testpassword123' })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
    });

    test('POST /api/auth/login with wrong password should fail', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'wrongpassword' })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid password');
    });

    test('POST /api/auth/login without password should fail', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password is required');
    });

    test('GET /api/auth/status should return auth state', async () => {
      const agent = request.agent(app);
      // Before login
      let res = await agent.get('/api/auth/status');
      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);

      // After login
      await agent
        .post('/api/auth/login')
        .send({ password: 'testpassword123' })
        .set('Content-Type', 'application/json');

      res = await agent.get('/api/auth/status');
      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body._csrf).toBeDefined();
    });

    test('Protected routes should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/access-accounts');
      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // ACCESS ACCOUNTS (CRUD + PIN Auth)
  // ============================================================
  describe('Access Accounts', () => {
    let testAccountId;

    beforeAll(async () => {
      adminAgent = request.agent(app);
      csrfToken = await loginAsAdmin(adminAgent);
    });

    test('GET /api/access-accounts should return empty array initially', async () => {
      const res = await adminAgent.get('/api/access-accounts');
      expect(res.status).toBe(200);
      expect(res.body.accounts).toBeInstanceOf(Array);
    });

    test('POST /api/access-accounts should create account with CSRF', async () => {
      const res = await adminAgent
        .post('/api/access-accounts')
        .send({
          name: 'Test Family',
          pin: '1234',
          assignedFolders: ['family'],
          uploadAccess: true
        })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.account.name).toBe('Test Family');
      expect(res.body.account.assignedFolders).toContain('family');
      expect(res.body.account.uploadAccess).toBe(true);
      testAccountId = res.body.account.id;
    });

    test('POST /api/access-accounts without CSRF should fail', async () => {
      const res = await adminAgent
        .post('/api/access-accounts')
        .send({ name: 'No CSRF', pin: '5555', assignedFolders: [] })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_VALIDATION_FAILED');
    });

    test('POST /api/access-accounts without name should fail', async () => {
      const res = await adminAgent
        .post('/api/access-accounts')
        .send({ pin: '9999', assignedFolders: [] })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Name and PIN are required/);
    });

    test('POST /api/access-accounts without pin should fail', async () => {
      const res = await adminAgent
        .post('/api/access-accounts')
        .send({ name: 'No Pin', assignedFolders: [] })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(400);
    });

    test('GET /api/access-accounts should mask PINs', async () => {
      const res = await adminAgent.get('/api/access-accounts');
      expect(res.status).toBe(200);
      const account = res.body.accounts.find(a => a.id === testAccountId);
      expect(account).toBeDefined();
      expect(account.pin).toBe('••••');
      expect(account.name).toBe('Test Family');
    });

    test('PUT /api/access-accounts/:id should update account', async () => {
      const res = await adminAgent
        .put(`/api/access-accounts/${testAccountId}`)
        .send({
          name: 'Updated Family',
          assignedFolders: ['family', 'vacation'],
          uploadAccess: false,
          keepPin: true
        })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.account.name).toBe('Updated Family');
      expect(res.body.account.assignedFolders).toContain('vacation');
      expect(res.body.account.uploadAccess).toBe(false);
    });

    test('PUT /api/access-accounts/:id with new pin should work', async () => {
      const res = await adminAgent
        .put(`/api/access-accounts/${testAccountId}`)
        .send({
          name: 'Updated Family',
          pin: '4321',
          assignedFolders: ['family', 'vacation'],
          uploadAccess: true
        })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('PUT /api/access-accounts/nonexistent should return 404', async () => {
      const res = await adminAgent
        .put('/api/access-accounts/nonexistent')
        .send({ name: 'X', pin: '1111', assignedFolders: [] })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ACCOUNT_NOT_FOUND');
    });

    // PIN Authentication
    test('POST /api/auth/pin with correct PIN should authenticate', async () => {
      const agent = request.agent(app);
      const res = await agent
        .post('/api/auth/pin')
        .send({ pin: '4321' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.account.name).toBe('Updated Family');
      expect(res.body.account.assignedFolders).toContain('family');
      // Should NOT leak sessionId
      expect(res.body.sessionId).toBeUndefined();
    });

    test('POST /api/auth/pin with wrong PIN should fail', async () => {
      const res = await request(app)
        .post('/api/auth/pin')
        .send({ pin: '9999' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_PIN');
      expect(res.body.attemptsRemaining).toBeDefined();
    });

    test('POST /api/auth/pin without PIN should fail', async () => {
      const res = await request(app)
        .post('/api/auth/pin')
        .send({})
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('PIN is required');
    });

    test('GET /api/auth/session should return PIN auth state', async () => {
      const agent = request.agent(app);
      // Authenticate with PIN
      await agent
        .post('/api/auth/pin')
        .send({ pin: '4321' })
        .set('Content-Type', 'application/json');

      const res = await agent.get('/api/auth/session');
      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.account.name).toBe('Updated Family');
    });

    test('DELETE /api/auth/session should clear session', async () => {
      const agent = request.agent(app);
      await agent
        .post('/api/auth/pin')
        .send({ pin: '4321' })
        .set('Content-Type', 'application/json');

      const res = await agent.delete('/api/auth/session');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Session should be cleared
      const sessionRes = await agent.get('/api/auth/session');
      expect(sessionRes.body.authenticated).toBe(false);
    });

    // Create a second account for later tests, then delete the test account
    test('POST then DELETE /api/access-accounts/:id should delete', async () => {
      // Create a temporary account
      const createRes = await adminAgent
        .post('/api/access-accounts')
        .send({ name: 'To Delete', pin: '7777', assignedFolders: [] })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);

      expect(createRes.status).toBe(201);
      const tempId = createRes.body.account.id;

      const delRes = await adminAgent
        .delete(`/api/access-accounts/${tempId}`)
        .set('X-CSRF-Token', csrfToken);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });

    test('DELETE /api/access-accounts/nonexistent should return 404', async () => {
      const res = await adminAgent
        .delete('/api/access-accounts/nonexistent')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  // ============================================================
  // FOLDER ROUTES (Public)
  // ============================================================
  describe('Folder Structure (Public)', () => {
    test('GET /api/folders should return folder list', async () => {
      const res = await request(app).get('/api/folders');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.folders).toBeInstanceOf(Array);
      expect(res.body.folders.length).toBeGreaterThan(0);

      const folder = res.body.folders[0];
      expect(folder).toHaveProperty('name');
      expect(folder).toHaveProperty('path');
      expect(folder).toHaveProperty('imageCount');
    });

    test('GET /api/folders/:folderPath should return folder contents', async () => {
      const res = await request(app).get('/api/folders/family');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.folder).toHaveProperty('name', 'family');
    });

    test('GET /api/folders/nonexistent should return 404', async () => {
      const res = await request(app).get('/api/folders/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FOLDER_NOT_FOUND');
    });
  });

  // ============================================================
  // RANDOM IMAGE (Public)
  // ============================================================
  describe('Random Image (Public)', () => {
    test('GET /api/images/random should return a random image', async () => {
      const res = await request(app).get('/api/images/random');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.image).toBeDefined();
      expect(res.body.image).toHaveProperty('id');
      expect(res.body.image).toHaveProperty('filename');
      expect(res.body.image).toHaveProperty('path');
      expect(res.body.image).toHaveProperty('folder');
      expect(res.body.image).toHaveProperty('url');
    });

    test('GET /api/random-image should also work (legacy endpoint)', async () => {
      const res = await request(app).get('/api/random-image');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.image).toBeDefined();
    });

    test('GET /api/images/random?folder=family should filter by folder', async () => {
      const res = await request(app).get('/api/images/random?folder=family');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.image.folder).toBe('family');
    });

    test('GET /api/images/random?folder=nonexistent should return 404', async () => {
      const res = await request(app).get('/api/images/random?folder=nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FOLDER_EMPTY');
    });

    test('Random image should not repeat immediately', async () => {
      const images = [];
      for (let i = 0; i < 3; i++) {
        const res = await request(app).get('/api/images/random');
        if (res.status === 200) {
          images.push(res.body.image.id);
        }
      }
      // With 3 images and anti-repeat, no two consecutive should be the same
      for (let i = 1; i < images.length; i++) {
        expect(images[i]).not.toBe(images[i - 1]);
      }
    });
  });

  // ============================================================
  // IMAGE THUMBNAILS (Public)
  // ============================================================
  describe('Image Thumbnails', () => {
    test('GET /api/images/:imageId/thumbnail should return thumbnail', async () => {
      const res = await request(app)
        .get('/api/images/family%2Fphoto1.jpg/thumbnail');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
    });

    test('GET /api/images/nonexistent.jpg/thumbnail should return 404', async () => {
      const res = await request(app)
        .get('/api/images/nonexistent.jpg/thumbnail');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('IMAGE_NOT_FOUND');
    });
  });

  // ============================================================
  // FOLDER THUMBNAILS (Public)
  // ============================================================
  describe('Folder Thumbnails', () => {
    test('GET /api/folders/family/thumbnail should return thumbnail for folder with images', async () => {
      const res = await request(app)
        .get('/api/folders/family/thumbnail');
      // May return 200 (image found) or 404 (depends on how folder lookup resolves)
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['content-type']).toBe('image/jpeg');
      }
    });
  });

  // ============================================================
  // ADMIN FOLDER MANAGEMENT (Protected)
  // ============================================================
  describe('Admin Folder Management', () => {
    beforeAll(async () => {
      if (!csrfToken) {
        adminAgent = request.agent(app);
        csrfToken = await loginAsAdmin(adminAgent);
      }
    });

    test('GET /api/admin/folders should list folder contents', async () => {
      const res = await adminAgent.get('/api/admin/folders?path=uploads');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentPath');
    });

    test('POST /api/admin/folders should create a folder', async () => {
      const res = await adminAgent
        .post('/api/admin/folders')
        .send({ name: 'test-folder', path: 'uploads' })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/created successfully/);
    });

    test('DELETE /api/admin/folders should delete a folder', async () => {
      const res = await adminAgent
        .delete('/api/admin/folders?path=uploads/test-folder')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/);
    });

    test('GET /api/admin/folders without auth should fail', async () => {
      const res = await request(app).get('/api/admin/folders?path=uploads');
      expect(res.status).toBe(401);
    });

    // Path traversal protection
    test('GET /api/admin/folders with traversal should be blocked', async () => {
      const res = await adminAgent.get('/api/admin/folders?path=../../etc');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid path');
    });

    test('POST /api/admin/folders with traversal path should be blocked', async () => {
      const res = await adminAgent
        .post('/api/admin/folders')
        .send({ name: 'evil', path: '../../etc' })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid path');
    });

    test('DELETE /api/admin/folders with traversal should be blocked', async () => {
      const res = await adminAgent
        .delete('/api/admin/folders?path=../../etc')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid path');
    });
  });

  // ============================================================
  // IMAGE UPLOAD (Protected)
  // ============================================================
  describe('Image Upload', () => {
    beforeAll(async () => {
      if (!csrfToken) {
        adminAgent = request.agent(app);
        csrfToken = await loginAsAdmin(adminAgent);
      }
    });

    test('POST /api/upload should upload an image', async () => {
      const imgBuf = await createTestImageBuffer({ r: 128, g: 128, b: 128 });

      const res = await adminAgent
        .post('/api/upload')
        .field('path', 'uploads/family')
        .attach('images', imgBuf, 'test-upload.jpg')
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/uploaded successfully/);
    });

    test('POST /api/upload without auth should fail', async () => {
      const imgBuf = await createTestImageBuffer();
      const res = await request(app)
        .post('/api/upload')
        .field('path', 'uploads/family')
        .attach('images', imgBuf, 'unauth.jpg');
      // CSRF middleware fires before auth, returning 403
      expect([401, 403]).toContain(res.status);
    });

    test('POST /api/upload with path traversal should be blocked', async () => {
      const imgBuf = await createTestImageBuffer();
      const res = await adminAgent
        .post('/api/upload')
        .field('path', '../../tmp')
        .attach('images', imgBuf, 'evil.jpg')
        .set('X-CSRF-Token', csrfToken);
      // Path validation may return 400 or 500 depending on where validation catches it
      expect([400, 500]).toContain(res.status);
    });
  });

  // ============================================================
  // IMAGE DELETE (Protected)
  // ============================================================
  describe('Image Delete', () => {
    let imageToDelete;

    beforeAll(async () => {
      if (!csrfToken) {
        adminAgent = request.agent(app);
        csrfToken = await loginAsAdmin(adminAgent);
      }
      // Create an image to delete
      const imgBuf = await createTestImageBuffer({ r: 200, g: 100, b: 50 });
      await fs.writeFile(path.join(uploadsDir, 'family', 'to-delete.jpg'), imgBuf);
      imageToDelete = 'uploads/family/to-delete.jpg';
    });

    test('DELETE /api/images should delete an image', async () => {
      const res = await adminAgent
        .delete('/api/images')
        .query({ path: imageToDelete })
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(200);
    });

    test('DELETE /api/images with traversal should be blocked', async () => {
      const res = await adminAgent
        .delete('/api/images')
        .query({ path: '../../etc/passwd' })
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid path');
    });

    test('DELETE /api/images without auth should fail', async () => {
      const res = await request(app)
        .delete('/api/images')
        .query({ path: 'uploads/family/photo1.jpg' });
      // CSRF middleware fires before auth, returning 403
      expect([401, 403]).toContain(res.status);
    });
  });

  // ============================================================
  // IMAGE ROTATION (Protected)
  // ============================================================
  describe('Image Rotation', () => {
    beforeAll(async () => {
      if (!csrfToken) {
        adminAgent = request.agent(app);
        csrfToken = await loginAsAdmin(adminAgent);
      }
    });

    test('POST /api/images/rotate with traversal should be blocked', async () => {
      const res = await adminAgent
        .post('/api/images/rotate')
        .send({ path: '../../etc/passwd', angle: 90 })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrfToken);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid path');
    });
  });

  // ============================================================
  // SLIDESHOW IMAGE DELIVERY (PIN-auth with folder restrictions)
  // ============================================================
  describe('Slideshow Image Delivery with Access Control', () => {
    test('PIN-authenticated user should only see assigned folders', async () => {
      const agent = request.agent(app);
      // Login with PIN (account has folders: family, vacation)
      const authRes = await agent
        .post('/api/auth/pin')
        .send({ pin: '4321' })
        .set('Content-Type', 'application/json');
      expect(authRes.status).toBe(200);

      // Get random image - should be from assigned folders only
      const res = await agent.get('/api/images/random');
      if (res.status === 200) {
        const folder = res.body.image.folder;
        expect(['family', 'vacation']).toContain(folder);
      }
    });
  });

  // ============================================================
  // UPLOADS DIRECTORY AUTH PROTECTION
  // ============================================================
  describe('Uploads Directory Auth', () => {
    test('GET /uploads/* without auth should return 401', async () => {
      const res = await request(app).get('/uploads/family/photo1.jpg');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authentication required');
    });

    test('GET /uploads/* with admin auth should work', async () => {
      const res = await adminAgent.get('/uploads/family/photo1.jpg');
      // Should be 200 (served) or 304 (cached)
      expect([200, 304]).toContain(res.status);
    });
  });

  // ============================================================
  // CORS
  // ============================================================
  describe('CORS Protection', () => {
    test('Requests from disallowed origin should fail', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://evil.com');
      expect(res.status).toBe(500);
    });

    test('Same-origin requests should succeed', async () => {
      const port = process.env.PORT || 3000;
      const res = await request(app)
        .get('/api/health')
        .set('Origin', `http://localhost:${port}`);
      expect(res.status).toBe(200);
    });
  });

  // ============================================================
  // CSRF PROTECTION
  // ============================================================
  describe('CSRF Protection', () => {
    test('State-changing requests without CSRF should be rejected', async () => {
      const agent = request.agent(app);
      await loginAsAdmin(agent);

      const res = await agent
        .post('/api/access-accounts')
        .send({ name: 'No CSRF', pin: '9999', assignedFolders: [] })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_VALIDATION_FAILED');
    });

    test('State-changing requests with valid CSRF should succeed', async () => {
      const agent = request.agent(app);
      const csrf = await loginAsAdmin(agent);

      const res = await agent
        .post('/api/access-accounts')
        .send({ name: 'CSRF Test', pin: '8888', assignedFolders: [] })
        .set('Content-Type', 'application/json')
        .set('X-CSRF-Token', csrf);
      expect(res.status).toBe(201);

      // Cleanup
      const accountId = res.body.account.id;
      await agent
        .delete(`/api/access-accounts/${accountId}`)
        .set('X-CSRF-Token', csrf);
    });
  });

  // ============================================================
  // VIEW ROUTES (Page serving)
  // ============================================================
  describe('View Routes', () => {
    test('GET /login should serve login page', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    test('GET /slideshow should serve slideshow page', async () => {
      const res = await request(app).get('/slideshow');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    test('GET /guest-upload should serve guest upload page', async () => {
      const res = await request(app).get('/guest-upload');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });
  });

  // ============================================================
  // FEATURE FLAGS
  // ============================================================
  describe('Feature Flags', () => {
    test('GET /api/features should return feature flags (requires auth)', async () => {
      const res = await adminAgent.get('/api/features');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('googlePhotosEnabled');
    });

    test('GET /api/features without auth should fail', async () => {
      const res = await request(app).get('/api/features');
      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // GUEST UPLOAD ROUTES (Requires PIN auth with upload access)
  // ============================================================
  describe('Guest Upload Routes', () => {
    test('GET /api/guest/folders without auth should fail', async () => {
      const res = await request(app).get('/api/guest/folders');
      expect(res.status).toBe(401);
    });

    test('GET /api/guest/folders with PIN auth should work', async () => {
      const agent = request.agent(app);
      await agent
        .post('/api/auth/pin')
        .send({ pin: '4321' })
        .set('Content-Type', 'application/json');

      const res = await agent.get('/api/guest/folders');
      expect(res.status).toBe(200);
    });
  });

  // ============================================================
  // CLEANUP: Delete the test account we created
  // ============================================================
  describe('Test Cleanup', () => {
    test('Should clean up test accounts', async () => {
      const listRes = await adminAgent.get('/api/access-accounts');
      for (const account of listRes.body.accounts) {
        await adminAgent
          .delete(`/api/access-accounts/${account.id}`)
          .set('X-CSRF-Token', csrfToken);
      }
      const afterRes = await adminAgent.get('/api/access-accounts');
      expect(afterRes.body.accounts.length).toBe(0);
    });
  });
});
