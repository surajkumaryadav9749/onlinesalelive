import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9253',
  'http://localhost:3000/',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9253/json').then((r) => r.json());
    const target = list.find((p) => p.type === 'page' && p.url.includes('localhost:3000'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const img = document.querySelector('img.hero-banner-image');
              return {
                img: img ? {
                  src: img.src,
                  currentSrc: img.currentSrc,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  complete: img.complete,
                  rect: img.getBoundingClientRect(),
                  computedOpacity: window.getComputedStyle(img).opacity,
                  computedDisplay: window.getComputedStyle(img).display,
                  computedVisibility: window.getComputedStyle(img).visibility,
                  parent: {
                    tag: img.parentElement?.tagName,
                    display: img.parentElement ? window.getComputedStyle(img.parentElement).display : null,
                    opacity: img.parentElement ? window.getComputedStyle(img.parentElement).opacity : null,
                    grandparentDisplay: img.parentElement?.parentElement ? window.getComputedStyle(img.parentElement.parentElement).display : null,
                    grandparentOpacity: img.parentElement?.parentElement ? window.getComputedStyle(img.parentElement.parentElement).opacity : null
                  }
                } : null,
                elementsInViewport: Array.from(document.querySelectorAll('h1, h2, h3, p, span, div, img'))
                  .filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width > 50 && r.height > 20 && r.top >= 0 && r.top < window.innerHeight;
                  })
                  .map(el => ({
                    tag: el.tagName,
                    rect: { top: Math.round(el.getBoundingClientRect().top), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) },
                    text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent.trim().slice(0, 30) : ''
                  }))
              };
            })()`,
            returnByValue: true,
          },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      console.log('DOM & Image Analysis:', JSON.stringify(data.result?.result?.value, null, 2));
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
