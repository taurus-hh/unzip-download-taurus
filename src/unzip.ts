import * as path from "path";
import * as fs from "fs";
import { EventEmitter } from "events";
import * as yauzl from "yauzl";
import * as stream from "stream";
import { mkdirp } from "./helps";
const Transform = stream.Transform; // 可读可写 修改流数据

// zipPath compressed文件的路径
// opt.dir uncompressed文件的路径
// zipPath and opt.dir is absolute path
export class Extractor extends EventEmitter {
  zipPath: string;
  opt: any;
  canceled: boolean;
  zipfile: any = null;
  constructor(zipPath: string, opt: any) {
    super();
    this.zipPath = zipPath;
    this.opt = opt;
    this.canceled = false;
  }
  async extract() {
    this.zipfile = await this.promiseYauzlOpen();
    const total = this.zipfile.entryCount;
    let entryCount = 0;
    let bytesCount = 0;
    return new Promise((resolve, reject) => {
      // 监听解压报错
      this.zipfile.on("error", (err: any) => {
        this.canceled = true;
        reject(err);
        this.emit("unzip.error", {
          err,
        });
      });
      this.emit("unzip.start");
      this.zipfile.readEntry();
      // 解压完成
      this.zipfile.on("close", () => {
        if (!this.canceled) {
          console.log("zip extraction complete, bytesCount:" + bytesCount);
          this.emit("unzip.done", {
            done: entryCount === total,
            bytesCount,
            zipPath: this.zipPath,
          });
          resolve({
            done: entryCount === total,
            bytesCount,
            zipPath: this.zipPath,
          });
        }
      });
      this.zipfile.on("entry", async (entry: any) => {
        entryCount++;
        // '/'结尾的是目录
        if (/\/$/.test(entry.fileName)) {
          const dest = this.opt.dir + "/" + entry.fileName;
          try {
            await mkdirp(dest);
            this.zipfile.readEntry();
            this.emit("unzip.progress", {
              progress: (entryCount / total) * 100,
              unziped: entryCount,
              total,
            });
          } catch (error) {
            reject(error);
            this.emit("unzip.error", {
              error,
            });
          }
        } else {
          // 文件的解压
          const dest = this.opt.dir + "/" + entry.fileName;
          const destParent = path.dirname(dest);
          try {
            // 确保文件的父目录存在
            await mkdirp(destParent);
            this.zipfile.openReadStream(entry, (err: any, readStream: any) => {
              if (err) {
                this.emit("unzip.err", {
                  err,
                });
                reject(err);
              }
              const filter = new Transform();
              filter._transform = (chunk, encoding, cb) => {
                bytesCount += chunk.length;
                cb(null, chunk);
              };
              filter._flush = (cb) => {
                cb();
                this.emit("unzip.progress", {
                  progress: (entryCount / total) * 100,
                  unziped: entryCount,
                  total,
                });
                this.zipfile.readEntry();
              };
              const writeStream = fs.createWriteStream(dest);
              writeStream.on("error", (err) => {
                this.emit("unzip.error", {
                  err,
                });
                reject(err);
              });
              readStream.pipe(filter).pipe(writeStream);
            });
          } catch (error) {
            this.emit("unzip.error", {
              error,
            });
            reject(error);
          }
        }
      });
    });
  }
  private promiseYauzlOpen() {
    return new Promise((resolve, reject) => {
      yauzl.open(this.zipPath, { lazyEntries: true }, function (err, zipfile) {
        if (err) {
          return reject(err);
        }
        resolve(zipfile);
      });
    });
  }
}