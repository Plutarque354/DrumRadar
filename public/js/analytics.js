import {inWindow} from './time.js';
export function reach(r,metric='plays') {return r.followers>0 && r[metric]!=null?r[metric]/r.followers:null;}
export function engagement(r) {return r.followers>0 && r.likes!=null && r.comments!=null?100*(r.likes+r.comments)/r.followers:null;}
export function eligible(rows,anchor,hours) {return rows.filter(r=>r.sourceType==='watchlist'&&inWindow(r.publishedAt,anchor,hours));}
export function rank(rows,kind,metric='plays') {
  const value=r=>kind==='reach'?reach(r,metric):kind==='engagement'?engagement(r):r[metric];
  return rows.filter(r=>value(r)!=null).sort((a,b)=>value(b)-value(a)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.id.localeCompare(b.id)).slice(0,10);
}
export function median(values) {const a=values.filter(v=>v!=null).sort((a,b)=>a-b),n=a.length; return n?(a[Math.floor((n-1)/2)]+a[Math.floor(n/2)])/2:null;}
export function inventory(reels,metric='plays') {
  const map=new Map(); for(const r of reels) for(const tag of new Set(r.hashtags)) {if(!map.has(tag)) map.set(tag,[]); map.get(tag).push(r);}
  const rows=[...map].map(([tag,rs])=>({tag,reelCount:rs.length,creatorCount:new Set(rs.map(r=>r.creator).filter(Boolean)).size,coverage:100*rs.length/reels.length,medianReach:median(rs.map(r=>reach(r,metric))),medianEngagement:median(rs.map(engagement)),reachN:rs.filter(r=>reach(r,metric)!=null).length,engagementN:rs.filter(r=>engagement(r)!=null).length,lastPublished:rs.map(r=>r.publishedAt).sort().at(-1),links:rs.map(r=>r.url),ids:rs.map(r=>r.id),tier:'Provisional',rank:null,metric}));
  const qualified=rows.filter(t=>t.engagementN>=3&&t.creatorCount>=2).sort((a,b)=>b.medianEngagement-a.medianEngagement||a.tag.localeCompare(b.tag));
  let best=0; qualified.forEach((t,i)=>{if(!i||t.medianEngagement!==qualified[i-1].medianEngagement) best=i; t.rank=best+1;const p=best/Math.max(1,qualified.length-1);t.tier=p<.1?'S':p<.3?'A':p<.6?'B':p<.85?'C':'D';});
  return rows.sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity)||b.reelCount-a.reelCount||a.tag.localeCompare(b.tag));
}
