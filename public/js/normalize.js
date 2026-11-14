import {iso} from './time.js';
export function count(v) { return (typeof v==='number' || typeof v==='string' && /^\d+$/.test(v)) && Number.isSafeInteger(Number(v)) && Number(v)>=0 ? Number(v) : null; }
export function handle(v) {
  if(typeof v!=='string') return null;
  let h=v.trim().replace(/^@/,'');
  if (h.startsWith('https://')) { try { const u=new URL(h); if(!['instagram.com','www.instagram.com'].includes(u.hostname)||u.search||u.hash||u.username||u.password) return null; h=u.pathname.replace(/^\/|\/$/g,''); } catch {return null;} }
  return /^[a-zA-Z0-9._]{1,30}$/.test(h)?h.toLowerCase():null;
}
export function reelUrl(v) { try { const u=new URL(v); return u.protocol==='https:' && ['www.instagram.com','instagram.com'].includes(u.hostname) && !u.port && !u.username && !u.password && /^\/(reel|p)\/[A-Za-z0-9_-]+\/$/.test(u.pathname) && !u.search && !u.hash ? `https://www.instagram.com${u.pathname}` : null; } catch { return null; } }
export function tags(caption='', supplied=[]) {
  const clean=String(caption).replace(/https?:\/\/\S+/g,'');
  const found=[...clean.matchAll(/(?:^|[^\p{L}\p{N}_/@])#([\p{L}\p{M}\p{N}_]+)/gu)].map(m=>m[1]);
  return [...new Set([...found,...(Array.isArray(supplied)?supplied:[])].filter(x=>typeof x==='string').map(x=>x.replace(/^#/,'').normalize('NFC').toLowerCase()).filter(x=>/^[\p{L}\p{M}\p{N}_]+$/u.test(x)))].sort();
}
export function profiles(rows, observedAt, runId) { return rows.flatMap(r=>{ const h=handle(r.username); return h ? [{handle:h,sourceId:r.id==null?null:String(r.id),followers:count(r.followersCount),observedAt,runId}] : []; }); }
export function normalize(rows,{observedAt,runId,sourceType='watchlist'}) {
  return rows.flatMap(r=>{
    if (r.error || ['Image','Sidecar'].includes(r.type)) return [];
    const code=typeof r.shortCode==='string'&&/^[A-Za-z0-9_-]+$/.test(r.shortCode)?r.shortCode:null;
    const url=reelUrl(r.url) || (code?`https://www.instagram.com/reel/${code}/`:null);
    if(!url) return [];
    return [{id:url.split('/').at(-2),url,creator:handle(r.ownerUsername),ownerId:r.ownerId==null?null:String(r.ownerId),publishedAt:iso(r.timestamp),caption:typeof r.caption==='string'?r.caption:'',hashtags:tags(r.caption,r.hashtags),plays:count(r.videoPlayCount),views:count(r.videoViewCount),likes:count(r.likesCount),comments:count(r.commentsCount),observedAt,runId,sourceType}];
  });
}
export function dedupe(rows) {
  const m=new Map();
  for(const r of rows) { const old=m.get(r.id); if(!old) m.set(r.id,r); else {const latest=Date.parse(r.observedAt)>=Date.parse(old.observedAt)?r:old; m.set(r.id,{...latest,hashtags:[...new Set([...old.hashtags,...r.hashtags])].sort(),sourceType:old.sourceType==='watchlist'||r.sourceType==='watchlist'?'watchlist':'reference'});} }
  return [...m.values()];
}
export function joinFollowers(reels, observations) {
  const byHandle=new Map(), byId=new Map();
  for(const p of [...observations].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt))) { byHandle.set(p.handle,p); if(p.sourceId) byId.set(p.sourceId,p); }
  return reels.map(r=>{ const p=byHandle.get(r.creator)||byId.get(r.ownerId); return {...r,followers:p?.followers??null,followerObservedAt:p?.observedAt??null}; });
}
