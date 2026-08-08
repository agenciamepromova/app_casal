export type TransactionType = "income" | "expense";
export type Person = "Nikson" | "Brenda" | "Casal";
export type Transaction = { id:string; type:TransactionType; amountCents:number; description:string; date:string; accountId:string; categoryId:string; projectId?:string; owner:Person; notes?:string; recurring?:boolean };
export type Account = { id:string; name:string; kind:string; openingBalanceCents:number; color:string; active:boolean };
export type Category = { id:string; name:string; type:TransactionType; icon:string; color:string; active:boolean };
export type Goal = { id:string; name:string; description:string; targetCents:number; currentCents:number; dueDate:string; icon:string; contributions:{name:string;amountCents:number}[] };
export type Project = { id:string; name:string; client?:string; status:"planned"|"active"|"paused"|"completed"; expectedRevenueCents?:number; startDate?:string };
export type Member = { id:string; name:string; email:string; role:"owner"|"admin"|"member"; status:"active"|"pending"; initials:string };
export type Invite = { id:string; email:string; role:"admin"|"member"; status:"pending"; expiresAt:string };
export type AppState = {
  version:2; session:boolean; onboarded:boolean; demo:boolean;
  user:{name:string;email:string;theme?:"dark"|"light"|"system"}; household:{name:string;activeId:string};
  transactions:Transaction[]; accounts:Account[]; categories:Category[]; projects:Project[]; goals:Goal[]; members:Member[]; invites:Invite[];
};
