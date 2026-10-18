import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9297',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9297/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(
        JSON.stringify({
          id: 3,
          method: 'Page.navigate',
          params: { url: 'http://localhost:3000/' },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 3) {
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              id: 4,
              method: 'Runtime.evaluate',
              params: {
                expression: `(() => {
                  const paints = performance.getEntriesByType('paint');
                  const lcp = performance.getEntriesByType('largest-contentful-paint');
                  const pointElements = [
                    { x: 200, y: 50, el: document.elementFromPoint(200, 50)?.outerHTML?.slice(0, 80) },
                    { x: 200, y: 150, el: document.elementFromPoint(200, 150)?.outerHTML?.slice(0, 80) },
                    { x: 200, y: 250, el: document.elementFromPoint(200, 250)?.outerHTML?.slice(0, 80) },
                    { x: 200, y: 400, el: document.elementFromPoint(200, 400)?.outerHTML?.slice(0, 80) },
                  ];

                  const h1 = document.querySelector('h1');
                  const heroImg = document.querySelector('.hero-banner-image');

                  return {
                    paints,
                    lcp,
                    pointElements,
                    h1: h1 ? {
                      rect: h1.getBoundingClientRect(),
                      text: h1.textContent?.slice(0, 50),
                      display: window.getComputedStyle(h1).display,
                      visibility: window.getComputedStyle(h1).visibility,
                      opacity: window.getComputedStyle(h1).opacity
                    } : null,
                    heroImg: heroImg ? {
                      rect: heroImg.getBoundingClientRect(),
                      src: heroImg.src?.slice(0, 60),
                      currentSrc: heroImg.currentSrc?.slice(0, 60),
                      complete: heroImg.complete,
                      naturalWidth: heroImg.naturalWidth,
                      naturalHeight: heroImg.naturalHeight,
                      display: window.getComputedStyle(heroImg).display,
                      opacity: window.getComputedStyle(heroImg).opacity
                    } : null
                  };
                })()`,
                returnByValue: true,
              },
            })
          );
        }, 4000);
      } else if (data.id === 4) {
        console.log('Homepage Diagnostic:');
        console.log(JSON.stringify(data.result?.result?.value, null, 2));
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
}, 2000);
