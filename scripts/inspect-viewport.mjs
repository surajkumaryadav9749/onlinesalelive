import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9224',
  'http://localhost:3000',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9224/json').then((r) => r.json());
    const target = list.find((p) => p.url.includes('localhost:3000'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const all = Array.from(document.querySelectorAll('*'));
              const inViewport = [];
              for (const el of all) {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0) {
                  inViewport.push({
                    tag: el.tagName,
                    id: el.id,
                    className: el.className ? el.className.toString().slice(0, 50) : '',
                    w: Math.round(r.width),
                    h: Math.round(r.height),
                    top: Math.round(r.top),
                    hasImg: el.tagName === 'IMG' ? el.src : undefined,
                    textContent: el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.children.length === 0 ? el.textContent.trim().slice(0, 40) : undefined
                  });
                }
              }
              return inViewport;
            })()`,
            returnByValue: true,
          },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const items = data.result?.result?.value || [];
      console.log('Total in viewport elements:', items.length);
      console.log(items.filter((i) => i.hasImg || (i.textContent && i.w * i.h > 1000)));
      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 3000);
