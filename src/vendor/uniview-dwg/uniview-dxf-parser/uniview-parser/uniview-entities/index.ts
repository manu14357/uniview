
export * from "./uniview-arc";
export * from "./uniview-attdef";
export * from './uniview-attribute'
export * from "./uniview-body";
export * from "./uniview-circle";
export * from "./uniview-dimension";
export * from "./uniview-ellipse";
export * from './uniview-face'
export * from "./uniview-hatch";
export * from './uniview-image'
export * from "./uniview-insert";
export * from "./uniview-leader";
export * from "./uniview-line";
export * from "./uniview-lwpolyline";
export * from './uniview-mesh'
export * from "./uniview-mtext";
export * from "./uniview-point";
export * from "./uniview-polyline";
export * from "./uniview-ray";
export * from "./uniview-region";
export * from "./uniview-section";
export * from "./uniview-solid";
export * from "./uniview-solid3d";
export * from "./uniview-spline";
export * from "./uniview-table";
export * from "./uniview-text";
export * from "./uniview-tolerance";
export * from "./uniview-vertex";
export * from "./uniview-viewport";
export * from "./uniview-wipeout";
export * from "./uniview-xline";
export * from "./uniview-shared";

import type { DxfArrayScanner, ScannerGroup } from "../uniview-dxf-array-scanner";
import { ensureHandle, isMatched } from "../uniview-shared";


import { ArcEntityParser } from "./uniview-arc";
import { AttDefEntityParser } from "./uniview-attdef";
import { AttributeEntityParser } from "./uniview-attribute";
import { BodyEntityParser } from "./uniview-body";
import { CircleEntityParser } from "./uniview-circle";
import { DimensionParser } from "./uniview-dimension";
import { EllipseEntityParser } from "./uniview-ellipse";
import { FaceEntityParser } from "./uniview-face";
import { ImageEntityParser } from "./uniview-image";
import { InsertEntityParser } from "./uniview-insert";
import { LeaderEntityParser } from "./uniview-leader";
import { LineEntityParser } from "./uniview-line";
import { LWPolylineParser } from "./uniview-lwpolyline";
import { MeshEntityParser } from "./uniview-mesh";
import { MTextEntityParser } from "./uniview-mtext";
import { PointEntityParser } from "./uniview-point";
import { PolylineParser } from "./uniview-polyline";
import { RayParser } from "./uniview-ray";
import { RegionEntityParser } from "./uniview-region";
import { SectionEntityParser } from "./uniview-section";
import { SolidEntityParser } from "./uniview-solid";
import { Solid3DEntityParser } from "./uniview-solid3d";
import { SplineEntityParser } from "./uniview-spline";
import { TableEntityParser } from "./uniview-table";
import { TextEntityParser } from "./uniview-text";
import { ToleranceEntityParser } from "./uniview-tolerance";
import { HatchEntityParser } from "./uniview-hatch";
import { VertexParser } from "./uniview-vertex";
import { ViewportParser } from "./uniview-viewport";
import { WipeoutEntityParser } from "./uniview-wipeout";
import { XLineEntityParser } from "./uniview-xline";
import { CommonDxfEntity } from "./uniview-shared";

import { MultiLeaderEntityParser } from "./uniview-multileader";

const Parsers = Object.fromEntries(
	[
		ArcEntityParser,
		AttDefEntityParser,
		AttributeEntityParser,
		BodyEntityParser,
		CircleEntityParser,
		DimensionParser,
		EllipseEntityParser,
    FaceEntityParser,
    ImageEntityParser,
		InsertEntityParser,
		LeaderEntityParser,
		LineEntityParser,
		LWPolylineParser,
    MeshEntityParser,
		MTextEntityParser,
		MultiLeaderEntityParser,
		PointEntityParser,
		PolylineParser,
    RayParser,
		RegionEntityParser,
		SectionEntityParser,
		SolidEntityParser,
		Solid3DEntityParser,
		SplineEntityParser,
		TableEntityParser,
		TextEntityParser,
		ToleranceEntityParser,
		HatchEntityParser,
    VertexParser,
		ViewportParser,
		WipeoutEntityParser,
		XLineEntityParser,
	].map((parser) => [parser.ForEntityName, new parser()])
);

/**
 * Is called after the parser first reads the 0:ENTITIES group. The scanner
 * should be on the start of the first entity already.
 */
export function parseEntities(
  curr: ScannerGroup,
  scanner: DxfArrayScanner,
): CommonDxfEntity[] {
  let entities: any[] = [];

  while (!isMatched(curr, 0, "EOF")) {
    if (curr.code === 0) {
      // BLOCK 섹션 안에 ENTITY 섹션이 있을 수도 있고
      // ENTITY 섹션만 따로 있을 수도 있음
      // BLOCK 섹션 안에 들어있는 ENTITY는 ENDBLK으로 끝남
      if (curr.value === "ENDBLK" || curr.value === "ENDSEC") {
        scanner.rewind();
        break;
      }

      const handler = Parsers[curr.value];
      if (handler) {
        const entityType = curr.value;
        curr = scanner.next();

        const entity = handler.parseEntity(scanner, curr) as any;
        entity.type = entityType;
        ensureHandle(entity);
        entities.push(entity);
      } else if (scanner.debug) {
        console.warn(`Unsupported ENTITY type: ${curr.value}`);
      }
    }

    curr = scanner.next();
  }
  return entities;
}
