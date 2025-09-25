export = window.rStats;
declare function rStats(settings: any): (id: any) => any;
declare namespace rStats {
    export { rStats };
}
declare var window: Window & typeof globalThis;
type rStats = {
    colours?: Array<string>;
    CSSPath?: string;
    css?: Array<string>;
    "": any;
    groups?: Array<any>;
    fractions?: Array<any>;
    plugins?: Array<any>;
};
//# sourceMappingURL=rStats.d.ts.map