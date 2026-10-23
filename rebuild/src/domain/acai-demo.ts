// Canonical fictitious week, used only by /acai-demo. Never inserted into AppState.
export const demoWeek=[{day:"Seg",quantity:28,unit:13},{day:"Ter",quantity:30,unit:10},{day:"Qua",quantity:31,unit:12},{day:"Qui",quantity:32,unit:11},{day:"Sex",quantity:33,unit:11},{day:"Sáb",quantity:35,unit:11},{day:"Dom",quantity:28,unit:13}];
export function recipeEstimate(preparerGrams=100,bottles=7,waterCost=0){
  return (15+200/5000*10.98+preparerGrams/650*15+bottles+waterCost)/bottles;
}
export function demoWeekResult(){
  const quantity=demoWeek.reduce((sum,item)=>sum+item.quantity,0),revenue=demoWeek.reduce((sum,item)=>sum+item.quantity*item.unit,0),purchases=31*15+2*10.98+5*15+217,consumption=recipeEstimate()*quantity;
  return {quantity,revenue,purchases,consumption,cashChange:revenue-purchases-139-123,partialMargin:revenue-consumption-139-123,inventoryDifference:purchases-consumption};
}
