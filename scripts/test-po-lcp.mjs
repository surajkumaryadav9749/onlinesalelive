import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9295',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9295/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    console.log('Selected target:', target.url);
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
                    name: entry.name,
                    startTime: Math.round(entry.startTime),
                    renderTime: Math.round(entry.renderTime),
                    loadTime: Math.round(entry.loadTime),
                    size: entry.size,
                    id: entry.id,
                    url: entry.url,
                    elementTag: entry.element ? entry.element.tagName : null,
                    elementClass: entry.element ? entry.element.className : null,
                    elementHTML: entry.element ? entry.element.outerHTML.slice(0, 100) : null
                  });
                }
              });
              try {
                po.observe({ type: 'largest-contentful-paint', buffered: true });
              } catch (e) {
                console.error(e);
              }
            `,
          },
        })
      );

      ws.send(
        JSON.stringify({
          id: 4,
          method: 'Page.navigate',
          params: { url: 'http://localhost:3000/' },
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
        }, 4000);
      } else if (data.id === 5) {
        console.log('PerformanceObserver LCP entries on http://localhost:3000/:');
        console.log(JSON.stringify(data.result?.result?.value, null, 2));
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 2500);
