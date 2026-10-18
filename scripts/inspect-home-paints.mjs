import { spawn } from 'child_process';

async function testPage(url) {
  return new Promise((resolve) => {
    const port = 9250;
    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      url,
    ]);

    setTimeout(async () => {
      try {
        const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
        const target = list[0];
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              id: 1,
              method: 'Runtime.evaluate',
              params: {
                expression: `(() => {
                  return {
                    paints: performance.getEntriesByType('paint').map(p => ({ name: p.name, time: Math.round(p.startTime) })),
                    resources: performance.getEntriesByType('resource').map(r => ({ name: r.name.slice(0, 80), duration: Math.round(r.duration), size: r.transferSize })),
                    domElements: document.querySelectorAll('*').length
                  };
                })()`,
                returnByValue: true,
              },
            })
          );
        };

        ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          ws.close();
          chrome.kill();
          resolve(data.result?.result?.value);
        };
      } catch (err) {
        chrome.kill();
        resolve({ error: err.message });
      }
    }, 3000);
  });
}

testPage('http://localhost:3000/').then(console.log);
