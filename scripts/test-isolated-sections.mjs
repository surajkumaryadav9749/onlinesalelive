import http from 'http';
import { spawn } from 'child_process';

async function testWithImageProxy(bodyHtml, name, scriptsHtml = '') {
  return new Promise((resolve) => {
    const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/0krr-q1sf1bfl.css">
    </head><body class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <main class="flex-1 w-full">${bodyHtml}</main>
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
        '--remote-debugging-port=9273',
        '--window-size=412,823',
        'about:blank',
      ]);

      setTimeout(async () => {
        try {
          const list = await fetch('http://127.0.0.1:9273/json').then((r) => r.json());
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
                          url: entry.url ? entry.url.slice(0, 50) : '',
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
  const topPart = homeHtml.match(/<header[\s\S]*?<!-- 4\. POPULAR CATEGORIES -->/i)?.[0] || '';
  const categoriesPart = homeHtml.match(/<!-- 4\. POPULAR CATEGORIES -->[\s\S]*?<!-- 5\. BUYING GUIDES & ADVICE -->/i)?.[0] || '';
  const guidesPart = homeHtml.match(/<!-- 5\. BUYING GUIDES & ADVICE -->[\s\S]*?<!-- 6\. PRODUCT REVIEWS -->/i)?.[0] || '';
  const reviewsPart = homeHtml.match(/<!-- 6\. PRODUCT REVIEWS -->[\s\S]*?<!-- 7\. LATEST SHOPPING ARTICLES & NEWS -->/i)?.[0] || '';
  const articlesPart = homeHtml.match(/<!-- 7\. LATEST SHOPPING ARTICLES & NEWS -->[\s\S]*?<\/main>/i)?.[0] || '';
  const footerPart = homeHtml.match(/<footer[\s\S]*?<\/footer>/i)?.[0] || '';
  const scriptsMatch = (homeHtml.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi) || []).join('\n');

  // Test with Categories added:
  await testWithImageProxy(topPart + categoriesPart, 'Top + Categories', scriptsMatch);

  process.exit(0);
}

run().catch(console.error);
