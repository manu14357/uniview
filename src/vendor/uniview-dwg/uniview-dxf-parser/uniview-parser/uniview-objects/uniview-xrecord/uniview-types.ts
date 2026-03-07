import type { ScannerGroup } from "../../uniview-dxf-array-scanner";
import type { CommonDXFObject } from "../uniview-types";
import type { RecordCloneFlag } from "../uniview-consts";

export interface XRecordDXFObject extends CommonDXFObject {
  subclassMarker: "UvDbXrecord";
  /** 
   * When object is cloned like block insert, xrecord is also copied.
   * Therefore the name of xrecords may have duplicated names.
   * This flag determines how AutoCAD handles name collision.
   * 
   * @see RecordCloneFlag
   * */
  cloneFlag: RecordCloneFlag;
  data: ScannerGroup[]
}