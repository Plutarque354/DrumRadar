import {handle,reelUrl} from '../public/js/normalize.js';
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
export function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new HttpError(422,'Expected a scan object.');
  if(Object.keys(input).some(k=>!['handles','hours','perAccount','budget','reference'].includes(k)))throw new HttpError(422,'Unknown scan option.');
  if(!Array.isArray(input.handles)||input.handles.length>50||input.handles.some(h=>!handle(h)||h!==handle(h)))throw new HttpError(422,'Use at most 50 lowercase Instagram handles.');
  const handles=[...new Set(input.handles)];
  if(!Number.isInteger(input.hours)||input.hours<1||input.hours>168)throw new HttpError(422,'Publication window must be 1–168 hours.');
  if(!Number.isInteger(input.perAccount)||input.perAccount<1||input.perAccount>50||handles.length*input.perAccount>1000)throw new HttpError(422,'Use 1–50 Reels/account and at most 1,000 Reels/scan.');
  if(typeof input.budget!=='number'||!Number.isFinite(input.budget)||input.budget<.03||input.budget>.5)throw new HttpError(422,'Total scan cap must be $0.03–$0.50 USD.');
  const reference=input.reference?reelUrl(input.reference):null;
  if(input.reference&&!reference)throw new HttpError(422,'Use an exact HTTPS Instagram /reel/ or /p/ permalink without query parameters.');
  if(!handles.length&&!reference)throw new HttpError(422,'Select a creator or an individual Reel.');
  return {handles,hours:input.hours,perAccount:input.perAccount,budget:input.budget,reference};
}
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
