import { spawn } from 'child_process';

async function testHtml(htmlSnippet, name) {
  return new Promise((resolve) => {
    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9298',
      '--window-size=412,823',
      'about:blank',
    ]);

    setTimeout(async () => {
      try {
        const list = await fetch('http://127.0.0.1:9298/json').then((r) => r.json());
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
                        url: entry.url
                      });
                    }
                  });
                  po.observe({ type: 'largest-contentful-paint', buffered: true });
                `,
              },
            })
          );

          const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlSnippet);
          ws.send(
            JSON.stringify({
              id: 4,
              method: 'Page.navigate',
              params: { url: dataUrl },
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
            }, 2000);
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
  // Test 1: Image as base64 data URI (to avoid cross-origin issues in data:text/html)
  // 100x100 solid orange PNG data url
  const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwH4oMAAEi0XQ/AAAAAElFTkSuQmCC';

  await testHtml(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
      <img src="${samplePng}" style="width: 300px; height: 200px;" />
    </body></html>`,
    'Plain Image Data URI'
  );

  await testHtml(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      .hero-container { height: 250px; position: relative; width: 100%; overflow: hidden; }
      .slide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
      .hero-banner-image { object-fit: cover; width: 100%; height: 100%; display: block; }
    </style>
    </head><body>
      <div class="hero-container">
        <div class="slide">
          <img src="${samplePng}" class="hero-banner-image" />
        </div>
      </div>
    </body></html>`,
    'Hero Image In Container'
  );

  await testHtml(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      .hero-container { height: 250px; position: relative; width: 100%; overflow: hidden; }
      .slide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
      .hero-banner-image { object-fit: cover; width: 100%; height: 100%; display: block; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
    </style>
    </head><body>
      <h1 class="sr-only">Screen Reader Only Title</h1>
      <div class="hero-container">
        <div class="slide">
          <img src="${samplePng}" class="hero-banner-image" />
        </div>
      </div>
    </body></html>`,
    'Hero Container + sr-only H1'
  );
}

main();
