import { BufferGeometry, Vector2, Vector3, Float32BufferAttribute } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as Curves from 'three/src/extras/curves/Curves.js';

class StreetLineGeometry extends BufferGeometry {
  constructor(path = new Curves.QuadraticBezierCurve3(new Vector3(-1, -1, 0), new Vector3(-1, 1, 0), new Vector3(1, 1, 0)), tubularSegments = 64, radiusX = 1, radiusY = 1, radialSegments = 2, closed = false) {
    super();
    this.type = 'StreetLineGeometry';

    this.parameters = {
      path,
      tubularSegments,
      radiusX,
      radiusY,
      radialSegments,
      closed,
    };

    const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new Vector3();
    const normal = new Vector3();
    const uv = new Vector2();
    let P = new Vector3();

    // buffer

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    // functions

    function generateBufferData() {
      for (let i = 0; i <= tubularSegments; i++) {
        generateSegment(i);
      }

      // if the geometry is not closed, generate the last row of vertices and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

      generateSegment((closed === false) ? tubularSegments : 0);

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateIndices();

      // generateEnds();
    }

    function generateSegment(i) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      // retrieve corresponding normal and binormal

      const T = frames.tangents[i];
      // const N = frames.normals[ i ];
      // const B = frames.binormals[ i ];

      const N = new Vector3(0, 1, 0);
      const B = T.clone().cross(N).normalize();

      // const N = new Vector3(1,0,0);
      // const B = new Vector3(0,0,1);
      // const ZERO = new Vector3(0,0,0);
      // const UP = new Vector3(0,1,0);

      // generate normals and vertices for the current segment

      const radius = radiusX;
      for (let j = 0; j < radialSegments; j++) {
        let v = j * Math.PI;
        v -= Math.PI / 2;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        // normal

        normal.x = (cos * N.x + sin * B.x);
        normal.y = (cos * N.y + sin * B.y);
        normal.z = (cos * N.z + sin * B.z);
        normal.normalize();

        normals.push(N.x, N.y, N.z);

        // vertex

        vertex.x = P.x + radiusX * normal.x;
        vertex.y = P.y + radiusY * normal.y;
        vertex.z = P.z + radius * normal.z;

        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    function generateIndices() {
      for (let j = 1; j <= tubularSegments; j++) {
        // for ( let i = 1; i <= radialSegments; i ++ ) {
        const i = 1;

        const a = (radialSegments) * (j - 1) + (i - 1);
        const b = (radialSegments) * j + (i - 1);
        const c = (radialSegments) * j + i;
        const d = (radialSegments) * (j - 1) + i;

        // faces

        indices.push(a, d, b);
        indices.push(b, d, c);

        // }
      }
    }

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
          uv.x = j / radialSegments;
          uv.y = i / tubularSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }

    /* function generateEnds() {
      // const offset = vertices.length / 3 / 2;

      const ts = [
        1,
        tubularSegments + 1,
      ];

      for ( const j of ts ) {

        const a = ( radialSegments + 1 ) * ( j - 1 ) + 0;
        const b = ( radialSegments + 1 ) * ( j - 1 ) + 1;
        const c = ( radialSegments + 1 ) * ( j - 1 ) + 2;
        const d = ( radialSegments + 1 ) * ( j - 1 ) + 3;

        // faces

        if (j === 1) {
          indices.push( a, b, d );
          indices.push( b, c, d );
        } else {
          indices.push( d, b, a );
          indices.push( d, c, b );
        }

      }
    } */
  }

  toJSON() {
    const data = super.toJSON();

    data.path = this.parameters.path.toJSON();

    return data;
  }

  static fromJSON(data) {
    // This only works for built-in curves (e.g. CatmullRomCurve3).
    // User defined curves or instances of CurvePath will not be deserialized.
    return new StreetFlatGeometry(
      new Curves[data.path.type]().fromJSON(data.path),
      data.tubularSegments,
      data.radiusX,
      data.radiusY,
      data.radialSegments,
      data.closed,
    );
  }
}

class StreetFlatGeometry extends BufferGeometry {
  constructor(path = new Curves.QuadraticBezierCurve3(new Vector3(-1, -1, 0), new Vector3(-1, 1, 0), new Vector3(1, 1, 0)), tubularSegments = 64, radiusX = 1, radiusY = 1, radialSegments = 8, closed = false) {
    super();
    this.type = 'StreetFlatGeometry';

    this.parameters = {
      path,
      tubularSegments,
      radiusX,
      radiusY,
      radialSegments,
      closed,
    };

    const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new Vector3();
    const normal = new Vector3();
    const uv = new Vector2();
    let P = new Vector3();

    // buffer

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    // functions

    function generateBufferData() {
      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i);
      }

      // if the geometry is not closed, generate the last row of vertices and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

      generateSegment((closed === false) ? tubularSegments : 0);

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateIndices();

      generateEnds();
    }

    function generateSegment(i) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      // retrieve corresponding normal and binormal

      const T = frames.tangents[i];
      // const N = frames.normals[ i ];
      // const B = frames.binormals[ i ];

      const N = new Vector3(0, 1, 0);
      const B = T.clone().cross(N).normalize();

      // const N = new Vector3(1,0,0);
      // const B = new Vector3(0,0,1);
      // const ZERO = new Vector3(0,0,0);
      // const UP = new Vector3(0,1,0);

      // generate normals and vertices for the current segment

      const radius = radiusX;
      /* const ds = [
        [-1, -1],
        [-1, 1],
        [1, 1],
        [1, -1],
      ];
      ds.push(ds[0]);
      ds.reverse(); */
      /* for (const [dx, dy] of ds) {
      // for (let dy = -1; dy <= 1; dy += 2) {
        // for (let dx = -1; dx <= 1; dx += 2) {

        // }
      } */
      for (let j = 0; j <= radialSegments; j++) {
        let v = j / radialSegments * Math.PI * 2;
        v -= Math.PI / 4;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        // normal

        normal.x = (cos * N.x + sin * B.x);
        normal.y = (cos * N.y + sin * B.y);
        normal.z = (cos * N.z + sin * B.z);
        normal.normalize();

        normals.push(normal.x, normal.y, normal.z);

        // vertex

        vertex.x = P.x + radiusX * normal.x;
        vertex.y = P.y + radiusY * normal.y;
        vertex.z = P.z + radius * normal.z;

        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    function generateIndices() {
      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1);
          const b = (radialSegments + 1) * j + (i - 1);
          const c = (radialSegments + 1) * j + i;
          const d = (radialSegments + 1) * (j - 1) + i;

          // faces

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
    }

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }

    function generateEnds() {
      // const offset = vertices.length / 3 / 2;

      const ts = [
        1,
        tubularSegments + 1,
      ];

      for (const j of ts) {
        const a = (radialSegments + 1) * (j - 1) + 0;
        const b = (radialSegments + 1) * (j - 1) + 1;
        const c = (radialSegments + 1) * (j - 1) + 2;
        const d = (radialSegments + 1) * (j - 1) + 3;

        // faces

        if (j === 1) {
          indices.push(a, b, d);
          indices.push(b, c, d);
        } else {
          indices.push(d, b, a);
          indices.push(d, c, b);
        }
      }
    }
  }

  toJSON() {
    const data = super.toJSON();

    data.path = this.parameters.path.toJSON();

    return data;
  }

  static fromJSON(data) {
    // This only works for built-in curves (e.g. CatmullRomCurve3).
    // User defined curves or instances of CurvePath will not be deserialized.
    return new StreetFlatGeometry(
      new Curves[data.path.type]().fromJSON(data.path),
      data.tubularSegments,
      data.radiusX,
      data.radiusY,
      data.radialSegments,
      data.closed,
    );
  }
}

class StreetOctagonGeometry extends BufferGeometry {
  constructor(path = new Curves.QuadraticBezierCurve3(new Vector3(-1, -1, 0), new Vector3(-1, 1, 0), new Vector3(1, 1, 0)), tubularSegments = 64, radiusX = 1, radiusY = 1, radialSegments = 8, closed = false) {
    super();
    this.type = 'StreetOctagonGeometry';

    this.parameters = {
      path,
      tubularSegments,
      radiusX,
      radiusY,
      radialSegments,
      closed,
    };

    const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new Vector3();
    const normal = new Vector3();
    const uv = new Vector2();
    let P = new Vector3();

    // buffer

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    // functions

    function generateBufferData() {
      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i, radiusX);
      }
      generateSegment((closed === false) ? tubularSegments : 0, radiusX);

      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i, radiusX - radiusY);
      }
      generateSegment((closed === false) ? tubularSegments : 0, radiusX - radiusY);

      // if the geometry is not closed, generate the last row of vertices and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateIndices();

      generateEnds();
    }

    function generateSegment(i, radius) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      // retrieve corresponding normal and binormal

      const T = frames.tangents[i];
      const N = new Vector3(0, 1, 0);
      const B = T.clone().cross(N).normalize();

      for (let j = 0; j <= radialSegments; j++) {
        let v = j / radialSegments * Math.PI * 2;
        v -= Math.PI / 4;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        // normal

        normal.x = (cos * N.x + sin * B.x);
        normal.y = (cos * N.y + sin * B.y);
        normal.z = (cos * N.z + sin * B.z);
        normal.normalize();

        normals.push(normal.x, normal.y, normal.z);

        // vertex

        vertex.x = P.x + radius * normal.x;
        vertex.y = P.y + radius * normal.y;
        vertex.z = P.z + radius * normal.z;

        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    function generateIndices() {
      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1);
          const b = (radialSegments + 1) * j + (i - 1);
          const c = (radialSegments + 1) * j + i;
          const d = (radialSegments + 1) * (j - 1) + i;

          // faces

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const offset = vertices.length / 3 / 2;

      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1) + offset;
          const b = (radialSegments + 1) * j + (i - 1) + offset;
          const c = (radialSegments + 1) * j + i + offset;
          const d = (radialSegments + 1) * (j - 1) + i + offset;

          // faces

          indices.push(d, b, a);
          indices.push(d, c, b);
        }
      }
    }

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }

      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }

    function generateEnds() {
      const offset = vertices.length / 3 / 2;

      const ts = [
        1,
        tubularSegments + 1,
      ];

      for (const j of ts) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1) + offset;
          const b = (radialSegments + 1) * (j - 1) + (i - 1);
          const c = (radialSegments + 1) * (j - 1) + i;
          const d = (radialSegments + 1) * (j - 1) + i + offset;

          // faces

          if (j === 1) {
            indices.push(a, b, d);
            indices.push(b, c, d);
          } else {
            indices.push(d, b, a);
            indices.push(d, c, b);
          }
        }
      }
    }
  }

  toJSON() {
    const data = super.toJSON();

    data.path = this.parameters.path.toJSON();

    return data;
  }

  static fromJSON(data) {
    // This only works for built-in curves (e.g. CatmullRomCurve3).
    // User defined curves or instances of CurvePath will not be deserialized.
    return new StreetFlatGeometry(
      new Curves[data.path.type]().fromJSON(data.path),
      data.tubularSegments,
      data.radiusX,
      data.radiusY,
      data.radialSegments,
      data.closed,
    );
  }
}

class StreetHalfpipeGeometry extends BufferGeometry {
  constructor(path = new Curves.QuadraticBezierCurve3(new Vector3(-1, -1, 0), new Vector3(-1, 1, 0), new Vector3(1, 1, 0)), tubularSegments = 64, radiusX = 1, radiusY = 1, radialSegments = 8, closed = false) {
    super();
    this.type = 'StreetHalfpipeGeometry';

    this.parameters = {
      path,
      tubularSegments,
      radiusX,
      radiusY,
      radialSegments,
      closed,
    };

    const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new Vector3();
    const normal = new Vector3();
    const uv = new Vector2();
    let P = new Vector3();

    // buffer

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    // functions

    function generateBufferData() {
      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i, radiusX);
      }
      generateSegment((closed === false) ? tubularSegments : 0, radiusX);

      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i, radiusX - radiusY);
      }
      generateSegment((closed === false) ? tubularSegments : 0, radiusX - radiusY);

      // if the geometry is not closed, generate the last row of vertices and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateIndices();

      generateEnds();
    }

    function generateSegment(i, radius) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      // retrieve corresponding normal and binormal

      const T = frames.tangents[i];
      const N = new Vector3(0, 1, 0);
      const B = T.clone().cross(N).normalize();

      for (let j = 0; j <= radialSegments; j++) {
        let v = j / radialSegments * Math.PI;
        v -= Math.PI / 2;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        // normal

        normal.x = (cos * N.x + sin * B.x);
        normal.y = (cos * N.y + sin * B.y);
        normal.z = (cos * N.z + sin * B.z);
        normal.normalize();

        normals.push(normal.x, normal.y, normal.z);

        // vertex

        vertex.x = P.x + radius * normal.x;
        vertex.y = P.y + radius * normal.y;
        vertex.z = P.z + radius * normal.z;

        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    function generateIndices() {
      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1);
          const b = (radialSegments + 1) * j + (i - 1);
          const c = (radialSegments + 1) * j + i;
          const d = (radialSegments + 1) * (j - 1) + i;

          // faces

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const offset = vertices.length / 3 / 2;

      for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
          const a = (radialSegments + 1) * (j - 1) + (i - 1) + offset;
          const b = (radialSegments + 1) * j + (i - 1) + offset;
          const c = (radialSegments + 1) * j + i + offset;
          const d = (radialSegments + 1) * (j - 1) + i + offset;

          // faces

          indices.push(d, b, a);
          indices.push(d, c, b);
        }
      }
    }

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }

      for (let i = 0; i <= tubularSegments; i++) {
        for (let j = 0; j <= radialSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radialSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }

    function generateEnds() {
      // start/end
      {
        const offset = vertices.length / 3 / 2;

        const ts = [
          1,
          tubularSegments + 1,
        ];

        for (const j of ts) {
          for (let i = 1; i <= radialSegments; i++) {
            const a = (radialSegments + 1) * (j - 1) + (i - 1) + offset;
            const b = (radialSegments + 1) * (j - 1) + (i - 1);
            const c = (radialSegments + 1) * (j - 1) + i;
            const d = (radialSegments + 1) * (j - 1) + i + offset;

            // faces

            if (j === 1) {
              indices.push(a, b, d);
              indices.push(b, c, d);
            } else {
              indices.push(d, b, a);
              indices.push(d, c, b);
            }
          }
        }
      }

      // top
      {
        const offset = vertices.length / 3 / 2;

        const rs = [
          1,
          radialSegments + 1,
        ];

        for (let j = 1; j <= tubularSegments; j++) {
          for (const i of rs) {
            const a = (radialSegments + 1) * (j - 1) + (i - 1); // prev tube, outer
            const b = (radialSegments + 1) * j + (i - 1); // next rube, outer
            const c = (radialSegments + 1) * j + (i - 1) + offset; // next tube, inner
            const d = (radialSegments + 1) * (j - 1) + (i - 1) + offset; // prev tube, inner

            // faces

            if (i === 1) {
              indices.push(d, b, a);
              indices.push(d, c, b);
            } else {
              indices.push(a, b, d);
              indices.push(b, c, d);
            }
          }
        }
      }
    }
  }

  toJSON() {
    const data = super.toJSON();

    data.path = this.parameters.path.toJSON();

    return data;
  }

  static fromJSON(data) {
    // This only works for built-in curves (e.g. CatmullRomCurve3).
    // User defined curves or instances of CurvePath will not be deserialized.
    return new StreetFlatGeometry(
      new Curves[data.path.type]().fromJSON(data.path),
      data.tubularSegments,
      data.radiusX,
      data.radiusY,
      data.radialSegments,
      data.closed,
    );
  }
}

class StreetGeometry extends BufferGeometry {
  constructor(path, tubularSegments, radiusX, radiusY, radialSegments, closed) {
    super();

    this.parameters = {
      path,
      tubularSegments,
      radiusX,
      radiusY,
      radialSegments,
      closed,
    };

    // const radiusX2 = radiusX * octagonRadiusFactor;
    const geometries = [
      new StreetFlatGeometry(path, tubularSegments, radiusX, radiusY, 4, closed),
      // new StreetOctagonGeometry( path, tubularSegments, radiusX2, radiusY, 8, closed ),
      // new StreetHalfpipeGeometry( path, tubularSegments, radiusX2, radiusY, 4, closed ),
    ];
    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    this.copy(geometry);
  }
}

export {
  StreetGeometry,
  StreetLineGeometry,
  StreetFlatGeometry,
  StreetOctagonGeometry,
  StreetHalfpipeGeometry,
};
