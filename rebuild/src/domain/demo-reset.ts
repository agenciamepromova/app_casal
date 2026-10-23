import type {AppState} from "./types";
export function clearPublicDemo(state:AppState,demoOnly:boolean,hasRemoteClient:boolean):AppState {
  if(!demoOnly||hasRemoteClient)throw new Error("Reinicialização disponível somente na demonstração isolada.");
  return {...state,session:true,demo:true,transactions:[],commitments:[],goals:[],invites:[],accounts:state.accounts.map(account=>({...account,openingBalanceCents:0}))};
}
