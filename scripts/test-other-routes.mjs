import { spawn } from 'child_process';

async function testPage(url) {
  return new Promise((resolve) => {
    const port = 9226 + Math.floor(Math.random() * 100);
    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      url,
    ]);

    setTimeout(async () => {
      try {
        const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
        const target = list.find((p) => p.url.includes(url.replace('http://localhost:3000', '')));
        if (!target) {
          chrome.kill();
          return resolve({ url, error: 'target not found' });
        }
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              id: 1,
              method: 'Runtime.evaluate',
              params: {
                expression: `new Promise((res) => {
                  try {
                    const po = new PerformanceObserver((list) => {
                      const entries = list.getEntries().map(e => ({
                        startTime: Math.round(e.startTime),
                        size: e.size,
                        url: e.url,
                        elementTag: e.element?.tagName
                      }));
                      res(entries);
                    });
                    po.observe({ type: 'largest-contentful-paint', buffered: true });
                    setTimeout(() => res('NO_LCP'), 2500);
                  } catch(e) {
                    res('ERR: ' + e.message);
                  }
                })`,
                awaitPromise: true,
                returnByValue: true,
              },
            })
          );
        };

        ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          ws.close();
          chrome.kill();
          resolve({ url, result: data.result?.result?.value });
        };
      } catch (err) {
        chrome.kill();
        resolve({ url, error: err.message });
      }
    }, 2500);
  });
}

async function run() {
  console.log('Testing /products:');
  console.log(await testPage('http://localhost:3000/products'));

  console.log('Testing /categories:');
  console.log(await testPage('http://localhost:3000/categories'));
}

run();
