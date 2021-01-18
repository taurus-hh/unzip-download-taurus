import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import * as URL from "url";
import { mkdirp, remove } from "./helps";
export type resolveConfig = (value?: {} | PromiseLike<{}> | undefined) => void;
export type rejectConfig = (reason?: any) => void;
export interface defaultOptsConfig {
  method: string;
  resume?: boolean;
  headers?: any;
}
export interface optionConfig {
  url: string;
  destFolder: string;
  fileName?: string;
  config?: any;
}
/**
 * Download file to local disk, is used for node/electron
 *
 * @public
 */
export class DownLoader extends EventEmitter {
  url: string = "";
  downLoadReq: any;
  defaultOpts: defaultOptsConfig = {
    method: "GET",
    resume: false,
    headers: {}
  };
  destFolder: string = "";
  request: any;
  requestOptions: https.RequestOptions = {};
  currentResponse: http.IncomingMessage;
  opts: any = {};
  filePath: string = "";
  fileSize: number = 0;
  fileName: string = "";
  isResumeable: boolean = false;
  stats = {
    speed: 0,
    prevTransfer: 0,
    time: 0
  };
  transfer: number = 0;
  constructor({ url, destFolder, fileName, config = {} }: optionConfig) {
    super();
    if (this.validate(url, destFolder)) {
      this.url = url;
      this.requestOptions = {};
      this.request = url.indexOf("https://") > -1 ? https : http;
      this.destFolder = destFolder;
      const localName = path.basename(URL.parse(this.url).pathname || "");
      const suffix = localName.slice(localName.lastIndexOf("."));
      this.fileName = (fileName && fileName + suffix) || localName;
      this.filePath = this.destFolder + "/" + this.fileName;
      this.setOptions(config);
    }
  }
  /**
   * Create file directory
   *
   * @param dest - The file directory
   *
   * @public
   */
  static mkDir(dest: string) {
    mkdirp(dest);
  }
  /**
   * Start download file
   *
   * @returns promise.then((boolean)) success or failed
   *
   * @public
   */
  start() {
    return new Promise((resolve, reject) => {
      this.downLoadReq = this.request.request(
        this.requestOptions,
        (res: http.IncomingMessage) => {
          this.currentResponse = res;
          if (this.isRedirect(res)) {
            const redirectedURL = URL.resolve(
              this.url,
              res.headers.location || ""
            );
            this.url = decodeURIComponent(redirectedURL.replace(/%/g, "%25"));
            this.emit("redirect", this.url);
            this.requestOptions = this.getRequestOptions(
              this.opts.method,
              this.url
            );
            return this.start()
              .then(() => resolve(true))
              .catch(err => {
                this.emit("error", err);
                return reject(err);
              });
          }
          if (res.statusCode !== 200 && res.statusCode !== 206) {
            const err = new Error(`Response status was ${res.statusCode}`);
            this.emit("error", err);
            return reject(err);
          }
          if (!this.isResumeable) {
            this.fileSize = parseInt(res.headers["content-length"] || "0");
          }
          if (
            Object.prototype.hasOwnProperty.call(
              res.headers,
              "accept-ranges"
            ) &&
            res.headers["accept-ranges"] !== "none"
          ) {
            this.opts.resume = true;
          }

          this.emit("start");
          this.createDownLoadFile(res, resolve, reject);
        }
      );
      this.downLoadReq.on("error", (error: any) => {
        this.emit("error", error);
      });
      this.downLoadReq.on("timeout", () => this.emit("timeout"));
      this.downLoadReq.end();
    });
  }
  /**
   * Pause request of download file
   *
   * @public
   */
  pause() {
    if (this.downLoadReq) {
      this.downLoadReq.abort();
    }
    if (this.currentResponse) {
      this.currentResponse.unpipe();
    }
    this.emit("pause");
  }
  /**
   * Resume request of download file
   *
   * @public
   */
  resume() {
    if (this.opts.resume) {
      this.isResumeable = true;
      this.opts["headers"]["range"] = "bytes=" + this.transfer + "-";
    }
    this.emit("resume");
    return this.start();
  }
  /**
   * Stop request of download file and remove file
   *
   * @public
   */
  stop() {
    if (this.downLoadReq) {
      this.downLoadReq.abort();
    }
    if (this.currentResponse) {
      this.currentResponse.unpipe();
    }
    remove(this.filePath);
    this.emit('stop');
  }
  /**
   * Returns size of file
   *
   * @returns promise.then((number)) file size
   *
   * @pulic
   */
  getFileTotal() {
    const options = this.getRequestOptions("HEAD", this.url);
    return new Promise((resolve, reject) => {
      const requestFileTotal = this.request.request(
        options,
        (response: http.IncomingMessage) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Response status was ${response.statusCode}`));
          }
          resolve({
            total: parseInt(response.headers["content-length"] || "0")
          });
        }
      );
      requestFileTotal.end();
    });
  }
  /**
   * Create writeable stream
   *
   * @param res - response of download file / readable stream
   * @param resolve - promise resolve
   * @param reject - promise reject
   *
   * @public
   */
  private createDownLoadFile(
    res: http.IncomingMessage,
    resolve: resolveConfig,
    reject: rejectConfig
  ) {
    const fileStream = this.isResumeable
      ? fs.createWriteStream(this.filePath, { flags: "a" })
      : fs.createWriteStream(this.filePath);
    this.stats.time = Date.now();
    this.isResumeable = false;
    // http响应数据流
    res
      .on("data", chunk => {
        this.resolveDownProgress(chunk.length);
      })
      .on("error", err => {
        this.emit("error", err);
        reject(err);
      });
    // pipe 为写入文件流
    res
      .pipe(fileStream)
      .on("finish", () => {
        this.emit("complete", {
          path: this.filePath,
          fileName: this.fileName
        });
        resolve({
          done: this.fileSize === this.transfer,
          path: this.filePath,
          fileName: this.fileName
        });
      })
      .on("error", err => {
        this.emit("error", err);
        reject(err);
      });
  }
  /**
   * Whether the URL is valid and the file directory exists。
   *
   * @param url - The remote url
   * @param dest - The file directory
   * @returns boolean Url is valid and the file directory exists.
   *
   * @internal
   */
  private validate(url: string, dest: string): boolean {
    if (typeof url !== "string") {
      throw new Error("URL should be an string");
    }
    if (!url) {
      throw new Error("URL couldn't be empty");
    }
    if (typeof dest !== "string") {
      throw new Error("DestFolder should be an string");
    }
    if (!dest) {
      throw new Error("DestFolder couldn't be empty");
    }
    // 文件路径是否存在
    if (!fs.existsSync(dest)) {
      DownLoader.mkDir(dest);
      // throw new Error("Destination Folder must exist");
    }
    // stats 文件目录信息
    const stats = fs.statSync(dest);
    if (!stats.isDirectory()) {
      throw new Error("Destination Folder must be a directory");
    }
    // 测试文件目录的读写权限
    try {
      fs.accessSync(dest, fs.constants.W_OK);
    } catch (e) {
      throw new Error("Destination Folder must be writable");
    }
    return true;
  }

  /**
   * Set options
   *
   * @interval
   */
  private setOptions(config: any) {
    this.opts = Object.assign({}, this.defaultOpts, config);
    this.requestOptions = this.getRequestOptions(
      this.opts.method,
      this.url,
      this.opts.headers
    );
  }
  /**
   * Returns http/https request option
   *
   * @param method - The request method
   * @param url - The request url
   * @returns The request option
   *
   * @interval
   */
  private getRequestOptions(method: string, url: string, headers: any = {}) {
    const urlParse = URL.parse(url);
    const options = {
      protocol: urlParse.protocol,
      host: urlParse.hostname,
      port: urlParse.port,
      path: urlParse.path,
      method: method,
      headers
    };
    return options;
  }
  /**
   * Resolve down progress
   *
   * @param bytes - The downloaded bytes
   *
   * @interval
   */
  private resolveDownProgress(bytes: number) {
    if (bytes === 0) return;
    const currentTime = Date.now();
    this.transfer += bytes;
    const progress = (this.transfer / this.fileSize) * 100;
    if (
      currentTime - this.stats.time > 1000 ||
      this.transfer === this.fileSize
    ) {
      this.stats.speed = this.transfer - this.stats.prevTransfer;
      this.stats.time = currentTime;
      this.stats.prevTransfer = this.transfer;
      this.emit("progress.speed", {
        progress,
        total: this.fileSize,
        transfer: this.transfer,
        speed: this.stats.speed,
        rest: this.fileSize - this.transfer
      });
    }
    this.emit("progress", {
      progress,
      total: this.fileSize,
      transfer: this.transfer,
      rest: this.fileSize - this.transfer
    });
  }
  /**
   * Whether the url is redirect
   *
   * @param res - The response
   * @returns boolean / The url is redirect
   *
   * @interval
   */
  private isRedirect(res: http.IncomingMessage) {
    return (
      res.statusCode &&
      res.statusCode > 300 &&
      res.statusCode < 400 &&
      Object.prototype.hasOwnProperty.call(res.headers, "location") &&
      res.headers.location
    );
  }
}
