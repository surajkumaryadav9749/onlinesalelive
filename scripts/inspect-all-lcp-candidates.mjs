import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9294',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9294/json').then((r) => r.json());
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
                  const viewWidth = window.innerWidth;
                  const viewHeight = window.innerHeight;

                  // Find all text elements and image elements
                  const candidates = [];
                  const all = document.querySelectorAll('h1, h2, h3, p, span, img');
                  for (const el of all) {
                    const r = el.getBoundingClientRect();
                    // Check if intersects viewport
                    const visibleWidth = Math.max(0, Math.min(r.right, viewWidth) - Math.max(r.left, 0));
                    const visibleHeight = Math.max(0, Math.min(r.bottom, viewHeight) - Math.max(r.top, 0));
                    const visibleArea = visibleWidth * visibleHeight;

                    if (visibleArea > 100) {
                      candidates.push({
                        tag: el.tagName,
                        classes: el.className?.toString().slice(0, 40),
                        visibleArea,
                        rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) },
                        text: el.tagName !== 'IMG' ? el.textContent?.trim().slice(0, 40) : undefined,
                        imgSrc: el.tagName === 'IMG' ? el.currentSrc?.slice(0, 60) : undefined,
                        naturalSize: el.tagName === 'IMG' ? { w: el.naturalWidth, h: el.naturalHeight } : undefined
                      });
                    }
                  }

                  candidates.sort((a, b) => b.visibleArea - a.visibleArea);

                  return {
                    viewWidth,
                    viewHeight,
                    candidateCount: candidates.length,
                    top5Candidates: candidates.slice(0, 5)
                  };
                })()`,
                returnByValue: true,
              },
            })
          );
        }, 3000);
      } else if (data.id === 4) {
        console.log('Viewport & Top Candidates:');
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
