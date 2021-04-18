import sharp from 'sharp'

function toJPG(frame){
    let {width, height, pixels} = frame;
    return sharp(
        pixels,
        {
            raw:{
                width: width,
                height: height,
                channels: 4
            }
        })
}

function extractPixels(context) {
    const width = context.drawingBufferWidth;
    const height = context.drawingBufferHeight;
    const frameBufferPixels = new Uint8Array(width * height * 4);
    context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, frameBufferPixels);
    // The framebuffer coordinate space has (0, 0) in the bottom left, whereas images usually
    // have (0, 0) at the top left. Vertical flipping follows:
    const pixels = new Uint8Array(width * height * 4);
    for (let fbRow = 0; fbRow < height; fbRow += 1) {
        let rowData = frameBufferPixels.subarray(fbRow * width * 4, (fbRow + 1) * width * 4);
        let imgRow = height - fbRow - 1;
        pixels.set(rowData, imgRow * width * 4);
    }
    return {width, height, pixels};
}

function toP3(frame) {
    let {width, height, pixels} = frame;
    const headerContent = `P3\n# http://netpbm.sourceforge.net/doc/ppm.html\n${width} ${height}\n255\n`;
    const bytesPerPixel = pixels.length / width / height;
    const rowLen = width * bytesPerPixel;

    let output = headerContent;
    for (let i = 0; i < pixels.length; i += bytesPerPixel) {
        // Break output into rows
        if (i > 0 && i % rowLen === 0) {
            output += "\n";
        }
        for (let j = 0; j < 3; j += 1) {
            // This is super inefficient but hey
            output += pixels[i + j] + " ";
        }
    }

    return output;
}

export {
    extractPixels,
    toP3,
    toJPG
}