import { StoryOptions } from "./types";
export type StoryFunction = (options: StoryOptions) => Promise<any>;
declare const Stories: Record<string, StoryFunction>;
export default Stories;
//# sourceMappingURL=index.d.ts.map