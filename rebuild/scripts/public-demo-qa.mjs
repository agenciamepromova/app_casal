import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const output=path.resolve('../../qa-results');fs.mkdirSync(output,{recursive:true});
const liveKey='plano-a-dois-rebuild-v3',demoKey='plano-a-dois-public-demo-v1',sentinel=JSON.stringify({user:{theme:'dark'},sentinel:'leave-existing-storage-untouched'});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),requests=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{if(/\.supabase\.co\/|unused-demo\.invalid/.test(route.request().url())){requests.push(route.request().url());return route.abort()}return route.continue()});
 await page.addInitScript(({liveKey,sentinel})=>{if(!localStorage.getItem(liveKey))localStorage.setItem(liveKey,sentinel)},{liveKey,sentinel});
 const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),demoKey);
 const noOverflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto('http://localhost:3103/demo');await page.getByRole('heading',{name:'Olá, Nikson'}).waitFor();await page.getByRole('note').filter({hasText:'Modo demonstração'}).waitFor();
 for(const width of [320,375,390,430,1366]){
  await page.setViewportSize({width,height:900});
  for(const screen of ['dashboard','movimentacoes','agenda','mais','cartao-demo','acai-demo']){await page.goto('http://localhost:3103/demo/'+screen);await page.locator('h1').waitFor();await noOverflow();if(width===320||width===390)await page.screenshot({path:path.join(output,'public-demo-'+screen+'-'+width+'.png'),fullPage:true})}
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3103/demo/movimentacoes');
 await page.getByLabel('Contexto',{exact:true}).selectOption('demo-casa');await page.getByRole('button',{name:'Registrar',exact:true}).click();
 let dialog=page.getByRole('dialog');await dialog.getByLabel('Valor (R$)',{exact:true}).fill('19,90');await dialog.getByLabel('Descrição curta').fill('Apenas demo QA');await dialog.getByLabel('Conta',{exact:true}).selectOption('nubank');assert.equal(await dialog.getByLabel('Contexto',{exact:true}).inputValue(),'demo-casa');await noOverflow();await dialog.getByRole('button',{name:'Registrar',exact:true}).click();await page.getByRole('status').filter({hasText:'Registro salvo'}).waitFor();
 let saved=await state();assert.equal(saved.transactions[0].description,'Apenas demo QA');assert.equal(saved.transactions[0].projectId,'demo-casa');assert.equal(saved.transactions[0].amountCents,1990);
 await page.getByRole('button',{name:'Registrar',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Entrada',exact:true}).click();await dialog.getByLabel('Valor (R$)',{exact:true}).fill('20,00');await dialog.getByLabel('Descrição curta').fill('Entrada apenas demo QA');await dialog.getByLabel('Conta',{exact:true}).selectOption('nubank');await dialog.getByRole('button',{name:'Registrar',exact:true}).click();await page.getByRole('status').filter({hasText:'Registro salvo'}).waitFor();saved=await state();assert.equal(saved.transactions[0].type,'income');assert.equal(saved.transactions[0].amountCents,2000);
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),liveKey),sentinel);assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('sb-'))),[]);
 const agendaLink=page.locator('.mobile-nav').getByRole('link',{name:'Agenda',exact:true});assert.equal(await agendaLink.getAttribute('href'),'/demo/agenda');await agendaLink.click();await page.waitForURL('**/demo/agenda');assert.match(page.url(),/\/demo\/agenda$/);
 await page.getByRole('button',{name:'Nova conta ou compromisso'}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('O que é?').fill('Energia apenas demo');await dialog.getByLabel('Valor previsto (R$)').fill('100,00');await dialog.getByLabel('Conta para pagar ou receber').selectOption('nubank');await dialog.getByRole('button',{name:'Salvar compromisso'}).click();await page.getByRole('status').filter({hasText:'Compromisso salvo'}).waitFor();
 await page.getByRole('button',{name:/Confirmar Energia apenas demo/}).first().click();dialog=page.getByRole('dialog');await dialog.getByLabel('Valor efetivo').fill('103,45');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await page.getByRole('status').filter({hasText:'confirmado uma vez'}).waitFor();saved=await state();assert.equal(saved.transactions[0].amountCents,10345);
 await page.reload();await page.locator('h1').waitFor();saved=await state();assert.ok(saved.transactions.some(item=>item.description==='Apenas demo QA'));assert.ok(saved.transactions.some(item=>item.description==='Energia apenas demo'&&item.status==='settled'));
 await page.goto('http://localhost:3103/login');await page.getByRole('heading',{name:'Que bom ter vocês de volta.'}).waitFor();assert.equal(await page.getByRole('button',{name:'Explorar demonstração completa'}).count(),0);await page.getByRole('link',{name:'Testar interface com dados fictícios (sem login)'}).click();await page.getByRole('heading',{name:'Olá, Nikson'}).waitFor();assert.match(page.url(),/\/demo$/);
 await page.goto('http://localhost:3103/dashboard');await page.getByRole('heading',{name:'Que bom ter vocês de volta.'}).waitFor();assert.match(page.url(),/\/login$/);
 await page.goto('http://localhost:3103/demo');await page.getByRole('heading',{name:'Olá, Nikson'}).waitFor();saved=await state();assert.ok(saved.transactions.some(item=>item.description==='Apenas demo QA'));assert.equal(await page.evaluate(key=>localStorage.getItem(key),liveKey),sentinel);assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'public-demo-result.json'),JSON.stringify({passed:true,widths:[320,375,390,430,1366],supabaseRequests:requests.length,pageErrors:errors,checks:['demo uses fixture provider even with remote env present','separate storage key, existing storage untouched','no auth session storage','navigation remains under /demo','income/expense and recurring settlement only in demo storage','reload preserves demo data','real login is a separate route','unauthenticated real dashboard redirects to login']},null,2));
 console.log('Public demo QA passed: zero Supabase requests, separate storage, protected real dashboard');
}finally{await browser.close()}
