import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9275',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9275/json').then((r) => r.json());
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
                    url: entry.url ? entry.url.slice(0, 50) : '',
                    size: entry.size
                  });
                }
              });
              po.observe({ type: 'largest-contentful-paint', buffered: true });
            `,
          },
        })
      );

      // Navigate to a page on localhost:3000 that has just the Next.js image
      // Or navigate to data url
      ws.send(
        JSON.stringify({
          id: 4,
          method: 'Page.navigate',
          params: {
            url: 'http://localhost:3000/_next/image?url=%2Fuploads%2Fbanners%2F1790706361138-modern-backpack-and-smartwatch-display.png&w=640&q=75',
          },
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
        }, 2000);
      } else if (data.id === 5) {
        console.log('Isolated Next.js image LCP:', JSON.stringify(data.result?.result?.value));
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
}, 1500);
