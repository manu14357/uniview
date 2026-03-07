import type { CommonDXFObject } from "../uniview-types";
import type { RecordCloneFlag } from "../uniview-consts";

export interface DictionaryDXFObject extends CommonDXFObject {
    subclassMarker: 'UvDbDictionary';
    isHardOwned?: boolean;
    recordCloneFlag: RecordCloneFlag;
    entries: { name: string; objectSoftId?: string; objectHardId?: string }[];
}
