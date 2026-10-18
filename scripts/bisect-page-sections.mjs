import http from 'http';
import { spawn } from 'child_process';

async function testSectionHtml(bodyHtml, name, scriptsHtml) {
  return new Promise((resolve) => {
    const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/0krr-q1sf1bfl.css">
    </head><body class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8 space-y-10 sm:space-y-16">
      ${bodyHtml}
    </div>
    ${scriptsHtml}
    </body></html>`;

    const server = http.createServer(async (req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fullHtml);
      } else {
        try {
          const proxyRes = await fetch(`http://localhost:3000${req.url}`, { headers: req.headers });
          res.writeHead(proxyRes.status, Object.fromEntries(proxyRes.headers.entries()));
          const buf = await proxyRes.arrayBuffer();
          res.end(Buffer.from(buf));
        } catch {
          res.writeHead(404);
          res.end();
        }
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const testUrl = `http://127.0.0.1:${port}/`;

      const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9269',
        '--window-size=412,823',
        'about:blank',
      ]);

      setTimeout(async () => {
        try {
          const list = await fetch('http://127.0.0.1:9269/json').then((r) => r.json());
          const target = list.find((t) => t.type === 'page');
          const ws = new WebSocket(target.webSocketDebuggerUrl);

          ws.onopen = () => {
            ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
            ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
            ws.send(
              JSON.stringify({
                id: 3,
                method: 'Page.addScriptToEvaluateOnNewDocument',
                params: {
                  source: `
                    window.__lcp = [];
                    const po = new PerformanceObserver((entryList) => {
                      for (const entry of entryList.getEntries()) {
                        window.__lcp.push({
                          time: Math.round(entry.startTime),
                          tag: entry.element ? entry.element.tagName : null,
                          cls: entry.element ? entry.element.className : null,
                          text: entry.element ? entry.element.textContent?.slice(0, 30) : null
                        });
                      }
                    });
                    po.observe({ type: 'largest-contentful-paint', buffered: true });
                  `,
                },
              })
            );

            ws.send(
              JSON.stringify({
                id: 4,
                method: 'Page.navigate',
                params: { url: testUrl },
              })
            );
          };

          ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.id === 4) {
              setTimeout(() => {
                ws.send(
                  JSON.stringify({
                    id: 5,
                    method: 'Runtime.evaluate',
                    params: {
                      expression: 'window.__lcp',
                      returnByValue: true,
                    },
                  })
                );
              }, 2500);
            } else if (data.id === 5) {
              const res = data.result?.result?.value || [];
              console.log(`[${name}] LCP:`, JSON.stringify(res));
              ws.close();
              chrome.kill();
              server.close();
              resolve(res);
            }
          };
        } catch (e) {
          chrome.kill();
          server.close();
          resolve(null);
        }
      }, 1500);
    });
  });
}

async function run() {
  const homeHtml = await fetch('http://localhost:3000/').then((r) => r.text());
  const scriptsMatch = (homeHtml.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi) || []).join('\n');

  // Split by section tags
  const sections = homeHtml.match(/<section[\s\S]*?<\/section>/gi) || [];
  console.log(`Found ${sections.length} sections on homepage.`);

  // Test 1: Sections 0..2 (Hero, Heading, Discovery, Deals)
  const first3 = sections.slice(0, 3).join('\n');
  await testSectionHtml(first3, 'Sections 0..2', scriptsMatch);

  // Test 2: Sections 0..5
  if (sections.length > 5) {
    const first5 = sections.slice(0, 5).join('\n');
    await testSectionHtml(first5, 'Sections 0..4', scriptsMatch);
  }

  // Test 3: All Sections
  const allSections = sections.join('\n');
  await testSectionHtml(allSections, 'All Sections', scriptsMatch);

  process.exit(0);
}

run().catch(console.error);
