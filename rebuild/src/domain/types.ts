export type TransactionType = "income" | "expense";
export type TransactionStatus = "planned" | "pending" | "settled" | "cancelled";
export type Person = "Nikson" | "Brenda" | "Casal";
export type Transaction = { id:string; type:TransactionType; amountCents:number; description:string; date:string; dueDate?:string; settledAt?:string; status:TransactionStatus; accountId:string; categoryId:string; projectId?:string; owner:Person; notes?:string; recurring?:boolean; sourceCommitmentId?:string; sourceOccurrenceDate?:string };
export type Account = { id:string; name:string; kind:string; openingBalanceCents:number; color:string; active:boolean };
export type Category = { id:string; name:string; type:TransactionType; icon:string; color:string; active:boolean };
export type Goal = { id:string; name:string; description:string; targetCents:number; currentCents:number; dueDate:string; icon:string; accountId?:string; active:boolean; contributions:{id?:string;name:string;amountCents:number;date?:string}[] };
export type Project = { id:string; name:string; client?:string; description?:string; status:"idea"|"planned"|"active"|"paused"|"completed"|"cancelled"; contractedCents?:number; expectedRevenueCents?:number; costBudgetCents?:number; startDate?:string; dueDate?:string; responsibleId?:string; notes?:string };
export type Recurrence = "none"|"weekly"|"monthly"|"bimonthly"|"quarterly"|"semiannual"|"annual"|"custom";
export type Commitment = { id:string; title:string; description?:string; type:"payable"|"receivable"|"event"; amountCents?:number; dueDate:string; dueTime?:string; accountId?:string; categoryId?:string; projectId?:string; responsibleId:string; responsibleName:string; status:"pending"|"completed"|"cancelled"; recurrence:Recurrence; customInterval?:number; customUnit?:"days"|"weeks"|"months"; recurrenceEndsAt?:string; occurrenceLimit?:number; notes?:string };
export type Member = { id:string; name:string; email:string; role:"owner"|"admin"|"member"; status:"active"|"pending"; initials:string };
export type Invite = { id:string; email:string; role:"admin"|"member"; status:"pending"; expiresAt:string };
export type InvitationPreview = { status:"pending"|"accepted"|"cancelled"|"expired"|"invalid"; inviterName?:string; householdName?:string; role?:"admin"|"member"; invitedEmail?:string; expiresAt?:string };
export type AppState = {
  version:2; session:boolean; onboarded:boolean; demo:boolean;
  user:{name:string;email:string;theme?:"dark"|"light"|"system"}; household:{name:string;activeId:string};
  transactions:Transaction[]; accounts:Account[]; categories:Category[]; projects:Project[]; commitments:Commitment[]; goals:Goal[]; members:Member[]; invites:Invite[];
};
