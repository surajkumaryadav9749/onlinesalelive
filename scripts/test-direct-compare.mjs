import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9282',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9282/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    const networkRequests = [];
    const consoleLogs = [];

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Console.enable' }));

      ws.send(
        JSON.stringify({
          id: 5,
          method: 'Page.addScriptToEvaluateOnNewDocument',
          params: {
            source: `
              window.__lcp = [];
              const po = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                  window.__lcp.push({
                    time: Math.round(entry.startTime),
                    tag: entry.element ? entry.element.tagName : null,
                    cls: entry.element ? entry.element.className : null,
                    text: entry.element ? entry.element.textContent?.slice(0, 30) : null
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
          id: 6,
          method: 'Page.navigate',
          params: { url: 'http://localhost:3000/' },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.method === 'Network.responseReceived') {
        networkRequests.push({
          url: data.params.response.url.slice(0, 70),
          status: data.params.response.status,
          mime: data.params.response.mimeType,
        });
      }

      if (data.method === 'Console.messageAdded') {
        consoleLogs.push(data.params.message.text);
      }

      if (data.id === 6) {
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              id: 7,
              method: 'Runtime.evaluate',
              params: {
                expression: 'window.__lcp',
                returnByValue: true,
              },
            })
          );
        }, 4000);
      } else if (data.id === 7) {
        console.log('Network Requests count:', networkRequests.length);
        console.log('Sample Network Requests:', networkRequests.slice(0, 10));
        console.log('Console Logs:', consoleLogs);
        console.log('LCP Result:', JSON.stringify(data.result?.result?.value));
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
