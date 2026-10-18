import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9299',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9299/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    const consoleLogs = [];

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(
        JSON.stringify({
          id: 3,
          method: 'Page.addScriptToEvaluateOnNewDocument',
          params: {
            source: `
              window.__diagnostics = {
                lcp: [],
                paints: [],
                errors: [],
                heroImgState: []
              };

              const poLCP = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                  window.__diagnostics.lcp.push({
                    startTime: Math.round(entry.startTime),
                    renderTime: Math.round(entry.renderTime),
                    loadTime: Math.round(entry.loadTime),
                    size: entry.size,
                    url: entry.url,
                    element: entry.element ? {
                      tag: entry.element.tagName,
                      class: entry.element.className,
                      src: entry.element.src,
                      style: entry.element.getAttribute('style')
                    } : null
                  });
                }
              });
              poLCP.observe({ type: 'largest-contentful-paint', buffered: true });

              const poPaint = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                  window.__diagnostics.paints.push({
                    name: entry.name,
                    startTime: Math.round(entry.startTime)
                  });
                }
              });
              poPaint.observe({ type: 'paint', buffered: true });

              window.addEventListener('error', (e) => {
                window.__diagnostics.errors.push({ msg: e.message, src: e.filename });
              });

              setInterval(() => {
                const img = document.querySelector('img.hero-banner-image');
                if (img) {
                  window.__diagnostics.heroImgState.push({
                    time: Math.round(performance.now()),
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    currentSrc: img.currentSrc ? img.currentSrc.slice(0, 80) : '',
                    visible: img.offsetParent !== null
                  });
                }
              }, 200);
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
                expression: 'window.__diagnostics',
                returnByValue: true,
              },
            })
          );
        }, 3000);
      } else if (data.id === 5) {
        console.log('Diagnostics:', JSON.stringify(data.result?.result?.value, null, 2));
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
