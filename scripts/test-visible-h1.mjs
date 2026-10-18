import { spawn } from 'child_process';

async function testHtml(htmlSnippet, name) {
  return new Promise((resolve) => {
    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9305',
      '--window-size=412,823',
      'about:blank',
    ]);

    setTimeout(async () => {
      try {
        const list = await fetch('http://127.0.0.1:9305/json').then((r) => r.json());
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
                        tag: entry.element ? entry.element.tagName : null,
                        class: entry.element ? entry.element.className : null,
                        text: entry.element ? entry.element.textContent?.slice(0, 40) : null
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
            }, 2500);
          } else if (data.id === 5) {
            console.log(`[${name}] LCP:`, JSON.stringify(data.result?.result?.value));
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
  const homeRes = await fetch('http://localhost:3000/');
  const homeHtml = await homeRes.text();

  const modifiedHtml = homeHtml.replace(
    'class="sr-only">Find the Best Deals, Sales &amp; Discounts in India — OnlineSaleLive</h1>',
    'class="text-xs font-semibold text-slate-400 text-center py-1">Find the Best Deals, Sales &amp; Discounts in India — OnlineSaleLive</h1>'
  );
  console.log('Testing Home HTML with visible title:');
  await testHtml(modifiedHtml, 'Home HTML with visible H1');
}

main();
