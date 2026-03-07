import type { Point2D, Point3D } from "../../../uniview-types"
import type { OrthographicType } from "../../../uniview-consts";
import type { PlotSettingDXFObject } from "../uniview-plotSettings";
import type { LayoutControlFlag } from "./uniview-consts";


export interface LayoutDXFObject
    extends Omit<PlotSettingDXFObject, 'subclassMarker'> {
    subclassMarker: 'UvDbLayout';
    layoutName: string;
    controlFlag: LayoutControlFlag;
    tabOrder: number;
    minLimit: Point2D;
    maxLimit: Point2D;
    insertionPoint: Point3D;
    minExtent: Point3D;
    maxExtent: Point3D;
    elevation: number;
    ucsOrigin: Point3D;
    ucsXAxis: Point3D;
    ucsYAxis: Point3D;
    orthographicType: OrthographicType;
    paperSpaceTableId: string;
    viewportId: string;
    namedUcsId?: string;
    orthographicUcsId?: string;
}