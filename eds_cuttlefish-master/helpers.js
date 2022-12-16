/*
helpers.js

utility for paths

Jake Read at the Center for Bits and Atoms with Leo McElroy, Neil Gershenfeld
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

const pipe = (first, ...more) => more.reduce((acc,curr) => (...arguments) => curr(acc(...arguments)) , first);

const offsetHelper = (distances, offset, width, height) => {
    var w = width;
    var h = height;
    var offset = offset;
    var input = distances;
    var output = new Uint8ClampedArray(4 * h * w);
    for (var row = 0; row < h; ++row) {
    for (var col = 0; col < w; ++col) {
        if (input[(h - 1 - row) * w + col] <= offset) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        } else {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        }
    }
    }

    const imgData = new ImageData(output, w, h);

    return imgData;
};

const edgeDetectHelper = imageRGBA => {
    var h = imageRGBA.height;
    var w = imageRGBA.width;
    var input = imageRGBA.data;
    var output = new Uint8ClampedArray(h * w * 4);
    var i00, i0m, i0p, im0, ip0, imm, imp, ipm, ipp, row, col;
    //
    // find edges - interior
    //
    for (row = 1; row < h - 1; ++row) {
    for (col = 1; col < w - 1; ++col) {
        i00 =
        input[(h - 1 - row) * w * 4 + col * 4 + 0] +
        input[(h - 1 - row) * w * 4 + col * 4 + 1] +
        input[(h - 1 - row) * w * 4 + col * 4 + 2];
        i0p =
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 2];
        ip0 =
        input[(h - 2 - row) * w * 4 + col * 4 + 0] +
        input[(h - 2 - row) * w * 4 + col * 4 + 1] +
        input[(h - 2 - row) * w * 4 + col * 4 + 2];
        ipp =
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 2];
        i0m =
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 2];
        im0 =
        input[(h - row) * w * 4 + col * 4 + 0] +
        input[(h - row) * w * 4 + col * 4 + 1] +
        input[(h - row) * w * 4 + col * 4 + 2];
        imm =
        input[(h - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - row) * w * 4 + (col - 1) * 4 + 2];
        imp =
        input[(h - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - row) * w * 4 + (col + 1) * 4 + 2];
        ipm =
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 2];
        if (
        i00 != i0p ||
        i00 != ip0 ||
        i00 != ipp ||
        i00 != i0m ||
        i00 != im0 ||
        i00 != imm ||
        i00 != imp ||
        i00 != ipm
        ) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        } else if (i00 == 0) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        } else {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        }
    }
    }
    //
    // left and right edges
    //
    for (row = 1; row < h - 1; ++row) {
    col = w - 1;
    i00 =
        input[(h - 1 - row) * w * 4 + col * 4 + 0] +
        input[(h - 1 - row) * w * 4 + col * 4 + 1] +
        input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0m =
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 2];
    imm =
        input[(h - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - row) * w * 4 + (col - 1) * 4 + 2];
    ipm =
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 2];
    im0 =
        input[(h - row) * w * 4 + col * 4 + 0] +
        input[(h - row) * w * 4 + col * 4 + 1] +
        input[(h - row) * w * 4 + col * 4 + 2];
    ip0 =
        input[(h - 2 - row) * w * 4 + col * 4 + 0] +
        input[(h - 2 - row) * w * 4 + col * 4 + 1] +
        input[(h - 2 - row) * w * 4 + col * 4 + 2];
    if (i00 != i0m || i00 != ip0 || i00 != ipm || i00 != im0 || i00 != imm) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    col = 0;
    i00 =
        input[(h - 1 - row) * w * 4 + col * 4 + 0] +
        input[(h - 1 - row) * w * 4 + col * 4 + 1] +
        input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0p =
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 2];
    imp =
        input[(h - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - row) * w * 4 + (col + 1) * 4 + 2];
    ipp =
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 2];
    im0 =
        input[(h - row) * w * 4 + col * 4 + 0] +
        input[(h - row) * w * 4 + col * 4 + 1] +
        input[(h - row) * w * 4 + col * 4 + 2];
    ip0 =
        input[(h - 2 - row) * w * 4 + col * 4 + 0] +
        input[(h - 2 - row) * w * 4 + col * 4 + 1] +
        input[(h - 2 - row) * w * 4 + col * 4 + 2];
    if (i00 != i0p || i00 != ip0 || i00 != ipp || i00 != im0 || i00 != imp) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    }
    //
    // top and bottom edges
    //
    for (col = 1; col < w - 1; ++col) {
    row = h - 1;
    i00 =
        input[(h - 1 - row) * w * 4 + col * 4 + 0] +
        input[(h - 1 - row) * w * 4 + col * 4 + 1] +
        input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0m =
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 2];
    i0p =
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 2];
    imm =
        input[(h - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - row) * w * 4 + (col - 1) * 4 + 2];
    im0 =
        input[(h - row) * w * 4 + col * 4 + 0] +
        input[(h - row) * w * 4 + col * 4 + 1] +
        input[(h - row) * w * 4 + col * 4 + 2];
    imp =
        input[(h - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - row) * w * 4 + (col + 1) * 4 + 2];
    if (i00 != i0m || i00 != i0p || i00 != imm || i00 != im0 || i00 != imp) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    row = 0;
    i00 =
        input[(h - 1 - row) * w * 4 + col * 4 + 0] +
        input[(h - 1 - row) * w * 4 + col * 4 + 1] +
        input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0m =
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 2];
    i0p =
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 2];
    ipm =
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 0] +
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 1] +
        input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 2];
    ip0 =
        input[(h - 2 - row) * w * 4 + col * 4 + 0] +
        input[(h - 2 - row) * w * 4 + col * 4 + 1] +
        input[(h - 2 - row) * w * 4 + col * 4 + 2];
    ipp =
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 0] +
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 1] +
        input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 2];
    if (i00 != i0m || i00 != i0p || i00 != ipm || i00 != ip0 || i00 != ipp) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
        output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
        output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    }
    //
    // corners
    //
    row = 0;
    col = 0;
    i00 =
    input[(h - 1 - row) * w * 4 + col * 4 + 0] +
    input[(h - 1 - row) * w * 4 + col * 4 + 1] +
    input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0p =
    input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 0] +
    input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 1] +
    input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 2];
    ip0 =
    input[(h - 2 - row) * w * 4 + col * 4 + 0] +
    input[(h - 2 - row) * w * 4 + col * 4 + 1] +
    input[(h - 2 - row) * w * 4 + col * 4 + 2];
    ipp =
    input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 0] +
    input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 1] +
    input[(h - 2 - row) * w * 4 + (col + 1) * 4 + 2];
    if (i00 != i0p || i00 != ip0 || i00 != ipp) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    row = 0;
    col = w - 1;
    i00 =
    input[(h - 1 - row) * w * 4 + col * 4 + 0] +
    input[(h - 1 - row) * w * 4 + col * 4 + 1] +
    input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0m =
    input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 0] +
    input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 1] +
    input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 2];
    ip0 =
    input[(h - 2 - row) * w * 4 + col * 4 + 0] +
    input[(h - 2 - row) * w * 4 + col * 4 + 1] +
    input[(h - 2 - row) * w * 4 + col * 4 + 2];
    ipm =
    input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 0] +
    input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 1] +
    input[(h - 2 - row) * w * 4 + (col - 1) * 4 + 2];
    if (i00 != i0m || i00 != ip0 || i00 != ipm) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    row = h - 1;
    col = 0;
    i00 =
    input[(h - 1 - row) * w * 4 + col * 4 + 0] +
    input[(h - 1 - row) * w * 4 + col * 4 + 1] +
    input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0p =
    input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 0] +
    input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 1] +
    input[(h - 1 - row) * w * 4 + (col + 1) * 4 + 2];
    im0 =
    input[(h - row) * w * 4 + col * 4 + 0] +
    input[(h - row) * w * 4 + col * 4 + 1] +
    input[(h - row) * w * 4 + col * 4 + 2];
    imp =
    input[(h - row) * w * 4 + (col + 1) * 4 + 0] +
    input[(h - row) * w * 4 + (col + 1) * 4 + 1] +
    input[(h - row) * w * 4 + (col + 1) * 4 + 2];
    if (i00 != i0p || i00 != im0 || i00 != imp) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }
    row = h - 1;
    col = w - 1;
    i00 =
    input[(h - 1 - row) * w * 4 + col * 4 + 0] +
    input[(h - 1 - row) * w * 4 + col * 4 + 1] +
    input[(h - 1 - row) * w * 4 + col * 4 + 2];
    i0m =
    input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 0] +
    input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 1] +
    input[(h - 1 - row) * w * 4 + (col - 1) * 4 + 2];
    im0 =
    input[(h - row) * w * 4 + col * 4 + 0] +
    input[(h - row) * w * 4 + col * 4 + 1] +
    input[(h - row) * w * 4 + col * 4 + 2];
    imm =
    input[(h - row) * w * 4 + (col - 1) * 4 + 0] +
    input[(h - row) * w * 4 + (col - 1) * 4 + 1] +
    input[(h - row) * w * 4 + (col - 1) * 4 + 2];
    if (i00 != i0m || i00 != im0 || i00 != imm) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else if (i00 == 0) {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    } else {
    output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
    output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
    }

    const imgData = new ImageData(output, w, h);

    return imgData;
};

const orientEdgesHelper = imageRGBA => {
    var h = imageRGBA.height;
    var w = imageRGBA.width;
    var input = imageRGBA.data;
    var output = new Uint8ClampedArray(h * w * 4);
    var row, col;
    var boundary = 0;
    var interior = 1;
    var exterior = 2;
    var alpha = 3;
    var northsouth = 0;
    var north = 128;
    var south = 64;
    var eastwest = 1;
    var east = 128;
    var west = 64;
    var startstop = 2;
    var start = 128;
    var stop = 64;
    //
    // orient body states
    //
    for (row = 1; row < h - 1; ++row) {
    for (col = 1; col < w - 1; ++col) {
        output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
        output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
        if (input[(h - 1 - row) * w * 4 + col * 4 + boundary] != 0) {
        if (
            input[(h - 1 - (row + 1)) * w * 4 + col * 4 + boundary] != 0 &&
            (input[(h - 1 - row) * w * 4 + (col + 1) * 4 + interior] != 0 ||
            input[(h - 1 - (row + 1)) * w * 4 + (col + 1) * 4 + interior] !=
                0)
        )
            output[(h - 1 - row) * w * 4 + col * 4 + northsouth] |= north;
        if (
            input[(h - 1 - (row - 1)) * w * 4 + col * 4 + boundary] != 0 &&
            (input[(h - 1 - row) * w * 4 + (col - 1) * 4 + interior] != 0 ||
            input[(h - 1 - (row - 1)) * w * 4 + (col - 1) * 4 + interior] !=
                0)
        )
            output[(h - 1 - row) * w * 4 + col * 4 + northsouth] |= south;
        if (
            input[(h - 1 - row) * w * 4 + (col + 1) * 4 + boundary] != 0 &&
            (input[(h - 1 - (row - 1)) * w * 4 + col * 4 + interior] != 0 ||
            input[(h - 1 - (row - 1)) * w * 4 + (col + 1) * 4 + interior] !=
                0)
        )
            output[(h - 1 - row) * w * 4 + col * 4 + eastwest] |= east;
        if (
            input[(h - 1 - row) * w * 4 + (col - 1) * 4 + boundary] != 0 &&
            (input[(h - 1 - (row + 1)) * w * 4 + col * 4 + interior] != 0 ||
            input[(h - 1 - (row + 1)) * w * 4 + (col - 1) * 4 + interior] !=
                0)
        )
            output[(h - 1 - row) * w * 4 + col * 4 + eastwest] |= west;
        }
    }
    }
    //
    // orient edge states
    //
    for (col = 1; col < w - 1; ++col) {
    row = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    if (input[(h - 1 - row) * w * 4 + col * 4 + boundary] != 0) {
        if (
        input[(h - 1 - (row + 1)) * w * 4 + col * 4 + boundary] != 0 &&
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + interior] != 0
        ) {
        output[(h - 1 - row) * w * 4 + col * 4 + northsouth] |= north;
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= start;
        }
        if (input[(h - 1 - row) * w * 4 + (col - 1) * 4 + interior] != 0)
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= stop;
    }
    row = h - 1;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    if (input[(h - 1 - row) * w * 4 + col * 4 + boundary] != 0) {
        if (input[(h - 1 - row) * w * 4 + (col + 1) * 4 + interior] != 0)
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= stop;
        if (
        input[(h - 1 - (row - 1)) * w * 4 + col * 4 + boundary] != 0 &&
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + interior] != 0
        ) {
        output[(h - 1 - row) * w * 4 + col * 4 + northsouth] |= south;
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= start;
        }
    }
    }
    for (row = 1; row < h - 1; ++row) {
    col = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    if (input[(h - 1 - row) * w * 4 + col * 4 + boundary] != 0) {
        if (
        input[(h - 1 - row) * w * 4 + (col + 1) * 4 + boundary] != 0 &&
        input[(h - 1 - (row - 1)) * w * 4 + col * 4 + interior] != 0
        ) {
        output[(h - 1 - row) * w * 4 + col * 4 + eastwest] |= east;
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= start;
        }
        if (input[(h - 1 - (row + 1)) * w * 4 + col * 4 + interior] != 0)
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= stop;
    }
    col = w - 1;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    if (input[(h - 1 - row) * w * 4 + col * 4 + boundary] != 0) {
        if (input[(h - 1 - (row - 1)) * w * 4 + col * 4 + interior] != 0)
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= stop;
        if (
        input[(h - 1 - row) * w * 4 + (col - 1) * 4 + boundary] != 0 &&
        input[(h - 1 - (row + 1)) * w * 4 + col * 4 + interior] != 0
        ) {
        output[(h - 1 - row) * w * 4 + col * 4 + eastwest] |= west;
        output[(h - 1 - row) * w * 4 + col * 4 + startstop] |= start;
        }
    }
    }
    //
    // orient corner states (todo)
    //
    row = 0;
    col = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    row = h - 1;
    col = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    row = 0;
    col = w - 1;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;
    row = h - 1;
    col = w - 1;
    output[(h - 1 - row) * w * 4 + col * 4 + northsouth] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + eastwest] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + startstop] = 0;
    output[(h - 1 - row) * w * 4 + col * 4 + alpha] = 255;

    // var display = new Uint8ClampedArray(h*w*4)
    // var r,g,b,i
    // for (row = 0; row < h; ++row) {
    //   for (col = 0; col < w; ++col) {
    //     r = output[(h-1-row)*w*4+col*4+0]
    //     g = output[(h-1-row)*w*4+col*4+1]
    //     b = output[(h-1-row)*w*4+col*4+2]
    //     i = r+g+b
    //     if (i != 0) {
    //        display[(h-1-row)*w*4+col*4+0] = output[(h-1-row)*w*4+col*4+0]
    //        display[(h-1-row)*w*4+col*4+1] = output[(h-1-row)*w*4+col*4+1]
    //        display[(h-1-row)*w*4+col*4+2] = output[(h-1-row)*w*4+col*4+2]
    //        display[(h-1-row)*w*4+col*4+3] = output[(h-1-row)*w*4+col*4+3]
    //        }
    //     else {
    //        display[(h-1-row)*w*4+col*4+0] = 255
    //        display[(h-1-row)*w*4+col*4+1] = 255
    //        display[(h-1-row)*w*4+col*4+2] = 255
    //        display[(h-1-row)*w*4+col*4+3] = 255
    //        }
    //     }
    //  }

    const imgData = new ImageData(output, w, h);

    return imgData;
};

const vectorizeHelper = (imageRGBA, vectorFit = 1, sort = true) => {
    var h = imageRGBA.height;
    var w = imageRGBA.width;
    var input = imageRGBA.data;
    var northsouth = 0;
    var north = 128;
    var south = 64;
    var eastwest = 1;
    var east = 128;
    var west = 64;
    var startstop = 2;
    var start = 128;
    var stop = 64;
    var path = [];
    //
    // edge follower
    //
    function follow_edges(row, col) {
    if (
        input[(h - 1 - row) * w * 4 + col * 4 + northsouth] != 0 ||
        input[(h - 1 - row) * w * 4 + col * 4 + eastwest] != 0
    ) {
        path[path.length] = [[col, row]];
        while (1) {
        if (
            input[(h - 1 - row) * w * 4 + col * 4 + northsouth] & north
        ) {
            input[(h - 1 - row) * w * 4 + col * 4 + northsouth] =
            input[(h - 1 - row) * w * 4 + col * 4 + northsouth] &
            ~north;
            row += 1;
            path[path.length - 1][path[path.length - 1].length] = [
            col,
            row
            ];
        } else if (
            input[(h - 1 - row) * w * 4 + col * 4 + northsouth] & south
        ) {
            input[(h - 1 - row) * w * 4 + col * 4 + northsouth] =
            input[(h - 1 - row) * w * 4 + col * 4 + northsouth] &
            ~south;
            row -= 1;
            path[path.length - 1][path[path.length - 1].length] = [
            col,
            row
            ];
        } else if (
            input[(h - 1 - row) * w * 4 + col * 4 + eastwest] & east
        ) {
            input[(h - 1 - row) * w * 4 + col * 4 + eastwest] =
            input[(h - 1 - row) * w * 4 + col * 4 + eastwest] & ~east;
            col += 1;
            path[path.length - 1][path[path.length - 1].length] = [
            col,
            row
            ];
        } else if (
            input[(h - 1 - row) * w * 4 + col * 4 + eastwest] & west
        ) {
            input[(h - 1 - row) * w * 4 + col * 4 + eastwest] =
            input[(h - 1 - row) * w * 4 + col * 4 + eastwest] & ~west;
            col -= 1;
            path[path.length - 1][path[path.length - 1].length] = [
            col,
            row
            ];
        } else break;
        }
    }
    }
    //
    // follow boundary starts
    //
    for (var row = 1; row < h - 1; ++row) {
    col = 0;
    follow_edges(row, col);
    col = w - 1;
    follow_edges(row, col);
    }
    for (var col = 1; col < w - 1; ++col) {
    row = 0;
    follow_edges(row, col);
    row = h - 1;
    follow_edges(row, col);
    }
    //
    // follow interior paths
    //
    for (var row = 1; row < h - 1; ++row) {
    for (var col = 1; col < w - 1; ++col) {
        follow_edges(row, col);
    }
    }
    //
    // vectorize path
    //
    var error = vectorFit;
    var vecpath = [];
    for (var seg = 0; seg < path.length; ++seg) {
    var x0 = path[seg][0][0];
    var y0 = path[seg][0][1];
    vecpath[vecpath.length] = [[x0, y0]];
    var xsum = x0;
    var ysum = y0;
    var sum = 1;
    for (var pt = 1; pt < path[seg].length; ++pt) {
        var xold = x;
        var yold = y;
        var x = path[seg][pt][0];
        var y = path[seg][pt][1];
        if (sum == 1) {
        xsum += x;
        ysum += y;
        sum += 1;
        } else {
        var xmean = xsum / sum;
        var ymean = ysum / sum;
        var dx = xmean - x0;
        var dy = ymean - y0;
        var d = Math.sqrt(dx * dx + dy * dy);
        var nx = dy / d;
        var ny = -dx / d;
        var l = Math.abs(nx * (x - x0) + ny * (y - y0));
        if (l < error) {
            xsum += x;
            ysum += y;
            sum += 1;
        } else {
            vecpath[vecpath.length - 1][
            vecpath[vecpath.length - 1].length
            ] = [xold, yold];
            x0 = xold;
            y0 = yold;
            xsum = xold;
            ysum = yold;
            sum = 1;
        }
        }
        if (pt == path[seg].length - 1) {
        vecpath[vecpath.length - 1][
            vecpath[vecpath.length - 1].length
        ] = [x, y];
        }
    }
    }
    //
    // sort path
    //
    if (vecpath.length > 1 && sort == true) {
    var dmin = w * w + h * h;
    var segmin = null;
    for (var seg = 0; seg < vecpath.length; ++seg) {
        var x = vecpath[seg][0][0];
        var y = vecpath[seg][0][0];
        var d = x * x + y * y;
        if (d < dmin) {
        dmin = d;
        segmin = seg;
        }
    }
    if (segmin != null) {
        var sortpath = [vecpath[segmin]];
        vecpath.splice(segmin, 1);
    }
    while (vecpath.length > 0) {
        var dmin = w * w + h * h;
        var x0 =
        sortpath[sortpath.length - 1][
            sortpath[sortpath.length - 1].length - 1
        ][0];
        var y0 =
        sortpath[sortpath.length - 1][
            sortpath[sortpath.length - 1].length - 1
        ][1];
        segmin = null;
        for (var seg = 0; seg < vecpath.length; ++seg) {
        var x = vecpath[seg][0][0];
        var y = vecpath[seg][0][1];
        var d = (x - x0) * (x - x0) + (y - y0) * (y - y0);
        if (d < dmin) {
            dmin = d;
            segmin = seg;
        }
        }
        if (segmin != null) {
        sortpath[sortpath.length] = vecpath[segmin];
        vecpath.splice(segmin, 1);
        }
    }
    } else if (
    (vecpath.length > 1 && sort == false) ||
    vecpath.length == 1
    )
    sortpath = vecpath;
    else sortpath = [];

    return sortpath;
};

const test = () => console.log("import is working");
