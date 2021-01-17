export interface optionsConfig {
    mode: number;
}
export declare function mkdirp(dirs: string, options?: optionsConfig): Promise<void>;
export declare function remove(path: string): Promise<void>;
