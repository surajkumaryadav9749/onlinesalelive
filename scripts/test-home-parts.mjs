import http from 'http';
import { spawn } from 'child_process';

async function testHtmlContent(html, name) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const testUrl = `http://127.0.0.1:${port}/`;

      const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9285',
        '--window-size=412,823',
        'about:blank',
      ]);

      setTimeout(async () => {
        try {
          const list = await fetch('http://127.0.0.1:9285/json').then((r) => r.json());
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
                          size: entry.size,
                          tag: entry.element ? entry.element.tagName : null,
                          cls: entry.element ? entry.element.className : null,
                          text: entry.element ? entry.element.textContent?.slice(0, 35) : null
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
              console.log(`[${name}] LCP entries:`, JSON.stringify(res));
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
  const [homeHtml, dealsHtml] = await Promise.all([
    fetch('http://localhost:3000/').then((r) => r.text()),
    fetch('http://localhost:3000/deals').then((r) => r.text()),
  ]);

  // Test 1: Full Deals HTML
  await testHtmlContent(dealsHtml, 'Deals Full HTML');

  // Test 2: Full Home HTML
  await testHtmlContent(homeHtml, 'Home Full HTML');

  // Test 3: Deals main inside Home shell
  const homeMainMatch = homeHtml.match(/<main[\s\S]*?<\/main>/i)?.[0];
  const dealsMainMatch = dealsHtml.match(/<main[\s\S]*?<\/main>/i)?.[0];

  if (dealsMainMatch && homeMainMatch) {
    const dealsInHome = homeHtml.replace(homeMainMatch, dealsMainMatch);
    await testHtmlContent(dealsInHome, 'Deals Main inside Home Shell');

    const homeInDeals = dealsHtml.replace(dealsMainMatch, homeMainMatch);
    await testHtmlContent(homeInDeals, 'Home Main inside Deals Shell');
  }

  process.exit(0);
}

run().catch(console.error);
