declare function mm(target: any, key: string, prop: any): void;

declare namespace mm {
    /**
     * Mock async function error.
     */
    function error(mod: any, method: string, error?: string | Error, props?: object, timeout?: number): typeof mm;

    /**
     * mock return callback(null, data).
     */
    function data(mod: any, method: string, data: any, timeout?: number): typeof mm;

    /**
     * mock return callback(null, null).
     */
    function empty(mod: any, method: string, timeout?: number): typeof mm;

    /**
     * mock return callback(null, data1, data2).
     */
    function datas(mod: any, method: string, datas: any, timeout?: number): typeof mm;

    /**
     * mock function sync throw error
     */
    function syncError(mod: any, method: string, error?: string | Error, props?: object): void;
    
    /**
     * mock function sync return data
     */
    function syncData(mod: any, method: string, data?: any): void;

    /**
     * mock function sync return nothing
     */
    function syncEmpty(mod: any, method: string): void;

    /**
     * remove all mock effects.
     */
    function restore(): typeof mm;

    const http: {
        request: (
            url: string | RegExp | { url: string, host: string}, 
            data: any, 
            headers?: object, 
            delay?: number,
        ) => typeof mm,
        requestError: (
            url: string | RegExp | { url: string, host: string}, 
            reqError: string | Error, 
            resError: string | Error, 
            delay?: number
        ) => typeof mm,
    }

    const https: {
        request: (
            url: string | RegExp | { url: string, host: string}, 
            data: any, 
            headers?: object, 
            delay?: number,
        ) => typeof mm,
        requestError: (
            url: string | RegExp | { url: string, host: string}, 
            reqError: string | Error, 
            resError: string | Error, 
            delay?: number
        ) => typeof mm,
    }

}
  
export default mm;

