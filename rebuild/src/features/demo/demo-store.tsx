"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoState, freshState } from "@/domain/demo-data";
import type { Account, AppState, Category, Commitment, Goal, Invite, Project, Transaction } from "@/domain/types";
import type { SignupOutcome } from "@/lib/auth-flow";
import { authMessage } from "@/lib/auth-flow";

const KEY = "plano-a-dois-rebuild-v3";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type AsyncAction<T> = (value: T) => Promise<void>;
type Store = {
  state: AppState; ready: boolean; online: boolean;
  login:(email:string,password:string)=>Promise<void>; signup:(name:string,email:string,password:string,emailRedirectTo:string)=>Promise<SignupOutcome>;
  recover:(email:string,next?:string)=>Promise<void>; updatePassword:(password:string)=>Promise<void>; logout:()=>Promise<void>; completeOnboarding:(name:string,household:string)=>Promise<void>;
  updateProfile:(name:string)=>Promise<void>; setTheme:(theme:"dark"|"light"|"system")=>Promise<void>;
  addTransaction:AsyncAction<Transaction>; updateTransaction:AsyncAction<Transaction>; removeTransaction:(id:string)=>Promise<void>;
  addAccount:AsyncAction<Account>; updateAccount:AsyncAction<Account>;
  addCategory:AsyncAction<Category>; updateCategory:AsyncAction<Category>;
  addProject:AsyncAction<Project>; updateProject:AsyncAction<Project>;
  addCommitment:AsyncAction<Commitment>; updateCommitment:AsyncAction<Commitment>; removeCommitment:(id:string)=>Promise<void>;
  settleCommitment:(id:string,occurrenceDate:string,amountCents?:number)=>Promise<void>;
  addGoal:AsyncAction<Goal>; updateGoal:AsyncAction<Goal>; contributeGoal:(goalId:string,amountCents:number,notes?:string)=>Promise<void>;
  addInvite:(email:string|Invite,role?:"admin"|"member")=>Promise<{id:string;token:string;emailSent:boolean}>; rotateInvite:(id:string)=>Promise<string>; removeInvite:(id:string)=>Promise<void>; reset:()=>void;
};

type Row = Record<string, unknown>;
const Context = createContext<Store|null>(null);
const text = (value:unknown) => value == null ? "" : String(value);
const optional = (value:unknown) => value == null ? undefined : String(value);
const cents = (value:unknown) => value == null ? undefined : Number(value);
const legacyCategoryNames = new Map([
  [["Alimenta", String.fromCharCode(195, 167, 195, 163), "o"].join(""), "Alimentação"],
  [["Sa", String.fromCharCode(195, 186), "de"].join(""), "Saúde"],
  [["Sal", String.fromCharCode(195, 161), "rio"].join(""), "Salário"],
  [["Servi", String.fromCharCode(195, 167), "os"].join(""), "Serviços"],
]);
const categoryName = (value: unknown) => { const name = text(value); return legacyCategoryNames.get(name) ?? name; };

export function DemoProvider({children}:{children:React.ReactNode}) {
  const [state,setState] = useState<AppState>(demoState);
  const [ready,setReady] = useState(false);
  const client = useMemo(() => url && key ? createBrowserClient(url,key) : null,[]);
  const online = Boolean(client);

  const loadRemote = useCallback(async () => {
    if (!client) return;
    const { data:{user}, error:userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) { setState({...freshState(),session:false,demo:false,commitments:[]}); return; }
    const { data:profile,error:profileError } = await client.from("profiles").select("full_name,active_household_id,theme").eq("id",user.id).single();
    if (profileError) throw profileError;
    const householdId = text(profile.active_household_id);
    if (!householdId) {
      setState({...freshState(),session:true,onboarded:false,demo:false,user:{name:text(profile.full_name),email:user.email??"",theme:profile.theme},household:{name:"",activeId:""},transactions:[],accounts:[],categories:[],projects:[],commitments:[],goals:[],members:[],invites:[]});
      return;
    }
    const [householdResult,accountsResult,categoriesResult,transactionsResult,projectsResult,commitmentsResult,goalsResult,contributionsResult,membersResult,invitationsResult] = await Promise.all([
      client.from("households").select("name").eq("id",householdId).single(),
      client.from("accounts").select("*").eq("household_id",householdId).order("created_at"),
      client.from("categories").select("*").eq("household_id",householdId).order("name"),
      client.from("transactions").select("*").eq("household_id",householdId).is("deleted_at",null).order("transaction_date",{ascending:false}).limit(500),
      client.from("projects").select("*").eq("household_id",householdId).order("created_at",{ascending:false}),
      client.from("financial_commitments").select("*").eq("household_id",householdId).order("due_date"),
      client.from("goals").select("*").eq("household_id",householdId).order("created_at",{ascending:false}),
      client.from("goal_contributions").select("*").eq("household_id",householdId).order("contributed_at",{ascending:false}),
      client.rpc("get_household_members",{p_household_id:householdId}),
      client.from("household_invitations").select("id,email_normalized,role,status,expires_at").eq("household_id",householdId).eq("status","pending").order("created_at",{ascending:false}),
    ]);
    const failure = [householdResult,accountsResult,categoriesResult,transactionsResult,projectsResult,commitmentsResult,goalsResult,contributionsResult,membersResult,invitationsResult].find(result => result.error)?.error;
    if (failure) throw failure;
    const members = (membersResult.data??[]) as Row[];
    const nameById = new Map(members.map(member => [text(member.user_id),text(member.full_name).split(" ")[0]]));
    const contributions = (contributionsResult.data??[]) as Row[];
    const goals:Goal[] = ((goalsResult.data??[]) as Row[]).map(goal => {
      const items = contributions.filter(item => text(item.goal_id) === text(goal.id));
      return {id:text(goal.id),name:text(goal.name),description:text(goal.description),targetCents:Number(goal.target_cents),currentCents:items.reduce((sum,item)=>sum+Number(item.amount_cents),0),dueDate:text(goal.due_date),icon:text(goal.icon),accountId:optional(goal.account_id),active:Boolean(goal.active),contributions:items.map(item=>({id:text(item.id),name:nameById.get(text(item.contributed_by))??"Integrante",amountCents:Number(item.amount_cents),date:text(item.contributed_at)}))};
    });
    setState({...freshState(),session:true,onboarded:true,demo:false,
      user:{name:text(profile.full_name),email:user.email??"",theme:profile.theme}, household:{name:text(householdResult.data?.name)||"Nosso espaço",activeId:householdId},
      accounts:((accountsResult.data??[]) as Row[]).map(item=>({id:text(item.id),name:text(item.name),kind:text(item.kind),openingBalanceCents:Number(item.opening_balance_cents),color:text(item.color),active:Boolean(item.active)})),
      categories:((categoriesResult.data??[]) as Row[]).map(item=>({id:text(item.id),name:categoryName(item.name),type:item.type as Category["type"],icon:text(item.icon),color:text(item.color),active:Boolean(item.active)})),
      projects:((projectsResult.data??[]) as Row[]).map(item=>({id:text(item.id),name:text(item.name),client:optional(item.client_name),description:optional(item.description),status:item.status as Project["status"],contractedCents:cents(item.contracted_cents),expectedRevenueCents:cents(item.expected_revenue_cents),costBudgetCents:cents(item.cost_budget_cents),startDate:optional(item.start_date),dueDate:optional(item.due_date),responsibleId:optional(item.responsible_id),notes:optional(item.notes)})),
      transactions:((transactionsResult.data??[]) as Row[]).map(item=>({id:text(item.id),type:item.type as Transaction["type"],amountCents:Number(item.amount_cents),description:text(item.description),date:text(item.transaction_date),dueDate:optional(item.due_date),settledAt:optional(item.settled_at),status:item.status as Transaction["status"],accountId:text(item.account_id),categoryId:text(item.category_id),projectId:optional(item.project_id),owner:(nameById.get(text(item.created_by))??"Casal") as Transaction["owner"],notes:optional(item.notes),recurring:Boolean(item.recurring),sourceCommitmentId:optional(item.source_commitment_id),sourceOccurrenceDate:optional(item.source_occurrence_date)})),
      commitments:((commitmentsResult.data??[]) as Row[]).map(item=>({id:text(item.id),title:text(item.title),description:optional(item.description),type:item.type as Commitment["type"],amountCents:cents(item.amount_cents),dueDate:text(item.due_date),dueTime:optional(item.due_time),accountId:optional(item.account_id),categoryId:optional(item.category_id),projectId:optional(item.project_id),responsibleId:text(item.responsible_id),responsibleName:nameById.get(text(item.responsible_id))??"Integrante",status:item.status as Commitment["status"],recurrence:item.recurrence as Commitment["recurrence"],customInterval:cents(item.custom_interval),customUnit:item.custom_unit as Commitment["customUnit"],recurrenceEndsAt:optional(item.recurrence_ends_at),occurrenceLimit:cents(item.occurrence_limit),notes:optional(item.notes)})),
      goals,
      members:members.map(member=>({id:text(member.user_id),name:text(member.full_name),email:text(member.email),role:member.role as "owner"|"admin"|"member",status:"active",initials:text(member.full_name).split(" ").map(part=>part[0]).join("").slice(0,2)})),
      invites:((invitationsResult.data??[]) as Row[]).map(item=>({id:text(item.id),email:text(item.email_normalized),role:item.role as Invite["role"],status:"pending",expiresAt:text(item.expires_at)}))});
  },[client]);

  useEffect(()=>{const timer=window.setTimeout(()=>{if(client)loadRemote().catch(()=>setState({...freshState(),session:false,demo:false,commitments:[]})).finally(()=>setReady(true));else{try{const raw=localStorage.getItem(KEY);if(raw)setState(JSON.parse(raw) as AppState)}catch{localStorage.removeItem(KEY)}setReady(true)}},0);return()=>clearTimeout(timer)},[client,loadRemote]);
  useEffect(()=>{
    const preference=state.user.theme??"system";
    const media=window.matchMedia("(prefers-color-scheme: light)");
    const apply=()=>{
      document.documentElement.dataset.theme=preference==="system"?(media.matches?"light":"dark"):preference;
      document.documentElement.dataset.themePreference=preference;
    };
    apply();
    if(preference!=="system")return;
    media.addEventListener("change",apply);
    return()=>media.removeEventListener("change",apply);
  },[state.user.theme]);
  const saveLocal=useCallback((next:AppState)=>{setState(next);localStorage.setItem(KEY,JSON.stringify(next))},[]);
  const withUser=useCallback(async()=>{if(!client)throw new Error("Supabase não configurado");const{data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error("Sua sessão expirou. Entre novamente.");return user},[client]);
  const checked=useCallback(async <T,>(operation:PromiseLike<{data:T;error:unknown}>)=>{const result=await operation;if(result.error)throw result.error;return result.data},[]);

  const value = useMemo<Store>(()=>({state,ready,online,
    login:async(email,password)=>{if(!client){saveLocal({...state,session:true,user:{...state.user,email}});return}const{error}=await client.auth.signInWithPassword({email,password});if(error)throw new Error(authMessage(error.message,"login"));await loadRemote()},
    signup:async(name,email,password,emailRedirectTo)=>{if(!client){saveLocal({...state,session:true,onboarded:false,user:{name,email,theme:"system"}});return "authenticated"}const{data,error}=await client.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo}});if(error)throw new Error(authMessage(error.message,"signup"));if(data.user?.identities?.length===0)return "existing_account";if(!data.session)return "confirmation_required";await loadRemote();return "authenticated"},
    recover:async(email,next)=>{if(!client)return;const destination=next??"/dashboard";const updatePath=`/atualizar-senha?next=${encodeURIComponent(destination)}`;const{error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/callback?next=${encodeURIComponent(updatePath)}`});if(error)throw new Error(authMessage(error.message,"recover"))},
    updatePassword:async password=>{if(!client)return;const{error}=await client.auth.updateUser({password});if(error)throw new Error(authMessage(error.message,"recover"))},
    logout:async()=>{if(client)await client.auth.signOut();setState({...freshState(),session:false,demo:!client,commitments:[]})},
    completeOnboarding:async(name,household)=>{if(!client){saveLocal({...state,onboarded:true,user:{...state.user,name},household:{name:household,activeId:"demo-household"}});return}const user=await withUser();await checked(client.from("profiles").update({full_name:name}).eq("id",user.id));await checked(client.rpc("create_household",{p_name:household}));await loadRemote()},
    updateProfile:async name=>{if(!client){saveLocal({...state,user:{...state.user,name}});return}const user=await withUser();await checked(client.from("profiles").update({full_name:name}).eq("id",user.id));await loadRemote()},
    setTheme:async theme=>{if(!client){saveLocal({...state,user:{...state.user,theme}});return}const user=await withUser();await checked(client.from("profiles").update({theme}).eq("id",user.id));setState(current=>({...current,user:{...current.user,theme}}))},
    addTransaction:async item=>{if(!client){saveLocal({...state,transactions:[item,...state.transactions]});return}const user=await withUser();await checked(client.from("transactions").insert({id:item.id,household_id:state.household.activeId,account_id:item.accountId,category_id:item.categoryId||null,project_id:item.projectId||null,created_by:user.id,type:item.type,amount_cents:item.amountCents,description:item.description,notes:item.notes||null,transaction_date:item.date,due_date:item.dueDate||null,settled_at:item.status==="settled"?(item.settledAt||item.date):null,status:item.status,recurring:Boolean(item.recurring)}));await loadRemote()},
    updateTransaction:async item=>{if(!client){saveLocal({...state,transactions:state.transactions.map(row=>row.id===item.id?item:row)});return}await checked(client.from("transactions").update({account_id:item.accountId,category_id:item.categoryId||null,project_id:item.projectId||null,type:item.type,amount_cents:item.amountCents,description:item.description,notes:item.notes||null,transaction_date:item.date,due_date:item.dueDate||null,settled_at:item.status==="settled"?(item.settledAt||item.date):null,status:item.status,recurring:Boolean(item.recurring)}).eq("id",item.id));await loadRemote()},
    removeTransaction:async id=>{if(!client){saveLocal({...state,transactions:state.transactions.filter(item=>item.id!==id)});return}await checked(client.from("transactions").update({deleted_at:new Date().toISOString()}).eq("id",id));await loadRemote()},
    addAccount:async item=>{if(!client){saveLocal({...state,accounts:[...state.accounts,item]});return}await checked(client.from("accounts").insert({id:item.id,household_id:state.household.activeId,name:item.name,kind:item.kind,opening_balance_cents:item.openingBalanceCents,color:item.color,active:item.active}));await loadRemote()},
    updateAccount:async item=>{if(!client){saveLocal({...state,accounts:state.accounts.map(row=>row.id===item.id?item:row)});return}await checked(client.from("accounts").update({name:item.name,kind:item.kind,opening_balance_cents:item.openingBalanceCents,color:item.color,active:item.active}).eq("id",item.id));await loadRemote()},
    addCategory:async item=>{if(!client){saveLocal({...state,categories:[...state.categories,item]});return}await checked(client.from("categories").insert({id:item.id,household_id:state.household.activeId,name:item.name,type:item.type,icon:item.icon,color:item.color,active:item.active}));await loadRemote()},
    updateCategory:async item=>{if(!client){saveLocal({...state,categories:state.categories.map(row=>row.id===item.id?item:row)});return}await checked(client.from("categories").update({name:item.name,icon:item.icon,color:item.color,active:item.active}).eq("id",item.id));await loadRemote()},
    addProject:async item=>{if(!client){saveLocal({...state,projects:[...state.projects,item]});return}const user=await withUser();await checked(client.from("projects").insert({id:item.id,household_id:state.household.activeId,name:item.name,client_name:item.client||null,description:item.description||null,status:item.status,contracted_cents:item.contractedCents??null,expected_revenue_cents:item.expectedRevenueCents??null,cost_budget_cents:item.costBudgetCents??null,start_date:item.startDate||null,due_date:item.dueDate||null,responsible_id:item.responsibleId||user.id,notes:item.notes||null,created_by:user.id}));await loadRemote()},
    updateProject:async item=>{if(!client){saveLocal({...state,projects:state.projects.map(row=>row.id===item.id?item:row)});return}await checked(client.from("projects").update({name:item.name,client_name:item.client||null,description:item.description||null,status:item.status,contracted_cents:item.contractedCents??null,expected_revenue_cents:item.expectedRevenueCents??null,cost_budget_cents:item.costBudgetCents??null,start_date:item.startDate||null,due_date:item.dueDate||null,responsible_id:item.responsibleId||null,notes:item.notes||null}).eq("id",item.id));await loadRemote()},
    addCommitment:async item=>{if(!client){saveLocal({...state,commitments:[...state.commitments,item]});return}const user=await withUser();await checked(client.from("financial_commitments").insert({id:item.id,household_id:state.household.activeId,title:item.title,description:item.description||null,type:item.type,amount_cents:item.amountCents??null,due_date:item.dueDate,due_time:item.dueTime||null,account_id:item.accountId||null,category_id:item.categoryId||null,project_id:item.projectId||null,responsible_id:item.responsibleId||user.id,status:item.status,recurrence:item.recurrence,custom_interval:item.customInterval??null,custom_unit:item.customUnit??null,recurrence_ends_at:item.recurrenceEndsAt||null,occurrence_limit:item.occurrenceLimit??null,notes:item.notes||null,created_by:user.id}));await loadRemote()},
    updateCommitment:async item=>{if(!client){saveLocal({...state,commitments:state.commitments.map(row=>row.id===item.id?item:row)});return}await checked(client.from("financial_commitments").update({title:item.title,description:item.description||null,type:item.type,amount_cents:item.amountCents??null,due_date:item.dueDate,due_time:item.dueTime||null,account_id:item.accountId||null,category_id:item.categoryId||null,project_id:item.projectId||null,responsible_id:item.responsibleId,status:item.status,recurrence:item.recurrence,custom_interval:item.customInterval??null,custom_unit:item.customUnit??null,recurrence_ends_at:item.recurrenceEndsAt||null,occurrence_limit:item.occurrenceLimit??null,notes:item.notes||null}).eq("id",item.id));await loadRemote()},
    removeCommitment:async id=>{const item=state.commitments.find(row=>row.id===id);if(!item)return;if(!client){saveLocal({...state,commitments:state.commitments.map(row=>row.id===id?{...row,status:"cancelled"}:row)});return}await checked(client.from("financial_commitments").update({status:"cancelled"}).eq("id",id));await loadRemote()},
    settleCommitment:async(id,occurrenceDate,amountCents)=>{if(!client)throw new Error("Confirmação disponível somente no modo online.");await checked(client.rpc("settle_financial_commitment",{p_commitment_id:id,p_occurrence_date:occurrenceDate,p_amount_cents:amountCents??null}));await loadRemote()},
    addGoal:async item=>{if(!client){saveLocal({...state,goals:[...state.goals,item]});return}const user=await withUser();await checked(client.from("goals").insert({id:item.id,household_id:state.household.activeId,name:item.name,description:item.description||null,target_cents:item.targetCents,due_date:item.dueDate||null,icon:item.icon,account_id:item.accountId||null,active:item.active,created_by:user.id}));await loadRemote()},
    updateGoal:async item=>{if(!client){saveLocal({...state,goals:state.goals.map(row=>row.id===item.id?item:row)});return}await checked(client.from("goals").update({name:item.name,description:item.description||null,target_cents:item.targetCents,due_date:item.dueDate||null,icon:item.icon,account_id:item.accountId||null,active:item.active}).eq("id",item.id));await loadRemote()},
    contributeGoal:async(goalId,amountCents,notes)=>{if(!client){const goal=state.goals.find(item=>item.id===goalId);if(goal)saveLocal({...state,goals:state.goals.map(item=>item.id===goalId?{...item,currentCents:item.currentCents+amountCents,contributions:[...item.contributions,{name:state.user.name,amountCents}]}:item)});return}const user=await withUser();await checked(client.from("goal_contributions").insert({goal_id:goalId,household_id:state.household.activeId,amount_cents:amountCents,contributed_by:user.id,notes:notes||null}));await loadRemote()},
    addInvite:async(emailOrInvite,role)=>{if(!client)throw new Error("Convites exigem o ambiente online.");const email=typeof emailOrInvite==="string"?emailOrInvite:emailOrInvite.email;const invitationRole=role??(typeof emailOrInvite==="string"?"member":emailOrInvite.role);const rows=await checked(client.rpc("create_invitation",{p_household_id:state.household.activeId,p_email:email,p_role:invitationRole}));const invitation=(rows as Row[]|null)?.[0];if(!invitation)throw new Error("Não foi possível criar o convite.");const id=text(invitation.invitation_id),token=text(invitation.token);let emailSent=false;try{const response=await fetch("/api/invitations/email",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({invitationId:id,token})});emailSent=response.ok&&(await response.json() as {sent?:boolean}).sent===true}catch{}await loadRemote();return{id,token,emailSent}},
    rotateInvite:async id=>{if(!client)throw new Error("Convites exigem o ambiente online.");const rows=await checked(client.rpc("rotate_invitation_token",{p_invitation_id:id}));const token=text((rows as Row[]|null)?.[0]?.token);if(!token)throw new Error("Não foi possível gerar um novo link.");await loadRemote();return token},
    removeInvite:async id=>{if(!client)throw new Error("Convites exigem o ambiente online.");await checked(client.rpc("cancel_invitation",{p_invitation_id:id}));await loadRemote()},
    reset:()=>saveLocal({...freshState(),session:true}),
  }),[checked,client,loadRemote,online,ready,saveLocal,state,withUser]);
  return <Context.Provider value={value}>{ready?children:<main className="page-loading">Preparando o espaço de vocês...</main>}</Context.Provider>;
}

export function useDemo(){const value=useContext(Context);if(!value)throw new Error("DemoProvider ausente");return value}
