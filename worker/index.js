import {validate,HttpError,json} from './validation.js';
import {jobsFor,startJob,statusJob,itemsJob,TERMINAL} from './provider.js';
const encoder=new TextEncoder();
async function authorized(request,env){
  if(!env.OWNER_ACCESS_TOKEN||env.OWNER_ACCESS_TOKEN.length<32)return false;
  const actual=request.headers.get('Authorization')||'';
  const [a,b]=await Promise.all([actual,`Bearer ${env.OWNER_ACCESS_TOKEN}`].map(v=>crypto.subtle.digest('SHA-256',encoder.encode(v))));
  return new Uint8Array(a).every((v,i)=>v===new Uint8Array(b)[i]);
}
export default {async fetch(request,env){
  const u=new URL(request.url),origin=request.headers.get('Origin');
  if(!u.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim());
  const cors=origin&&(origin===u.origin||allowed.includes(origin));
  if(origin&&!cors)return json({error:'Origin not allowed.'},403);
  const headers={'Access-Control-Allow-Origin':origin||u.origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,Idempotency-Key'};
  let result;
  try{
    if(request.method==='OPTIONS')result=new Response(null,{status:204});
    else if(!await authorized(request,env))result=json({error:'Enter the owner access token in Settings.'},401);
    else if(u.pathname==='/api/health')result=json({ok:true,configured:!!env.APIFY_TOKEN,provider:'apify-deepmine',maxScanUsd:.5,dailyReservedUsd:2});
    else if(!env.APIFY_TOKEN)result=json({error:'Gateway APIFY_TOKEN secret is not configured.'},503);
    else result=await env.SCANS.get(env.SCANS.idFromName('owner')).fetch(request);
  }catch{result=json({error:'Gateway unavailable. Resume the saved scan; do not start another paid request.'},503);}
  const response=new Response(result.body,result);for(const [k,v]of Object.entries(headers))response.headers.set(k,v);return response;
}};
// Durable storage holds intent BEFORE provider POST. Ambiguous POSTs are never retried.
export class ScanCoordinator{
  constructor(ctx,env){this.storage=ctx.storage;this.env=env;this.queue=Promise.resolve();}
  fetch(request){const work=this.queue.then(()=>this.route(request));this.queue=work.catch(()=>{});return work.catch(e=>json({error:e instanceof HttpError?e.message:'Provider unavailable. Existing scan state was preserved; no paid retry was attempted.'},e instanceof HttpError?e.status:502));}
  async route(request){
    const u=new URL(request.url),parts=u.pathname.split('/');
    if(request.method==='GET'&&u.pathname==='/api/active'){const id=await this.storage.get('active');const scan=id?await this.storage.get(`scan:${id}`):null;return json(scan?{...this.publicScan(scan),input:scan.input}:null);}
    if(request.method==='POST'&&u.pathname==='/api/scans'){
      const key=request.headers.get('Idempotency-Key');if(!key||! /^[a-zA-Z0-9-]{16,80}$/.test(key))throw new HttpError(422,'A persistent idempotency key is required.');
      const raw=await request.text();if(raw.length>16000)throw new HttpError(413,'Request too large.');
      let body;try{body=JSON.parse(raw);}catch{throw new HttpError(400,'Invalid JSON.');}
      const input=validate(body),fingerprint=JSON.stringify(input),old=await this.storage.get(`scan:${key}`);
      if(old){if(old.fingerprint!==fingerprint)throw new HttpError(409,'This request key belongs to different scan options.');return json(this.publicScan(old));}
      if(await this.storage.get('active'))throw new HttpError(409,'Another scan is active or its start is uncertain. Resume it or reconcile it in Apify Console first.');
      const day=new Date().toISOString().slice(0,10),budget=await this.storage.get(`budget:${day}`)||0;
      if(budget+input.budget>2.000001)throw new HttpError(429,'Daily reserved budget of $2 USD reached. Reservations are not refunded automatically.');
      const scan={id:key,fingerprint,startedAt:new Date().toISOString(),input,status:'STARTING',jobs:[]};scan.jobs=jobsFor(input,scan.startedAt);
      await this.storage.put({[`scan:${key}`]:scan,active:key,[`budget:${day}`]:budget+input.budget});
      for(const job of scan.jobs){
        job.status='START_UNKNOWN';await this.storage.put(`scan:${key}`,scan);
        try{const run=await startJob(this.env,job);if(!run?.id||!run.defaultDatasetId)throw Error();Object.assign(job,{runId:run.id,dataset:run.defaultDatasetId,status:run.status||'RUNNING'});}
        catch{job.error='Start outcome uncertain. Check Apify Console. This job will not be retried automatically.';}
        await this.storage.put(`scan:${key}`,scan);
      }
      scan.status='RUNNING';await this.storage.put(`scan:${key}`,scan);return json(this.publicScan(scan),202);
    }
    if(parts[2]==='scans'&&/^[a-zA-Z0-9-]{16,80}$/.test(parts[3]||'')){
      const scan=await this.storage.get(`scan:${parts[3]}`);if(!scan)throw new HttpError(404,'Unknown scan.');
      if(request.method==='GET'&&parts.length===4){
        for(const job of scan.jobs){if(job.status==='PENDING'){job.status='NOT_STARTED';job.error='Interrupted before this job started. No automatic retry.';}if(job.runId&&!TERMINAL.has(job.status)){const run=await statusJob(this.env,job.runId);job.status=run.status;job.cost=typeof run.usageTotalUsd==='number'?run.usageTotalUsd:null;job.finishedAt=run.finishedAt||null;}}
        if(scan.jobs.every(j=>TERMINAL.has(j.status)||j.status==='NOT_STARTED')){
          scan.status=scan.jobs.every(j=>j.status==='SUCCEEDED')?'SUCCEEDED':scan.jobs.some(j=>j.status==='SUCCEEDED')?'PARTIAL':'FAILED';scan.finishedAt??=new Date().toISOString();
          if(!scan.jobs.some(j=>j.status==='START_UNKNOWN')&&await this.storage.get('active')===scan.id)await this.storage.delete('active');
        }
        await this.storage.put(`scan:${scan.id}`,scan);return json(this.publicScan(scan));
      }
      if(request.method==='GET'&&parts[4]==='items'){
        const job=scan.jobs.find(j=>j.mode===u.searchParams.get('mode'));if(!job?.dataset||!TERMINAL.has(job.status))throw new HttpError(409,'No terminal dataset is available for this job.');
        const offset=Number(u.searchParams.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>=job.maxRows)throw new HttpError(422,'Invalid dataset offset.');
        const limit=Math.min(100,job.maxRows-offset),rows=await itemsJob(this.env,job.dataset,offset,limit);
        return json({rows,observedAt:job.finishedAt||scan.finishedAt||new Date().toISOString(),runId:job.runId,nextOffset:rows.length===limit&&offset+rows.length<job.maxRows?offset+rows.length:null,capped:offset+rows.length>=job.maxRows});
      }
      if(request.method==='POST'&&parts[4]==='release'){
        const body=await request.json();if(body.confirm!=='I checked and stopped any running jobs in Apify')throw new HttpError(422,'Reconcile the run in Apify Console before releasing the lock.');
        if(await this.storage.get('active')===scan.id)await this.storage.delete('active');return json({released:true});
      }
    }
    throw new HttpError(404,'Unknown API route.');
  }
  publicScan(s){return {id:s.id,startedAt:s.startedAt,finishedAt:s.finishedAt||null,status:s.status,hours:s.input.hours,handles:s.input.handles,budget:s.input.budget,reference:s.input.reference,jobs:s.jobs.map(({mode,status,runId,error,cost,maxRows,cap})=>({mode,status,runId:runId||null,error:error||null,cost:cost??null,maxRows,cap}))};}
}
