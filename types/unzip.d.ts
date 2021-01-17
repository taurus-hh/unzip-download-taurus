/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Extractor extends EventEmitter {
    zipPath: string;
    opt: any;
    canceled: boolean;
    zipfile: any;
    constructor(zipPath: string, opt: any);
    extract(): Promise<unknown>;
    private promiseYauzlOpen;
}
