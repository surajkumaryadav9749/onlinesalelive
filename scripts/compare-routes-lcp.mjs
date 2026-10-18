import { spawn } from 'child_process';

async function testUrl(url, name) {
  return new Promise((resolve) => {
    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9301',
      '--window-size=412,823',
      'about:blank',
    ]);

    setTimeout(async () => {
      try {
        const list = await fetch('http://127.0.0.1:9301/json').then((r) => r.json());
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
                  window.__lcpEntries = [];
                  const po = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                      window.__lcpEntries.push({
                        startTime: Math.round(entry.startTime),
                        elementTag: entry.element ? entry.element.tagName : null,
                        elementClass: entry.element ? entry.element.className : null,
                        url: entry.url ? entry.url.slice(0, 60) : ''
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
              params: { url },
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
                    expression: 'window.__lcpEntries',
                    returnByValue: true,
                  },
                })
              );
            }, 3000);
          } else if (data.id === 5) {
            console.log(`[${name}] LCP entries:`, JSON.stringify(data.result?.result?.value));
            ws.close();
            chrome.kill();
            resolve();
          }
        };
      } catch (e) {
        chrome.kill();
        resolve();
      }
    }, 1500);
  });
}

async function main() {
  await testUrl('http://localhost:3000/deals', 'Deals Page');
  await testUrl('http://localhost:3000/about', 'About Page');
  await testUrl('http://localhost:3000/privacy-policy', 'Privacy Policy Page');
  await testUrl('http://localhost:3000/', 'Home Page');
}

main();
