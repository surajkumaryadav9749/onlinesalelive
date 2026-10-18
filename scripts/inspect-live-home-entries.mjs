import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9310',
  '--window-size=412,823',
  'http://localhost:3000/',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9310/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && t.url.includes('localhost:3000'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const entries = performance.getEntries();
              return {
                url: location.href,
                title: document.title,
                allEntryTypes: Array.from(new Set(entries.map(e => e.entryType))),
                paints: entries.filter(e => e.entryType === 'paint').map(e => ({ name: e.name, time: Math.round(e.startTime) })),
                navigation: entries.filter(e => e.entryType === 'navigation').map(e => ({
                  responseEnd: Math.round(e.responseEnd),
                  domContentLoaded: Math.round(e.domContentLoadedEventEnd),
                  loadEventEnd: Math.round(e.loadEventEnd)
                })),
                lcpElementDetails: (() => {
                  const h1 = document.querySelector('h1');
                  const heroImg = document.querySelector('img.hero-banner-image');
                  return {
                    h1: h1 ? { text: h1.textContent, rect: h1.getBoundingClientRect() } : null,
                    heroImg: heroImg ? { src: heroImg.currentSrc, naturalWidth: heroImg.naturalWidth, rect: heroImg.getBoundingClientRect() } : null
                  };
                })()
              };
            })()`,
            returnByValue: true,
          },
        })
      );
    };

    ws.onmessage = (msg) => {
      console.log(JSON.stringify(JSON.parse(msg.data).result?.result?.value, null, 2));
      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 3000);
