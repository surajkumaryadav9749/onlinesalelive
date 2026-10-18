import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9290',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9290/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Console.enable' }));
      ws.send(
        JSON.stringify({
          id: 4,
          method: 'Page.addScriptToEvaluateOnNewDocument',
          params: {
            source: `
              window.__debug = {
                lcp: [],
                fcp: null,
                errors: [],
                logs: [],
                poSupported: false
              };

              try {
                const po = new PerformanceObserver((entryList) => {
                  for (const entry of entryList.getEntries()) {
                    window.__debug.lcp.push({
                      startTime: Math.round(entry.startTime),
                      size: entry.size,
                      renderTime: Math.round(entry.renderTime),
                      loadTime: Math.round(entry.loadTime),
                      tag: entry.element ? entry.element.tagName : null,
                      className: entry.element ? entry.element.className : null,
                      text: entry.element ? entry.element.textContent?.slice(0, 30) : null
                    });
                  }
                });
                po.observe({ type: 'largest-contentful-paint', buffered: true });
                window.__debug.poSupported = true;
              } catch (e) {
                window.__debug.errors.push('PO error: ' + e.message);
              }

              window.addEventListener('error', (e) => {
                window.__debug.errors.push('Window error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
              });
            `,
          },
        })
      );

      ws.send(
        JSON.stringify({
          id: 5,
          method: 'Page.navigate',
          params: { url: 'http://localhost:3000/' },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Console.messageAdded') {
        console.log('[Browser Console]', data.params.message.text);
      }
      if (data.id === 5) {
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              id: 6,
              method: 'Runtime.evaluate',
              params: {
                expression: 'window.__debug',
                returnByValue: true,
              },
            })
          );
        }, 3000);
      } else if (data.id === 6) {
        console.log('Homepage Debug Result:');
        console.log(JSON.stringify(data.result?.result?.value, null, 2));
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
