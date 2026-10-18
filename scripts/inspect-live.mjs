async function testLive() {
  const res = await fetch('https://onlinesalelive.in/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
  });
  console.log('Live Status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);

  const bannerMatches = html.match(/<picture[\s\S]*?<\/picture>/g) || [];
  console.log('Pictures found:', bannerMatches.length);
  for (const p of bannerMatches) {
    console.log(p);
  }

  // Check upload banner URLs
  const uploads = html.match(/\/uploads\/[^\s"'>]+/g) || [];
  console.log('Uploads found in HTML:', [...new Set(uploads)]);

  for (const u of [...new Set(uploads)].slice(0, 5)) {
    const fullUrl = `https://onlinesalelive.in${u}`;
    const imgRes = await fetch(fullUrl, { method: 'HEAD' });
    console.log(u, '-> status:', imgRes.status, 'size:', imgRes.headers.get('content-length'));
  }
}

testLive().catch(console.error);
