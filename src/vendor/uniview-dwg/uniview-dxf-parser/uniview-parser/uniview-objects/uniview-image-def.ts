import type { Point2D } from '../../uniview-types';
import {
    DXFParserSnippet,
    Identity,
    PointParser,
} from '../uniview-shared/uniview-parser-generator';
import { CommonDXFObject } from './uniview-types';

export const ImageDefSnippets: DXFParserSnippet[] = [
    {
        code: 330,
        name: 'imageDefReactorIdSoft',
        isMultiple: true,
        parser: Identity,
    },
    {
        code: 90,
        name: 'version',
        parser: Identity,
    },
    {
        code: 1,
        name: 'fileName',
        parser: Identity,
    },
    {
        code: 10,
        name: 'size',
        parser: PointParser,
    },
    {
        code: 11,
        name: 'sizeOfOnePixel',
        parser: PointParser,
    },
    {
        code: 280,
        name: 'isLoaded',
        parser: Identity,
    },
    {
        code: 281,
        name: 'resolutionUnits',
        parser: Identity,
    },
    {
        code: 100,
        name: 'subclassMarker',
        parser: Identity,
    },
];

export enum ImageResolutionUnits {
    NOUNIT = 0,
    CENTIMETERS = 2,
    INCH = 5
}

export interface ImageDefDXFObject extends CommonDXFObject {
    subclassMarker: 'UvDbRasterImageDef';
    fileName: string;
    size: Point2D;
    sizeOfOnePixel: Point2D;
    isLoaded: number;
    resolutionUnits: number;
}
