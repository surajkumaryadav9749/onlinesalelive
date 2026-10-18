import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9288',
    '--window-size=412,823',
    'http://localhost:3000/',
  ]);

  setTimeout(async () => {
    try {
      const list = await fetch('http://127.0.0.1:9288/json').then((r) => r.json());
      const target = list.find((p) => p.type === 'page' && p.url.includes('localhost:3000'));
      if (!target) {
        console.log('Target not found', list);
        chrome.kill();
        return;
      }
      const ws = new WebSocket(target.webSocketDebuggerUrl);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                const poEntries = window.performance.getEntriesByType('paint');
                const heroImg = document.querySelector('img.hero-banner-image');
                const allImages = Array.from(document.querySelectorAll('img')).map(img => ({
                  src: img.src?.slice(0, 60),
                  currentSrc: img.currentSrc?.slice(0, 60),
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  complete: img.complete,
                  rect: img.getBoundingClientRect(),
                  opacity: window.getComputedStyle(img).opacity,
                  display: window.getComputedStyle(img).display,
                  visibility: window.getComputedStyle(img).visibility,
                  parentDisplay: img.parentElement ? window.getComputedStyle(img.parentElement).display : null,
                  parentOpacity: img.parentElement ? window.getComputedStyle(img.parentElement).opacity : null,
                  grandParentDisplay: img.parentElement?.parentElement ? window.getComputedStyle(img.parentElement.parentElement).display : null,
                  grandParentOpacity: img.parentElement?.parentElement ? window.getComputedStyle(img.parentElement.parentElement).opacity : null,
                }));

                const viewportElements = Array.from(document.body.querySelectorAll('*'))
                  .filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width > 20 && r.height > 10 && r.top < 800 && r.bottom > 0;
                  })
                  .slice(0, 20)
                  .map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
                    rect: el.getBoundingClientRect(),
                    opacity: window.getComputedStyle(el).opacity,
                    visibility: window.getComputedStyle(el).visibility,
                    display: window.getComputedStyle(el).display
                  }));

                return {
                  paints: poEntries,
                  allImages,
                  viewportElements
                };
              })()`,
              returnByValue: true,
            },
          })
        );
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        console.log('Result:', JSON.stringify(data.result?.result?.value, null, 2));
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
}

run();
