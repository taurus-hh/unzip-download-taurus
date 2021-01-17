import{EventEmitter as t}from"events";import{mkdir as e,stat as s,unlink as i,existsSync as r,createWriteStream as o,statSync as h,accessSync as n,constants as a}from"fs";import{dirname as p,parse as l,basename as u}from"path";import*as d from"http";import*as m from"https";import{parse as c,resolve as f}from"url";import{promisify as w}from"util";import{open as z}from"yauzl";import{Transform as y}from"stream";const g=w(e),R=w(s),O=w(i);async function b(t,e={mode:4095}){!function(t){const e=t.replace(l(t).root,"");if(/[<>:"|?*]/.test(e))throw Error("the path is invalid")}(t);try{await g(t,e.mode)}catch(e){if("EPERM"===e.code)throw e;if("ENOENT"===e.code){if(p(t)===t)throw Error(`operation not permitted, mkdir '${t}'`);if(e.message.includes("null bytes"))throw e;return await g(p(t)),g(t)}try{if(!(await R(t)).isDirectory())throw Error("The path is not a directory")}catch{throw e}}}class q extends t{constructor({url:t,destFolder:e,fileName:s,config:i={}}){if(super(),this.url="",this.defaultOpts={method:"GET",resume:!1,headers:{}},this.destFolder="",this.requestOptions={},this.opts={},this.filePath="",this.fileSize=0,this.fileName="",this.isResumeable=!1,this.stats={speed:0,prevTransfer:0,time:0},this.transfer=0,this.validate(t,e)){this.url=t,this.requestOptions={},this.request=t.indexOf("https://")>-1?m:d,this.destFolder=e;const r=u(c(this.url).pathname||""),o=r.slice(r.lastIndexOf("."));this.fileName=s&&s+o||r,this.filePath=this.destFolder+"/"+this.fileName,this.setOptions(i)}}static mkDir(t){b(t)}start(){return new Promise(((t,e)=>{this.downLoadReq=this.request.request(this.requestOptions,(s=>{if(this.currentResponse=s,this.isRedirect(s)){const i=f(this.url,s.headers.location||"");return this.url=decodeURIComponent(i.replace(/%/g,"%25")),this.emit("redirect",this.url),this.requestOptions=this.getRequestOptions(this.opts.method,this.url),this.start().then((()=>t(!0))).catch((t=>(this.emit("error",t),e(t))))}if(200!==s.statusCode&&206!==s.statusCode){const t=Error("Response status was "+s.statusCode);return this.emit("error",t),e(t)}this.isResumeable||(this.fileSize=parseInt(s.headers["content-length"]||"0")),Object.prototype.hasOwnProperty.call(s.headers,"accept-ranges")&&"none"!==s.headers["accept-ranges"]&&(this.opts.resume=!0),this.emit("start"),this.createDownLoadFile(s,t,e)})),this.downLoadReq.on("error",(t=>{this.emit("error",t)})),this.downLoadReq.on("timeout",(()=>this.emit("timeout"))),this.downLoadReq.end()}))}pause(){this.downLoadReq&&this.downLoadReq.abort(),this.currentResponse&&this.currentResponse.unpipe(),this.emit("pause")}resume(){return this.opts.resume&&(this.isResumeable=!0,this.opts.headers.range="bytes="+this.transfer+"-"),this.emit("resume"),this.start()}stop(){this.downLoadReq&&this.downLoadReq.abort(),this.currentResponse&&this.currentResponse.unpipe(),async function(t){if(r(t))await O(t)}(this.filePath),this.emit("stop")}getFileTotal(){const t=this.getRequestOptions("HEAD",this.url);return new Promise(((e,s)=>{this.request.request(t,(t=>{200!==t.statusCode&&s(Error("Response status was "+t.statusCode)),e({total:parseInt(t.headers["content-length"]||"0")})})).end()}))}createDownLoadFile(t,e,s){const i=this.isResumeable?o(this.filePath,{flags:"a"}):o(this.filePath);this.stats.time=Date.now(),this.isResumeable=!1,t.on("data",(t=>{this.resolveDownProgress(t.length)})).on("error",(t=>{this.emit("error",t),s(t)})),t.pipe(i).on("finish",(()=>{this.emit("complete",{path:this.filePath,fileName:this.fileName}),e(!0)})).on("error",(t=>{this.emit("error",t),s(t)}))}validate(t,e){if("string"!=typeof t)throw Error("URL should be an string");if(!t)throw Error("URL couldn't be empty");if("string"!=typeof e)throw Error("DestFolder should be an string");if(!e)throw Error("DestFolder couldn't be empty");r(e)||q.mkDir(e);if(!h(e).isDirectory())throw Error("Destination Folder must be a directory");try{n(e,a.W_OK)}catch(t){throw Error("Destination Folder must be writable")}return!0}setOptions(t){this.opts=Object.assign({},this.defaultOpts,t),this.requestOptions=this.getRequestOptions(this.opts.method,this.url,this.opts.headers)}getRequestOptions(t,e,s={}){const i=c(e);return{protocol:i.protocol,host:i.hostname,port:i.port,path:i.path,method:t,headers:s}}resolveDownProgress(t){if(0===t)return;const e=Date.now();this.transfer+=t;const s=this.transfer/this.fileSize*100;(e-this.stats.time>1e3||this.transfer===this.fileSize)&&(this.stats.speed=this.transfer-this.stats.prevTransfer,this.stats.time=e,this.stats.prevTransfer=this.transfer,this.emit("progress.speed",{progress:s,total:this.fileSize,transfer:this.transfer,speed:this.stats.speed,rest:this.fileSize-this.transfer})),this.emit("progress",{progress:s,total:this.fileSize,transfer:this.transfer,rest:this.fileSize-this.transfer})}isRedirect(t){return t.statusCode&&t.statusCode>300&&400>t.statusCode&&Object.prototype.hasOwnProperty.call(t.headers,"location")&&t.headers.location}}const E=y;class P extends t{constructor(t,e){super(),this.zipfile=null,this.zipPath=t,this.opt=e,this.canceled=!1}async extract(){this.zipfile=await this.promiseYauzlOpen();const t=this.zipfile.entryCount;let e=0,s=0;return new Promise(((i,r)=>{this.zipfile.on("error",(t=>{this.canceled=!0,r(t),this.emit("unzip.error",{err:t})})),this.emit("unzip.start"),this.zipfile.readEntry(),this.zipfile.on("close",(()=>{this.canceled||(console.log("zip extraction complete, bytesCount:"+s),this.emit("unzip.done",{done:e===t,bytesCount:s,zipPath:this.zipPath}),i({done:e===t,bytesCount:s,zipPath:this.zipPath}))})),this.zipfile.on("entry",(async i=>{if(e++,/\/$/.test(i.fileName)){const s=this.opt.dir+"/"+i.fileName;try{await b(s),this.zipfile.readEntry(),this.emit("unzip.progress",{progress:e/t*100,unziped:e,total:t})}catch(t){r(t),this.emit("unzip.error",{error:t})}}else{const h=this.opt.dir+"/"+i.fileName,n=p(h);try{await b(n),this.zipfile.openReadStream(i,((i,n)=>{i&&(this.emit("unzip.err",{err:i}),r(i));const a=new E;a._transform=(t,e,i)=>{s+=t.length,i(null,t)},a._flush=s=>{s(),this.emit("unzip.progress",{progress:e/t*100,unziped:e,total:t}),this.zipfile.readEntry()};const p=o(h);p.on("error",(t=>{this.emit("unzip.error",{err:t}),r(t)})),n.pipe(a).pipe(p)}))}catch(t){this.emit("unzip.error",{error:t}),r(t)}}}))}))}promiseYauzlOpen(){return new Promise(((t,e)=>{z(this.zipPath,{lazyEntries:!0},(function(s,i){if(s)return e(s);t(i)}))}))}}export{q as DownLoader,P as Extractor};
