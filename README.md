# download-unzip-node
A simple http file downloader and unzipper for node.js
## Install

```
$ npm install --save @taraus-he/tdunzip
```
```
$ yarn add @taraus-he/tdunzip
```
## download
Features:
- Pause/Resume
- Progress stats
- Supports http/https
- Custom native http request options
- Support nodejs, electron, nwjs
- Support tree shaking
- Typescript
### Usage

For a more complete example check [example](example/) folder

```javascript
const { DownLoader } = require('download-unzip-node');
or
import { DownLoader } from "download-unzip-node";

const dl = new DownLoader({
  url: 'http://www.ovh.net/files/1Gio.dat',
  destFolder: __dirname,
  fileName: "xxxx.dat",
  config: {
    header: {

    },
  }
});
dl.start();
dl
  .on("start")
  .on("progress", (result) => {
    console.log(result)
  })
  .on("error", (error) => {
    console.log(error)
  })
```
### Options

`constructor({ url, destFolder, fileName, config = {}})`,

```javascript
for config
{
  method: 'GET', // Request Method Verb defaul 
  headers: {},  // Custom HTTP Header ex: Authorization, User-Agent
}
```

### Methods

| Name     	| Description                                                                 |
|----------	|---------------------------------------------------------------------------	|
| start  	| starts the downloading                                                       	|
| pause  	| pause the downloading                                                        	|
| resume 	| resume the downloading if supported, if not it will start from the beginning 	|
| stop   	| stop the downloading and remove the file                                     	|
| getFileTotal | total file size got from the servere 


### Events

| Name      | Description                                                                 |         
|----------	|---------------------------------------------------------------------------	| 	                        
| start        	 | Emitted when the .start method is called                                                  |
| progress     	 | Emitted every time gets data from the server `callback(progress)` 	                       |       
| progress.speed | The same as `progress` but emits every 1 second while is downloading `callback(progress)` |
| redirect       | Emitted when the url is redirect                                                          |
| complete       | Emitted when the downloading has finished callback(downloadInfo)                          |
| error          | Emitted when there is any error callback(error)                                           |

event **progress** `progress` object
```javascript
{
  progress, // the download progress in percentage
  total,    // total file size got from the server
  transfer, // the downloaded amount,
  rest,     // the rest file size,
}
```
event **progress.speed** `progress` object
```javascript
{
  progress, // the download progress in percentage
  total,    // total file size got from the server
  transfer, // the downloaded amount,
  rest,     // the rest file size,
  speed,    // every 1 second
}
```
event **redirect** url string
```javascript
url  // redirect url
```
event **complete** result object
```javascript
{
  path,     // the file saved path
  fileName  // file name
}  
```
event **error** error object
```javascript
error 
```