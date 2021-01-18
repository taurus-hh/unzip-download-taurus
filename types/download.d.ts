/// <reference types="node" />
import { EventEmitter } from "events";
import * as http from "http";
import * as https from "https";
export declare type resolveConfig = (value?: doneConfig | {} | PromiseLike<{}> | undefined) => void;
export declare type rejectConfig = (reason?: any) => void;
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
export interface doneConfig {
    done: boolean;
    path: string;
    fileName: string;
}
export interface progressConfig {
    progress: number;
    total: number;
    transfer: number;
    speed: number;
    rest: number;
}
/**
 * Download file to local disk, is used for node/electron
 *
 * @public
 */
export declare class DownLoader extends EventEmitter {
    url: string;
    downLoadReq: any;
    defaultOpts: defaultOptsConfig;
    destFolder: string;
    request: any;
    requestOptions: https.RequestOptions;
    currentResponse: http.IncomingMessage;
    opts: any;
    filePath: string;
    fileSize: number;
    fileName: string;
    isResumeable: boolean;
    stats: {
        speed: number;
        prevTransfer: number;
        time: number;
    };
    transfer: number;
    constructor({ url, destFolder, fileName, config }: optionConfig);
    /**
     * Create file directory
     *
     * @param dest - The file directory
     *
     * @public
     */
    static mkDir(dest: string): void;
    /**
     * Start download file
     *
     * @returns promise.then((boolean)) success or failed
     *
     * @public
     */
    start(): Promise<unknown>;
    /**
     * Pause request of download file
     *
     * @public
     */
    pause(): void;
    /**
     * Resume request of download file
     *
     * @public
     */
    resume(): Promise<unknown>;
    /**
     * Stop request of download file and remove file
     *
     * @public
     */
    stop(): void;
    /**
     * Returns size of file
     *
     * @returns promise.then((number)) file size
     *
     * @pulic
     */
    getFileTotal(): Promise<unknown>;
    /**
     * Create writeable stream
     *
     * @param res - response of download file / readable stream
     * @param resolve - promise resolve
     * @param reject - promise reject
     *
     * @public
     */
    private createDownLoadFile;
    /**
     * Whether the URL is valid and the file directory exists。
     *
     * @param url - The remote url
     * @param dest - The file directory
     * @returns boolean Url is valid and the file directory exists.
     *
     * @internal
     */
    private validate;
    /**
     * Set options
     *
     * @interval
     */
    private setOptions;
    /**
     * Returns http/https request option
     *
     * @param method - The request method
     * @param url - The request url
     * @returns The request option
     *
     * @interval
     */
    private getRequestOptions;
    /**
     * Resolve down progress
     *
     * @param bytes - The downloaded bytes
     *
     * @interval
     */
    private resolveDownProgress;
    /**
     * Whether the url is redirect
     *
     * @param res - The response
     * @returns boolean / The url is redirect
     *
     * @interval
     */
    private isRedirect;
}
