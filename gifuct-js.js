function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var gif = {};

var lib = {};

Object.defineProperty(lib, "__esModule", {
  value: true
});
lib.loop = lib.conditional = parse_1 = lib.parse = void 0;

var parse = function parse(stream, schema) {
  var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : result;

  if (Array.isArray(schema)) {
    schema.forEach(function (partSchema) {
      return parse(stream, partSchema, result, parent);
    });
  } else if (typeof schema === 'function') {
    schema(stream, result, parent, parse);
  } else {
    var key = Object.keys(schema)[0];

    if (Array.isArray(schema[key])) {
      parent[key] = {};
      parse(stream, schema[key], result, parent[key]);
    } else {
      parent[key] = schema[key](stream, result, parent, parse);
    }
  }

  return result;
};

var parse_1 = lib.parse = parse;

var conditional = function conditional(schema, conditionFunc) {
  return function (stream, result, parent, parse) {
    if (conditionFunc(stream, result, parent)) {
      parse(stream, schema, result, parent);
    }
  };
};

lib.conditional = conditional;

var loop = function loop(schema, continueFunc) {
  return function (stream, result, parent, parse) {
    var arr = [];

    while (continueFunc(stream, result, parent)) {
      var newParent = {};
      parse(stream, schema, result, newParent);
      arr.push(newParent);
    }

    return arr;
  };
};

lib.loop = loop;

var uint8 = {};

Object.defineProperty(uint8, "__esModule", {
  value: true
});
uint8.readBits = uint8.readArray = uint8.readUnsigned = uint8.readString = uint8.peekBytes = uint8.readBytes = uint8.peekByte = uint8.readByte = buildStream_1 = uint8.buildStream = void 0;

// Default stream and parsers for Uint8TypedArray data type
var buildStream = function buildStream(uint8Data) {
  return {
    data: uint8Data,
    pos: 0
  };
};

var buildStream_1 = uint8.buildStream = buildStream;

var readByte = function readByte() {
  return function (stream) {
    return stream.data[stream.pos++];
  };
};

uint8.readByte = readByte;

var peekByte = function peekByte() {
  var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  return function (stream) {
    return stream.data[stream.pos + offset];
  };
};

uint8.peekByte = peekByte;

var readBytes = function readBytes(length) {
  return function (stream) {
    return stream.data.subarray(stream.pos, stream.pos += length);
  };
};

uint8.readBytes = readBytes;

var peekBytes = function peekBytes(length) {
  return function (stream) {
    return stream.data.subarray(stream.pos, stream.pos + length);
  };
};

uint8.peekBytes = peekBytes;

var readString = function readString(length) {
  return function (stream) {
    return Array.from(readBytes(length)(stream)).map(function (value) {
      return String.fromCharCode(value);
    }).join('');
  };
};

uint8.readString = readString;

var readUnsigned = function readUnsigned(littleEndian) {
  return function (stream) {
    var bytes = readBytes(2)(stream);
    return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1];
  };
};

uint8.readUnsigned = readUnsigned;

var readArray = function readArray(byteSize, totalOrFunc) {
  return function (stream, result, parent) {
    var total = typeof totalOrFunc === 'function' ? totalOrFunc(stream, result, parent) : totalOrFunc;
    var parser = readBytes(byteSize);
    var arr = new Array(total);

    for (var i = 0; i < total; i++) {
      arr[i] = parser(stream);
    }

    return arr;
  };
};

uint8.readArray = readArray;

var subBitsTotal = function subBitsTotal(bits, startIndex, length) {
  var result = 0;

  for (var i = 0; i < length; i++) {
    result += bits[startIndex + i] && Math.pow(2, length - i - 1);
  }

  return result;
};

var readBits = function readBits(schema) {
  return function (stream) {
    var _byte = readByte()(stream); // convert the byte to bit array


    var bits = new Array(8);

    for (var i = 0; i < 8; i++) {
      bits[7 - i] = !!(_byte & 1 << i);
    } // convert the bit array to values based on the schema


    return Object.keys(schema).reduce(function (res, key) {
      var def = schema[key];

      if (def.length) {
        res[key] = subBitsTotal(bits, def.index, def.length);
      } else {
        res[key] = bits[def.index];
      }

      return res;
    }, {});
  };
};

uint8.readBits = readBits;

(function (exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ = lib;

var _uint = uint8;

// a set of 0x00 terminated subblocks
var subBlocksSchema = {
  blocks: function blocks(stream) {
    var terminator = 0x00;
    var chunks = [];
    var streamSize = stream.data.length;
    var total = 0;

    for (var size = (0, _uint.readByte)()(stream); size !== terminator; size = (0, _uint.readByte)()(stream)) {
      // catch corrupted files with no terminator
      if (stream.pos + size >= streamSize) {
        var availableSize = streamSize - stream.pos;
        chunks.push((0, _uint.readBytes)(availableSize)(stream));
        total += availableSize;
        break;
      }

      chunks.push((0, _uint.readBytes)(size)(stream));
      total += size;
    }

    var result = new Uint8Array(total);
    var offset = 0;

    for (var i = 0; i < chunks.length; i++) {
      result.set(chunks[i], offset);
      offset += chunks[i].length;
    }

    return result;
  }
}; // global control extension

var gceSchema = (0, _.conditional)({
  gce: [{
    codes: (0, _uint.readBytes)(2)
  }, {
    byteSize: (0, _uint.readByte)()
  }, {
    extras: (0, _uint.readBits)({
      future: {
        index: 0,
        length: 3
      },
      disposal: {
        index: 3,
        length: 3
      },
      userInput: {
        index: 6
      },
      transparentColorGiven: {
        index: 7
      }
    })
  }, {
    delay: (0, _uint.readUnsigned)(true)
  }, {
    transparentColorIndex: (0, _uint.readByte)()
  }, {
    terminator: (0, _uint.readByte)()
  }]
}, function (stream) {
  var codes = (0, _uint.peekBytes)(2)(stream);
  return codes[0] === 0x21 && codes[1] === 0xf9;
}); // image pipeline block

var imageSchema = (0, _.conditional)({
  image: [{
    code: (0, _uint.readByte)()
  }, {
    descriptor: [{
      left: (0, _uint.readUnsigned)(true)
    }, {
      top: (0, _uint.readUnsigned)(true)
    }, {
      width: (0, _uint.readUnsigned)(true)
    }, {
      height: (0, _uint.readUnsigned)(true)
    }, {
      lct: (0, _uint.readBits)({
        exists: {
          index: 0
        },
        interlaced: {
          index: 1
        },
        sort: {
          index: 2
        },
        future: {
          index: 3,
          length: 2
        },
        size: {
          index: 5,
          length: 3
        }
      })
    }]
  }, (0, _.conditional)({
    lct: (0, _uint.readArray)(3, function (stream, result, parent) {
      return Math.pow(2, parent.descriptor.lct.size + 1);
    })
  }, function (stream, result, parent) {
    return parent.descriptor.lct.exists;
  }), {
    data: [{
      minCodeSize: (0, _uint.readByte)()
    }, subBlocksSchema]
  }]
}, function (stream) {
  return (0, _uint.peekByte)()(stream) === 0x2c;
}); // plain text block

var textSchema = (0, _.conditional)({
  text: [{
    codes: (0, _uint.readBytes)(2)
  }, {
    blockSize: (0, _uint.readByte)()
  }, {
    preData: function preData(stream, result, parent) {
      return (0, _uint.readBytes)(parent.text.blockSize)(stream);
    }
  }, subBlocksSchema]
}, function (stream) {
  var codes = (0, _uint.peekBytes)(2)(stream);
  return codes[0] === 0x21 && codes[1] === 0x01;
}); // application block

var applicationSchema = (0, _.conditional)({
  application: [{
    codes: (0, _uint.readBytes)(2)
  }, {
    blockSize: (0, _uint.readByte)()
  }, {
    id: function id(stream, result, parent) {
      return (0, _uint.readString)(parent.blockSize)(stream);
    }
  }, subBlocksSchema]
}, function (stream) {
  var codes = (0, _uint.peekBytes)(2)(stream);
  return codes[0] === 0x21 && codes[1] === 0xff;
}); // comment block

var commentSchema = (0, _.conditional)({
  comment: [{
    codes: (0, _uint.readBytes)(2)
  }, subBlocksSchema]
}, function (stream) {
  var codes = (0, _uint.peekBytes)(2)(stream);
  return codes[0] === 0x21 && codes[1] === 0xfe;
});
var schema = [{
  header: [{
    signature: (0, _uint.readString)(3)
  }, {
    version: (0, _uint.readString)(3)
  }]
}, {
  lsd: [{
    width: (0, _uint.readUnsigned)(true)
  }, {
    height: (0, _uint.readUnsigned)(true)
  }, {
    gct: (0, _uint.readBits)({
      exists: {
        index: 0
      },
      resolution: {
        index: 1,
        length: 3
      },
      sort: {
        index: 4
      },
      size: {
        index: 5,
        length: 3
      }
    })
  }, {
    backgroundColorIndex: (0, _uint.readByte)()
  }, {
    pixelAspectRatio: (0, _uint.readByte)()
  }]
}, (0, _.conditional)({
  gct: (0, _uint.readArray)(3, function (stream, result) {
    return Math.pow(2, result.lsd.gct.size + 1);
  })
}, function (stream, result) {
  return result.lsd.gct.exists;
}), // content frames
{
  frames: (0, _.loop)([gceSchema, applicationSchema, commentSchema, imageSchema, textSchema], function (stream) {
    var nextCode = (0, _uint.peekByte)()(stream); // rather than check for a terminator, we should check for the existence
    // of an ext or image block to avoid infinite loops
    //var terminator = 0x3B;
    //return nextCode !== terminator;

    return nextCode === 0x21 || nextCode === 0x2c;
  })
}];
var _default = schema;
exports["default"] = _default;
}(gif));

var GIF = /*@__PURE__*/getDefaultExportFromCjs(gif);

/**
 * Deinterlace function from https://github.com/shachaf/jsgif
 */

const deinterlace = (pixels, width) => {
  const newPixels = new Array(pixels.length);
  const rows = pixels.length / width;
  const cpRow = function(toRow, fromRow) {
    const fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
    newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
  };

  // See appendix E.
  const offsets = [0, 4, 2, 1];
  const steps = [8, 8, 4, 2];

  var fromRow = 0;
  for (var pass = 0; pass < 4; pass++) {
    for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
      cpRow(toRow, fromRow);
      fromRow++;
    }
  }

  return newPixels
};

/**
 * javascript port of java LZW decompression
 * Original java author url: https://gist.github.com/devunwired/4479231
 */

const lzw = (minCodeSize, data, pixelCount) => {
  const MAX_STACK_SIZE = 4096;
  const nullCode = -1;
  const npix = pixelCount;
  var available,
    clear,
    code_mask,
    code_size,
    end_of_information,
    in_code,
    old_code,
    bits,
    code,
    i,
    datum,
    data_size,
    first,
    top,
    bi,
    pi;

  const dstPixels = new Array(pixelCount);
  const prefix = new Array(MAX_STACK_SIZE);
  const suffix = new Array(MAX_STACK_SIZE);
  const pixelStack = new Array(MAX_STACK_SIZE + 1);

  // Initialize GIF data stream decoder.
  data_size = minCodeSize;
  clear = 1 << data_size;
  end_of_information = clear + 1;
  available = clear + 2;
  old_code = nullCode;
  code_size = data_size + 1;
  code_mask = (1 << code_size) - 1;
  for (code = 0; code < clear; code++) {
    prefix[code] = 0;
    suffix[code] = code;
  }

  // Decode GIF pixel stream.
  var datum, bits, first, top, pi, bi;
  datum = bits = first = top = pi = bi = 0;
  for (i = 0; i < npix; ) {
    if (top === 0) {
      if (bits < code_size) {
        // get the next byte
        datum += data[bi] << bits;

        bits += 8;
        bi++;
        continue
      }
      // Get the next code.
      code = datum & code_mask;
      datum >>= code_size;
      bits -= code_size;
      // Interpret the code
      if (code > available || code == end_of_information) {
        break
      }
      if (code == clear) {
        // Reset decoder.
        code_size = data_size + 1;
        code_mask = (1 << code_size) - 1;
        available = clear + 2;
        old_code = nullCode;
        continue
      }
      if (old_code == nullCode) {
        pixelStack[top++] = suffix[code];
        old_code = code;
        first = code;
        continue
      }
      in_code = code;
      if (code == available) {
        pixelStack[top++] = first;
        code = old_code;
      }
      while (code > clear) {
        pixelStack[top++] = suffix[code];
        code = prefix[code];
      }

      first = suffix[code] & 0xff;
      pixelStack[top++] = first;

      // add a new string to the table, but only if space is available
      // if not, just continue with current table until a clear code is found
      // (deferred clear code implementation as per GIF spec)
      if (available < MAX_STACK_SIZE) {
        prefix[available] = old_code;
        suffix[available] = first;
        available++;
        if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
          code_size++;
          code_mask += available;
        }
      }
      old_code = in_code;
    }
    // Pop a pixel off the pixel stack.
    top--;
    dstPixels[pi++] = pixelStack[top];
    i++;
  }

  for (i = pi; i < npix; i++) {
    dstPixels[i] = 0; // clear missing pixels
  }

  return dstPixels
};

const parseGIF = arrayBuffer => {
  const byteData = new Uint8Array(arrayBuffer);
  return parse_1(buildStream_1(byteData), GIF)
};

const generatePatch = image => {
  const totalPixels = image.pixels.length;
  const patchData = new Uint8ClampedArray(totalPixels * 4);
  for (var i = 0; i < totalPixels; i++) {
    const pos = i * 4;
    const colorIndex = image.pixels[i];
    const color = image.colorTable[colorIndex] || [0, 0, 0];
    patchData[pos] = color[0];
    patchData[pos + 1] = color[1];
    patchData[pos + 2] = color[2];
    patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0;
  }

  return patchData
};

const decompressFrame = (frame, gct, buildImagePatch) => {
  if (!frame.image) {
    console.warn('gif frame does not have associated image.');
    return
  }

  const { image } = frame;

  // get the number of pixels
  const totalPixels = image.descriptor.width * image.descriptor.height;
  // do lzw decompression
  var pixels = lzw(image.data.minCodeSize, image.data.blocks, totalPixels);

  // deal with interlacing if necessary
  if (image.descriptor.lct.interlaced) {
    pixels = deinterlace(pixels, image.descriptor.width);
  }

  const resultImage = {
    pixels: pixels,
    dims: {
      top: frame.image.descriptor.top,
      left: frame.image.descriptor.left,
      width: frame.image.descriptor.width,
      height: frame.image.descriptor.height
    }
  };

  // color table
  if (image.descriptor.lct && image.descriptor.lct.exists) {
    resultImage.colorTable = image.lct;
  } else {
    resultImage.colorTable = gct;
  }

  // add per frame relevant gce information
  if (frame.gce) {
    resultImage.delay = (frame.gce.delay || 10) * 10; // convert to ms
    resultImage.disposalType = frame.gce.extras.disposal;
    // transparency
    if (frame.gce.extras.transparentColorGiven) {
      resultImage.transparentIndex = frame.gce.transparentColorIndex;
    }
  }

  // create canvas usable imagedata if desired
  if (buildImagePatch) {
    resultImage.patch = generatePatch(resultImage);
  }

  return resultImage
};

const decompressFrames = (parsedGif, buildImagePatches) => {
  return parsedGif.frames
    .filter(f => f.image)
    .map(f => decompressFrame(f, parsedGif.gct, buildImagePatches))
};

export { decompressFrame, decompressFrames, parseGIF };
