// Replace this adapter to use another authorized source. No client-supplied actor or URLs.
export const ACTOR='deepmine~instagram-scraper';
export const TERMINAL=new Set(['SUCCEEDED','FAILED','TIMED-OUT','ABORTED','START_UNKNOWN']);
export class ProviderError extends Error {constructor(status=502){super(`Provider request failed (${status}). No paid retry was attempted.`);this.status=status;}}
export async function apify(env,path,options={},fetcher=fetch){
  let response;try{response=await fetcher(`https://api.apify.com/v2/${path}`,{...options,redirect:'error',headers:{'Authorization':`Bearer ${env.APIFY_TOKEN}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000)});}catch{throw new ProviderError();}
  if(!response.ok)throw new ProviderError(response.status);
  const text=await response.text();if(text.length>5000000)throw new ProviderError(502);
  try{return JSON.parse(text);}catch{throw new ProviderError(502);}
}
export function jobsFor(input,startedAt){
  const jobs=[];
  if(input.handles.length){
    jobs.push({mode:'reels',maxRows:input.handles.length*input.perAccount,input:{resultsType:'reels',usernames:input.handles,resultsLimit:input.perAccount,maxResults:input.handles.length*input.perAccount,onlyPostsNewerThan:`${Math.ceil(input.hours/24)+1} days`,skipPinnedPosts:false}});
    jobs.push({mode:'details',maxRows:input.handles.length,input:{resultsType:'details',usernames:input.handles,resultsLimit:1,maxResults:input.handles.length}});
  }
  if(input.reference)jobs.push({mode:'reference',maxRows:1,input:{resultsType:'reels',directUrls:[input.reference],resultsLimit:1,maxResults:1}});
  return jobs.map(j=>({...j,cap:Math.floor((input.budget*1000000-1)/jobs.length)/1000000,status:'PENDING'}));
}
export async function startJob(env,job){return (await apify(env,`acts/${ACTOR}/runs?maxTotalChargeUsd=${job.cap}&maxItems=${job.maxRows}&timeout=300`,{method:'POST',body:JSON.stringify(job.input)})).data;}
export async function statusJob(env,id){if(!/^[a-zA-Z0-9]+$/.test(id))throw new ProviderError();return (await apify(env,`actor-runs/${id}`)).data;}
export function safeRows(rows){if(!Array.isArray(rows))throw new ProviderError();const strings=['id','shortCode','url','ownerUsername','ownerId','timestamp','caption','type','username'];const nums=['videoPlayCount','videoViewCount','likesCount','commentsCount','followersCount'];return rows.map(r=>{const out={};for(const k of strings)if(typeof r[k]==='string'||typeof r[k]==='number')out[k]=String(r[k]).slice(0,k==='caption'?20000:2000);for(const k of nums)if(typeof r[k]==='number'||typeof r[k]==='string')out[k]=r[k];if(Array.isArray(r.hashtags))out.hashtags=r.hashtags.filter(v=>typeof v==='string').slice(0,1000);if(r.error)out.error='Provider returned an unavailable item';return out;});}
export async function itemsJob(env,dataset,offset,limit){if(!/^[a-zA-Z0-9]+$/.test(dataset))throw new ProviderError();return safeRows(await apify(env,`datasets/${dataset}/items?format=json&offset=${offset}&limit=${limit}`));}
