import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9293',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9293/json').then((r) => r.json());
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
                  function getAncestors(el) {
                    const list = [];
                    let curr = el;
                    while (curr && curr !== document.documentElement) {
                      const style = window.getComputedStyle(curr);
                      list.push({
                        tag: curr.tagName,
                        className: curr.className?.toString().slice(0, 40),
                        overflow: style.overflow,
                        overflowX: style.overflowX,
                        overflowY: style.overflowY,
                        position: style.position,
                        contain: style.contain,
                        contentVisibility: style.contentVisibility,
                        filter: style.filter,
                        transform: style.transform,
                        willChange: style.willChange,
                        opacity: style.opacity
                      });
                      curr = curr.parentElement;
                    }
                    return list;
                  }

                  const h1 = document.querySelector('h1');
                  const heroImg = document.querySelector('.hero-banner-image');
                  return {
                    h1Ancestors: h1 ? getAncestors(h1) : null,
                    heroImgAncestors: heroImg ? getAncestors(heroImg) : null
                  };
                })()`,
                returnByValue: true,
              },
            })
          );
        }, 2000);
      } else if (data.id === 4) {
        console.log('Ancestors:');
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
