import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9227',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9227/json').then((r) => r.json());
    const target = list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      // Enable Page and Runtime
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

      // Add script to evaluate on new document
      ws.send(
        JSON.stringify({
          id: 3,
          method: 'Page.addScriptToEvaluateOnNewDocument',
          params: {
            source: `
              window.__lcpEntries = [];
              const po = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  window.__lcpEntries.push({
                    name: entry.name,
                    startTime: entry.startTime,
                    renderTime: entry.renderTime,
                    loadTime: entry.loadTime,
                    size: entry.size,
                    id: entry.id,
                    url: entry.url,
                    element: entry.element ? {
                      tagName: entry.element.tagName,
                      id: entry.element.id,
                      className: entry.element.className,
                      outerHTML: entry.element.outerHTML.slice(0, 150)
                    } : null
                  });
                }
              });
              po.observe({ type: 'largest-contentful-paint', buffered: true });
            `,
          },
        })
      );

      // Navigate to homepage
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
        // Page navigated, wait 4 seconds then query __lcpEntries
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
        }, 3500);
      } else if (data.id === 5) {
        console.log('Captured LCP entries from page start:');
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
}, 2000);
