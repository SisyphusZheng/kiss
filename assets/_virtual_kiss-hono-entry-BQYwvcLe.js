var ko=Object.defineProperty;var pi=e=>{throw TypeError(e)};var Eo=(e,t,s)=>t in e?ko(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var I=(e,t,s)=>Eo(e,typeof t!="symbol"?t+"":t,s),ka=(e,t,s)=>t.has(e)||pi("Cannot "+s);var g=(e,t,s)=>(ka(e,t,"read from private field"),s?s.call(e):t.get(e)),R=(e,t,s)=>t.has(e)?pi("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,s),A=(e,t,s,r)=>(ka(e,t,"write to private field"),r?r.call(e,s):t.set(e,s),s),B=(e,t,s)=>(ka(e,t,"access private method"),s);var fi=(e,t,s,r)=>({set _(i){A(e,t,i,s)},get _(){return g(e,t,r)}});var bi=(e,t,s)=>(r,i)=>{let n=-1;return c(0);async function c(h){if(h<=n)throw new Error("next() called multiple times");n=h;let d,p=!1,b;if(e[h]?(b=e[h][0][0],r.req.routeIndex=h):b=h===e.length&&i||void 0,b)try{d=await b(r,()=>c(h+1))}catch(k){if(k instanceof Error&&t)r.error=k,d=await t(k,r),p=!0;else throw k}else r.finalized===!1&&s&&(d=await s(r));return d&&(r.finalized===!1||p)&&(r.res=d),r}},To=Symbol(),vo=async(e,t=Object.create(null))=>{const{all:s=!1,dot:r=!1}=t,n=(e instanceof dn?e.raw.headers:e.headers).get("Content-Type");return n!=null&&n.startsWith("multipart/form-data")||n!=null&&n.startsWith("application/x-www-form-urlencoded")?yo(e,{all:s,dot:r}):{}};async function yo(e,t){const s=await e.formData();return s?So(s,t):{}}function So(e,t){const s=Object.create(null);return e.forEach((r,i)=>{t.all||i.endsWith("[]")?_o(s,i,r):s[i]=r}),t.dot&&Object.entries(s).forEach(([r,i])=>{r.includes(".")&&(xo(s,r,i),delete s[r])}),s}var _o=(e,t,s)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(s):e[t]=[e[t],s]:t.endsWith("[]")?e[t]=[s]:e[t]=s},xo=(e,t,s)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e;const i=t.split(".");i.forEach((n,c)=>{c===i.length-1?r[n]=s:((!r[n]||typeof r[n]!="object"||Array.isArray(r[n])||r[n]instanceof File)&&(r[n]=Object.create(null)),r=r[n])})},nn=e=>{const t=e.split("/");return t[0]===""&&t.shift(),t},Ao=e=>{const{groups:t,path:s}=Io(e),r=nn(s);return Co(r,t)},Io=e=>{const t=[];return e=e.replace(/\{[^}]+\}/g,(s,r)=>{const i=`@${r}`;return t.push([i,s]),i}),{groups:t,path:e}},Co=(e,t)=>{for(let s=t.length-1;s>=0;s--){const[r]=t[s];for(let i=e.length-1;i>=0;i--)if(e[i].includes(r)){e[i]=e[i].replace(r,t[s][1]);break}}return e},ns={},wo=(e,t)=>{if(e==="*")return"*";const s=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(s){const r=`${e}#${t}`;return ns[r]||(s[2]?ns[r]=t&&t[0]!==":"&&t[0]!=="*"?[r,s[1],new RegExp(`^${s[2]}(?=/${t})`)]:[e,s[1],new RegExp(`^${s[2]}$`)]:ns[r]=[e,s[1],!0]),ns[r]}return null},Tr=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,s=>{try{return t(s)}catch{return s}})}},No=e=>Tr(e,decodeURI),on=e=>{const t=e.url,s=t.indexOf("/",t.indexOf(":")+4);let r=s;for(;r<t.length;r++){const i=t.charCodeAt(r);if(i===37){const n=t.indexOf("?",r),c=t.indexOf("#",r),h=n===-1?c===-1?void 0:c:c===-1?n:Math.min(n,c),d=t.slice(s,h);return No(d.includes("%25")?d.replace(/%25/g,"%2525"):d)}else if(i===63||i===35)break}return t.slice(s,r)},Ro=e=>{const t=on(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},ct=(e,t,...s)=>(s.length&&(t=ct(t,...s)),`${(e==null?void 0:e[0])==="/"?"":"/"}${e}${t==="/"?"":`${(e==null?void 0:e.at(-1))==="/"?"":"/"}${(t==null?void 0:t[0])==="/"?t.slice(1):t}`}`),cn=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;const t=e.split("/"),s=[];let r="";return t.forEach(i=>{if(i!==""&&!/\:/.test(i))r+="/"+i;else if(/\:/.test(i))if(/\?/.test(i)){s.length===0&&r===""?s.push("/"):s.push(r);const n=i.replace("?","");r+="/"+n,s.push(r)}else r+="/"+i}),s.filter((i,n,c)=>c.indexOf(i)===n)},Ea=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Tr(e,ln):e):e,un=(e,t,s)=>{let r;if(!s&&t&&!/[%+]/.test(t)){let c=e.indexOf("?",8);if(c===-1)return;for(e.startsWith(t,c+1)||(c=e.indexOf(`&${t}`,c+1));c!==-1;){const h=e.charCodeAt(c+t.length+1);if(h===61){const d=c+t.length+2,p=e.indexOf("&",d);return Ea(e.slice(d,p===-1?void 0:p))}else if(h==38||isNaN(h))return"";c=e.indexOf(`&${t}`,c+1)}if(r=/[%+]/.test(e),!r)return}const i={};r??(r=/[%+]/.test(e));let n=e.indexOf("?",8);for(;n!==-1;){const c=e.indexOf("&",n+1);let h=e.indexOf("=",n);h>c&&c!==-1&&(h=-1);let d=e.slice(n+1,h===-1?c===-1?void 0:c:h);if(r&&(d=Ea(d)),n=c,d==="")continue;let p;h===-1?p="":(p=e.slice(h+1,c===-1?void 0:c),r&&(p=Ea(p))),s?(i[d]&&Array.isArray(i[d])||(i[d]=[]),i[d].push(p)):i[d]??(i[d]=p)}return t?i[t]:i},Lo=un,Oo=(e,t)=>un(e,t,!0),ln=decodeURIComponent,gi=e=>Tr(e,ln),ht,de,we,hn,mn,Na,Oe,Ji,dn=(Ji=class{constructor(e,t="/",s=[[]]){R(this,we);I(this,"raw");R(this,ht);R(this,de);I(this,"routeIndex",0);I(this,"path");I(this,"bodyCache",{});R(this,Oe,e=>{const{bodyCache:t,raw:s}=this,r=t[e];if(r)return r;const i=Object.keys(t)[0];return i?t[i].then(n=>(i==="json"&&(n=JSON.stringify(n)),new Response(n)[e]())):t[e]=s[e]()});this.raw=e,this.path=t,A(this,de,s),A(this,ht,{})}param(e){return e?B(this,we,hn).call(this,e):B(this,we,mn).call(this)}query(e){return Lo(this.url,e)}queries(e){return Oo(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;const t={};return this.raw.headers.forEach((s,r)=>{t[r]=s}),t}async parseBody(e){return vo(this,e)}json(){return g(this,Oe).call(this,"text").then(e=>JSON.parse(e))}text(){return g(this,Oe).call(this,"text")}arrayBuffer(){return g(this,Oe).call(this,"arrayBuffer")}blob(){return g(this,Oe).call(this,"blob")}formData(){return g(this,Oe).call(this,"formData")}addValidatedData(e,t){g(this,ht)[e]=t}valid(e){return g(this,ht)[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[To](){return g(this,de)}get matchedRoutes(){return g(this,de)[0].map(([[,e]])=>e)}get routePath(){return g(this,de)[0].map(([[,e]])=>e)[this.routeIndex].path}},ht=new WeakMap,de=new WeakMap,we=new WeakSet,hn=function(e){const t=g(this,de)[0][this.routeIndex][1][e],s=B(this,we,Na).call(this,t);return s&&/\%/.test(s)?gi(s):s},mn=function(){const e={},t=Object.keys(g(this,de)[0][this.routeIndex][1]);for(const s of t){const r=B(this,we,Na).call(this,g(this,de)[0][this.routeIndex][1][s]);r!==void 0&&(e[s]=/\%/.test(r)?gi(r):r)}return e},Na=function(e){return g(this,de)[1]?g(this,de)[1][e]:e},Oe=new WeakMap,Ji),Do={Stringify:1},pn=async(e,t,s,r,i)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));const n=e.callbacks;return n!=null&&n.length?(i?i[0]+=e:i=[e],Promise.all(n.map(h=>h({phase:t,buffer:i,context:r}))).then(h=>Promise.all(h.filter(Boolean).map(d=>pn(d,t,!1,r,i))).then(()=>i[0]))):Promise.resolve(e)},Po="text/plain; charset=UTF-8",Ta=(e,t)=>({"Content-Type":e,...t}),St=(e,t)=>new Response(e,t),Vt,Qt,Se,mt,_e,ae,Xt,pt,ft,Ve,Jt,Zt,De,ut,Zi,Mo=(Zi=class{constructor(e,t){R(this,De);R(this,Vt);R(this,Qt);I(this,"env",{});R(this,Se);I(this,"finalized",!1);I(this,"error");R(this,mt);R(this,_e);R(this,ae);R(this,Xt);R(this,pt);R(this,ft);R(this,Ve);R(this,Jt);R(this,Zt);I(this,"render",(...e)=>(g(this,pt)??A(this,pt,t=>this.html(t)),g(this,pt).call(this,...e)));I(this,"setLayout",e=>A(this,Xt,e));I(this,"getLayout",()=>g(this,Xt));I(this,"setRenderer",e=>{A(this,pt,e)});I(this,"header",(e,t,s)=>{this.finalized&&A(this,ae,St(g(this,ae).body,g(this,ae)));const r=g(this,ae)?g(this,ae).headers:g(this,Ve)??A(this,Ve,new Headers);t===void 0?r.delete(e):s!=null&&s.append?r.append(e,t):r.set(e,t)});I(this,"status",e=>{A(this,mt,e)});I(this,"set",(e,t)=>{g(this,Se)??A(this,Se,new Map),g(this,Se).set(e,t)});I(this,"get",e=>g(this,Se)?g(this,Se).get(e):void 0);I(this,"newResponse",(...e)=>B(this,De,ut).call(this,...e));I(this,"body",(e,t,s)=>B(this,De,ut).call(this,e,t,s));I(this,"text",(e,t,s)=>!g(this,Ve)&&!g(this,mt)&&!t&&!s&&!this.finalized?new Response(e):B(this,De,ut).call(this,e,t,Ta(Po,s)));I(this,"json",(e,t,s)=>B(this,De,ut).call(this,JSON.stringify(e),t,Ta("application/json",s)));I(this,"html",(e,t,s)=>{const r=i=>B(this,De,ut).call(this,i,t,Ta("text/html; charset=UTF-8",s));return typeof e=="object"?pn(e,Do.Stringify,!1,{}).then(r):r(e)});I(this,"redirect",(e,t)=>{const s=String(e);return this.header("Location",/[^\x00-\xFF]/.test(s)?encodeURI(s):s),this.newResponse(null,t??302)});I(this,"notFound",()=>(g(this,ft)??A(this,ft,()=>St()),g(this,ft).call(this,this)));A(this,Vt,e),t&&(A(this,_e,t.executionCtx),this.env=t.env,A(this,ft,t.notFoundHandler),A(this,Zt,t.path),A(this,Jt,t.matchResult))}get req(){return g(this,Qt)??A(this,Qt,new dn(g(this,Vt),g(this,Zt),g(this,Jt))),g(this,Qt)}get event(){if(g(this,_e)&&"respondWith"in g(this,_e))return g(this,_e);throw Error("This context has no FetchEvent")}get executionCtx(){if(g(this,_e))return g(this,_e);throw Error("This context has no ExecutionContext")}get res(){return g(this,ae)||A(this,ae,St(null,{headers:g(this,Ve)??A(this,Ve,new Headers)}))}set res(e){if(g(this,ae)&&e){e=St(e.body,e);for(const[t,s]of g(this,ae).headers.entries())if(t!=="content-type")if(t==="set-cookie"){const r=g(this,ae).headers.getSetCookie();e.headers.delete("set-cookie");for(const i of r)e.headers.append("set-cookie",i)}else e.headers.set(t,s)}A(this,ae,e),this.finalized=!0}get var(){return g(this,Se)?Object.fromEntries(g(this,Se)):{}}},Vt=new WeakMap,Qt=new WeakMap,Se=new WeakMap,mt=new WeakMap,_e=new WeakMap,ae=new WeakMap,Xt=new WeakMap,pt=new WeakMap,ft=new WeakMap,Ve=new WeakMap,Jt=new WeakMap,Zt=new WeakMap,De=new WeakSet,ut=function(e,t,s){const r=g(this,ae)?new Headers(g(this,ae).headers):g(this,Ve)??new Headers;if(typeof t=="object"&&"headers"in t){const n=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(const[c,h]of n)c.toLowerCase()==="set-cookie"?r.append(c,h):r.set(c,h)}if(s)for(const[n,c]of Object.entries(s))if(typeof c=="string")r.set(n,c);else{r.delete(n);for(const h of c)r.append(n,h)}const i=typeof t=="number"?t:(t==null?void 0:t.status)??g(this,mt);return St(e,{status:i,headers:r})},Zi),Y="ALL",Ho="all",Bo=["get","post","put","delete","options","patch"],fn="Can not add a route since the matcher is already built.",bn=class extends Error{},Fo="__COMPOSED_HANDLER",Uo=e=>e.text("404 Not Found",404),ki=(e,t)=>{if("getResponse"in e){const s=e.getResponse();return t.newResponse(s.body,s)}return console.error(e),t.text("Internal Server Error",500)},pe,W,gn,fe,Ke,ms,ps,bt,$o=(bt=class{constructor(t={}){R(this,W);I(this,"get");I(this,"post");I(this,"put");I(this,"delete");I(this,"options");I(this,"patch");I(this,"all");I(this,"on");I(this,"use");I(this,"router");I(this,"getPath");I(this,"_basePath","/");R(this,pe,"/");I(this,"routes",[]);R(this,fe,Uo);I(this,"errorHandler",ki);I(this,"onError",t=>(this.errorHandler=t,this));I(this,"notFound",t=>(A(this,fe,t),this));I(this,"fetch",(t,...s)=>B(this,W,ps).call(this,t,s[1],s[0],t.method));I(this,"request",(t,s,r,i)=>t instanceof Request?this.fetch(s?new Request(t,s):t,r,i):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${ct("/",t)}`,s),r,i)));I(this,"fire",()=>{addEventListener("fetch",t=>{t.respondWith(B(this,W,ps).call(this,t.request,t,void 0,t.request.method))})});[...Bo,Ho].forEach(n=>{this[n]=(c,...h)=>(typeof c=="string"?A(this,pe,c):B(this,W,Ke).call(this,n,g(this,pe),c),h.forEach(d=>{B(this,W,Ke).call(this,n,g(this,pe),d)}),this)}),this.on=(n,c,...h)=>{for(const d of[c].flat()){A(this,pe,d);for(const p of[n].flat())h.map(b=>{B(this,W,Ke).call(this,p.toUpperCase(),g(this,pe),b)})}return this},this.use=(n,...c)=>(typeof n=="string"?A(this,pe,n):(A(this,pe,"*"),c.unshift(n)),c.forEach(h=>{B(this,W,Ke).call(this,Y,g(this,pe),h)}),this);const{strict:r,...i}=t;Object.assign(this,i),this.getPath=r??!0?t.getPath??on:Ro}route(t,s){const r=this.basePath(t);return s.routes.map(i=>{var c;let n;s.errorHandler===ki?n=i.handler:(n=async(h,d)=>(await bi([],s.errorHandler)(h,()=>i.handler(h,d))).res,n[Fo]=i.handler),B(c=r,W,Ke).call(c,i.method,i.path,n)}),this}basePath(t){const s=B(this,W,gn).call(this);return s._basePath=ct(this._basePath,t),s}mount(t,s,r){let i,n;r&&(typeof r=="function"?n=r:(n=r.optionHandler,r.replaceRequest===!1?i=d=>d:i=r.replaceRequest));const c=n?d=>{const p=n(d);return Array.isArray(p)?p:[p]}:d=>{let p;try{p=d.executionCtx}catch{}return[d.env,p]};i||(i=(()=>{const d=ct(this._basePath,t),p=d==="/"?0:d.length;return b=>{const k=new URL(b.url);return k.pathname=k.pathname.slice(p)||"/",new Request(k,b)}})());const h=async(d,p)=>{const b=await s(i(d.req.raw),...c(d));if(b)return b;await p()};return B(this,W,Ke).call(this,Y,ct(t,"*"),h),this}},pe=new WeakMap,W=new WeakSet,gn=function(){const t=new bt({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,A(t,fe,g(this,fe)),t.routes=this.routes,t},fe=new WeakMap,Ke=function(t,s,r){t=t.toUpperCase(),s=ct(this._basePath,s);const i={basePath:this._basePath,path:s,method:t,handler:r};this.router.add(t,s,[r,i]),this.routes.push(i)},ms=function(t,s){if(t instanceof Error)return this.errorHandler(t,s);throw t},ps=function(t,s,r,i){if(i==="HEAD")return(async()=>new Response(null,await B(this,W,ps).call(this,t,s,r,"GET")))();const n=this.getPath(t,{env:r}),c=this.router.match(i,n),h=new Mo(t,{path:n,matchResult:c,env:r,executionCtx:s,notFoundHandler:g(this,fe)});if(c[0].length===1){let p;try{p=c[0][0][0][0](h,async()=>{h.res=await g(this,fe).call(this,h)})}catch(b){return B(this,W,ms).call(this,b,h)}return p instanceof Promise?p.then(b=>b||(h.finalized?h.res:g(this,fe).call(this,h))).catch(b=>B(this,W,ms).call(this,b,h)):p??g(this,fe).call(this,h)}const d=bi(c[0],this.errorHandler,g(this,fe));return(async()=>{try{const p=await d(h);if(!p.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return p.res}catch(p){return B(this,W,ms).call(this,p,h)}})()},bt),kn=[];function jo(e,t){const s=this.buildAllMatchers(),r=((i,n)=>{const c=s[i]||s[Y],h=c[2][n];if(h)return h;const d=n.match(c[0]);if(!d)return[[],kn];const p=d.indexOf("",1);return[c[1][p],d]});return this.match=r,r(e,t)}var ks="[^/]+",Ot=".*",Dt="(?:|/.*)",lt=Symbol(),zo=new Set(".\\+*[^]$()");function Ko(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===Ot||e===Dt?1:t===Ot||t===Dt?-1:e===ks?1:t===ks?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Qe,Xe,be,st,Yo=(st=class{constructor(){R(this,Qe);R(this,Xe);R(this,be,Object.create(null))}insert(t,s,r,i,n){if(t.length===0){if(g(this,Qe)!==void 0)throw lt;if(n)return;A(this,Qe,s);return}const[c,...h]=t,d=c==="*"?h.length===0?["","",Ot]:["","",ks]:c==="/*"?["","",Dt]:c.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let p;if(d){const b=d[1];let k=d[2]||ks;if(b&&d[2]&&(k===".*"||(k=k.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(k))))throw lt;if(p=g(this,be)[k],!p){if(Object.keys(g(this,be)).some(v=>v!==Ot&&v!==Dt))throw lt;if(n)return;p=g(this,be)[k]=new st,b!==""&&A(p,Xe,i.varIndex++)}!n&&b!==""&&r.push([b,g(p,Xe)])}else if(p=g(this,be)[c],!p){if(Object.keys(g(this,be)).some(b=>b.length>1&&b!==Ot&&b!==Dt))throw lt;if(n)return;p=g(this,be)[c]=new st}p.insert(h,s,r,i,n)}buildRegExpStr(){const s=Object.keys(g(this,be)).sort(Ko).map(r=>{const i=g(this,be)[r];return(typeof g(i,Xe)=="number"?`(${r})@${g(i,Xe)}`:zo.has(r)?`\\${r}`:r)+i.buildRegExpStr()});return typeof g(this,Qe)=="number"&&s.unshift(`#${g(this,Qe)}`),s.length===0?"":s.length===1?s[0]:"(?:"+s.join("|")+")"}},Qe=new WeakMap,Xe=new WeakMap,be=new WeakMap,st),oa,es,en,Wo=(en=class{constructor(){R(this,oa,{varIndex:0});R(this,es,new Yo)}insert(e,t,s){const r=[],i=[];for(let c=0;;){let h=!1;if(e=e.replace(/\{[^}]+\}/g,d=>{const p=`@\\${c}`;return i[c]=[p,d],c++,h=!0,p}),!h)break}const n=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let c=i.length-1;c>=0;c--){const[h]=i[c];for(let d=n.length-1;d>=0;d--)if(n[d].indexOf(h)!==-1){n[d]=n[d].replace(h,i[c][1]);break}}return g(this,es).insert(n,t,r,g(this,oa),s),r}buildRegExp(){let e=g(this,es).buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0;const s=[],r=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(i,n,c)=>n!==void 0?(s[++t]=Number(n),"$()"):(c!==void 0&&(r[Number(c)]=++t),"")),[new RegExp(`^${e}`),s,r]}},oa=new WeakMap,es=new WeakMap,en),qo=[/^$/,[],Object.create(null)],fs=Object.create(null);function En(e){return fs[e]??(fs[e]=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,s)=>s?`\\${s}`:"(?:|/.*)")}$`))}function Go(){fs=Object.create(null)}function Vo(e){var p;const t=new Wo,s=[];if(e.length===0)return qo;const r=e.map(b=>[!/\*|\/:/.test(b[0]),...b]).sort(([b,k],[v,S])=>b?1:v?-1:k.length-S.length),i=Object.create(null);for(let b=0,k=-1,v=r.length;b<v;b++){const[S,x,y]=r[b];S?i[x]=[y.map(([N])=>[N,Object.create(null)]),kn]:k++;let $;try{$=t.insert(x,k,S)}catch(N){throw N===lt?new bn(x):N}S||(s[k]=y.map(([N,P])=>{const K=Object.create(null);for(P-=1;P>=0;P--){const[te,vt]=$[P];K[te]=vt}return[N,K]}))}const[n,c,h]=t.buildRegExp();for(let b=0,k=s.length;b<k;b++)for(let v=0,S=s[b].length;v<S;v++){const x=(p=s[b][v])==null?void 0:p[1];if(!x)continue;const y=Object.keys(x);for(let $=0,N=y.length;$<N;$++)x[y[$]]=h[x[y[$]]]}const d=[];for(const b in c)d[b]=s[c[b]];return[n,d,i]}function nt(e,t){if(e){for(const s of Object.keys(e).sort((r,i)=>i.length-r.length))if(En(s).test(t))return[...e[s]]}}var Pe,Me,ca,Tn,tn,Qo=(tn=class{constructor(){R(this,ca);I(this,"name","RegExpRouter");R(this,Pe);R(this,Me);I(this,"match",jo);A(this,Pe,{[Y]:Object.create(null)}),A(this,Me,{[Y]:Object.create(null)})}add(e,t,s){var h;const r=g(this,Pe),i=g(this,Me);if(!r||!i)throw new Error(fn);r[e]||[r,i].forEach(d=>{d[e]=Object.create(null),Object.keys(d[Y]).forEach(p=>{d[e][p]=[...d[Y][p]]})}),t==="/*"&&(t="*");const n=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){const d=En(t);e===Y?Object.keys(r).forEach(p=>{var b;(b=r[p])[t]||(b[t]=nt(r[p],t)||nt(r[Y],t)||[])}):(h=r[e])[t]||(h[t]=nt(r[e],t)||nt(r[Y],t)||[]),Object.keys(r).forEach(p=>{(e===Y||e===p)&&Object.keys(r[p]).forEach(b=>{d.test(b)&&r[p][b].push([s,n])})}),Object.keys(i).forEach(p=>{(e===Y||e===p)&&Object.keys(i[p]).forEach(b=>d.test(b)&&i[p][b].push([s,n]))});return}const c=cn(t)||[t];for(let d=0,p=c.length;d<p;d++){const b=c[d];Object.keys(i).forEach(k=>{var v;(e===Y||e===k)&&((v=i[k])[b]||(v[b]=[...nt(r[k],b)||nt(r[Y],b)||[]]),i[k][b].push([s,n-p+d+1]))})}}buildAllMatchers(){const e=Object.create(null);return Object.keys(g(this,Me)).concat(Object.keys(g(this,Pe))).forEach(t=>{e[t]||(e[t]=B(this,ca,Tn).call(this,t))}),A(this,Pe,A(this,Me,void 0)),Go(),e}},Pe=new WeakMap,Me=new WeakMap,ca=new WeakSet,Tn=function(e){const t=[];let s=e===Y;return[g(this,Pe),g(this,Me)].forEach(r=>{const i=r[e]?Object.keys(r[e]).map(n=>[n,r[e][n]]):[];i.length!==0?(s||(s=!0),t.push(...i)):e!==Y&&t.push(...Object.keys(r[Y]).map(n=>[n,r[Y][n]]))}),s?Vo(t):null},tn),He,xe,sn,Xo=(sn=class{constructor(e){I(this,"name","SmartRouter");R(this,He,[]);R(this,xe,[]);A(this,He,e.routers)}add(e,t,s){if(!g(this,xe))throw new Error(fn);g(this,xe).push([e,t,s])}match(e,t){if(!g(this,xe))throw new Error("Fatal error");const s=g(this,He),r=g(this,xe),i=s.length;let n=0,c;for(;n<i;n++){const h=s[n];try{for(let d=0,p=r.length;d<p;d++)h.add(...r[d]);c=h.match(e,t)}catch(d){if(d instanceof bn)continue;throw d}this.match=h.match.bind(h),A(this,He,[h]),A(this,xe,void 0);break}if(n===i)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,c}get activeRouter(){if(g(this,xe)||g(this,He).length!==1)throw new Error("No active router has been determined yet.");return g(this,He)[0]}},He=new WeakMap,xe=new WeakMap,sn),_t=Object.create(null),Jo=e=>{for(const t in e)return!0;return!1},Be,J,Je,gt,X,Ae,Ye,kt,Zo=(kt=class{constructor(t,s,r){R(this,Ae);R(this,Be);R(this,J);R(this,Je);R(this,gt,0);R(this,X,_t);if(A(this,J,r||Object.create(null)),A(this,Be,[]),t&&s){const i=Object.create(null);i[t]={handler:s,possibleKeys:[],score:0},A(this,Be,[i])}A(this,Je,[])}insert(t,s,r){A(this,gt,++fi(this,gt)._);let i=this;const n=Ao(s),c=[];for(let h=0,d=n.length;h<d;h++){const p=n[h],b=n[h+1],k=wo(p,b),v=Array.isArray(k)?k[0]:p;if(v in g(i,J)){i=g(i,J)[v],k&&c.push(k[1]);continue}g(i,J)[v]=new kt,k&&(g(i,Je).push(k),c.push(k[1])),i=g(i,J)[v]}return g(i,Be).push({[t]:{handler:r,possibleKeys:c.filter((h,d,p)=>p.indexOf(h)===d),score:g(this,gt)}}),i}search(t,s){var b;const r=[];A(this,X,_t);let n=[this];const c=nn(s),h=[],d=c.length;let p=null;for(let k=0;k<d;k++){const v=c[k],S=k===d-1,x=[];for(let $=0,N=n.length;$<N;$++){const P=n[$],K=g(P,J)[v];K&&(A(K,X,g(P,X)),S?(g(K,J)["*"]&&B(this,Ae,Ye).call(this,r,g(K,J)["*"],t,g(P,X)),B(this,Ae,Ye).call(this,r,K,t,g(P,X))):x.push(K));for(let te=0,vt=g(P,Je).length;te<vt;te++){const q=g(P,Je)[te],z=g(P,X)===_t?{}:{...g(P,X)};if(q==="*"){const Ne=g(P,J)["*"];Ne&&(B(this,Ae,Ye).call(this,r,Ne,t,g(P,X)),A(Ne,X,z),x.push(Ne));continue}const[me,ce,Ee]=q;if(!v&&!(Ee instanceof RegExp))continue;const se=g(P,J)[me];if(Ee instanceof RegExp){if(p===null){p=new Array(d);let ue=s[0]==="/"?1:0;for(let $e=0;$e<d;$e++)p[$e]=ue,ue+=c[$e].length+1}const Ne=s.substring(p[k]),yt=Ee.exec(Ne);if(yt){if(z[ce]=yt[0],B(this,Ae,Ye).call(this,r,se,t,g(P,X),z),Jo(g(se,J))){A(se,X,z);const ue=((b=yt[0].match(/\//))==null?void 0:b.length)??0;(h[ue]||(h[ue]=[])).push(se)}continue}}(Ee===!0||Ee.test(v))&&(z[ce]=v,S?(B(this,Ae,Ye).call(this,r,se,t,z,g(P,X)),g(se,J)["*"]&&B(this,Ae,Ye).call(this,r,g(se,J)["*"],t,z,g(P,X))):(A(se,X,z),x.push(se)))}}const y=h.shift();n=y?x.concat(y):x}return r.length>1&&r.sort((k,v)=>k.score-v.score),[r.map(({handler:k,params:v})=>[k,v])]}},Be=new WeakMap,J=new WeakMap,Je=new WeakMap,gt=new WeakMap,X=new WeakMap,Ae=new WeakSet,Ye=function(t,s,r,i,n){for(let c=0,h=g(s,Be).length;c<h;c++){const d=g(s,Be)[c],p=d[r]||d[Y],b={};if(p!==void 0&&(p.params=Object.create(null),t.push(p),i!==_t||n&&n!==_t))for(let k=0,v=p.possibleKeys.length;k<v;k++){const S=p.possibleKeys[k],x=b[p.score];p.params[S]=n!=null&&n[S]&&!x?n[S]:i[S]??(n==null?void 0:n[S]),b[p.score]=!0}}},kt),Ze,an,ec=(an=class{constructor(){I(this,"name","TrieRouter");R(this,Ze);A(this,Ze,new Zo)}add(e,t,s){const r=cn(t);if(r){for(let i=0,n=r.length;i<n;i++)g(this,Ze).insert(e,r[i],s);return}g(this,Ze).insert(e,t,s)}match(e,t){return g(this,Ze).search(e,t)}},Ze=new WeakMap,an),tc=class extends $o{constructor(e={}){super(e),this.router=e.router??new Xo({routers:[new Qo,new ec]})}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const sc={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ts=e=>e.replace(/[&<>"']/g,t=>sc[t]);/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ac=({elementRenderers:e},t,s=customElements.get(t),r=new Map)=>{if(s===void 0)return console.warn(`Custom element ${t} was not registered.`),new Ei(t);for(const i of e)if(i.matchesClass(s,t,r))return new i(t);return new Ei(t)};class vn{static matchesClass(t,s,r){return!1}constructor(t){this.tagName=t}connectedCallback(){}attributeChangedCallback(t,s,r){}setProperty(t,s){this.element!==void 0&&(this.element[t]=s)}setAttribute(t,s){if(t=t.toLowerCase(),this.element!==void 0){const r=this.element.getAttribute(t);this.element.setAttribute(t,s),this.attributeChangedCallback(t,r,s)}}get shadowRootOptions(){return{mode:"open"}}renderShadow(t){}renderLight(t){}*renderAttributes(){if(this.element!==void 0){const{attributes:t}=this.element;for(let s=0,r,i;s<t.length&&({name:r,value:i}=t[s]);s++)i===""||i===void 0||i===null?yield` ${r}`:yield` ${r}="${ts(i)}"`}}}class Ei extends vn{constructor(){super(...arguments),this._attributes={}}setAttribute(t,s){this._attributes[t.toLowerCase()]=s}*renderAttributes(){for(const[t,s]of Object.entries(this._attributes))s===""||s===void 0||s===null?yield` ${t}`:yield` ${t}="${ts(s)}"`}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const bs=globalThis,vr=bs.ShadowRoot&&(bs.ShadyCSS===void 0||bs.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,yr=Symbol(),Ti=new WeakMap;let yn=class{constructor(t,s,r){if(this._$cssResult$=!0,r!==yr)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o;const s=this.t;if(vr&&t===void 0){const r=s!==void 0&&s.length===1;r&&(t=Ti.get(s)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&Ti.set(s,t))}return t}toString(){return this.cssText}};const Ra=e=>new yn(typeof e=="string"?e:e+"",void 0,yr),w=(e,...t)=>{const s=e.length===1?e[0]:t.reduce((r,i,n)=>r+(c=>{if(c._$cssResult$===!0)return c.cssText;if(typeof c=="number")return c;throw Error("Value passed to 'css' function must be a 'css' function result: "+c+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[n+1],e[0]);return new yn(s,e,yr)},rc=(e,t)=>{if(vr)e.adoptedStyleSheets=t.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of t){const r=document.createElement("style"),i=bs.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=s.cssText,e.appendChild(r)}},vi=vr?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let s="";for(const r of t.cssRules)s+=r.cssText;return Ra(s)})(e):e;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:ic,defineProperty:nc,getOwnPropertyDescriptor:oc,getOwnPropertyNames:cc,getOwnPropertySymbols:uc,getPrototypeOf:lc}=Object,Ue=globalThis,yi=Ue.trustedTypes,dc=yi?yi.emptyScript:"",va=Ue.reactiveElementPolyfillSupport,Pt=(e,t)=>e,La={toAttribute(e,t){switch(t){case Boolean:e=e?dc:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let s=e;switch(t){case Boolean:s=e!==null;break;case Number:s=e===null?null:Number(e);break;case Object:case Array:try{s=JSON.parse(e)}catch{s=null}}return s}},Sn=(e,t)=>!ic(e,t),Si={attribute:!0,type:String,converter:La,reflect:!1,useDefault:!1,hasChanged:Sn};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),Ue.litPropertyMetadata??(Ue.litPropertyMetadata=new WeakMap);let We=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=Si){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(t,r,s);i!==void 0&&nc(this.prototype,t,i)}}static getPropertyDescriptor(t,s,r){const{get:i,set:n}=oc(this.prototype,t)??{get(){return this[s]},set(c){this[s]=c}};return{get:i,set(c){const h=i==null?void 0:i.call(this);n==null||n.call(this,c),this.requestUpdate(t,h,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Si}static _$Ei(){if(this.hasOwnProperty(Pt("elementProperties")))return;const t=lc(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Pt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Pt("properties"))){const s=this.properties,r=[...cc(s),...uc(s)];for(const i of r)this.createProperty(i,s[i])}const t=this[Symbol.metadata];if(t!==null){const s=litPropertyMetadata.get(t);if(s!==void 0)for(const[r,i]of s)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[s,r]of this.elementProperties){const i=this._$Eu(s,r);i!==void 0&&this._$Eh.set(i,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const s=[];if(Array.isArray(t)){const r=new Set(t.flat(1/0).reverse());for(const i of r)s.unshift(vi(i))}else t!==void 0&&s.push(vi(t));return s}static _$Eu(t,s){const r=s.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(s=>this.enableUpdating=s),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(s=>s(this))}addController(t){var s;(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)==null||s.call(t))}removeController(t){var s;(s=this._$EO)==null||s.delete(t)}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const r of s.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return rc(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(s=>{var r;return(r=s.hostConnected)==null?void 0:r.call(s)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(s=>{var r;return(r=s.hostDisconnected)==null?void 0:r.call(s)})}attributeChangedCallback(t,s,r){this._$AK(t,r)}_$ET(t,s){var n;const r=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,r);if(i!==void 0&&r.reflect===!0){const c=(((n=r.converter)==null?void 0:n.toAttribute)!==void 0?r.converter:La).toAttribute(s,r.type);this._$Em=t,c==null?this.removeAttribute(i):this.setAttribute(i,c),this._$Em=null}}_$AK(t,s){var n,c;const r=this.constructor,i=r._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const h=r.getPropertyOptions(i),d=typeof h.converter=="function"?{fromAttribute:h.converter}:((n=h.converter)==null?void 0:n.fromAttribute)!==void 0?h.converter:La;this._$Em=i;const p=d.fromAttribute(s,h.type);this[i]=p??((c=this._$Ej)==null?void 0:c.get(i))??p,this._$Em=null}}requestUpdate(t,s,r,i=!1,n){var c;if(t!==void 0){const h=this.constructor;if(i===!1&&(n=this[t]),r??(r=h.getPropertyOptions(t)),!((r.hasChanged??Sn)(n,s)||r.useDefault&&r.reflect&&n===((c=this._$Ej)==null?void 0:c.get(t))&&!this.hasAttribute(h._$Eu(t,r))))return;this.C(t,s,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,s,{useDefault:r,reflect:i,wrapped:n},c){r&&!(this._$Ej??(this._$Ej=new Map)).has(t)&&(this._$Ej.set(t,c??s??this[t]),n!==!0||c!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(s=void 0),this._$AL.set(t,s)),i===!0&&this._$Em!==t&&(this._$Eq??(this._$Eq=new Set)).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var r;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[n,c]of this._$Ep)this[n]=c;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[n,c]of i){const{wrapped:h}=c,d=this[n];h!==!0||this._$AL.has(n)||d===void 0||this.C(n,void 0,c,d)}}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),(r=this._$EO)==null||r.forEach(i=>{var n;return(n=i.hostUpdate)==null?void 0:n.call(i)}),this.update(s)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(s)}willUpdate(t){}_$AE(t){var s;(s=this._$EO)==null||s.forEach(r=>{var i;return(i=r.hostUpdated)==null?void 0:i.call(r)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(s=>this._$ET(s,this[s]))),this._$EM()}updated(t){}firstUpdated(t){}};We.elementStyles=[],We.shadowRootOptions={mode:"open"},We[Pt("elementProperties")]=new Map,We[Pt("finalized")]=new Map,va==null||va({ReactiveElement:We}),(Ue.reactiveElementVersions??(Ue.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Mt=globalThis,_i=e=>e,Es=Mt.trustedTypes,xi=Es?Es.createPolicy("lit-html",{createHTML:e=>e}):void 0,Sr="$lit$",Ie=`lit$${Math.random().toFixed(9).slice(2)}$`,_r="?"+Ie,hc=`<${_r}>`,at=document,Kt=()=>at.createComment(""),Yt=e=>e===null||typeof e!="object"&&typeof e!="function",xr=Array.isArray,_n=e=>xr(e)||typeof(e==null?void 0:e[Symbol.iterator])=="function",ya=`[ 	
\f\r]`,xt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ai=/-->/g,Ii=/>/g,je=RegExp(`>|${ya}(?:([^\\s"'>=/]+)(${ya}*=${ya}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ci=/'/g,wi=/"/g,xn=/^(?:script|style|textarea|title)$/i,mc=e=>(t,...s)=>({_$litType$:e,strings:t,values:s}),_=mc(1),ge=Symbol.for("lit-noChange"),D=Symbol.for("lit-nothing"),Ni=new WeakMap,Ge=at.createTreeWalker(at,129);function An(e,t){if(!xr(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return xi!==void 0?xi.createHTML(t):t}const In=(e,t)=>{const s=e.length-1,r=[];let i,n=t===2?"<svg>":t===3?"<math>":"",c=xt;for(let h=0;h<s;h++){const d=e[h];let p,b,k=-1,v=0;for(;v<d.length&&(c.lastIndex=v,b=c.exec(d),b!==null);)v=c.lastIndex,c===xt?b[1]==="!--"?c=Ai:b[1]!==void 0?c=Ii:b[2]!==void 0?(xn.test(b[2])&&(i=RegExp("</"+b[2],"g")),c=je):b[3]!==void 0&&(c=je):c===je?b[0]===">"?(c=i??xt,k=-1):b[1]===void 0?k=-2:(k=c.lastIndex-b[2].length,p=b[1],c=b[3]===void 0?je:b[3]==='"'?wi:Ci):c===wi||c===Ci?c=je:c===Ai||c===Ii?c=xt:(c=je,i=void 0);const S=c===je&&e[h+1].startsWith("/>")?" ":"";n+=c===xt?d+hc:k>=0?(r.push(p),d.slice(0,k)+Sr+d.slice(k)+Ie+S):d+Ie+(k===-2?h:S)}return[An(e,n+(e[s]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]};class Wt{constructor({strings:t,_$litType$:s},r){let i;this.parts=[];let n=0,c=0;const h=t.length-1,d=this.parts,[p,b]=In(t,s);if(this.el=Wt.createElement(p,r),Ge.currentNode=this.el.content,s===2||s===3){const k=this.el.content.firstChild;k.replaceWith(...k.childNodes)}for(;(i=Ge.nextNode())!==null&&d.length<h;){if(i.nodeType===1){if(i.hasAttributes())for(const k of i.getAttributeNames())if(k.endsWith(Sr)){const v=b[c++],S=i.getAttribute(k).split(Ie),x=/([.?@])?(.*)/.exec(v);d.push({type:1,index:n,name:x[2],strings:S,ctor:x[1]==="."?Cn:x[1]==="?"?wn:x[1]==="@"?Nn:as}),i.removeAttribute(k)}else k.startsWith(Ie)&&(d.push({type:6,index:n}),i.removeAttribute(k));if(xn.test(i.tagName)){const k=i.textContent.split(Ie),v=k.length-1;if(v>0){i.textContent=Es?Es.emptyScript:"";for(let S=0;S<v;S++)i.append(k[S],Kt()),Ge.nextNode(),d.push({type:2,index:++n});i.append(k[v],Kt())}}}else if(i.nodeType===8)if(i.data===_r)d.push({type:2,index:n});else{let k=-1;for(;(k=i.data.indexOf(Ie,k+1))!==-1;)d.push({type:7,index:n}),k+=Ie.length-1}n++}}static createElement(t,s){const r=at.createElement("template");return r.innerHTML=t,r}}function rt(e,t,s=e,r){var c,h;if(t===ge)return t;let i=r!==void 0?(c=s._$Co)==null?void 0:c[r]:s._$Cl;const n=Yt(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==n&&((h=i==null?void 0:i._$AO)==null||h.call(i,!1),n===void 0?i=void 0:(i=new n(e),i._$AT(e,s,r)),r!==void 0?(s._$Co??(s._$Co=[]))[r]=i:s._$Cl=i),i!==void 0&&(t=rt(e,i._$AS(e,t.values),i,r)),t}class pc{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:s},parts:r}=this._$AD,i=((t==null?void 0:t.creationScope)??at).importNode(s,!0);Ge.currentNode=i;let n=Ge.nextNode(),c=0,h=0,d=r[0];for(;d!==void 0;){if(c===d.index){let p;d.type===2?p=new ss(n,n.nextSibling,this,t):d.type===1?p=new d.ctor(n,d.name,d.strings,this,t):d.type===6&&(p=new fc(n,this,t)),this._$AV.push(p),d=r[++h]}c!==(d==null?void 0:d.index)&&(n=Ge.nextNode(),c++)}return Ge.currentNode=at,i}p(t){let s=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,s),s+=r.strings.length-2):r._$AI(t[s])),s++}}class ss{get _$AU(){var t;return((t=this._$AM)==null?void 0:t._$AU)??this._$Cv}constructor(t,s,r,i){this.type=2,this._$AH=D,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=r,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=rt(this,t,s),Yt(t)?t===D||t==null||t===""?(this._$AH!==D&&this._$AR(),this._$AH=D):t!==this._$AH&&t!==ge&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):_n(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==D&&Yt(this._$AH)?this._$AA.nextSibling.data=t:this.T(at.createTextNode(t)),this._$AH=t}$(t){var n;const{values:s,_$litType$:r}=t,i=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=Wt.createElement(An(r.h,r.h[0]),this.options)),r);if(((n=this._$AH)==null?void 0:n._$AD)===i)this._$AH.p(s);else{const c=new pc(i,this),h=c.u(this.options);c.p(s),this.T(h),this._$AH=c}}_$AC(t){let s=Ni.get(t.strings);return s===void 0&&Ni.set(t.strings,s=new Wt(t)),s}k(t){xr(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let r,i=0;for(const n of t)i===s.length?s.push(r=new ss(this.O(Kt()),this.O(Kt()),this,this.options)):r=s[i],r._$AI(n),i++;i<s.length&&(this._$AR(r&&r._$AB.nextSibling,i),s.length=i)}_$AR(t=this._$AA.nextSibling,s){var r;for((r=this._$AP)==null?void 0:r.call(this,!1,!0,s);t!==this._$AB;){const i=_i(t).nextSibling;_i(t).remove(),t=i}}setConnected(t){var s;this._$AM===void 0&&(this._$Cv=t,(s=this._$AP)==null||s.call(this,t))}}class as{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,r,i,n){this.type=1,this._$AH=D,this._$AN=void 0,this.element=t,this.name=s,this._$AM=i,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=D}_$AI(t,s=this,r,i){const n=this.strings;let c=!1;if(n===void 0)t=rt(this,t,s,0),c=!Yt(t)||t!==this._$AH&&t!==ge,c&&(this._$AH=t);else{const h=t;let d,p;for(t=n[0],d=0;d<n.length-1;d++)p=rt(this,h[r+d],s,d),p===ge&&(p=this._$AH[d]),c||(c=!Yt(p)||p!==this._$AH[d]),p===D?t=D:t!==D&&(t+=(p??"")+n[d+1]),this._$AH[d]=p}c&&!i&&this.j(t)}j(t){t===D?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Cn extends as{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===D?void 0:t}}class wn extends as{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==D)}}class Nn extends as{constructor(t,s,r,i,n){super(t,s,r,i,n),this.type=5}_$AI(t,s=this){if((t=rt(this,t,s,0)??D)===ge)return;const r=this._$AH,i=t===D&&r!==D||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,n=t!==D&&(r===D||i);i&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var s;typeof this._$AH=="function"?this._$AH.call(((s=this.options)==null?void 0:s.host)??this.element,t):this._$AH.handleEvent(t)}}class fc{constructor(t,s,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){rt(this,t)}}const Te={M:Sr,P:Ie,A:_r,L:In,D:_n,V:rt,H:as,N:wn,U:Nn,B:Cn},Sa=Mt.litHtmlPolyfillSupport;Sa==null||Sa(Wt,ss),(Mt.litHtmlVersions??(Mt.litHtmlVersions=[])).push("3.3.2");const bc=(e,t,s)=>{const r=(s==null?void 0:s.renderBefore)??t;let i=r._$litPart$;if(i===void 0){const n=(s==null?void 0:s.renderBefore)??null;r._$litPart$=i=new ss(t.insertBefore(Kt(),n),n,void 0,s??{})}return i._$AI(e),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const et=globalThis;let C=class extends We{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var s;const t=super.createRenderRoot();return(s=this.renderOptions).renderBefore??(s.renderBefore=t.firstChild),t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=bc(s,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return ge}};var rn;C._$litElement$=!0,C.finalized=!0,(rn=et.litElementHydrateSupport)==null||rn.call(et,{LitElement:C});const _a=et.litElementPolyfillSupport;_a==null||_a({LitElement:C});const Ri={_$AK:(e,t,s)=>{e._$AK(t,s)},_$AL:e=>e._$AL};(et.litElementVersions??(et.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const gc={attributeToProperty:Ri._$AK,changedProperties:Ri._$AL};/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const kc={ariaAtomic:"aria-atomic",ariaAutoComplete:"aria-autocomplete",ariaBrailleLabel:"aria-braillelabel",ariaBrailleRoleDescription:"aria-brailleroledescription",ariaBusy:"aria-busy",ariaChecked:"aria-checked",ariaColCount:"aria-colcount",ariaColIndex:"aria-colindex",ariaColIndexText:"aria-colindextext",ariaColSpan:"aria-colspan",ariaCurrent:"aria-current",ariaDescription:"aria-description",ariaDisabled:"aria-disabled",ariaExpanded:"aria-expanded",ariaHasPopup:"aria-haspopup",ariaHidden:"aria-hidden",ariaInvalid:"aria-invalid",ariaKeyShortcuts:"aria-keyshortcuts",ariaLabel:"aria-label",ariaLevel:"aria-level",ariaLive:"aria-live",ariaModal:"aria-modal",ariaMultiLine:"aria-multiline",ariaMultiSelectable:"aria-multiselectable",ariaOrientation:"aria-orientation",ariaPlaceholder:"aria-placeholder",ariaPosInSet:"aria-posinset",ariaPressed:"aria-pressed",ariaReadOnly:"aria-readonly",ariaRelevant:"aria-relevant",ariaRequired:"aria-required",ariaRoleDescription:"aria-roledescription",ariaRowCount:"aria-rowcount",ariaRowIndex:"aria-rowindex",ariaRowIndexText:"aria-rowindextext",ariaRowSpan:"aria-rowspan",ariaSelected:"aria-selected",ariaSetSize:"aria-setsize",ariaSort:"aria-sort",ariaValueMax:"aria-valuemax",ariaValueMin:"aria-valuemin",ariaValueNow:"aria-valuenow",ariaValueText:"aria-valuetext",role:"role"},Ec=class{get shadowRoot(){return this.__host.__shadowRoot}constructor(t){this.ariaActiveDescendantElement=null,this.ariaAtomic="",this.ariaAutoComplete="",this.ariaBrailleLabel="",this.ariaBrailleRoleDescription="",this.ariaBusy="",this.ariaChecked="",this.ariaColCount="",this.ariaColIndex="",this.ariaColIndexText="",this.ariaColSpan="",this.ariaControlsElements=null,this.ariaCurrent="",this.ariaDescribedByElements=null,this.ariaDescription="",this.ariaDetailsElements=null,this.ariaDisabled="",this.ariaErrorMessageElements=null,this.ariaExpanded="",this.ariaFlowToElements=null,this.ariaHasPopup="",this.ariaHidden="",this.ariaInvalid="",this.ariaKeyShortcuts="",this.ariaLabel="",this.ariaLabelledByElements=null,this.ariaLevel="",this.ariaLive="",this.ariaModal="",this.ariaMultiLine="",this.ariaMultiSelectable="",this.ariaOrientation="",this.ariaOwnsElements=null,this.ariaPlaceholder="",this.ariaPosInSet="",this.ariaPressed="",this.ariaReadOnly="",this.ariaRelevant="",this.ariaRequired="",this.ariaRoleDescription="",this.ariaRowCount="",this.ariaRowIndex="",this.ariaRowIndexText="",this.ariaRowSpan="",this.ariaSelected="",this.ariaSetSize="",this.ariaSort="",this.ariaValueMax="",this.ariaValueMin="",this.ariaValueNow="",this.ariaValueText="",this.role="",this.form=null,this.labels=[],this.states=new Set,this.validationMessage="",this.validity={},this.willValidate=!0,this.__host=t}checkValidity(){return console.warn("`ElementInternals.checkValidity()` was called on the server.This method always returns true."),!0}reportValidity(){return!0}setFormValue(){}setValidity(){}},Tc="hydrate-internals-";/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var ve=function(e,t,s,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof t=="function"?e!==t||!i:!t.has(e))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(e,s):i?i.value=s:t.set(e,s),s},Q=function(e,t,s,r){if(s==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof t=="function"?e!==t||!r:!t.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return s==="m"?r:s==="a"?r.call(e):r?r.value:t.get(e)},ot,os,cs,At,xa,It,us,ze,Ct,Re,ls,Li;const Oi=e=>typeof e=="boolean"?e:(e==null?void 0:e.capture)??!1,Ts=0,Oa=1,vs=2,Da=3;class vc{constructor(){this.__eventListeners=new Map,this.__captureEventListeners=new Map}addEventListener(t,s,r){var h;if(s==null)return;const i=Oi(r)?this.__captureEventListeners:this.__eventListeners;let n=i.get(t);if(n===void 0)n=new Map,i.set(t,n);else if(n.has(s))return;const c=typeof r=="object"&&r?r:{};(h=c.signal)==null||h.addEventListener("abort",()=>this.removeEventListener(t,s,r)),n.set(s,c??{})}removeEventListener(t,s,r){if(s==null)return;const i=Oi(r)?this.__captureEventListeners:this.__eventListeners,n=i.get(t);n!==void 0&&(n.delete(s),n.size||i.delete(t))}dispatchEvent(t){const s=[this];let r=this.__eventTargetParent;if(t.composed)for(;r;)s.push(r),r=r.__eventTargetParent;else for(;r&&r!==this.__host;)s.push(r),r=r.__eventTargetParent;let i=!1,n=!1,c=Ts,h=null,d=null,p=null;const b=t.stopPropagation,k=t.stopImmediatePropagation;Object.defineProperties(t,{target:{get(){return h??d},...U},srcElement:{get(){return t.target},...U},currentTarget:{get(){return p},...U},eventPhase:{get(){return c},...U},composedPath:{value:()=>s,...U},stopPropagation:{value:()=>{i=!0,b.call(t)},...U},stopImmediatePropagation:{value:()=>{n=!0,k.call(t)},...U}});const v=(N,P,K)=>{typeof N=="function"?N(t):typeof(N==null?void 0:N.handleEvent)=="function"&&N.handleEvent(t),P.once&&K.delete(N)},S=()=>(p=null,c=Ts,!t.defaultPrevented),x=s.slice().reverse();h=!this.__host||!t.composed?this:null;const y=N=>{for(d=this;d.__host&&N.includes(d.__host);)d=d.__host};for(const N of x){!h&&(!d||d===N.__host)&&y(x.slice(x.indexOf(N))),p=N,c=N===t.target?vs:Oa;const P=N.__captureEventListeners.get(t.type);if(P){for(const[K,te]of P)if(v(K,te,P),n)return S()}if(i)return S()}const $=t.bubbles?s:[this];d=null;for(const N of $){!h&&(!d||N===d.__host)&&y($.slice(0,$.indexOf(N)+1)),p=N,c=N===t.target?vs:Da;const P=N.__eventListeners.get(t.type);if(P){for(const[K,te]of P)if(v(K,te,P),n)return S()}if(i)return S()}return S()}}const yc=vc,U={__proto__:null};U.enumerable=!0;Object.freeze(U);const Ar=(Re=class{constructor(t,s={}){if(ot.set(this,!1),os.set(this,!1),cs.set(this,!1),At.set(this,!1),xa.set(this,Date.now()),It.set(this,!1),us.set(this,void 0),ze.set(this,void 0),Ct.set(this,void 0),this.NONE=Ts,this.CAPTURING_PHASE=Oa,this.AT_TARGET=vs,this.BUBBLING_PHASE=Da,arguments.length===0)throw new Error("The type argument must be specified");if(typeof s!="object"||!s)throw new Error('The "options" argument must be an object');const{bubbles:r,cancelable:i,composed:n}=s;ve(this,ot,!!i,"f"),ve(this,os,!!r,"f"),ve(this,cs,!!n,"f"),ve(this,us,`${t}`,"f"),ve(this,ze,null,"f"),ve(this,Ct,!1,"f")}initEvent(t,s,r){throw new Error("Method not implemented.")}stopImmediatePropagation(){this.stopPropagation()}preventDefault(){ve(this,At,!0,"f")}get target(){return Q(this,ze,"f")}get currentTarget(){return Q(this,ze,"f")}get srcElement(){return Q(this,ze,"f")}get type(){return Q(this,us,"f")}get cancelable(){return Q(this,ot,"f")}get defaultPrevented(){return Q(this,ot,"f")&&Q(this,At,"f")}get timeStamp(){return Q(this,xa,"f")}composedPath(){return Q(this,Ct,"f")?[Q(this,ze,"f")]:[]}get returnValue(){return!Q(this,ot,"f")||!Q(this,At,"f")}get bubbles(){return Q(this,os,"f")}get composed(){return Q(this,cs,"f")}get eventPhase(){return Q(this,Ct,"f")?Re.AT_TARGET:Re.NONE}get cancelBubble(){return Q(this,It,"f")}set cancelBubble(t){t&&ve(this,It,!0,"f")}stopPropagation(){ve(this,It,!0,"f")}get isTrusted(){return!1}},ot=new WeakMap,os=new WeakMap,cs=new WeakMap,At=new WeakMap,xa=new WeakMap,It=new WeakMap,us=new WeakMap,ze=new WeakMap,Ct=new WeakMap,Re.NONE=Ts,Re.CAPTURING_PHASE=Oa,Re.AT_TARGET=vs,Re.BUBBLING_PHASE=Da,Re);Object.defineProperties(Ar.prototype,{initEvent:U,stopImmediatePropagation:U,preventDefault:U,target:U,currentTarget:U,srcElement:U,type:U,cancelable:U,defaultPrevented:U,timeStamp:U,composedPath:U,returnValue:U,bubbles:U,composed:U,eventPhase:U,cancelBubble:U,stopPropagation:U,isTrusted:U});const Rn=(Li=class extends Ar{constructor(t,s={}){super(t,s),ls.set(this,void 0),ve(this,ls,(s==null?void 0:s.detail)??null,"f")}initCustomEvent(t,s,r,i){throw new Error("Method not implemented.")}get detail(){return Q(this,ls,"f")}},ls=new WeakMap,Li);Object.defineProperties(Rn.prototype,{detail:U});const Sc=Ar,_c=Rn;/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var re;re=class{constructor(){this.STYLE_RULE=1,this.CHARSET_RULE=2,this.IMPORT_RULE=3,this.MEDIA_RULE=4,this.FONT_FACE_RULE=5,this.PAGE_RULE=6,this.NAMESPACE_RULE=10,this.KEYFRAMES_RULE=7,this.KEYFRAME_RULE=8,this.SUPPORTS_RULE=12,this.COUNTER_STYLE_RULE=11,this.FONT_FEATURE_VALUES_RULE=14,this.__parentStyleSheet=null,this.cssText=""}get parentRule(){return null}get parentStyleSheet(){return this.__parentStyleSheet}get type(){return 0}},re.STYLE_RULE=1,re.CHARSET_RULE=2,re.IMPORT_RULE=3,re.MEDIA_RULE=4,re.FONT_FACE_RULE=5,re.PAGE_RULE=6,re.NAMESPACE_RULE=10,re.KEYFRAMES_RULE=7,re.KEYFRAME_RULE=8,re.SUPPORTS_RULE=12,re.COUNTER_STYLE_RULE=11,re.FONT_FEATURE_VALUES_RULE=14;/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */globalThis.Event??(globalThis.Event=Sc);globalThis.CustomEvent??(globalThis.CustomEvent=_c);const Di=new WeakMap,wt=e=>{let t=Di.get(e);return t===void 0&&Di.set(e,t=new Map),t},xc=class extends yc{constructor(){super(...arguments),this.__shadowRootMode=null,this.__shadowRoot=null,this.__internals=null}get attributes(){return Array.from(wt(this)).map(([t,s])=>({name:t,value:s}))}get shadowRoot(){return this.__shadowRootMode==="closed"?null:this.__shadowRoot}get localName(){return this.constructor.__localName}get tagName(){var t;return(t=this.localName)==null?void 0:t.toUpperCase()}setAttribute(t,s){wt(this).set(t,String(s))}removeAttribute(t){wt(this).delete(t)}toggleAttribute(t,s){if(this.hasAttribute(t)){if(s===void 0||!s)return this.removeAttribute(t),!1}else return s===void 0||s?(this.setAttribute(t,""),!0):!1;return!0}hasAttribute(t){return wt(this).has(t)}attachShadow(t){const s={host:this};return this.__shadowRootMode=t.mode,t&&t.mode==="open"&&(this.__shadowRoot=s),s}attachInternals(){if(this.__internals!==null)throw new Error("Failed to execute 'attachInternals' on 'HTMLElement': ElementInternals for the specified element was already attached.");const t=new Ec(this);return this.__internals=t,t}getAttribute(t){return wt(this).get(t)??null}},Ac=class extends xc{},Ln=Ac;globalThis.litServerRoot??(globalThis.litServerRoot=Object.defineProperty(new Ln,"localName",{get(){return"lit-server-root"}}));/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ht={CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5},Ic=e=>(...t)=>({_$litDirective$:e,values:t});let On=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,s,r){this._$Ct=t,this._$AM=s,this._$Ci=r}_$AS(t,s){return this.update(t,s)}update(t,s){return this.render(...s)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Cc=e=>e===null||typeof e!="object"&&typeof e!="function",wc={HTML:1},Ir=(e,t)=>(e==null?void 0:e._$litType$)!==void 0,Nc=e=>{var t;return((t=e==null?void 0:e._$litType$)==null?void 0:t.h)!=null},Dn=e=>e==null?void 0:e._$litDirective$;/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Aa=null;const Rc={boundAttributeSuffix:Te.M,marker:Te.P,markerMatch:Te.A,getTemplateHtml:Te.L,patchDirectiveResolve:(e,t)=>{if(e.prototype._$AS.name!==t.name){Aa??(Aa=e.prototype._$AS.name);for(let s=e.prototype;s!==Object.prototype;s=Object.getPrototypeOf(s))if(s.hasOwnProperty(Aa))return void(s[Aa]=t);throw Error("Internal error: It is possible that both dev mode and production mode Lit was mixed together during SSR. Please comment on the issue: https://github.com/lit/lit/issues/4527")}},getAttributePartCommittedValue:(e,t,s)=>{let r=ge;return e.j=i=>r=i,e._$AI(t,e,s),r},connectedDisconnectable:e=>({...e,_$AU:!0}),resolveDirective:Te.V,AttributePart:Te.H,PropertyPart:Te.B,BooleanAttributePart:Te.N,EventPart:Te.U,isIterable:Te.D};/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Pi=new WeakMap,Lc=e=>{let t=Pi.get(e.strings);if(t!==void 0)return t;const s=new Uint32Array(2).fill(5381);for(const i of e.strings)for(let n=0;n<i.length;n++)s[n%2]=33*s[n%2]^i.charCodeAt(n);const r=String.fromCharCode(...new Uint8Array(s.buffer));return t=btoa(r),Pi.set(e.strings,t),t},Oc=new Set([65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111]),j="�";var o;(function(e){e[e.EOF=-1]="EOF",e[e.NULL=0]="NULL",e[e.TABULATION=9]="TABULATION",e[e.CARRIAGE_RETURN=13]="CARRIAGE_RETURN",e[e.LINE_FEED=10]="LINE_FEED",e[e.FORM_FEED=12]="FORM_FEED",e[e.SPACE=32]="SPACE",e[e.EXCLAMATION_MARK=33]="EXCLAMATION_MARK",e[e.QUOTATION_MARK=34]="QUOTATION_MARK",e[e.AMPERSAND=38]="AMPERSAND",e[e.APOSTROPHE=39]="APOSTROPHE",e[e.HYPHEN_MINUS=45]="HYPHEN_MINUS",e[e.SOLIDUS=47]="SOLIDUS",e[e.DIGIT_0=48]="DIGIT_0",e[e.DIGIT_9=57]="DIGIT_9",e[e.SEMICOLON=59]="SEMICOLON",e[e.LESS_THAN_SIGN=60]="LESS_THAN_SIGN",e[e.EQUALS_SIGN=61]="EQUALS_SIGN",e[e.GREATER_THAN_SIGN=62]="GREATER_THAN_SIGN",e[e.QUESTION_MARK=63]="QUESTION_MARK",e[e.LATIN_CAPITAL_A=65]="LATIN_CAPITAL_A",e[e.LATIN_CAPITAL_Z=90]="LATIN_CAPITAL_Z",e[e.RIGHT_SQUARE_BRACKET=93]="RIGHT_SQUARE_BRACKET",e[e.GRAVE_ACCENT=96]="GRAVE_ACCENT",e[e.LATIN_SMALL_A=97]="LATIN_SMALL_A",e[e.LATIN_SMALL_Z=122]="LATIN_SMALL_Z"})(o||(o={}));const ie={DASH_DASH:"--",CDATA_START:"[CDATA[",DOCTYPE:"doctype",SCRIPT:"script",PUBLIC:"public",SYSTEM:"system"};function Pn(e){return e>=55296&&e<=57343}function Dc(e){return e>=56320&&e<=57343}function Pc(e,t){return(e-55296)*1024+9216+t}function Mn(e){return e!==32&&e!==10&&e!==13&&e!==9&&e!==12&&e>=1&&e<=31||e>=127&&e<=159}function Hn(e){return e>=64976&&e<=65007||Oc.has(e)}var f;(function(e){e.controlCharacterInInputStream="control-character-in-input-stream",e.noncharacterInInputStream="noncharacter-in-input-stream",e.surrogateInInputStream="surrogate-in-input-stream",e.nonVoidHtmlElementStartTagWithTrailingSolidus="non-void-html-element-start-tag-with-trailing-solidus",e.endTagWithAttributes="end-tag-with-attributes",e.endTagWithTrailingSolidus="end-tag-with-trailing-solidus",e.unexpectedSolidusInTag="unexpected-solidus-in-tag",e.unexpectedNullCharacter="unexpected-null-character",e.unexpectedQuestionMarkInsteadOfTagName="unexpected-question-mark-instead-of-tag-name",e.invalidFirstCharacterOfTagName="invalid-first-character-of-tag-name",e.unexpectedEqualsSignBeforeAttributeName="unexpected-equals-sign-before-attribute-name",e.missingEndTagName="missing-end-tag-name",e.unexpectedCharacterInAttributeName="unexpected-character-in-attribute-name",e.unknownNamedCharacterReference="unknown-named-character-reference",e.missingSemicolonAfterCharacterReference="missing-semicolon-after-character-reference",e.unexpectedCharacterAfterDoctypeSystemIdentifier="unexpected-character-after-doctype-system-identifier",e.unexpectedCharacterInUnquotedAttributeValue="unexpected-character-in-unquoted-attribute-value",e.eofBeforeTagName="eof-before-tag-name",e.eofInTag="eof-in-tag",e.missingAttributeValue="missing-attribute-value",e.missingWhitespaceBetweenAttributes="missing-whitespace-between-attributes",e.missingWhitespaceAfterDoctypePublicKeyword="missing-whitespace-after-doctype-public-keyword",e.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers="missing-whitespace-between-doctype-public-and-system-identifiers",e.missingWhitespaceAfterDoctypeSystemKeyword="missing-whitespace-after-doctype-system-keyword",e.missingQuoteBeforeDoctypePublicIdentifier="missing-quote-before-doctype-public-identifier",e.missingQuoteBeforeDoctypeSystemIdentifier="missing-quote-before-doctype-system-identifier",e.missingDoctypePublicIdentifier="missing-doctype-public-identifier",e.missingDoctypeSystemIdentifier="missing-doctype-system-identifier",e.abruptDoctypePublicIdentifier="abrupt-doctype-public-identifier",e.abruptDoctypeSystemIdentifier="abrupt-doctype-system-identifier",e.cdataInHtmlContent="cdata-in-html-content",e.incorrectlyOpenedComment="incorrectly-opened-comment",e.eofInScriptHtmlCommentLikeText="eof-in-script-html-comment-like-text",e.eofInDoctype="eof-in-doctype",e.nestedComment="nested-comment",e.abruptClosingOfEmptyComment="abrupt-closing-of-empty-comment",e.eofInComment="eof-in-comment",e.incorrectlyClosedComment="incorrectly-closed-comment",e.eofInCdata="eof-in-cdata",e.absenceOfDigitsInNumericCharacterReference="absence-of-digits-in-numeric-character-reference",e.nullCharacterReference="null-character-reference",e.surrogateCharacterReference="surrogate-character-reference",e.characterReferenceOutsideUnicodeRange="character-reference-outside-unicode-range",e.controlCharacterReference="control-character-reference",e.noncharacterCharacterReference="noncharacter-character-reference",e.missingWhitespaceBeforeDoctypeName="missing-whitespace-before-doctype-name",e.missingDoctypeName="missing-doctype-name",e.invalidCharacterSequenceAfterDoctypeName="invalid-character-sequence-after-doctype-name",e.duplicateAttribute="duplicate-attribute",e.nonConformingDoctype="non-conforming-doctype",e.missingDoctype="missing-doctype",e.misplacedDoctype="misplaced-doctype",e.endTagWithoutMatchingOpenElement="end-tag-without-matching-open-element",e.closingOfElementWithOpenChildElements="closing-of-element-with-open-child-elements",e.disallowedContentInNoscriptInHead="disallowed-content-in-noscript-in-head",e.openElementsLeftAfterEof="open-elements-left-after-eof",e.abandonedHeadElementChild="abandoned-head-element-child",e.misplacedStartTagForHeadElement="misplaced-start-tag-for-head-element",e.nestedNoscriptInHead="nested-noscript-in-head",e.eofInElementThatCanContainOnlyText="eof-in-element-that-can-contain-only-text"})(f||(f={}));const Mc=65536;class Hc{constructor(t){this.handler=t,this.html="",this.pos=-1,this.lastGapPos=-2,this.gapStack=[],this.skipNextNewLine=!1,this.lastChunkWritten=!1,this.endOfChunkHit=!1,this.bufferWaterline=Mc,this.isEol=!1,this.lineStartPos=0,this.droppedBufferSize=0,this.line=1,this.lastErrOffset=-1}get col(){return this.pos-this.lineStartPos+ +(this.lastGapPos!==this.pos)}get offset(){return this.droppedBufferSize+this.pos}getError(t,s){const{line:r,col:i,offset:n}=this,c=i+s,h=n+s;return{code:t,startLine:r,endLine:r,startCol:c,endCol:c,startOffset:h,endOffset:h}}_err(t){this.handler.onParseError&&this.lastErrOffset!==this.offset&&(this.lastErrOffset=this.offset,this.handler.onParseError(this.getError(t,0)))}_addGap(){this.gapStack.push(this.lastGapPos),this.lastGapPos=this.pos}_processSurrogate(t){if(this.pos!==this.html.length-1){const s=this.html.charCodeAt(this.pos+1);if(Dc(s))return this.pos++,this._addGap(),Pc(t,s)}else if(!this.lastChunkWritten)return this.endOfChunkHit=!0,o.EOF;return this._err(f.surrogateInInputStream),t}willDropParsedChunk(){return this.pos>this.bufferWaterline}dropParsedChunk(){this.willDropParsedChunk()&&(this.html=this.html.substring(this.pos),this.lineStartPos-=this.pos,this.droppedBufferSize+=this.pos,this.pos=0,this.lastGapPos=-2,this.gapStack.length=0)}write(t,s){this.html.length>0?this.html+=t:this.html=t,this.endOfChunkHit=!1,this.lastChunkWritten=s}insertHtmlAtCurrentPos(t){this.html=this.html.substring(0,this.pos+1)+t+this.html.substring(this.pos+1),this.endOfChunkHit=!1}startsWith(t,s){if(this.pos+t.length>this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,!1;if(s)return this.html.startsWith(t,this.pos);for(let r=0;r<t.length;r++)if((this.html.charCodeAt(this.pos+r)|32)!==t.charCodeAt(r))return!1;return!0}peek(t){const s=this.pos+t;if(s>=this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,o.EOF;const r=this.html.charCodeAt(s);return r===o.CARRIAGE_RETURN?o.LINE_FEED:r}advance(){if(this.pos++,this.isEol&&(this.isEol=!1,this.line++,this.lineStartPos=this.pos),this.pos>=this.html.length)return this.endOfChunkHit=!this.lastChunkWritten,o.EOF;let t=this.html.charCodeAt(this.pos);return t===o.CARRIAGE_RETURN?(this.isEol=!0,this.skipNextNewLine=!0,o.LINE_FEED):t===o.LINE_FEED&&(this.isEol=!0,this.skipNextNewLine)?(this.line--,this.skipNextNewLine=!1,this._addGap(),this.advance()):(this.skipNextNewLine=!1,Pn(t)&&(t=this._processSurrogate(t)),this.handler.onParseError===null||t>31&&t<127||t===o.LINE_FEED||t===o.CARRIAGE_RETURN||t>159&&t<64976||this._checkForProblematicCharacters(t),t)}_checkForProblematicCharacters(t){Mn(t)?this._err(f.controlCharacterInInputStream):Hn(t)&&this._err(f.noncharacterInInputStream)}retreat(t){for(this.pos-=t;this.pos<this.lastGapPos;)this.lastGapPos=this.gapStack.pop(),this.pos--;this.isEol=!1}}var O;(function(e){e[e.CHARACTER=0]="CHARACTER",e[e.NULL_CHARACTER=1]="NULL_CHARACTER",e[e.WHITESPACE_CHARACTER=2]="WHITESPACE_CHARACTER",e[e.START_TAG=3]="START_TAG",e[e.END_TAG=4]="END_TAG",e[e.COMMENT=5]="COMMENT",e[e.DOCTYPE=6]="DOCTYPE",e[e.EOF=7]="EOF",e[e.HIBERNATION=8]="HIBERNATION"})(O||(O={}));function Bn(e,t){for(let s=e.attrs.length-1;s>=0;s--)if(e.attrs[s].name===t)return e.attrs[s].value;return null}const Bc=new Uint16Array('ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map(e=>e.charCodeAt(0))),Fc=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]);function Uc(e){var t;return e>=55296&&e<=57343||e>1114111?65533:(t=Fc.get(e))!==null&&t!==void 0?t:e}var V;(function(e){e[e.NUM=35]="NUM",e[e.SEMI=59]="SEMI",e[e.EQUALS=61]="EQUALS",e[e.ZERO=48]="ZERO",e[e.NINE=57]="NINE",e[e.LOWER_A=97]="LOWER_A",e[e.LOWER_F=102]="LOWER_F",e[e.LOWER_X=120]="LOWER_X",e[e.LOWER_Z=122]="LOWER_Z",e[e.UPPER_A=65]="UPPER_A",e[e.UPPER_F=70]="UPPER_F",e[e.UPPER_Z=90]="UPPER_Z"})(V||(V={}));const $c=32;var Fe;(function(e){e[e.VALUE_LENGTH=49152]="VALUE_LENGTH",e[e.BRANCH_LENGTH=16256]="BRANCH_LENGTH",e[e.JUMP_TABLE=127]="JUMP_TABLE"})(Fe||(Fe={}));function Pa(e){return e>=V.ZERO&&e<=V.NINE}function jc(e){return e>=V.UPPER_A&&e<=V.UPPER_F||e>=V.LOWER_A&&e<=V.LOWER_F}function zc(e){return e>=V.UPPER_A&&e<=V.UPPER_Z||e>=V.LOWER_A&&e<=V.LOWER_Z||Pa(e)}function Kc(e){return e===V.EQUALS||zc(e)}var G;(function(e){e[e.EntityStart=0]="EntityStart",e[e.NumericStart=1]="NumericStart",e[e.NumericDecimal=2]="NumericDecimal",e[e.NumericHex=3]="NumericHex",e[e.NamedEntity=4]="NamedEntity"})(G||(G={}));var Ce;(function(e){e[e.Legacy=0]="Legacy",e[e.Strict=1]="Strict",e[e.Attribute=2]="Attribute"})(Ce||(Ce={}));class Yc{constructor(t,s,r){this.decodeTree=t,this.emitCodePoint=s,this.errors=r,this.state=G.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=Ce.Strict}startEntity(t){this.decodeMode=t,this.state=G.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(t,s){switch(this.state){case G.EntityStart:return t.charCodeAt(s)===V.NUM?(this.state=G.NumericStart,this.consumed+=1,this.stateNumericStart(t,s+1)):(this.state=G.NamedEntity,this.stateNamedEntity(t,s));case G.NumericStart:return this.stateNumericStart(t,s);case G.NumericDecimal:return this.stateNumericDecimal(t,s);case G.NumericHex:return this.stateNumericHex(t,s);case G.NamedEntity:return this.stateNamedEntity(t,s)}}stateNumericStart(t,s){return s>=t.length?-1:(t.charCodeAt(s)|$c)===V.LOWER_X?(this.state=G.NumericHex,this.consumed+=1,this.stateNumericHex(t,s+1)):(this.state=G.NumericDecimal,this.stateNumericDecimal(t,s))}addToNumericResult(t,s,r,i){if(s!==r){const n=r-s;this.result=this.result*Math.pow(i,n)+Number.parseInt(t.substr(s,n),i),this.consumed+=n}}stateNumericHex(t,s){const r=s;for(;s<t.length;){const i=t.charCodeAt(s);if(Pa(i)||jc(i))s+=1;else return this.addToNumericResult(t,r,s,16),this.emitNumericEntity(i,3)}return this.addToNumericResult(t,r,s,16),-1}stateNumericDecimal(t,s){const r=s;for(;s<t.length;){const i=t.charCodeAt(s);if(Pa(i))s+=1;else return this.addToNumericResult(t,r,s,10),this.emitNumericEntity(i,2)}return this.addToNumericResult(t,r,s,10),-1}emitNumericEntity(t,s){var r;if(this.consumed<=s)return(r=this.errors)===null||r===void 0||r.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(t===V.SEMI)this.consumed+=1;else if(this.decodeMode===Ce.Strict)return 0;return this.emitCodePoint(Uc(this.result),this.consumed),this.errors&&(t!==V.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(t,s){const{decodeTree:r}=this;let i=r[this.treeIndex],n=(i&Fe.VALUE_LENGTH)>>14;for(;s<t.length;s++,this.excess++){const c=t.charCodeAt(s);if(this.treeIndex=Wc(r,i,this.treeIndex+Math.max(1,n),c),this.treeIndex<0)return this.result===0||this.decodeMode===Ce.Attribute&&(n===0||Kc(c))?0:this.emitNotTerminatedNamedEntity();if(i=r[this.treeIndex],n=(i&Fe.VALUE_LENGTH)>>14,n!==0){if(c===V.SEMI)return this.emitNamedEntityData(this.treeIndex,n,this.consumed+this.excess);this.decodeMode!==Ce.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var t;const{result:s,decodeTree:r}=this,i=(r[s]&Fe.VALUE_LENGTH)>>14;return this.emitNamedEntityData(s,i,this.consumed),(t=this.errors)===null||t===void 0||t.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(t,s,r){const{decodeTree:i}=this;return this.emitCodePoint(s===1?i[t]&~Fe.VALUE_LENGTH:i[t+1],r),s===3&&this.emitCodePoint(i[t+2],r),r}end(){var t;switch(this.state){case G.NamedEntity:return this.result!==0&&(this.decodeMode!==Ce.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case G.NumericDecimal:return this.emitNumericEntity(0,2);case G.NumericHex:return this.emitNumericEntity(0,3);case G.NumericStart:return(t=this.errors)===null||t===void 0||t.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case G.EntityStart:return 0}}}function Wc(e,t,s,r){const i=(t&Fe.BRANCH_LENGTH)>>7,n=t&Fe.JUMP_TABLE;if(i===0)return n!==0&&r===n?s:-1;if(n){const d=r-n;return d<0||d>=i?-1:e[s+d]-1}let c=s,h=c+i-1;for(;c<=h;){const d=c+h>>>1,p=e[d];if(p<r)c=d+1;else if(p>r)h=d-1;else return e[d+i]}return-1}var E;(function(e){e.HTML="http://www.w3.org/1999/xhtml",e.MATHML="http://www.w3.org/1998/Math/MathML",e.SVG="http://www.w3.org/2000/svg",e.XLINK="http://www.w3.org/1999/xlink",e.XML="http://www.w3.org/XML/1998/namespace",e.XMLNS="http://www.w3.org/2000/xmlns/"})(E||(E={}));var tt;(function(e){e.TYPE="type",e.ACTION="action",e.ENCODING="encoding",e.PROMPT="prompt",e.NAME="name",e.COLOR="color",e.FACE="face",e.SIZE="size"})(tt||(tt={}));var he;(function(e){e.NO_QUIRKS="no-quirks",e.QUIRKS="quirks",e.LIMITED_QUIRKS="limited-quirks"})(he||(he={}));var m;(function(e){e.A="a",e.ADDRESS="address",e.ANNOTATION_XML="annotation-xml",e.APPLET="applet",e.AREA="area",e.ARTICLE="article",e.ASIDE="aside",e.B="b",e.BASE="base",e.BASEFONT="basefont",e.BGSOUND="bgsound",e.BIG="big",e.BLOCKQUOTE="blockquote",e.BODY="body",e.BR="br",e.BUTTON="button",e.CAPTION="caption",e.CENTER="center",e.CODE="code",e.COL="col",e.COLGROUP="colgroup",e.DD="dd",e.DESC="desc",e.DETAILS="details",e.DIALOG="dialog",e.DIR="dir",e.DIV="div",e.DL="dl",e.DT="dt",e.EM="em",e.EMBED="embed",e.FIELDSET="fieldset",e.FIGCAPTION="figcaption",e.FIGURE="figure",e.FONT="font",e.FOOTER="footer",e.FOREIGN_OBJECT="foreignObject",e.FORM="form",e.FRAME="frame",e.FRAMESET="frameset",e.H1="h1",e.H2="h2",e.H3="h3",e.H4="h4",e.H5="h5",e.H6="h6",e.HEAD="head",e.HEADER="header",e.HGROUP="hgroup",e.HR="hr",e.HTML="html",e.I="i",e.IMG="img",e.IMAGE="image",e.INPUT="input",e.IFRAME="iframe",e.KEYGEN="keygen",e.LABEL="label",e.LI="li",e.LINK="link",e.LISTING="listing",e.MAIN="main",e.MALIGNMARK="malignmark",e.MARQUEE="marquee",e.MATH="math",e.MENU="menu",e.META="meta",e.MGLYPH="mglyph",e.MI="mi",e.MO="mo",e.MN="mn",e.MS="ms",e.MTEXT="mtext",e.NAV="nav",e.NOBR="nobr",e.NOFRAMES="noframes",e.NOEMBED="noembed",e.NOSCRIPT="noscript",e.OBJECT="object",e.OL="ol",e.OPTGROUP="optgroup",e.OPTION="option",e.P="p",e.PARAM="param",e.PLAINTEXT="plaintext",e.PRE="pre",e.RB="rb",e.RP="rp",e.RT="rt",e.RTC="rtc",e.RUBY="ruby",e.S="s",e.SCRIPT="script",e.SEARCH="search",e.SECTION="section",e.SELECT="select",e.SOURCE="source",e.SMALL="small",e.SPAN="span",e.STRIKE="strike",e.STRONG="strong",e.STYLE="style",e.SUB="sub",e.SUMMARY="summary",e.SUP="sup",e.TABLE="table",e.TBODY="tbody",e.TEMPLATE="template",e.TEXTAREA="textarea",e.TFOOT="tfoot",e.TD="td",e.TH="th",e.THEAD="thead",e.TITLE="title",e.TR="tr",e.TRACK="track",e.TT="tt",e.U="u",e.UL="ul",e.SVG="svg",e.VAR="var",e.WBR="wbr",e.XMP="xmp"})(m||(m={}));var a;(function(e){e[e.UNKNOWN=0]="UNKNOWN",e[e.A=1]="A",e[e.ADDRESS=2]="ADDRESS",e[e.ANNOTATION_XML=3]="ANNOTATION_XML",e[e.APPLET=4]="APPLET",e[e.AREA=5]="AREA",e[e.ARTICLE=6]="ARTICLE",e[e.ASIDE=7]="ASIDE",e[e.B=8]="B",e[e.BASE=9]="BASE",e[e.BASEFONT=10]="BASEFONT",e[e.BGSOUND=11]="BGSOUND",e[e.BIG=12]="BIG",e[e.BLOCKQUOTE=13]="BLOCKQUOTE",e[e.BODY=14]="BODY",e[e.BR=15]="BR",e[e.BUTTON=16]="BUTTON",e[e.CAPTION=17]="CAPTION",e[e.CENTER=18]="CENTER",e[e.CODE=19]="CODE",e[e.COL=20]="COL",e[e.COLGROUP=21]="COLGROUP",e[e.DD=22]="DD",e[e.DESC=23]="DESC",e[e.DETAILS=24]="DETAILS",e[e.DIALOG=25]="DIALOG",e[e.DIR=26]="DIR",e[e.DIV=27]="DIV",e[e.DL=28]="DL",e[e.DT=29]="DT",e[e.EM=30]="EM",e[e.EMBED=31]="EMBED",e[e.FIELDSET=32]="FIELDSET",e[e.FIGCAPTION=33]="FIGCAPTION",e[e.FIGURE=34]="FIGURE",e[e.FONT=35]="FONT",e[e.FOOTER=36]="FOOTER",e[e.FOREIGN_OBJECT=37]="FOREIGN_OBJECT",e[e.FORM=38]="FORM",e[e.FRAME=39]="FRAME",e[e.FRAMESET=40]="FRAMESET",e[e.H1=41]="H1",e[e.H2=42]="H2",e[e.H3=43]="H3",e[e.H4=44]="H4",e[e.H5=45]="H5",e[e.H6=46]="H6",e[e.HEAD=47]="HEAD",e[e.HEADER=48]="HEADER",e[e.HGROUP=49]="HGROUP",e[e.HR=50]="HR",e[e.HTML=51]="HTML",e[e.I=52]="I",e[e.IMG=53]="IMG",e[e.IMAGE=54]="IMAGE",e[e.INPUT=55]="INPUT",e[e.IFRAME=56]="IFRAME",e[e.KEYGEN=57]="KEYGEN",e[e.LABEL=58]="LABEL",e[e.LI=59]="LI",e[e.LINK=60]="LINK",e[e.LISTING=61]="LISTING",e[e.MAIN=62]="MAIN",e[e.MALIGNMARK=63]="MALIGNMARK",e[e.MARQUEE=64]="MARQUEE",e[e.MATH=65]="MATH",e[e.MENU=66]="MENU",e[e.META=67]="META",e[e.MGLYPH=68]="MGLYPH",e[e.MI=69]="MI",e[e.MO=70]="MO",e[e.MN=71]="MN",e[e.MS=72]="MS",e[e.MTEXT=73]="MTEXT",e[e.NAV=74]="NAV",e[e.NOBR=75]="NOBR",e[e.NOFRAMES=76]="NOFRAMES",e[e.NOEMBED=77]="NOEMBED",e[e.NOSCRIPT=78]="NOSCRIPT",e[e.OBJECT=79]="OBJECT",e[e.OL=80]="OL",e[e.OPTGROUP=81]="OPTGROUP",e[e.OPTION=82]="OPTION",e[e.P=83]="P",e[e.PARAM=84]="PARAM",e[e.PLAINTEXT=85]="PLAINTEXT",e[e.PRE=86]="PRE",e[e.RB=87]="RB",e[e.RP=88]="RP",e[e.RT=89]="RT",e[e.RTC=90]="RTC",e[e.RUBY=91]="RUBY",e[e.S=92]="S",e[e.SCRIPT=93]="SCRIPT",e[e.SEARCH=94]="SEARCH",e[e.SECTION=95]="SECTION",e[e.SELECT=96]="SELECT",e[e.SOURCE=97]="SOURCE",e[e.SMALL=98]="SMALL",e[e.SPAN=99]="SPAN",e[e.STRIKE=100]="STRIKE",e[e.STRONG=101]="STRONG",e[e.STYLE=102]="STYLE",e[e.SUB=103]="SUB",e[e.SUMMARY=104]="SUMMARY",e[e.SUP=105]="SUP",e[e.TABLE=106]="TABLE",e[e.TBODY=107]="TBODY",e[e.TEMPLATE=108]="TEMPLATE",e[e.TEXTAREA=109]="TEXTAREA",e[e.TFOOT=110]="TFOOT",e[e.TD=111]="TD",e[e.TH=112]="TH",e[e.THEAD=113]="THEAD",e[e.TITLE=114]="TITLE",e[e.TR=115]="TR",e[e.TRACK=116]="TRACK",e[e.TT=117]="TT",e[e.U=118]="U",e[e.UL=119]="UL",e[e.SVG=120]="SVG",e[e.VAR=121]="VAR",e[e.WBR=122]="WBR",e[e.XMP=123]="XMP"})(a||(a={}));const qc=new Map([[m.A,a.A],[m.ADDRESS,a.ADDRESS],[m.ANNOTATION_XML,a.ANNOTATION_XML],[m.APPLET,a.APPLET],[m.AREA,a.AREA],[m.ARTICLE,a.ARTICLE],[m.ASIDE,a.ASIDE],[m.B,a.B],[m.BASE,a.BASE],[m.BASEFONT,a.BASEFONT],[m.BGSOUND,a.BGSOUND],[m.BIG,a.BIG],[m.BLOCKQUOTE,a.BLOCKQUOTE],[m.BODY,a.BODY],[m.BR,a.BR],[m.BUTTON,a.BUTTON],[m.CAPTION,a.CAPTION],[m.CENTER,a.CENTER],[m.CODE,a.CODE],[m.COL,a.COL],[m.COLGROUP,a.COLGROUP],[m.DD,a.DD],[m.DESC,a.DESC],[m.DETAILS,a.DETAILS],[m.DIALOG,a.DIALOG],[m.DIR,a.DIR],[m.DIV,a.DIV],[m.DL,a.DL],[m.DT,a.DT],[m.EM,a.EM],[m.EMBED,a.EMBED],[m.FIELDSET,a.FIELDSET],[m.FIGCAPTION,a.FIGCAPTION],[m.FIGURE,a.FIGURE],[m.FONT,a.FONT],[m.FOOTER,a.FOOTER],[m.FOREIGN_OBJECT,a.FOREIGN_OBJECT],[m.FORM,a.FORM],[m.FRAME,a.FRAME],[m.FRAMESET,a.FRAMESET],[m.H1,a.H1],[m.H2,a.H2],[m.H3,a.H3],[m.H4,a.H4],[m.H5,a.H5],[m.H6,a.H6],[m.HEAD,a.HEAD],[m.HEADER,a.HEADER],[m.HGROUP,a.HGROUP],[m.HR,a.HR],[m.HTML,a.HTML],[m.I,a.I],[m.IMG,a.IMG],[m.IMAGE,a.IMAGE],[m.INPUT,a.INPUT],[m.IFRAME,a.IFRAME],[m.KEYGEN,a.KEYGEN],[m.LABEL,a.LABEL],[m.LI,a.LI],[m.LINK,a.LINK],[m.LISTING,a.LISTING],[m.MAIN,a.MAIN],[m.MALIGNMARK,a.MALIGNMARK],[m.MARQUEE,a.MARQUEE],[m.MATH,a.MATH],[m.MENU,a.MENU],[m.META,a.META],[m.MGLYPH,a.MGLYPH],[m.MI,a.MI],[m.MO,a.MO],[m.MN,a.MN],[m.MS,a.MS],[m.MTEXT,a.MTEXT],[m.NAV,a.NAV],[m.NOBR,a.NOBR],[m.NOFRAMES,a.NOFRAMES],[m.NOEMBED,a.NOEMBED],[m.NOSCRIPT,a.NOSCRIPT],[m.OBJECT,a.OBJECT],[m.OL,a.OL],[m.OPTGROUP,a.OPTGROUP],[m.OPTION,a.OPTION],[m.P,a.P],[m.PARAM,a.PARAM],[m.PLAINTEXT,a.PLAINTEXT],[m.PRE,a.PRE],[m.RB,a.RB],[m.RP,a.RP],[m.RT,a.RT],[m.RTC,a.RTC],[m.RUBY,a.RUBY],[m.S,a.S],[m.SCRIPT,a.SCRIPT],[m.SEARCH,a.SEARCH],[m.SECTION,a.SECTION],[m.SELECT,a.SELECT],[m.SOURCE,a.SOURCE],[m.SMALL,a.SMALL],[m.SPAN,a.SPAN],[m.STRIKE,a.STRIKE],[m.STRONG,a.STRONG],[m.STYLE,a.STYLE],[m.SUB,a.SUB],[m.SUMMARY,a.SUMMARY],[m.SUP,a.SUP],[m.TABLE,a.TABLE],[m.TBODY,a.TBODY],[m.TEMPLATE,a.TEMPLATE],[m.TEXTAREA,a.TEXTAREA],[m.TFOOT,a.TFOOT],[m.TD,a.TD],[m.TH,a.TH],[m.THEAD,a.THEAD],[m.TITLE,a.TITLE],[m.TR,a.TR],[m.TRACK,a.TRACK],[m.TT,a.TT],[m.U,a.U],[m.UL,a.UL],[m.SVG,a.SVG],[m.VAR,a.VAR],[m.WBR,a.WBR],[m.XMP,a.XMP]]);function ha(e){var t;return(t=qc.get(e))!==null&&t!==void 0?t:a.UNKNOWN}const T=a,Gc={[E.HTML]:new Set([T.ADDRESS,T.APPLET,T.AREA,T.ARTICLE,T.ASIDE,T.BASE,T.BASEFONT,T.BGSOUND,T.BLOCKQUOTE,T.BODY,T.BR,T.BUTTON,T.CAPTION,T.CENTER,T.COL,T.COLGROUP,T.DD,T.DETAILS,T.DIR,T.DIV,T.DL,T.DT,T.EMBED,T.FIELDSET,T.FIGCAPTION,T.FIGURE,T.FOOTER,T.FORM,T.FRAME,T.FRAMESET,T.H1,T.H2,T.H3,T.H4,T.H5,T.H6,T.HEAD,T.HEADER,T.HGROUP,T.HR,T.HTML,T.IFRAME,T.IMG,T.INPUT,T.LI,T.LINK,T.LISTING,T.MAIN,T.MARQUEE,T.MENU,T.META,T.NAV,T.NOEMBED,T.NOFRAMES,T.NOSCRIPT,T.OBJECT,T.OL,T.P,T.PARAM,T.PLAINTEXT,T.PRE,T.SCRIPT,T.SECTION,T.SELECT,T.SOURCE,T.STYLE,T.SUMMARY,T.TABLE,T.TBODY,T.TD,T.TEMPLATE,T.TEXTAREA,T.TFOOT,T.TH,T.THEAD,T.TITLE,T.TR,T.TRACK,T.UL,T.WBR,T.XMP]),[E.MATHML]:new Set([T.MI,T.MO,T.MN,T.MS,T.MTEXT,T.ANNOTATION_XML]),[E.SVG]:new Set([T.TITLE,T.FOREIGN_OBJECT,T.DESC]),[E.XLINK]:new Set,[E.XML]:new Set,[E.XMLNS]:new Set},Ma=new Set([T.H1,T.H2,T.H3,T.H4,T.H5,T.H6]);m.STYLE,m.SCRIPT,m.XMP,m.IFRAME,m.NOEMBED,m.NOFRAMES,m.PLAINTEXT;var u;(function(e){e[e.DATA=0]="DATA",e[e.RCDATA=1]="RCDATA",e[e.RAWTEXT=2]="RAWTEXT",e[e.SCRIPT_DATA=3]="SCRIPT_DATA",e[e.PLAINTEXT=4]="PLAINTEXT",e[e.TAG_OPEN=5]="TAG_OPEN",e[e.END_TAG_OPEN=6]="END_TAG_OPEN",e[e.TAG_NAME=7]="TAG_NAME",e[e.RCDATA_LESS_THAN_SIGN=8]="RCDATA_LESS_THAN_SIGN",e[e.RCDATA_END_TAG_OPEN=9]="RCDATA_END_TAG_OPEN",e[e.RCDATA_END_TAG_NAME=10]="RCDATA_END_TAG_NAME",e[e.RAWTEXT_LESS_THAN_SIGN=11]="RAWTEXT_LESS_THAN_SIGN",e[e.RAWTEXT_END_TAG_OPEN=12]="RAWTEXT_END_TAG_OPEN",e[e.RAWTEXT_END_TAG_NAME=13]="RAWTEXT_END_TAG_NAME",e[e.SCRIPT_DATA_LESS_THAN_SIGN=14]="SCRIPT_DATA_LESS_THAN_SIGN",e[e.SCRIPT_DATA_END_TAG_OPEN=15]="SCRIPT_DATA_END_TAG_OPEN",e[e.SCRIPT_DATA_END_TAG_NAME=16]="SCRIPT_DATA_END_TAG_NAME",e[e.SCRIPT_DATA_ESCAPE_START=17]="SCRIPT_DATA_ESCAPE_START",e[e.SCRIPT_DATA_ESCAPE_START_DASH=18]="SCRIPT_DATA_ESCAPE_START_DASH",e[e.SCRIPT_DATA_ESCAPED=19]="SCRIPT_DATA_ESCAPED",e[e.SCRIPT_DATA_ESCAPED_DASH=20]="SCRIPT_DATA_ESCAPED_DASH",e[e.SCRIPT_DATA_ESCAPED_DASH_DASH=21]="SCRIPT_DATA_ESCAPED_DASH_DASH",e[e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN=22]="SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN",e[e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN=23]="SCRIPT_DATA_ESCAPED_END_TAG_OPEN",e[e.SCRIPT_DATA_ESCAPED_END_TAG_NAME=24]="SCRIPT_DATA_ESCAPED_END_TAG_NAME",e[e.SCRIPT_DATA_DOUBLE_ESCAPE_START=25]="SCRIPT_DATA_DOUBLE_ESCAPE_START",e[e.SCRIPT_DATA_DOUBLE_ESCAPED=26]="SCRIPT_DATA_DOUBLE_ESCAPED",e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH=27]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH",e[e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH=28]="SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH",e[e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN=29]="SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN",e[e.SCRIPT_DATA_DOUBLE_ESCAPE_END=30]="SCRIPT_DATA_DOUBLE_ESCAPE_END",e[e.BEFORE_ATTRIBUTE_NAME=31]="BEFORE_ATTRIBUTE_NAME",e[e.ATTRIBUTE_NAME=32]="ATTRIBUTE_NAME",e[e.AFTER_ATTRIBUTE_NAME=33]="AFTER_ATTRIBUTE_NAME",e[e.BEFORE_ATTRIBUTE_VALUE=34]="BEFORE_ATTRIBUTE_VALUE",e[e.ATTRIBUTE_VALUE_DOUBLE_QUOTED=35]="ATTRIBUTE_VALUE_DOUBLE_QUOTED",e[e.ATTRIBUTE_VALUE_SINGLE_QUOTED=36]="ATTRIBUTE_VALUE_SINGLE_QUOTED",e[e.ATTRIBUTE_VALUE_UNQUOTED=37]="ATTRIBUTE_VALUE_UNQUOTED",e[e.AFTER_ATTRIBUTE_VALUE_QUOTED=38]="AFTER_ATTRIBUTE_VALUE_QUOTED",e[e.SELF_CLOSING_START_TAG=39]="SELF_CLOSING_START_TAG",e[e.BOGUS_COMMENT=40]="BOGUS_COMMENT",e[e.MARKUP_DECLARATION_OPEN=41]="MARKUP_DECLARATION_OPEN",e[e.COMMENT_START=42]="COMMENT_START",e[e.COMMENT_START_DASH=43]="COMMENT_START_DASH",e[e.COMMENT=44]="COMMENT",e[e.COMMENT_LESS_THAN_SIGN=45]="COMMENT_LESS_THAN_SIGN",e[e.COMMENT_LESS_THAN_SIGN_BANG=46]="COMMENT_LESS_THAN_SIGN_BANG",e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH=47]="COMMENT_LESS_THAN_SIGN_BANG_DASH",e[e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH=48]="COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH",e[e.COMMENT_END_DASH=49]="COMMENT_END_DASH",e[e.COMMENT_END=50]="COMMENT_END",e[e.COMMENT_END_BANG=51]="COMMENT_END_BANG",e[e.DOCTYPE=52]="DOCTYPE",e[e.BEFORE_DOCTYPE_NAME=53]="BEFORE_DOCTYPE_NAME",e[e.DOCTYPE_NAME=54]="DOCTYPE_NAME",e[e.AFTER_DOCTYPE_NAME=55]="AFTER_DOCTYPE_NAME",e[e.AFTER_DOCTYPE_PUBLIC_KEYWORD=56]="AFTER_DOCTYPE_PUBLIC_KEYWORD",e[e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER=57]="BEFORE_DOCTYPE_PUBLIC_IDENTIFIER",e[e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED=58]="DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED",e[e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED=59]="DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED",e[e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER=60]="AFTER_DOCTYPE_PUBLIC_IDENTIFIER",e[e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS=61]="BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS",e[e.AFTER_DOCTYPE_SYSTEM_KEYWORD=62]="AFTER_DOCTYPE_SYSTEM_KEYWORD",e[e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER=63]="BEFORE_DOCTYPE_SYSTEM_IDENTIFIER",e[e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED=64]="DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED",e[e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED=65]="DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED",e[e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER=66]="AFTER_DOCTYPE_SYSTEM_IDENTIFIER",e[e.BOGUS_DOCTYPE=67]="BOGUS_DOCTYPE",e[e.CDATA_SECTION=68]="CDATA_SECTION",e[e.CDATA_SECTION_BRACKET=69]="CDATA_SECTION_BRACKET",e[e.CDATA_SECTION_END=70]="CDATA_SECTION_END",e[e.CHARACTER_REFERENCE=71]="CHARACTER_REFERENCE",e[e.AMBIGUOUS_AMPERSAND=72]="AMBIGUOUS_AMPERSAND"})(u||(u={}));const ne={DATA:u.DATA,RCDATA:u.RCDATA,RAWTEXT:u.RAWTEXT,SCRIPT_DATA:u.SCRIPT_DATA,PLAINTEXT:u.PLAINTEXT,CDATA_SECTION:u.CDATA_SECTION};function Vc(e){return e>=o.DIGIT_0&&e<=o.DIGIT_9}function Lt(e){return e>=o.LATIN_CAPITAL_A&&e<=o.LATIN_CAPITAL_Z}function Qc(e){return e>=o.LATIN_SMALL_A&&e<=o.LATIN_SMALL_Z}function Le(e){return Qc(e)||Lt(e)}function Mi(e){return Le(e)||Vc(e)}function ds(e){return e+32}function Fn(e){return e===o.SPACE||e===o.LINE_FEED||e===o.TABULATION||e===o.FORM_FEED}function Hi(e){return Fn(e)||e===o.SOLIDUS||e===o.GREATER_THAN_SIGN}function Xc(e){return e===o.NULL?f.nullCharacterReference:e>1114111?f.characterReferenceOutsideUnicodeRange:Pn(e)?f.surrogateCharacterReference:Hn(e)?f.noncharacterCharacterReference:Mn(e)||e===o.CARRIAGE_RETURN?f.controlCharacterReference:null}class Jc{constructor(t,s){this.options=t,this.handler=s,this.paused=!1,this.inLoop=!1,this.inForeignNode=!1,this.lastStartTagName="",this.active=!1,this.state=u.DATA,this.returnState=u.DATA,this.entityStartPos=0,this.consumedAfterSnapshot=-1,this.currentCharacterToken=null,this.currentToken=null,this.currentAttr={name:"",value:""},this.preprocessor=new Hc(s),this.currentLocation=this.getCurrentLocation(-1),this.entityDecoder=new Yc(Bc,(r,i)=>{this.preprocessor.pos=this.entityStartPos+i-1,this._flushCodePointConsumedAsCharacterReference(r)},s.onParseError?{missingSemicolonAfterCharacterReference:()=>{this._err(f.missingSemicolonAfterCharacterReference,1)},absenceOfDigitsInNumericCharacterReference:r=>{this._err(f.absenceOfDigitsInNumericCharacterReference,this.entityStartPos-this.preprocessor.pos+r)},validateNumericCharacterReference:r=>{const i=Xc(r);i&&this._err(i,1)}}:void 0)}_err(t,s=0){var r,i;(i=(r=this.handler).onParseError)===null||i===void 0||i.call(r,this.preprocessor.getError(t,s))}getCurrentLocation(t){return this.options.sourceCodeLocationInfo?{startLine:this.preprocessor.line,startCol:this.preprocessor.col-t,startOffset:this.preprocessor.offset-t,endLine:-1,endCol:-1,endOffset:-1}:null}_runParsingLoop(){if(!this.inLoop){for(this.inLoop=!0;this.active&&!this.paused;){this.consumedAfterSnapshot=0;const t=this._consume();this._ensureHibernation()||this._callState(t)}this.inLoop=!1}}pause(){this.paused=!0}resume(t){if(!this.paused)throw new Error("Parser was already resumed");this.paused=!1,!this.inLoop&&(this._runParsingLoop(),this.paused||t==null||t())}write(t,s,r){this.active=!0,this.preprocessor.write(t,s),this._runParsingLoop(),this.paused||r==null||r()}insertHtmlAtCurrentPos(t){this.active=!0,this.preprocessor.insertHtmlAtCurrentPos(t),this._runParsingLoop()}_ensureHibernation(){return this.preprocessor.endOfChunkHit?(this.preprocessor.retreat(this.consumedAfterSnapshot),this.consumedAfterSnapshot=0,this.active=!1,!0):!1}_consume(){return this.consumedAfterSnapshot++,this.preprocessor.advance()}_advanceBy(t){this.consumedAfterSnapshot+=t;for(let s=0;s<t;s++)this.preprocessor.advance()}_consumeSequenceIfMatch(t,s){return this.preprocessor.startsWith(t,s)?(this._advanceBy(t.length-1),!0):!1}_createStartTagToken(){this.currentToken={type:O.START_TAG,tagName:"",tagID:a.UNKNOWN,selfClosing:!1,ackSelfClosing:!1,attrs:[],location:this.getCurrentLocation(1)}}_createEndTagToken(){this.currentToken={type:O.END_TAG,tagName:"",tagID:a.UNKNOWN,selfClosing:!1,ackSelfClosing:!1,attrs:[],location:this.getCurrentLocation(2)}}_createCommentToken(t){this.currentToken={type:O.COMMENT,data:"",location:this.getCurrentLocation(t)}}_createDoctypeToken(t){this.currentToken={type:O.DOCTYPE,name:t,forceQuirks:!1,publicId:null,systemId:null,location:this.currentLocation}}_createCharacterToken(t,s){this.currentCharacterToken={type:t,chars:s,location:this.currentLocation}}_createAttr(t){this.currentAttr={name:t,value:""},this.currentLocation=this.getCurrentLocation(0)}_leaveAttrName(){var t,s;const r=this.currentToken;if(Bn(r,this.currentAttr.name)===null){if(r.attrs.push(this.currentAttr),r.location&&this.currentLocation){const i=(t=(s=r.location).attrs)!==null&&t!==void 0?t:s.attrs=Object.create(null);i[this.currentAttr.name]=this.currentLocation,this._leaveAttrValue()}}else this._err(f.duplicateAttribute)}_leaveAttrValue(){this.currentLocation&&(this.currentLocation.endLine=this.preprocessor.line,this.currentLocation.endCol=this.preprocessor.col,this.currentLocation.endOffset=this.preprocessor.offset)}prepareToken(t){this._emitCurrentCharacterToken(t.location),this.currentToken=null,t.location&&(t.location.endLine=this.preprocessor.line,t.location.endCol=this.preprocessor.col+1,t.location.endOffset=this.preprocessor.offset+1),this.currentLocation=this.getCurrentLocation(-1)}emitCurrentTagToken(){const t=this.currentToken;this.prepareToken(t),t.tagID=ha(t.tagName),t.type===O.START_TAG?(this.lastStartTagName=t.tagName,this.handler.onStartTag(t)):(t.attrs.length>0&&this._err(f.endTagWithAttributes),t.selfClosing&&this._err(f.endTagWithTrailingSolidus),this.handler.onEndTag(t)),this.preprocessor.dropParsedChunk()}emitCurrentComment(t){this.prepareToken(t),this.handler.onComment(t),this.preprocessor.dropParsedChunk()}emitCurrentDoctype(t){this.prepareToken(t),this.handler.onDoctype(t),this.preprocessor.dropParsedChunk()}_emitCurrentCharacterToken(t){if(this.currentCharacterToken){switch(t&&this.currentCharacterToken.location&&(this.currentCharacterToken.location.endLine=t.startLine,this.currentCharacterToken.location.endCol=t.startCol,this.currentCharacterToken.location.endOffset=t.startOffset),this.currentCharacterToken.type){case O.CHARACTER:{this.handler.onCharacter(this.currentCharacterToken);break}case O.NULL_CHARACTER:{this.handler.onNullCharacter(this.currentCharacterToken);break}case O.WHITESPACE_CHARACTER:{this.handler.onWhitespaceCharacter(this.currentCharacterToken);break}}this.currentCharacterToken=null}}_emitEOFToken(){const t=this.getCurrentLocation(0);t&&(t.endLine=t.startLine,t.endCol=t.startCol,t.endOffset=t.startOffset),this._emitCurrentCharacterToken(t),this.handler.onEof({type:O.EOF,location:t}),this.active=!1}_appendCharToCurrentCharacterToken(t,s){if(this.currentCharacterToken)if(this.currentCharacterToken.type===t){this.currentCharacterToken.chars+=s;return}else this.currentLocation=this.getCurrentLocation(0),this._emitCurrentCharacterToken(this.currentLocation),this.preprocessor.dropParsedChunk();this._createCharacterToken(t,s)}_emitCodePoint(t){const s=Fn(t)?O.WHITESPACE_CHARACTER:t===o.NULL?O.NULL_CHARACTER:O.CHARACTER;this._appendCharToCurrentCharacterToken(s,String.fromCodePoint(t))}_emitChars(t){this._appendCharToCurrentCharacterToken(O.CHARACTER,t)}_startCharacterReference(){this.returnState=this.state,this.state=u.CHARACTER_REFERENCE,this.entityStartPos=this.preprocessor.pos,this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute()?Ce.Attribute:Ce.Legacy)}_isCharacterReferenceInAttribute(){return this.returnState===u.ATTRIBUTE_VALUE_DOUBLE_QUOTED||this.returnState===u.ATTRIBUTE_VALUE_SINGLE_QUOTED||this.returnState===u.ATTRIBUTE_VALUE_UNQUOTED}_flushCodePointConsumedAsCharacterReference(t){this._isCharacterReferenceInAttribute()?this.currentAttr.value+=String.fromCodePoint(t):this._emitCodePoint(t)}_callState(t){switch(this.state){case u.DATA:{this._stateData(t);break}case u.RCDATA:{this._stateRcdata(t);break}case u.RAWTEXT:{this._stateRawtext(t);break}case u.SCRIPT_DATA:{this._stateScriptData(t);break}case u.PLAINTEXT:{this._statePlaintext(t);break}case u.TAG_OPEN:{this._stateTagOpen(t);break}case u.END_TAG_OPEN:{this._stateEndTagOpen(t);break}case u.TAG_NAME:{this._stateTagName(t);break}case u.RCDATA_LESS_THAN_SIGN:{this._stateRcdataLessThanSign(t);break}case u.RCDATA_END_TAG_OPEN:{this._stateRcdataEndTagOpen(t);break}case u.RCDATA_END_TAG_NAME:{this._stateRcdataEndTagName(t);break}case u.RAWTEXT_LESS_THAN_SIGN:{this._stateRawtextLessThanSign(t);break}case u.RAWTEXT_END_TAG_OPEN:{this._stateRawtextEndTagOpen(t);break}case u.RAWTEXT_END_TAG_NAME:{this._stateRawtextEndTagName(t);break}case u.SCRIPT_DATA_LESS_THAN_SIGN:{this._stateScriptDataLessThanSign(t);break}case u.SCRIPT_DATA_END_TAG_OPEN:{this._stateScriptDataEndTagOpen(t);break}case u.SCRIPT_DATA_END_TAG_NAME:{this._stateScriptDataEndTagName(t);break}case u.SCRIPT_DATA_ESCAPE_START:{this._stateScriptDataEscapeStart(t);break}case u.SCRIPT_DATA_ESCAPE_START_DASH:{this._stateScriptDataEscapeStartDash(t);break}case u.SCRIPT_DATA_ESCAPED:{this._stateScriptDataEscaped(t);break}case u.SCRIPT_DATA_ESCAPED_DASH:{this._stateScriptDataEscapedDash(t);break}case u.SCRIPT_DATA_ESCAPED_DASH_DASH:{this._stateScriptDataEscapedDashDash(t);break}case u.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:{this._stateScriptDataEscapedLessThanSign(t);break}case u.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:{this._stateScriptDataEscapedEndTagOpen(t);break}case u.SCRIPT_DATA_ESCAPED_END_TAG_NAME:{this._stateScriptDataEscapedEndTagName(t);break}case u.SCRIPT_DATA_DOUBLE_ESCAPE_START:{this._stateScriptDataDoubleEscapeStart(t);break}case u.SCRIPT_DATA_DOUBLE_ESCAPED:{this._stateScriptDataDoubleEscaped(t);break}case u.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:{this._stateScriptDataDoubleEscapedDash(t);break}case u.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:{this._stateScriptDataDoubleEscapedDashDash(t);break}case u.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:{this._stateScriptDataDoubleEscapedLessThanSign(t);break}case u.SCRIPT_DATA_DOUBLE_ESCAPE_END:{this._stateScriptDataDoubleEscapeEnd(t);break}case u.BEFORE_ATTRIBUTE_NAME:{this._stateBeforeAttributeName(t);break}case u.ATTRIBUTE_NAME:{this._stateAttributeName(t);break}case u.AFTER_ATTRIBUTE_NAME:{this._stateAfterAttributeName(t);break}case u.BEFORE_ATTRIBUTE_VALUE:{this._stateBeforeAttributeValue(t);break}case u.ATTRIBUTE_VALUE_DOUBLE_QUOTED:{this._stateAttributeValueDoubleQuoted(t);break}case u.ATTRIBUTE_VALUE_SINGLE_QUOTED:{this._stateAttributeValueSingleQuoted(t);break}case u.ATTRIBUTE_VALUE_UNQUOTED:{this._stateAttributeValueUnquoted(t);break}case u.AFTER_ATTRIBUTE_VALUE_QUOTED:{this._stateAfterAttributeValueQuoted(t);break}case u.SELF_CLOSING_START_TAG:{this._stateSelfClosingStartTag(t);break}case u.BOGUS_COMMENT:{this._stateBogusComment(t);break}case u.MARKUP_DECLARATION_OPEN:{this._stateMarkupDeclarationOpen(t);break}case u.COMMENT_START:{this._stateCommentStart(t);break}case u.COMMENT_START_DASH:{this._stateCommentStartDash(t);break}case u.COMMENT:{this._stateComment(t);break}case u.COMMENT_LESS_THAN_SIGN:{this._stateCommentLessThanSign(t);break}case u.COMMENT_LESS_THAN_SIGN_BANG:{this._stateCommentLessThanSignBang(t);break}case u.COMMENT_LESS_THAN_SIGN_BANG_DASH:{this._stateCommentLessThanSignBangDash(t);break}case u.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:{this._stateCommentLessThanSignBangDashDash(t);break}case u.COMMENT_END_DASH:{this._stateCommentEndDash(t);break}case u.COMMENT_END:{this._stateCommentEnd(t);break}case u.COMMENT_END_BANG:{this._stateCommentEndBang(t);break}case u.DOCTYPE:{this._stateDoctype(t);break}case u.BEFORE_DOCTYPE_NAME:{this._stateBeforeDoctypeName(t);break}case u.DOCTYPE_NAME:{this._stateDoctypeName(t);break}case u.AFTER_DOCTYPE_NAME:{this._stateAfterDoctypeName(t);break}case u.AFTER_DOCTYPE_PUBLIC_KEYWORD:{this._stateAfterDoctypePublicKeyword(t);break}case u.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:{this._stateBeforeDoctypePublicIdentifier(t);break}case u.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:{this._stateDoctypePublicIdentifierDoubleQuoted(t);break}case u.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:{this._stateDoctypePublicIdentifierSingleQuoted(t);break}case u.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:{this._stateAfterDoctypePublicIdentifier(t);break}case u.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:{this._stateBetweenDoctypePublicAndSystemIdentifiers(t);break}case u.AFTER_DOCTYPE_SYSTEM_KEYWORD:{this._stateAfterDoctypeSystemKeyword(t);break}case u.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:{this._stateBeforeDoctypeSystemIdentifier(t);break}case u.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:{this._stateDoctypeSystemIdentifierDoubleQuoted(t);break}case u.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:{this._stateDoctypeSystemIdentifierSingleQuoted(t);break}case u.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:{this._stateAfterDoctypeSystemIdentifier(t);break}case u.BOGUS_DOCTYPE:{this._stateBogusDoctype(t);break}case u.CDATA_SECTION:{this._stateCdataSection(t);break}case u.CDATA_SECTION_BRACKET:{this._stateCdataSectionBracket(t);break}case u.CDATA_SECTION_END:{this._stateCdataSectionEnd(t);break}case u.CHARACTER_REFERENCE:{this._stateCharacterReference();break}case u.AMBIGUOUS_AMPERSAND:{this._stateAmbiguousAmpersand(t);break}default:throw new Error("Unknown state")}}_stateData(t){switch(t){case o.LESS_THAN_SIGN:{this.state=u.TAG_OPEN;break}case o.AMPERSAND:{this._startCharacterReference();break}case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitCodePoint(t);break}case o.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateRcdata(t){switch(t){case o.AMPERSAND:{this._startCharacterReference();break}case o.LESS_THAN_SIGN:{this.state=u.RCDATA_LESS_THAN_SIGN;break}case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitChars(j);break}case o.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateRawtext(t){switch(t){case o.LESS_THAN_SIGN:{this.state=u.RAWTEXT_LESS_THAN_SIGN;break}case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitChars(j);break}case o.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateScriptData(t){switch(t){case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_LESS_THAN_SIGN;break}case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitChars(j);break}case o.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(t)}}_statePlaintext(t){switch(t){case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitChars(j);break}case o.EOF:{this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateTagOpen(t){if(Le(t))this._createStartTagToken(),this.state=u.TAG_NAME,this._stateTagName(t);else switch(t){case o.EXCLAMATION_MARK:{this.state=u.MARKUP_DECLARATION_OPEN;break}case o.SOLIDUS:{this.state=u.END_TAG_OPEN;break}case o.QUESTION_MARK:{this._err(f.unexpectedQuestionMarkInsteadOfTagName),this._createCommentToken(1),this.state=u.BOGUS_COMMENT,this._stateBogusComment(t);break}case o.EOF:{this._err(f.eofBeforeTagName),this._emitChars("<"),this._emitEOFToken();break}default:this._err(f.invalidFirstCharacterOfTagName),this._emitChars("<"),this.state=u.DATA,this._stateData(t)}}_stateEndTagOpen(t){if(Le(t))this._createEndTagToken(),this.state=u.TAG_NAME,this._stateTagName(t);else switch(t){case o.GREATER_THAN_SIGN:{this._err(f.missingEndTagName),this.state=u.DATA;break}case o.EOF:{this._err(f.eofBeforeTagName),this._emitChars("</"),this._emitEOFToken();break}default:this._err(f.invalidFirstCharacterOfTagName),this._createCommentToken(2),this.state=u.BOGUS_COMMENT,this._stateBogusComment(t)}}_stateTagName(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this.state=u.BEFORE_ATTRIBUTE_NAME;break}case o.SOLIDUS:{this.state=u.SELF_CLOSING_START_TAG;break}case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentTagToken();break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.tagName+=j;break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:s.tagName+=String.fromCodePoint(Lt(t)?ds(t):t)}}_stateRcdataLessThanSign(t){t===o.SOLIDUS?this.state=u.RCDATA_END_TAG_OPEN:(this._emitChars("<"),this.state=u.RCDATA,this._stateRcdata(t))}_stateRcdataEndTagOpen(t){Le(t)?(this.state=u.RCDATA_END_TAG_NAME,this._stateRcdataEndTagName(t)):(this._emitChars("</"),this.state=u.RCDATA,this._stateRcdata(t))}handleSpecialEndTag(t){if(!this.preprocessor.startsWith(this.lastStartTagName,!1))return!this._ensureHibernation();this._createEndTagToken();const s=this.currentToken;switch(s.tagName=this.lastStartTagName,this.preprocessor.peek(this.lastStartTagName.length)){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:return this._advanceBy(this.lastStartTagName.length),this.state=u.BEFORE_ATTRIBUTE_NAME,!1;case o.SOLIDUS:return this._advanceBy(this.lastStartTagName.length),this.state=u.SELF_CLOSING_START_TAG,!1;case o.GREATER_THAN_SIGN:return this._advanceBy(this.lastStartTagName.length),this.emitCurrentTagToken(),this.state=u.DATA,!1;default:return!this._ensureHibernation()}}_stateRcdataEndTagName(t){this.handleSpecialEndTag(t)&&(this._emitChars("</"),this.state=u.RCDATA,this._stateRcdata(t))}_stateRawtextLessThanSign(t){t===o.SOLIDUS?this.state=u.RAWTEXT_END_TAG_OPEN:(this._emitChars("<"),this.state=u.RAWTEXT,this._stateRawtext(t))}_stateRawtextEndTagOpen(t){Le(t)?(this.state=u.RAWTEXT_END_TAG_NAME,this._stateRawtextEndTagName(t)):(this._emitChars("</"),this.state=u.RAWTEXT,this._stateRawtext(t))}_stateRawtextEndTagName(t){this.handleSpecialEndTag(t)&&(this._emitChars("</"),this.state=u.RAWTEXT,this._stateRawtext(t))}_stateScriptDataLessThanSign(t){switch(t){case o.SOLIDUS:{this.state=u.SCRIPT_DATA_END_TAG_OPEN;break}case o.EXCLAMATION_MARK:{this.state=u.SCRIPT_DATA_ESCAPE_START,this._emitChars("<!");break}default:this._emitChars("<"),this.state=u.SCRIPT_DATA,this._stateScriptData(t)}}_stateScriptDataEndTagOpen(t){Le(t)?(this.state=u.SCRIPT_DATA_END_TAG_NAME,this._stateScriptDataEndTagName(t)):(this._emitChars("</"),this.state=u.SCRIPT_DATA,this._stateScriptData(t))}_stateScriptDataEndTagName(t){this.handleSpecialEndTag(t)&&(this._emitChars("</"),this.state=u.SCRIPT_DATA,this._stateScriptData(t))}_stateScriptDataEscapeStart(t){t===o.HYPHEN_MINUS?(this.state=u.SCRIPT_DATA_ESCAPE_START_DASH,this._emitChars("-")):(this.state=u.SCRIPT_DATA,this._stateScriptData(t))}_stateScriptDataEscapeStartDash(t){t===o.HYPHEN_MINUS?(this.state=u.SCRIPT_DATA_ESCAPED_DASH_DASH,this._emitChars("-")):(this.state=u.SCRIPT_DATA,this._stateScriptData(t))}_stateScriptDataEscaped(t){switch(t){case o.HYPHEN_MINUS:{this.state=u.SCRIPT_DATA_ESCAPED_DASH,this._emitChars("-");break}case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitChars(j);break}case o.EOF:{this._err(f.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateScriptDataEscapedDash(t){switch(t){case o.HYPHEN_MINUS:{this.state=u.SCRIPT_DATA_ESCAPED_DASH_DASH,this._emitChars("-");break}case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.state=u.SCRIPT_DATA_ESCAPED,this._emitChars(j);break}case o.EOF:{this._err(f.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=u.SCRIPT_DATA_ESCAPED,this._emitCodePoint(t)}}_stateScriptDataEscapedDashDash(t){switch(t){case o.HYPHEN_MINUS:{this._emitChars("-");break}case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;break}case o.GREATER_THAN_SIGN:{this.state=u.SCRIPT_DATA,this._emitChars(">");break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.state=u.SCRIPT_DATA_ESCAPED,this._emitChars(j);break}case o.EOF:{this._err(f.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=u.SCRIPT_DATA_ESCAPED,this._emitCodePoint(t)}}_stateScriptDataEscapedLessThanSign(t){t===o.SOLIDUS?this.state=u.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:Le(t)?(this._emitChars("<"),this.state=u.SCRIPT_DATA_DOUBLE_ESCAPE_START,this._stateScriptDataDoubleEscapeStart(t)):(this._emitChars("<"),this.state=u.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(t))}_stateScriptDataEscapedEndTagOpen(t){Le(t)?(this.state=u.SCRIPT_DATA_ESCAPED_END_TAG_NAME,this._stateScriptDataEscapedEndTagName(t)):(this._emitChars("</"),this.state=u.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(t))}_stateScriptDataEscapedEndTagName(t){this.handleSpecialEndTag(t)&&(this._emitChars("</"),this.state=u.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(t))}_stateScriptDataDoubleEscapeStart(t){if(this.preprocessor.startsWith(ie.SCRIPT,!1)&&Hi(this.preprocessor.peek(ie.SCRIPT.length))){this._emitCodePoint(t);for(let s=0;s<ie.SCRIPT.length;s++)this._emitCodePoint(this._consume());this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED}else this._ensureHibernation()||(this.state=u.SCRIPT_DATA_ESCAPED,this._stateScriptDataEscaped(t))}_stateScriptDataDoubleEscaped(t){switch(t){case o.HYPHEN_MINUS:{this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED_DASH,this._emitChars("-");break}case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case o.NULL:{this._err(f.unexpectedNullCharacter),this._emitChars(j);break}case o.EOF:{this._err(f.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateScriptDataDoubleEscapedDash(t){switch(t){case o.HYPHEN_MINUS:{this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH,this._emitChars("-");break}case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitChars(j);break}case o.EOF:{this._err(f.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitCodePoint(t)}}_stateScriptDataDoubleEscapedDashDash(t){switch(t){case o.HYPHEN_MINUS:{this._emitChars("-");break}case o.LESS_THAN_SIGN:{this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN,this._emitChars("<");break}case o.GREATER_THAN_SIGN:{this.state=u.SCRIPT_DATA,this._emitChars(">");break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitChars(j);break}case o.EOF:{this._err(f.eofInScriptHtmlCommentLikeText),this._emitEOFToken();break}default:this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED,this._emitCodePoint(t)}}_stateScriptDataDoubleEscapedLessThanSign(t){t===o.SOLIDUS?(this.state=u.SCRIPT_DATA_DOUBLE_ESCAPE_END,this._emitChars("/")):(this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED,this._stateScriptDataDoubleEscaped(t))}_stateScriptDataDoubleEscapeEnd(t){if(this.preprocessor.startsWith(ie.SCRIPT,!1)&&Hi(this.preprocessor.peek(ie.SCRIPT.length))){this._emitCodePoint(t);for(let s=0;s<ie.SCRIPT.length;s++)this._emitCodePoint(this._consume());this.state=u.SCRIPT_DATA_ESCAPED}else this._ensureHibernation()||(this.state=u.SCRIPT_DATA_DOUBLE_ESCAPED,this._stateScriptDataDoubleEscaped(t))}_stateBeforeAttributeName(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.SOLIDUS:case o.GREATER_THAN_SIGN:case o.EOF:{this.state=u.AFTER_ATTRIBUTE_NAME,this._stateAfterAttributeName(t);break}case o.EQUALS_SIGN:{this._err(f.unexpectedEqualsSignBeforeAttributeName),this._createAttr("="),this.state=u.ATTRIBUTE_NAME;break}default:this._createAttr(""),this.state=u.ATTRIBUTE_NAME,this._stateAttributeName(t)}}_stateAttributeName(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:case o.SOLIDUS:case o.GREATER_THAN_SIGN:case o.EOF:{this._leaveAttrName(),this.state=u.AFTER_ATTRIBUTE_NAME,this._stateAfterAttributeName(t);break}case o.EQUALS_SIGN:{this._leaveAttrName(),this.state=u.BEFORE_ATTRIBUTE_VALUE;break}case o.QUOTATION_MARK:case o.APOSTROPHE:case o.LESS_THAN_SIGN:{this._err(f.unexpectedCharacterInAttributeName),this.currentAttr.name+=String.fromCodePoint(t);break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.currentAttr.name+=j;break}default:this.currentAttr.name+=String.fromCodePoint(Lt(t)?ds(t):t)}}_stateAfterAttributeName(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.SOLIDUS:{this.state=u.SELF_CLOSING_START_TAG;break}case o.EQUALS_SIGN:{this.state=u.BEFORE_ATTRIBUTE_VALUE;break}case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentTagToken();break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:this._createAttr(""),this.state=u.ATTRIBUTE_NAME,this._stateAttributeName(t)}}_stateBeforeAttributeValue(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.QUOTATION_MARK:{this.state=u.ATTRIBUTE_VALUE_DOUBLE_QUOTED;break}case o.APOSTROPHE:{this.state=u.ATTRIBUTE_VALUE_SINGLE_QUOTED;break}case o.GREATER_THAN_SIGN:{this._err(f.missingAttributeValue),this.state=u.DATA,this.emitCurrentTagToken();break}default:this.state=u.ATTRIBUTE_VALUE_UNQUOTED,this._stateAttributeValueUnquoted(t)}}_stateAttributeValueDoubleQuoted(t){switch(t){case o.QUOTATION_MARK:{this.state=u.AFTER_ATTRIBUTE_VALUE_QUOTED;break}case o.AMPERSAND:{this._startCharacterReference();break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.currentAttr.value+=j;break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(t)}}_stateAttributeValueSingleQuoted(t){switch(t){case o.APOSTROPHE:{this.state=u.AFTER_ATTRIBUTE_VALUE_QUOTED;break}case o.AMPERSAND:{this._startCharacterReference();break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.currentAttr.value+=j;break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(t)}}_stateAttributeValueUnquoted(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this._leaveAttrValue(),this.state=u.BEFORE_ATTRIBUTE_NAME;break}case o.AMPERSAND:{this._startCharacterReference();break}case o.GREATER_THAN_SIGN:{this._leaveAttrValue(),this.state=u.DATA,this.emitCurrentTagToken();break}case o.NULL:{this._err(f.unexpectedNullCharacter),this.currentAttr.value+=j;break}case o.QUOTATION_MARK:case o.APOSTROPHE:case o.LESS_THAN_SIGN:case o.EQUALS_SIGN:case o.GRAVE_ACCENT:{this._err(f.unexpectedCharacterInUnquotedAttributeValue),this.currentAttr.value+=String.fromCodePoint(t);break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:this.currentAttr.value+=String.fromCodePoint(t)}}_stateAfterAttributeValueQuoted(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this._leaveAttrValue(),this.state=u.BEFORE_ATTRIBUTE_NAME;break}case o.SOLIDUS:{this._leaveAttrValue(),this.state=u.SELF_CLOSING_START_TAG;break}case o.GREATER_THAN_SIGN:{this._leaveAttrValue(),this.state=u.DATA,this.emitCurrentTagToken();break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:this._err(f.missingWhitespaceBetweenAttributes),this.state=u.BEFORE_ATTRIBUTE_NAME,this._stateBeforeAttributeName(t)}}_stateSelfClosingStartTag(t){switch(t){case o.GREATER_THAN_SIGN:{const s=this.currentToken;s.selfClosing=!0,this.state=u.DATA,this.emitCurrentTagToken();break}case o.EOF:{this._err(f.eofInTag),this._emitEOFToken();break}default:this._err(f.unexpectedSolidusInTag),this.state=u.BEFORE_ATTRIBUTE_NAME,this._stateBeforeAttributeName(t)}}_stateBogusComment(t){const s=this.currentToken;switch(t){case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentComment(s);break}case o.EOF:{this.emitCurrentComment(s),this._emitEOFToken();break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.data+=j;break}default:s.data+=String.fromCodePoint(t)}}_stateMarkupDeclarationOpen(t){this._consumeSequenceIfMatch(ie.DASH_DASH,!0)?(this._createCommentToken(ie.DASH_DASH.length+1),this.state=u.COMMENT_START):this._consumeSequenceIfMatch(ie.DOCTYPE,!1)?(this.currentLocation=this.getCurrentLocation(ie.DOCTYPE.length+1),this.state=u.DOCTYPE):this._consumeSequenceIfMatch(ie.CDATA_START,!0)?this.inForeignNode?this.state=u.CDATA_SECTION:(this._err(f.cdataInHtmlContent),this._createCommentToken(ie.CDATA_START.length+1),this.currentToken.data="[CDATA[",this.state=u.BOGUS_COMMENT):this._ensureHibernation()||(this._err(f.incorrectlyOpenedComment),this._createCommentToken(2),this.state=u.BOGUS_COMMENT,this._stateBogusComment(t))}_stateCommentStart(t){switch(t){case o.HYPHEN_MINUS:{this.state=u.COMMENT_START_DASH;break}case o.GREATER_THAN_SIGN:{this._err(f.abruptClosingOfEmptyComment),this.state=u.DATA;const s=this.currentToken;this.emitCurrentComment(s);break}default:this.state=u.COMMENT,this._stateComment(t)}}_stateCommentStartDash(t){const s=this.currentToken;switch(t){case o.HYPHEN_MINUS:{this.state=u.COMMENT_END;break}case o.GREATER_THAN_SIGN:{this._err(f.abruptClosingOfEmptyComment),this.state=u.DATA,this.emitCurrentComment(s);break}case o.EOF:{this._err(f.eofInComment),this.emitCurrentComment(s),this._emitEOFToken();break}default:s.data+="-",this.state=u.COMMENT,this._stateComment(t)}}_stateComment(t){const s=this.currentToken;switch(t){case o.HYPHEN_MINUS:{this.state=u.COMMENT_END_DASH;break}case o.LESS_THAN_SIGN:{s.data+="<",this.state=u.COMMENT_LESS_THAN_SIGN;break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.data+=j;break}case o.EOF:{this._err(f.eofInComment),this.emitCurrentComment(s),this._emitEOFToken();break}default:s.data+=String.fromCodePoint(t)}}_stateCommentLessThanSign(t){const s=this.currentToken;switch(t){case o.EXCLAMATION_MARK:{s.data+="!",this.state=u.COMMENT_LESS_THAN_SIGN_BANG;break}case o.LESS_THAN_SIGN:{s.data+="<";break}default:this.state=u.COMMENT,this._stateComment(t)}}_stateCommentLessThanSignBang(t){t===o.HYPHEN_MINUS?this.state=u.COMMENT_LESS_THAN_SIGN_BANG_DASH:(this.state=u.COMMENT,this._stateComment(t))}_stateCommentLessThanSignBangDash(t){t===o.HYPHEN_MINUS?this.state=u.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:(this.state=u.COMMENT_END_DASH,this._stateCommentEndDash(t))}_stateCommentLessThanSignBangDashDash(t){t!==o.GREATER_THAN_SIGN&&t!==o.EOF&&this._err(f.nestedComment),this.state=u.COMMENT_END,this._stateCommentEnd(t)}_stateCommentEndDash(t){const s=this.currentToken;switch(t){case o.HYPHEN_MINUS:{this.state=u.COMMENT_END;break}case o.EOF:{this._err(f.eofInComment),this.emitCurrentComment(s),this._emitEOFToken();break}default:s.data+="-",this.state=u.COMMENT,this._stateComment(t)}}_stateCommentEnd(t){const s=this.currentToken;switch(t){case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentComment(s);break}case o.EXCLAMATION_MARK:{this.state=u.COMMENT_END_BANG;break}case o.HYPHEN_MINUS:{s.data+="-";break}case o.EOF:{this._err(f.eofInComment),this.emitCurrentComment(s),this._emitEOFToken();break}default:s.data+="--",this.state=u.COMMENT,this._stateComment(t)}}_stateCommentEndBang(t){const s=this.currentToken;switch(t){case o.HYPHEN_MINUS:{s.data+="--!",this.state=u.COMMENT_END_DASH;break}case o.GREATER_THAN_SIGN:{this._err(f.incorrectlyClosedComment),this.state=u.DATA,this.emitCurrentComment(s);break}case o.EOF:{this._err(f.eofInComment),this.emitCurrentComment(s),this._emitEOFToken();break}default:s.data+="--!",this.state=u.COMMENT,this._stateComment(t)}}_stateDoctype(t){switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this.state=u.BEFORE_DOCTYPE_NAME;break}case o.GREATER_THAN_SIGN:{this.state=u.BEFORE_DOCTYPE_NAME,this._stateBeforeDoctypeName(t);break}case o.EOF:{this._err(f.eofInDoctype),this._createDoctypeToken(null);const s=this.currentToken;s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingWhitespaceBeforeDoctypeName),this.state=u.BEFORE_DOCTYPE_NAME,this._stateBeforeDoctypeName(t)}}_stateBeforeDoctypeName(t){if(Lt(t))this._createDoctypeToken(String.fromCharCode(ds(t))),this.state=u.DOCTYPE_NAME;else switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.NULL:{this._err(f.unexpectedNullCharacter),this._createDoctypeToken(j),this.state=u.DOCTYPE_NAME;break}case o.GREATER_THAN_SIGN:{this._err(f.missingDoctypeName),this._createDoctypeToken(null);const s=this.currentToken;s.forceQuirks=!0,this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.EOF:{this._err(f.eofInDoctype),this._createDoctypeToken(null);const s=this.currentToken;s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._createDoctypeToken(String.fromCodePoint(t)),this.state=u.DOCTYPE_NAME}}_stateDoctypeName(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this.state=u.AFTER_DOCTYPE_NAME;break}case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.name+=j;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:s.name+=String.fromCodePoint(Lt(t)?ds(t):t)}}_stateAfterDoctypeName(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._consumeSequenceIfMatch(ie.PUBLIC,!1)?this.state=u.AFTER_DOCTYPE_PUBLIC_KEYWORD:this._consumeSequenceIfMatch(ie.SYSTEM,!1)?this.state=u.AFTER_DOCTYPE_SYSTEM_KEYWORD:this._ensureHibernation()||(this._err(f.invalidCharacterSequenceAfterDoctypeName),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t))}}_stateAfterDoctypePublicKeyword(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this.state=u.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;break}case o.QUOTATION_MARK:{this._err(f.missingWhitespaceAfterDoctypePublicKeyword),s.publicId="",this.state=u.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;break}case o.APOSTROPHE:{this._err(f.missingWhitespaceAfterDoctypePublicKeyword),s.publicId="",this.state=u.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;break}case o.GREATER_THAN_SIGN:{this._err(f.missingDoctypePublicIdentifier),s.forceQuirks=!0,this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingQuoteBeforeDoctypePublicIdentifier),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateBeforeDoctypePublicIdentifier(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.QUOTATION_MARK:{s.publicId="",this.state=u.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;break}case o.APOSTROPHE:{s.publicId="",this.state=u.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;break}case o.GREATER_THAN_SIGN:{this._err(f.missingDoctypePublicIdentifier),s.forceQuirks=!0,this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingQuoteBeforeDoctypePublicIdentifier),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateDoctypePublicIdentifierDoubleQuoted(t){const s=this.currentToken;switch(t){case o.QUOTATION_MARK:{this.state=u.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.publicId+=j;break}case o.GREATER_THAN_SIGN:{this._err(f.abruptDoctypePublicIdentifier),s.forceQuirks=!0,this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:s.publicId+=String.fromCodePoint(t)}}_stateDoctypePublicIdentifierSingleQuoted(t){const s=this.currentToken;switch(t){case o.APOSTROPHE:{this.state=u.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.publicId+=j;break}case o.GREATER_THAN_SIGN:{this._err(f.abruptDoctypePublicIdentifier),s.forceQuirks=!0,this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:s.publicId+=String.fromCodePoint(t)}}_stateAfterDoctypePublicIdentifier(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this.state=u.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;break}case o.GREATER_THAN_SIGN:{this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.QUOTATION_MARK:{this._err(f.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers),s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case o.APOSTROPHE:{this._err(f.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers),s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingQuoteBeforeDoctypeSystemIdentifier),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateBetweenDoctypePublicAndSystemIdentifiers(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.GREATER_THAN_SIGN:{this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.QUOTATION_MARK:{s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case o.APOSTROPHE:{s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingQuoteBeforeDoctypeSystemIdentifier),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateAfterDoctypeSystemKeyword(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:{this.state=u.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;break}case o.QUOTATION_MARK:{this._err(f.missingWhitespaceAfterDoctypeSystemKeyword),s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case o.APOSTROPHE:{this._err(f.missingWhitespaceAfterDoctypeSystemKeyword),s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case o.GREATER_THAN_SIGN:{this._err(f.missingDoctypeSystemIdentifier),s.forceQuirks=!0,this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingQuoteBeforeDoctypeSystemIdentifier),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateBeforeDoctypeSystemIdentifier(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.QUOTATION_MARK:{s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;break}case o.APOSTROPHE:{s.systemId="",this.state=u.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;break}case o.GREATER_THAN_SIGN:{this._err(f.missingDoctypeSystemIdentifier),s.forceQuirks=!0,this.state=u.DATA,this.emitCurrentDoctype(s);break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.missingQuoteBeforeDoctypeSystemIdentifier),s.forceQuirks=!0,this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateDoctypeSystemIdentifierDoubleQuoted(t){const s=this.currentToken;switch(t){case o.QUOTATION_MARK:{this.state=u.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.systemId+=j;break}case o.GREATER_THAN_SIGN:{this._err(f.abruptDoctypeSystemIdentifier),s.forceQuirks=!0,this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:s.systemId+=String.fromCodePoint(t)}}_stateDoctypeSystemIdentifierSingleQuoted(t){const s=this.currentToken;switch(t){case o.APOSTROPHE:{this.state=u.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;break}case o.NULL:{this._err(f.unexpectedNullCharacter),s.systemId+=j;break}case o.GREATER_THAN_SIGN:{this._err(f.abruptDoctypeSystemIdentifier),s.forceQuirks=!0,this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:s.systemId+=String.fromCodePoint(t)}}_stateAfterDoctypeSystemIdentifier(t){const s=this.currentToken;switch(t){case o.SPACE:case o.LINE_FEED:case o.TABULATION:case o.FORM_FEED:break;case o.GREATER_THAN_SIGN:{this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.EOF:{this._err(f.eofInDoctype),s.forceQuirks=!0,this.emitCurrentDoctype(s),this._emitEOFToken();break}default:this._err(f.unexpectedCharacterAfterDoctypeSystemIdentifier),this.state=u.BOGUS_DOCTYPE,this._stateBogusDoctype(t)}}_stateBogusDoctype(t){const s=this.currentToken;switch(t){case o.GREATER_THAN_SIGN:{this.emitCurrentDoctype(s),this.state=u.DATA;break}case o.NULL:{this._err(f.unexpectedNullCharacter);break}case o.EOF:{this.emitCurrentDoctype(s),this._emitEOFToken();break}}}_stateCdataSection(t){switch(t){case o.RIGHT_SQUARE_BRACKET:{this.state=u.CDATA_SECTION_BRACKET;break}case o.EOF:{this._err(f.eofInCdata),this._emitEOFToken();break}default:this._emitCodePoint(t)}}_stateCdataSectionBracket(t){t===o.RIGHT_SQUARE_BRACKET?this.state=u.CDATA_SECTION_END:(this._emitChars("]"),this.state=u.CDATA_SECTION,this._stateCdataSection(t))}_stateCdataSectionEnd(t){switch(t){case o.GREATER_THAN_SIGN:{this.state=u.DATA;break}case o.RIGHT_SQUARE_BRACKET:{this._emitChars("]");break}default:this._emitChars("]]"),this.state=u.CDATA_SECTION,this._stateCdataSection(t)}}_stateCharacterReference(){let t=this.entityDecoder.write(this.preprocessor.html,this.preprocessor.pos);if(t<0)if(this.preprocessor.lastChunkWritten)t=this.entityDecoder.end();else{this.active=!1,this.preprocessor.pos=this.preprocessor.html.length-1,this.consumedAfterSnapshot=0,this.preprocessor.endOfChunkHit=!0;return}t===0?(this.preprocessor.pos=this.entityStartPos,this._flushCodePointConsumedAsCharacterReference(o.AMPERSAND),this.state=!this._isCharacterReferenceInAttribute()&&Mi(this.preprocessor.peek(1))?u.AMBIGUOUS_AMPERSAND:this.returnState):this.state=this.returnState}_stateAmbiguousAmpersand(t){Mi(t)?this._flushCodePointConsumedAsCharacterReference(t):(t===o.SEMICOLON&&this._err(f.unknownNamedCharacterReference),this.state=this.returnState,this._callState(t))}}const Un=new Set([a.DD,a.DT,a.LI,a.OPTGROUP,a.OPTION,a.P,a.RB,a.RP,a.RT,a.RTC]),Bi=new Set([...Un,a.CAPTION,a.COLGROUP,a.TBODY,a.TD,a.TFOOT,a.TH,a.THEAD,a.TR]),ys=new Set([a.APPLET,a.CAPTION,a.HTML,a.MARQUEE,a.OBJECT,a.TABLE,a.TD,a.TEMPLATE,a.TH]),Zc=new Set([...ys,a.OL,a.UL]),eu=new Set([...ys,a.BUTTON]),Fi=new Set([a.ANNOTATION_XML,a.MI,a.MN,a.MO,a.MS,a.MTEXT]),Ui=new Set([a.DESC,a.FOREIGN_OBJECT,a.TITLE]),tu=new Set([a.TR,a.TEMPLATE,a.HTML]),su=new Set([a.TBODY,a.TFOOT,a.THEAD,a.TEMPLATE,a.HTML]),au=new Set([a.TABLE,a.TEMPLATE,a.HTML]),ru=new Set([a.TD,a.TH]);class iu{get currentTmplContentOrNode(){return this._isInTemplate()?this.treeAdapter.getTemplateContent(this.current):this.current}constructor(t,s,r){this.treeAdapter=s,this.handler=r,this.items=[],this.tagIDs=[],this.stackTop=-1,this.tmplCount=0,this.currentTagId=a.UNKNOWN,this.current=t}_indexOf(t){return this.items.lastIndexOf(t,this.stackTop)}_isInTemplate(){return this.currentTagId===a.TEMPLATE&&this.treeAdapter.getNamespaceURI(this.current)===E.HTML}_updateCurrentElement(){this.current=this.items[this.stackTop],this.currentTagId=this.tagIDs[this.stackTop]}push(t,s){this.stackTop++,this.items[this.stackTop]=t,this.current=t,this.tagIDs[this.stackTop]=s,this.currentTagId=s,this._isInTemplate()&&this.tmplCount++,this.handler.onItemPush(t,s,!0)}pop(){const t=this.current;this.tmplCount>0&&this._isInTemplate()&&this.tmplCount--,this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(t,!0)}replace(t,s){const r=this._indexOf(t);this.items[r]=s,r===this.stackTop&&(this.current=s)}insertAfter(t,s,r){const i=this._indexOf(t)+1;this.items.splice(i,0,s),this.tagIDs.splice(i,0,r),this.stackTop++,i===this.stackTop&&this._updateCurrentElement(),this.current&&this.currentTagId!==void 0&&this.handler.onItemPush(this.current,this.currentTagId,i===this.stackTop)}popUntilTagNamePopped(t){let s=this.stackTop+1;do s=this.tagIDs.lastIndexOf(t,s-1);while(s>0&&this.treeAdapter.getNamespaceURI(this.items[s])!==E.HTML);this.shortenToLength(Math.max(s,0))}shortenToLength(t){for(;this.stackTop>=t;){const s=this.current;this.tmplCount>0&&this._isInTemplate()&&(this.tmplCount-=1),this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(s,this.stackTop<t)}}popUntilElementPopped(t){const s=this._indexOf(t);this.shortenToLength(Math.max(s,0))}popUntilPopped(t,s){const r=this._indexOfTagNames(t,s);this.shortenToLength(Math.max(r,0))}popUntilNumberedHeaderPopped(){this.popUntilPopped(Ma,E.HTML)}popUntilTableCellPopped(){this.popUntilPopped(ru,E.HTML)}popAllUpToHtmlElement(){this.tmplCount=0,this.shortenToLength(1)}_indexOfTagNames(t,s){for(let r=this.stackTop;r>=0;r--)if(t.has(this.tagIDs[r])&&this.treeAdapter.getNamespaceURI(this.items[r])===s)return r;return-1}clearBackTo(t,s){const r=this._indexOfTagNames(t,s);this.shortenToLength(r+1)}clearBackToTableContext(){this.clearBackTo(au,E.HTML)}clearBackToTableBodyContext(){this.clearBackTo(su,E.HTML)}clearBackToTableRowContext(){this.clearBackTo(tu,E.HTML)}remove(t){const s=this._indexOf(t);s>=0&&(s===this.stackTop?this.pop():(this.items.splice(s,1),this.tagIDs.splice(s,1),this.stackTop--,this._updateCurrentElement(),this.handler.onItemPop(t,!1)))}tryPeekProperlyNestedBodyElement(){return this.stackTop>=1&&this.tagIDs[1]===a.BODY?this.items[1]:null}contains(t){return this._indexOf(t)>-1}getCommonAncestor(t){const s=this._indexOf(t)-1;return s>=0?this.items[s]:null}isRootHtmlElementCurrent(){return this.stackTop===0&&this.tagIDs[0]===a.HTML}hasInDynamicScope(t,s){for(let r=this.stackTop;r>=0;r--){const i=this.tagIDs[r];switch(this.treeAdapter.getNamespaceURI(this.items[r])){case E.HTML:{if(i===t)return!0;if(s.has(i))return!1;break}case E.SVG:{if(Ui.has(i))return!1;break}case E.MATHML:{if(Fi.has(i))return!1;break}}}return!0}hasInScope(t){return this.hasInDynamicScope(t,ys)}hasInListItemScope(t){return this.hasInDynamicScope(t,Zc)}hasInButtonScope(t){return this.hasInDynamicScope(t,eu)}hasNumberedHeaderInScope(){for(let t=this.stackTop;t>=0;t--){const s=this.tagIDs[t];switch(this.treeAdapter.getNamespaceURI(this.items[t])){case E.HTML:{if(Ma.has(s))return!0;if(ys.has(s))return!1;break}case E.SVG:{if(Ui.has(s))return!1;break}case E.MATHML:{if(Fi.has(s))return!1;break}}}return!0}hasInTableScope(t){for(let s=this.stackTop;s>=0;s--)if(this.treeAdapter.getNamespaceURI(this.items[s])===E.HTML)switch(this.tagIDs[s]){case t:return!0;case a.TABLE:case a.HTML:return!1}return!0}hasTableBodyContextInTableScope(){for(let t=this.stackTop;t>=0;t--)if(this.treeAdapter.getNamespaceURI(this.items[t])===E.HTML)switch(this.tagIDs[t]){case a.TBODY:case a.THEAD:case a.TFOOT:return!0;case a.TABLE:case a.HTML:return!1}return!0}hasInSelectScope(t){for(let s=this.stackTop;s>=0;s--)if(this.treeAdapter.getNamespaceURI(this.items[s])===E.HTML)switch(this.tagIDs[s]){case t:return!0;case a.OPTION:case a.OPTGROUP:break;default:return!1}return!0}generateImpliedEndTags(){for(;this.currentTagId!==void 0&&Un.has(this.currentTagId);)this.pop()}generateImpliedEndTagsThoroughly(){for(;this.currentTagId!==void 0&&Bi.has(this.currentTagId);)this.pop()}generateImpliedEndTagsWithExclusion(t){for(;this.currentTagId!==void 0&&this.currentTagId!==t&&Bi.has(this.currentTagId);)this.pop()}}const Ia=3;var ye;(function(e){e[e.Marker=0]="Marker",e[e.Element=1]="Element"})(ye||(ye={}));const $i={type:ye.Marker};class nu{constructor(t){this.treeAdapter=t,this.entries=[],this.bookmark=null}_getNoahArkConditionCandidates(t,s){const r=[],i=s.length,n=this.treeAdapter.getTagName(t),c=this.treeAdapter.getNamespaceURI(t);for(let h=0;h<this.entries.length;h++){const d=this.entries[h];if(d.type===ye.Marker)break;const{element:p}=d;if(this.treeAdapter.getTagName(p)===n&&this.treeAdapter.getNamespaceURI(p)===c){const b=this.treeAdapter.getAttrList(p);b.length===i&&r.push({idx:h,attrs:b})}}return r}_ensureNoahArkCondition(t){if(this.entries.length<Ia)return;const s=this.treeAdapter.getAttrList(t),r=this._getNoahArkConditionCandidates(t,s);if(r.length<Ia)return;const i=new Map(s.map(c=>[c.name,c.value]));let n=0;for(let c=0;c<r.length;c++){const h=r[c];h.attrs.every(d=>i.get(d.name)===d.value)&&(n+=1,n>=Ia&&this.entries.splice(h.idx,1))}}insertMarker(){this.entries.unshift($i)}pushElement(t,s){this._ensureNoahArkCondition(t),this.entries.unshift({type:ye.Element,element:t,token:s})}insertElementAfterBookmark(t,s){const r=this.entries.indexOf(this.bookmark);this.entries.splice(r,0,{type:ye.Element,element:t,token:s})}removeEntry(t){const s=this.entries.indexOf(t);s!==-1&&this.entries.splice(s,1)}clearToLastMarker(){const t=this.entries.indexOf($i);t===-1?this.entries.length=0:this.entries.splice(0,t+1)}getElementEntryInScopeWithTagName(t){const s=this.entries.find(r=>r.type===ye.Marker||this.treeAdapter.getTagName(r.element)===t);return s&&s.type===ye.Element?s:null}getElementEntry(t){return this.entries.find(s=>s.type===ye.Element&&s.element===t)}}const oe={createDocument(){return{nodeName:"#document",mode:he.NO_QUIRKS,childNodes:[]}},createDocumentFragment(){return{nodeName:"#document-fragment",childNodes:[]}},createElement(e,t,s){return{nodeName:e,tagName:e,attrs:s,namespaceURI:t,childNodes:[],parentNode:null}},createCommentNode(e){return{nodeName:"#comment",data:e,parentNode:null}},createTextNode(e){return{nodeName:"#text",value:e,parentNode:null}},appendChild(e,t){e.childNodes.push(t),t.parentNode=e},insertBefore(e,t,s){const r=e.childNodes.indexOf(s);e.childNodes.splice(r,0,t),t.parentNode=e},setTemplateContent(e,t){e.content=t},getTemplateContent(e){return e.content},setDocumentType(e,t,s,r){const i=e.childNodes.find(n=>n.nodeName==="#documentType");if(i)i.name=t,i.publicId=s,i.systemId=r;else{const n={nodeName:"#documentType",name:t,publicId:s,systemId:r,parentNode:null};oe.appendChild(e,n)}},setDocumentMode(e,t){e.mode=t},getDocumentMode(e){return e.mode},detachNode(e){if(e.parentNode){const t=e.parentNode.childNodes.indexOf(e);e.parentNode.childNodes.splice(t,1),e.parentNode=null}},insertText(e,t){if(e.childNodes.length>0){const s=e.childNodes[e.childNodes.length-1];if(oe.isTextNode(s)){s.value+=t;return}}oe.appendChild(e,oe.createTextNode(t))},insertTextBefore(e,t,s){const r=e.childNodes[e.childNodes.indexOf(s)-1];r&&oe.isTextNode(r)?r.value+=t:oe.insertBefore(e,oe.createTextNode(t),s)},adoptAttributes(e,t){const s=new Set(e.attrs.map(r=>r.name));for(let r=0;r<t.length;r++)s.has(t[r].name)||e.attrs.push(t[r])},getFirstChild(e){return e.childNodes[0]},getChildNodes(e){return e.childNodes},getParentNode(e){return e.parentNode},getAttrList(e){return e.attrs},getTagName(e){return e.tagName},getNamespaceURI(e){return e.namespaceURI},getTextNodeContent(e){return e.value},getCommentNodeContent(e){return e.data},getDocumentTypeNodeName(e){return e.name},getDocumentTypeNodePublicId(e){return e.publicId},getDocumentTypeNodeSystemId(e){return e.systemId},isTextNode(e){return e.nodeName==="#text"},isCommentNode(e){return e.nodeName==="#comment"},isDocumentTypeNode(e){return e.nodeName==="#documentType"},isElementNode(e){return Object.prototype.hasOwnProperty.call(e,"tagName")},setNodeSourceCodeLocation(e,t){e.sourceCodeLocation=t},getNodeSourceCodeLocation(e){return e.sourceCodeLocation},updateNodeSourceCodeLocation(e,t){e.sourceCodeLocation={...e.sourceCodeLocation,...t}}},$n="html",ou="about:legacy-compat",cu="http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd",jn=["+//silmaril//dtd html pro v0r11 19970101//","-//as//dtd html 3.0 aswedit + extensions//","-//advasoft ltd//dtd html 3.0 aswedit + extensions//","-//ietf//dtd html 2.0 level 1//","-//ietf//dtd html 2.0 level 2//","-//ietf//dtd html 2.0 strict level 1//","-//ietf//dtd html 2.0 strict level 2//","-//ietf//dtd html 2.0 strict//","-//ietf//dtd html 2.0//","-//ietf//dtd html 2.1e//","-//ietf//dtd html 3.0//","-//ietf//dtd html 3.2 final//","-//ietf//dtd html 3.2//","-//ietf//dtd html 3//","-//ietf//dtd html level 0//","-//ietf//dtd html level 1//","-//ietf//dtd html level 2//","-//ietf//dtd html level 3//","-//ietf//dtd html strict level 0//","-//ietf//dtd html strict level 1//","-//ietf//dtd html strict level 2//","-//ietf//dtd html strict level 3//","-//ietf//dtd html strict//","-//ietf//dtd html//","-//metrius//dtd metrius presentational//","-//microsoft//dtd internet explorer 2.0 html strict//","-//microsoft//dtd internet explorer 2.0 html//","-//microsoft//dtd internet explorer 2.0 tables//","-//microsoft//dtd internet explorer 3.0 html strict//","-//microsoft//dtd internet explorer 3.0 html//","-//microsoft//dtd internet explorer 3.0 tables//","-//netscape comm. corp.//dtd html//","-//netscape comm. corp.//dtd strict html//","-//o'reilly and associates//dtd html 2.0//","-//o'reilly and associates//dtd html extended 1.0//","-//o'reilly and associates//dtd html extended relaxed 1.0//","-//sq//dtd html 2.0 hotmetal + extensions//","-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//","-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//","-//spyglass//dtd html 2.0 extended//","-//sun microsystems corp.//dtd hotjava html//","-//sun microsystems corp.//dtd hotjava strict html//","-//w3c//dtd html 3 1995-03-24//","-//w3c//dtd html 3.2 draft//","-//w3c//dtd html 3.2 final//","-//w3c//dtd html 3.2//","-//w3c//dtd html 3.2s draft//","-//w3c//dtd html 4.0 frameset//","-//w3c//dtd html 4.0 transitional//","-//w3c//dtd html experimental 19960712//","-//w3c//dtd html experimental 970421//","-//w3c//dtd w3 html//","-//w3o//dtd w3 html 3.0//","-//webtechs//dtd mozilla html 2.0//","-//webtechs//dtd mozilla html//"],uu=[...jn,"-//w3c//dtd html 4.01 frameset//","-//w3c//dtd html 4.01 transitional//"],lu=new Set(["-//w3o//dtd w3 html strict 3.0//en//","-/w3c/dtd html 4.0 transitional/en","html"]),zn=["-//w3c//dtd xhtml 1.0 frameset//","-//w3c//dtd xhtml 1.0 transitional//"],du=[...zn,"-//w3c//dtd html 4.01 frameset//","-//w3c//dtd html 4.01 transitional//"];function ji(e,t){return t.some(s=>e.startsWith(s))}function hu(e){return e.name===$n&&e.publicId===null&&(e.systemId===null||e.systemId===ou)}function mu(e){if(e.name!==$n)return he.QUIRKS;const{systemId:t}=e;if(t&&t.toLowerCase()===cu)return he.QUIRKS;let{publicId:s}=e;if(s!==null){if(s=s.toLowerCase(),lu.has(s))return he.QUIRKS;let r=t===null?uu:jn;if(ji(s,r))return he.QUIRKS;if(r=t===null?zn:du,ji(s,r))return he.LIMITED_QUIRKS}return he.NO_QUIRKS}const zi={TEXT_HTML:"text/html",APPLICATION_XML:"application/xhtml+xml"},pu="definitionurl",fu="definitionURL",bu=new Map(["attributeName","attributeType","baseFrequency","baseProfile","calcMode","clipPathUnits","diffuseConstant","edgeMode","filterUnits","glyphRef","gradientTransform","gradientUnits","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lengthAdjust","limitingConeAngle","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","numOctaves","pathLength","patternContentUnits","patternTransform","patternUnits","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","refX","refY","repeatCount","repeatDur","requiredExtensions","requiredFeatures","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stitchTiles","surfaceScale","systemLanguage","tableValues","targetX","targetY","textLength","viewBox","viewTarget","xChannelSelector","yChannelSelector","zoomAndPan"].map(e=>[e.toLowerCase(),e])),gu=new Map([["xlink:actuate",{prefix:"xlink",name:"actuate",namespace:E.XLINK}],["xlink:arcrole",{prefix:"xlink",name:"arcrole",namespace:E.XLINK}],["xlink:href",{prefix:"xlink",name:"href",namespace:E.XLINK}],["xlink:role",{prefix:"xlink",name:"role",namespace:E.XLINK}],["xlink:show",{prefix:"xlink",name:"show",namespace:E.XLINK}],["xlink:title",{prefix:"xlink",name:"title",namespace:E.XLINK}],["xlink:type",{prefix:"xlink",name:"type",namespace:E.XLINK}],["xml:lang",{prefix:"xml",name:"lang",namespace:E.XML}],["xml:space",{prefix:"xml",name:"space",namespace:E.XML}],["xmlns",{prefix:"",name:"xmlns",namespace:E.XMLNS}],["xmlns:xlink",{prefix:"xmlns",name:"xlink",namespace:E.XMLNS}]]),ku=new Map(["altGlyph","altGlyphDef","altGlyphItem","animateColor","animateMotion","animateTransform","clipPath","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","foreignObject","glyphRef","linearGradient","radialGradient","textPath"].map(e=>[e.toLowerCase(),e])),Eu=new Set([a.B,a.BIG,a.BLOCKQUOTE,a.BODY,a.BR,a.CENTER,a.CODE,a.DD,a.DIV,a.DL,a.DT,a.EM,a.EMBED,a.H1,a.H2,a.H3,a.H4,a.H5,a.H6,a.HEAD,a.HR,a.I,a.IMG,a.LI,a.LISTING,a.MENU,a.META,a.NOBR,a.OL,a.P,a.PRE,a.RUBY,a.S,a.SMALL,a.SPAN,a.STRONG,a.STRIKE,a.SUB,a.SUP,a.TABLE,a.TT,a.U,a.UL,a.VAR]);function Tu(e){const t=e.tagID;return t===a.FONT&&e.attrs.some(({name:r})=>r===tt.COLOR||r===tt.SIZE||r===tt.FACE)||Eu.has(t)}function Kn(e){for(let t=0;t<e.attrs.length;t++)if(e.attrs[t].name===pu){e.attrs[t].name=fu;break}}function Yn(e){for(let t=0;t<e.attrs.length;t++){const s=bu.get(e.attrs[t].name);s!=null&&(e.attrs[t].name=s)}}function Cr(e){for(let t=0;t<e.attrs.length;t++){const s=gu.get(e.attrs[t].name);s&&(e.attrs[t].prefix=s.prefix,e.attrs[t].name=s.name,e.attrs[t].namespace=s.namespace)}}function vu(e){const t=ku.get(e.tagName);t!=null&&(e.tagName=t,e.tagID=ha(e.tagName))}function yu(e,t){return t===E.MATHML&&(e===a.MI||e===a.MO||e===a.MN||e===a.MS||e===a.MTEXT)}function Su(e,t,s){if(t===E.MATHML&&e===a.ANNOTATION_XML){for(let r=0;r<s.length;r++)if(s[r].name===tt.ENCODING){const i=s[r].value.toLowerCase();return i===zi.TEXT_HTML||i===zi.APPLICATION_XML}}return t===E.SVG&&(e===a.FOREIGN_OBJECT||e===a.DESC||e===a.TITLE)}function _u(e,t,s,r){return(!r||r===E.HTML)&&Su(e,t,s)||(!r||r===E.MATHML)&&yu(e,t)}const xu="hidden",Au=8,Iu=3;var l;(function(e){e[e.INITIAL=0]="INITIAL",e[e.BEFORE_HTML=1]="BEFORE_HTML",e[e.BEFORE_HEAD=2]="BEFORE_HEAD",e[e.IN_HEAD=3]="IN_HEAD",e[e.IN_HEAD_NO_SCRIPT=4]="IN_HEAD_NO_SCRIPT",e[e.AFTER_HEAD=5]="AFTER_HEAD",e[e.IN_BODY=6]="IN_BODY",e[e.TEXT=7]="TEXT",e[e.IN_TABLE=8]="IN_TABLE",e[e.IN_TABLE_TEXT=9]="IN_TABLE_TEXT",e[e.IN_CAPTION=10]="IN_CAPTION",e[e.IN_COLUMN_GROUP=11]="IN_COLUMN_GROUP",e[e.IN_TABLE_BODY=12]="IN_TABLE_BODY",e[e.IN_ROW=13]="IN_ROW",e[e.IN_CELL=14]="IN_CELL",e[e.IN_SELECT=15]="IN_SELECT",e[e.IN_SELECT_IN_TABLE=16]="IN_SELECT_IN_TABLE",e[e.IN_TEMPLATE=17]="IN_TEMPLATE",e[e.AFTER_BODY=18]="AFTER_BODY",e[e.IN_FRAMESET=19]="IN_FRAMESET",e[e.AFTER_FRAMESET=20]="AFTER_FRAMESET",e[e.AFTER_AFTER_BODY=21]="AFTER_AFTER_BODY",e[e.AFTER_AFTER_FRAMESET=22]="AFTER_AFTER_FRAMESET"})(l||(l={}));const Cu={startLine:-1,startCol:-1,startOffset:-1,endLine:-1,endCol:-1,endOffset:-1},Wn=new Set([a.TABLE,a.TBODY,a.TFOOT,a.THEAD,a.TR]),Ki={scriptingEnabled:!0,sourceCodeLocationInfo:!1,treeAdapter:oe,onParseError:null};class qn{constructor(t,s,r=null,i=null){this.fragmentContext=r,this.scriptHandler=i,this.currentToken=null,this.stopped=!1,this.insertionMode=l.INITIAL,this.originalInsertionMode=l.INITIAL,this.headElement=null,this.formElement=null,this.currentNotInHTML=!1,this.tmplInsertionModeStack=[],this.pendingCharacterTokens=[],this.hasNonWhitespacePendingCharacterToken=!1,this.framesetOk=!0,this.skipNextNewLine=!1,this.fosterParentingEnabled=!1,this.options={...Ki,...t},this.treeAdapter=this.options.treeAdapter,this.onParseError=this.options.onParseError,this.onParseError&&(this.options.sourceCodeLocationInfo=!0),this.document=s??this.treeAdapter.createDocument(),this.tokenizer=new Jc(this.options,this),this.activeFormattingElements=new nu(this.treeAdapter),this.fragmentContextID=r?ha(this.treeAdapter.getTagName(r)):a.UNKNOWN,this._setContextModes(r??this.document,this.fragmentContextID),this.openElements=new iu(this.document,this.treeAdapter,this)}static parse(t,s){const r=new this(s);return r.tokenizer.write(t,!0),r.document}static getFragmentParser(t,s){const r={...Ki,...s};t??(t=r.treeAdapter.createElement(m.TEMPLATE,E.HTML,[]));const i=r.treeAdapter.createElement("documentmock",E.HTML,[]),n=new this(r,i,t);return n.fragmentContextID===a.TEMPLATE&&n.tmplInsertionModeStack.unshift(l.IN_TEMPLATE),n._initTokenizerForFragmentParsing(),n._insertFakeRootElement(),n._resetInsertionMode(),n._findFormInFragmentContext(),n}getFragment(){const t=this.treeAdapter.getFirstChild(this.document),s=this.treeAdapter.createDocumentFragment();return this._adoptNodes(t,s),s}_err(t,s,r){var i;if(!this.onParseError)return;const n=(i=t.location)!==null&&i!==void 0?i:Cu,c={code:s,startLine:n.startLine,startCol:n.startCol,startOffset:n.startOffset,endLine:r?n.startLine:n.endLine,endCol:r?n.startCol:n.endCol,endOffset:r?n.startOffset:n.endOffset};this.onParseError(c)}onItemPush(t,s,r){var i,n;(n=(i=this.treeAdapter).onItemPush)===null||n===void 0||n.call(i,t),r&&this.openElements.stackTop>0&&this._setContextModes(t,s)}onItemPop(t,s){var r,i;if(this.options.sourceCodeLocationInfo&&this._setEndLocation(t,this.currentToken),(i=(r=this.treeAdapter).onItemPop)===null||i===void 0||i.call(r,t,this.openElements.current),s){let n,c;this.openElements.stackTop===0&&this.fragmentContext?(n=this.fragmentContext,c=this.fragmentContextID):{current:n,currentTagId:c}=this.openElements,this._setContextModes(n,c)}}_setContextModes(t,s){const r=t===this.document||t&&this.treeAdapter.getNamespaceURI(t)===E.HTML;this.currentNotInHTML=!r,this.tokenizer.inForeignNode=!r&&t!==void 0&&s!==void 0&&!this._isIntegrationPoint(s,t)}_switchToTextParsing(t,s){this._insertElement(t,E.HTML),this.tokenizer.state=s,this.originalInsertionMode=this.insertionMode,this.insertionMode=l.TEXT}switchToPlaintextParsing(){this.insertionMode=l.TEXT,this.originalInsertionMode=l.IN_BODY,this.tokenizer.state=ne.PLAINTEXT}_getAdjustedCurrentElement(){return this.openElements.stackTop===0&&this.fragmentContext?this.fragmentContext:this.openElements.current}_findFormInFragmentContext(){let t=this.fragmentContext;for(;t;){if(this.treeAdapter.getTagName(t)===m.FORM){this.formElement=t;break}t=this.treeAdapter.getParentNode(t)}}_initTokenizerForFragmentParsing(){if(!(!this.fragmentContext||this.treeAdapter.getNamespaceURI(this.fragmentContext)!==E.HTML))switch(this.fragmentContextID){case a.TITLE:case a.TEXTAREA:{this.tokenizer.state=ne.RCDATA;break}case a.STYLE:case a.XMP:case a.IFRAME:case a.NOEMBED:case a.NOFRAMES:case a.NOSCRIPT:{this.tokenizer.state=ne.RAWTEXT;break}case a.SCRIPT:{this.tokenizer.state=ne.SCRIPT_DATA;break}case a.PLAINTEXT:{this.tokenizer.state=ne.PLAINTEXT;break}}}_setDocumentType(t){const s=t.name||"",r=t.publicId||"",i=t.systemId||"";if(this.treeAdapter.setDocumentType(this.document,s,r,i),t.location){const c=this.treeAdapter.getChildNodes(this.document).find(h=>this.treeAdapter.isDocumentTypeNode(h));c&&this.treeAdapter.setNodeSourceCodeLocation(c,t.location)}}_attachElementToTree(t,s){if(this.options.sourceCodeLocationInfo){const r=s&&{...s,startTag:s};this.treeAdapter.setNodeSourceCodeLocation(t,r)}if(this._shouldFosterParentOnInsertion())this._fosterParentElement(t);else{const r=this.openElements.currentTmplContentOrNode;this.treeAdapter.appendChild(r??this.document,t)}}_appendElement(t,s){const r=this.treeAdapter.createElement(t.tagName,s,t.attrs);this._attachElementToTree(r,t.location)}_insertElement(t,s){const r=this.treeAdapter.createElement(t.tagName,s,t.attrs);this._attachElementToTree(r,t.location),this.openElements.push(r,t.tagID)}_insertFakeElement(t,s){const r=this.treeAdapter.createElement(t,E.HTML,[]);this._attachElementToTree(r,null),this.openElements.push(r,s)}_insertTemplate(t){const s=this.treeAdapter.createElement(t.tagName,E.HTML,t.attrs),r=this.treeAdapter.createDocumentFragment();this.treeAdapter.setTemplateContent(s,r),this._attachElementToTree(s,t.location),this.openElements.push(s,t.tagID),this.options.sourceCodeLocationInfo&&this.treeAdapter.setNodeSourceCodeLocation(r,null)}_insertFakeRootElement(){const t=this.treeAdapter.createElement(m.HTML,E.HTML,[]);this.options.sourceCodeLocationInfo&&this.treeAdapter.setNodeSourceCodeLocation(t,null),this.treeAdapter.appendChild(this.openElements.current,t),this.openElements.push(t,a.HTML)}_appendCommentNode(t,s){const r=this.treeAdapter.createCommentNode(t.data);this.treeAdapter.appendChild(s,r),this.options.sourceCodeLocationInfo&&this.treeAdapter.setNodeSourceCodeLocation(r,t.location)}_insertCharacters(t){let s,r;if(this._shouldFosterParentOnInsertion()?({parent:s,beforeElement:r}=this._findFosterParentingLocation(),r?this.treeAdapter.insertTextBefore(s,t.chars,r):this.treeAdapter.insertText(s,t.chars)):(s=this.openElements.currentTmplContentOrNode,this.treeAdapter.insertText(s,t.chars)),!t.location)return;const i=this.treeAdapter.getChildNodes(s),n=r?i.lastIndexOf(r):i.length,c=i[n-1];if(this.treeAdapter.getNodeSourceCodeLocation(c)){const{endLine:d,endCol:p,endOffset:b}=t.location;this.treeAdapter.updateNodeSourceCodeLocation(c,{endLine:d,endCol:p,endOffset:b})}else this.options.sourceCodeLocationInfo&&this.treeAdapter.setNodeSourceCodeLocation(c,t.location)}_adoptNodes(t,s){for(let r=this.treeAdapter.getFirstChild(t);r;r=this.treeAdapter.getFirstChild(t))this.treeAdapter.detachNode(r),this.treeAdapter.appendChild(s,r)}_setEndLocation(t,s){if(this.treeAdapter.getNodeSourceCodeLocation(t)&&s.location){const r=s.location,i=this.treeAdapter.getTagName(t),n=s.type===O.END_TAG&&i===s.tagName?{endTag:{...r},endLine:r.endLine,endCol:r.endCol,endOffset:r.endOffset}:{endLine:r.startLine,endCol:r.startCol,endOffset:r.startOffset};this.treeAdapter.updateNodeSourceCodeLocation(t,n)}}shouldProcessStartTagTokenInForeignContent(t){if(!this.currentNotInHTML)return!1;let s,r;return this.openElements.stackTop===0&&this.fragmentContext?(s=this.fragmentContext,r=this.fragmentContextID):{current:s,currentTagId:r}=this.openElements,t.tagID===a.SVG&&this.treeAdapter.getTagName(s)===m.ANNOTATION_XML&&this.treeAdapter.getNamespaceURI(s)===E.MATHML?!1:this.tokenizer.inForeignNode||(t.tagID===a.MGLYPH||t.tagID===a.MALIGNMARK)&&r!==void 0&&!this._isIntegrationPoint(r,s,E.HTML)}_processToken(t){switch(t.type){case O.CHARACTER:{this.onCharacter(t);break}case O.NULL_CHARACTER:{this.onNullCharacter(t);break}case O.COMMENT:{this.onComment(t);break}case O.DOCTYPE:{this.onDoctype(t);break}case O.START_TAG:{this._processStartTag(t);break}case O.END_TAG:{this.onEndTag(t);break}case O.EOF:{this.onEof(t);break}case O.WHITESPACE_CHARACTER:{this.onWhitespaceCharacter(t);break}}}_isIntegrationPoint(t,s,r){const i=this.treeAdapter.getNamespaceURI(s),n=this.treeAdapter.getAttrList(s);return _u(t,i,n,r)}_reconstructActiveFormattingElements(){const t=this.activeFormattingElements.entries.length;if(t){const s=this.activeFormattingElements.entries.findIndex(i=>i.type===ye.Marker||this.openElements.contains(i.element)),r=s===-1?t-1:s-1;for(let i=r;i>=0;i--){const n=this.activeFormattingElements.entries[i];this._insertElement(n.token,this.treeAdapter.getNamespaceURI(n.element)),n.element=this.openElements.current}}}_closeTableCell(){this.openElements.generateImpliedEndTags(),this.openElements.popUntilTableCellPopped(),this.activeFormattingElements.clearToLastMarker(),this.insertionMode=l.IN_ROW}_closePElement(){this.openElements.generateImpliedEndTagsWithExclusion(a.P),this.openElements.popUntilTagNamePopped(a.P)}_resetInsertionMode(){for(let t=this.openElements.stackTop;t>=0;t--)switch(t===0&&this.fragmentContext?this.fragmentContextID:this.openElements.tagIDs[t]){case a.TR:{this.insertionMode=l.IN_ROW;return}case a.TBODY:case a.THEAD:case a.TFOOT:{this.insertionMode=l.IN_TABLE_BODY;return}case a.CAPTION:{this.insertionMode=l.IN_CAPTION;return}case a.COLGROUP:{this.insertionMode=l.IN_COLUMN_GROUP;return}case a.TABLE:{this.insertionMode=l.IN_TABLE;return}case a.BODY:{this.insertionMode=l.IN_BODY;return}case a.FRAMESET:{this.insertionMode=l.IN_FRAMESET;return}case a.SELECT:{this._resetInsertionModeForSelect(t);return}case a.TEMPLATE:{this.insertionMode=this.tmplInsertionModeStack[0];return}case a.HTML:{this.insertionMode=this.headElement?l.AFTER_HEAD:l.BEFORE_HEAD;return}case a.TD:case a.TH:{if(t>0){this.insertionMode=l.IN_CELL;return}break}case a.HEAD:{if(t>0){this.insertionMode=l.IN_HEAD;return}break}}this.insertionMode=l.IN_BODY}_resetInsertionModeForSelect(t){if(t>0)for(let s=t-1;s>0;s--){const r=this.openElements.tagIDs[s];if(r===a.TEMPLATE)break;if(r===a.TABLE){this.insertionMode=l.IN_SELECT_IN_TABLE;return}}this.insertionMode=l.IN_SELECT}_isElementCausesFosterParenting(t){return Wn.has(t)}_shouldFosterParentOnInsertion(){return this.fosterParentingEnabled&&this.openElements.currentTagId!==void 0&&this._isElementCausesFosterParenting(this.openElements.currentTagId)}_findFosterParentingLocation(){for(let t=this.openElements.stackTop;t>=0;t--){const s=this.openElements.items[t];switch(this.openElements.tagIDs[t]){case a.TEMPLATE:{if(this.treeAdapter.getNamespaceURI(s)===E.HTML)return{parent:this.treeAdapter.getTemplateContent(s),beforeElement:null};break}case a.TABLE:{const r=this.treeAdapter.getParentNode(s);return r?{parent:r,beforeElement:s}:{parent:this.openElements.items[t-1],beforeElement:null}}}}return{parent:this.openElements.items[0],beforeElement:null}}_fosterParentElement(t){const s=this._findFosterParentingLocation();s.beforeElement?this.treeAdapter.insertBefore(s.parent,t,s.beforeElement):this.treeAdapter.appendChild(s.parent,t)}_isSpecialElement(t,s){const r=this.treeAdapter.getNamespaceURI(t);return Gc[r].has(s)}onCharacter(t){if(this.skipNextNewLine=!1,this.tokenizer.inForeignNode){rd(this,t);return}switch(this.insertionMode){case l.INITIAL:{Nt(this,t);break}case l.BEFORE_HTML:{Bt(this,t);break}case l.BEFORE_HEAD:{Ft(this,t);break}case l.IN_HEAD:{Ut(this,t);break}case l.IN_HEAD_NO_SCRIPT:{$t(this,t);break}case l.AFTER_HEAD:{jt(this,t);break}case l.IN_BODY:case l.IN_CAPTION:case l.IN_CELL:case l.IN_TEMPLATE:{Vn(this,t);break}case l.TEXT:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:{this._insertCharacters(t);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ca(this,t);break}case l.IN_TABLE_TEXT:{to(this,t);break}case l.IN_COLUMN_GROUP:{Ss(this,t);break}case l.AFTER_BODY:{_s(this,t);break}case l.AFTER_AFTER_BODY:{gs(this,t);break}}}onNullCharacter(t){if(this.skipNextNewLine=!1,this.tokenizer.inForeignNode){ad(this,t);return}switch(this.insertionMode){case l.INITIAL:{Nt(this,t);break}case l.BEFORE_HTML:{Bt(this,t);break}case l.BEFORE_HEAD:{Ft(this,t);break}case l.IN_HEAD:{Ut(this,t);break}case l.IN_HEAD_NO_SCRIPT:{$t(this,t);break}case l.AFTER_HEAD:{jt(this,t);break}case l.TEXT:{this._insertCharacters(t);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ca(this,t);break}case l.IN_COLUMN_GROUP:{Ss(this,t);break}case l.AFTER_BODY:{_s(this,t);break}case l.AFTER_AFTER_BODY:{gs(this,t);break}}}onComment(t){if(this.skipNextNewLine=!1,this.currentNotInHTML){Ha(this,t);return}switch(this.insertionMode){case l.INITIAL:case l.BEFORE_HTML:case l.BEFORE_HEAD:case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:case l.IN_BODY:case l.IN_TABLE:case l.IN_CAPTION:case l.IN_COLUMN_GROUP:case l.IN_TABLE_BODY:case l.IN_ROW:case l.IN_CELL:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:case l.IN_TEMPLATE:case l.IN_FRAMESET:case l.AFTER_FRAMESET:{Ha(this,t);break}case l.IN_TABLE_TEXT:{Rt(this,t);break}case l.AFTER_BODY:{Pu(this,t);break}case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{Mu(this,t);break}}}onDoctype(t){switch(this.skipNextNewLine=!1,this.insertionMode){case l.INITIAL:{Hu(this,t);break}case l.BEFORE_HEAD:case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:{this._err(t,f.misplacedDoctype);break}case l.IN_TABLE_TEXT:{Rt(this,t);break}}}onStartTag(t){this.skipNextNewLine=!1,this.currentToken=t,this._processStartTag(t),t.selfClosing&&!t.ackSelfClosing&&this._err(t,f.nonVoidHtmlElementStartTagWithTrailingSolidus)}_processStartTag(t){this.shouldProcessStartTagTokenInForeignContent(t)?id(this,t):this._startTagOutsideForeignContent(t)}_startTagOutsideForeignContent(t){switch(this.insertionMode){case l.INITIAL:{Nt(this,t);break}case l.BEFORE_HTML:{Bu(this,t);break}case l.BEFORE_HEAD:{Uu(this,t);break}case l.IN_HEAD:{ke(this,t);break}case l.IN_HEAD_NO_SCRIPT:{zu(this,t);break}case l.AFTER_HEAD:{Yu(this,t);break}case l.IN_BODY:{Z(this,t);break}case l.IN_TABLE:{Et(this,t);break}case l.IN_TABLE_TEXT:{Rt(this,t);break}case l.IN_CAPTION:{$l(this,t);break}case l.IN_COLUMN_GROUP:{Rr(this,t);break}case l.IN_TABLE_BODY:{fa(this,t);break}case l.IN_ROW:{ba(this,t);break}case l.IN_CELL:{Kl(this,t);break}case l.IN_SELECT:{ro(this,t);break}case l.IN_SELECT_IN_TABLE:{Wl(this,t);break}case l.IN_TEMPLATE:{Gl(this,t);break}case l.AFTER_BODY:{Ql(this,t);break}case l.IN_FRAMESET:{Xl(this,t);break}case l.AFTER_FRAMESET:{Zl(this,t);break}case l.AFTER_AFTER_BODY:{td(this,t);break}case l.AFTER_AFTER_FRAMESET:{sd(this,t);break}}}onEndTag(t){this.skipNextNewLine=!1,this.currentToken=t,this.currentNotInHTML?nd(this,t):this._endTagOutsideForeignContent(t)}_endTagOutsideForeignContent(t){switch(this.insertionMode){case l.INITIAL:{Nt(this,t);break}case l.BEFORE_HTML:{Fu(this,t);break}case l.BEFORE_HEAD:{$u(this,t);break}case l.IN_HEAD:{ju(this,t);break}case l.IN_HEAD_NO_SCRIPT:{Ku(this,t);break}case l.AFTER_HEAD:{Wu(this,t);break}case l.IN_BODY:{pa(this,t);break}case l.TEXT:{Rl(this,t);break}case l.IN_TABLE:{qt(this,t);break}case l.IN_TABLE_TEXT:{Rt(this,t);break}case l.IN_CAPTION:{jl(this,t);break}case l.IN_COLUMN_GROUP:{zl(this,t);break}case l.IN_TABLE_BODY:{Ba(this,t);break}case l.IN_ROW:{ao(this,t);break}case l.IN_CELL:{Yl(this,t);break}case l.IN_SELECT:{io(this,t);break}case l.IN_SELECT_IN_TABLE:{ql(this,t);break}case l.IN_TEMPLATE:{Vl(this,t);break}case l.AFTER_BODY:{oo(this,t);break}case l.IN_FRAMESET:{Jl(this,t);break}case l.AFTER_FRAMESET:{ed(this,t);break}case l.AFTER_AFTER_BODY:{gs(this,t);break}}}onEof(t){switch(this.insertionMode){case l.INITIAL:{Nt(this,t);break}case l.BEFORE_HTML:{Bt(this,t);break}case l.BEFORE_HEAD:{Ft(this,t);break}case l.IN_HEAD:{Ut(this,t);break}case l.IN_HEAD_NO_SCRIPT:{$t(this,t);break}case l.AFTER_HEAD:{jt(this,t);break}case l.IN_BODY:case l.IN_TABLE:case l.IN_CAPTION:case l.IN_COLUMN_GROUP:case l.IN_TABLE_BODY:case l.IN_ROW:case l.IN_CELL:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:{Zn(this,t);break}case l.TEXT:{Ll(this,t);break}case l.IN_TABLE_TEXT:{Rt(this,t);break}case l.IN_TEMPLATE:{no(this,t);break}case l.AFTER_BODY:case l.IN_FRAMESET:case l.AFTER_FRAMESET:case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{Nr(this,t);break}}}onWhitespaceCharacter(t){if(this.skipNextNewLine&&(this.skipNextNewLine=!1,t.chars.charCodeAt(0)===o.LINE_FEED)){if(t.chars.length===1)return;t.chars=t.chars.substr(1)}if(this.tokenizer.inForeignNode){this._insertCharacters(t);return}switch(this.insertionMode){case l.IN_HEAD:case l.IN_HEAD_NO_SCRIPT:case l.AFTER_HEAD:case l.TEXT:case l.IN_COLUMN_GROUP:case l.IN_SELECT:case l.IN_SELECT_IN_TABLE:case l.IN_FRAMESET:case l.AFTER_FRAMESET:{this._insertCharacters(t);break}case l.IN_BODY:case l.IN_CAPTION:case l.IN_CELL:case l.IN_TEMPLATE:case l.AFTER_BODY:case l.AFTER_AFTER_BODY:case l.AFTER_AFTER_FRAMESET:{Gn(this,t);break}case l.IN_TABLE:case l.IN_TABLE_BODY:case l.IN_ROW:{Ca(this,t);break}case l.IN_TABLE_TEXT:{eo(this,t);break}}}}function wu(e,t){let s=e.activeFormattingElements.getElementEntryInScopeWithTagName(t.tagName);return s?e.openElements.contains(s.element)?e.openElements.hasInScope(t.tagID)||(s=null):(e.activeFormattingElements.removeEntry(s),s=null):Jn(e,t),s}function Nu(e,t){let s=null,r=e.openElements.stackTop;for(;r>=0;r--){const i=e.openElements.items[r];if(i===t.element)break;e._isSpecialElement(i,e.openElements.tagIDs[r])&&(s=i)}return s||(e.openElements.shortenToLength(Math.max(r,0)),e.activeFormattingElements.removeEntry(t)),s}function Ru(e,t,s){let r=t,i=e.openElements.getCommonAncestor(t);for(let n=0,c=i;c!==s;n++,c=i){i=e.openElements.getCommonAncestor(c);const h=e.activeFormattingElements.getElementEntry(c),d=h&&n>=Iu;!h||d?(d&&e.activeFormattingElements.removeEntry(h),e.openElements.remove(c)):(c=Lu(e,h),r===t&&(e.activeFormattingElements.bookmark=h),e.treeAdapter.detachNode(r),e.treeAdapter.appendChild(c,r),r=c)}return r}function Lu(e,t){const s=e.treeAdapter.getNamespaceURI(t.element),r=e.treeAdapter.createElement(t.token.tagName,s,t.token.attrs);return e.openElements.replace(t.element,r),t.element=r,r}function Ou(e,t,s){const r=e.treeAdapter.getTagName(t),i=ha(r);if(e._isElementCausesFosterParenting(i))e._fosterParentElement(s);else{const n=e.treeAdapter.getNamespaceURI(t);i===a.TEMPLATE&&n===E.HTML&&(t=e.treeAdapter.getTemplateContent(t)),e.treeAdapter.appendChild(t,s)}}function Du(e,t,s){const r=e.treeAdapter.getNamespaceURI(s.element),{token:i}=s,n=e.treeAdapter.createElement(i.tagName,r,i.attrs);e._adoptNodes(t,n),e.treeAdapter.appendChild(t,n),e.activeFormattingElements.insertElementAfterBookmark(n,i),e.activeFormattingElements.removeEntry(s),e.openElements.remove(s.element),e.openElements.insertAfter(t,n,i.tagID)}function wr(e,t){for(let s=0;s<Au;s++){const r=wu(e,t);if(!r)break;const i=Nu(e,r);if(!i)break;e.activeFormattingElements.bookmark=r;const n=Ru(e,i,r.element),c=e.openElements.getCommonAncestor(r.element);e.treeAdapter.detachNode(n),c&&Ou(e,c,n),Du(e,i,r)}}function Ha(e,t){e._appendCommentNode(t,e.openElements.currentTmplContentOrNode)}function Pu(e,t){e._appendCommentNode(t,e.openElements.items[0])}function Mu(e,t){e._appendCommentNode(t,e.document)}function Nr(e,t){if(e.stopped=!0,t.location){const s=e.fragmentContext?0:2;for(let r=e.openElements.stackTop;r>=s;r--)e._setEndLocation(e.openElements.items[r],t);if(!e.fragmentContext&&e.openElements.stackTop>=0){const r=e.openElements.items[0],i=e.treeAdapter.getNodeSourceCodeLocation(r);if(i&&!i.endTag&&(e._setEndLocation(r,t),e.openElements.stackTop>=1)){const n=e.openElements.items[1],c=e.treeAdapter.getNodeSourceCodeLocation(n);c&&!c.endTag&&e._setEndLocation(n,t)}}}}function Hu(e,t){e._setDocumentType(t);const s=t.forceQuirks?he.QUIRKS:mu(t);hu(t)||e._err(t,f.nonConformingDoctype),e.treeAdapter.setDocumentMode(e.document,s),e.insertionMode=l.BEFORE_HTML}function Nt(e,t){e._err(t,f.missingDoctype,!0),e.treeAdapter.setDocumentMode(e.document,he.QUIRKS),e.insertionMode=l.BEFORE_HTML,e._processToken(t)}function Bu(e,t){t.tagID===a.HTML?(e._insertElement(t,E.HTML),e.insertionMode=l.BEFORE_HEAD):Bt(e,t)}function Fu(e,t){const s=t.tagID;(s===a.HTML||s===a.HEAD||s===a.BODY||s===a.BR)&&Bt(e,t)}function Bt(e,t){e._insertFakeRootElement(),e.insertionMode=l.BEFORE_HEAD,e._processToken(t)}function Uu(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.HEAD:{e._insertElement(t,E.HTML),e.headElement=e.openElements.current,e.insertionMode=l.IN_HEAD;break}default:Ft(e,t)}}function $u(e,t){const s=t.tagID;s===a.HEAD||s===a.BODY||s===a.HTML||s===a.BR?Ft(e,t):e._err(t,f.endTagWithoutMatchingOpenElement)}function Ft(e,t){e._insertFakeElement(m.HEAD,a.HEAD),e.headElement=e.openElements.current,e.insertionMode=l.IN_HEAD,e._processToken(t)}function ke(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.BASE:case a.BASEFONT:case a.BGSOUND:case a.LINK:case a.META:{e._appendElement(t,E.HTML),t.ackSelfClosing=!0;break}case a.TITLE:{e._switchToTextParsing(t,ne.RCDATA);break}case a.NOSCRIPT:{e.options.scriptingEnabled?e._switchToTextParsing(t,ne.RAWTEXT):(e._insertElement(t,E.HTML),e.insertionMode=l.IN_HEAD_NO_SCRIPT);break}case a.NOFRAMES:case a.STYLE:{e._switchToTextParsing(t,ne.RAWTEXT);break}case a.SCRIPT:{e._switchToTextParsing(t,ne.SCRIPT_DATA);break}case a.TEMPLATE:{e._insertTemplate(t),e.activeFormattingElements.insertMarker(),e.framesetOk=!1,e.insertionMode=l.IN_TEMPLATE,e.tmplInsertionModeStack.unshift(l.IN_TEMPLATE);break}case a.HEAD:{e._err(t,f.misplacedStartTagForHeadElement);break}default:Ut(e,t)}}function ju(e,t){switch(t.tagID){case a.HEAD:{e.openElements.pop(),e.insertionMode=l.AFTER_HEAD;break}case a.BODY:case a.BR:case a.HTML:{Ut(e,t);break}case a.TEMPLATE:{it(e,t);break}default:e._err(t,f.endTagWithoutMatchingOpenElement)}}function it(e,t){e.openElements.tmplCount>0?(e.openElements.generateImpliedEndTagsThoroughly(),e.openElements.currentTagId!==a.TEMPLATE&&e._err(t,f.closingOfElementWithOpenChildElements),e.openElements.popUntilTagNamePopped(a.TEMPLATE),e.activeFormattingElements.clearToLastMarker(),e.tmplInsertionModeStack.shift(),e._resetInsertionMode()):e._err(t,f.endTagWithoutMatchingOpenElement)}function Ut(e,t){e.openElements.pop(),e.insertionMode=l.AFTER_HEAD,e._processToken(t)}function zu(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.BASEFONT:case a.BGSOUND:case a.HEAD:case a.LINK:case a.META:case a.NOFRAMES:case a.STYLE:{ke(e,t);break}case a.NOSCRIPT:{e._err(t,f.nestedNoscriptInHead);break}default:$t(e,t)}}function Ku(e,t){switch(t.tagID){case a.NOSCRIPT:{e.openElements.pop(),e.insertionMode=l.IN_HEAD;break}case a.BR:{$t(e,t);break}default:e._err(t,f.endTagWithoutMatchingOpenElement)}}function $t(e,t){const s=t.type===O.EOF?f.openElementsLeftAfterEof:f.disallowedContentInNoscriptInHead;e._err(t,s),e.openElements.pop(),e.insertionMode=l.IN_HEAD,e._processToken(t)}function Yu(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.BODY:{e._insertElement(t,E.HTML),e.framesetOk=!1,e.insertionMode=l.IN_BODY;break}case a.FRAMESET:{e._insertElement(t,E.HTML),e.insertionMode=l.IN_FRAMESET;break}case a.BASE:case a.BASEFONT:case a.BGSOUND:case a.LINK:case a.META:case a.NOFRAMES:case a.SCRIPT:case a.STYLE:case a.TEMPLATE:case a.TITLE:{e._err(t,f.abandonedHeadElementChild),e.openElements.push(e.headElement,a.HEAD),ke(e,t),e.openElements.remove(e.headElement);break}case a.HEAD:{e._err(t,f.misplacedStartTagForHeadElement);break}default:jt(e,t)}}function Wu(e,t){switch(t.tagID){case a.BODY:case a.HTML:case a.BR:{jt(e,t);break}case a.TEMPLATE:{it(e,t);break}default:e._err(t,f.endTagWithoutMatchingOpenElement)}}function jt(e,t){e._insertFakeElement(m.BODY,a.BODY),e.insertionMode=l.IN_BODY,ma(e,t)}function ma(e,t){switch(t.type){case O.CHARACTER:{Vn(e,t);break}case O.WHITESPACE_CHARACTER:{Gn(e,t);break}case O.COMMENT:{Ha(e,t);break}case O.START_TAG:{Z(e,t);break}case O.END_TAG:{pa(e,t);break}case O.EOF:{Zn(e,t);break}}}function Gn(e,t){e._reconstructActiveFormattingElements(),e._insertCharacters(t)}function Vn(e,t){e._reconstructActiveFormattingElements(),e._insertCharacters(t),e.framesetOk=!1}function qu(e,t){e.openElements.tmplCount===0&&e.treeAdapter.adoptAttributes(e.openElements.items[0],t.attrs)}function Gu(e,t){const s=e.openElements.tryPeekProperlyNestedBodyElement();s&&e.openElements.tmplCount===0&&(e.framesetOk=!1,e.treeAdapter.adoptAttributes(s,t.attrs))}function Vu(e,t){const s=e.openElements.tryPeekProperlyNestedBodyElement();e.framesetOk&&s&&(e.treeAdapter.detachNode(s),e.openElements.popAllUpToHtmlElement(),e._insertElement(t,E.HTML),e.insertionMode=l.IN_FRAMESET)}function Qu(e,t){e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._insertElement(t,E.HTML)}function Xu(e,t){e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e.openElements.currentTagId!==void 0&&Ma.has(e.openElements.currentTagId)&&e.openElements.pop(),e._insertElement(t,E.HTML)}function Ju(e,t){e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._insertElement(t,E.HTML),e.skipNextNewLine=!0,e.framesetOk=!1}function Zu(e,t){const s=e.openElements.tmplCount>0;(!e.formElement||s)&&(e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._insertElement(t,E.HTML),s||(e.formElement=e.openElements.current))}function el(e,t){e.framesetOk=!1;const s=t.tagID;for(let r=e.openElements.stackTop;r>=0;r--){const i=e.openElements.tagIDs[r];if(s===a.LI&&i===a.LI||(s===a.DD||s===a.DT)&&(i===a.DD||i===a.DT)){e.openElements.generateImpliedEndTagsWithExclusion(i),e.openElements.popUntilTagNamePopped(i);break}if(i!==a.ADDRESS&&i!==a.DIV&&i!==a.P&&e._isSpecialElement(e.openElements.items[r],i))break}e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._insertElement(t,E.HTML)}function tl(e,t){e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._insertElement(t,E.HTML),e.tokenizer.state=ne.PLAINTEXT}function sl(e,t){e.openElements.hasInScope(a.BUTTON)&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilTagNamePopped(a.BUTTON)),e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML),e.framesetOk=!1}function al(e,t){const s=e.activeFormattingElements.getElementEntryInScopeWithTagName(m.A);s&&(wr(e,t),e.openElements.remove(s.element),e.activeFormattingElements.removeEntry(s)),e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML),e.activeFormattingElements.pushElement(e.openElements.current,t)}function rl(e,t){e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML),e.activeFormattingElements.pushElement(e.openElements.current,t)}function il(e,t){e._reconstructActiveFormattingElements(),e.openElements.hasInScope(a.NOBR)&&(wr(e,t),e._reconstructActiveFormattingElements()),e._insertElement(t,E.HTML),e.activeFormattingElements.pushElement(e.openElements.current,t)}function nl(e,t){e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML),e.activeFormattingElements.insertMarker(),e.framesetOk=!1}function ol(e,t){e.treeAdapter.getDocumentMode(e.document)!==he.QUIRKS&&e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._insertElement(t,E.HTML),e.framesetOk=!1,e.insertionMode=l.IN_TABLE}function Qn(e,t){e._reconstructActiveFormattingElements(),e._appendElement(t,E.HTML),e.framesetOk=!1,t.ackSelfClosing=!0}function Xn(e){const t=Bn(e,tt.TYPE);return t!=null&&t.toLowerCase()===xu}function cl(e,t){e._reconstructActiveFormattingElements(),e._appendElement(t,E.HTML),Xn(t)||(e.framesetOk=!1),t.ackSelfClosing=!0}function ul(e,t){e._appendElement(t,E.HTML),t.ackSelfClosing=!0}function ll(e,t){e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._appendElement(t,E.HTML),e.framesetOk=!1,t.ackSelfClosing=!0}function dl(e,t){t.tagName=m.IMG,t.tagID=a.IMG,Qn(e,t)}function hl(e,t){e._insertElement(t,E.HTML),e.skipNextNewLine=!0,e.tokenizer.state=ne.RCDATA,e.originalInsertionMode=e.insertionMode,e.framesetOk=!1,e.insertionMode=l.TEXT}function ml(e,t){e.openElements.hasInButtonScope(a.P)&&e._closePElement(),e._reconstructActiveFormattingElements(),e.framesetOk=!1,e._switchToTextParsing(t,ne.RAWTEXT)}function pl(e,t){e.framesetOk=!1,e._switchToTextParsing(t,ne.RAWTEXT)}function Yi(e,t){e._switchToTextParsing(t,ne.RAWTEXT)}function fl(e,t){e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML),e.framesetOk=!1,e.insertionMode=e.insertionMode===l.IN_TABLE||e.insertionMode===l.IN_CAPTION||e.insertionMode===l.IN_TABLE_BODY||e.insertionMode===l.IN_ROW||e.insertionMode===l.IN_CELL?l.IN_SELECT_IN_TABLE:l.IN_SELECT}function bl(e,t){e.openElements.currentTagId===a.OPTION&&e.openElements.pop(),e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML)}function gl(e,t){e.openElements.hasInScope(a.RUBY)&&e.openElements.generateImpliedEndTags(),e._insertElement(t,E.HTML)}function kl(e,t){e.openElements.hasInScope(a.RUBY)&&e.openElements.generateImpliedEndTagsWithExclusion(a.RTC),e._insertElement(t,E.HTML)}function El(e,t){e._reconstructActiveFormattingElements(),Kn(t),Cr(t),t.selfClosing?e._appendElement(t,E.MATHML):e._insertElement(t,E.MATHML),t.ackSelfClosing=!0}function Tl(e,t){e._reconstructActiveFormattingElements(),Yn(t),Cr(t),t.selfClosing?e._appendElement(t,E.SVG):e._insertElement(t,E.SVG),t.ackSelfClosing=!0}function Wi(e,t){e._reconstructActiveFormattingElements(),e._insertElement(t,E.HTML)}function Z(e,t){switch(t.tagID){case a.I:case a.S:case a.B:case a.U:case a.EM:case a.TT:case a.BIG:case a.CODE:case a.FONT:case a.SMALL:case a.STRIKE:case a.STRONG:{rl(e,t);break}case a.A:{al(e,t);break}case a.H1:case a.H2:case a.H3:case a.H4:case a.H5:case a.H6:{Xu(e,t);break}case a.P:case a.DL:case a.OL:case a.UL:case a.DIV:case a.DIR:case a.NAV:case a.MAIN:case a.MENU:case a.ASIDE:case a.CENTER:case a.FIGURE:case a.FOOTER:case a.HEADER:case a.HGROUP:case a.DIALOG:case a.DETAILS:case a.ADDRESS:case a.ARTICLE:case a.SEARCH:case a.SECTION:case a.SUMMARY:case a.FIELDSET:case a.BLOCKQUOTE:case a.FIGCAPTION:{Qu(e,t);break}case a.LI:case a.DD:case a.DT:{el(e,t);break}case a.BR:case a.IMG:case a.WBR:case a.AREA:case a.EMBED:case a.KEYGEN:{Qn(e,t);break}case a.HR:{ll(e,t);break}case a.RB:case a.RTC:{gl(e,t);break}case a.RT:case a.RP:{kl(e,t);break}case a.PRE:case a.LISTING:{Ju(e,t);break}case a.XMP:{ml(e,t);break}case a.SVG:{Tl(e,t);break}case a.HTML:{qu(e,t);break}case a.BASE:case a.LINK:case a.META:case a.STYLE:case a.TITLE:case a.SCRIPT:case a.BGSOUND:case a.BASEFONT:case a.TEMPLATE:{ke(e,t);break}case a.BODY:{Gu(e,t);break}case a.FORM:{Zu(e,t);break}case a.NOBR:{il(e,t);break}case a.MATH:{El(e,t);break}case a.TABLE:{ol(e,t);break}case a.INPUT:{cl(e,t);break}case a.PARAM:case a.TRACK:case a.SOURCE:{ul(e,t);break}case a.IMAGE:{dl(e,t);break}case a.BUTTON:{sl(e,t);break}case a.APPLET:case a.OBJECT:case a.MARQUEE:{nl(e,t);break}case a.IFRAME:{pl(e,t);break}case a.SELECT:{fl(e,t);break}case a.OPTION:case a.OPTGROUP:{bl(e,t);break}case a.NOEMBED:case a.NOFRAMES:{Yi(e,t);break}case a.FRAMESET:{Vu(e,t);break}case a.TEXTAREA:{hl(e,t);break}case a.NOSCRIPT:{e.options.scriptingEnabled?Yi(e,t):Wi(e,t);break}case a.PLAINTEXT:{tl(e,t);break}case a.COL:case a.TH:case a.TD:case a.TR:case a.HEAD:case a.FRAME:case a.TBODY:case a.TFOOT:case a.THEAD:case a.CAPTION:case a.COLGROUP:break;default:Wi(e,t)}}function vl(e,t){if(e.openElements.hasInScope(a.BODY)&&(e.insertionMode=l.AFTER_BODY,e.options.sourceCodeLocationInfo)){const s=e.openElements.tryPeekProperlyNestedBodyElement();s&&e._setEndLocation(s,t)}}function yl(e,t){e.openElements.hasInScope(a.BODY)&&(e.insertionMode=l.AFTER_BODY,oo(e,t))}function Sl(e,t){const s=t.tagID;e.openElements.hasInScope(s)&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilTagNamePopped(s))}function _l(e){const t=e.openElements.tmplCount>0,{formElement:s}=e;t||(e.formElement=null),(s||t)&&e.openElements.hasInScope(a.FORM)&&(e.openElements.generateImpliedEndTags(),t?e.openElements.popUntilTagNamePopped(a.FORM):s&&e.openElements.remove(s))}function xl(e){e.openElements.hasInButtonScope(a.P)||e._insertFakeElement(m.P,a.P),e._closePElement()}function Al(e){e.openElements.hasInListItemScope(a.LI)&&(e.openElements.generateImpliedEndTagsWithExclusion(a.LI),e.openElements.popUntilTagNamePopped(a.LI))}function Il(e,t){const s=t.tagID;e.openElements.hasInScope(s)&&(e.openElements.generateImpliedEndTagsWithExclusion(s),e.openElements.popUntilTagNamePopped(s))}function Cl(e){e.openElements.hasNumberedHeaderInScope()&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilNumberedHeaderPopped())}function wl(e,t){const s=t.tagID;e.openElements.hasInScope(s)&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilTagNamePopped(s),e.activeFormattingElements.clearToLastMarker())}function Nl(e){e._reconstructActiveFormattingElements(),e._insertFakeElement(m.BR,a.BR),e.openElements.pop(),e.framesetOk=!1}function Jn(e,t){const s=t.tagName,r=t.tagID;for(let i=e.openElements.stackTop;i>0;i--){const n=e.openElements.items[i],c=e.openElements.tagIDs[i];if(r===c&&(r!==a.UNKNOWN||e.treeAdapter.getTagName(n)===s)){e.openElements.generateImpliedEndTagsWithExclusion(r),e.openElements.stackTop>=i&&e.openElements.shortenToLength(i);break}if(e._isSpecialElement(n,c))break}}function pa(e,t){switch(t.tagID){case a.A:case a.B:case a.I:case a.S:case a.U:case a.EM:case a.TT:case a.BIG:case a.CODE:case a.FONT:case a.NOBR:case a.SMALL:case a.STRIKE:case a.STRONG:{wr(e,t);break}case a.P:{xl(e);break}case a.DL:case a.UL:case a.OL:case a.DIR:case a.DIV:case a.NAV:case a.PRE:case a.MAIN:case a.MENU:case a.ASIDE:case a.BUTTON:case a.CENTER:case a.FIGURE:case a.FOOTER:case a.HEADER:case a.HGROUP:case a.DIALOG:case a.ADDRESS:case a.ARTICLE:case a.DETAILS:case a.SEARCH:case a.SECTION:case a.SUMMARY:case a.LISTING:case a.FIELDSET:case a.BLOCKQUOTE:case a.FIGCAPTION:{Sl(e,t);break}case a.LI:{Al(e);break}case a.DD:case a.DT:{Il(e,t);break}case a.H1:case a.H2:case a.H3:case a.H4:case a.H5:case a.H6:{Cl(e);break}case a.BR:{Nl(e);break}case a.BODY:{vl(e,t);break}case a.HTML:{yl(e,t);break}case a.FORM:{_l(e);break}case a.APPLET:case a.OBJECT:case a.MARQUEE:{wl(e,t);break}case a.TEMPLATE:{it(e,t);break}default:Jn(e,t)}}function Zn(e,t){e.tmplInsertionModeStack.length>0?no(e,t):Nr(e,t)}function Rl(e,t){var s;t.tagID===a.SCRIPT&&((s=e.scriptHandler)===null||s===void 0||s.call(e,e.openElements.current)),e.openElements.pop(),e.insertionMode=e.originalInsertionMode}function Ll(e,t){e._err(t,f.eofInElementThatCanContainOnlyText),e.openElements.pop(),e.insertionMode=e.originalInsertionMode,e.onEof(t)}function Ca(e,t){if(e.openElements.currentTagId!==void 0&&Wn.has(e.openElements.currentTagId))switch(e.pendingCharacterTokens.length=0,e.hasNonWhitespacePendingCharacterToken=!1,e.originalInsertionMode=e.insertionMode,e.insertionMode=l.IN_TABLE_TEXT,t.type){case O.CHARACTER:{to(e,t);break}case O.WHITESPACE_CHARACTER:{eo(e,t);break}}else rs(e,t)}function Ol(e,t){e.openElements.clearBackToTableContext(),e.activeFormattingElements.insertMarker(),e._insertElement(t,E.HTML),e.insertionMode=l.IN_CAPTION}function Dl(e,t){e.openElements.clearBackToTableContext(),e._insertElement(t,E.HTML),e.insertionMode=l.IN_COLUMN_GROUP}function Pl(e,t){e.openElements.clearBackToTableContext(),e._insertFakeElement(m.COLGROUP,a.COLGROUP),e.insertionMode=l.IN_COLUMN_GROUP,Rr(e,t)}function Ml(e,t){e.openElements.clearBackToTableContext(),e._insertElement(t,E.HTML),e.insertionMode=l.IN_TABLE_BODY}function Hl(e,t){e.openElements.clearBackToTableContext(),e._insertFakeElement(m.TBODY,a.TBODY),e.insertionMode=l.IN_TABLE_BODY,fa(e,t)}function Bl(e,t){e.openElements.hasInTableScope(a.TABLE)&&(e.openElements.popUntilTagNamePopped(a.TABLE),e._resetInsertionMode(),e._processStartTag(t))}function Fl(e,t){Xn(t)?e._appendElement(t,E.HTML):rs(e,t),t.ackSelfClosing=!0}function Ul(e,t){!e.formElement&&e.openElements.tmplCount===0&&(e._insertElement(t,E.HTML),e.formElement=e.openElements.current,e.openElements.pop())}function Et(e,t){switch(t.tagID){case a.TD:case a.TH:case a.TR:{Hl(e,t);break}case a.STYLE:case a.SCRIPT:case a.TEMPLATE:{ke(e,t);break}case a.COL:{Pl(e,t);break}case a.FORM:{Ul(e,t);break}case a.TABLE:{Bl(e,t);break}case a.TBODY:case a.TFOOT:case a.THEAD:{Ml(e,t);break}case a.INPUT:{Fl(e,t);break}case a.CAPTION:{Ol(e,t);break}case a.COLGROUP:{Dl(e,t);break}default:rs(e,t)}}function qt(e,t){switch(t.tagID){case a.TABLE:{e.openElements.hasInTableScope(a.TABLE)&&(e.openElements.popUntilTagNamePopped(a.TABLE),e._resetInsertionMode());break}case a.TEMPLATE:{it(e,t);break}case a.BODY:case a.CAPTION:case a.COL:case a.COLGROUP:case a.HTML:case a.TBODY:case a.TD:case a.TFOOT:case a.TH:case a.THEAD:case a.TR:break;default:rs(e,t)}}function rs(e,t){const s=e.fosterParentingEnabled;e.fosterParentingEnabled=!0,ma(e,t),e.fosterParentingEnabled=s}function eo(e,t){e.pendingCharacterTokens.push(t)}function to(e,t){e.pendingCharacterTokens.push(t),e.hasNonWhitespacePendingCharacterToken=!0}function Rt(e,t){let s=0;if(e.hasNonWhitespacePendingCharacterToken)for(;s<e.pendingCharacterTokens.length;s++)rs(e,e.pendingCharacterTokens[s]);else for(;s<e.pendingCharacterTokens.length;s++)e._insertCharacters(e.pendingCharacterTokens[s]);e.insertionMode=e.originalInsertionMode,e._processToken(t)}const so=new Set([a.CAPTION,a.COL,a.COLGROUP,a.TBODY,a.TD,a.TFOOT,a.TH,a.THEAD,a.TR]);function $l(e,t){const s=t.tagID;so.has(s)?e.openElements.hasInTableScope(a.CAPTION)&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilTagNamePopped(a.CAPTION),e.activeFormattingElements.clearToLastMarker(),e.insertionMode=l.IN_TABLE,Et(e,t)):Z(e,t)}function jl(e,t){const s=t.tagID;switch(s){case a.CAPTION:case a.TABLE:{e.openElements.hasInTableScope(a.CAPTION)&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilTagNamePopped(a.CAPTION),e.activeFormattingElements.clearToLastMarker(),e.insertionMode=l.IN_TABLE,s===a.TABLE&&qt(e,t));break}case a.BODY:case a.COL:case a.COLGROUP:case a.HTML:case a.TBODY:case a.TD:case a.TFOOT:case a.TH:case a.THEAD:case a.TR:break;default:pa(e,t)}}function Rr(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.COL:{e._appendElement(t,E.HTML),t.ackSelfClosing=!0;break}case a.TEMPLATE:{ke(e,t);break}default:Ss(e,t)}}function zl(e,t){switch(t.tagID){case a.COLGROUP:{e.openElements.currentTagId===a.COLGROUP&&(e.openElements.pop(),e.insertionMode=l.IN_TABLE);break}case a.TEMPLATE:{it(e,t);break}case a.COL:break;default:Ss(e,t)}}function Ss(e,t){e.openElements.currentTagId===a.COLGROUP&&(e.openElements.pop(),e.insertionMode=l.IN_TABLE,e._processToken(t))}function fa(e,t){switch(t.tagID){case a.TR:{e.openElements.clearBackToTableBodyContext(),e._insertElement(t,E.HTML),e.insertionMode=l.IN_ROW;break}case a.TH:case a.TD:{e.openElements.clearBackToTableBodyContext(),e._insertFakeElement(m.TR,a.TR),e.insertionMode=l.IN_ROW,ba(e,t);break}case a.CAPTION:case a.COL:case a.COLGROUP:case a.TBODY:case a.TFOOT:case a.THEAD:{e.openElements.hasTableBodyContextInTableScope()&&(e.openElements.clearBackToTableBodyContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE,Et(e,t));break}default:Et(e,t)}}function Ba(e,t){const s=t.tagID;switch(t.tagID){case a.TBODY:case a.TFOOT:case a.THEAD:{e.openElements.hasInTableScope(s)&&(e.openElements.clearBackToTableBodyContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE);break}case a.TABLE:{e.openElements.hasTableBodyContextInTableScope()&&(e.openElements.clearBackToTableBodyContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE,qt(e,t));break}case a.BODY:case a.CAPTION:case a.COL:case a.COLGROUP:case a.HTML:case a.TD:case a.TH:case a.TR:break;default:qt(e,t)}}function ba(e,t){switch(t.tagID){case a.TH:case a.TD:{e.openElements.clearBackToTableRowContext(),e._insertElement(t,E.HTML),e.insertionMode=l.IN_CELL,e.activeFormattingElements.insertMarker();break}case a.CAPTION:case a.COL:case a.COLGROUP:case a.TBODY:case a.TFOOT:case a.THEAD:case a.TR:{e.openElements.hasInTableScope(a.TR)&&(e.openElements.clearBackToTableRowContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE_BODY,fa(e,t));break}default:Et(e,t)}}function ao(e,t){switch(t.tagID){case a.TR:{e.openElements.hasInTableScope(a.TR)&&(e.openElements.clearBackToTableRowContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE_BODY);break}case a.TABLE:{e.openElements.hasInTableScope(a.TR)&&(e.openElements.clearBackToTableRowContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE_BODY,Ba(e,t));break}case a.TBODY:case a.TFOOT:case a.THEAD:{(e.openElements.hasInTableScope(t.tagID)||e.openElements.hasInTableScope(a.TR))&&(e.openElements.clearBackToTableRowContext(),e.openElements.pop(),e.insertionMode=l.IN_TABLE_BODY,Ba(e,t));break}case a.BODY:case a.CAPTION:case a.COL:case a.COLGROUP:case a.HTML:case a.TD:case a.TH:break;default:qt(e,t)}}function Kl(e,t){const s=t.tagID;so.has(s)?(e.openElements.hasInTableScope(a.TD)||e.openElements.hasInTableScope(a.TH))&&(e._closeTableCell(),ba(e,t)):Z(e,t)}function Yl(e,t){const s=t.tagID;switch(s){case a.TD:case a.TH:{e.openElements.hasInTableScope(s)&&(e.openElements.generateImpliedEndTags(),e.openElements.popUntilTagNamePopped(s),e.activeFormattingElements.clearToLastMarker(),e.insertionMode=l.IN_ROW);break}case a.TABLE:case a.TBODY:case a.TFOOT:case a.THEAD:case a.TR:{e.openElements.hasInTableScope(s)&&(e._closeTableCell(),ao(e,t));break}case a.BODY:case a.CAPTION:case a.COL:case a.COLGROUP:case a.HTML:break;default:pa(e,t)}}function ro(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.OPTION:{e.openElements.currentTagId===a.OPTION&&e.openElements.pop(),e._insertElement(t,E.HTML);break}case a.OPTGROUP:{e.openElements.currentTagId===a.OPTION&&e.openElements.pop(),e.openElements.currentTagId===a.OPTGROUP&&e.openElements.pop(),e._insertElement(t,E.HTML);break}case a.HR:{e.openElements.currentTagId===a.OPTION&&e.openElements.pop(),e.openElements.currentTagId===a.OPTGROUP&&e.openElements.pop(),e._appendElement(t,E.HTML),t.ackSelfClosing=!0;break}case a.INPUT:case a.KEYGEN:case a.TEXTAREA:case a.SELECT:{e.openElements.hasInSelectScope(a.SELECT)&&(e.openElements.popUntilTagNamePopped(a.SELECT),e._resetInsertionMode(),t.tagID!==a.SELECT&&e._processStartTag(t));break}case a.SCRIPT:case a.TEMPLATE:{ke(e,t);break}}}function io(e,t){switch(t.tagID){case a.OPTGROUP:{e.openElements.stackTop>0&&e.openElements.currentTagId===a.OPTION&&e.openElements.tagIDs[e.openElements.stackTop-1]===a.OPTGROUP&&e.openElements.pop(),e.openElements.currentTagId===a.OPTGROUP&&e.openElements.pop();break}case a.OPTION:{e.openElements.currentTagId===a.OPTION&&e.openElements.pop();break}case a.SELECT:{e.openElements.hasInSelectScope(a.SELECT)&&(e.openElements.popUntilTagNamePopped(a.SELECT),e._resetInsertionMode());break}case a.TEMPLATE:{it(e,t);break}}}function Wl(e,t){const s=t.tagID;s===a.CAPTION||s===a.TABLE||s===a.TBODY||s===a.TFOOT||s===a.THEAD||s===a.TR||s===a.TD||s===a.TH?(e.openElements.popUntilTagNamePopped(a.SELECT),e._resetInsertionMode(),e._processStartTag(t)):ro(e,t)}function ql(e,t){const s=t.tagID;s===a.CAPTION||s===a.TABLE||s===a.TBODY||s===a.TFOOT||s===a.THEAD||s===a.TR||s===a.TD||s===a.TH?e.openElements.hasInTableScope(s)&&(e.openElements.popUntilTagNamePopped(a.SELECT),e._resetInsertionMode(),e.onEndTag(t)):io(e,t)}function Gl(e,t){switch(t.tagID){case a.BASE:case a.BASEFONT:case a.BGSOUND:case a.LINK:case a.META:case a.NOFRAMES:case a.SCRIPT:case a.STYLE:case a.TEMPLATE:case a.TITLE:{ke(e,t);break}case a.CAPTION:case a.COLGROUP:case a.TBODY:case a.TFOOT:case a.THEAD:{e.tmplInsertionModeStack[0]=l.IN_TABLE,e.insertionMode=l.IN_TABLE,Et(e,t);break}case a.COL:{e.tmplInsertionModeStack[0]=l.IN_COLUMN_GROUP,e.insertionMode=l.IN_COLUMN_GROUP,Rr(e,t);break}case a.TR:{e.tmplInsertionModeStack[0]=l.IN_TABLE_BODY,e.insertionMode=l.IN_TABLE_BODY,fa(e,t);break}case a.TD:case a.TH:{e.tmplInsertionModeStack[0]=l.IN_ROW,e.insertionMode=l.IN_ROW,ba(e,t);break}default:e.tmplInsertionModeStack[0]=l.IN_BODY,e.insertionMode=l.IN_BODY,Z(e,t)}}function Vl(e,t){t.tagID===a.TEMPLATE&&it(e,t)}function no(e,t){e.openElements.tmplCount>0?(e.openElements.popUntilTagNamePopped(a.TEMPLATE),e.activeFormattingElements.clearToLastMarker(),e.tmplInsertionModeStack.shift(),e._resetInsertionMode(),e.onEof(t)):Nr(e,t)}function Ql(e,t){t.tagID===a.HTML?Z(e,t):_s(e,t)}function oo(e,t){var s;if(t.tagID===a.HTML){if(e.fragmentContext||(e.insertionMode=l.AFTER_AFTER_BODY),e.options.sourceCodeLocationInfo&&e.openElements.tagIDs[0]===a.HTML){e._setEndLocation(e.openElements.items[0],t);const r=e.openElements.items[1];r&&!(!((s=e.treeAdapter.getNodeSourceCodeLocation(r))===null||s===void 0)&&s.endTag)&&e._setEndLocation(r,t)}}else _s(e,t)}function _s(e,t){e.insertionMode=l.IN_BODY,ma(e,t)}function Xl(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.FRAMESET:{e._insertElement(t,E.HTML);break}case a.FRAME:{e._appendElement(t,E.HTML),t.ackSelfClosing=!0;break}case a.NOFRAMES:{ke(e,t);break}}}function Jl(e,t){t.tagID===a.FRAMESET&&!e.openElements.isRootHtmlElementCurrent()&&(e.openElements.pop(),!e.fragmentContext&&e.openElements.currentTagId!==a.FRAMESET&&(e.insertionMode=l.AFTER_FRAMESET))}function Zl(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.NOFRAMES:{ke(e,t);break}}}function ed(e,t){t.tagID===a.HTML&&(e.insertionMode=l.AFTER_AFTER_FRAMESET)}function td(e,t){t.tagID===a.HTML?Z(e,t):gs(e,t)}function gs(e,t){e.insertionMode=l.IN_BODY,ma(e,t)}function sd(e,t){switch(t.tagID){case a.HTML:{Z(e,t);break}case a.NOFRAMES:{ke(e,t);break}}}function ad(e,t){t.chars=j,e._insertCharacters(t)}function rd(e,t){e._insertCharacters(t),e.framesetOk=!1}function co(e){for(;e.treeAdapter.getNamespaceURI(e.openElements.current)!==E.HTML&&e.openElements.currentTagId!==void 0&&!e._isIntegrationPoint(e.openElements.currentTagId,e.openElements.current);)e.openElements.pop()}function id(e,t){if(Tu(t))co(e),e._startTagOutsideForeignContent(t);else{const s=e._getAdjustedCurrentElement(),r=e.treeAdapter.getNamespaceURI(s);r===E.MATHML?Kn(t):r===E.SVG&&(vu(t),Yn(t)),Cr(t),t.selfClosing?e._appendElement(t,r):e._insertElement(t,r),t.ackSelfClosing=!0}}function nd(e,t){if(t.tagID===a.P||t.tagID===a.BR){co(e),e._endTagOutsideForeignContent(t);return}for(let s=e.openElements.stackTop;s>0;s--){const r=e.openElements.items[s];if(e.treeAdapter.getNamespaceURI(r)===E.HTML){e._endTagOutsideForeignContent(t);break}const i=e.treeAdapter.getTagName(r);if(i.toLowerCase()===t.tagName){t.tagName=i,e.openElements.shortenToLength(s);break}}}m.AREA,m.BASE,m.BASEFONT,m.BGSOUND,m.BR,m.COL,m.EMBED,m.FRAME,m.HR,m.IMG,m.INPUT,m.KEYGEN,m.LINK,m.META,m.PARAM,m.SOURCE,m.TRACK,m.WBR;function od(e,t){return qn.parse(e,t)}function cd(e,t,s){typeof e=="string"&&(s=t,t=e,e=null);const r=qn.getFragmentParser(e,s);return r.tokenizer.write(t,!0),r.getFragment()}E.HTML,E.XML,E.MATHML,E.SVG,E.XLINK,E.XMLNS;function uo(e){return e.nodeName==="#document"}function lo(e){return e.nodeName==="#document-fragment"}function Lr(e){return e.nodeName==="template"}const qe=oe.isElementNode,ho=oe.isCommentNode,ud=oe.isDocumentTypeNode,mo=oe.isTextNode;function ld(e){return uo(e)||lo(e)||qe(e)||Lr(e)}oe.appendChild;function Fa(e,t,s){if((typeof t["pre:node"]!="function"||t["pre:node"](e,s)!==!1)&&ld(e))for(const i of e.childNodes)Fa(i,t,e);typeof t.node=="function"&&t.node(e,s),typeof t.document=="function"&&uo(e)&&t.document(e),typeof t.documentFragment=="function"&&lo(e)&&t.documentFragment(e,s),typeof t.element=="function"&&qe(e)&&t.element(e,s),typeof t.template=="function"&&Lr(e)&&t.template(e,s),typeof t.comment=="function"&&ho(e)&&t.comment(e,s),typeof t.text=="function"&&mo(e)&&t.text(e,s),typeof t.documentType=="function"&&ud(e)&&t.documentType(e,s)}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class dd extends On{render(){}update(t){const s=t.parentNode;if(typeof s.renderLight=="function")return s.renderLight()}}dd.t=!0;const hd=e=>{var t;return(t=Dn(e))==null?void 0:t.t};/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const md=[["accept",["input"]],[["accept-charset","acceptCharset"],["form"]],[["accesskey","accessKey"],["*"]],["action",["form"]],["align",["caption","col","colgroup","hr","iframe","img","table","tbody","td","tfoot","th","thead","tr"]],["allow",["iframe"]],["alt",["area","img","input"]],["async",["script"]],["autocapitalize",["*"]],["autocomplete",["form","input","select","textarea"]],["autofocus",["button","input","keygen","select","textarea"]],["autoplay",["audio","video"]],["background",["body"]],[["bgcolor","bgColor"],["body","marquee","table","td","th","tr"]],["border",["img","object","table"]],["buffered",[]],["capture",[]],["challenge",[]],["charset",["script"]],["checked",["input"]],["cite",["blockquote","del","ins","q"]],[["class","className"],["*"]],["code",[]],["codebase",[]],["color",["font","hr"]],["cols",["textarea"]],[["colspan","colSpan"],["td","th"]],["content",["meta"]],[["contenteditable","contentEditable"],["*"]],[["contextmenu"],[]],["controls",["audio","video"]],["coords",["area"]],[["crossorigin","crossOrigin"],["audio","img","link","script","video"]],["csp",["iframe"]],["data",["object"]],[["datetime","dateTime"],["del","ins","time"]],["decoding",["img"]],["default",["track"]],["defer",["script"]],["dir",["*"]],[["dirname","dirName"],["input","textarea"]],["disabled",["button","fieldset","input","optgroup","option","select","textarea"]],["download",["a","area"]],["draggable",["*"]],["enctype",["form"]],[["enterkeyhint","enterKeyHint"],["textarea","contenteditable"]],["for",[]],["form",[]],[["formaction","formAction"],["input","button"]],[["formenctype","formEnctype"],["button","input"]],[["formmethod","formMethod"],["button","input"]],[["formnovalidate","formNoValidate"],["button","input"]],[["formtarget","formTarget"],["button","input"]],["headers",["td","th"]],["height",["canvas","embed","iframe","img","input","object","video"]],["hidden",["*"]],["high",["meter"]],["href",["a","area","base","link"]],["hreflang",["a","link"]],[["http-equiv","httpEquiv"],["meta"]],["icon",[]],["id",["*"]],["importance",[]],["integrity",["link","script"]],["intrinsicsize",[]],[["inputmode","inputMode"],["textarea","contenteditable"]],[["ismap","isMap"],["img"]],["itemprop",[]],["keytype",[]],["kind",["track"]],["label",["optgroup","option","track"]],["lang",["*"]],["language",[]],["loading",["img","iframe"]],["list",[]],["loop",["audio","marquee","video"]],["low",["meter"]],["manifest",[]],["max",["input","meter","progress"]],[["maxlength","maxLength"],["input","textarea"]],[["minlength","minLength"],["input","textarea"]],["media",["link","source","style"]],["method",["form"]],["min",["input","meter"]],["multiple",["input","select"]],["muted",["audio","video"]],["name",["button","form","fieldset","iframe","input","object","output","select","textarea","map","meta","param"]],[["novalidate","noValidate"],["form"]],["open",["details"]],["optimum",["meter"]],["pattern",["input"]],["ping",["a","area"]],["placeholder",["input","textarea"]],["poster",["video"]],["preload",["audio","video"]],["radiogroup",[]],[["readonly","readOnly"],["input","textarea"]],[["referrerpolicy","referrerPolicy"],["a","area","iframe","img","link","script"]],["rel",["a","area","link"]],["required",["input","select","textarea"]],["reversed",["ol"]],["rows",["textarea"]],[["rowspan","rowSpan"],["td","th"]],["sandbox",["iframe"]],["scope",["th"]],["scoped",[]],["selected",["option"]],["shape",["a","area"]],["size",["input","select"]],["sizes",["link","img","source"]],["slot",["*"]],["span",["col","colgroup"]],["spellcheck",["*"]],["src",["audio","embed","iframe","img","input","script","source","track","video"]],["srcdoc",["iframe"]],["srclang",["track"]],["srcset",["img","source"]],["start",["ol"]],["step",["input"]],["style",["*"]],["summary",["table"]],[["tabindex","tabIndex"],["*"]],["target",["a","area","base","form"]],["title",["*"]],["translate",[]],["type",["button","input","embed","object","script","source","style"]],[["usemap","useMap"],["img","input","object"]],["value",["button","data","input","li","meter","option","progress","param"]],["width",["canvas","embed","iframe","img","input","object","video"]],["wrap",["textarea"]]],zt=new Map,qi=(e,t,s)=>{zt.has(e)?zt.get(e).set(s,t):zt.set(e,new Map([[s,t]]))};for(const[e,t]of md)for(let s of t)s=s.toUpperCase(),e instanceof Array?qi(s,e[0],e[1]):qi(s,e,e);const pd=(e,t)=>{const s=zt.get(e);return s!==void 0&&s.has(t)?s.get(t):zt.get("*").get(t)};/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const fd=1,xs=e=>e._$litServerRenderMode!==fd,{getTemplateHtml:bd,marker:wa,markerMatch:gd,boundAttributeSuffix:Gi,patchDirectiveResolve:kd,getAttributePartCommittedValue:Ed,resolveDirective:Td,AttributePart:vd,PropertyPart:yd,BooleanAttributePart:Sd,EventPart:_d,connectedDisconnectable:po,isIterable:xd}=Rc;function Ad(e,t){return As(this.render(...t))}const As=e=>{const t=Dn(e);return t!==void 0&&kd(t,Ad),e},Id=(e,t,s)=>{if(e.strings!==void 0)for(let r=0;r<e.strings.length-1;r++)As(t[s+r]);else As(t)},Vi=new WeakMap,hs=new WeakMap;class Cd extends Ln{get localName(){return"slot"}}const wd=/^(\s|<!--[^(-->)]*-->)*(<(!doctype|html|head|body))/i,Nd=e=>{const t=Vi.get(e.strings);if(t!==void 0)return t;const[s,r]=bd(e.strings,wc.HTML),i=xs(e),n=String(s),h=(!i&&wd.test(n)?od:cd)(n,{sourceCodeLocationInfo:!0}),d=[];let p=0,b=0;const k=y=>{if(p===void 0)throw new Error("lastOffset is undefined");if(y<p)throw new Error(`offset must be greater than lastOffset.
        offset: ${y}
        lastOffset: ${p}
      `);p=y},v=y=>{const $=le(d);$!==void 0&&$.type==="text"?$.value+=y:d.push({type:"text",value:y})},S=y=>{if(p===void 0)throw new Error("lastOffset is undefined");const $=p;p=y;const N=String(s).substring($,y);v(N)};let x=0;return Fa(h,{"pre:node"(y,$){var N,P;if(ho(y))y.data===gd&&(S(y.sourceCodeLocation.startOffset),k(y.sourceCodeLocation.endOffset),d.push({type:"child-part",index:x,useCustomElementInstance:$&&qe($)&&$.isDefinedCustomElement})),x++;else if(qe(y)){let K=0;const te=y.tagName;if(y.parentNode&&qe(y.parentNode)&&y.parentNode.isDefinedCustomElement&&d.push({type:"slotted-element-open",name:(N=y.attrs.find(q=>q.name==="slot"))==null?void 0:N.value}),te.indexOf("-")!==-1){const q=customElements.get(te);q!==void 0&&(y.isDefinedCustomElement=!0,d.push({type:"custom-element-open",tagName:te,ctor:q,staticAttributes:new Map(y.attrs.filter(z=>!z.name.endsWith(Gi)).map(z=>[z.name,z.value]))}))}else te==="slot"&&d.push({type:"slot-element-open",name:(P=y.attrs.find(q=>q.name==="name"))==null?void 0:P.value});const vt=y.attrs.map(q=>{const z=q.name.endsWith(Gi),me=q.name.startsWith(wa);return(z||me)&&(K+=1),[z,me,q]});(K>0||y.isDefinedCustomElement)&&(S(y.sourceCodeLocation.startTag.startOffset),d.push({type:"possible-node-marker",boundAttributesCount:K,nodeIndex:x}));for(const[q,z,me]of vt)if(q||z){const ce=me.value.split(wa),Ee=y.sourceCodeLocation.attrs[me.name],se=Ee.startOffset,Ne=Ee.endOffset;if(S(se),q){const yt=r[b++],[,ue,$e]=/([.?@])?(.*)/.exec(yt);if(!i){if(ue===".")throw new Error("Server-only templates can't bind to properties. Bind to attributes instead, as they can be serialized when the template is rendered and sent to the browser.");if(ue==="@")throw new Error("Server-only templates can't bind to events. There's no way to serialize an event listener when generating HTML and sending it to the browser.")}d.push({type:"attribute-part",index:x,name:$e,ctor:ue==="."?yd:ue==="?"?Sd:ue==="@"?_d:vd,strings:ce,tagName:te.toUpperCase(),useCustomElementInstance:y.isDefinedCustomElement})}else{if(!i)throw new Error(`Server-only templates don't support element parts, as their API does not currently give them any way to render anything on the server. Found in template:
    ${dt(e)}`);d.push({type:"element-part",index:x})}k(Ne)}else if(y.isDefinedCustomElement){const ce=y.sourceCodeLocation.attrs[me.name];S(ce.startOffset),k(ce.endOffset)}if(y.isDefinedCustomElement)S(y.sourceCodeLocation.startTag.endOffset-1),d.push({type:"custom-element-attributes"}),v(">"),k(y.sourceCodeLocation.startTag.endOffset),d.push({type:"custom-element-shadow"});else if(!i&&/^(title|textarea|script|style)$/.test(y.tagName)){const q=Md(y);for(const z of y.childNodes){if(!mo(z))throw new Error(`Internal error: Unexpected child node inside raw text node, a ${y.tagName} should only contain text nodes, but found a ${y.nodeName} (tagname: ${y.tagName})`);const me=z.value,ce=z.sourceCodeLocation.startOffset;S(ce);const Ee=new RegExp(wa.replace(/\$/g,"\\$"),"g");for(const se of me.matchAll(Ee)){if(S(ce+se.index),q)throw new Error(`Found binding inside an executable <script> tag in a server-only template. For security reasons, this is not supported, as it could allow an attacker to execute arbitrary JavaScript. If you do need to create a script element with dynamic contents, you can use the unsafeHTML directive to make one, as that way the code is clearly marked as unsafe and needing careful handling. The template with the dangerous binding is:

    ${dt(e)}`);if(y.tagName==="style")throw new Error(`Found binding inside a <style> tag in a server-only template. For security reasons, this is not supported, as it could allow an attacker to exfiltrate information from the page. If you do need to create a style element with dynamic contents, you can use the unsafeHTML directive to make one, as that way the code is clearly marked as unsafe and needing careful handling. The template with the dangerous binding is:

    ${dt(e)}`);d.push({type:"child-part",index:x,useCustomElementInstance:!1}),k(ce+se.index+se[0].length)}S(ce+me.length)}}else!i&&Lr(y)&&Fa(y.content,this,y);x++}},node(y){qe(y)&&(y.isDefinedCustomElement?d.push({type:"custom-element-close"}):y.tagName==="slot"&&d.push({type:"slot-element-close"}),y.parentNode&&qe(y.parentNode)&&y.parentNode.isDefinedCustomElement&&d.push({type:"slotted-element-close"}))}}),S(),Vi.set(e.strings,d),d};function*Gt(e,t,s=!0){if(t.customElementHostStack.length===0){const r=t.eventTargetStack[0];r!==litServerRoot&&(t.eventTargetStack.unshift(litServerRoot),r&&(r.__eventTargetParent=r))}if(As(e),hd(e)){const r=le(t.customElementInstanceStack);if(r!==void 0){const i=r.renderLight(t);i!==void 0&&(yield*i)}e=null}else e=Td(po({type:Ht.CHILD}),e);if(e!=null&&Ir(e))s&&(yield`<!--lit-part ${Lc(e)}-->`),yield*Rd(e,t),s&&(yield"<!--/lit-part-->");else{if(s&&(yield"<!--lit-part-->"),!(e==null||e===D||e===ge))if(!Cc(e)&&xd(e))for(const r of e)yield*Gt(r,t,s);else yield ts(String(e));s&&(yield"<!--/lit-part-->")}}function*Rd(e,t){var n,c,h,d,p;const s=xs(e),r=Nd(e);let i=0;for(const b of r)switch(b.type){case"text":yield b.value;break;case"child-part":{const k=e.values[i++];let v=s;if(Ir(k)&&(v=xs(k),!v&&s))throw new Error(`A server-only template can't be rendered inside an ordinary, hydratable template. A server-only template can only be rendered at the top level, or within other server-only templates. The outer template was:
    ${dt(e)}

And the inner template was:
    ${dt(k)}
              `);yield*Gt(k,t,v);break}case"attribute-part":{const k=b.strings,v=new b.ctor({tagName:b.tagName},b.name,k,po(),{}),S=v.strings===void 0?e.values[i]:e.values;Id(v,S,i);let x=ge;if(v.type!==Ht.EVENT&&(x=Ed(v,S,i)),x!==ge){const y=b.useCustomElementInstance?le(t.customElementInstanceStack):void 0;v.type===Ht.PROPERTY?yield*Od(y,b,x):v.type===Ht.BOOLEAN_ATTRIBUTE?yield*Dd(y,b,x):yield*Pd(y,b,x)}i+=k.length-1;break}case"element-part":{i++;break}case"custom-element-open":{const k=ac(t,b.tagName,b.ctor,b.staticAttributes);if(k.element){const v=le(t.eventTargetStack),S=le(t.slotStack);k.element.__eventTargetParent=((n=hs.get(v))==null?void 0:n.get(S))??v,k.element.__host=(c=le(t.customElementHostStack))==null?void 0:c.element,t.eventTargetStack.push(k.element)}for(const[v,S]of b.staticAttributes)k.setAttribute(v,S);t.customElementInstanceStack.push(k),(h=t.customElementRendered)==null||h.call(t,b.tagName);break}case"custom-element-attributes":{const k=le(t.customElementInstanceStack);if(k===void 0)throw new Error(`Internal error: ${b.type} outside of custom element context`);k.connectedCallback&&k.connectedCallback(),yield*k.renderAttributes(),(t.deferHydration||t.customElementHostStack.length>0)&&(yield" defer-hydration");break}case"possible-node-marker":{(b.boundAttributesCount>0||t.customElementHostStack.length>0)&&s&&(yield`<!--lit-node ${b.nodeIndex}-->`);break}case"custom-element-shadow":{const k=le(t.customElementInstanceStack);if(k===void 0)throw new Error(`Internal error: ${b.type} outside of custom element context`);t.customElementHostStack.push(k);const v=k.renderShadow(t);if(v!==void 0){const{mode:S="open",delegatesFocus:x}=k.shadowRootOptions??{};yield`<template shadowroot="${S}" shadowrootmode="${S}"${x?" shadowrootdelegatesfocus":""}>`,yield*v,yield"</template>"}t.customElementHostStack.pop();break}case"custom-element-close":t.customElementInstanceStack.pop(),t.eventTargetStack.pop();break;case"slot-element-open":{const k=le(t.customElementHostStack);if(k===void 0)throw new Error(`Internal error: ${b.type} outside of custom element context`);if(k.element){let v=hs.get(k.element);if(v===void 0&&(v=new Map,hs.set(k.element,v)),!v.has(b.name)){const S=new Cd;S.name=b.name??"";const x=le(t.eventTargetStack),y=le(t.slotStack);S.__eventTargetParent=((d=hs.get(x))==null?void 0:d.get(y))??x,S.__host=(p=le(t.customElementHostStack))==null?void 0:p.element,v.set(b.name,S),t.eventTargetStack.push(S)}}break}case"slot-element-close":t.eventTargetStack.pop();break;case"slotted-element-open":t.slotStack.push(b.name);break;case"slotted-element-close":t.slotStack.pop();break;default:throw new Error("internal error")}i!==e.values.length&&Ld(i,e)}function Ld(e,t){const s=`
    Unexpected final partIndex: ${e} !== ${t.values.length} while processing the following template:

    ${dt(t)}

    This could be because you're attempting to render an expression in an invalid location. See
    https://lit.dev/docs/templates/expressions/#invalid-locations for more information about invalid expression
    locations.
  `;throw new Error(s)}function*Od(e,t,s){s=s===D?void 0:s;const r=pd(t.tagName,t.name);e!==void 0&&e.setProperty(t.name,s),r!==void 0&&(yield`${r}="${ts(String(s))}"`)}function*Dd(e,t,s){s&&s!==D&&(e!==void 0?e.setAttribute(t.name,""):yield t.name)}function*Pd(e,t,s){s!==D&&(e!==void 0?e.setAttribute(t.name,String(s??"")):yield`${t.name}="${ts(String(s??""))}"`)}function dt(e){return Nc(e)?e._$litType$.h.join("${...}"):e.strings.join("${...}")}const le=e=>e[e.length-1];function Md(e){function t(i){return/script/i.test(i.tagName)}if(!t(e))return!1;let s=!1;for(const i of e.attrs)if(i.name==="type")switch(i.value){case null:case void 0:case"":case"module":case"text/javascript":case"application/javascript":case"application/ecmascript":case"application/x-ecmascript":case"application/x-javascript":case"text/ecmascript":case"text/javascript1.0":case"text/javascript1.1":case"text/javascript1.2":case"text/javascript1.3":case"text/javascript1.4":case"text/javascript1.5":case"text/jscript":case"text/livescript":case"text/x-ecmascript":case"text/x-javascript":return!0;default:s=!0}return!s}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{attributeToProperty:Hd,changedProperties:Bd}=gc;C.prototype.createRenderRoot=function(){return this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions)};class Fd extends vn{static matchesClass(t){return t._$litElement$}constructor(t){super(t),this.element=new(customElements.get(this.tagName));const s=this.element.__internals;if(s)for(const[r,i]of Object.entries(kc)){const n=s[r];n&&!this.element.hasAttribute(i)&&(this.element.setAttribute(i,n),this.element.setAttribute(`${Tc}${i}`,n))}}get shadowRootOptions(){return this.element.constructor.shadowRootOptions??super.shadowRootOptions}connectedCallback(){var s;if(globalThis.litSsrCallConnectedCallback){this.element.enableUpdating=function(){};try{this.element.connectedCallback()}catch(r){const i=this.element.constructor.name;throw console.warn(`Calling ${i}.connectedCallback() resulted in a thrown error. Consider removing \`litSsrCallConnectedCallback\` to prevent calling connectedCallback or add isServer checks to your code to prevent calling browser API during SSR.`),r}}const t=Bd(this.element);(s=this.element)==null||s.willUpdate(t),We.prototype.update.call(this.element,t)}attributeChangedCallback(t,s,r){Hd(this.element,t,r)}*renderShadow(t){const s=this.element.constructor.elementStyles;if(s!==void 0&&s.length>0){yield"<style>";for(const r of s)yield r.cssText;yield"</style>"}yield*Gt(this.element.render(),t)}*renderLight(t){var r;const s=(r=this.element)==null?void 0:r.renderLight();s?yield*Gt(s,t):yield""}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*Ud(e,t){t={...{elementRenderers:[Fd],customElementInstanceStack:[],customElementHostStack:[],eventTargetStack:[],slotStack:[],deferHydration:!1},...t};let r=!0;Ir(e)&&(r=xs(e)),yield*Gt(e,t,r)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class Ua extends On{constructor(t){if(super(t),this.it=D,t.type!==Ht.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===D||t==null)return this._t=void 0,this.it=t;if(t===ge)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const s=[t];return s.raw=s,this._t={_$litType$:this.constructor.resultType,strings:s,values:[]}}}Ua.directiveName="unsafeHTML",Ua.resultType=1;const $d=Ic(Ua);/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const fo=async e=>{let t="";for(const s of e)t+=typeof s=="string"?s:await fo(await s);return t};var jd=({limitLength:e=255,headerName:t="X-Request-Id",generator:s=()=>crypto.randomUUID()}={})=>async function(i,n){let c=t?i.req.header(t):void 0;(!c||c.length>e||/[^\w\-=]/.test(c))&&(c=s(i)),i.set("requestId",c),t&&i.header(t,c),await n()};function zd(){const{process:e,Deno:t}=globalThis;return!(typeof(t==null?void 0:t.noColor)=="boolean"?t.noColor:e!==void 0?"NO_COLOR"in(e==null?void 0:e.env):!1)}async function Kd(){const{navigator:e}=globalThis,t="cloudflare:workers";return!(e!==void 0&&e.userAgent==="Cloudflare-Workers"?await(async()=>{try{return"NO_COLOR"in((await import(t)).env??{})}catch{return!1}})():!zd())}var Yd=e=>{const[t,s]=[",","."];return e.map(i=>i.replace(/(\d)(?=(\d\d\d)+(?!\d))/g,"$1"+t)).join(s)},Wd=e=>{const t=Date.now()-e;return Yd([t<1e3?t+"ms":Math.round(t/1e3)+"s"])},qd=async e=>{if(await Kd())switch(e/100|0){case 5:return`\x1B[31m${e}\x1B[0m`;case 4:return`\x1B[33m${e}\x1B[0m`;case 3:return`\x1B[36m${e}\x1B[0m`;case 2:return`\x1B[32m${e}\x1B[0m`}return`${e}`};async function Qi(e,t,s,r,i=0,n){const c=t==="<--"?`${t} ${s} ${r}`:`${t} ${s} ${r} ${await qd(i)} ${n}`;e(c)}var Gd=(e=console.log)=>async function(s,r){const{method:i,url:n}=s.req,c=n.slice(n.indexOf("/",8));await Qi(e,"<--",i,c);const h=Date.now();await r(),await Qi(e,"-->",i,c,s.res.status,Wd(h))},Vd=e=>{const s={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},r=(n=>typeof n=="string"?n==="*"?s.credentials?c=>c||null:()=>n:c=>n===c?c:null:typeof n=="function"?n:c=>n.includes(c)?c:null)(s.origin),i=(n=>typeof n=="function"?n:Array.isArray(n)?()=>n:()=>[])(s.allowMethods);return async function(c,h){var b;function d(k,v){c.res.headers.set(k,v)}const p=await r(c.req.header("origin")||"",c);if(p&&d("Access-Control-Allow-Origin",p),s.credentials&&d("Access-Control-Allow-Credentials","true"),(b=s.exposeHeaders)!=null&&b.length&&d("Access-Control-Expose-Headers",s.exposeHeaders.join(",")),c.req.method==="OPTIONS"){(s.origin!=="*"||s.credentials)&&d("Vary","Origin"),s.maxAge!=null&&d("Access-Control-Max-Age",s.maxAge.toString());const k=await i(c.req.header("origin")||"",c);k.length&&d("Access-Control-Allow-Methods",k.join(","));let v=s.allowHeaders;if(!(v!=null&&v.length)){const S=c.req.header("Access-Control-Request-Headers");S&&(v=S.split(/\s*,\s*/))}return v!=null&&v.length&&(d("Access-Control-Allow-Headers",v.join(",")),c.res.headers.append("Vary","Access-Control-Request-Headers")),c.res.headers.delete("Content-Length"),c.res.headers.delete("Content-Type"),new Response(null,{headers:c.res.headers,status:204,statusText:"No Content"})}await h(),(s.origin!=="*"||s.credentials)&&c.header("Vary","Origin",{append:!0})}},Qd={crossOriginEmbedderPolicy:["Cross-Origin-Embedder-Policy","require-corp"],crossOriginResourcePolicy:["Cross-Origin-Resource-Policy","same-origin"],crossOriginOpenerPolicy:["Cross-Origin-Opener-Policy","same-origin"],originAgentCluster:["Origin-Agent-Cluster","?1"],referrerPolicy:["Referrer-Policy","no-referrer"],strictTransportSecurity:["Strict-Transport-Security","max-age=15552000; includeSubDomains"],xContentTypeOptions:["X-Content-Type-Options","nosniff"],xDnsPrefetchControl:["X-DNS-Prefetch-Control","off"],xDownloadOptions:["X-Download-Options","noopen"],xFrameOptions:["X-Frame-Options","SAMEORIGIN"],xPermittedCrossDomainPolicies:["X-Permitted-Cross-Domain-Policies","none"],xXssProtection:["X-XSS-Protection","0"]},Xd={crossOriginEmbedderPolicy:!1,crossOriginResourcePolicy:!0,crossOriginOpenerPolicy:!0,originAgentCluster:!0,referrerPolicy:!0,strictTransportSecurity:!0,xContentTypeOptions:!0,xDnsPrefetchControl:!0,xDownloadOptions:!0,xFrameOptions:!0,xPermittedCrossDomainPolicies:!0,xXssProtection:!0,removePoweredBy:!0,permissionsPolicy:{}},Jd=e=>{const t={...Xd,...e},s=Zd(t),r=[];if(t.contentSecurityPolicy){const[i,n]=Xi(t.contentSecurityPolicy);i&&r.push(i),s.push(["Content-Security-Policy",n])}if(t.contentSecurityPolicyReportOnly){const[i,n]=Xi(t.contentSecurityPolicyReportOnly);i&&r.push(i),s.push(["Content-Security-Policy-Report-Only",n])}return t.permissionsPolicy&&Object.keys(t.permissionsPolicy).length>0&&s.push(["Permissions-Policy",e0(t.permissionsPolicy)]),t.reportingEndpoints&&s.push(["Reporting-Endpoints",s0(t.reportingEndpoints)]),t.reportTo&&s.push(["Report-To",a0(t.reportTo)]),async function(n,c){const h=r.length===0?s:r.reduce((d,p)=>p(n,d),s);await c(),r0(n,h),t!=null&&t.removePoweredBy&&n.res.headers.delete("X-Powered-By")}};function Zd(e){return Object.entries(Qd).filter(([t])=>e[t]).map(([t,s])=>{const r=e[t];return typeof r=="string"?[s[0],r]:s})}function Xi(e){const t=[],s=[];for(const[r,i]of Object.entries(e)){const n=Array.isArray(i)?i:[i];n.forEach((c,h)=>{if(typeof c=="function"){const d=h*2+2+s.length;t.push((p,b)=>{b[d]=c(p,r)})}}),s.push(r.replace(/[A-Z]+(?![a-z])|[A-Z]/g,(c,h)=>h?"-"+c.toLowerCase():c.toLowerCase()),...n.flatMap(c=>[" ",c]),"; ")}return s.pop(),t.length===0?[void 0,s.join("")]:[(r,i)=>i.map(n=>{if(n[0]==="Content-Security-Policy"||n[0]==="Content-Security-Policy-Report-Only"){const c=n[1].slice();return t.forEach(h=>{h(r,c)}),[n[0],c.join("")]}else return n}),s]}function e0(e){return Object.entries(e).map(([t,s])=>{const r=t0(t);if(typeof s=="boolean")return`${r}=${s?"*":"none"}`;if(Array.isArray(s)){if(s.length===0)return`${r}=()`;if(s.length===1&&(s[0]==="*"||s[0]==="none"))return`${r}=${s[0]}`;const i=s.map(n=>["self","src"].includes(n)?n:`"${n}"`);return`${r}=(${i.join(" ")})`}return""}).filter(Boolean).join(", ")}function t0(e){return e.replace(/([a-z\d])([A-Z])/g,"$1-$2").toLowerCase()}function s0(e=[]){return e.map(t=>`${t.name}="${t.url}"`).join(", ")}function a0(e=[]){return e.map(t=>JSON.stringify(t)).join(", ")}function r0(e,t){t.forEach(([s,r])=>{e.res.headers.set(s,r)})}function i0(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function n0(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function M(e,t={}){const{title:s="KISS App",lang:r="en",hydrateScript:i="",meta:n,devMode:c=!1,routeModulePath:h,headExtras:d="",cspNonce:p}=t,b=p?` nonce="${p}"`:"",k=i0(s),v=n0(r),S=d,x=[];if(n!=null&&n.description){const N=n.description.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");x.push(`  <meta name="description" content="${N}">`)}const y=x.length>0?`
`+x.join(`
`)+`
`:"",$=c?`
  <script type="module" src="/@vite/client"${b}><\/script>
  ${h?`<script type="module"${b}>
  // Register route component for client-side custom element definition
  import '${h}';
<\/script>`:""}`:"";return`<!DOCTYPE html>
<html lang="${v}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${k}</title>${y}
  ${S}
</head>
<body>
  ${e}
  ${i}${$}
</body>
</html>`}const bo={"--kiss-bg-base":"#000","--kiss-bg-surface":"#0a0a0a","--kiss-bg-elevated":"#111","--kiss-bg-hover":"#0e0e0e","--kiss-bg-card":"#0a0a0a","--kiss-border":"#1a1a1a","--kiss-border-hover":"#333","--kiss-text-primary":"#fff","--kiss-text-secondary":"#999","--kiss-text-tertiary":"#666","--kiss-text-muted":"#444","--kiss-accent":"#fff","--kiss-accent-dim":"#ccc","--kiss-accent-subtle":"rgba(255, 255, 255, 0.05)","--kiss-code-bg":"#111","--kiss-code-border":"#1a1a1a","--kiss-error":"#e55","--kiss-scrollbar-track":"transparent","--kiss-scrollbar-thumb":"#222"},go={"--kiss-bg-base":"#fff","--kiss-bg-surface":"#fafafa","--kiss-bg-elevated":"#f5f5f5","--kiss-bg-hover":"#f0f0f0","--kiss-bg-card":"#fff","--kiss-border":"#e5e5e5","--kiss-border-hover":"#ccc","--kiss-text-primary":"#000","--kiss-text-secondary":"#555","--kiss-text-tertiary":"#888","--kiss-text-muted":"#aaa","--kiss-accent":"#000","--kiss-accent-dim":"#333","--kiss-accent-subtle":"rgba(0, 0, 0, 0.03)","--kiss-code-bg":"#f5f5f5","--kiss-code-border":"#e5e5e5","--kiss-error":"#c44","--kiss-scrollbar-track":"transparent","--kiss-scrollbar-thumb":"#ccc"};function Is(e){return Object.entries(e).map(([t,s])=>`${t}:${s}`).join(";")}const o0=w`
  :host,
  :host([data-theme="light"]) {
    ${Ra(Is(go))};
    color-scheme: light;
  }

  :host([data-theme="dark"]) {
    ${Ra(Is(bo))};
    color-scheme: dark;
  }
`;`${Is(go)}${Is(bo)}`;const c0=w`
  :host {
    /* === Spacing Scale (4px base unit) === */
    --kiss-size-1: 0.25rem; /* 4px */
    --kiss-size-2: 0.375rem; /* 6px */
    --kiss-size-3: 0.5rem; /* 8px */
    --kiss-size-4: 0.75rem; /* 12px */
    --kiss-size-5: 1rem; /* 16px */
    --kiss-size-6: 1.25rem; /* 20px */
    --kiss-size-7: 1.5rem; /* 24px */
    --kiss-size-8: 2rem; /* 32px */
    --kiss-size-9: 2.5rem; /* 40px */
    --kiss-size-10: 3rem; /* 48px */

    /* === Border Radius (Swiss: minimal) === */
    --kiss-radius-sm: 2px;
    --kiss-radius-md: 4px;
    --kiss-radius-lg: 6px;

    /* === Transitions === */
    --kiss-transition-fast: 0.1s ease;
    --kiss-transition-normal: 0.15s ease;
    --kiss-transition-slow: 0.25s ease;

    /* === Z-Index Scale === */
    --kiss-z-dropdown: 100;
    --kiss-z-sticky: 200;
    --kiss-z-fixed: 300;
    --kiss-z-modal-backdrop: 400;
    --kiss-z-modal: 500;
    --kiss-z-popover: 600;
    --kiss-z-tooltip: 700;
  }
`,u0=w`
  :host {
    /* === Font Families === */
    --kiss-font-sans:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    --kiss-font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;

    /* === Font Sizes (modular scale ~1.125) === */
    --kiss-font-size-xs: 0.6875rem; /* 11px */
    --kiss-font-size-sm: 0.75rem; /* 12px */
    --kiss-font-size-md: 0.875rem; /* 14px */
    --kiss-font-size-lg: 1rem; /* 16px */
    --kiss-font-size-xl: 1.125rem; /* 18px */
    --kiss-font-size-2xl: 1.25rem; /* 20px */
    --kiss-font-size-3xl: 1.5rem; /* 24px */

    /* === Font Weights === */
    --kiss-font-weight-normal: 400;
    --kiss-font-weight-medium: 500;
    --kiss-font-weight-semibold: 600;
    --kiss-font-weight-bold: 700;
    --kiss-font-weight-extrabold: 800;

    /* === Line Heights === */
    --kiss-line-height-tight: 1.2;
    --kiss-line-height-normal: 1.5;
    --kiss-line-height-relaxed: 1.7;

    /* === Letter Spacing === */
    --kiss-letter-spacing-tight: -0.03em;
    --kiss-letter-spacing-normal: 0;
    --kiss-letter-spacing-wide: 0.02em;
    --kiss-letter-spacing-wider: 0.05em;
    --kiss-letter-spacing-widest: 0.15em;
  }
`,l0=w`
  :host {
    /* === Box Shadows (subtle, Swiss restraint) === */
    --kiss-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
    --kiss-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15);
    --kiss-shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  /* Dark mode: invert shadow color for elevation on black backgrounds */
  :host([data-theme="dark"]) {
    --kiss-shadow-sm: 0 1px 3px rgba(255, 255, 255, 0.06);
    --kiss-shadow-md: 0 2px 8px rgba(255, 255, 255, 0.09);
    --kiss-shadow-lg: 0 4px 24px rgba(255, 255, 255, 0.12);
  }
`,Tt=w`
  ${c0} ${u0}
    ${o0}
    ${l0};
`,d0="kiss-theme-toggle",Or=class extends C{constructor(){super(...arguments),this._isLight=!1}connectedCallback(){if(super.connectedCallback(),this.theme==="light")this._isLight=!0;else if(this.theme==="dark")this._isLight=!1;else if(document.documentElement.dataset.theme==="light")this._isLight=!0;else try{localStorage.getItem("kiss-theme")==="light"&&(this._isLight=!0)}catch{}this.setAttribute("data-theme",this._isLight?"light":"dark")}_handleToggle(){this._isLight=!this._isLight;const t=this._isLight?"light":"dark";document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem("kiss-theme",t)}catch{}this._propagateTheme(t)}_propagateTheme(t){const s=(r,i=0)=>{i>10||r.querySelectorAll("*").forEach(n=>{var c,h;try{const d=(c=n.tagName)==null?void 0:c.toLowerCase();(d!=null&&d.startsWith("kiss-")||(h=n.hasAttribute)!=null&&h.call(n,"data-kiss"))&&n.setAttribute("data-theme",t),n.shadowRoot&&s(n.shadowRoot,i+1)}catch{}})};s(document)}render(){return _`
        <button
          class="theme-toggle ${this._isLight?"is-light":""}"
          title="${this._isLight?"Switch to dark theme":"Switch to light theme"}"
          aria-label="Toggle theme"
          @click="${()=>this._handleToggle()}"
        >
          <svg
            class="icon-sun"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="1" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="15" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
            <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
            <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
            <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
            <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
          </svg>
          <svg
            class="icon-moon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <path d="M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z" />
          </svg>
        </button>
      `}};Or.styles=[Tt,w`
      :host {
        display: inline-block;
      }

      .theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        background: transparent;
        color: var(--kiss-text-tertiary);
        cursor: pointer;
        font-size: 0;
        line-height: 1;
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        }

        .theme-toggle:hover {
          color: var(--kiss-text-primary);
          border-color: var(--kiss-border-hover);
          background: var(--kiss-accent-subtle);
        }

        .theme-toggle svg {
          width: 16px;
          height: 16px;
        }

        .theme-toggle .icon-sun {
          display: block;
        }

        .theme-toggle .icon-moon {
          display: none;
        }

        .theme-toggle.is-light .icon-sun {
          display: none;
        }

        .theme-toggle.is-light .icon-moon {
          display: block;
        }
      `];Or.properties={theme:{type:String,reflect:!0},_isLight:{state:!0}};let h0=Or;customElements.define(d0,h0);const m0="kiss-layout",is=class $a extends C{constructor(){super(...arguments),this.home=!1,this.currentPath="",this.logoText="KISS",this.logoSub="framework",this.githubUrl="https://github.com/SisyphusZheng/kiss"}_navLink(t,s){const r=this.currentPath===t;return _`
        <a
          href="${t}"
          class="${r?"active":""}"
          aria-current="${r?"page":void 0}"
        >${s}</a>
      `}_renderSidebarNav(){const t=this.navItems||$a.DEFAULT_NAV;return _`
        <nav class="docs-sidebar" aria-label="Documentation navigation">
          ${t.map(s=>_`
                <details class="nav-section" open>
                  <summary class="nav-section-title">${s.section}</summary>
                  ${s.items.map(r=>this._navLink(r.path,r.label))}
                </details>
              `)}
        </nav>
      `}_renderHeaderNav(){const t=this.headerNav||$a.DEFAULT_HEADER_NAV;return _`
        <nav class="header-nav">
          ${t.map(s=>_`
                <a href="${s.href}">${s.label}</a>
              `)}
        </nav>
      `}render(){return _`
        <div class="app-layout" ?home="${this.home}">
          <header class="app-header">
            <div class="header-inner">
              <a class="logo" href="/">${this.logoText}<span class="logo-sub">${this.logoSub}</span></a>
              ${this._renderHeaderNav()}
              <div class="header-right">
                ${this.home?"":_`
                    <details class="mobile-menu">
                      <summary class="mobile-menu-btn" aria-label="Toggle navigation">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        >
                          <line x1="3" y1="4.5" x2="15" y2="4.5" />
                          <line x1="3" y1="9" x2="15" y2="9" />
                          <line x1="3" y1="13.5" x2="15" y2="13.5" />
                        </svg>
                      </summary>
                    </details>
                  `}
                <kiss-theme-toggle></kiss-theme-toggle>
                <a class="github-link" href="${this.githubUrl}">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                    />
                  </svg>
                  <span class="github-text">GitHub</span>
                </a>
              </div>
            </div>
          </header>
          <div class="mobile-backdrop"></div>
          <div class="layout-body">
            ${this.home?D:this._renderSidebarNav()}
            <main class="layout-main">
              <slot></slot>
            </main>
          </div>
          <div class="app-footer">
            <footer>
              <p>
                Built with <a href="${this.githubUrl}" target="_blank" rel="noopener noreferrer"
                >KISS Framework</a>
                <span class="divider"></span>
                Self-bootstrapped from JSR
                <span class="divider"></span>
                KISS Architecture — K·I·S·S
              </p>
            </footer>
          </div>
        </div>
      `}};is.styles=[Tt,w`
      :host {
        display: block;
      }

      /* === Layout Shell === */
      .app-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--kiss-bg-base);
        color: var(--kiss-text-primary);
        font-family: var(--kiss-font-sans);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .layout-body {
        display: flex;
        flex: 1;
      }

      .layout-main {
        flex: 1;
        min-width: 0;
      }

      .app-layout[home] .layout-body {
        display: block;
      }

      /* === Header === */
      .app-header {
        position: sticky;
        top: 0;
        z-index: var(--kiss-z-sticky);
        background: var(--kiss-bg-base);
        border-bottom: 1px solid var(--kiss-border);
      }

      .header-inner {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 var(--kiss-size-8);
        display: flex;
        align-items: center;
        height: var(--kiss-layout-header-height, 56px);
        gap: var(--kiss-size-6);
      }

      /* === Mobile Menu (L0: details/summary) === */
      .mobile-menu {
        display: none;
      }

      .mobile-menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        background: transparent;
        color: var(--kiss-text-tertiary);
        cursor: pointer;
        padding: 0;
        list-style: none;
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        }

        .mobile-menu-btn::-webkit-details-marker {
          display: none;
        }

        .mobile-menu-btn::marker {
          content: "";
        }

        .mobile-menu-btn:hover,
        .mobile-menu-btn:focus-visible {
          color: var(--kiss-text-primary);
          border-color: var(--kiss-border-hover);
          background: var(--kiss-accent-subtle);
        }

        .mobile-menu[open] .mobile-menu-btn {
          color: var(--kiss-text-primary);
          background: var(--kiss-accent-subtle);
          border-color: var(--kiss-border-hover);
        }

        /* === Logo === */
        .logo {
          font-size: var(--kiss-font-size-sm);
          font-weight: var(--kiss-font-weight-extrabold);
          color: var(--kiss-text-primary);
          text-decoration: none;
          letter-spacing: var(--kiss-letter-spacing-widest);
          text-transform: uppercase;
          transition: opacity var(--kiss-transition-normal);
          white-space: nowrap;
        }

        .logo:hover {
          opacity: 0.6;
        }

        .logo-sub {
          font-size: var(--kiss-font-size-xs);
          font-weight: var(--kiss-font-weight-normal);
          color: var(--kiss-text-muted);
          margin-left: var(--kiss-size-2);
          letter-spacing: var(--kiss-letter-spacing-wide);
          text-transform: none;
        }

        /* === Header Nav === */
        .header-nav {
          display: flex;
          gap: 0.125rem;
          flex: 1;
        }

        .header-nav a {
          color: var(--kiss-text-tertiary);
          text-decoration: none;
          font-size: var(--kiss-font-size-sm);
          font-weight: var(--kiss-font-weight-medium);
          padding: var(--kiss-size-2) var(--kiss-size-3);
          letter-spacing: var(--kiss-letter-spacing-wide);
          transition: color var(--kiss-transition-normal);
          border-radius: var(--kiss-radius-md);
        }

        .header-nav a:hover {
          color: var(--kiss-text-primary);
        }

        /* === Header Right === */
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--kiss-size-2);
          margin-left: auto;
        }

        /* === GitHub Link === */
        .github-link {
          display: inline-flex;
          align-items: center;
          gap: var(--kiss-size-2);
          color: var(--kiss-text-muted);
          text-decoration: none;
          font-size: var(--kiss-font-size-xs);
          font-weight: var(--kiss-font-weight-medium);
          letter-spacing: var(--kiss-letter-spacing-wide);
          padding: var(--kiss-size-2) var(--kiss-size-3);
          border: 1px solid var(--kiss-border);
          border-radius: var(--kiss-radius-md);
          transition: color var(--kiss-transition-normal), border-color var(--kiss-transition-normal);
        }

        .github-link:hover {
          color: var(--kiss-text-secondary);
          border-color: var(--kiss-border-hover);
        }

        .github-link svg {
          flex-shrink: 0;
        }

        /* === Sidebar (Desktop) === */
        .docs-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--kiss-border);
          padding: var(--kiss-size-6) 0;
          overflow-y: auto;
          height: calc(100vh - var(--kiss-layout-header-height, 56px));
          position: sticky;
          top: var(--kiss-layout-header-height, 56px);
          scrollbar-width: thin;
        }

        .nav-section {
          margin-bottom: var(--kiss-size-5);
        }

        .nav-section summary {
          font-size: var(--kiss-font-size-xs);
          font-weight: var(--kiss-font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--kiss-text-muted);
          padding: 0 var(--kiss-size-5);
          margin-bottom: var(--kiss-size-2);
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          gap: var(--kiss-size-2);
          user-select: none;
        }

        .nav-section summary::-webkit-details-marker {
          display: none;
        }

        .nav-section summary::marker {
          content: "";
        }

        .nav-section summary::before {
          content: "▾";
          font-size: 0.5rem;
          transition: transform var(--kiss-transition-normal);
          display: inline-block;
        }

        .nav-section[open] summary::before {
          transform: rotate(0deg);
        }

        .nav-section:not([open]) summary::before {
          transform: rotate(-90deg);
        }

        .nav-section summary:hover {
          color: var(--kiss-text-tertiary);
        }

        .docs-sidebar a {
          display: block;
          color: var(--kiss-text-tertiary);
          text-decoration: none;
          font-size: var(--kiss-font-size-sm);
          padding: 0.3rem var(--kiss-size-5);
          transition: color var(--kiss-transition-normal), background var(--kiss-transition-normal);
          border-left: 2px solid transparent;
        }

        .docs-sidebar a:hover {
          color: var(--kiss-text-primary);
          background: var(--kiss-accent-subtle);
        }

        .docs-sidebar a.active,
        .docs-sidebar a[aria-current="page"] {
          color: var(--kiss-text-primary);
          border-left-color: var(--kiss-text-primary);
          background: var(--kiss-accent-subtle);
          font-weight: var(--kiss-font-weight-medium);
        }

        /* === Mobile Backdrop === */
        .mobile-backdrop {
          position: fixed;
          inset: 0;
          top: var(--kiss-layout-header-height, 56px);
          background: var(--kiss-backdrop, rgba(0, 0, 0, 0.4));
          z-index: 80;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--kiss-transition-slow);
          backdrop-filter: blur(2px);
        }

        /* === Mobile Responsive === */
        @media (max-width: 900px) {
          .mobile-menu {
            display: block;
          }

          .header-inner {
            padding: 0 var(--kiss-size-4);
            gap: var(--kiss-size-3);
          }

          .header-nav {
            display: none;
          }

          .github-text {
            display: none;
          }

          .header-right {
            gap: var(--kiss-size-2);
          }

          .docs-sidebar {
            position: fixed;
            top: var(--kiss-layout-header-height, 56px);
            left: 0;
            width: min(300px, 80vw);
            height: calc(100vh - var(--kiss-layout-header-height, 56px));
            z-index: 90;
            background: var(--kiss-bg-base);
            border-right: 1px solid var(--kiss-border);
            border-bottom: none;
            padding: var(--kiss-size-4) 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            transform: translateX(-101%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
            box-shadow: none;
          }

          .app-layout:has(.mobile-menu[open]) .docs-sidebar {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          }

          .app-layout:has(.mobile-menu[open]) .mobile-backdrop {
            opacity: 1;
            pointer-events: auto;
          }

          :host([menu-open]) .docs-sidebar {
            transform: translateX(0);
            box-shadow: var(--kiss-shadow-sidebar, 4px 0 24px rgba(0, 0, 0, 0.3));
          }

          :host([menu-open]) .mobile-backdrop {
            opacity: 1;
            pointer-events: auto;
          }

          .nav-section {
            margin-bottom: var(--kiss-size-2);
          }

          .nav-section summary {
            padding: var(--kiss-size-2) var(--kiss-size-4);
            font-size: var(--kiss-font-size-xs);
          }

          .docs-sidebar a {
            padding: var(--kiss-size-2) var(--kiss-size-4) var(--kiss-size-2) var(--kiss-size-7);
            font-size: var(--kiss-font-size-sm);
          }

          .layout-main {
            width: 100%;
          }

          .app-footer footer {
            padding: var(--kiss-size-6) var(--kiss-size-4);
          }

          .app-footer .divider {
            display: none;
          }

          .app-footer p {
            line-height: 1.8;
          }
        }

        @media (max-width: 480px) {
          .logo-sub {
            display: none;
          }

          .github-link {
            padding: var(--kiss-size-2);
            border: none;
          }

          .header-inner {
            padding: 0 var(--kiss-size-3);
          }
        }

        /* === Footer === */
        .app-footer footer {
          padding: var(--kiss-size-8);
          border-top: 1px solid var(--kiss-border);
          text-align: center;
          color: var(--kiss-text-muted);
          font-size: var(--kiss-font-size-xs);
          letter-spacing: var(--kiss-letter-spacing-wide);
          background: var(--kiss-bg-base);
        }

        .app-footer p {
          margin: 0.25rem 0;
        }

        .app-footer a {
          color: var(--kiss-text-tertiary);
          text-decoration: none;
          transition: color var(--kiss-transition-normal);
        }

        .app-footer a:hover {
          color: var(--kiss-text-primary);
        }

        .app-footer .divider {
          display: inline-block;
          width: 1px;
          height: 8px;
          background: var(--kiss-border-hover);
          vertical-align: middle;
          margin: 0 var(--kiss-size-3);
        }
      `];is.properties={home:{type:Boolean,reflect:!0},currentPath:{type:String,attribute:"current-path"},navItems:{type:Array,attribute:"nav-items"},headerNav:{type:Array,attribute:"header-nav"},logoText:{type:String,attribute:"logo-text"},logoSub:{type:String,attribute:"logo-sub"},githubUrl:{type:String,attribute:"github-url"}};is.DEFAULT_NAV=[{section:"Introduction",items:[{path:"/guide/getting-started",label:"Getting Started"},{path:"/guide/design-philosophy",label:"Design Philosophy"},{path:"/guide/architecture",label:"KISS Architecture"}]},{section:"Core",items:[{path:"/guide/routing",label:"Routing"},{path:"/guide/islands",label:"Islands"},{path:"/guide/api-routes",label:"API Routes"},{path:"/guide/api-design",label:"API Design"},{path:"/guide/ssg",label:"SSG"}]},{section:"Guides",items:[{path:"/guide/configuration",label:"Configuration"},{path:"/guide/error-handling",label:"Error Handling"},{path:"/guide/security-middleware",label:"Security & Middleware"},{path:"/guide/testing",label:"Testing"}]},{section:"Reference",items:[{path:"/guide/deployment",label:"Deployment"},{path:"/styling/kiss-ui",label:"@kissjs/ui"},{path:"/styling/web-awesome",label:"Web Awesome"}]},{section:"Architecture",items:[{path:"/guide/kiss-compiler",label:"KISS Compiler"},{path:"/guide/pwa",label:"PWA Support"},{path:"/roadmap",label:"Roadmap"}]},{section:"UI",items:[{path:"/ui",label:"Design System"}]},{section:"Examples",items:[{path:"/examples",label:"Overview"},{path:"/examples/hello",label:"Hello World"},{path:"/examples/minimal-blog",label:"Minimal Blog"},{path:"/examples/fullstack",label:"Fullstack"}]},{section:"Blog",items:[{path:"/blog",label:"All Posts"},{path:"/blog/kiss-compiler",label:"KISS Compiler"}]},{section:"Project",items:[{path:"/changelog",label:"Changelog"},{path:"/contributing",label:"Contributing"}]}];is.DEFAULT_HEADER_NAV=[{href:"/guide/getting-started",label:"Docs"},{href:"/ui",label:"UI"},{href:"/blog",label:"Blog"},{href:"https://jsr.io/@kissjs/core",label:"JSR"}];let p0=is;customElements.define(m0,p0);const ja="docs-home",Hr=class Hr extends C{render(){return _`
      <kiss-layout home>
        <div class="hero">
          <div class="overline">Web 标准框架</div>
          <h1>KISS</h1>
          <p class="tagline">
            保持愚蠢，保持简单。一个完全基于 Web 标准构建的极简全栈框架。
          </p>
          <div class="equation">
            <span class="eq-item"><span class="eq-label">HTTP =</span> <span class="eq-val"
              >Fetch API</span></span>
            <span class="eq-item"><span class="eq-label">UI =</span> <span class="eq-val"
              >Web Components</span></span>
            <span class="eq-item"><span class="eq-label">构建 =</span> <span class="eq-val"
              >ESM</span></span>
            </div>
            <div class="cta">
              <a class="cta-primary" href="/guide/getting-started">快速上手</a>
              <a class="cta-secondary" href="https://github.com/SisyphusZheng/kiss">GitHub</a>
            </div>
          </div>

          <div class="standards">
            <div class="section-label">Web 标准覆盖</div>
            <div class="pill-row">
              <span class="pill"><span class="check">&#10003;</span> Fetch API</span>
              <span class="pill"><span class="check">&#10003;</span> Web Components</span>
              <span class="pill"><span class="check">&#10003;</span> ESM</span>
              <span class="pill"><span class="check">&#10003;</span> 声明式 Shadow DOM</span>
              <span class="pill"><span class="check">&#10003;</span> Islands 架构</span>
            </div>
          </div>

          <div class="features">
            <div class="section-label">为什么选 KISS</div>
            <div class="features-list">
              <div class="feature-item">
                <h2>Web 标准优先</h2>
                <p>没有新的抽象。如果你懂 Web 平台，你就懂 KISS。</p>
              </div>
              <div class="feature-item">
                <h2>Islands 架构</h2>
                <p>只有交互式组件才加载 JS。默认首页：0 KB。</p>
              </div>
              <div class="feature-item">
                <h2>类型安全 RPC</h2>
                <p>基于 Hono RPC 的端到端类型安全。无需代码生成。</p>
              </div>
              <div class="feature-item">
                <h2>多运行时</h2>
                <p>同一套代码运行在 Deno、Node、Bun、Cloudflare Workers。</p>
              </div>
              <div class="feature-item">
                <h2>SSG 内置</h2>
                <p>构建时预渲染为静态 HTML。零配置。</p>
              </div>
              <div class="feature-item">
                <h2>零锁定</h2>
                <p>你的代码在没有 KISS 时也能运行。Hono、Lit、Vite 都是标准工具。</p>
              </div>
            </div>
          </div>

          <div class="comparison">
            <div class="section-label">全链路 Web 标准</div>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>KISS</th>
                  <th>Astro</th>
                  <th>Next.js</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fetch API</td>
                  <td>Fetch API</td>
                  <td>自定义 API</td>
                </tr>
                <tr>
                  <td>Web Components</td>
                  <td>Islands（自定义）</td>
                  <td>仅 React</td>
                </tr>
                <tr>
                  <td>ESM</td>
                  <td>ESM</td>
                  <td>ESM + 自定义</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="jsr">
            <div class="section-label">从 JSR 安装</div>
            <div class="badge-row">
              <a class="jsr-badge" href="https://jsr.io/@kissjs/core">@kissjs/core</a>
              <a class="jsr-badge" href="https://jsr.io/@kissjs/ui">@kissjs/ui</a>
              <a class="jsr-badge" href="https://jsr.io/@kissjs/rpc">@kissjs/rpc</a>
            </div>
          </div>
        </kiss-layout>
      `}};Hr.styles=w`
    :host {
      display: block;
    }

    /* ─── Hero ─── */
    .hero {
      max-width: 800px;
      margin: 0 auto;
      padding: 12rem 2rem 6rem;
      text-align: left;
    }

    .hero .overline {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.24em;
      color: var(--kiss-text-muted);
      margin-bottom: 1.75rem;
      display: block;
    }

    .hero h1 {
      font-size: 5.5rem;
      font-weight: 900;
      letter-spacing: -0.06em;
      margin: 0;
      color: var(--kiss-text-primary);
      line-height: 0.9;
    }

    .hero .tagline {
      font-size: 1.0625rem;
      color: var(--kiss-text-secondary);
      margin-top: 2.25rem;
      line-height: 1.8;
      font-weight: 400;
      max-width: 480px;
    }

    .hero .equation {
      margin-top: 3rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .eq-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: var(--kiss-bg-surface);
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--kiss-text-tertiary);
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .eq-item:hover {
      border-color: var(--kiss-border-hover);
      background: var(--kiss-bg-elevated);
    }

    .eq-label {
      color: var(--kiss-text-muted);
      font-weight: 400;
    }

    .eq-val {
      color: var(--kiss-text-primary);
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .cta {
      margin-top: 3rem;
      display: flex;
      gap: 0.75rem;
    }

    .cta a {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .cta-primary {
      background: var(--kiss-text-primary);
      color: var(--kiss-bg-base);
    }

    .cta-primary:hover {
      opacity: 0.85;
      transform: translateY(-1px);
    }

    .cta-secondary {
      background: transparent;
      color: var(--kiss-text-secondary);
      border: 1px solid var(--kiss-border);
    }

    .cta-secondary:hover {
      color: var(--kiss-text-primary);
      border-color: var(--kiss-border-hover);
      transform: translateY(-1px);
    }

    /* ─── Standards ─── */
    .standards {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--kiss-border);
    }

    .section-label {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--kiss-text-muted);
      margin-bottom: 1.5rem;
    }

    .pill-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--kiss-bg-surface);
      color: var(--kiss-text-secondary);
      border: 1px solid var(--kiss-border);
      transition: border-color 0.2s, color 0.2s, background 0.2s;
    }

    .pill:hover {
      border-color: var(--kiss-border-hover);
      color: var(--kiss-text-primary);
      background: var(--kiss-bg-elevated);
    }

    .pill .check {
      color: var(--kiss-accent);
      font-size: 0.625rem;
      font-weight: 700;
    }

    /* ─── Features ─── */
    .features {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--kiss-border);
    }

    .features-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .feature-item {
      padding: 2rem 1.75rem;
      border-bottom: 1px solid var(--kiss-border);
      transition: background 0.2s ease;
    }

    .feature-item:nth-child(odd) {
      border-right: 1px solid var(--kiss-border);
    }

    .feature-item:nth-last-child(-n+2) {
      border-bottom: none;
    }

    .feature-item:hover {
      background: var(--kiss-bg-surface);
    }

    .feature-item h2 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: var(--kiss-text-primary);
      letter-spacing: -0.01em;
    }

    .feature-item p {
      font-size: 0.8125rem;
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.65;
    }

    /* ─── Comparison ─── */
    .comparison {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      border-top: 1px solid var(--kiss-border);
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 0.875rem 1.125rem;
      text-align: left;
      border-bottom: 1px solid var(--kiss-border);
    }

    .comparison-table th {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--kiss-text-muted);
    }

    .comparison-table th:first-child {
      color: var(--kiss-text-primary);
    }

    .comparison-table td {
      color: var(--kiss-text-tertiary);
    }

    .comparison-table td:first-child {
      color: var(--kiss-text-primary);
      font-weight: 500;
    }

    .comparison-table tr:hover td {
      background: var(--kiss-bg-surface);
    }

    /* ─── JSR ─── */
    .jsr {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem 6rem;
      border-top: 1px solid var(--kiss-border);
    }

    .badge-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .jsr-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background: var(--kiss-bg-surface);
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--kiss-text-secondary);
      text-decoration: none;
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      transition: all 0.2s ease;
    }

    .jsr-badge:hover {
      background: var(--kiss-bg-elevated);
      color: var(--kiss-text-primary);
      border-color: var(--kiss-border-hover);
      transform: translateY(-1px);
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .hero {
        padding: 5rem 1.5rem 3rem;
      }

      .hero h1 {
        font-size: 3rem;
      }

      .features-list {
        grid-template-columns: 1fr;
      }

      .feature-item:nth-child(odd) {
        border-right: none;
      }
    }

    @media (max-width: 480px) {
      .hero h1 {
        font-size: 2.5rem;
      }

      .hero .equation {
        flex-direction: column;
      }
    }
  `;let Cs=Hr;customElements.define("docs-home",Cs);const F=w`
  :host {
    display: block;
  }

  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }

  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 0.5rem;
    color: var(--kiss-text-primary);
    line-height: 1.2;
  }

  .subtitle {
    color: var(--kiss-text-tertiary);
    margin-bottom: 3rem;
    font-size: 0.9375rem;
    line-height: 1.7;
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem;
    color: var(--kiss-text-primary);
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: var(--kiss-accent-dim);
  }

  p {
    line-height: 1.7;
    margin: 0.5rem 0;
    color: var(--kiss-text-secondary);
    font-size: 0.9375rem;
  }

  strong {
    color: var(--kiss-text-primary);
    font-weight: 600;
  }

  em {
    color: var(--kiss-accent-dim);
    font-style: italic;
  }

  a {
    color: var(--kiss-text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--kiss-border-hover);
    text-decoration-thickness: 1px;
    transition: text-decoration-color 0.15s;
  }

  a:hover {
    text-decoration-color: var(--kiss-text-primary);
  }

  /* Code blocks */
  pre {
    background: var(--kiss-code-bg);
    color: var(--kiss-text-secondary);
    padding: 1rem 1.25rem;
    border-radius: 3px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.6;
    margin: 0.75rem 0;
  }

  code {
    font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  }

  .inline-code {
    background: var(--kiss-code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.875em;
  }

  p code, li code {
    background: var(--kiss-code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.8125rem;
    color: var(--kiss-accent-dim);
    border: 1px solid var(--kiss-code-border);
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0 1.5rem;
    font-size: 0.875rem;
  }

  th, td {
    border: 1px solid var(--kiss-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  th {
    background: var(--kiss-code-bg);
    font-weight: 600;
    color: var(--kiss-accent-dim);
  }

  td {
    color: var(--kiss-text-secondary);
  }

  /* Callout blocks */
  .pillar {
    padding: 1.25rem 1.5rem;
    margin: 1rem 0;
    border-left: 3px solid var(--kiss-border-hover);
    background: var(--kiss-bg-surface);
    border-radius: 0 3px 3px 0;
  }

  .pillar .num {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--kiss-text-muted);
    margin-bottom: 0.25rem;
  }

  .pillar h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: var(--kiss-text-primary);
  }

  .hard-constraint {
    display: inline-block;
    background: var(--kiss-code-bg);
    border: 1px solid var(--kiss-border-hover);
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    font-size: 0.8125rem;
    margin: 0.125rem 0;
  }

  .callout {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    border-left: 3px solid var(--kiss-border-hover);
    background: var(--kiss-bg-surface);
    border-radius: 0 3px 3px 0;
  }

  .callout.warn {
    border-left-color: var(--kiss-text-tertiary);
  }

  /* Lists */
  ul, ol {
    padding-left: 1.25rem;
    color: var(--kiss-text-secondary);
    line-height: 1.7;
  }

  li {
    margin: 0.375rem 0;
  }

  /* Page nav */
  .nav-row {
    margin-top: 2.5rem;
    display: flex;
    justify-content: space-between;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--kiss-text-secondary);
    text-decoration: none;
    border: 1px solid var(--kiss-border);
    border-radius: 4px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    letter-spacing: 0.01em;
  }

  .nav-link:hover {
    color: var(--kiss-text-primary);
    border-color: var(--kiss-border-hover);
    background: var(--kiss-accent-subtle);
  }

  /* === Responsive === */
  @media (max-width: 900px) {
    .container {
      padding: 2rem 1.25rem 3rem;
    }

    h1 {
      font-size: 1.625rem;
    }

    .subtitle {
      margin-bottom: 2rem;
    }

    h2 {
      margin: 1.5rem 0 0.5rem;
    }

    pre {
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
      border-radius: 4px;
    }

    table {
      font-size: 0.75rem;
    }

    th, td {
      padding: 0.5rem 0.625rem;
    }

    .pillar, .callout {
      padding: 1rem;
    }

    .nav-row {
      flex-direction: column;
      gap: 0.75rem;
    }

    .nav-link {
      text-align: center;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1.5rem 1rem 2.5rem;
    }

    h1 {
      font-size: 1.375rem;
    }

    .subtitle {
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    h2 {
      font-size: 1rem;
    }

    p {
      font-size: 0.875rem;
    }

    pre {
      padding: 0.75rem;
      font-size: 0.6875rem;
      margin: 0.5rem 0;
    }

    code {
      font-size: 0.75rem;
    }

    ul, ol {
      padding-left: 1rem;
    }

    .hard-constraint {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
    }
  }
`,Br=class Br extends C{render(){return _`
      <kiss-layout>
        <div class="container" style="text-align:center;padding-top:4rem">
          <div class="error-code">404</div>
          <p class="error-message">
            This page does not exist — or has moved to a different route.
          </p>
          <a href="/" class="home-link">&larr; Back to home</a>
        </div>
      </kiss-layout>
    `}};Br.styles=[F,w`
      .error-code {
        font-size: 5rem;
        font-weight: 800;
        letter-spacing: -0.06em;
        color: var(--kiss-text-primary);
        margin: 2rem 0 0.5rem;
        line-height: 1;
      }
      .error-message {
        color: var(--kiss-text-tertiary);
        font-size: 0.9375rem;
        margin-bottom: 2rem;
      }
      .home-link {
        display: inline-block;
        padding: 0.5rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        color: var(--kiss-text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s;
      }
      .home-link:hover {
        border-color: var(--kiss-text-primary);
      }
    `];let ws=Br;customElements.define("page-not-found",ws);const za="page-not-found",Fr=class Fr extends C{render(){return _`
      <kiss-layout currentPath="/blog">
        <div class="container">
          <h1>博客</h1>
          <p class="subtitle">KISS 框架的设计思考、架构决策和发展路线。</p>

          <div class="blog-list">
            <a href="/blog/kiss-compiler" class="blog-item">
              <h2>.kiss Compiler — 消灭 Lit，零运行时 Web Components</h2>
              <p class="meta">2026-04-30 · 架构决策</p>
              <p>KISS 的终极目标：一个自定义编译器将声明式 .kiss 文件编译为原生 Custom Elements，彻底消除 58kb 的 Lit 运行时。</p>
            </a>
          </div>
        </div>
      </kiss-layout>
    `}};Fr.styles=[F,w`
      .blog-list { list-style: none; padding: 0; margin: 1.5rem 0; }
      .blog-item {
        padding: 1rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        transition: border-color 0.15s;
        display: block;
        text-decoration: none;
        color: inherit;
      }
      .blog-item:hover { border-color: var(--kiss-text-primary); }
      .blog-item h2 { font-size: 0.9375rem; margin: 0 0 0.25rem; font-weight: 500; color: var(--kiss-text-primary); }
      .blog-item .meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin: 0; }
      .blog-item p { font-size: 0.8125rem; color: var(--kiss-text-secondary); margin: 0.5rem 0 0; }
    `];let Ns=Fr;customElements.define("page-blog-index",Ns);const Ka="page-blog-index",Ur=class Ur extends C{render(){return _`
      <kiss-layout currentPath="/blog/kiss-compiler">
        <div class="container">
          <p class="blog-meta">2026-04-30 · SisyphusZheng</p>
          <h1>.kiss Compiler — 消灭 Lit，零运行时 Web Components</h1>

          <p>
            KISS 框架从第一天起就选择了 Lit 作为组件基础。这个选择是对的——Lit 是 Web Components 生态中
            最成熟的库，让我们快速验证了 K·I·S·S 架构的可行性。但经过 v0.3.x 三轮代码审查，我们清楚地看到：
            Lit 的 58kb gzip 运行时、@lit-labs/ssr 的 CJS polyfill、hydration 顺序问题、以及 dprint fmt panic，
            这些不是可以修补的小问题——是架构层面的摩擦。
          </p>

          <h2>今天的代价</h2>
          <p>
            每个依赖 Lit 的 KISS 页面都要下载 58kb gzip 的运行时。SSR 需要 @lit-labs/ssr，
            它又依赖 node-domexception——一个 CJS 包，我们被迫用 globalThis.module polyfill。
            客户端 hydration 需要 litElementHydrateSupport 在 customElements.define 之前执行，
            这导致过"计数器重复渲染"的 bug。Deno fmt 在处理 Lit 模板字面量中的 HTML entities 时会 panic。
            这些不是小问题——是 Lit 的 CSFirst 设计与 KISS 的 SSG-first 架构的根本摩擦。
          </p>

          <h2>.kiss 文件格式</h2>
          <p>一个组件一个文件。没有 class 声明，没有 decorator，没有 import：</p>
          <div class="code-block">&lt;!-- my-counter.kiss --&gt;
&lt;template&gt;
  &lt;button @click="decrement"&gt;−&lt;/button&gt;
  &lt;span&gt;{count}&lt;/span&gt;
  &lt;button @click="increment"&gt;+&lt;/button&gt;
&lt;/template&gt;

&lt;script&gt;
  count = 0
  increment() { this.count++ }
  decrement() { this.count-- }
&lt;/script&gt;

&lt;style&gt;
  :host { display: inline-flex; gap: 0.5rem; align-items: center; }
&lt;/style&gt;</div>

          <h2>编译器产出</h2>
          <p>零依赖的原生 Custom Element：</p>
          <div class="code-block">class MyCounter extends HTMLElement {
  #count = 0;
  #root = this.attachShadow({ mode: 'open' });
  get count() { return this.#count; }
  set count(v) { this.#count = v; this.#update(); }
  connectedCallback() {
    this.#root.append(tpl.content.cloneNode(true));
    this.#root.querySelector('button:first-child').onclick =
      () => this.count--;
    this.#root.querySelector('button:last-child').onclick =
      () => this.count++;
  }
}</div>

          <h2>消除清单</h2>
          <p>
            — 58kb gzip lit 运行时 → 0kb<br>
            — @lit-labs/ssr + DOM shim → template.innerHTML (同步)<br>
            — DSD + hydrate() + 时序 bug → template.cloneNode (无 hydration)<br>
            — node-domexception CJS polyfill → 0 polyfill<br>
            — esbuild decorator transform → 标准 JS<br>
            — 复杂的类型层次 → 简单的 getter/setter
          </p>

          <h2>路线</h2>
          <p>
            这项工作在 roadmap 上列为 Phase 11，目标 v1.0。Lit 兼容模式在整个 v0.x
            生命周期中都会保留。在 Phase 10 (v0.4.0) 我们聚焦于 PWA、博客模块和文档完善，
            为 v1.0 的架构升级做准备。
          </p>
          <p>
            详细技术设计见 <code>docs/decisions/0002-kiss-compiler-eliminate-lit.md</code>。
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/blog" class="nav-link">&larr; 返回博客</a>
          </div>
        </div>
      </kiss-layout>
    `}};Ur.styles=[F,w`
      .blog-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      p { font-size: 0.875rem; line-height: 1.7; margin: 0 0 0.75rem; }
      .code-block { 
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
    `];let Rs=Ur;customElements.define("page-blog-kiss-compiler",Rs);const Ya="page-blog-kiss-compiler",$r=class $r extends C{render(){return _`
      <kiss-layout currentPath="/changelog">
        <div class="container">
          <h1>更新日志</h1>
          <p class="subtitle">
            KISS 的所有重要变更都记录在这里。
          </p>

          <p>
            格式基于
            <a href="https://keepachangelog.com/zh-CN/1.0.0/" target="_blank">Keep a Changelog</a>，本项目遵循
            <a href="https://semver.org/lang/zh-CN/" target="_blank">语义化版本 2.0.0</a>。
          </p>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.3.4</span>
              <span class="version-date">2026-04-30</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li><strong>scanIslands 递归扫描</strong>：支持 app/islands/posts/index.ts 等子目录结构</li>
                <li><strong>CI 并行化</strong>：test.yml 拆分为 typecheck + 4 个并行 test job</li>
                <li><strong>CI 缓存</strong>：所有 job 添加 actions/cache，减少依赖安装时间</li>
                <li>移动端侧边栏 nav link 点击自动关闭（@kissjs/ui 文档站）</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li><strong>三阶段构建管线文档化</strong>：架构文档插件表更新为 v0.3.0 实际插件列表，构建生命周期从 closeBundle 嵌套 Vite 改为三阶段 CLI 描述</li>
                <li><strong>deno-version 锁定</strong>：所有 workflow 从 v2.x 改为 "2"，防止 Deno 3.0 意外破坏构建</li>
                <li><strong>kissDesignTokens 导出 tokens 子路径</strong>：@kissjs/ui/tokens/colors, effects, spacing, typography 独立导出</li>
                <li><strong>kiss-error CSS 变量</strong>：组件错误状态统一使用可配置的 --kiss-error 变量</li>
                <li><strong>kiss-layout 可配置 header 高度</strong>：56px 硬编码替换为 --kiss-layout-header-height CSS 变量</li>
                <li>README 包版本号更新至 0.3.2 / 0.2.3</li>
                <li>README coverage badge 替换为 CI badge</li>
                <li>@kissjs/ui-plugin 的 cdn:false 配置项 JSDoc 修正：不再误导性地说"使用 npm 替代"</li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li><strong>主题切换按钮点击无响应（v0.2.x 历史问题）</strong>：kiss-theme-toggle 在 Shadow DOM 中事件的 composedPath() 未正确穿透，导致点击事件被吞；data-theme 未传播到所有嵌套组件的 host 元素。根因：@lit-labs/ssr 渲染后 hydration 顺序错误 — litElementHydrateSupport({LitElement}) 在 customElements.define() 之前未执行</li>
                <li><strong>Island 计数器重复渲染（v0.2.x 历史问题）</strong>：静态 import 导致 customElements.define() 在 hydration 补丁执行前运行，Lit 对已定义的元素做 DSD 水合时先全量渲染再 patch，造成两次渲染。修复：改为动态 import() 确保 hydration 补丁先执行</li>
                <li><strong>Island chunk 404</strong>：build-client.ts 未设置 base='/client/'，Vite 生成的 __vite__mapDeps 指向 /islands/*.js 而非 /client/islands/*.js</li>
                <li><strong>DSD polyfill 报错</strong>：template-shadowroot document.write() polyfill 在 ESM 环境下报 "Cannot use import statement outside module"，移除（现代浏览器已原生支持 DSD）</li>
                <li><strong>P0 — kiss-input 显示 "undefined" 字符串</strong>：.value="\${this.value ?? ''}"，避免未设置值时显示文本 "undefined"</li>
                <li><strong>P0 — @kissjs/core 缺少 CLI exports</strong>：deno.json 和 jsr.json 未导出 cli/build-client 和 cli/build-ssg，导致 create-kiss 脚手架创建的项目无法运行 deno task build:client/build:ssg</li>
                <li><strong>P0 — dist/tokens/colors.js 缺失</strong>：deno.json 已声明导出但构建产出中不存在（build 重新执行后修复）</li>
                <li><strong>P0 — SSG 构建崩溃（globalThis.module 删早）</strong>：CJS polyfill 在 ssrLoadModule 被删除，导致 node-domexception 报 ReferenceError</li>
                <li><strong>P1 — 暗色模式阴影不可见</strong>：effects.ts 中 rgba(0,0,0,...) 阴影在黑色背景上不可见，添加 [data-theme="dark"] 亮色阴影变体</li>
                <li><strong>P1 — kiss-button href/target 渲染 "undefined"</strong>：href=\${hrefAttr} / target=\${this.target} 在未设置时渲染字面量 "undefined"，改用 nothing sentinel</li>
                <li><strong>P1 — kiss-button 每次 render 创建新箭头函数</strong>：disabled 时的 @click 内联箭头函数提取为类方法 _preventClick</li>
                <li><strong>P1 — kiss-input 错误状态 ARIA 默认值</strong>：aria-invalid="false" / aria-errormessage="" 始终存在，改用 nothing sentinel</li>
                <li><strong>P1 — kiss-code-block setTimeout 无清理</strong>：添加 _copyTimer + disconnectedCallback 清除超时</li>
                <li><strong>P1 — colors.ts 注释颠倒</strong>：kissDarkColors / kissLightColors 的 JSDoc Light/Dark 标签互换</li>
                <li><strong>P1 — kiss-rpc 重试延迟不响应 abort</strong>：await new Promise(setTimeout) 不监听 signal.aborted，改为 race 模式</li>
                <li><strong>P1 — kiss-theme-toggle 无限递归</strong>：_propagateTheme 无递归深度限制，添加 depth 参数 + 最大 10 层</li>
                <li><strong>P2 — vite-plugin-dts 隐式依赖</strong>：@kissjs/rpc 的 devDependencies 中包含 vite-plugin-dts，但 @kissjs/core 也使用但未声明</li>
                <li><strong>P2 — build-ssg.ts 全局污染未清理</strong>：CJS polyfill（globalThis.module/exports）用完未 delete</li>
                <li><strong>P2 — ssg-smoke 测试 silent pass</strong>：7 个测试在无构建产出时 return 而非跳过，改为 Deno.test({ ignore })</li>
                <li><strong>P0/P1 — 8 个 assertEquals(true, true) 僵尸断言</strong>：替换为有意义断言或移除</li>
                <li><strong>types.ts JSDoc 错误</strong>：packageIslands 注释说 '@kissjs/ui/islands'，实际实现是 import(pkg).islands</li>
                <li><strong>context.ts decodeURIComponent 无保护</strong>：遇畸形编码抛 URIError，添加 try-catch 回退</li>
                <li><strong>RpcController.hostConnected() 死代码</strong>：空方法 + 对应测试一并移除</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.3.0</span>
              <span class="version-date">2026-04-29</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li><strong>Package Islands 自动检测</strong>：通过 packageIslands 配置自动扫描并注册来自 npm/JSR 包的 Islands</li>
                <li><strong>kiss-theme-toggle Island</strong>：Dark/Light 主题切换组件，从 kiss-layout 中提取为独立 Island（DSD + hydration）</li>
                <li><strong>KissBuildContext 架构重构</strong>：替代闭包共享可变状态，提升构建管道的可测试性</li>
                <li><strong>EntryDescriptor + renderEntry 模板化</strong>：替代 hono-entry.ts 的字符串拼接</li>
                <li>Vite manifest 集成：build.ts 使用 build.manifest:true 生成客户端入口映射</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li><strong>kiss-layout 简化为纯静态组件</strong>：移除 _isLight 属性、localStorage 读取、_handleThemeToggle 方法</li>
                <li>L2 全局主题切换脚本已删除：由 kiss-theme-toggle Island hydration 替代</li>
                <li>客户端构建自动化生成包内 Island 导入和注册代码</li>
                <li>SSG post-processing 使用 insertBeforeBodyClose/insertAfterHead 辅助函数，替代 naive string replace</li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li>Island chunk 检测从 grep JS 文件内容改为读取 Rollup manifest（确定性、无误报）</li>
                <li>HTML 插入操作增强鲁棒性：处理标签属性、大小写差异、空白变体</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.2.0</span>
              <span class="version-date">2026-04-27</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li>
                  <strong>Package Islands 自动检测</strong>：自动检测并注册来自 npm/JSR 包的 Islands
                </li>
                <li>
                  <code>packageIslands</code> configuration option to specify which packages to scan
                </li>
                <li>
                  <code>scanPackageIslands()</code> function to dynamically import packages and read
                  <code>islands</code> export
                </li>
                <li>
                  <code>kiss-theme-toggle</code> Island for theme switching (Dark/Light)
                </li>
                <li>
                  Package Island metadata type: <code>PackageIslandMeta</code>
                </li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>
                  <strong>破坏性变更</strong>：<code>kiss-layout</code> 主题切换逻辑已移除 — 请使用
                  <code>kiss-theme-toggle</code> Island
                </li>
                <li>
                  <code>kiss-layout</code> simplified to static component (no client-side state)
                </li>
                <li>
                  L2 theme toggle script removed (replaced by Island hydration)
                </li>
                <li>
                  Client build now auto-generates import and registration code for package Islands
                </li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li>主题切换现在使用正确的 Island hydration (DSD + 客户端状态)</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.7</span>
              <span class="version-date">2026-04-27</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li>Logger 模块支持 <code>KISS_LOG_LEVEL</code> 环境变量</li>
                <li>
                  @kissjs/ui 组件库：kiss-button, kiss-card, kiss-input, kiss-code-block, kiss-layout
                </li>
                <li>design-tokens CSS 自定义属性（瑞士国际主义风格）</li>
                <li>examples/hello 最小示例：演示 KISS 基础</li>
                <li>文档站 dogfooding：/ui 页面使用真实 KISS UI 组件</li>
                <li>SSR 兼容性文档（/guide/ssg）</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>@kissjs/ui 版本升级至 0.1.4</li>
                <li>文档站现在导入 @kissjs/ui 组件</li>
                <li>迁移所有示例到 static properties + customElements.define() 模式</li>
                <li>移除 packages/kiss-ui/deno.json 中的 experimentalDecorators 配置</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.6</span>
              <span class="version-date">2026-04-26</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li>纯黑白色设计系统 + 主题切换</li>
                <li>/ui 设计系统展示页面</li>
                <li>移动端响应式侧边栏 + 汉堡菜单</li>
                <li>CSS :has() 选择器实现侧边栏切换（零 JS）</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>合并页面样式（pageStyles）— 消除 840 行重复 CSS</li>
                <li>移除页面样式中所有 !important  hack</li>
                <li>侧边栏现在使用滑入动画 + 背景模糊</li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li>点击背景现在可以关闭侧边栏（L2 脚本）</li>
                <li>移动端响应式布局改进</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.5</span>
              <span class="version-date">2026-04-20</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li>KISS 架构文档（K·I·S·S 四约束）</li>
                <li>DSD（声明式 Shadow DOM）输出支持</li>
                <li>Jamstack 对齐文档</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>从 DIA 重新品牌为 KISS Architecture</li>
                <li>更新 README 包含双重含义（理念 + 架构）</li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.1.4</span>
              <span class="version-date">2026-04-15</span>
            </div>

            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li>inject 选项：自定义样式表/脚本注入</li>
                <li>API Routes 部署文档</li>
              </ul>
            </div>

            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>标记 ui 选项已弃用（请使用 inject）</li>
              </ul>
            </div>

            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li>RPC call() 现在抛出 RpcError 而不是返回 null</li>
              </ul>
            </div>
          </div>

          <h2>上游依赖 / 兼容性问题</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>问题</th>
                <th>根源</th>
                <th>影响</th>
                <th>缓解方案</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Deno fmt dprint-core panic</td>
                <td>dprint-core 0.67.4 在处理嵌套 Lit 模板字面量（含 HTML 实体 &lt; 等）时 panic</td>
                <td>docs/ 中 Lit tagged template 无法格式化</td>
                <td>CI 中 fmt --check 跳过 docs/，仅检查 packages/</td>
              </tr>
              <tr>
                <td>node-domexception CJS 兼容</td>
                <td>node-domexception@1.0.0 使用 module.exports (CJS)，Deno 的 ESM 运行时无法直接加载</td>
                <td>SSG 构建失败：ReferenceError: module is not defined</td>
                <td>globalThis.module / exports polyfill，用完后 finally 清理</td>
              </tr>
              <tr>
                <td>parse5 / entities 版本锁</td>
                <td>entities@6 与 parse5@7 的兼容性要求，需同步升级</td>
                <td>依赖安装失败</td>
                <td>升级 entities 到 ^6</td>
              </tr>
              <tr>
                <td>Lit SSR + hydration 时序</td>
                <td>@lit-labs/ssr-client 的 litElementHydrateSupport() 必须在 customElements.define() 之前执行，否则已注册的元素会全量渲染再 patch（双重渲染）</td>
                <td>Island 组件双重渲染 / hydration 不匹配</td>
                <td>动态 import() 确保 hydration 补丁先于任何组件注册执行</td>
              </tr>
              <tr>
                <td>@kissjs/core → lit resolve alias</td>
                <td>Vite lib mode 构建中将 @kissjs/core 映射为 lit，使编译产物直接依赖 lit 而非 @kissjs/core</td>
                <td>@kissjs/ui 的 dist 消费者无需安装 @kissjs/core</td>
                <td>resolve.alias + build.ts serializeAlias 传递到 CLI 构建</td>
              </tr>
              <tr>
                <td>Window CRLF vs Unix LF</td>
                <td>Windows Git 自动转换行尾导致 deno fmt CI 失败</td>
                <td>多平台协作者间格式冲突</td>
                <td>.gitattributes eol=lf 统一行尾</td>
              </tr>
              <tr>
                <td>tsup → Vite lib mode</td>
                <td>tsup 不支持 Deno 的 node: 前缀保留</td>
                <td>Node 原生模块导入失败</td>
                <td>迁移至 Vite lib format: 'es'，天然保留 node: 前缀</td>
              </tr>
            </tbody>
          </table>

          <h2>版本历史</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>版本</th>
                <th>日期</th>
                <th>亮点</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0.3.4</td>
                <td>2026-04-30</td>
                <td>Code audit fixes + upstream compat docs + version bump + release</td>
              </tr>
              <tr>
                <td>0.3.0</td>
                <td>2026-04-29</td>
                <td>Package Islands auto-detection + kiss-theme-toggle Island + build pipeline refactor</td>
              </tr>
              <tr>
                <td>0.2.0</td>
                <td>2026-04-27</td>
                <td>Package Islands auto-detection + kiss-theme-toggle Island</td>
              </tr>
              <tr>
                <td>0.1.7</td>
                <td>2026-04-27</td>
                <td>Architecture audit + dogfooding + docs self-hosting</td>
              </tr>
              <tr>
                <td>0.1.6</td>
                <td>2026-04-26</td>
                <td>Design system + mobile responsive</td>
              </tr>
              <tr>
                <td>0.1.5</td>
                <td>2026-04-20</td>
                <td>KISS Architecture branding</td>
              </tr>
              <tr>
                <td>0.1.4</td>
                <td>2026-04-15</td>
                <td>inject option + API Routes docs</td>
              </tr>
              <tr>
                <td>0.1.3</td>
                <td>2026-04-10</td>
                <td>@kissjs/rpc + @kissjs/ui</td>
              </tr>
              <tr>
                <td>0.1.2</td>
                <td>2026-04-05</td>
                <td>Island AST transform</td>
              </tr>
              <tr>
                <td>0.1.1</td>
                <td>2026-04-01</td>
                <td>Initial JSR release</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/roadmap" class="nav-link">&larr; 开发计划</a>
            <a href="/guide/getting-started" class="nav-link">快速上手 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};$r.styles=[F,w`
      .version-section {
        margin: 2rem 0;
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .version-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .version-number {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--kiss-text-primary);
      }
      .version-date {
        font-size: 0.75rem;
        color: var(--kiss-text-muted);
        padding: 0.25rem 0.5rem;
        background: var(--kiss-bg-elevated);
        border-radius: 3px;
      }
      .change-category {
        margin: 1rem 0;
      }
      .change-category h4 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
        margin-bottom: 0.5rem;
      }
      .change-category.added h4 {
        color: var(--kiss-accent);
      }
      .change-category.changed h4 {
        color: var(--kiss-accent-dim);
      }
      .change-category.fixed h4 {
        color: var(--kiss-text-secondary);
      }
      .change-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .change-list li {
        padding: 0.375rem 0;
        padding-left: 1.25rem;
        position: relative;
        color: var(--kiss-text-secondary);
        font-size: 0.875rem;
      }
      .change-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--kiss-text-muted);
      }
      .version-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .version-table th,
      .version-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--kiss-border);
      }
      .version-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .version-table td:first-child {
        font-weight: 600;
        color: var(--kiss-text-primary);
      }
    `];let Ls=$r;customElements.define("page-changelog",Ls);const Wa="page-changelog",f0="code-block",ua=class ua extends C{constructor(){super(...arguments),this._copyState="idle"}render(){return _`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState==="copied"?"copied":""} ${this._copyState==="failed"?"failed":""}"
        @click="${()=>this._copy()}"
      >
        ${this._copyState==="copied"?"✓ Copied!":this._copyState==="failed"?"✗ Failed":"Copy"}
      </button>
    `}async _copy(){try{const t=this.textContent||"";await navigator.clipboard.writeText(t),this._copyState="copied",setTimeout(()=>{this._copyState="idle"},2e3)}catch{this._copyState="failed",setTimeout(()=>{this._copyState="idle"},2e3)}}};ua.styles=w`
    :host {
      display: block;
      position: relative;
    }

    ::slotted(pre) {
      margin: 0;
      padding: 1.25rem;
      background: var(--kiss-code-bg);
      border: 1px solid var(--kiss-code-border);
      border-radius: 2px;
      overflow-x: auto;
      font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      font-size: 0.8125rem;
      line-height: 1.6;
      color: var(--kiss-text-secondary);
      scrollbar-width: thin;
      scrollbar-color: var(--kiss-scrollbar-thumb) transparent;
    }

    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--kiss-bg-elevated);
      color: var(--kiss-text-tertiary);
      border: 1px solid var(--kiss-border);
      padding: 0.25rem 0.625rem;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      border-radius: 2px;
      transition: color 0.15s, border-color 0.15s;
      z-index: 1;
    }

    .copy-btn:hover {
      color: var(--kiss-text-secondary);
      border-color: var(--kiss-border-hover);
    }

    .copy-btn.copied {
      color: var(--kiss-text-primary);
      border-color: var(--kiss-border-hover);
    }

    .copy-btn.failed {
      color: var(--kiss-error, #e55);
      border-color: var(--kiss-error, #e55);
    }
  `,ua.properties={_copyState:{state:!0}};let Os=ua;customElements.define(f0,Os);const jr=class jr extends C{render(){return _`
      <kiss-layout currentPath="/contributing">
        <div class="container">
          <h1>Contributing to KISS</h1>
          <p class="subtitle">感谢你对 KISS 框架的兴趣！</p>

          <h2>开发环境设置</h2>
          <code-block
          ><pre><code># 克隆仓库
git clone https://github.com/SisyphusZheng/kiss.git
cd kiss

# 安装依赖
deno install

# 运行测试
deno task test

# 启动文档站开发服务器
deno task docs:dev</code></pre></code-block>

          <h2>项目结构</h2>
          <code-block
          ><pre><code>kiss/
├── packages/
│   ├── kiss-core/    # 核心 Vite 插件
│   ├── kiss-rpc/     # RPC 客户端控制器
│   └── kiss-ui/      # UI 插件
├── docs/             # 文档站（自举）
└── scripts/          # 工具脚本</code></pre></code-block>

          <h2>开发规范</h2>

          <h3>代码风格</h3>
          <ul>
            <li>使用 Deno 内置格式化：<code>deno fmt</code></li>
            <li>使用 Deno 内置 lint：<code>deno lint</code></li>
            <li>遵循 KISS Architecture 四约束（K·I·S·S）</li>
          </ul>

          <h3>提交规范</h3>
          <p>使用 Conventional Commits：</p>
          <div class="commit-types">
            <div class="commit-type"><code>feat:</code> 新功能</div>
            <div class="commit-type"><code>fix:</code> 修复 bug</div>
            <div class="commit-type"><code>docs:</code> 文档更新</div>
            <div class="commit-type"><code>refactor:</code> 重构</div>
            <div class="commit-type"><code>test:</code> 测试相关</div>
            <div class="commit-type"><code>chore:</code> 杂项</div>
          </div>

          <h3>分层原则</h3>
          <p>在添加新功能前，检查是否可以用更低层级解决：</p>
          <div class="layer-diagram">L0 HTML5 语义 — 结构、内容、导航
L1 CSS 表现 — 视觉、布局、动画
L2 浏览器平台 API — Clipboard, IntersectionObserver
L3 Hono/Vite/Lit — 路由、构建、组件封装
L4 自研代码 — Island 水合、RPC、插件逻辑

跳过任何一层 = 违反 KISS 架构约束</div>

          <h3>测试</h3>
          <code-block
          ><pre><code># 运行所有测试
deno task test

# 监听模式
deno task test:watch

# 类型检查
deno task typecheck</code></pre></code-block>

          <h2>发布流程</h2>
          <ol>
            <li>更新版本号（packages/*/package.json）</li>
            <li>更新 changelog（docs/app/routes/changelog.ts）</li>
            <li>运行测试：<code>deno task test</code></li>
            <li>发布到 JSR：<code>deno task publish</code></li>
            <li>创建 GitHub Release</li>
          </ol>

          <h2>架构决策记录（ADR）</h2>
          <p>重大架构变更需要创建 ADR 文档：</p>
          <code-block
          ><pre><code># ADR-XXX: 标题

## 状态
提议 / 已接受 / 已废弃

## 背景
为什么需要这个决策

## 决策
我们决定做什么

## 后果
这个决策的影响</code></pre></code-block>

          <h2>问题反馈</h2>
          <ul>
            <li>
              GitHub Issues:
              <a href="https://github.com/SisyphusZheng/kiss/issues" target="_blank"
                >https://github.com/SisyphusZheng/kiss/issues</a
              >
            </li>
            <li>提交前请搜索已有 issue</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};jr.styles=[F,w`
      .layer-diagram {
        padding: 1.25rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--kiss-text-secondary);
      }
      .commit-types {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }
      .commit-type {
        padding: 0.75rem 1rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        font-size: 0.875rem;
      }
      .commit-type code {
        color: var(--kiss-accent);
        font-weight: 600;
      }
    `];let Ds=jr;customElements.define("page-contributing",Ds);const qa="page-contributing",Ga="page-demo",zr=class zr extends C{render(){return _`
      <kiss-layout>
        <div class="container">
          <span class="overline">Showcase</span>
          <h1>JAM Pattern in Action</h1>
          <p class="subtitle">
            A live demonstration of the <strong>JAMstack</strong> pipeline —
            statically generated HTML that talks to a serverless API at runtime.
            Zero backend. Zero server maintenance.
          </p>

          <!-- JAM Flow Diagram (pure CSS grid, no JS needed) -->
          <div class="jam-grid">
            <div class="jam-cell">
              <span class="letter">J</span>
              <span class="label">JavaScript</span>
              <p class="desc">Island component hydrates on the client, ready for interaction</p>
            </div>
            <div class="jam-cell">
              <span class="letter">A</span>
              <span class="label">API</span>
              <p class="desc">fetch() calls the KISS serverless API hosted on Deno Deploy</p>
            </div>
            <div class="jam-cell">
              <span class="letter">M</span>
              <span class="label">Markup</span>
              <p class="desc">JSON response rendered into the DOM — no page reload needed</p>
            </div>
          </div>

          <!-- Live API Consumer Island -->
          <api-consumer></api-consumer>

          <hr class="divider" />

          <!-- Counter Island -->
          <p style="font-size:0.8125rem;color:var(--kiss-text-tertiary);margin:0 0 0.5rem;line-height:1.6">
            Another Island — <strong>0.9 KB</strong> of lazy-loaded JavaScript,
            fully interactive via Declarative Shadow DOM hydration.
          </p>
          <counter-island></counter-island>

          <hr class="divider" />

          <!-- Architecture -->
          <h2>Architecture</h2>
          <p style="font-size:0.9375rem;color:var(--kiss-text-secondary);line-height:1.7">
            This entire page was statically generated at build time by the KISS 3-phase pipeline.
            The interactive components are <strong>Islands</strong> — lazy-loaded JavaScript that
            hydrates only the parts that need interaction. Everything else is pure static HTML.
          </p>

          <div class="endpoint-label">API Endpoint</div>
          <div class="arch-card">
            <div class="endpoint-bar">
              <span>https://kiss-demo-api.sisyphuszheng.deno.net</span>
              <a href="https://kiss-demo-api.sisyphuszheng.deno.net/api" target="_blank" style="font-size:0.75rem;color:var(--kiss-text-primary);text-decoration:underline;text-underline-offset:3px">Open →</a>
            </div>
          </div>

          <div class="endpoint-label">Build Pipeline</div>
          <div class="arch-card">
            <pre>npx vite build   → SSR bundle + metadata
build:client     → Island client chunks (lazy-loaded)
build:ssg        → Static HTML + DSD + clean URLs + PWA</pre>
          </div>
        </div>
      </kiss-layout>
    `}};zr.styles=[F,w`
      /* ─── JAM Flow Steps ─── */
      .jam-grid {
        display: flex;
        gap: 0;
        margin: 1.5rem 0 2rem;
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .jam-cell {
        flex: 1;
        padding: 1.5rem 1rem;
        text-align: center;
        position: relative;
      }
      .jam-cell + .jam-cell {
        border-left: 1px solid var(--kiss-border);
      }
      .jam-cell .letter {
        font-size: 2rem;
        font-weight: 900;
        color: var(--kiss-text-primary);
        display: block;
        line-height: 1;
        margin-bottom: 0.5rem;
      }
      .jam-cell .label {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--kiss-text-muted);
        display: block;
        margin-bottom: 0.3rem;
      }
      .jam-cell .desc {
        font-size: 0.75rem;
        color: var(--kiss-text-tertiary);
        line-height: 1.5;
        margin: 0;
      }
      .jam-cell:hover {
        background: var(--kiss-bg-hover);
      }

      /* ─── Architecture section ─── */
      .arch-card {
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .arch-card pre {
        margin: 0;
        padding: 1rem 1.25rem;
        background: var(--kiss-code-bg);
        font-size: 0.75rem;
        line-height: 1.7;
        overflow-x: auto;
      }
      .arch-card .endpoint-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        background: var(--kiss-bg-surface);
        border-bottom: 1px solid var(--kiss-border);
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      }
      .arch-card .endpoint-bar a {
        text-decoration: none;
      }
      .endpoint-label {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
        margin: 1.5rem 0 0.5rem;
      }
    `];let Va=zr;const b0="kiss-card",Dr=class extends C{constructor(){super(...arguments),this.variant="default"}render(){return _`
      <article part="base">
        <slot name="header"></slot>
        <div class="card-body">
          <slot></slot>
        </div>
        <slot name="footer"></slot>
      </article>
    `}};Dr.styles=[Tt,w`
      :host {
        display: block;
        background: var(--kiss-bg-card);
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-lg);
        overflow: hidden;
      }

      :host([variant="elevated"]) {
        box-shadow: var(--kiss-shadow-md);
        border-color: transparent;
      }

      :host([variant="borderless"]) {
        border-color: transparent;
      }

      ::slotted([slot="header"]) {
        padding: var(--kiss-size-4) var(--kiss-size-5);
        border-bottom: 1px solid var(--kiss-border);
        font-size: var(--kiss-font-size-lg);
        font-weight: var(--kiss-font-weight-semibold);
        color: var(--kiss-text-primary);
        margin: 0;
      }

      .card-body {
        padding: var(--kiss-size-5);
      }

      ::slotted([slot="footer"]) {
        padding: var(--kiss-size-3) var(--kiss-size-5);
        border-top: 1px solid var(--kiss-border);
        font-size: var(--kiss-font-size-sm);
        color: var(--kiss-text-muted);
        margin: 0;
      }
    `];Dr.properties={variant:{type:String,reflect:!0}};let g0=Dr;customElements.define(b0,g0);const k0="kiss-button",Pr=class extends C{constructor(){super(...arguments),this.variant="default",this.size="md",this.disabled=!1,this.type="button"}_preventClick(t){t.preventDefault()}render(){const t=`btn btn--${this.variant} btn--${this.size}`;if(this.href){const s=this.disabled?void 0:this.href;return _`
        <a
          class="${t}"
          href="${s??D}"
          target="${this.target||D}"
          aria-disabled="${this.disabled||D}"
          rel="${this.target==="_blank"?"noopener noreferrer":D}"
          @click="${this.disabled?this._preventClick:D}"
        >
          <slot></slot>
        </a>
      `}return _`
      <button class="${t}" ?disabled="${this.disabled}" type="${this.type}">
        <slot></slot>
      </button>
    `}};Pr.styles=[Tt,w`
      :host {
        display: inline-block;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--kiss-size-2);
        font-family: var(--kiss-font-sans);
        font-weight: var(--kiss-font-weight-medium);
        text-decoration: none;
        cursor: pointer;
        border: 1px solid var(--kiss-border);
        background: transparent;
        color: var(--kiss-text-primary);
        border-radius: var(--kiss-radius-md);
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        white-space: nowrap;
        letter-spacing: var(--kiss-letter-spacing-wide);
      }

      /* Sizes */
      .btn--sm {
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-sm);
        height: 28px;
      }

      .btn--md {
        padding: var(--kiss-size-2) var(--kiss-size-4);
        font-size: var(--kiss-font-size-md);
        height: 36px;
      }

      .btn--lg {
        padding: var(--kiss-size-3) var(--kiss-size-5);
        font-size: var(--kiss-font-size-lg);
        height: 44px;
      }

      /* Variants */
      .btn--default:hover {
        color: var(--kiss-text-primary);
        border-color: var(--kiss-border-hover);
        background: var(--kiss-accent-subtle);
      }

      .btn--primary {
        background: var(--kiss-accent);
        color: var(--kiss-bg-base);
        border-color: var(--kiss-accent);
      }

      .btn--primary:hover {
        background: var(--kiss-accent-dim);
        border-color: var(--kiss-accent-dim);
      }

      .btn--ghost {
        border-color: transparent;
      }

      .btn--ghost:hover {
        background: var(--kiss-accent-subtle);
        border-color: transparent;
      }

      /* States */
      .btn:disabled,
      .btn[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn:focus-visible {
        outline: 2px solid var(--kiss-accent);
        outline-offset: 2px;
      }
    `];Pr.properties={variant:{type:String,reflect:!0},size:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0},href:{type:String,reflect:!0},target:{type:String,reflect:!0},type:{type:String}};let E0=Pr;customElements.define(k0,E0);const Kr=class Kr extends C{render(){return _`
      <kiss-layout current-path="/examples">
        <div class="container">
          <h1>Examples</h1>
          <p class="subtitle">
            KISS Architecture 实战 — 三范式继承 + 四约束验证
          </p>

          <h2>KISS Architecture = Jamstack</h2>
          <p>
            KISS 架构是唯一全链路 Web Standards 的 Jamstack 实现：
          </p>

          <div class="architecture-diagram">
            <div class="arch-row">
              <span class="arch-label">Jamstack</span>
              <span class="arch-value">Static-first deployment model — SSG + CDN</span>
            </div>
            <div class="arch-row">
              <span class="arch-label">Islands</span>
              <span class="arch-value">Isolated interactive components in Shadow DOM</span>
            </div>
            <div class="arch-row">
              <span class="arch-label">Progressive</span>
              <span class="arch-value">Content first, enhancement second — no JS baseline</span>
            </div>
            <hr class="arch-divider" />
            <div class="kiss-row">
              <span class="kiss-letter">K</span><span class="kiss-desc">Knowledge — SSG + DSD</span>
            </div>
            <div class="kiss-row">
              <span class="kiss-letter">I</span><span class="kiss-desc"
              >Isolated — Islands + Shadow DOM</span>
            </div>
            <div class="kiss-row">
              <span class="kiss-letter">S</span><span class="kiss-desc">Semantic — No-JS baseline</span>
            </div>
            <div class="kiss-row">
              <span class="kiss-letter">S</span><span class="kiss-desc">Static — CDN + Serverless</span>
            </div>
          </div>

          <h2>示例项目</h2>
          <div class="example-grid">
            <div class="example-card">
              <h3>
                Hello World
                <span class="tag k">K</span>
                <span class="tag s1">S</span>
              </h3>
              <div class="constraint-badges">
                <span class="constraint-badge">SSG + DSD</span>
                <span class="constraint-badge">零运行时</span>
              </div>
              <p>
                最小化 KISS 应用。展示 SSG + DSD 输出，内容在 JS 加载前可见。 使用 @kissjs/ui 组件。
              </p>
              <code-block
              ><pre><code>deno run -A npm:vite build
                # 输出: dist/index.html (含 DSD)</code></pre></code-block>
              <div class="nav-links">
                <kiss-button size="sm" href="/examples/hello">查看 Demo</kiss-button>
                <kiss-button
                  size="sm"
                  variant="ghost"
                  href="https://github.com/SisyphusZheng/kiss/tree/main/docs/app/routes/examples/hello"
                >源码</kiss-button>
              </div>
            </div>

            <div class="example-card">
              <h3>
                Minimal Blog
                <span class="tag k">K</span>
                <span class="tag i">I</span>
                <span class="tag s1">S</span>
              </h3>
              <div class="constraint-badges">
                <span class="constraint-badge">SSG</span>
                <span class="constraint-badge">Theme Island</span>
                <span class="constraint-badge">aria-current</span>
              </div>
              <p>
                静态博客示例。主题切换是唯一 Island，使用 localStorage 持久化。 导航高亮用 aria-current +
                CSS（L0+L1），零 JS。
              </p>
              <div class="nav-links">
                <kiss-button size="sm" href="/examples/minimal-blog">查看 Demo</kiss-button>
                <kiss-button
                  size="sm"
                  variant="ghost"
                  href="https://github.com/SisyphusZheng/kiss/tree/main/docs/app/routes/examples/minimal-blog"
                >源码</kiss-button>
              </div>
            </div>

            <div class="example-card">
              <h3>
                Fullstack
                <span class="tag k">K</span>
                <span class="tag i">I</span>
                <span class="tag s1">S</span>
                <span class="tag s2">S</span>
              </h3>
              <div class="constraint-badges">
                <span class="constraint-badge">SSG + DSD</span>
                <span class="constraint-badge">API Routes</span>
                <span class="constraint-badge">Counter Island</span>
                <span class="constraint-badge">Serverless</span>
              </div>
              <p>
                全栈示例。静态前端 + Serverless API Routes。 展示 KISS 架构的完整四约束：静态文件部署到
                CDN，API 部署到 Serverless。
              </p>
              <code-block
              ><pre><code># 部署架构
                dist/           → CDN / GitHub Pages
                api/            → Deno Deploy / CF Workers</code></pre></code-block>
              <div class="nav-links">
                <kiss-button size="sm" href="/examples/fullstack">查看 Demo</kiss-button>
                <kiss-button
                  size="sm"
                  variant="ghost"
                  href="https://github.com/SisyphusZheng/kiss/tree/main/docs/app/routes/examples/fullstack"
                >源码</kiss-button>
              </div>
            </div>
          </div>

          <h2>四约束验证清单</h2>
          <p>每个示例必须通过 K·I·S·S 四约束审查：</p>
          <code-block
          ><pre><code>K — 内容需要运行时获取？  → 应在构建时预渲染 (SSG + DSD)
            I — 新增了全局 JS？       → 必须封装为 Island (Shadow DOM)
            S — Island 禁用 JS 可用？ → 必须有语义 HTML 基线
            S — 引入了服务端进程？     → 只允许静态文件 + Serverless API</code></pre></code-block>

            <div class="nav-row">
              <a href="/styling/kiss-ui" class="nav-link">&larr; @kissjs/ui</a>
              <a href="/guide/deployment" class="nav-link">Deployment &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `}};Kr.styles=[F,w`
      .example-grid {
        display: grid;
        gap: 1.5rem;
        margin: 1.5rem 0;
      }
      .example-card {
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        transition: border-color 0.2s ease;
      }
      .example-card:hover {
        border-color: var(--kiss-border-hover);
      }
      .example-card h3 {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .example-card .tag {
        font-size: 0.6875rem;
        padding: 0.125rem 0.375rem;
        background: var(--kiss-code-bg);
        border-radius: 3px;
        font-weight: 500;
      }
      .example-card .tag.k {
        color: var(--kiss-accent);
      }
      .example-card .tag.i {
        color: var(--kiss-accent-dim);
      }
      .example-card .tag.s1 {
        color: var(--kiss-text-secondary);
      }
      .example-card .tag.s2 {
        color: var(--kiss-text-tertiary);
      }
      .example-card p {
        margin: 0.5rem 0 1rem;
        color: var(--kiss-text-secondary);
        font-size: 0.9375rem;
      }
      .constraint-badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .constraint-badge {
        padding: 0.25rem 0.5rem;
        background: var(--kiss-bg-base);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: "SF Mono", "Fira Code", monospace;
      }
      .architecture-diagram {
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
      }
      .arch-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .arch-row:last-child {
        margin-bottom: 0;
      }
      .arch-label {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
        min-width: 120px;
      }
      .arch-value {
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
      }
      .arch-divider {
        border: none;
        border-top: 1px solid var(--kiss-border);
        margin: 1rem 0;
      }
      .kiss-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 0.75rem 0;
      }
      .kiss-letter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--kiss-border-hover);
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--kiss-text-primary);
        background: var(--kiss-bg-base);
      }
      .kiss-desc {
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
        margin-left: 0.25rem;
        line-height: 28px;
      }
      .nav-links {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
    `];let Ps=Kr;customElements.define("page-examples",Ps);const Qa="page-examples",T0="counter-island",la=class la extends C{constructor(){super(),this.count=0}render(){return _`
      <div class="counter">
        <button @click="${()=>this.count--}">−</button>
        <span class="count">${this.count}</span>
        <button @click="${()=>this.count++}">+</button>
      </div>
    `}};la.styles=w`
    :host {
      display: block;
    }
    .counter {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .count {
      font-size: 2rem;
      font-weight: 700;
      min-width: 3rem;
      text-align: center;
      color: var(--kiss-text-primary, inherit);
    }
    button {
      background: var(--kiss-bg-elevated, #111);
      color: var(--kiss-text-primary, #fff);
      border: 1px solid var(--kiss-border, transparent);
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    button:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }
    button:active {
      transform: scale(0.95);
    }
  `,la.properties={count:{type:Number}};let Ms=la;customElements.define(T0,Ms);const Yr=class Yr extends C{render(){return _`
      <kiss-layout current-path="/examples/fullstack">
        <div class="container">
          <h1>全栈示例</h1>
          <p class="subtitle">
            K + I + S + S 四约束：静态前端 + Serverless API
          </p>

          <h2>在线演示</h2>
          <div class="demo-container">
            <h1>KISS 全栈示例</h1>
            <p style="color: var(--kiss-text-tertiary); margin-bottom: 1.5rem;">
              SSG + API Routes + Islands —— 完整的全栈示例。
            </p>

            <div class="counter-demo">
              <h3>交互式 Island 演示</h3>
              <counter-island></counter-island>
            </div>

            <div class="api-demo">
              <h3>API Routes 演示</h3>
              <div class="api-response">
                GET /api/hello → { "message": "Hello from KISS API!" } GET /api/time → { "time":
                "2026-04-26T...", "timestamp": 1745678... } GET /api/echo/:text → { "echo": "your-text" }
              </div>
            </div>
          </div>

          <h2>部署架构</h2>
          <div class="deployment-diagram">
            ┌─────────────────────────────────────────────────────────────────┐ │ 全栈部署 │
            │ │ │ ┌──────────────────┐ ┌──────────────────┐ │ │ │ 静态 dist/ │ │ API 路由 │ │ │ │ │ │
            │ │ │ │ index.html │ │ /api/hello │ │ │ │ + DSD │ │ /api/time │ │ │ │ + Island JS │ │
            /api/echo │ │ │ │ │ │ │ │ │ └──────────────────┘ └──────────────────┘ │ │ │ │ │ │ ▼ ▼ │ │
            ┌──────────────────┐ ┌──────────────────┐ │ │ │ CDN / │ │ Serverless │ │ │ │ GitHub Pages │ │
            Deno Deploy │ │ │ │ Cloudflare │ │ CF Workers │ │ │ │ Pages │ │ Vercel Edge │ │ │
            └──────────────────┘ └──────────────────┘ │ │ │ │ S 约束： 静态文件 + Serverless API │
            └─────────────────────────────────────────────────────────────────┘
          </div>

          <h2>约束验证</h2>
          <table>
            <thead>
              <tr>
                <th>约束</th>
                <th>验证</th>
                <th>实现</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>K</strong> — Knowledge</td>
                <td>✓ 内容在构建时已知</td>
                <td>SSG + DSD 输出</td>
              </tr>
              <tr>
                <td><strong>I</strong> — Isolated</td>
                <td>✓ Counter Island</td>
                <td>Shadow DOM + 懒水合</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Semantic</td>
                <td>✓ DSD 内容可达</td>
                <td>禁用 JS 时内容可见</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Static</td>
                <td>✓ CDN + Serverless</td>
                <td>静态前端 + API Routes</td>
              </tr>
            </tbody>
          </table>

          <h2>API Routes 示例代码</h2>
          <code-block
          ><pre><code>// app/routes/api/index.ts
            import { Hono } from 'hono'

            const app = new Hono()

            app.get('/hello', (c) => c.json({ message: 'Hello from KISS API!' }))
            app.get('/time', (c) => c.json({ time: new Date().toISOString() }))
            app.get('/echo/:text', (c) => c.json({ echo: c.req.param('text') }))

            export default app</code></pre></code-block>

            <div class="nav-row">
              <a href="/examples/minimal-blog" class="nav-link">&larr; Minimal Blog</a>
              <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `}};Yr.styles=[F,w`
      .demo-container {
        padding: 2rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        margin: 1.5rem 0;
        color: var(--kiss-text-primary);
      }
      .demo-container h1 {
        font-size: 2rem;
        margin: 0 0 1rem;
      }
      .api-demo {
        margin-top: 1.5rem;
        padding: 1rem;
        background: var(--kiss-bg-elevated);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .api-demo h3 {
        margin: 0 0 0.75rem;
        font-size: 0.9375rem;
        color: var(--kiss-accent);
      }
      .api-response {
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
        background: var(--kiss-code-bg);
        padding: 0.75rem;
        border-radius: 4px;
      }
      .counter-demo {
        margin-top: 1.5rem;
        padding: 1rem;
        background: var(--kiss-bg-elevated);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .counter-demo h3 {
        margin: 0 0 1rem;
        font-size: 0.9375rem;
        color: var(--kiss-accent);
      }
      .deployment-diagram {
        padding: 1.25rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--kiss-text-secondary);
      }
    `];let Hs=Yr;customElements.define("page-fullstack-demo",Hs);const Xa="page-fullstack-demo",Wr=class Wr extends C{render(){return _`
      <kiss-layout current-path="/examples/hello">
        <div class="container">
          <h1>Hello World Demo</h1>
          <p class="subtitle">
            K + S 约束：SSG + DSD 输出，内容在 JS 加载前可见
          </p>

          <h2>Live Demo</h2>
          <div class="demo-container">
            <h1>Hello, KISS!</h1>
            <p class="subtitle">完全基于 Web 标准构建的极简全栈框架。</p>
            <div class="actions">
              <kiss-button variant="primary" href="https://jsr.io/@kissjs/core">快速上手</kiss-button>
              <kiss-button href="https://github.com/SisyphusZheng/kiss">GitHub</kiss-button>
            </div>
            <div class="cards">
              <kiss-card>
                <h3 slot="header">SSG + DSD</h3>
                <p>
                  带声明式 Shadow DOM 的静态站点生成。内容在 JavaScript 加载前就可见。
                </p>
              </kiss-card>
              <kiss-card>
                <h3 slot="header">Islands 架构</h3>
                <p>
                  交互式组件按需 hydration。默认零 JS，渐进增强。
                </p>
              </kiss-card>
              <kiss-card>
                <h3 slot="header">API Routes</h3>
                <p>带 Hono RPC 的 Serverless 端点。服务端到客户端类型安全。</p>
              </kiss-card>
            </div>
          </div>

          <h2>约束验证</h2>
          <table>
            <thead>
              <tr>
                <th>约束</th>
                <th>验证</th>
                <th>实现</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>K</strong> — Knowledge</td>
                <td>✓ 内容在构建时已知</td>
                <td>SSG + DSD 输出</td>
              </tr>
              <tr>
                <td><strong>I</strong> — Isolated</td>
                <td>✓ 无交互 Island</td>
                <td>纯静态页面</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Semantic</td>
                <td>✓ DSD 内容可达</td>
                <td>Shadow DOM 声明式渲染</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Static</td>
                <td>✓ 纯静态文件</td>
                <td>dist/index.html</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/examples" class="nav-link">&larr; Examples</a>
            <a href="/examples/minimal-blog" class="nav-link">Minimal Blog &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};Wr.styles=[F,w`
      .demo-container {
        padding: 2rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 8px;
        margin: 1.5rem 0;
      }
      .demo-container h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin: 0 0 1rem;
        color: var(--kiss-text-primary);
      }
      .demo-container .subtitle {
        color: var(--kiss-text-tertiary);
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }
      .demo-container .cards {
        display: grid;
        gap: 1rem;
      }
      kiss-card {
        --kiss-bg-card: var(--kiss-bg-elevated);
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
    `];let Bs=Wr;customElements.define("page-hello-demo",Bs);const Ja="page-hello-demo",qr=class qr extends C{render(){return _`
      <kiss-layout current-path="/examples/minimal-blog">
        <div class="container">
          <h1>Minimal Blog Demo</h1>
          <p class="subtitle">
            K + I + S 约束：SSG + Theme Island + aria-current 导航
          </p>

          <h2>Live Demo</h2>
          <div class="demo-container">
            <div class="demo-header">
              <h1>My Blog</h1>
              <kiss-theme-toggle></kiss-theme-toggle>
            </div>
            <div class="nav-highlight-demo">
              <a class="nav-link-demo active" aria-current="page">Home</a>
              <a class="nav-link-demo">About</a>
              <a class="nav-link-demo">Archive</a>
            </div>
            <div class="post-list">
              <div class="post-item">
                <h3>理解 KISS 架构</h3>
                <p>K·I·S·S 约束如何强制执行 Jamstack 原则...</p>
              </div>
              <div class="post-item">
                <h3>DSD：缺失的桥梁</h3>
                <p>声明式 Shadow DOM 解决了封装性与可访问性之间的两难...</p>
              </div>
            </div>
          </div>

          <h2>约束验证</h2>
          <table>
            <thead>
              <tr>
                <th>约束</th>
                <th>验证</th>
                <th>实现</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>K</strong> — Knowledge</td>
                <td>✓ 内容在构建时已知</td>
                <td>SSG + DSD 输出</td>
              </tr>
              <tr>
                <td><strong>I</strong> — Isolated</td>
                <td>✓ Theme Island</td>
                <td>Shadow DOM + localStorage</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Semantic</td>
                <td>✓ aria-current 导航</td>
                <td>L0 HTML + L1 CSS（非 Island）</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Static</td>
                <td>✓ 纯静态文件</td>
                <td>dist/ 部署到 CDN</td>
              </tr>
            </tbody>
          </table>

          <h2>分层原则验证</h2>
          <code-block
          ><pre><code>导航高亮 → aria-current + CSS (L0+L1, 非 Island)
            主题切换 → Island + localStorage (L4, 合法 Island)

            为什么主题切换是 Island？
            - 需要 localStorage API（L2）
            - 需要跨 Shadow DOM 通信（L4）
            - 无法用纯 CSS 实现</code></pre></code-block>

            <div class="nav-row">
              <a href="/examples/hello" class="nav-link">&larr; Hello World</a>
              <a href="/examples/fullstack" class="nav-link">Fullstack &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `}};qr.styles=[F,w`
      .demo-container {
        padding: 2rem;
        background: var(--kiss-bg-base);
        border-radius: 8px;
        margin: 1.5rem 0;
      }
      .demo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .demo-header h1 {
        font-size: 1.5rem;
        margin: 0;
      }
      .post-list {
        display: grid;
        gap: 1rem;
      }
      .post-item {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .post-item h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }
      .post-item p {
        margin: 0;
        color: var(--kiss-text-muted);
        font-size: 0.875rem;
      }
      .nav-highlight-demo {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
      }
      .nav-link-demo {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        color: var(--kiss-text-secondary);
      }
      .nav-link-demo.active {
        background: var(--kiss-bg-surface);
        color: var(--kiss-text-primary);
        font-weight: 600;
      }
    `];let Fs=qr;customElements.define("page-minimal-blog-demo",Fs);const Za="page-minimal-blog-demo",Gr=class Gr extends C{render(){return _`
      <kiss-layout currentPath="/guide/api-design">
        <div class="container">
          <h1>API 设计</h1>
          <p class="subtitle">Hono 路由、类型安全 RPC、验证和错误响应模式。</p>

          <h2>设计原则</h2>
          <div class="principle">
            <strong>Web 标准优先</strong> —— 路由处理器返回标准 <span class="inline-code">Response</span>，输入使用 <span class="inline-code">Request</span>/<span class="inline-code">FormData</span><br>
            <strong>全链路类型安全</strong> —— Zod 验证 → Hono RPC → 客户端自动推断，零代码生成<br>
            <strong>约定优于配置</strong> —— <span class="inline-code">app/routes/api/</span> 下的文件自动注册为 API 路由
          </div>

          <h2>路由约定</h2>
          <table>
            <thead>
              <tr><th>文件</th><th>路由</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td><span class="inline-code">api/posts.ts</span></td><td><span class="inline-code">/api/posts</span></td><td>Posts API（Hono 子应用）</td></tr>
              <tr><td><span class="inline-code">api/posts/[id].ts</span></td><td><span class="inline-code">/api/posts/:id</span></td><td>单个 post API</td></tr>
              <tr><td><span class="inline-code">api/users/index.ts</span></td><td><span class="inline-code">/api/users</span></td><td>用户列表 API</td></tr>
            </tbody>
          </table>

          <h2>类型安全 RPC</h2>
          <p>KISS 利用 Hono RPC 实现端到端类型安全。无需代码生成：</p>
          <code-block><pre><code>// 服务端：app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json([{ id: 1, title: 'Hello' }]))
  .post('/', async (c) => {
    const body = await c.req.json()
    return c.json({ ok: true }, 201)
  })

export default app
export type AppType = typeof app</code></pre></code-block>

          <code-block><pre><code>// 客户端：app/islands/post-list.ts
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts.ts'

const client = hc&lt;AppType&gt;('/api/posts')
const res = await client.index.$get()
const posts = await res.json()  // 完全类型化！</code></pre></code-block>

          <h2>验证（用户选择）</h2>
          <p>Zod 和 <span class="inline-code">@hono/zod-validator</span> 不是框架依赖——它们是你的项目级选择：</p>
          <code-block><pre><code>import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({ title: z.string(), body: z.string() })

app.post('/', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json')  // 有类型！
  return c.json({ ok: true, data }, 201)
})</code></pre></code-block>

          <h2>错误响应格式</h2>
          <p>所有 KISS 错误产生一致的 JSON 响应：</p>
          <code-block><pre><code>{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "status": 400
  }
}</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/api-routes" class="nav-link">&larr; API Routes</a>
            <a href="/guide/ssg" class="nav-link">SSG &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};Gr.styles=[F,w`
    .principle { padding: 1rem; background: var(--kiss-bg-surface);  border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px 0; margin: 0.75rem 0; font-size: 0.875rem; }
  `];let Us=Gr;customElements.define("page-api-design",Us);const er="page-api-design",Vr=class Vr extends C{render(){return _`
      <kiss-layout currentPath="/guide/api-routes">
        <div class="container">
          <h1>API Routes</h1>
          <p class="subtitle">使用 Hono 创建后端端点——KISS 的 HTTP 层。</p>

          <h2>创建 API Route</h2>
          <code-block
            ><pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Hello KISS' }
  ])
})

app.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ id: 2, ...body }, 201)
})

export default app</code></pre></code-block>

          <h2>带验证</h2>
          <code-block
            ><pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()
const schema = z.object({
  title: z.string().min(1),
  body: z.string(),
})

app.post('/', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ id: 1, ...data }, 201)
})

export default app</code></pre></code-block>

          <h2>类型安全 RPC</h2>
          <p>使用 <span class="inline-code">@kissjs/rpc</span> 实现端到端类型安全：</p>
          <code-block
            ><pre><code>// 服务端：导出类型
export type AppType = typeof app

// 客户端：在 Island 中
import { RpcController } from '@kissjs/rpc'
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts'

class MyIsland extends LitElement {
  private rpc = new RpcController(this)
  private client = hc&lt;AppType&gt;('/')

  async loadPosts() {
    const res = await this.rpc.call(() =>
      this.client.api.posts.$get()
    )
  }
}</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/islands" class="nav-link">&larr; Islands</a>
            <a href="/guide/api-design" class="nav-link">API 设计 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};Vr.styles=[F,w`
    `];let $s=Vr;customElements.define("page-api-routes",$s);const tr="page-api-routes",Qr=class Qr extends C{render(){return _`
      <kiss-layout currentPath="/guide/architecture">
        <div class="container">
          <h1>架构设计</h1>
          <p class="subtitle">
            KISS 框架如何实现 K·I·S·S 架构约束——
            将 Hono、Lit 和 Vite 融合为一个插件。
          </p>

          <h2>用户视角</h2>
          <code-block
            ><pre><code>// vite.config.ts —— 你唯一的配置
import { kiss } from '@kissjs/core';
export default defineConfig({
  plugins: [kiss()]
})</code></pre></code-block
          >

          <h2>KISS 架构 = Jamstack，原生 Web 标准</h2>
          <p>
            K·I·S·S 约束与 Jamstack 三大支柱一一对应，
            完全通过 Web 标准实现：
          </p>
          <table>
            <thead>
              <tr>
                <th>Jamstack</th>
                <th>KISS 约束</th>
                <th>实现方式</th>
                <th>Web 标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>M</strong>arkup</td>
                <td>K + S（知识 + 语义）</td>
                <td>SSG + DSD —— 零 JS 静态 HTML</td>
                <td>声明式 Shadow DOM</td>
              </tr>
              <tr>
                <td><strong>A</strong>PIs</td>
                <td>S（Static —— Serverless 扩展）</td>
                <td>API Routes —— Hono handlers + RPC</td>
                <td>Fetch API</td>
              </tr>
              <tr>
                <td><strong>J</strong>avaScript</td>
                <td>I（Isolated）</td>
                <td>Islands —— Shadow DOM + 懒 Hydration</td>
                <td>Web Components</td>
              </tr>
            </tbody>
          </table>
          <p>
            没有其他框架用原生 Web 标准覆盖 Jamstack 的全部三个维度。
          </p>

          <h2>插件组合</h2>
          <p>
            <span class="inline-code">kiss()</span> 函数返回一组
            Vite 插件，每个强制一个特定的 KISS 约束：
          </p>
          <table>
            <thead>
              <tr>
                <th>插件</th>
                <th>Hook</th>
                <th>职责</th>
                <th>约束</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>kiss:core</td>
                <td>configResolved + buildStart</td>
                <td>路由扫描 + 虚拟模块生成</td>
                <td>K（知识）</td>
              </tr>
              <tr>
                <td>kiss:virtual-entry</td>
                <td>resolveId + load</td>
                <td>提供 virtual:kiss-hono-entry</td>
                <td>—</td>
              </tr>
              <tr>
                <td>@hono/vite-dev-server</td>
                <td>configureServer</td>
                <td>开发模式 Hono 中间件</td>
                <td>—</td>
              </tr>
              <tr>
                <td>island-transform</td>
                <td>transform</td>
                <td>AST 标记（__island, __tagName）</td>
                <td>I（隔离）</td>
              </tr>
              <tr>
                <td>kiss:build</td>
                <td>closeBundle</td>
                <td>构建元数据写入 + Phase 1 完成</td>
                <td>K + S（知识 + 静态）</td>
              </tr>
            </tbody>
          </table>

          <h2>请求生命周期（开发模式）</h2>
          <code-block
            ><pre><code>请求 → Vite Dev Server → Hono 中间件 → 路由匹配
  → Vite SSR (ssrLoadModule) → @lit-labs/ssr 渲染 Lit
  → HTML + 声明式 Shadow DOM → 注入 Island hydration → 响应</code></pre></code-block
          >

          <h2>构建生命周期（SSG — 三阶段管线）</h2>
          <code-block
            ><pre><code>Phase 1: vite build（SSR bundle）
  → kiss() 插件扫描路由 + Islands
  → @lit-labs/ssr 渲染所有页面为带 DSD 的 HTML
  → 写出 .kiss/build-metadata.json（供后续阶段使用）
  产出：dist/server/entry.js（SSR bundle）

Phase 2: deno task build:client（Island JS）
  → 读取 Phase 1 元数据
  → Vite 独立构建客户端入口
  → 每个 Island 产出独立 JS chunk
  产出：dist/client/islands/*.js

Phase 3: deno task build:ssg（静态 HTML）
  → 读取 Phase 1 + Phase 2 元数据
  → 渲染所有页面为纯静态 HTML
  → 注入 Island hydration 脚本
  → CSP nonce 元标签注入
  → 后处理（rewrite island 路径、打包清单）
  产出：dist/*.html（部署到 CDN）</code></pre></code-block
          >

          <h2>全栈部署</h2>
          <p>
            KISS 架构的 S 约束（Static）意味着你独立部署两样东西：
          </p>
          <table>
            <thead>
              <tr>
                <th>组件</th>
                <th>内容</th>
                <th>约束</th>
                <th>部署到</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>dist/</strong>（静态）</td>
                <td>HTML + DSD + Island JS</td>
                <td>K + I + S</td>
                <td>CDN / GitHub Pages / S3</td>
              </tr>
              <tr>
                <td><strong>API Routes</strong>（动态）</td>
                <td>Hono Handlers</td>
                <td>S（Serverless）</td>
                <td>Serverless（Deno Deploy / CF Workers）</td>
              </tr>
            </tbody>
          </table>
          <p>
            静态文件走 CDN 获得全球性能。API Routes 部署为
            Serverless 函数。两者零耦合。这就是
            S 约束强制执行的 Jamstack 模型。
          </p>

          <h2>DSD 输出</h2>
          <p>
            每个由
            <span class="inline-code">@lit-labs/ssr</span> 渲染的
            Lit 组件都输出
            <strong>声明式 Shadow DOM</strong>。这满足了 K
            约束（构建时内容知识）和 S 约束
            （无 JS 的语义基线）：
          </p>
          <code-block
            ><pre><code>&lt;!-- SSG 输出的 Lit 组件 --&gt;
&lt;app-layout&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* 作用域样式 */&lt;/style&gt;
    &lt;header&gt;...&lt;/header&gt;
    &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt;
    &lt;footer&gt;...&lt;/footer&gt;
  &lt;/template&gt;
  &lt;!-- 插槽页面内容 --&gt;
&lt;/app-layout&gt;</code></pre></code-block
          >
          <p>
            支持 DSD 的浏览器立即渲染 Shadow DOM 内容。
            当 Lit hydration 时，它复用现有 DOM —— 无闪烁，无重复。
          </p>

          <h2>Island Hydration</h2>
          <p>
            构建时，<span class="inline-code">island-transform</span>
            标记 island 模块。<span class="inline-code">island-extractor</span>
            > 构建依赖映射。HTML 模板插件注入
            hydration 脚本，只懒加载页面需要的 island JS 包。这强制执行 I 约束——只有 Islands 获得 JS。
          </p>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">&larr; 设计哲学</a>
            <a href="/guide/routing" class="nav-link">路由 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};Qr.styles=[F];let js=Qr;customElements.define("page-architecture",js);const sr="page-architecture",Xr=class Xr extends C{render(){return _`
      <kiss-layout currentPath="/guide/blog-system">
        <div class="container">
          <p class="adr-meta">ADR 0004 · 2026-04-30 · Draft</p>
          <h1>@kissjs/blog — Standalone Blog Package</h1>

          <h2>Motivation</h2>
          <p>
            The docs site currently has two hardcoded blog pages — not a reusable system.
            Users need a one-line solution: drop in <code>.md</code> files, get automatic
            listing, pagination, RSS, and tags. Like VitePress, but as a KISS plugin.
          </p>

          <h2>User experience</h2>
          <div class="code-block">// vite.config.ts
import { kiss } from '@kissjs/core'
import { kissBlog } from '@kissjs/blog'

export default defineConfig({
  plugins: [
    kiss(),
    kissBlog({
      dir: 'content/blog',     // .md files go here
      title: 'My Blog',
      postsPerPage: 10,
    }),
  ],
})</div>

          <div class="code-block"><!-- content/blog/hello-world.md -->
---
title: Hello World
date: 2026-05-01
tags: [kiss, meta]
---

This is my first post.</div>

          <h2>Generated routes</h2>
          <ul>
            <li><code>/blog/</code> — Post listing (paginated, newest first)</li>
            <li><code>/blog/hello-world</code> — Individual post</li>
            <li><code>/blog/page/2</code> — Page 2</li>
            <li><code>/blog/tags/kiss</code> — Filter by tag</li>
            <li><code>/blog/feed.xml</code> — RSS / Atom feed</li>
          </ul>

          <h2>Constraint</h2>
          <p>
            The blog package is designed for the <code>.kiss</code> compiler from day one.
            Post templates compile to vanilla Custom Elements — zero runtime, no Lit,
            synchronous SSR via <code>template.innerHTML</code>.
          </p>
          <p>
            Before the compiler ships (v1.0), a fallback renders the same templates as
            server-side string concatenation using <code>html-template.ts</code>.
          </p>

          <h2>Implementation order</h2>
          <ol style="font-size:0.8125rem;line-height:1.8;color:var(--kiss-text-secondary)">
            <li><code>.kiss</code> compiler is available (Phase 11)</li>
            <li><code>@kissjs/blog</code> built on top (Phase 10 sub-task)</li>
            <li>KISS docs site dogfoods — replaces current hardcoded blog routes</li>
          </ol>

          <p>详见 <code>docs/decisions/0004-blog-system.md</code></p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/pwa" class="nav-link">&larr; PWA Support</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};Xr.styles=[F,w`
      .adr-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      h3 { font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.25rem; color: var(--kiss-text-secondary); }
      p { font-size: 0.8125rem; line-height: 1.7; color: var(--kiss-text-secondary); margin: 0 0 0.75rem; }
      .code-block {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
      ul { font-size: 0.8125rem; line-height: 1.8; color: var(--kiss-text-secondary); margin: 0.5rem 0 1rem; padding-left: 1.25rem; }
    `];let zs=Xr;customElements.define("page-blog-system",zs);const ar="page-blog-system",Jr=class Jr extends C{render(){return _`
      <kiss-layout currentPath="/guide/configuration">
        <div class="container">
          <h1>配置</h1>
          <p class="subtitle">kiss() 选项和 Vite 配置参考。</p>

          <h2>kiss() 选项</h2>
          <table>
            <thead>
              <tr>
                <th>选项</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">routesDir</span></td>
                <td><span class="inline-code">'app/routes'</span></td>
                <td>页面和 API 路由目录</td>
              </tr>
              <tr>
                <td><span class="inline-code">islandsDir</span></td>
                <td><span class="inline-code">'app/islands'</span></td>
                <td>交互式 Island 组件目录</td>
              </tr>
              <tr>
                <td><span class="inline-code">componentsDir</span></td>
                <td><span class="inline-code">'app/components'</span></td>
                <td>共享组件目录</td>
              </tr>
              <tr>
                <td><span class="inline-code">middleware</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>Hono 中间件模块路径</td>
              </tr>
              <tr>
                <td>
                  <span class="inline-code">inject</span> <span class="new-badge">新</span>
                </td>
                <td><span class="inline-code">undefined</span></td>
                <td>注入样式表、脚本、HTML 片段到 &lt;head&gt;</td>
              </tr>
              <tr>
                <td>
                  <span class="inline-code">packageIslands</span> <span class="new-badge">新</span>
                </td>
                <td><span class="inline-code">[]</span></td>
                <td>要扫描 Island 的包名数组（自动探测）</td>
              </tr>
              <tr>
                <td><span class="inline-code">ui</span> <span class="deprecated">已弃用</span></td>
                <td><span class="inline-code">undefined</span></td>
                <td>请使用 <span class="inline-code">inject</span> 替代</td>
              </tr>
            </tbody>
          </table>

          <h2>inject 选项 <span class="new-badge">新</span></h2>
          <p>
            通用 &lt;head&gt; 注入——替代旧的 <span class="inline-code">ui</span> 选项。适用于
            任何 CDN 或本地资源：
          </p>
          <code-block
            ><pre><code>kiss({
  inject: {
    stylesheets: [
      'https://cdn.example.com/style.css',
    ],
    scripts: [
      'https://cdn.example.com/ui.js',
    ],
    headFragments: [
      '&lt;meta name="theme-color" content="#0a0a0a"&gt;',
    ],
  },
})</code></pre></code-block>

          <h2>packageIslands 选项 <span class="new-badge">新</span></h2>
          <p>
            自动探测并注册来自 npm/JSR 包的 Islands。框架会扫描包的
            <code>islands</code> 导出并自动注册：
          </p>
          <code-block
            ><pre><code>kiss({
  // 从 @kissjs/ui 包自动探测 Islands
  packageIslands: ['@kissjs/ui'],
})</code></pre></code-block>
          <p>
            包必须导出 <code>islands</code> 数组。详见
            <a href="/guide/islands">Islands 架构</a>。
          </p>

          <h2>完整配置示例</h2>
          <code-block
            ><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',         // GitHub Pages 设为 '/repo/'
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      middleware: 'app/middleware.ts',

      // 从包自动探测 Islands
      packageIslands: ['@kissjs/ui'],

      // 通用 head 注入（推荐）
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },

      // 旧版 WebAwesome CDN 快捷方式（已弃用，请用 inject）
      // ui: { cdn: true, version: '3.5.0' },
    }),
  ],
})</code></pre></code-block>

          <h2>项目结构约定</h2>
          <code-block
            ><pre><code>my-app/
  app/
    routes/        # 基于文件的路由
      index.ts     # /
      about.ts     # /about
      api/
        posts.ts   # /api/posts (Hono)
    islands/       # 交互式组件（自动探测）
      counter.ts
    components/    # 共享 Lit 组件
      header.ts
  deno.json
  vite.config.ts</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/ssg" class="nav-link">&larr; SSG</a>
            <a href="/guide/error-handling" class="nav-link">错误处理 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};Jr.styles=[F,w`
      .deprecated {
        color: var(--kiss-text-tertiary);
        text-decoration: line-through;
      }
      .new-badge {
        display: inline-block;
        background: var(--kiss-accent-subtle);
        color: var(--kiss-accent);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        vertical-align: middle;
      }
    `];let Ks=Jr;customElements.define("page-configuration",Ks);const rr="page-configuration",Zr=class Zr extends C{render(){return _`
      <kiss-layout currentPath="/guide/deployment">
        <div class="container">
          <h1>部署</h1>
          <p class="subtitle">
            构建一次，随处部署。KISS 架构（S：静态）—— 静态前端 + Serverless APIs。
          </p>

          <h2>构建</h2>
          <code-block>
            <pre><code># KISS 三阶段构建管线
deno task build          # Phase 1 — SSR bundle
deno task build:client   # Phase 2 — Island client chunks
deno task build:ssg      # Phase 3 — Static HTML + 404 page
# 输出：dist/ 目录，包含静态 HTML + island JS + 404.html</code></pre></code-block>
          <p>
            KISS 的 S 约束（静态）确保构建输出就是最终产品。三阶段管线
            分布验证：每一阶段产出下一阶段的输入，<span class="inline-code">.kiss/build-metadata.json</span>
            在阶段间传递配置。
          </p>

          <h2>全栈架构</h2>
          <p>KISS 架构的 S 约束意味着两个独立的部署目标：</p>
          <table>
            <thead>
              <tr>
                <th>组件</th>
                <th>内容</th>
                <th>部署到</th>
                <th>扩展</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>静态前端</strong></td>
                <td>dist/（HTML + DSD + Island JS）</td>
                <td>CDN / GitHub Pages / S3</td>
                <td>全局边缘缓存</td>
              </tr>
              <tr>
                <td><strong>API Routes</strong></td>
                <td>Hono handlers</td>
                <td>Serverless functions</td>
                <td>按需自动扩展</td>
              </tr>
            </tbody>
          </table>
          <p>
            静态文件和 API 函数解耦。前端部署到最便宜的主机；
            API 部署到 Serverless 平台，独立扩展。
          </p>

          <h2>静态前端部署</h2>
          <p>
            KISS 架构只生成静态文件。<span class="inline-code">dist/</span>
            目录包含 HTML（带 DSD）和 island JS 包。部署到任何静态主机。
          </p>

          <div class="platform-grid">
            <div class="platform-card">
              <h3>GitHub Pages</h3>
              <p>在 vite.config.ts 中设置 base 为 /repo-name/</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Pages</h3>
              <p>指向 dist/ 目录</p>
            </div>
            <div class="platform-card">
              <h3>Vercel</h3>
              <p>Framework: Other，output: dist/</p>
            </div>
            <div class="platform-card">
              <h3>Netlify</h3>
              <p>Publish directory: dist/</p>
            </div>
            <div class="platform-card">
              <h3>S3 + CloudFront</h3>
              <p>上传 dist/ 到 S3 桶</p>
            </div>
            <div class="platform-card">
              <h3>任何静态主机</h3>
              <p>只需上传 dist/</p>
            </div>
          </div>

          <h2>API Routes 部署</h2>
          <p>
            Hono API routes 可以作为 Serverless 函数部署到任何支持
            JavaScript 的平台：
          </p>
          <div class="platform-grid">
            <div class="platform-card">
              <h3>Deno Deploy</h3>
              <p>原生 Hono 支持，零配置</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Workers</h3>
              <p>Hono 内置 adapter</p>
            </div>
            <div class="platform-card">
              <h3>Vercel Edge Functions</h3>
              <p>Hono adapter 可用</p>
            </div>
            <div class="platform-card">
              <h3>AWS Lambda</h3>
              <p>通过 @hono/aws-lambda adapter</p>
            </div>
          </div>

          <h3>API Route 示例</h3>
          <code-block>
            <pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.json({ posts: [] }));

export default app;
export type AppType = typeof app;</code></pre></code-block>

          <h2>GitHub Pages 设置</h2>
          <code-block>
            <pre><code>// vite.config.ts
export default defineConfig({
  base: '/my-repo/',
  plugins: [kiss()],
})</code></pre></code-block>

          <p>
            添加一个 GitHub Actions workflow 在推送 main 时构建并部署。参见本仓库的 <span
              class="inline-code">.github/workflows/deploy.yml</span> 获取完整示例。
          </p>

          <h2>为什么没有 Server 模式？</h2>
          <p>
            KISS 架构的 S 约束——<strong>构建产物仅为纯静态文件</strong>——意味着
            构建输出就是最终产品。生产环境中没有 SSR 运行时。这不是
            限制；这是一种确保以下目标的规范：
          </p>
          <ul>
            <li>零服务器维护成本</li>
            <li>全球 CDN 级性能</li>
            <li>无需 JavaScript 即可访问内容（DSD）</li>
            <li>部署到最便宜的主机</li>
            <li>静态和动态独立扩展</li>
          </ul>
          <p>
            动态数据属于 API Routes，不属于单体服务器。这就是 Jamstack 的方式——
            KISS 架构将其作为 S 约束强制执行，而非约定。
          </p>

          <div class="nav-row">
            <a href="/guide/testing" class="nav-link">&larr; 测试</a>
          </div>
        </div>
      </kiss-layout>
    `}};Zr.styles=[F,w`
      .platform-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .platform-card {
        padding: 1rem 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
      }
      .platform-card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        color: var(--kiss-text-primary);
      }
      .platform-card p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--kiss-text-secondary);
      }
    `];let Ys=Zr;customElements.define("page-deployment",Ys);const ir="page-deployment",ei=class ei extends C{render(){return _`
      <kiss-layout currentPath="/guide/design-philosophy">
        <div class="container">
          <h1>设计哲学</h1>
          <p class="subtitle">
            KISS = Keep It Simple, Stupid。不是口号——而是每个决策的过滤器。
          </p>

          <h2>五大支柱</h2>

          <div class="pillar">
            <div class="num">支柱 1</div>
            <h3>Web 标准优先</h3>
            <p>
              大多数框架"支持"Web 标准。KISS
              <em>就是</em> Web 标准。
            </p>
            <p>
              你的代码不依赖 KISS 的抽象。把它换掉，你的 Hono/Lit/Vite 代码
              依然能跑。
            </p>
            <p>
              <span class="hard-constraint">纯 ESM，零 CJS</span>
              <span class="hard-constraint">仅 Vite，无第二个构建工具</span>
              <span class="hard-constraint">不在输出上打补丁</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 2</div>
            <h3>最小化增强</h3>
            <p>
              KISS 不发明东西。它以最小开销连接现有标准工具。
            </p>
            <p>
              框架 = 1 个 Vite 插件（连接器，不是新抽象）。
            </p>
            <p>
              零交互页面：<strong>0 KB</strong> KISS 运行时。单个 Island：~6 KB（Lit 本身）。
            </p>
            <p>
              <span class="hard-constraint">复用 Hono/Vite/Lit 生态</span>
              <span class="hard-constraint">新依赖需要 ADR</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 3</div>
            <h3>无框架绑定</h3>
            <p>
              KISS 推荐 Lit，但你可以用别的。你可以不用 Lit 就用 @kissjs/core 做 SSR。
              你也可以不用 KISS 就用 Lit。
            </p>
            <p>
              Package Islands 自动探测——无需手动注册。只需从你的包
              <code>export</code> 一个 <code>islands</code> 数组，KISS 就能找到。
            </p>
            <p>
              <span class="hard-constraint">Lit 不是强制 peerDependency</span>
              <span class="hard-constraint">无强制验证方案</span>
              <span class="hard-constraint">零配置 Island 发现</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 4</div>
            <h3>无运行时绑定</h3>
            <p>
              纯 ESM 输出运行在任何支持 ESM 的运行时：Deno、Node、Bun、Cloudflare Workers。
            </p>
            <p>
              <span class="hard-constraint">无平台特定硬编码</span>
              <span class="hard-constraint">deno.json 是开发工具，不是运行时依赖</span>
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 5</div>
            <h3>渐进增强</h3>
            <p>
              KISS 默认零 JS。按组件选择加入。没有 SPA——这是架构，不是疏忽。
            </p>
            <table>
              <thead>
                <tr>
                  <th>层级</th>
                  <th>内容</th>
                  <th>JS 大小</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0</td>
                  <td>HTML + DSD（声明式 Shadow DOM）</td>
                  <td><strong>0 KB</strong></td>
                </tr>
                <tr>
                  <td>1</td>
                  <td>部分 Islands 带懒 Hydration</td>
                  <td>~6 KB / island</td>
                </tr>
              </tbody>
            </table>
            <p>
              没有层级 2 SPA，没有层级 3 实时，没有层级 4 CSR。这不是缺憾——这是
              KISS 架构 S 约束定义的边界。
            </p>
          </div>

          <h2>哲学 vs 架构</h2>
          <p>
            五大哲学支柱描述<strong>如何</strong>做决策。KISS
            架构（K·I·S·S）约束定义
            <strong>什么</strong>框架强制执行。
          </p>
          <table>
            <thead>
              <tr>
                <th>哲学支柱</th>
                <th>架构约束</th>
                <th>关系</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Web 标准优先</td>
                <td>全部四个（K·I·S·S）</td>
                <td>标准是每个约束的基础</td>
              </tr>
              <tr>
                <td>最小化增强</td>
                <td>I（隔离）</td>
                <td>最小 JS = 只有 Islands 获得 JS</td>
              </tr>
              <tr>
                <td>无框架绑定</td>
                <td>I（隔离）</td>
                <td>Web Components = 零框架绑定</td>
              </tr>
              <tr>
                <td>无运行时绑定</td>
                <td>S（静态）</td>
                <td>纯静态文件 = 无运行时依赖</td>
              </tr>
              <tr>
                <td>渐进增强</td>
                <td>K + S（知识 + 语义）</td>
                <td>构建时知识 + 语义基线</td>
              </tr>
            </tbody>
          </table>

          <h2>能力分层</h2>
          <p>
            每个特性必须通过能力阶梯。低层优先，始终如此：
          </p>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>技术</th>
                <th>仅在何时使用</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>L0</strong></td>
                <td>HTML5 语义</td>
                <td>结构、内容、导航</td>
              </tr>
              <tr>
                <td><strong>L1</strong></td>
                <td>CSS</td>
                <td>视觉、布局、动画、响应式</td>
              </tr>
              <tr>
                <td><strong>L2</strong></td>
                <td>平台 APIs</td>
                <td>Clipboard、IntersectionObserver、matchMedia</td>
              </tr>
              <tr>
                <td><strong>L3</strong></td>
                <td>Hono / Vite / Lit</td>
                <td>路由、构建、组件封装</td>
              </tr>
              <tr>
                <td><strong>L4</strong></td>
                <td>自定义代码</td>
                <td>Island hydration、RPC、插件逻辑</td>
              </tr>
            </tbody>
          </table>
          <p>
            跳过一层 = 违反设计哲学。参见
            <a href="/guide/architecture">KISS 架构</a>
            获取完整决策树。
          </p>

          <h2>审查清单</h2>
          <code-block
            ><pre><code>每次提交前，问自己：
            1. 新依赖？     → 是否违反"最小化增强"？
            2. 修改了构建？→ 是否违反"Web 标准优先"？
            3. 新抽象？     → 你在重新发明轮子吗？
            4. 平台代码？   → 是否违反"无运行时绑定"？
            5. 强制选择？   → 是否违反"无框架绑定"？
            6. 添加了 JS？   → 低层能做吗？
            7. 破坏了 Shadow DOM？ → 有 DSD 兼容的替代方案吗？</code></pre></code-block>
          <p>
            任何"是"都需要一份 ADR（架构决策记录）。
          </p>

          <h2>竞争格局</h2>
          <table>
            <thead>
              <tr>
                <th>框架</th>
                <th>HTTP</th>
                <th>UI</th>
                <th>构建</th>
                <th>DSD</th>
                <th>Jamstack</th>
                <th>全标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Next.js</td>
                <td>自定义</td>
                <td>React</td>
                <td>Webpack</td>
                <td>—</td>
                <td>部分</td>
                <td>0/3</td>
              </tr>
              <tr>
                <td>Astro</td>
                <td>自定义</td>
                <td>任意</td>
                <td>ESM</td>
                <td>—</td>
                <td>是</td>
                <td>1/3</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>自定义</td>
                <td>Preact</td>
                <td>ESM</td>
                <td>—</td>
                <td>否</td>
                <td>1/3</td>
              </tr>
              <tr>
                <td><strong>KISS</strong></td>
                <td><strong>Fetch API</strong></td>
                <td><strong>Web Components</strong></td>
                <td><strong>ESM</strong></td>
                <td><strong>✓</strong></td>
                <td><strong>是</strong></td>
                <td><strong>3/3</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; 快速上手</a>
            <a href="/guide/architecture" class="nav-link">架构设计 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ei.styles=[F,w`
      .pillar {
        padding: 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .pillar .num {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--kiss-text-muted);
        margin-bottom: 0.25rem;
      }
      .pillar .hard-constraint {
        display: inline-block;
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-border-hover);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        margin: 0.125rem 0;
      }
    `];let Ws=ei;customElements.define("page-design-philosophy",Ws);const nr="page-design-philosophy",ti=class ti extends C{render(){return _`
      <kiss-layout currentPath="/guide/error-handling">
        <div class="container">
          <h1>错误处理</h1>
          <p class="subtitle">
            类型安全的错误层级、全局处理器、跨边界错误映射。
          </p>

          <h2>设计哲学</h2>
          <ul>
            <li>每个错误都有类型——不使用裸 <span class="inline-code">Error</span></li>
            <li>全局错误处理器捕获一切</li>
            <li>操作性错误 → 结构化响应给用户</li>
            <li>编程错误 → 日志 + 通用 500</li>
            <li>统一的错误格式跨 SSR → 浏览器 → API 边界</li>
          </ul>

          <h2>错误类层级</h2>
          <div class="error-hierarchy">
            <strong>KissError</strong> (基类: code, statusCode, message)<br>
            ├── <strong>NotFoundError</strong> (404)<br>
            ├── <strong>UnauthorizedError</strong> (401)<br>
            ├── <strong>ForbiddenError</strong> (403)<br>
            ├── <strong>ValidationError</strong> (400)<br>
            ├── <strong>ConflictError</strong> (409)<br>
            ├── <strong>RateLimitError</strong> (429)<br>
            ├── <strong>SsrRenderError</strong> (500)<br>
            └── <strong>HydrationError</strong> (500)
          </div>

          <h2>使用错误类</h2>
          <code-block>
            ><pre><code>import { NotFoundError, ValidationError } from '@kissjs/core';

// 在 API 路由处理器中
app.get('/api/posts/:id', async (c) => {
  const post = await findPost(c.req.param('id'));
  if (!post) throw new NotFoundError('Post not found');

  const { title } = await c.req.json();
  if (!title) throw new ValidationError('Title is required');

  return c.json(post);
})</code></pre></code-block>

          <h2>SSR 错误渲染</h2>
          <p>KISS 提供 <span class="inline-code">renderSsrError()</span>，支持开发/生产模式：</p>
          <table>
            <thead>
              <tr>
                <th>模式</th>
                <th>行为</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>开发</td>
                <td>完整错误消息 + 堆栈跟踪用于调试</td>
              </tr>
              <tr>
                <td>生产</td>
                <td>安全的通用错误页面——不暴露内部细节</td>
              </tr>
            </tbody>
          </table>

          <h2>三层错误策略</h2>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>范围</th>
                <th>策略</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>SSG（构建时）</strong></td>
                <td>构建 → HTML</td>
                <td>renderSsrError() 开发/生产模式。错误在构建时发生，不在运行时。</td>
              </tr>
              <tr>
                <td><strong>Hydration</strong></td>
                <td>浏览器 → Island</td>
                <td>console.warn + 优雅回退</td>
              </tr>
              <tr>
                <td><strong>RPC</strong></td>
                <td>客户端 → API</td>
                <td>RpcError 带类型化错误映射</td>
              </tr>
            </tbody>
          </table>
          <p>
            <strong>注意：</strong> KISS 中的"SSR"指的是<span class="inline-code">@lit-labs/ssr</span> 的<em>构建时渲染</em>，
            不是运行时服务器。错误在 <span class="inline-code">vite build</span> 期间发生，从不在生产环境中。
          </p>

          <div class="nav-row">
            <a href="/guide/configuration" class="nav-link">&larr; 配置</a>
            <a href="/guide/security-middleware" class="nav-link">安全 &amp; 中间件 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ti.styles=[F,w`
      .error-hierarchy {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border-left: 3px solid var(--kiss-error, #ef4444);
        border-radius: 0 3px 3px 0;
        margin: 0.75rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
      }
    `];let qs=ti;customElements.define("page-error-handling",qs);const or="page-error-handling",si=class si extends C{render(){return _`
      <kiss-layout currentPath="/guide/getting-started">
        <div class="container">
          <h1>快速上手</h1>
          <p class="subtitle">一条命令创建、三阶段构建、GitHub Pages 部署。</p>

          <div class="step">
            <h2 class="step-header">1. 创建项目</h2>
            <p class="step-desc">使用 create-kiss CLI 一键生成脚手架 —— 零配置、零选择。</p>
            <code-block><pre><code>deno run -A jsr:@kissjs/create my-app
cd my-app</code></pre></code-block>
          </div>

          <div class="step">
            <h2 class="step-header">2. 启动开发服务器</h2>
            <p class="step-desc">Vite 开发服务器 + Hono SSR，实时刷新。</p>
            <code-block><pre><code>deno task dev</code></pre></code-block>
            <p>打开 <span class="inline-code">localhost:5173</span> 查看页面。</p>
          </div>

          <div class="step">
            <h2 class="step-header">3. 构建（三阶段）</h2>
            <p class="step-desc">KISS 使用三阶段构建管线，分步验证、增量输出。</p>
            <code-block><pre><code># Phase 1 — SSR bundle + build metadata
deno task build

# Phase 2 — Island client chunks
deno task build:client

# Phase 3 — SSG static HTML
deno task build:ssg</code></pre></code-block>
            <div class="note">
              <strong>架构说明：</strong>三阶段各自独立，每阶段输出可作为下一阶段输入。
              Phase 1 产出 SSR bundle 和 <span class="inline-code">.kiss/build-metadata.json</span>；
              Phase 2 将 Island 组件编译为独立 client chunk；
              Phase 3 渲染全部静态 HTML + 注入 hydration 脚本。
            </div>
          </div>

          <div class="step">
            <h2 class="step-header">4. 预览构建产物</h2>
            <code-block><pre><code>deno task preview</code></pre></code-block>
          </div>

          <div class="step">
            <h2 class="step-header">5. 部署到 GitHub Pages</h2>
            <p class="step-desc"><span class="inline-code">dist/</span> 目录为纯静态网站，可直接部署到任意静态托管平台。</p>
            <code-block><pre><code># 示例：gh-pages 分支
cd dist
git init
git add -A
git commit -m "Deploy"
git push -f https://github.com/USER/REPO.git HEAD:gh-pages</code></pre></code-block>
          </div>

          <div class="step">
            <h2 class="step-header">项目结构</h2>
            <code-block><pre><code>my-app/
├── app/
│   ├── routes/          # 页面组件（LitElement）
│   │   ├── index.ts     # 首页 /
│   │   └── ...
│   └── islands/         # 交互式 Island（LitElement）
│       └── my-counter.ts
├── deno.json            # 任务定义 + 依赖
└── vite.config.ts       # KISS 插件配置</code></pre></code-block>
          </div>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">设计哲学 &rarr;</a>
            <a href="/examples" class="nav-link">示例 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};si.styles=[F,w`
    .step { margin-bottom: 2rem; }
    .step-header { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; color: var(--kiss-text-primary); }
    .step-desc { color: var(--kiss-text-tertiary); font-size: 0.8125rem; margin-bottom: 0.5rem; }
    .note { background: var(--kiss-bg-surface); border: 1px solid var(--kiss-border); border-radius: 4px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--kiss-text-secondary); margin-top: 1rem; }
    .inline-code { font-family: "SF Mono","Fira Code",monospace; font-size: 0.8125rem; background: var(--kiss-bg-elevated); padding: 0.125rem 0.375rem; border-radius: 3px; }
  `];let Gs=si;customElements.define("page-getting-started",Gs);const cr="page-getting-started",ai=class ai extends C{render(){return _`
      <kiss-layout currentPath="/guide/islands">
        <div class="container">
          <h1>Islands 架构</h1>
          <p class="subtitle">只在需要的地方添加交互性。默认零 JS。</p>

          <h2>为什么需要 Islands？</h2>
          <div class="comparison">
            <div class="comparison-item spa">
              <h3>传统 SPA</h3>
              <ul>
                <li>整个页面都是 JavaScript（100KB+）</li>
                <li>静态内容需要 JS 才能渲染</li>
                <li>首屏加载慢，SEO 差</li>
              </ul>
            </div>
            <div class="comparison-item kiss">
              <h3>KISS Islands（KISS 架构）</h3>
              <ul>
                <li>只有交互部分才加载 JS</li>
                <li>静态内容 = HTML + DSD（零 JS）</li>
                <li>首屏加载快，SEO 好</li>
                <li>Shadow DOM 封装保留</li>
              </ul>
            </div>
          </div>

          <h2>渐进增强层级</h2>
          <p>KISS 架构只有两个层级。没有 SPA——这是 S 约束（Static）。</p>
          <table>
            <thead><tr><th>层级</th><th>渲染方式</th><th>JS 大小</th><th>使用场景</th></tr></thead>
            <tbody>
              <tr><td><strong>0</strong></td><td>SSG + 声明式 Shadow DOM</td><td><strong>0 KB</strong></td><td>博客、文档、营销页</td></tr>
              <tr><td><strong>1</strong></td><td>Islands + 懒 Hydration</td><td>~6 KB / island</td><td>计数器、表单、代码复制</td></tr>
            </tbody>
          </table>
          <p>默认：<strong>层级 0</strong>（零 JS）。通过 <span class="inline-code">app/islands/</span> 按组件选择加入。</p>

          <h2>Island 决策树</h2>
          <p>创建 Island 前，确认低层无法解决问题：</p>
          <div class="decision-tree">需要交互性？
├─ 仅内容？        → L0：DSD 输出（零 JS）
├─ 仅视觉状态？   → L1：CSS（:hover、:focus-within、details[open]）
├─ 浏览器能力？   → L2：平台 API（Clipboard、IntersectionObserver）
├─ 组件封装？     → L3：Lit 组件 + DSD（构建时渲染）
└─ 以上都不行？   → L4：Island（Shadow DOM + 懒 Hydration）

示例排除：
  - 激活高亮  → aria-current + CSS（L0+L1，不是 Island）
  - 侧边栏折叠  → &lt;details&gt;/&lt;summary&gt;（L0，不是 Island）
  - 代码复制按钮  → Island + Clipboard API（L2+L4，合法 Island）
  - 主题切换      → Island + localStorage（L2+L4，合法 Island）</div>

          <h2>Islands 如何工作</h2>
          <h3>构建时</h3>
          <p><span class="inline-code">island-transform</span> 用 <span class="inline-code">__island</span> 和 <span class="inline-code">__tagName</span> 标记 island 模块。<span class="inline-code">island-extractor</span> 构建依赖映射。SSG 输出包含 island 占位元素。</p>

          <h3>运行时</h3>
          <p>hydration 脚本只懒加载当前页面需要的 island JS 包。Islands 按需求 hydration（可见时、空闲时、或立即——可配置）。</p>

          <h2>创建一个 Island</h2>
          <p>在 <span class="inline-code">app/islands/</span> 下创建文件：</p>
          <code-block><pre><code>// app/islands/counter.ts
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'my-counter'
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } }

  constructor() {
    super()
    this.count = 0
  }

  override render() {
    return html\`
      &lt;button @click=\${() => this.count++}&gt;+&lt;/button&gt;
      &lt;span&gt;\${this.count}&lt;/span&gt;
      &lt;button @click=\${() => this.count--}&gt;-&lt;/button&gt;
    \`
  }
}</code></pre></code-block>
          <p>在任何路由中使用——它会自动在客户端 hydration。</p>

          <h2>Package Islands</h2>
          <p>
            KISS 可以自动探测并注册来自 npm/JSR 包的 Islands。这使得
            可复用的 Island 组件可以跨项目共享。
          </p>

          <h3>创建 Package Island</h3>
          <p>
            在你的包中，创建一个 Island 并通过 <code>islands</code> 数组导出它：
          </p>
          <code-block><pre><code>// packages/my-ui/src/my-counter.ts
import { LitElement, html, css } from 'lit'

export const tagName = 'my-counter'
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } }
  override render() {
    return html\`&lt;button @click=\${() => this.count++}&gt;Count: \${this.count}&lt;/button&gt;\`
  }
}

// packages/my-ui/src/index.ts
import type { PackageIslandMeta } from '@kissjs/core'
import MyCounter, { tagName as counterTag } from './my-counter.js'

// 导出 islands 数组供自动探测
export const islands: PackageIslandMeta[] = [
  { tagName: counterTag, modulePath: 'my-ui/my-counter', strategy: 'eager' }
]

export { MyCounter }</code></pre></code-block>

          <h3>使用 Package Islands</h3>
          <p>
            在 <code>vite.config.ts</code> 中配置 <code>packageIslands</code>：
          </p>
          <code-block><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'

export default {
  plugins: [
    kiss({
      packageIslands: ['my-ui'], // 从 my-ui 包自动探测 islands
    })
  ]
}</code></pre></code-block>
          <p>
            框架会自动导入并注册包中的所有 Islands。无需手动注册。
          </p>

          <h3>Package Island 元数据</h3>
          <table>
            <thead>
              <tr>
                <th>字段</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>tagName</code></td>
                <td>string</td>
                <td>自定义元素标签名（如 'my-counter'）</td>
              </tr>
              <tr>
                <td><code>modulePath</code></td>
                <td>string</td>
                <td>相对于包的路径（如 'my-ui/my-counter'）</td>
              </tr>
              <tr>
                <td><code>strategy</code></td>
                <td>string</td>
                <td>hydration 策略：'eager' | 'lazy' | 'idle' | 'visible'（默认：'eager'）</td>
              </tr>
            </tbody>
          </table>

          <h2>DSD + Islands</h2>
          <p>非 Island 组件（在 <span class="inline-code">app/components/</span> 和 <span class="inline-code">app/routes/</span>）在构建时使用<strong>声明式 Shadow DOM</strong>渲染。它们的内容在 JS 加载前就可见：</p>
          <table>
            <thead><tr><th>组件类型</th><th>DSD 输出</th><th>客户端 JS</th></tr></thead>
            <tbody>
              <tr><td>页面组件（routes/）</td><td>✓ 完整 DSD + 作用域样式</td><td>仅 hydration（框架）</td></tr>
              <tr><td>布局组件（components/）</td><td>✓ 完整 DSD + 作用域样式</td><td>仅 hydration（框架）</td></tr>
              <tr><td>Island 组件（islands/）</td><td>✓ 占位符 DSD</td><td>✓ 懒加载包</td></tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/routing" class="nav-link">&larr; 路由</a>
            <a href="/guide/api-routes" class="nav-link">API Routes &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ai.styles=[F,w`
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0 1.5rem; }
    .comparison-item { padding: 1rem 1.25rem; border: 1px solid var(--kiss-border); border-radius: 3px; }
    .comparison-item ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: var(--kiss-text-secondary);  }
    .comparison-item li { margin-bottom: 0.25rem; }
    .comparison-item.spa { border-color: var(--kiss-border, #fecaca); }
    .comparison-item.kiss { border-color: var(--kiss-accent, #bbf7d0); background: var(--kiss-bg-surface, #f0fdf4); }

    .decision-tree { padding: 1rem; background: var(--kiss-bg-surface); border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px 0; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; color: var(--kiss-text-secondary);  font-family: 'SF Mono', 'Fira Code', monospace; white-space: pre-wrap; }

  `];let Vs=ai;customElements.define("page-islands-guide",Vs);const ur="page-islands-guide",ri=class ri extends C{render(){return _`
      <kiss-layout currentPath="/guide/kiss-compiler">
        <div class="container">
          <p class="adr-meta">ADR 0002 · 2026-04-30 · Draft</p>
          <h1>.kiss Compiler — Eliminate Lit, Zero Runtime</h1>

          <h2>Context</h2>
          <p>
            KISS currently depends on <code>lit</code> (npm:lit) for component authoring. This brings a 58kb gzip runtime,
            @lit-labs/ssr for server rendering (with CJS polyfill), hydration ceremony, and dprint fmt panics on tagged
            template literals.
          </p>

          <h2>Proposal</h2>
          <p>
            Introduce <code>.kiss</code> files — a component format purpose-built for KISS. A compiler transforms <code>.kiss</code>
            files into vanilla Custom Elements at build time. Zero runtime dependency.
          </p>

          <h3>.kiss file format</h3>
          <div class="code-block">&lt;!-- my-counter.kiss --&gt;
&lt;template&gt;
  &lt;button @click="decrement"&gt;−&lt;/button&gt;
  &lt;span&gt;{count}&lt;/span&gt;
  &lt;button @click="increment"&gt;+&lt;/button&gt;
&lt;/template&gt;

&lt;script&gt;
  count = 0
  increment() { this.count++ }
  decrement() { this.count-- }
&lt;/script&gt;

&lt;style&gt;
  :host { display: inline-flex; gap: 0.5rem; align-items: center; }
&lt;/style&gt;</div>

          <h3>What the compiler eliminates</h3>
          <table>
            <tr><th>Layer</th><th>Before (Lit)</th><th>After (.kiss compiler)</th></tr>
            <tr><td>Runtime</td><td>58kb gzip lit</td><td>0kb</td></tr>
            <tr><td>SSR</td><td>@lit-labs/ssr + DOM shim</td><td>template.innerHTML (sync)</td></tr>
            <tr><td>Hydration</td><td>DSD + hydrate() + order bug</td><td>template.cloneNode (no hydration)</td></tr>
            <tr><td>Polyfills</td><td>node-domexception CJS shim</td><td>none needed</td></tr>
            <tr><td>Build</td><td>esbuild decorator transform</td><td>standard TS/JS only</td></tr>
          </table>

          <h2>SSG integration</h2>
          <p>
            The route scanner already maps <code>app/routes/*.ts</code> to URL paths. Extend it to also scan .kiss files.
            Page .kiss files render directly (template is the page). Island .kiss files get lazy chunk treatment.
          </p>

          <h2>Backward compatibility</h2>
          <p>
            <code>vite.config.ts</code> option: <code>compiler: 'lit' | 'kiss' | 'auto'</code>.
            Lit support retained throughout v0.x. v1.0 defaults to .kiss compiler.
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/pwa" class="nav-link">PWA Support &rarr;</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ri.styles=[F,w`
      .adr-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      h3 { font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.25rem; color: var(--kiss-text-secondary); }
      p { font-size: 0.8125rem; line-height: 1.7; color: var(--kiss-text-secondary); margin: 0 0 0.75rem; }
      .code-block {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
      table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin: 0.75rem 0; }
      th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--kiss-border); }
      th { font-weight: 500; color: var(--kiss-text-primary); }
    `];let Qs=ri;customElements.define("page-kiss-compiler",Qs);const lr="page-kiss-compiler",ii=class ii extends C{render(){return _`
      <kiss-layout currentPath="/guide/pwa">
        <div class="container">
          <p class="adr-meta">ADR 0003 · 2026-04-30 · Draft</p>
          <h1>PWA Support for KISS SSG</h1>

          <h2>Context</h2>
          <p>
            KISS generates pure static HTML with Declarative Shadow DOM. This is the ideal substrate for a PWA:
            all pages are pre-rendered, assets are versioned hashes, no server state. A service worker can precache
            the entire site at install time.
          </p>

          <h2>Implementation</h2>
          <p>
            Added to <code>build-ssg.ts</code> — after Phase 3, the SSG script generates:
          </p>
          <ul style="font-size:0.8125rem;color:var(--kiss-text-secondary);margin:0.5rem 0 1rem;line-height:1.8">
            <li><code>manifest.json</code> — Web App Manifest with name, theme_color, icons</li>
            <li><code>sw.js</code> — Service Worker with CacheFirst (static) + NetworkFirst (API) strategy</li>
            <li>HTML injection — <code>&lt;link rel="manifest"&gt;</code> + sw registration script</li>
          </ul>

          <h3>API</h3>
          <div class="code-block">// vite.config.ts
export default defineConfig({
  plugins: [kiss({
    pwa: {
      name: 'My KISS App',
      shortName: 'KISS',
      themeColor: '#000000',
      backgroundColor: '#ffffff',
    },
  })],
})</div>

          <h3>Service Worker strategy</h3>
          <div class="code-block">self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('kiss-v1').then(c => c.addAll([
    '/', '/index.html', // precache root
  ])))
  self.skipWaiting();
})
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
})</div>

          <h2>Current status</h2>
          <p>
            The <code>build-ssg.ts</code> script accepts a <code>pwa</code> option. When provided, it generates
            manifest.json and sw.js in the output directory, and injects manifest links + sw registration into
            every HTML file. The <code>kiss()</code> plugin will expose this option in the next release.
          </p>
          <p>
            Benefit: offline access, instant repeat visits, installable on mobile. Cost: ~100 lines of code.
            No dependency on Workbox — hand-written 30-line sw.js covers CacheFirst + NetworkFirst.
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/kiss-compiler" class="nav-link">&larr; KISS Compiler</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ii.styles=[F,w`
      .adr-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      h3 { font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.25rem; color: var(--kiss-text-secondary); }
      p { font-size: 0.8125rem; line-height: 1.7; color: var(--kiss-text-secondary); margin: 0 0 0.75rem; }
      .code-block {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
    `];let Xs=ii;customElements.define("page-pwa",Xs);const dr="page-pwa",ni=class ni extends C{render(){return _`
      <kiss-layout currentPath="/guide/routing">
        <div class="container">
          <h1>路由</h1>
          <p class="subtitle">基于文件的路由——创建一个文件，就得到一个路由。</p>

          <h2>基础路由</h2>
          <p>
            在 <span class="inline-code">app/routes/</span> 下创建一个文件，它会自动变为路由。
          </p>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>路由</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/index.ts</span></td>
                <td><span class="inline-code">/</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/about.ts</span></td>
                <td><span class="inline-code">/about</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/guide/getting-started.ts</span></td>
                <td><span class="inline-code">/guide/getting-started</span></td>
              </tr>
            </tbody>
          </table>

          <h2>动态路由</h2>
          <p>使用方括号表示动态片段：</p>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>路由</th>
                <th>参数</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/posts/[slug].ts</span></td>
                <td><span class="inline-code">/posts/:slug</span></td>
                <td><span class="inline-code">slug</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/users/[id]/posts.ts</span></td>
                <td><span class="inline-code">/users/:id/posts</span></td>
                <td><span class="inline-code">id</span></td>
              </tr>
            </tbody>
          </table>

          <h2>特殊文件</h2>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>用途</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">_renderer.ts</span></td>
                <td>SSR 的自定义 HTML 包装器</td>
              </tr>
              <tr>
                <td><span class="inline-code">_middleware.ts</span></td>
                <td>路由树的 Hono 中间件</td>
              </tr>
            </tbody>
          </table>

          <h2>路由模块约定</h2>
          <p>每个路由模块必须导出：</p>
          <table>
            <thead>
              <tr>
                <th>导出</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">default</span></td>
                <td>LitElement class</td>
                <td>页面组件</td>
              </tr>
              <tr>
                <td><span class="inline-code">tagName</span></td>
                <td>string</td>
                <td>自定义元素标签名</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; KISS 架构</a>
            <a href="/guide/islands" class="nav-link">Islands &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ni.styles=[F,w`
    `];let Js=ni;customElements.define("page-routing-guide",Js);const hr="page-routing-guide",oi=class oi extends C{render(){return _`
      <kiss-layout currentPath="/guide/security-middleware">
        <div class="container">
          <h1>安全 &amp; 中间件</h1>
          <p class="subtitle">安全请求头、CORS、限流、以及中间件链执行顺序。</p>

          <h2>中间件链</h2>
          <p>KISS 按标准顺序自动注册中间件。越早注册的中间件作用域越广：</p>
          <div class="mw-chain">
            请求 → RequestID → Logger → CORS → SecurityHeaders<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RateLimit → BodyParse → Auth → Validation → Handler<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ ErrorHandler → Response
          </div>

          <h2>默认中间件</h2>
          <table>
            <thead>
              <tr><th>中间件</th><th>作用域</th><th>默认</th></tr>
            </thead>
            <tbody>
              <tr><td>Request ID</td><td>所有路由</td><td>启用</td></tr>
              <tr><td>Logger</td><td>所有路由</td><td>启用</td></tr>
              <tr><td>CORS</td><td>所有路由</td><td>开发环境允许 localhost</td></tr>
              <tr><td>Security Headers</td><td>所有路由</td><td>启用（XSS、点击劫持等）</td></tr>
            </tbody>
          </table>

          <h2>配置 CORS</h2>
          <p>CORS 源通过 <span class="inline-code">kiss()</span> 选项配置——无需环境变量：</p>
          <code-block><pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';

export default defineConfig({
  plugins: [
    kiss({
      middleware: {
        corsOrigin: 'https://myapp.com',   // 字符串
        // corsOrigin: ['https://a.com', 'https://b.com'],  // 数组
        // corsOrigin: (origin) => origin,  // 函数
      },
    }),
  ],
})</code></pre></code-block>

          <h2>禁用中间件</h2>
          <code-block><pre><code>kiss({
  middleware: {
    logger: false,          // 禁用请求日志
    cors: false,            // 完全禁用 CORS
    securityHeaders: false, // 禁用安全请求头
  },
})</code></pre></code-block>

          <h2>安全请求头</h2>
          <p>KISS 通过 <span class="inline-code">hono/secure-headers</span> 应用以下请求头：</p>
          <ul>
            <li><span class="inline-code">X-Content-Type-Options: nosniff</span></li>
            <li><span class="inline-code">X-Frame-Options: SAMEORIGIN</span></li>
            <li><span class="inline-code">Referrer-Policy: strict-origin-when-cross-origin</span></li>
            <li><span class="inline-code">Permissions-Policy</span>（限制浏览器特性）</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/testing" class="nav-link">&larr; 测试</a>
            <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};oi.styles=[F,w`
    .mw-chain { padding: 1rem; background: var(--kiss-bg-surface); border-left: 3px solid var(--kiss-border-hover); border-radius: 0 3px 3px 0; margin: 0.75rem 0; font-size: 0.8125rem; line-height: 1.8; }
  `];let Zs=oi;customElements.define("page-security-middleware",Zs);const mr="page-security-middleware",ci=class ci extends C{render(){return _`
      <kiss-layout currentPath="/guide/ssg">
        <div class="container">
          <h1>静态站点生成（SSG）</h1>
          <p class="subtitle">在构建时将路由预渲染为带 DSD 的静态 HTML。</p>

          <h2>快速开始</h2>
          <p>SSG 内置在 <span class="inline-code">kiss()</span> 中。无需额外插件：</p>
          <code-block>
            <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },
    }),
  ]
})</code></pre></code-block>

          <h2>工作原理</h2>
          <p>当你运行 <span class="inline-code">vite build</span> 时，kiss() 自动：</p>
          <ol>
            <li>扫描 <span class="inline-code">app/routes/</span> 中的页面路由</li>
            <li>创建临时 Vite SSR 服务器</li>
            <li>加载每个路由模块，通过 <span class="inline-code">@lit-labs/ssr</span> 渲染</li>
            <li>输出带 <strong>声明式 Shadow DOM</strong> 的 HTML —— 无需 JS 即可可见</li>
            <li>将 Island 组件提取到独立的 JS 包中</li>
            <li>将每个页面写入 <span class="inline-code">route/path/index.html</span></li>
          </ol>
          <p>动态路由（带 <span class="inline-code">[param]</span>）会自动跳过。</p>

          <h2>SSR 兼容性：使用 static properties</h2>
          <p>
            KISS 在 SSR 中使用 Vite 的 esbuild 进行即时转译。由于
            <strong>esbuild 对装饰器的支持有限</strong>，我们推荐使用
            <span class="inline-code">static properties</span> 而不是
            <span class="inline-code">@property</span> 装饰器：
          </p>
          <code-block>
            <pre><code>// ✅ 推荐：在 SSR 中可用
class MyComponent extends LitElement {
  static properties = {
    count: { type: Number },
    name: { type: String },
  };
  count = 0;
  name = '';
}

// ❌ 不推荐：在 SSR 中报错
import { property } from 'lit/decorators.js';
class MyComponent extends LitElement {
  @property({ type: Number }) count = 0;  // "Unsupported decorator location"
}
</code></pre></code-block>

          <p>
            <strong>为什么？</strong> Vite SSR 使用 esbuild 进行即时转译。esbuild 只
            支持旧的 <span class="inline-code">experimentalDecorators</span> 提案（TC39 Stage 2），
            对 <span class="inline-code">@property</span> 等字段装饰器的支持有限。
          </p>
          <p>
            <span class="inline-code">static properties</span> 是 Lit 推荐的语法，
            在任何地方都能工作，并且符合 KISS 的"Web 标准优先"哲学——无需装饰器 polyfill。
          </p>

          <h2>DSD 输出</h2>
          <p>每个渲染的页面都为所有 Lit 组件包含声明式 Shadow DOM。这意味着：</p>
          <table>
            <thead>
              <tr>
                <th>特性</th>
                <th>DSD 输出</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Shadow DOM 样式</td>
                <td>
                  作用在 <span class="inline-code">&lt;template shadowrootmode="open"&gt;</span> 内部
                </td>
              </tr>
              <tr>
                <td>内容可见性</td>
                <td>立即显示 —— 无需 JS</td>
              </tr>
              <tr>
                <td>SEO / 爬取</td>
                <td>完整内容可供爬虫访问</td>
              </tr>
              <tr>
                <td>Hydration</td>
                <td>Lit 复用时直接复用现有 DOM</td>
              </tr>
            </tbody>
          </table>

          <h2>GitHub Pages</h2>
          <p>将 <span class="inline-code">base</span> 设为你的仓库名，带尾部斜杠：</p>
          <code-block>
            <pre><code>// vite.config.ts
export default defineConfig({
  base: '/my-repo/',
  plugins: [kiss({
    inject: {
      stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
      scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
    },
  })],
})</code></pre></code-block>

          <h2>构建 &amp; 部署</h2>
          <code-block>
            <pre><code># KISS 三阶段构建（推荐）
deno task build          # Phase 1 — SSR bundle
deno task build:client   # Phase 2 — Island client chunks
deno task build:ssg      # Phase 3 — Static HTML
# 输出在 dist/ —— 部署到任何静态托管服务</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/api-design" class="nav-link">&larr; API 设计</a>
            <a href="/guide/configuration" class="nav-link">配置 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ci.styles=[F,w`
    `];let ea=ci;customElements.define("page-ssg-guide",ea);const pr="page-ssg-guide",ui=class ui extends C{render(){return _`
      <kiss-layout currentPath="/guide/testing">
        <div class="container">
          <h1>测试策略</h1>
          <p class="subtitle">测试金字塔、框架内置测试、以及你的项目测试模板。</p>

          <h2>测试金字塔</h2>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>占比</th>
                <th>速度</th>
                <th>用途</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>单元测试</td>
                <td>70%</td>
                <td>&lt;10ms</td>
                <td>独立函数 / 组件逻辑</td>
              </tr>
              <tr>
                <td>集成测试</td>
                <td>20%</td>
                <td>&lt;100ms</td>
                <td>路由 + SSR + 渲染</td>
              </tr>
              <tr>
                <td>E2E 测试</td>
                <td>10%</td>
                <td>秒级</td>
                <td>关键用户流程</td>
              </tr>
            </tbody>
          </table>

          <h2>测试框架</h2>
          <p>KISS 使用 Deno 内置测试运行器——零额外依赖：</p>
          <code-block>
            <pre><code>// __tests__/context_test.ts
import { assertEquals } from 'jsr:@std/assert';
import { extractParams, parseQuery } from '@kissjs/core';

Deno.test('extractParams 解析动态片段', () => {
  const params = extractParams('/users/:id', '/users/42');
  assertEquals(params, { id: '42' });
});</code></pre></code-block>

          <h2>测试你的 KISS 应用</h2>
          <code-block>
            <pre><code>// tests/api_test.ts
import { assertEquals } from 'jsr:@std/assert';

Deno.test('API 返回 posts', async () => {
  const res = await fetch('http://localhost:3000/api/posts');
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(Array.isArray(data), true);
});</code></pre></code-block>

          <h2>CI 集成</h2>
          <code-block>
            <pre><code># .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - run: deno test --allow-read --allow-write</code></pre></code-block>

          <h2>KISS 内部测试了什么</h2>
          <ul>
            <li><span class="inline-code">entry-descriptor</span> —— EntryDescriptor 数据模型构建器</li>
            <li><span class="inline-code">entry-renderer</span> —— 从描述符生成代码</li>
            <li><span class="inline-code">route-scanner</span> —— 基于文件的路由发现</li>
            <li><span class="inline-code">island-transform</span> —— AST 标记 + hydration 探测</li>
            <li><span class="inline-code">ssr-handler</span> —— SSR 渲染 + 错误处理</li>
            <li><span class="inline-code">context</span> —— 请求上下文工具</li>
            <li><span class="inline-code">errors</span> —— 错误类层级</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/security-middleware" class="nav-link">&larr; 安全 &amp; 中间件</a>
            <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};ui.styles=[F];let ta=ui;customElements.define("page-testing",ta);const fr="page-testing",li=class li extends C{render(){return _`
      <kiss-layout currentPath="/roadmap">
        <div class="container">
          <h1>开发路线图</h1>
          <p class="subtitle">
            KISS 架构：Knowledge · Isolated · Semantic · Static — 从 PoC 到 v1.0
          </p>

          <h2>里程碑概览</h2>
          <table class="phase-table">
            <thead>
              <tr>
                <th>阶段</th>
                <th>名称</th>
                <th>核心目标</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Phase 0</td>
                <td>PoC</td>
                <td>技术可行性验证</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 1</td>
                <td>Alpha</td>
                <td>核心插件包可用</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 2</td>
                <td>工程化补齐</td>
                <td>P0/P1 修复 + 架构重构</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 3</td>
                <td>文档整合</td>
                <td>docs-site → docs</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 4</td>
                <td>KISS Architecture 落地</td>
                <td>K·I·S·S 四约束 + Jamstack 对齐</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 5</td>
                <td>UI 革命与生态验证</td>
                <td>@kissjs/ui + 设计系统</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 6</td>
                <td>架构审计与修复</td>
                <td>P0/P1 问题清零 + Dogfooding</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 7</td>
                <td>文档站自举</td>
                <td>docs 站使用自研 kiss-ui 组件</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 8</td>
                <td>v0.3.x — 工程重构</td>
                <td>Package Islands + 3-phase build + KISS renderer</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 9</td>
                <td>v0.3.4 — 代码审查</td>
                <td>全量 audit + CI 并行 + 35+ 项修复</td>
                <td class="status-done">完成</td>
              </tr>
              <tr>
                <td>Phase 10</td>
                <td>v0.4.0 — PWA + 生态</td>
                <td>PWA 支持、博客模块、在线文档</td>
                <td>进行中</td>
              </tr>
              <tr>
                <td>Phase 11</td>
                <td>v1.0 — .kiss Compiler</td>
                <td>零运行时编译器、消灭 Lit</td>
                <td>规划中</td>
              </tr>
            </tbody>
          </table>

          <h2>Phase 5：UI 革命与生态验证（已完成）</h2>

          <h3>5A: 品牌视觉 + 设计系统页面</h3>
          <ul class="task-list">
            <li>首页风格改造 — 纯黑背景、高对比度</li>
            <li>品牌色统一 — Logo/Nav hover/Sidebar active 全局统一</li>
            <li>UI 设计系统页面 — /ui 路由，展示 Design Tokens</li>
            <li>导航栏添加 UI 标签 — Docs | UI | JSR | GitHub</li>
            <li>自定义域名修复 — base path 从 /kiss/ 改为 /</li>
          </ul>

          <h3>5B: @kissjs/ui 组件库实现</h3>
          <ul class="task-list">
            <li>@kissjs/ui 重构 — 基于 Lit 构建自有 Web Components</li>
            <li>核心组件：kiss-button, kiss-card, kiss-input, kiss-code-block, kiss-layout</li>
            <li>文档站用 @kissjs/ui 重写 — dogfooding</li>
            <li>迁移示例文件 — examples/minimal-blog + examples/hello 迁移到 static properties</li>
            <li>发布 @kissjs/ui@0.1.4 — JSR 发布</li>
          </ul>

          <h2>Phase 6：架构审计与修复（已完成）</h2>

          <h3>6A: P0 Bug 修复</h3>
          <ul class="task-list">
            <li>allNoExternal 未使用 — 修复 Vite SSR 模块解析</li>
            <li>userResolveAlias 类型不匹配 — 支持 Record 和 Alias[] 两种格式</li>
            <li>Island 扫描配置错误 — 移动到正确目录，文件名匹配 tag name</li>
          </ul>

          <h3>6B: P1 问题清理</h3>
          <ul class="task-list">
            <li>code-block Island 主题适配 — CSS 变量替换硬编码颜色</li>
            <li>kiss-layout 导航补全 — 添加 Examples + Project sections</li>
            <li>hydrationStrategy 选项移除 — 删除未实现选项</li>
            <li>测试覆盖扩展 — kiss-rpc + kiss-ui 测试集成</li>
            <li>kiss-docs-kit 空壳删除 — 移除未使用包</li>
            <li>logger.ts 删除 — 移除未使用模块</li>
            <li>README 版本更新 — core 0.1.6, rpc 0.1.3, ui 0.1.4</li>
          </ul>

          <h3>6C: 体验优化</h3>
          <ul class="task-list">
            <li>docs 站 dogfooding — 25 个路由使用 kiss-layout</li>
            <li>组件导入统一 — @kissjs/ui/kiss-layout 替代本地组件</li>
            <li>构建验证通过 — 25 pages, 3 islands detected</li>
            <li>deno fmt/lint 通过 — 代码风格统一</li>
          </ul>

          <h2>Phase 8：v0.3.0 工程重构（已完成）</h2>
          <ul class="task-list">
            <li>Package Islands 自动检测 — npm/JSR 包可导出 Islands</li>
            <li>KissRenderer 实现 — 替代 Hono 默认 Renderer</li>
            <li>KissBuildContext 架构 — 替代闭包共享可变状态</li>
            <li>EntryDescriptor + renderEntry 模板化 — 替代 hono-entry.ts 字符串拼接</li>
            <li>hydrationStrategy 四策略 — eager / lazy / idle / visible</li>
            <li>@kissjs/ui 构建产出去 @kissjs/core 依赖 — 依赖反转</li>
          </ul>

          <h3>8A: 三阶段构建管线</h3>
          <ul class="task-list">
            <li>Phase 1: vite build → SSR bundle + .kiss/build-metadata.json</li>
            <li>Phase 2: build:client → dist/client/islands/*.js</li>
            <li>Phase 3: build:ssg → dist/*.html + 静态 SSG</li>
            <li>消除 closeBundle 嵌套 Vite 导致 watch 模式 breakage</li>
            <li>Vite manifest 集成 — build.manifest:true 确定性 chunk 检测</li>
          </ul>

          <h3>8B: hydration 修复</h3>
          <ul class="task-list">
            <li>litElementHydrateSupport 在 customElements.define 之前执行</li>
            <li>动态 import() 确保 hydration 补丁先于组件注册</li>
            <li>DSD polyfill 移除（现代浏览器已原生支持）</li>
            <li>build-client.ts base=/client/ 修复 Island chunk URL</li>
          </ul>

          <h2>Phase 9：v0.3.4 代码审查（已完成）</h2>
          <ul class="task-list">
            <li>三轮迭代审查 + 两轮 agent 深搜 — 35+ 项修复</li>
            <li>P0: kiss-input undefined 字符串, CLI exports 缺失, SSG CJS polyfill 时序</li>
            <li>P1: 暗色模式阴影, kiss-button nothing/arrow, kiss-rpc abort race, kiss-theme-toggle 递归</li>
            <li>CI 并行化 (typecheck + 4 test job) + actions/cache</li>
            <li>deno-version 锁定 "2" — 防止 Deno 3.0 意外破坏</li>
            <li>scanIslands 递归扫描 — 支持子目录 Island</li>
            <li>coverge 自动化 + CI badge 替换手动 badge</li>
            <li>JSR publish typecheck 修复 — noExternalPatterns 类型断言</li>
          </ul>

          <h2>Phase 10：v0.4.0 PWA + 生态（进行中）</h2>
          <ul class="task-list">
            <li>PWA 支持 — 自动生成 manifest.json + sw.js（CacheFirst 策略）</li>
            <li><code>@kissjs/blog</code> 设计完成 — <code>docs/decisions/0004-blog-system.md</code></li>
            <li>博客系统实现在 <code>.kiss</code> compiler 之后（depends on Phase 11）</li>
            <li>腾讯在线文档同步 — 变更记录发布到 docs.qq.com</li>
            <li>v0.3.x 全量修复 — 35+ 项代码审查问题已清零</li>
            <li>SSG 新项目 DSD 缺失 — 纯路由组件 SSR 输出空壳标签 <code>&lt;df-home defer-hydration&gt;&lt;/df-home&gt;</code>，未渲染 Shadow DOM。docs 站点因使用 <code>kiss-layout</code> 绕过此问题。根因在 <code>entry-descriptor.ts</code> 生成的 SSR 渲染代码中 Lit SSR <code>render()</code> 未被正确调用或 resolveAlias 导致 shim 不完整</li>
          </ul>

          <h2>Phase 11：v1.0 .kiss Compiler（规划中）</h2>
          <p class="subtitle">彻底消灭 Lit，零运行时 Web Components。</p>
          <ul class="task-list">
            <li>发明 <code>.kiss</code> 文件格式 — 声明式组件（template + script + style）</li>
            <li>编译器：<code>.kiss → vanilla Custom Element</code>（0 runtime deps）</li>
            <li>消除：Lit 58kb gzip、@lit-labs/ssr、hydration、CJS polyfill</li>
            <li>SSR 变为同步 string concat：<code>template.innerHTML</code></li>
            <li>保留 Lit 作为可选 fallback（<code>compiler: 'auto'</code>）</li>
            <li>详见证：<code>docs/decisions/0002-kiss-compiler-eliminate-lit.md</code></li>
          </ul>

          <h2>已解决的技术债</h2>
          <table class="tech-debt-table">
            <thead>
              <tr>
                <th>问题</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>8 插件闭包共享可变状态</td>
                <td class="status-done">已重构为 KissBuildContext</td>
              </tr>
              <tr>
                <td>entry-renderer.ts 字符串拼接</td>
                <td class="status-done">已重构为 EntryDescriptor + renderEntry</td>
              </tr>
              <tr>
                <td>Island 正则检测</td>
                <td class="status-done">已改为 Rollup manifest</td>
              </tr>
              <tr>
                <td>CI 串行执行</td>
                <td class="status-done">已拆为 5 并行 job</td>
              </tr>
              <tr>
                <td>deno-version 浮动</td>
                <td class="status-done">已锁定 "2"</td>
              </tr>
              <tr>
                <td>8 个 assertEquals(true,true) 僵尸断言</td>
                <td class="status-done">已替换</td>
              </tr>
              <tr>
                <td>ssg-smoke 静默跳过</td>
                <td class="status-done">已改为 Deno.test({ ignore })</td>
              </tr>
            </tbody>
          </table>

          <h2>仍存在的技术债</h2>
          <table class="tech-debt-table">
            <thead>
              <tr>
                <th>问题</th>
                <th>优先级</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>移动端 <code>&lt;details&gt;</code> hack — 无程序化关闭</td>
                <td class="priority-medium">中</td>
              </tr>
              <tr>
                <td>@kissjs/ui-plugin cdn:false 无操作选项</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>index-plugin.test.ts 10个冗余 plugins.length 测试</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>kiss-card 不在 islands 数组中 — SSR-only 设计未文档化</td>
                <td class="priority-low">低</td>
              </tr>
              <tr>
                <td>无 Codecov / 覆盖率 badge 自动化</td>
                <td class="priority-medium">中</td>
              </tr>
            </tbody>
          </table>

          <h2>架构概览</h2>
          <div class="architecture-diagram">用户视角：vite.config.ts
&#x250C;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2510;
&#x2502;  import { kiss } from '@kissjs/core'  &#x2502;
&#x2502;  export default defineConfig({         &#x2502;
&#x2502;    plugins: [kiss()]                   &#x2502;
&#x2502;  })                                    &#x2502;
&#x2514;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2518;
               &#x2502;
&#x250C;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2510;
&#x2502;     @kissjs/core (6 &#x5B50;&#x63D2;&#x4EF6;)              &#x2502;
&#x2502;                                          &#x2502;
&#x2502;  1. kiss:core — &#x8DEF;&#x7531;&#x626B;&#x63CF; (K)            &#x2502;
&#x2502;  2. kiss:virtual-entry — &#x865A;&#x62DF;&#x6A21;&#x5757;       &#x2502;
&#x2502;  3. @hono/vite-dev-server — dev only    &#x2502;
&#x2502;  4. island-transform — AST &#x6807;&#x8BB0; (I)     &#x2502;
&#x2502;  5. html-template — HTML &#x6CE8;&#x5165; (&#x9884;&#x7559;)    &#x2502;
&#x2502;  6. kiss:build — &#x5143;&#x6570;&#x636E; (K+S)          &#x2502;
&#x2514;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2518;
               &#x2502;
&#x250C;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2534;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2510;
&#x2502;  &#x4E24;&#x4E2A;&#x72EC;&#x7ACB;&#x90E8;&#x7F72;&#x76EE;&#x6807;      &#x2502;
&#x2502;                       &#x2502;
&#x2502;  dist/ (&#x9759;&#x6001;&#x524D;&#x7AEF;)     &#x2502; &larr; K+I+S &#x7EA6;&#x675F;
&#x2502;  API Routes (Serverless) &larr; S &#x7EA6;&#x675F;
&#x2514;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2518;</div>

          <div class="nav-row">
            <a href="/examples" class="nav-link">&larr; 示例</a>
            <a href="/changelog" class="nav-link">更新日志 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};li.styles=[F,w`
      .phase-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .phase-table th,
      .phase-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--kiss-border);
      }
      .phase-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .phase-table td:first-child {
        font-weight: 600;
        color: var(--kiss-text-primary);
      }
      .status-done {
        color: var(--kiss-accent);
        font-weight: 500;
      }
      .status-wip {
        color: var(--kiss-text-secondary);
        font-weight: 500;
      }
      .task-list {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
      }
      .task-list li {
        padding: 0.5rem 0;
        padding-left: 1.5rem;
        position: relative;
        color: var(--kiss-text-secondary);
        font-size: 0.875rem;
      }
      .task-list li::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: var(--kiss-accent);
        font-weight: 700;
      }
      .tech-debt-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .tech-debt-table th,
      .tech-debt-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--kiss-border);
      }
      .tech-debt-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .priority-high {
        color: var(--kiss-accent);
      }
      .priority-medium {
        color: var(--kiss-accent-dim);
      }
      .priority-low {
        color: var(--kiss-text-tertiary);
      }
      .architecture-diagram {
        padding: 1.5rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.75rem;
        line-height: 1.6;
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--kiss-text-secondary);
      }
    `];let sa=li;customElements.define("page-roadmap",sa);const br="page-roadmap",di=class di extends C{render(){return _`
      <kiss-layout currentPath="/styling/kiss-ui">
        <div class="container">
          <h1>@kissjs/ui</h1>
          <p class="subtitle">
            KISS Architecture 的 UI 层 — 暗黑瑞士国际主义风格的 Web Components 组件库。
          </p>

          <h2>安装</h2>
          <code-block
            ><pre><code>// deno.json
{
  "imports": {
    "@kissjs/ui": "jsr:@kissjs/ui@^0.3.3"
  }
}</code></pre></code-block
          >

          <h2>可用组件</h2>
          <p>
            <span class="inline-code">@kissjs/ui</span> v0.3.3+ 提供以下 Web Components：
          </p>

          <div class="component-grid">
            <div class="component-card">
              <h4>kiss-button</h4>
              <p>按钮组件，支持 variants (default, primary, ghost) 和 sizes (sm, md, lg)</p>
            </div>
            <div class="component-card">
              <h4>kiss-card</h4>
              <p>卡片组件，支持 header/footer slots 和 variants (default, elevated, borderless)</p>
            </div>
            <div class="component-card">
              <h4>kiss-input</h4>
              <p>输入组件，支持 label、error states 和 validation</p>
            </div>
            <div class="component-card">
              <h4>kiss-code-block</h4>
              <p>代码块组件，带复制按钮和语法高亮</p>
            </div>
            <div class="component-card">
              <h4>kiss-layout</h4>
              <p>布局组件，包含 header、sidebar、footer 和移动端 hamburger 菜单</p>
            </div>
          </div>

          <h2>使用示例</h2>
          <code-block
            ><pre><code>// app/routes/index.ts
import { html, LitElement } from '@kissjs/core';
import '@kissjs/ui/kiss-button';
import '@kissjs/ui/kiss-card';

export class MyPage extends LitElement {
  override render() {
    return html\`
      &lt;kiss-button variant="primary"&gt;Click me&lt;/kiss-button&gt;
      &lt;kiss-card&gt;
        &lt;h3 slot="header"&gt;Title&lt;/h3&gt;
        &lt;p&gt;Card content&lt;/p&gt;
      &lt;/kiss-card&gt;
    \`;
  }
}</code></pre></code-block
          >

          <h2>设计令牌</h2>
          <p>
            组件使用 CSS 自定义属性作为设计令牌，可通过
            <span class="inline-code">@kissjs/ui/design-tokens</span> 导入：
          </p>
          <code-block
            ><pre><code>import '@kissjs/ui/design-tokens';

// 可用的 CSS 自定义属性：
// --kiss-bg-base, --kiss-text-primary, --kiss-border-base
// --kiss-spacing-sm, --kiss-spacing-md, --kiss-spacing-lg
// --kiss-font-sans, --kiss-font-mono
// --kiss-radius-sm, --kiss-radius-md</code></pre></code-block
          >

          <h2>设计原则</h2>
          <p>@kissjs/ui 遵循 KISS Architecture 四约束：</p>
          <ul>
            <li>
              <strong>Web Standards First</strong> — 组件是标准 Web Components（Lit），非框架私有抽象
            </li>
            <li>
              <strong>Minimal Augmentation</strong> — UI 层是可选的，不用 @kissjs/ui 也能写 KISS 应用
            </li>
            <li><strong>No Framework Binding</strong> — 组件可在任何 Web Components 环境使用</li>
            <li><strong>No Runtime Binding</strong> — 纯 ESM 输出，无平台依赖</li>
            <li><strong>Static (S)</strong> — 所有组件输出 DSD，内容在 JS 加载前可见</li>
          </ul>

          <h2>SSR 兼容性</h2>
          <p>
            所有组件使用 <span class="inline-code">static properties</span> 而非
            <span class="inline-code">@property</span> 装饰器，确保 Vite SSR 兼容。详见
            <a href="/guide/ssg#ssr-compatibility" style="color: var(--kiss-accent);">SSG 文档</a>。
          </p>

          <div class="callout warn">
            <p>
              <strong>历史说明</strong> — v0.1.0-0.1.3 是 WebAwesome CDN loader。v0.1.4+
              开始自有 Web Components 组件库（当前 v0.3.3）。如需 WebAwesome，改用
              <span class="inline-code">inject</span> 选项手动注入 CDN。
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/deployment" class="nav-link">&larr; Deployment</a>
            <a href="/styling/web-awesome" class="nav-link">Web Awesome &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};di.styles=[F,w`
      .callout {
        padding: 1rem 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .callout.warn {
        border-left-color: var(--kiss-text-muted);
      }
      .component-grid {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;
      }
      .component-card {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
      }
      .component-card h4 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }
      .component-card p {
        margin: 0;
        color: var(--kiss-text-muted);
        font-size: 0.875rem;
      }
    `];let aa=di;customElements.define("page-kiss-ui",aa);const gr="page-kiss-ui",hi=class hi extends C{render(){return _`
      <kiss-layout currentPath="/styling/web-awesome">
        <div class="container">
          <h1>Web Awesome 组件</h1>
          <p class="subtitle">通过 CDN 使用 50+ UI 组件。无需导入。</p>

          <h2>工作原理</h2>
          <p>
            在 <span class="inline-code">kiss()</span> 配置中设置 <span class="inline-code">inject</span> 选项，
            将 Web Awesome 的 CSS 和 loader 注入到 <span class="inline-code">&lt;head&gt;</span>。
            所有 <span class="inline-code">&lt;wa-*&gt;</span> 自定义元素全局可用——无需逐组件导入。
          </p>

          <div class="demo-box">
            <h3>按钮</h3>
            <div class="component-row">
              <wa-button variant="brand">品牌</wa-button>
              <wa-button variant="success">成功</wa-button>
              <wa-button variant="danger">危险</wa-button>
              <wa-button variant="default">默认</wa-button>
            </div>
            <code-block>
              <pre><code>&lt;wa-button variant="brand"&gt;品牌&lt;/wa-button&gt;
&lt;wa-button variant="danger"&gt;危险&lt;/wa-button&gt;</code></pre>
            </code-block>
          </div>

          <div class="demo-box">
            <h3>卡片</h3>
            <wa-card>
              <h2 slot="header">卡片标题</h2>
              <p>带 header 和 footer slots 的 Web Awesome 卡片组件。</p>
              <wa-button slot="footer" variant="brand">操作</wa-button>
            </wa-card>
            <code-block>
              <pre><code>&lt;wa-card&gt;
  &lt;h2 slot="header"&gt;标题&lt;/h2&gt;
  &lt;p&gt;内容&lt;/p&gt;
  &lt;wa-button slot="footer" variant="brand"&gt;操作&lt;/wa-button&gt;
&lt;/wa-card&gt;</code></pre>
            </code-block>
          </div>

          <div class="demo-box">
            <h3>徽章</h3>
            <div class="component-row">
              <wa-badge variant="primary">主要</wa-badge>
              <wa-badge variant="success">成功</wa-badge>
              <wa-badge variant="danger">危险</wa-badge>
              <wa-badge variant="warning">警告</wa-badge>
            </div>
            <code-block>
              <pre><code>&lt;wa-badge variant="primary"&gt;主要&lt;/wa-badge&gt;
&lt;wa-badge variant="danger"&gt;危险&lt;/wa-badge&gt;</code></pre>
            </code-block>
          </div>

          <h2>配置</h2>
          <p>通过 <span class="inline-code">inject</span> 选项启用 Web Awesome（推荐）：</p>
          <code-block>
            <pre><code>// vite.config.ts
import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kiss({
      inject: {
        stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
        scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
      },
    }),
  ]
})</code></pre>
          </code-block>

          <h2>从 <span class="inline-code">ui</span> 选项迁移</h2>
          <p>
            旧的 <span class="inline-code">ui: { cdn: true }</span> 快捷方式仍然可用，但已弃用。迁移方法：
          </p>
          <code-block>
            <pre><code>// 之前（已弃用）
kiss({ ui: { cdn: true } })

// 之后（推荐）
kiss({
  inject: {
    stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
    scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
  },
})</code></pre>
          </code-block>
          <p>
            <span class="inline-code">inject</span> 选项更灵活——适用于任何 CDN、任何版本、任何外部资源。
          </p>

          <div class="nav-row">
            <a href="/ui" class="nav-link">&larr; @kissjs/ui</a>
            <a href="https://webawesome.com/docs" class="nav-link">Web Awesome 文档 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};hi.styles=[F,w`
      .demo-box {
        padding: 1.25rem;
        border: 1px solid var(--kiss-border);
        border-radius: 3px;
        margin: 0.75rem 0 1.5rem;
      }
      .demo-box .component-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }
    `];let ra=hi;customElements.define("page-web-awesome",ra);const kr="page-web-awesome",v0="kiss-input",ga=class extends C{constructor(){super(...arguments),this.type="text",this.disabled=!1,this.required=!1}connectedCallback(){super.connectedCallback(),this._internals=this.attachInternals(),this._internals.setFormValue(this.value??"")}formResetCallback(){var t;this.value="",this.error=void 0,(t=this._internals)==null||t.setFormValue("")}formDisabledCallback(t){this.disabled=t}render(){const t=this.error?"input-error":void 0;return _`
      <div class="input-wrapper">
        ${this.label?_`
            <label for="input">${this.label}${this.required?" *":""}</label>
          `:""}
        <input
          id="input"
          class="input ${this.error?"input--error":""}"
          type="${this.type}"
          placeholder="${this.placeholder}"
          .value="${this.value??""}"
          name="${this.name}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          aria-invalid="${this.error?"true":D}"
          aria-describedby="${t||D}"
          aria-errormessage="${t||D}"
          @input="${s=>this._handleInput(s)}"
        />
        ${this.error?_`
            <small id="input-error" role="alert" class="error-message">${this.error}</small>
          `:""}
      </div>
    `}_handleInput(t){var s;const r=t.target;this.value=r.value,(s=this._internals)==null||s.setFormValue(r.value),this.dispatchEvent(new CustomEvent("kiss-input",{detail:{value:r.value},bubbles:!0,composed:!1}))}};ga.formAssociated=!0;ga.styles=[Tt,w`
      :host {
        display: block;
      }

      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--kiss-size-2);
      }

      label {
        font-size: var(--kiss-font-size-sm);
        font-weight: var(--kiss-font-weight-medium);
        color: var(--kiss-text-tertiary);
        letter-spacing: var(--kiss-letter-spacing-wide);
      }

      .input {
        width: 100%;
        padding: var(--kiss-size-2) var(--kiss-size-3);
        font-family: var(--kiss-font-sans);
        font-size: var(--kiss-font-size-md);
        color: var(--kiss-text-primary);
        background: var(--kiss-bg-base);
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        transition:
          border-color var(--kiss-transition-normal),
          box-shadow var(--kiss-transition-normal);
        outline: none;
      }

      .input::placeholder {
        color: var(--kiss-text-muted);
      }

      .input:hover {
        border-color: var(--kiss-border-hover);
      }

      .input:focus {
        border-color: var(--kiss-accent);
        box-shadow: 0 0 0 1px var(--kiss-accent);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--kiss-bg-surface);
      }

      .input--error {
        border-color: var(--kiss-error, #e55);
      }

      .error-message {
        font-size: var(--kiss-font-size-xs);
        color: var(--kiss-error, #e55);
      }
    `];ga.properties={type:{type:String},placeholder:{type:String},label:{type:String},value:{type:String},name:{type:String},disabled:{type:Boolean,reflect:!0},required:{type:Boolean},error:{type:String}};let y0=ga;customElements.define(v0,y0);const S0="kiss-code-block",Mr=class extends C{constructor(){super(...arguments),this._copyState="idle"}disconnectedCallback(){super.disconnectedCallback(),this._copyTimer!==void 0&&(clearTimeout(this._copyTimer),this._copyTimer=void 0)}render(){return _`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState==="copied"?"copied":""} ${this._copyState==="failed"?"failed":""}"
        @click="${()=>this._copy()}"
      >
        ${this._copyState==="copied"?"✓ Copied!":this._copyState==="failed"?"✗ Failed":"Copy"}
      </button>
    `}async _copy(){try{const t=this.textContent||"";await navigator.clipboard.writeText(t),this._copyState="copied",this._copyTimer=setTimeout(()=>{this._copyState="idle",this._copyTimer=void 0},2e3)}catch{this._copyState="failed",this._copyTimer=setTimeout(()=>{this._copyState="idle",this._copyTimer=void 0},2e3)}}};Mr.styles=[Tt,w`
      :host {
        display: block;
        position: relative;
      }

      ::slotted(pre) {
        margin: 0;
        padding: var(--kiss-size-5);
        background: var(--kiss-code-bg);
        border: 1px solid var(--kiss-code-border);
        border-radius: var(--kiss-radius-sm);
        overflow-x: auto;
        font-family: var(--kiss-font-mono);
        font-size: var(--kiss-font-size-sm);
        line-height: var(--kiss-line-height-normal);
        color: var(--kiss-text-secondary);
        scrollbar-width: thin;
        scrollbar-color: var(--kiss-border) transparent;
      }

      .copy-btn {
        position: absolute;
        top: var(--kiss-size-2);
        right: var(--kiss-size-2);
        background: var(--kiss-bg-elevated);
        color: var(--kiss-text-muted);
        border: 1px solid var(--kiss-border);
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-xs);
        font-family: var(--kiss-font-sans);
        cursor: pointer;
        border-radius: var(--kiss-radius-sm);
        transition: color var(--kiss-transition-normal), border-color var(--kiss-transition-normal);
        z-index: 1;
      }

      .copy-btn:hover {
        color: var(--kiss-text-secondary);
        border-color: var(--kiss-border-hover);
      }

      .copy-btn.copied {
        color: var(--kiss-text-primary);
        border-color: var(--kiss-border-hover);
      }

      .copy-btn.failed {
        color: var(--kiss-error, #e55);
        border-color: var(--kiss-error, #e55);
      }
    `];Mr.properties={_copyState:{state:!0}};let _0=Mr;customElements.define(S0,_0);const mi=class mi extends C{render(){return _`
      <kiss-layout current-path="/ui">
        <div class="container">
          <h1>设计系统</h1>
          <p class="subtitle">
            <strong>双色板。零噪音。</strong><br>
            深色和浅色。没有别的。
          </p>

          <!-- Palettes -->
          <div class="section">
            <div class="section-title">色板</div>
            <div class="palette-row">
              <div class="palette-card palette-dark">
                <div class="palette-name">深色</div>
                <div class="swatch-grid">
                  <div class="swatch-item">
                    <div class="swatch" style="background:#000"></div>
                    <div class="swatch-label">基底</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#0a0a0a"></div>
                    <div class="swatch-label">表面</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fff"></div>
                    <div class="swatch-label">主色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#999"></div>
                    <div class="swatch-label">次色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#666"></div>
                    <div class="swatch-label">第三色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#444"></div>
                    <div class="swatch-label">静默</div>
                  </div>
                </div>
                <p class="palette-desc">
                  <strong>黑色</strong> 基底。白色强调。灰色分层。
                </p>
              </div>
              <div class="palette-card palette-light">
                <div class="palette-name">浅色</div>
                <div class="swatch-grid">
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fff"></div>
                    <div class="swatch-label">基底</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fafafa"></div>
                    <div class="swatch-label">表面</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#000"></div>
                    <div class="swatch-label">主色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#555"></div>
                    <div class="swatch-label">次色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#888"></div>
                    <div class="swatch-label">第三色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#aaa"></div>
                    <div class="swatch-label">静默</div>
                  </div>
                </div>
                <p class="palette-desc">
                  <strong>白色</strong> 基底。黑色强调。灰色分层。
                </p>
              </div>
            </div>
          </div>

          <!-- Typography -->
          <div class="section">
            <div class="section-title">字体排版</div>
            <div class="type-scale">
              <div class="type-row">
                <span class="type-label">展示</span>
                <span class="type-sample" style="font-size:2.5rem;font-weight:900;letter-spacing:-0.04em"
                  >KISS UI</span>
              </div>
              <div class="type-row">
                <span class="type-label">H1</span>
                <span class="type-sample" style="font-size:1.75rem;font-weight:800;letter-spacing:-0.03em"
                  >一级标题</span>
              </div>
              <div class="type-row">
                <span class="type-label">H2</span>
                <span class="type-sample" style="font-size:1.125rem;font-weight:600">二级标题</span>
              </div>
              <div class="type-row">
                <span class="type-label">正文</span>
                <span class="type-sample" style="font-size:0.9375rem;color:var(--kiss-text-secondary)"
                  >正文段落示例。</span>
              </div>
              <div class="type-row">
                <span class="type-label">说明</span>
                <span
                  class="type-sample"
                  style="font-size:0.6875rem;color:var(--kiss-text-tertiary);text-transform:uppercase;letter-spacing:0.08em;font-weight:600"
                  >说明文字</span>
              </div>
              <div class="type-row">
                <span class="type-label">等宽</span>
                <span
                  class="type-sample"
                  style="font-size:0.8125rem;font-family:'SF Mono','Fira Code','Consolas',monospace;color:var(--kiss-text-primary)"
                  >deno add jsr:@kissjs/ui</span>
              </div>
            </div>
          </div>

          <!-- Buttons (Dogfooding kiss-button) -->
          <div class="section">
            <div class="section-title">按钮</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">变体</span>
                <span class="preview-badge">可用</span>
              </div>
              <div class="preview-body">
                <kiss-button variant="primary">主要按钮</kiss-button>
                <kiss-button>默认按钮</kiss-button>
                <kiss-button variant="ghost">幽灵按钮</kiss-button>
              </div>
              <div class="preview-body" style="border-top:1px solid var(--kiss-border)">
                <kiss-button variant="primary" size="sm">小号</kiss-button>
                <kiss-button variant="primary" size="md">中号</kiss-button>
                <kiss-button variant="primary" size="lg">大号</kiss-button>
              </div>
              <div class="preview-body" style="border-top:1px solid var(--kiss-border)">
                <kiss-button disabled>禁用状态</kiss-button>
                <kiss-button href="/" target="_blank">链接按钮</kiss-button>
              </div>
            </div>
          </div>

          <!-- Cards (Dogfooding kiss-card) -->
          <div class="section">
            <div class="section-title">卡片</div>
            <div class="cards-grid">
              <kiss-card>
                <h3 slot="header">Island</h3>
                <p>带 hydration 的交互式组件和 Shadow DOM。</p>
                <div slot="footer">
                  <kiss-button size="sm">使用</kiss-button>
                </div>
              </kiss-card>
              <kiss-card>
                <h3 slot="header">静态</h3>
                <p>通过 DSD 零 JS 渲染。JS 加载前可见。</p>
                <div slot="footer">
                  <kiss-button size="sm">使用</kiss-button>
                </div>
              </kiss-card>
              <kiss-card variant="elevated">
                <h3 slot="header">API Route</h3>
                <p>带 Hono RPC 的 Serverless 函数。类型安全。</p>
                <div slot="footer">
                  <kiss-button size="sm">使用</kiss-button>
                </div>
              </kiss-card>
            </div>
          </div>

          <!-- Input (Dogfooding kiss-input) -->
          <div class="section">
            <div class="section-title">输入框</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">文本输入</span>
                <span class="preview-badge">可用</span>
              </div>
              <div class="preview-body" style="flex-direction:column;gap:0.75rem">
                <kiss-input placeholder="输入邮箱..." label="邮箱"></kiss-input>
                <kiss-input type="password" placeholder="密码" label="密码" required></kiss-input>
                <kiss-input value="hello@kissjs.org" label="只读" disabled></kiss-input>
              </div>
            </div>
          </div>

          <!-- Code Block (Dogfooding kiss-code-block) -->
          <div class="section">
            <div class="section-title">代码块</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">带复制按钮</span>
                <span class="preview-badge">可用</span>
              </div>
              <div class="preview-body">
                <kiss-code-block>
                  <pre><code>import '@kissjs/ui';

// 使用组件
&lt;kiss-button variant="primary"&gt;点我&lt;/kiss-button&gt;
&lt;kiss-card&gt;
  &lt;h3 slot="header"&gt;标题&lt;/h3&gt;
  &lt;p&gt;卡片内容&lt;/p&gt;
&lt;/kiss-card&gt;</code></pre>
                </kiss-code-block>
              </div>
            </div>
          </div>

          <!-- Install -->
          <div class="install-section">
            <h3>安装 @kissjs/ui</h3>
            <div class="install-cmd">
              <span class="prompt">$</span> deno add jsr:@kissjs/ui
            </div>
            <p>Deno、Node、Bun。零配置。</p>
          </div>

          <div class="nav-row">
            <a href="/guide/deployment" class="nav-link">&larr; 部署</a>
            <a href="/styling/kiss-ui" class="nav-link">Kiss UI 文档 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `}};mi.styles=[F,w`
      :host {
        display: block;
      }

      /* ─── Section ─── */
      .section {
        margin-bottom: 3.5rem;
      }

      .section-title {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--kiss-border);
      }

      /* ─── Palettes ─── */
      .palette-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--kiss-border);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        overflow: hidden;
      }

      .palette-card {
        padding: 1.5rem;
      }

      .palette-dark {
        background: var(--kiss-bg-base);
      }

      .palette-light {
        background: #fff;
      }

      .palette-name {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 1rem;
      }

      .palette-dark .palette-name {
        color: var(--kiss-text-muted);
      }

      .palette-light .palette-name {
        color: var(--kiss-text-secondary);
      }

      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .swatch-item {
        text-align: center;
      }

      .swatch {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 4px;
        margin-bottom: 0.375rem;
      }

      .palette-dark .swatch {
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .palette-light .swatch {
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      .swatch-label {
        font-size: 0.5625rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .palette-dark .swatch-label {
        color: var(--kiss-text-muted);
      }

      .palette-light .swatch-label {
        color: var(--kiss-text-secondary);
      }

      .palette-desc {
        font-size: 0.75rem;
        line-height: 1.6;
      }

      .palette-dark .palette-desc {
        color: var(--kiss-text-tertiary);
      }

      .palette-dark .palette-desc strong {
        color: var(--kiss-text-primary);
      }

      .palette-light .palette-desc {
        color: var(--kiss-text-secondary);
      }

      .palette-light .palette-desc strong {
        color: var(--kiss-text-primary);
      }

      /* ─── Typography ─── */
      .type-scale {
        display: flex;
        flex-direction: column;
      }

      .type-row {
        display: flex;
        align-items: baseline;
        gap: 1.5rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--kiss-border);
      }

      .type-row:last-child {
        border-bottom: none;
      }

      .type-label {
        min-width: 72px;
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--kiss-text-muted);
      }

      .type-sample {
        color: var(--kiss-text-primary);
      }

      /* ─── Component Preview ─── */
      .preview-card {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        overflow: hidden;
      }

      .preview-header {
        padding: 0.875rem 1.25rem;
        border-bottom: 1px solid var(--kiss-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .preview-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--kiss-text-primary);
      }

      .preview-badge {
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        background: var(--kiss-accent-subtle);
        color: var(--kiss-text-secondary);
        border: 1px solid var(--kiss-border);
      }

      .preview-body {
        padding: 1.25rem;
        display: flex;
        gap: 0.625rem;
        flex-wrap: wrap;
        align-items: flex-start;
      }

      /* ─── Cards Grid ─── */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      /* ─── Install ─── */
      .install-section {
        margin-top: 3.5rem;
        padding: 2rem;
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 6px;
        text-align: center;
      }

      .install-section h3 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--kiss-text-primary);
        margin: 0 0 1rem;
      }

      .install-cmd {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 1.25rem;
        background: var(--kiss-bg-elevated);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        color: var(--kiss-text-primary);
      }

      .install-cmd .prompt {
        color: var(--kiss-text-muted);
      }

      .install-section p {
        font-size: 0.8125rem;
        color: var(--kiss-text-tertiary);
        margin: 0.75rem 0 0;
      }

      /* ─── Mobile ─── */
      @media (max-width: 900px) {
        .section {
          margin-bottom: 2.5rem;
        }

        .type-row {
          gap: 1rem;
        }

        .preview-body {
          padding: 1rem;
        }

        .install-section {
          padding: 1.5rem 1rem;
        }
      }

      @media (max-width: 640px) {
        .palette-row {
          grid-template-columns: 1fr;
        }

        .swatch-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .install-cmd {
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
        }
      }
    `];let ia=mi;customElements.define("ui-showcase",ia);const Er="ui-showcase",ee={wrap(e,t){return e}},x0="api-consumer",da=class da extends C{constructor(){super(...arguments),this.apiUrl="",this.apiData=null,this.apiLoading=!1,this.apiError="",this.name="",this.helloMsg="",this.helloLoading=!1,this.helloError=""}get _base(){return this.apiUrl||"https://kiss-demo-api.sisyphuszheng.deno.net"}connectedCallback(){super.connectedCallback(),this._fetchStatus()}async _fetchStatus(){this.apiLoading=!0,this.apiError="";try{const t=await fetch(`${this._base}/api`);if(!t.ok)throw new Error(`HTTP ${t.status}`);this.apiData=await t.json()}catch(t){this.apiError=String(t),this.apiData=null}finally{this.apiLoading=!1}}async _sayHello(){const t=this.name.trim();if(t){this.helloLoading=!0,this.helloError="",this.helloMsg="";try{const s=await fetch(`${this._base}/api/hello/${encodeURIComponent(t)}`);if(!s.ok)throw new Error(`HTTP ${s.status}`);const r=await s.json();this.helloMsg=r.message}catch(s){this.helloError=String(s)}finally{this.helloLoading=!1}}}_onInput(t){this.name=t.target.value}_onKey(t){t.key==="Enter"&&this._sayHello()}render(){return _`
      <div class="card">
        <h3>Server Status</h3>
        <div class="status-row">
          <span class="status-dot ${this.apiLoading?"loading":this.apiError?"error":"connected"}"></span>
          ${this.apiLoading?"Contacting server...":this.apiError?"Connection failed":"API online"}
        </div>
        ${this.apiData?_`
          <div class="data-grid">
            <span class="key">framework</span><span class="val">${this.apiData.framework}</span>
            <span class="key">version</span><span class="val">${this.apiData.version}</span>
            <span class="key">jamstack</span><span class="val">${String(this.apiData.jamstack)}</span>
            <span class="key">serverless</span><span class="val">${String(this.apiData.serverless)}</span>
          </div>
        `:""}
        ${this.apiLoading?_`<div class="pre-box">Loading...</div>`:""}
        ${this.apiData?_`<div class="pre-box">${JSON.stringify(this.apiData,null,2)}</div>`:""}
        ${this.apiError?_`<div class="pre-box" style="color:var(--kiss-error)">${this.apiError}</div>`:""}
        <button class="btn" @click=${this._fetchStatus} ?disabled=${this.apiLoading}>⟳ Refresh</button>

        <hr class="divider" />

        <h3>Say Hello</h3>
        <p style="font-size:0.8125rem;color:var(--kiss-text-tertiary);margin:0 0 0.75rem;line-height:1.6">
          Type your name and the serverless API will greet you back.
          Calls <code style="font-size:0.75rem">GET /api/hello/:name</code> on Deno Deploy.
        </p>
        <div class="form-row">
          <input type="text" placeholder="Enter your name..." .value=${this.name}
            @input=${this._onInput} @keydown=${this._onKey} />
          <button class="btn primary" @click=${this._sayHello}
            ?disabled=${this.helloLoading||!this.name.trim()}>
            ${this.helloLoading?"Sending...":"Say Hello →"}
          </button>
        </div>
        ${this.helloMsg?_`<div class="greeting">${this.helloMsg}</div>`:""}
        ${this.helloError?_`<div class="err-msg">${this.helloError}</div>`:""}
      </div>
    `}};da.styles=w`
    :host { display: block; }

    .card {
      border: 1px solid var(--kiss-border);
      border-radius: 8px;
      padding: 1.25rem;
      background: var(--kiss-bg-surface);
    }
    .card h3 {
      font-size: 0.875rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
      color: var(--kiss-text-primary);
      letter-spacing: -0.01em;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--kiss-text-tertiary);
      margin-bottom: 0.75rem;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-dot.loading { background: var(--kiss-accent-dim); }
    .status-dot.connected { background: #22c55e; }
    .status-dot.error { background: var(--kiss-error); }

    .data-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.25rem 0.75rem;
      font-size: 0.8125rem;
      margin-bottom: 0.75rem;
    }
    .data-grid .key {
      color: var(--kiss-text-tertiary);
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.75rem;
    }
    .data-grid .val {
      color: var(--kiss-text-primary);
      font-weight: 500;
    }

    .pre-box {
      background: var(--kiss-code-bg);
      border: 1px solid var(--kiss-code-border);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      color: var(--kiss-text-secondary);
      overflow-x: auto;
      margin: 0.75rem 0;
      line-height: 1.6;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      background: var(--kiss-bg-card);
      color: var(--kiss-text-secondary);
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover {
      border-color: var(--kiss-border-hover);
      color: var(--kiss-text-primary);
      background: var(--kiss-bg-hover);
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .btn.primary {
      background: var(--kiss-accent);
      color: var(--kiss-bg-base);
      border-color: var(--kiss-accent);
    }
    .btn.primary:hover { opacity: 0.85; }
    .btn.primary:disabled {
      opacity: 0.25;
      background: var(--kiss-text-muted);
      border-color: transparent;
    }

    .divider {
      border: none;
      border-top: 1px solid var(--kiss-border);
      margin: 1.25rem 0;
    }

    .form-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin: 0.75rem 0;
    }
    .form-row input {
      flex: 1;
      padding: 0.45rem 0.7rem;
      border: 1px solid var(--kiss-border);
      border-radius: 6px;
      background: var(--kiss-bg-card);
      color: var(--kiss-text-primary);
      font-size: 0.8125rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-row input:focus {
      border-color: var(--kiss-border-hover);
    }
    .form-row input::placeholder {
      color: var(--kiss-text-muted);
    }

    .greeting {
      margin-top: 0.5rem;
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.9375rem;
      font-weight: 500;
      background: color-mix(in srgb, var(--kiss-accent) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--kiss-accent) 15%, transparent);
      color: var(--kiss-text-primary);
      animation: fadeSlide 0.25s ease;
    }
    .err-msg {
      margin-top: 0.5rem;
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      background: color-mix(in srgb, var(--kiss-error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--kiss-error) 20%, transparent);
      color: var(--kiss-error);
      animation: fadeSlide 0.25s ease;
    }

    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,da.properties={apiUrl:{type:String},apiData:{type:Object},apiLoading:{type:Boolean},apiError:{type:String},name:{type:String},helloMsg:{type:String},helloLoading:{type:Boolean},helloError:{type:String}};let na=da;customElements.define(x0,na);customElements.get(ja)||customElements.define(ja,Cs);customElements.get(za)||customElements.define(za,ws);customElements.get(Ka)||customElements.define(Ka,Ns);customElements.get(Ya)||customElements.define(Ya,Rs);customElements.get(Wa)||customElements.define(Wa,Ls);customElements.get(qa)||customElements.define(qa,Ds);customElements.get(Ga)||customElements.define(Ga,Va);customElements.get(Qa)||customElements.define(Qa,Ps);customElements.get(Xa)||customElements.define(Xa,Hs);customElements.get(Ja)||customElements.define(Ja,Bs);customElements.get(Za)||customElements.define(Za,Fs);customElements.get(er)||customElements.define(er,Us);customElements.get(tr)||customElements.define(tr,$s);customElements.get(sr)||customElements.define(sr,js);customElements.get(ar)||customElements.define(ar,zs);customElements.get(rr)||customElements.define(rr,Ks);customElements.get(ir)||customElements.define(ir,Ys);customElements.get(nr)||customElements.define(nr,Ws);customElements.get(or)||customElements.define(or,qs);customElements.get(cr)||customElements.define(cr,Gs);customElements.get(ur)||customElements.define(ur,Vs);customElements.get(lr)||customElements.define(lr,Qs);customElements.get(dr)||customElements.define(dr,Xs);customElements.get(hr)||customElements.define(hr,Js);customElements.get(mr)||customElements.define(mr,Zs);customElements.get(pr)||customElements.define(pr,ea);customElements.get(fr)||customElements.define(fr,ta);customElements.get(br)||customElements.define(br,sa);customElements.get(gr)||customElements.define(gr,aa);customElements.get(kr)||customElements.define(kr,ra);customElements.get(Er)||customElements.define(Er,ia);customElements.get("api-consumer")||customElements.define("api-consumer",na);customElements.get("code-block")||customElements.define("code-block",Os);customElements.get("counter-island")||customElements.define("counter-island",Ms);customElements.get("kiss-theme-toggle")||customElements.define("kiss-theme-toggle",void 0);customElements.get("kiss-button")||customElements.define("kiss-button",void 0);customElements.get("kiss-input")||customElements.define("kiss-input",void 0);customElements.get("kiss-code-block")||customElements.define("kiss-code-block",void 0);customElements.get("kiss-layout")||customElements.define("kiss-layout",void 0);async function H(e){if(!e||!e.includes("-"))throw new Error("[KISS] Invalid custom element tag: "+String(e)+". Must contain a hyphen.");const t=_`${$d(`<${e} defer-hydration></${e}>`)}`,s=Ud(t);return await fo(s)}const L=new tc;L.use("*",jd());L.use("*",Gd());L.use("*",Vd({origin:e=>{if(e&&/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(e))return e},allowMethods:["GET","POST","PUT","DELETE","PATCH"],allowHeaders:["Content-Type","Authorization"],credentials:!0,maxAge:86400}));L.use("*",Jd());L.get("/",async e=>{try{const r=await H(ja||"index");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/404",async e=>{try{const r=await H(za||"404");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/blog",async e=>{try{const r=await H(Ka||"blog-index");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/blog/kiss-compiler",async e=>{try{const r=await H(Ya||"blog-kiss-compiler");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/changelog",async e=>{try{const r=await H(Wa||"changelog");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/contributing",async e=>{try{const r=await H(qa||"contributing");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/demo",async e=>{try{const r=await H(Ga||"demo");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/examples",async e=>{try{const r=await H(Qa||"examples-index");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/examples/fullstack",async e=>{try{const r=await H(Xa||"examples-fullstack");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/examples/hello",async e=>{try{const r=await H(Ja||"examples-hello");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/examples/minimal-blog",async e=>{try{const r=await H(Za||"examples-minimal-blog");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/api-design",async e=>{try{let i=await H(er||"guide-api-design");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/api-routes",async e=>{try{let i=await H(tr||"guide-api-routes");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/architecture",async e=>{try{let i=await H(sr||"guide-architecture");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/blog-system",async e=>{try{let i=await H(ar||"guide-blog-system");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/configuration",async e=>{try{let i=await H(rr||"guide-configuration");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/deployment",async e=>{try{let i=await H(ir||"guide-deployment");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/design-philosophy",async e=>{try{let i=await H(nr||"guide-design-philosophy");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/error-handling",async e=>{try{let i=await H(or||"guide-error-handling");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/getting-started",async e=>{try{let i=await H(cr||"guide-getting-started");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/islands",async e=>{try{let i=await H(ur||"guide-islands");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/kiss-compiler",async e=>{try{let i=await H(lr||"guide-kiss-compiler");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/pwa",async e=>{try{let i=await H(dr||"guide-pwa");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/routing",async e=>{try{let i=await H(hr||"guide-routing");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/security-middleware",async e=>{try{let i=await H(mr||"guide-security-middleware");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/ssg",async e=>{try{let i=await H(pr||"guide-ssg");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/guide/testing",async e=>{try{let i=await H(fr||"guide-testing");return i=ee.wrap(i,e),e.html(M(i,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/roadmap",async e=>{try{const r=await H(br||"roadmap");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/styling/kiss-ui",async e=>{try{const r=await H(gr||"styling-kiss-ui");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/styling/web-awesome",async e=>{try{const r=await H(kr||"styling-web-awesome");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});L.get("/ui",async e=>{try{const r=await H(Er||"ui");return e.html(M(r,{title:"KISS",lang:"en",headExtras:`<link rel="stylesheet" href="https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css" />
  <script type="module" src="https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js"><\/script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>:root,[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0, 0, 0, 0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-error:#c44;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255, 255, 255, 0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-error:#e55;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>
  <script src="/theme-init.js"><\/script>
  <script src="/mobile-sidebar.js"><\/script>
  <script src="/has-fallback.js"><\/script>`,cspNonce:e.get("cspNonce")}))}catch{return e.html("<h1>500 Internal Server Error</h1>",500)}});
