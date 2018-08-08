
export type Request = (
    url: string | RegExp | { url: string, host: string}, 
    data: any, 
    headers?: object, 
    delay?: number,
) => MockMate;

export type RequestError = (
    url: string | RegExp | { url: string, host: string}, 
    reqError: string | Error, 
    resError: string | Error, 
    delay?: number
) => MockMate;

export interface MockMate {
    (target: any, key: string, prop: any): void;
    /**
     * Mock async function error.
     */
    error: (mod: any, method: string, error?: string | Error, props?: object, timeout?: number) => MockMate;

    /**
     * mock return callback(null, data).
     */
    data: (mod: any, method: string, data: any, timeout?: number) => MockMate;

    /**
     * mock return callback(null, null).
     */
    empty: (mod: any, method: string, timeout?: number) => MockMate;

    /**
     * mock return callback(null, data1, data2).
     */
    datas: (mod: any, method: string, datas: any, timeout?: number) => MockMate;

    /**
     * mock function sync throw error
     */
    syncError: (mod: any, method: string, error?: string | Error, props?: object) => void;
    
    /**
     * mock function sync return data
     */
    syncData: (mod: any, method: string, data?: any) => void;

    /**
     * mock function sync return nothing
     */
    syncEmpty: (mod: any, method: string) => void;

    /**
     * remove all mock effects.
     */
    restore: () => MockMate;

    http: {
        request: Request;
        requestError: RequestError,
    };

    https: {
        request: Request;
        requestError: RequestError,
    };

}
  
declare const mm: MockMate;
export = mm;
export default mm;

