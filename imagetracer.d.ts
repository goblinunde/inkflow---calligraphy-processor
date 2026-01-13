declare module 'imagetracerjs' {
    export interface Options {
        ltres?: number;
        qtres?: number;
        pathomit?: number;
        rightangleenhance?: boolean;
        colorsampling?: number;
        numberofcolors?: number;
        mincolorratio?: number;
        colorquantcycles?: number;
        layering?: number;
        strokewidth?: number;
        linefilter?: boolean;
        scale?: number;
        roundcoords?: number;
        viewbox?: number;
        desc?: boolean;
        lcpr?: number;
        qcpr?: number;
        blurradius?: number;
        blurdelta?: number;
    }

    export function imagedataToSVG(imageData: ImageData, options?: Options): string;
}
