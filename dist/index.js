"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t=require("events"),e=require("fs"),s=require("path"),r=require("http"),i=require("https"),o=require("url"),n=require("util"),a=require("yauzl"),h=require("stream");function p(t){if(t&&t.__esModule)return t;var e=Object.create(null);return t&&Object.keys(t).forEach((function(s){if("default"!==s){var r=Object.getOwnPropertyDescriptor(t,s);Object.defineProperty(e,s,r.get?r:{enumerable:!0,get:function(){return t[s]}})}})),e.default=t,Object.freeze(e)}var u=p(r),l=p(i);const c=n.promisify(e.mkdir),d=n.promisify(e.stat),f=n.promisify(e.unlink);async function m(t,e={mode:4095}){!function(t){const e=t.replace(s.parse(t).root,"");if(/[<>:"|?*]/.test(e))throw Error("the path is invalid")}(t);try{await c(t,e.mode)}catch(e){if("EPERM"===e.code)throw e;if("ENOENT"===e.code){if(s.dirname(t)===t)throw Error(`operation not permitted, mkdir '${t}'`);if(e.message.includes("null bytes"))throw e;return await c(s.dirname(t)),c(t)}try{if(!(await d(t)).isDirectory())throw Error("The path is not a directory")}catch{throw e}}}class w extends t.EventEmitter{constructor({url:t,destFolder:e,fileName:r,config:i={}}){if(super(),this.url="",this.defaultOpts={method:"GET",resume:!1,headers:{}},this.destFolder="",this.requestOptions={},this.opts={},this.filePath="",this.fileSize=0,this.fileName="",this.isResumeable=!1,this.stats={speed:0,prevTransfer:0,time:0},this.transfer=0,this.validate(t,e)){this.url=t,this.requestOptions={},this.request=t.indexOf("https://")>-1?l:u,this.destFolder=e;const n=s.basename(o.parse(this.url).pathname||""),a=n.slice(n.lastIndexOf("."));this.fileName=r&&r+a||n,this.filePath=this.destFolder+"/"+this.fileName,this.setOptions(i)}}static mkDir(t){m(t)}start(){return new Promise(((t,e)=>{this.downLoadReq=this.request.request(this.requestOptions,(s=>{if(this.currentResponse=s,this.isRedirect(s)){const r=o.resolve(this.url,s.headers.location||"");return this.url=decodeURIComponent(r.replace(/%/g,"%25")),this.emit("redirect",this.url),this.requestOptions=this.getRequestOptions(this.opts.method,this.url),this.start().then((()=>t(!0))).catch((t=>(this.emit("error",t),e(t))))}if(200!==s.statusCode&&206!==s.statusCode){const t=Error("Response status was "+s.statusCode);return this.emit("error",t),e(t)}this.isResumeable||(this.fileSize=parseInt(s.headers["content-length"]||"0")),Object.prototype.hasOwnProperty.call(s.headers,"accept-ranges")&&"none"!==s.headers["accept-ranges"]&&(this.opts.resume=!0),this.emit("start"),this.createDownLoadFile(s,t,e)})),this.downLoadReq.on("error",(t=>{this.emit("error",t)})),this.downLoadReq.on("timeout",(()=>this.emit("timeout"))),this.downLoadReq.end()}))}pause(){this.downLoadReq&&this.downLoadReq.abort(),this.currentResponse&&this.currentResponse.unpipe(),this.emit("pause")}resume(){return this.opts.resume&&(this.isResumeable=!0,this.opts.headers.range="bytes="+this.transfer+"-"),this.emit("resume"),this.start()}stop(){this.downLoadReq&&this.downLoadReq.abort(),this.currentResponse&&this.currentResponse.unpipe(),async function(t){if(e.existsSync(t))await f(t)}(this.filePath),this.emit("stop")}getFileTotal(){const t=this.getRequestOptions("HEAD",this.url);return new Promise(((e,s)=>{this.request.request(t,(t=>{200!==t.statusCode&&s(Error("Response status was "+t.statusCode)),e({total:parseInt(t.headers["content-length"]||"0")})})).end()}))}createDownLoadFile(t,s,r){const i=this.isResumeable?e.createWriteStream(this.filePath,{flags:"a"}):e.createWriteStream(this.filePath);this.stats.time=Date.now(),this.isResumeable=!1,t.on("data",(t=>{this.resolveDownProgress(t.length)})).on("error",(t=>{this.emit("error",t),r(t)})),t.pipe(i).on("finish",(()=>{const t={done:this.fileSize===this.transfer,path:this.filePath,fileName:this.fileName};this.emit("complete",t),s(t)})).on("error",(t=>{this.emit("error",t),r(t)}))}validate(t,s){if("string"!=typeof t)throw Error("URL should be an string");if(!t)throw Error("URL couldn't be empty");if("string"!=typeof s)throw Error("DestFolder should be an string");if(!s)throw Error("DestFolder couldn't be empty");e.existsSync(s)||w.mkDir(s);if(!e.statSync(s).isDirectory())throw Error("Destination Folder must be a directory");try{e.accessSync(s,e.constants.W_OK)}catch(t){throw Error("Destination Folder must be writable")}return!0}setOptions(t){this.opts=Object.assign({},this.defaultOpts,t),this.requestOptions=this.getRequestOptions(this.opts.method,this.url,this.opts.headers)}getRequestOptions(t,e,s={}){const r=o.parse(e);return{protocol:r.protocol,host:r.hostname,port:r.port,path:r.path,method:t,headers:s}}resolveDownProgress(t){if(0===t)return;const e=Date.now();this.transfer+=t;const s=this.transfer/this.fileSize*100;(e-this.stats.time>1e3||this.transfer===this.fileSize)&&(this.stats.speed=this.transfer-this.stats.prevTransfer,this.stats.time=e,this.stats.prevTransfer=this.transfer,this.emit("progress.speed",{progress:s,total:this.fileSize,transfer:this.transfer,speed:this.stats.speed,rest:this.fileSize-this.transfer})),this.emit("progress",{progress:s,total:this.fileSize,transfer:this.transfer,rest:this.fileSize-this.transfer})}isRedirect(t){return t.statusCode&&t.statusCode>300&&400>t.statusCode&&Object.prototype.hasOwnProperty.call(t.headers,"location")&&t.headers.location}}const y=h.Transform;exports.DownLoader=w,exports.Extractor=class extends t.EventEmitter{constructor(t,e){super(),this.zipfile=null,this.zipPath=t,this.opt=e,this.canceled=!1}async extract(){this.zipfile=await this.promiseYauzlOpen();const t=this.zipfile.entryCount;let r=0,i=0;return new Promise(((o,n)=>{this.zipfile.on("error",(t=>{this.canceled=!0,n(t),this.emit("unzip.error",{err:t})})),this.emit("unzip.start"),this.zipfile.readEntry(),this.zipfile.on("close",(()=>{this.canceled||(this.emit("unzip.done",{done:r===t,bytesCount:i,zipPath:this.zipPath}),o({done:r===t,bytesCount:i,zipPath:this.zipPath}))})),this.zipfile.on("entry",(async o=>{if(r++,/\/$/.test(o.fileName)){const e=this.opt.dir+"/"+o.fileName;try{await m(e),this.zipfile.readEntry(),this.emit("unzip.progress",{progress:r/t*100,unziped:r,total:t})}catch(t){n(t),this.emit("unzip.error",{error:t})}}else{const a=this.opt.dir+"/"+o.fileName,h=s.dirname(a);try{await m(h),this.zipfile.openReadStream(o,((s,o)=>{s&&(this.emit("unzip.err",{err:s}),n(s));const h=new y;h._transform=(t,e,s)=>{i+=t.length,s(null,t)},h._flush=e=>{e(),this.emit("unzip.progress",{progress:r/t*100,unziped:r,total:t}),this.zipfile.readEntry()};const p=e.createWriteStream(a);p.on("error",(t=>{this.emit("unzip.error",{err:t}),n(t)})),o.pipe(h).pipe(p)}))}catch(t){this.emit("unzip.error",{error:t}),n(t)}}}))}))}promiseYauzlOpen(){return new Promise(((t,e)=>{a.open(this.zipPath,{lazyEntries:!0},(function(s,r){if(s)return e(s);t(r)}))}))}};
