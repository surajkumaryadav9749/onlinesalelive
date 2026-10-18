import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9289',
  '--window-size=412,823',
  'http://localhost:3000/',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9289/json').then((r) => r.json());
    console.log('Targets:', list.map(t => ({ type: t.type, url: t.url })));
    const target = list.find(t => t.type === 'page' && t.url.includes('localhost:3000')) || list.find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const hero = document.querySelector(".hero-section-container");
              const heroImg = document.querySelector(".hero-banner-image");
              const rHero = hero ? hero.getBoundingClientRect() : null;
              const rImg = heroImg ? heroImg.getBoundingClientRect() : null;
              return {
                heroFound: Boolean(hero),
                heroRect: rHero ? { top: Math.round(rHero.top), bottom: Math.round(rHero.bottom), width: Math.round(rHero.width), height: Math.round(rHero.height) } : null,
                heroImg: heroImg ? {
                  tagName: heroImg.tagName,
                  src: heroImg.src,
                  currentSrc: heroImg.currentSrc,
                  complete: heroImg.complete,
                  naturalWidth: heroImg.naturalWidth,
                  naturalHeight: heroImg.naturalHeight,
                  width: heroImg.width,
                  height: heroImg.height,
                  rect: rImg ? { top: Math.round(rImg.top), bottom: Math.round(rImg.bottom), width: Math.round(rImg.width), height: Math.round(rImg.height) } : null,
                  computedDisplay: window.getComputedStyle(heroImg).display,
                  computedVisibility: window.getComputedStyle(heroImg).visibility,
                  computedOpacity: window.getComputedStyle(heroImg).opacity,
                  parentDisplay: heroImg.parentElement ? window.getComputedStyle(heroImg.parentElement).display : null,
                  parentOpacity: heroImg.parentElement ? window.getComputedStyle(heroImg.parentElement).opacity : null,
                  grandParentDisplay: heroImg.parentElement?.parentElement ? window.getComputedStyle(heroImg.parentElement.parentElement).display : null,
                  grandParentOpacity: heroImg.parentElement?.parentElement ? window.getComputedStyle(heroImg.parentElement.parentElement).opacity : null
                } : null
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
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 3000);
