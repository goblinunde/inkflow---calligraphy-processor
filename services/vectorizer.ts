export const vectorizer = {
    toSVG: async (imageData: ImageData): Promise<string> => {
        const { default: ImageTracer } = await import('imagetracerjs');

        // Preset for high detail black and white
        const options = {
            ltres: 0.1, // Linear error threshold
            qtres: 0.1, // Quadratic error threshold
            pathomit: 2, // Small path omission
            colorsampling: 0, // 0 = disabled sampling
            numberofcolors: 2, // Black and White
            mincolorratio: 0,
            colorquantcycles: 3,
            strokewidth: 0,
            linefilter: true,
            scale: 1,
            viewbox: 1, // Use viewBox
            desc: false // No metadata
        };

        return ImageTracer.imagedataToSVG(imageData, options);
    }
};
