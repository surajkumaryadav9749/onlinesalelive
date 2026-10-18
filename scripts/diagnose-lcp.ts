import fs from 'fs';

const trace = JSON.parse(fs.readFileSync('./live-lighthouse-0.trace.json', 'utf8'));
const events = trace.traceEvents || trace;

const fcpEvent = events.find((e: any) => e.name === 'firstContentfulPaint');
console.log('FCP event:', fcpEvent);

// Check all Paint events at or before FCP
if (fcpEvent) {
  const earlyPaints = events.filter((e: any) => e.name === 'Paint' && e.ts <= fcpEvent.ts + 100000);
  console.log('Paints around FCP:', earlyPaints.length);
  earlyPaints.forEach((p: any) => {
    console.log('Paint at', p.ts, 'nodeId:', p.args?.data?.nodeId, 'nodeName:', p.args?.data?.nodeName);
  });
}
