import http from 'http';
import { spawn } from 'child_process';

async function testWithProxy(transformHtml, name) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      console.log('Proxy request:', req.url);
      if (req.url === '/') {
        const originalHtml = await fetch('http://localhost:3000/').then((r) => r.text());
        const modified = transformHtml(originalHtml);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(modified);
      } else {
        // Proxy all scripts, images, css to localhost:3000
        try {
          const proxyRes = await fetch(`http://localhost:3000${req.url}`, {
            headers: req.headers,
          });
          const headers = Object.fromEntries(proxyRes.headers.entries());
          res.writeHead(proxyRes.status, headers);
          const buf = await proxyRes.arrayBuffer();
          res.end(Buffer.from(buf));
        } catch (e) {
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
        '--remote-debugging-port=9284',
        '--window-size=412,823',
        'about:blank',
      ]);

      setTimeout(async () => {
        try {
          const list = await fetch('http://127.0.0.1:9284/json').then((r) => r.json());
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
              }, 3500);
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
  // Test 1: Full Home with all scripts and assets proxied
  await testWithProxy((html) => html, 'Full Home Proxied');

  // Test 2: Hero Section removed
  await testWithProxy(
    (html) => html.replace(/<section[^>]+hero-section-container[\s\S]*?<\/section>/i, ''),
    'Without Hero Carousel'
  );

  // Test 3: Only Hero Section
  await testWithProxy(
    (html) => {
      const hero = html.match(/<section[^>]+hero-section-container[\s\S]*?<\/section>/i)?.[0] || '';
      return html.replace(/<main[\s\S]*?<\/main>/i, `<main class="flex-1 w-full"><div class="pb-16">${hero}</div></main>`);
    },
    'Only Hero Carousel'
  );

  process.exit(0);
}

run().catch(console.error);
