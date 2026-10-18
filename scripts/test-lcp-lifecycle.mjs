import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9276',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9276/json').then((r) => r.json());
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
              window.__lcpTimeline = [];
              const po = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                  window.__lcpTimeline.push({
                    capturedAt: Math.round(performance.now()),
                    startTime: Math.round(entry.startTime),
                    renderTime: Math.round(entry.renderTime),
                    loadTime: Math.round(entry.loadTime),
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
          params: { url: 'http://127.0.0.1:3000/' },
        })
      );
    };

    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      ws.send(
        JSON.stringify({
          id: 100 + checks,
          method: 'Runtime.evaluate',
          params: {
            expression: `({
              time: Math.round(performance.now()),
              readyState: document.readyState,
              entries: window.__lcpTimeline
            })`,
            returnByValue: true,
          },
        })
      );

      if (checks >= 10) {
        clearInterval(interval);
      }
    }, 1000);

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id >= 101 && data.id <= 110) {
        const val = data.result?.result?.value;
        console.log(`[Check ${data.id - 100} @ ${val?.time}ms, readyState: ${val?.readyState}] LCP count: ${val?.entries?.length}`);
        if (val?.entries?.length > 0) {
          console.log('Entries:', JSON.stringify(val.entries, null, 2));
        }
        if (data.id === 110) {
          ws.close();
          chrome.kill();
          process.exit(0);
        }
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
