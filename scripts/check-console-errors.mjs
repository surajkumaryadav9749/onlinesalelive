import { spawn } from 'child_process';

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9271',
  '--window-size=412,823',
  'about:blank',
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9271/json').then((r) => r.json());
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    const consoleMessages = [];

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));

      ws.send(
        JSON.stringify({
          id: 4,
          method: 'Page.navigate',
          params: { url: 'http://localhost:3000/' },
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map((a) => a.value || a.description).join(' ');
        consoleMessages.push({ type: data.params.type, text });
      }
      if (data.method === 'Log.entryAdded') {
        consoleMessages.push({ level: data.params.entry.level, text: data.params.entry.text });
      }
      if (data.id === 4) {
        setTimeout(() => {
          console.log('Total console messages captured:', consoleMessages.length);
          for (const m of consoleMessages) {
            console.log(`[${m.type || m.level}] ${m.text}`);
          }
          ws.close();
          chrome.kill();
          process.exit(0);
        }, 4000);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
