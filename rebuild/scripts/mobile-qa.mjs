import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
const dir=path.resolve('../../qa-results');fs.mkdirSync(dir,{recursive:true});
const compiled=ts.transpileModule(fs.readFileSync('src/domain/demo-data.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const fixture={exports:{}};new Function('exports',compiled)(fixture.exports);
const state=fixture.exports.demoState;
state.session=true;
state.projects=[...state.projects,{id:'qa-casa',name:'Casa',status:'active'},{id:'qa-acai',name:'Açaí',status:'active'},{id:'qa-marketing',name:'Marketing',status:'active'}];
const key='plano-a-dois-rebuild-v3';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state))},{key,state});
 const getState=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 const check=async()=>{const sizes=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(sizes.document<=sizes.viewport,JSON.stringify(sizes))};
 await page.goto('http://localhost:3103/dashboard');await page.getByRole('heading',{name:'Olá, Nikson'}).waitFor();
 for(const width of [320,375,390,430,1366]){
  await page.setViewportSize({width,height:900});
  for(const route of ['dashboard','movimentacoes','agenda','mais','cartao-demo','acai-demo']){
   await page.goto('http://localhost:3103/'+route);await page.locator('h1').waitFor();await check();
   if(width===320||width===390||width===1366)await page.screenshot({path:path.join(dir,route+'-'+width+'.png'),fullPage:true});
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://localhost:3103/movimentacoes');await page.getByRole('button',{name:'Registrar',exact:true}).click();
 let dialog=page.getByRole('dialog');for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});await check();if(width===320)await page.screenshot({path:path.join(dir,'modal-320.png'),fullPage:true})}await page.setViewportSize({width:390,height:844});assert.equal(await dialog.getByLabel('Conta',{exact:true}).inputValue(),'');await dialog.getByLabel('Valor (R$)',{exact:true}).fill('12,34');await dialog.getByLabel('Descrição curta').fill('Receita QA');await dialog.getByRole('button',{name:'Entrada',exact:true}).click();await dialog.getByLabel('Conta',{exact:true}).selectOption('nubank');
 await dialog.getByRole('button',{name:'Registrar',exact:true}).click();await page.getByRole('status').filter({hasText:'Registro salvo'}).waitFor();
 let saved=await getState();assert.equal(saved.transactions[0].amountCents,1234);assert.equal(saved.transactions[0].categoryId,'');assert.equal(saved.transactions[0].type,'income');assert.equal(saved.transactions[0].status,'settled');
 await page.getByLabel('Contexto',{exact:true}).selectOption('qa-acai');await page.getByRole('button',{name:'Registrar',exact:true}).click();dialog=page.getByRole('dialog');assert.equal(await dialog.getByLabel('Contexto',{exact:true}).inputValue(),'qa-acai');await dialog.getByLabel('Valor (R$)',{exact:true}).fill('9,50');await dialog.getByLabel('Descrição curta').fill('Compra QA');await dialog.getByLabel('Conta',{exact:true}).selectOption('inter');await dialog.getByRole('button',{name:'Registrar',exact:true}).click();await page.getByRole('status').filter({hasText:'Registro salvo'}).waitFor();saved=await getState();assert.equal(saved.transactions[0].projectId,'qa-acai');assert.equal(saved.transactions[0].type,'expense');
 await page.getByRole('button',{name:'Registrar',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Entrada',exact:true}).click();await dialog.getByLabel('Valor (R$)',{exact:true}).fill('26,00');await dialog.getByLabel('Descrição curta').fill('Venda açaí QA');await dialog.getByLabel('Quantidade de garrafas (opcional)').fill('2');await dialog.getByLabel('Conta',{exact:true}).selectOption('nubank');await dialog.getByRole('button',{name:'Registrar',exact:true}).click();await page.getByRole('status').filter({hasText:'Registro salvo'}).waitFor();saved=await getState();assert.equal(saved.transactions[0].notes,'Quantidade vendida: 2 garrafas.\n');assert.equal(saved.transactions[0].projectId,'qa-acai');
 await page.getByLabel('Contexto',{exact:true}).selectOption('');
 await page.getByRole('button',{name:'Editar Mercado da semana',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByText('Detalhes opcionais • data, categoria e situação',{exact:true}).click();assert.equal(await dialog.getByLabel('Registrado por').inputValue(),'Brenda');await dialog.getByRole('button',{name:'Salvar alterações'}).click();await page.getByRole('status').filter({hasText:'Registro salvo'}).waitFor();saved=await getState();assert.equal(saved.transactions.find(item=>item.id==='t3').owner,'Brenda');
 await page.getByRole('button',{name:'Registrar',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Descrição curta').fill('Não descartar ainda');
 page.once('dialog',d=>d.dismiss());await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await dialog.count(),1);
 await dialog.getByRole('button',{name:'Fechar janela'}).focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Registrar');
 page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 await page.goto('http://localhost:3103/agenda');await page.getByRole('button',{name:'Nova conta ou compromisso'}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('O que é?').fill('Energia QA');await dialog.getByLabel('Valor previsto (R$)').fill('150,00');await dialog.getByLabel('Conta para pagar ou receber').selectOption('nubank');await dialog.getByRole('button',{name:'Salvar compromisso'}).click();await page.getByRole('status').filter({hasText:'Compromisso salvo'}).waitFor();
 saved=await getState();const bill=saved.commitments.find(item=>item.title==='Energia QA');assert.equal(bill.recurrence,'monthly');const before=saved.transactions.length;
 await page.getByRole('button',{name:/Confirmar Energia QA/}).first().click();dialog=page.getByRole('dialog');await dialog.getByLabel('Valor efetivo').fill('161,23');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await page.getByRole('status').filter({hasText:'confirmado uma vez'}).waitFor();saved=await getState();assert.equal(saved.transactions.length,before+1);assert.equal(saved.transactions[0].amountCents,16123);assert.equal(saved.transactions[0].sourceCommitmentId,bill.id);
 const cancel=page.getByRole('button',{name:'Cancelar toda a série Energia QA',exact:true}).first();page.once('dialog',async d=>{assert.match(d.message(),/toda a série/);await d.accept()});await cancel.click();await page.getByRole('status').filter({hasText:'cancelado; pagamentos preservados'}).waitFor();saved=await getState();assert.equal(saved.transactions.length,before+1);assert.equal(saved.commitments.find(item=>item.id===bill.id).status,'cancelled');
 await page.goto('http://localhost:3103/cartao-demo');await page.getByLabel('Nome',{exact:true}).fill('Cartão QA');await page.getByLabel('Dia do fechamento').fill('20');await page.getByLabel('Dia do vencimento').fill('28');await page.getByRole('button',{name:'Continuar'}).click();await page.getByLabel('Valor total (R$)').fill('301,01');await page.getByLabel('Parcelas',{exact:true}).fill('3');await page.getByLabel('Descrição',{exact:true}).fill('Compra teste');await page.getByRole('button',{name:'Adicionar à previsão'}).click();await page.getByRole('status').filter({hasText:'Compra simulada'}).waitFor();assert.equal(await page.getByRole('button',{name:'Simular pagamento da fatura',exact:true}).count(),3);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Simular pagamento da fatura',exact:true}).first().click();assert.equal(await page.getByRole('button',{name:'Pagamento simulado',exact:true}).isDisabled(),true);assert.equal((await getState()).transactions.length,before+1);await page.screenshot({path:path.join(dir,'cartao-previsao-390.png'),fullPage:true});
 await page.reload();await page.getByRole('button',{name:'Continuar'}).waitFor();assert.equal(await page.getByRole('button',{name:'Simular pagamento da fatura',exact:true}).count(),0);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({passed:true,widths:[320,375,390,430,1366],routes:['dashboard','movimentacoes','agenda','mais','cartao-demo','acai-demo'],checks:['no horizontal overflow','income and expense without optional details','inherited projectId','unchanged original author on edit','unsaved cancel / Escape','keyboard focus trap','monthly recurring bill','variable payment amount','series cancel preserves payment','card installments and payment independent of financial ledger','card demo cleared on reload'],errors},null,2));
 await browser.close();console.log('Mobile QA passed');
})().catch(error=>{console.error(error);process.exit(1)});
