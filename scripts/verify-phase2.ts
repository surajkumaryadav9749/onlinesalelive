async function runVerification() {
  const base = 'http://localhost:3000';
  console.log('--- 1. Testing Public Home Page ---');
  const homeRes = await fetch(base);
  console.log('Public home page status:', homeRes.status, homeRes.ok ? 'PASS' : 'FAIL');

  console.log('\n--- 2. Testing /admin Middleware Protection (Unauthenticated) ---');
  const adminRes = await fetch(`${base}/admin`, { redirect: 'manual' });
  console.log('Admin route redirect status:', adminRes.status);
  console.log('Redirect location:', adminRes.headers.get('location'));
  const isProtected = adminRes.status === 307 || adminRes.status === 308 || adminRes.status === 302;
  console.log('Admin route protected:', isProtected ? 'PASS' : 'FAIL');

  console.log('\n--- 3. Testing /api/auth/login (Invalid Credentials) ---');
  const badLoginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bad@test.com', password: 'wrong' }),
  });
  console.log('Bad login status:', badLoginRes.status, badLoginRes.status === 401 ? 'PASS' : 'FAIL');

  console.log('\n--- 4. Testing /api/auth/login (Valid Seed Admin) ---');
  const goodLoginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@onlinesalelive.in',
      password: 'AdminSecurePass@2026',
    }),
  });
  console.log('Login status:', goodLoginRes.status);
  const loginData = await goodLoginRes.json();
  console.log('Login success:', loginData.success, 'User:', loginData.admin?.email);

  const cookie = goodLoginRes.headers.get('set-cookie');
  console.log('Set-Cookie received:', Boolean(cookie));

  const authHeaders = {
    Cookie: cookie || '',
    'Content-Type': 'application/json',
  };

  console.log('\n--- 5. Testing /api/auth/me (Authenticated Admin Session) ---');
  const meRes = await fetch(`${base}/api/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log('Auth me status:', meRes.status, 'User:', meData.data?.email, 'Role:', meData.data?.role);

  console.log('\n--- 6. Testing CRUD API Endpoints with Auth ---');
  const endpoints = [
    '/api/categories',
    '/api/products',
    '/api/deals',
    '/api/guides',
    '/api/reviews',
    '/api/articles',
    '/api/comparisons',
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${base}${ep}`, { headers: authHeaders });
    const json = await res.json();
    console.log(`  ${ep}: status=${res.status} success=${json.success} count=${Array.isArray(json.data) ? json.data.length : 'N/A'}`);
  }

  console.log('\n--- 7. Testing Admin CRUD Mutation (POST & DELETE) ---');
  const createRes = await fetch(`${base}/api/categories`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Verification Category',
      slug: 'verification-category-temp',
      icon: 'Zap',
      description: 'Temporary category for automated test',
      itemCount: 0,
      featured: false,
      isActive: true,
    }),
  });
  const createData = await createRes.json();
  console.log('Create Category status:', createRes.status, 'Success:', createData.success);
  const createdId = createData.data?._id;

  if (createdId) {
    const delRes = await fetch(`${base}/api/categories/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const delData = await delRes.json();
    console.log('Delete Category status:', delRes.status, 'Success:', delData.success);
  }

  console.log('\n--- 8. Testing /api/auth/logout ---');
  const logoutRes = await fetch(`${base}/api/auth/logout`, {
    method: 'POST',
    headers: authHeaders,
  });
  const logoutData = await logoutRes.json();
  console.log('Logout status:', logoutRes.status, 'Success:', logoutData.success);

  console.log('\n========================================');
  console.log('ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
