import http from 'http';
import { spawn } from 'child_process';

async function run() {
  const server = http.createServer(async (req, res) => {
    try {
      const proxyRes = await fetch(`http://localhost:3000${req.url}`, {
        headers: req.headers,
      });
      const headers = Object.fromEntries(proxyRes.headers.entries());
      // Remove gzip so buffer is clean text
      delete headers['content-encoding'];
      delete headers['content-length'];

      const buf = await proxyRes.arrayBuffer();
      res.writeHead(proxyRes.status, headers);
      res.end(Buffer.from(buf));
    } catch (e) {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const testUrl = `http://127.0.0.1:${port}/`;

    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9270',
      '--window-size=412,823',
      'about:blank',
    ]);

    setTimeout(async () => {
      try {
        const list = await fetch('http://127.0.0.1:9270/json').then((r) => r.json());
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
            }, 4000);
          } else if (data.id === 5) {
            console.log('Result for Unmodified Homepage Proxy:');
            console.log(JSON.stringify(data.result?.result?.value, null, 2));
            ws.close();
            chrome.kill();
            server.close();
            process.exit(0);
          }
        };
      } catch (e) {
        chrome.kill();
        server.close();
        process.exit(1);
      }
    }, 1500);
  });
}

run().catch(console.error);
