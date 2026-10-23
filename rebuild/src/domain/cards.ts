// Pure preview model. No database calls or writes to the financial ledger.
export type CardConfig={id:string;name:string;closingDay:number;dueDay:number};
export type CardPurchase={id:string;cardId:string;description:string;date:string;amountCents:number;installments:number};
export type InvoicePart={purchaseId:string;description:string;number:number;count:number;amountCents:number;dueDate:string};
export type CardPayment={invoiceKey:string;amountCents:number};
function dayInMonth(year:number,month:number,day:number){const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();return new Date(Date.UTC(year,month,Math.min(day,last))).toISOString().slice(0,10)}
function parts(date:string){return date.split("-").map(Number)}
export function validateCard(card:CardConfig){
  if(!Number.isInteger(card.closingDay)||card.closingDay<1||card.closingDay>31||!Number.isInteger(card.dueDay)||card.dueDay<1||card.dueDay>31)throw new Error("Fechamento e vencimento devem ser dias de 1 a 31.");
}
export function invoiceParts(card:CardConfig,purchase:CardPurchase):InvoicePart[]{
  validateCard(card);
  if(purchase.cardId!==card.id)throw new Error("Cartão incompatível.");
  if(!Number.isSafeInteger(purchase.amountCents)||purchase.amountCents<=0||!Number.isInteger(purchase.installments)||purchase.installments<1||purchase.installments>120||purchase.amountCents<purchase.installments)throw new Error("Informe valor e número de parcelas válidos.");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(purchase.date)||!Number.isFinite(Date.parse(purchase.date))||new Date(purchase.date).toISOString().slice(0,10)!==purchase.date)throw new Error("Informe uma data válida.");
  const [year,month,day]=parts(purchase.date),closing=dayInMonth(year,month-1,card.closingDay);
  // A purchase on the closing day is assigned to the next cycle, explicitly shown in UI.
  const cycleMonth=month-1+(day>=Number(closing.slice(-2))?1:0);
  const closingDate=dayInMonth(year,cycleMonth,card.closingDay),[cy,cm]=parts(closingDate);
  const dueMonth=cm-1+(card.dueDay<=card.closingDay?1:0);
  const base=Math.floor(purchase.amountCents/purchase.installments),remainder=purchase.amountCents%purchase.installments;
  return Array.from({length:purchase.installments},(_,index)=>({purchaseId:purchase.id,description:purchase.description,number:index+1,count:purchase.installments,amountCents:base+(index<remainder?1:0),dueDate:dayInMonth(cy,dueMonth+index,card.dueDay)}));
}
export function cardInvoices(card:CardConfig,purchases:CardPurchase[],payments:CardPayment[]){
  const groups=new Map<string,InvoicePart[]>();
  purchases.filter(item=>item.cardId===card.id).flatMap(item=>invoiceParts(card,item)).forEach(item=>{const key=card.id+":"+item.dueDate;groups.set(key,[...(groups.get(key)??[]),item])});
  return Array.from(groups,([key,items])=>{const totalCents=items.reduce((sum,item)=>sum+item.amountCents,0),paidCents=payments.filter(item=>item.invoiceKey===key).reduce((sum,item)=>sum+item.amountCents,0);return{key,dueDate:items[0].dueDate,items,totalCents,paidCents,remainingCents:Math.max(0,totalCents-paidCents)}}).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
}
export function payInvoice(payments:CardPayment[],invoiceKey:string,amountCents:number){
  if(payments.some(item=>item.invoiceKey===invoiceKey))return payments;
  if(!Number.isSafeInteger(amountCents)||amountCents<=0)throw new Error("Valor de fatura inválido.");
  return [...payments,{invoiceKey,amountCents}];
}
