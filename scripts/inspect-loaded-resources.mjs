import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9297',
  '--window-size=412,823',
  'http://localhost:3000/',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9297/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page' && t.url.includes('localhost:3000'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const resources = window.performance.getEntriesByType('resource').map(r => ({
                name: r.name,
                initiatorType: r.initiatorType,
                duration: Math.round(r.duration),
                transferSize: r.transferSize,
              }));
              const heroImgs = Array.from(document.querySelectorAll('.hero-banner-image')).map(img => ({
                tagName: img.tagName,
                src: img.src,
                currentSrc: img.currentSrc,
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                width: img.width,
                height: img.height,
                style: img.getAttribute('style'),
                className: img.className,
                parentElement: img.parentElement ? {
                  tag: img.parentElement.tagName,
                  className: img.parentElement.className,
                  display: window.getComputedStyle(img.parentElement).display,
                  rect: img.parentElement.getBoundingClientRect()
                } : null
              }));

              return {
                resourceCount: resources.length,
                bannerResources: resources.filter(r => r.name.includes('banner') || r.name.includes('_next/image')),
                heroImgs
              };
            })()`,
            returnByValue: true,
          },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      console.log(JSON.stringify(data.result?.result?.value, null, 2));
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
