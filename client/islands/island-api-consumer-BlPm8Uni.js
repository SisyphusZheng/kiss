/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const O=globalThis,W=O.ShadowRoot&&(O.ShadyCSS===void 0||O.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,q=Symbol(),K=new WeakMap;let ot=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==q)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(W&&t===void 0){const s=e!==void 0&&e.length===1;s&&(t=K.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&K.set(e,t))}return t}toString(){return this.cssText}};const ft=r=>new ot(typeof r=="string"?r:r+"",void 0,q),mt=(r,...t)=>{const e=r.length===1?r[0]:t.reduce((s,i,n)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[n+1],r[0]);return new ot(e,r,q)},gt=(r,t)=>{if(W)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const s=document.createElement("style"),i=O.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},J=W?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return ft(e)})(r):r;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:_t,defineProperty:yt,getOwnPropertyDescriptor:vt,getOwnPropertyNames:bt,getOwnPropertySymbols:At,getPrototypeOf:Et}=Object,m=globalThis,Y=m.trustedTypes,St=Y?Y.emptyScript:"",z=m.reactiveElementPolyfillSupport,w=(r,t)=>r,V={toAttribute(r,t){switch(t){case Boolean:r=r?St:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},nt=(r,t)=>!_t(r,t),Z={attribute:!0,type:String,converter:V,reflect:!1,useDefault:!1,hasChanged:nt};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),m.litPropertyMetadata??(m.litPropertyMetadata=new WeakMap);let E=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Z){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&yt(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=vt(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:i,set(o){const l=i==null?void 0:i.call(this);n==null||n.call(this,o),this.requestUpdate(t,l,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Z}static _$Ei(){if(this.hasOwnProperty(w("elementProperties")))return;const t=Et(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(w("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(w("properties"))){const e=this.properties,s=[...bt(e),...At(e)];for(const i of s)this.createProperty(i,e[i])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[e,s]of this.elementProperties){const i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const i of s)e.unshift(J(i))}else t!==void 0&&e.push(J(t));return e}static _$Eu(t,e){const s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e;(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&((e=t.hostConnected)==null||e.call(t))}removeController(t){var e;(e=this._$EO)==null||e.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return gt(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(e=>{var s;return(s=e.hostConnected)==null?void 0:s.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(e=>{var s;return(s=e.hostDisconnected)==null?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){var n;const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){const o=(((n=s.converter)==null?void 0:n.toAttribute)!==void 0?s.converter:V).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){var n,o;const s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const l=s.getPropertyOptions(i),a=typeof l.converter=="function"?{fromAttribute:l.converter}:((n=l.converter)==null?void 0:n.fromAttribute)!==void 0?l.converter:V;this._$Em=i;const c=a.fromAttribute(e,l.type);this[i]=c??((o=this._$Ej)==null?void 0:o.get(i))??c,this._$Em=null}}requestUpdate(t,e,s,i=!1,n){var o;if(t!==void 0){const l=this.constructor;if(i===!1&&(n=this[t]),s??(s=l.getPropertyOptions(t)),!((s.hasChanged??nt)(n,e)||s.useDefault&&s.reflect&&n===((o=this._$Ej)==null?void 0:o.get(t))&&!this.hasAttribute(l._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},o){s&&!(this._$Ej??(this._$Ej=new Map)).has(t)&&(this._$Ej.set(t,o??e??this[t]),n!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??(this._$Eq=new Set)).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[n,o]of this._$Ep)this[n]=o;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[n,o]of i){const{wrapped:l}=o,a=this[n];l!==!0||this._$AL.has(n)||a===void 0||this.C(n,void 0,o,a)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(s=this._$EO)==null||s.forEach(i=>{var n;return(n=i.hostUpdate)==null?void 0:n.call(i)}),this.update(e)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$EO)==null||e.forEach(s=>{var i;return(i=s.hostUpdated)==null?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(e=>this._$ET(e,this[e]))),this._$EM()}updated(t){}firstUpdated(t){}};E.elementStyles=[],E.shadowRootOptions={mode:"open"},E[w("elementProperties")]=new Map,E[w("finalized")]=new Map,z==null||z({ReactiveElement:E}),(m.reactiveElementVersions??(m.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const C=globalThis,G=r=>r,N=C.trustedTypes,Q=N?N.createPolicy("lit-html",{createHTML:r=>r}):void 0,at="$lit$",f=`lit$${Math.random().toFixed(9).slice(2)}$`,lt="?"+f,kt=`<${lt}>`,b=document,T=()=>b.createComment(""),U=r=>r===null||typeof r!="object"&&typeof r!="function",F=Array.isArray,ht=r=>F(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",j=`[ 	
\f\r]`,x=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,X=/-->/g,tt=/>/g,g=RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),et=/'/g,st=/"/g,ct=/^(?:script|style|textarea|title)$/i,xt=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),_=xt(1),S=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),it=new WeakMap,y=b.createTreeWalker(b,129);function dt(r,t){if(!F(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Q!==void 0?Q.createHTML(t):t}const wt=(r,t)=>{const e=r.length-1,s=[];let i,n=t===2?"<svg>":t===3?"<math>":"",o=x;for(let l=0;l<e;l++){const a=r[l];let c,p,h=-1,u=0;for(;u<a.length&&(o.lastIndex=u,p=o.exec(a),p!==null);)u=o.lastIndex,o===x?p[1]==="!--"?o=X:p[1]!==void 0?o=tt:p[2]!==void 0?(ct.test(p[2])&&(i=RegExp("</"+p[2],"g")),o=g):p[3]!==void 0&&(o=g):o===g?p[0]===">"?(o=i??x,h=-1):p[1]===void 0?h=-2:(h=o.lastIndex-p[2].length,c=p[1],o=p[3]===void 0?g:p[3]==='"'?st:et):o===st||o===et?o=g:o===X||o===tt?o=x:(o=g,i=void 0);const $=o===g&&r[l+1].startsWith("/>")?" ":"";n+=o===x?a+kt:h>=0?(s.push(c),a.slice(0,h)+at+a.slice(h)+f+$):a+f+(h===-2?l:$)}return[dt(r,n+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class M{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,o=0;const l=t.length-1,a=this.parts,[c,p]=wt(t,e);if(this.el=M.createElement(c,s),y.currentNode=this.el.content,e===2||e===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(i=y.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const h of i.getAttributeNames())if(h.endsWith(at)){const u=p[o++],$=i.getAttribute(h).split(f),H=/([.?@])?(.*)/.exec(u);a.push({type:1,index:n,name:H[2],strings:$,ctor:H[1]==="."?Ct:H[1]==="?"?Pt:H[1]==="@"?Tt:D}),i.removeAttribute(h)}else h.startsWith(f)&&(a.push({type:6,index:n}),i.removeAttribute(h));if(ct.test(i.tagName)){const h=i.textContent.split(f),u=h.length-1;if(u>0){i.textContent=N?N.emptyScript:"";for(let $=0;$<u;$++)i.append(h[$],T()),y.nextNode(),a.push({type:2,index:++n});i.append(h[u],T())}}}else if(i.nodeType===8)if(i.data===lt)a.push({type:2,index:n});else{let h=-1;for(;(h=i.data.indexOf(f,h+1))!==-1;)a.push({type:7,index:n}),h+=f.length-1}n++}}static createElement(t,e){const s=b.createElement("template");return s.innerHTML=t,s}}function A(r,t,e=r,s){var o,l;if(t===S)return t;let i=s!==void 0?(o=e._$Co)==null?void 0:o[s]:e._$Cl;const n=U(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==n&&((l=i==null?void 0:i._$AO)==null||l.call(i,!1),n===void 0?i=void 0:(i=new n(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??(e._$Co=[]))[s]=i:e._$Cl=i),i!==void 0&&(t=A(r,i._$AS(r,t.values),i,s)),t}class pt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=((t==null?void 0:t.creationScope)??b).importNode(e,!0);y.currentNode=i;let n=y.nextNode(),o=0,l=0,a=s[0];for(;a!==void 0;){if(o===a.index){let c;a.type===2?c=new k(n,n.nextSibling,this,t):a.type===1?c=new a.ctor(n,a.name,a.strings,this,t):a.type===6&&(c=new ut(n,this,t)),this._$AV.push(c),a=s[++l]}o!==(a==null?void 0:a.index)&&(n=y.nextNode(),o++)}return y.currentNode=b,i}p(t){let e=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class k{get _$AU(){var t;return((t=this._$AM)==null?void 0:t._$AU)??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=A(this,t,e),U(t)?t===d||t==null||t===""?(this._$AH!==d&&this._$AR(),this._$AH=d):t!==this._$AH&&t!==S&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):ht(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==d&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(b.createTextNode(t)),this._$AH=t}$(t){var n;const{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=M.createElement(dt(s.h,s.h[0]),this.options)),s);if(((n=this._$AH)==null?void 0:n._$AD)===i)this._$AH.p(e);else{const o=new pt(i,this),l=o.u(this.options);o.p(e),this.T(l),this._$AH=o}}_$AC(t){let e=it.get(t.strings);return e===void 0&&it.set(t.strings,e=new M(t)),e}k(t){F(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new k(this.O(T()),this.O(T()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,e);t!==this._$AB;){const i=G(t).nextSibling;G(t).remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}}class D{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(t,e=this,s,i){const n=this.strings;let o=!1;if(n===void 0)t=A(this,t,e,0),o=!U(t)||t!==this._$AH&&t!==S,o&&(this._$AH=t);else{const l=t;let a,c;for(t=n[0],a=0;a<n.length-1;a++)c=A(this,l[s+a],e,a),c===S&&(c=this._$AH[a]),o||(o=!U(c)||c!==this._$AH[a]),c===d?t=d:t!==d&&(t+=(c??"")+n[a+1]),this._$AH[a]=c}o&&!i&&this.j(t)}j(t){t===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Ct extends D{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===d?void 0:t}}class Pt extends D{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==d)}}class Tt extends D{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=A(this,t,e,0)??d)===S)return;const s=this._$AH,i=t===d&&s!==d||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==d&&(s===d||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e;typeof this._$AH=="function"?this._$AH.call(((e=this.options)==null?void 0:e.host)??this.element,t):this._$AH.handleEvent(t)}}class ut{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){A(this,t)}}const Ot={R:pt,D:ht,V:A,I:k,F:ut},I=C.litHtmlPolyfillSupport;I==null||I(M,k),(C.litHtmlVersions??(C.litHtmlVersions=[])).push("3.3.2");const Ut=(r,t,e)=>{const s=(e==null?void 0:e.renderBefore)??t;let i=s._$litPart$;if(i===void 0){const n=(e==null?void 0:e.renderBefore)??null;s._$litPart$=i=new k(t.insertBefore(T(),n),n,void 0,e??{})}return i._$AI(r),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const v=globalThis;class P extends E{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e;const t=super.createRenderRoot();return(e=this.renderOptions).renderBefore??(e.renderBefore=t.firstChild),t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Ut(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return S}}var rt;P._$litElement$=!0,P.finalized=!0,(rt=v.litElementHydrateSupport)==null||rt.call(v,{LitElement:P});const B=v.litElementPolyfillSupport;B==null||B({LitElement:P});(v.litElementVersions??(v.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Nt={ATTRIBUTE:1,PROPERTY:3,EVENT:5,ELEMENT:6};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Rt=r=>r===null||typeof r!="object"&&typeof r!="function",Lt=(r,t)=>(r==null?void 0:r._$litType$)!==void 0,Dt=r=>{var t;return((t=r==null?void 0:r._$litType$)==null?void 0:t.h)!=null},zt=r=>r.strings===void 0;new Set(".\\+*[^]$()");const $t="api-consumer",L=class L extends P{constructor(){super(...arguments),this.apiUrl="",this.apiData=null,this.apiLoading=!1,this.apiError="",this.name="",this.helloMsg="",this.helloLoading=!1,this.helloError=""}get _base(){return this.apiUrl||"https://kiss-demo-api.sisyphuszheng.deno.net"}connectedCallback(){super.connectedCallback(),this._fetchStatus()}async _fetchStatus(){this.apiLoading=!0,this.apiError="";try{const t=await fetch(`${this._base}/api`);if(!t.ok)throw new Error(`HTTP ${t.status}`);this.apiData=await t.json()}catch(t){this.apiError=String(t),this.apiData=null}finally{this.apiLoading=!1}}async _sayHello(){const t=this.name.trim();if(t){this.helloLoading=!0,this.helloError="",this.helloMsg="";try{const e=await fetch(`${this._base}/api/hello/${encodeURIComponent(t)}`);if(!e.ok)throw new Error(`HTTP ${e.status}`);const s=await e.json();this.helloMsg=s.message}catch(e){this.helloError=String(e)}finally{this.helloLoading=!1}}}_onInput(t){this.name=t.target.value}_onKey(t){t.key==="Enter"&&this._sayHello()}render(){return _`
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
    `}};L.styles=mt`
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
  `,L.properties={apiUrl:{type:String},apiData:{type:Object},apiLoading:{type:Boolean},apiError:{type:String},name:{type:String},helloMsg:{type:String},helloLoading:{type:Boolean},helloError:{type:String}};let R=L;customElements.define($t,R);const jt=Object.freeze(Object.defineProperty({__proto__:null,default:R,tagName:$t},Symbol.toStringTag,{value:"Module"}));export{d as A,Ut as D,S as E,mt as a,_ as b,ft as c,Dt as d,jt as e,P as i,Ot as j,Lt as l,Rt as n,zt as r,Nt as t};
