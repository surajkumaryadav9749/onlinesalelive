import fs from 'fs';

async function compare() {
  const homeRes = await fetch('http://localhost:3000/');
  const homeHtml = await homeRes.text();

  const dealsRes = await fetch('http://localhost:3000/deals');
  const dealsHtml = await dealsRes.text();

  console.log('Home HTML length:', homeHtml.length);
  console.log('Deals HTML length:', dealsHtml.length);

  // Check header / body attributes
  console.log('Home body start:', homeHtml.substring(homeHtml.indexOf('<body'), homeHtml.indexOf('<body') + 200));
  console.log('Deals body start:', dealsHtml.substring(dealsHtml.indexOf('<body'), dealsHtml.indexOf('<body') + 200));

  // Check main tag
  console.log('Home main start:', homeHtml.substring(homeHtml.indexOf('<main'), homeHtml.indexOf('<main') + 200));
  console.log('Deals main start:', dealsHtml.substring(dealsHtml.indexOf('<main'), dealsHtml.indexOf('<main') + 200));
}

compare().catch(console.error);
