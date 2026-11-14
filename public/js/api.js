let token='';export function setToken(value){token=value;}export function hasToken(){return !!token;}
export async function api(base,path,{method='GET',body,key}={}){
  const u=new URL(base||location.origin);if(u.username||u.password||u.search||u.hash||!['https:','http:'].includes(u.protocol)||u.protocol==='http:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('Gateway must use HTTPS (HTTP is allowed only on localhost).');
  let response;try{response=await fetch(u.origin+path,{method,credentials:'omit',redirect:'error',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(90000)});}catch{throw Error('Gateway could not be reached. Your scan key is saved. Resume it; do not start a duplicate paid scan.');}
  let data;try{data=await response.json();}catch{throw Error('Gateway returned a non-JSON response. Check its URL and deployment.');}if(!response.ok){const error=Error(data.error||`Gateway error ${response.status}`);error.status=response.status;throw error;}return data;
}
