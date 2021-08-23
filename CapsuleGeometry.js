import * as THREE from 'https://lib.webaverse.com/three.js';
import {Vector3, Color} from 'https://lib.webaverse.com/three.js';

class Face3 {

	constructor( a, b, c, normal, color, materialIndex = 0 ) {

		this.a = a;
		this.b = b;
		this.c = c;

		this.normal = ( normal && normal.isVector3 ) ? normal : new Vector3();
		this.vertexNormals = Array.isArray( normal ) ? normal : [];

		this.color = ( color && color.isColor ) ? color : new Color();
		this.vertexColors = Array.isArray( color ) ? color : [];

		this.materialIndex = materialIndex;

	}

	clone() {

		return new this.constructor().copy( this );

	}

	copy( source ) {

		this.a = source.a;
		this.b = source.b;
		this.c = source.c;

		this.normal.copy( source.normal );
		this.color.copy( source.color );

		this.materialIndex = source.materialIndex;

		for ( let i = 0, il = source.vertexNormals.length; i < il; i ++ ) {

			this.vertexNormals[ i ] = source.vertexNormals[ i ].clone();

		}

		for ( let i = 0, il = source.vertexColors.length; i < il; i ++ ) {

			this.vertexColors[ i ] = source.vertexColors[ i ].clone();

		}

		return this;

	}

}

function updateFace(
  tri,
  vtLayer,
  av,
  avt,
  avn,
  bv,
  bvt,
  bvn,
  cv,
  cvt,
  cvn,
  vts,
  vns
) {
  // Set coordinate indices.
  tri.a = av;
  tri.b = bv;
  tri.c = cv;

  // Unpack vertex normals array.
  const vnsTri = tri.vertexNormals;
  const vna = vnsTri[0];
  const vnb = vnsTri[1];
  const vnc = vnsTri[2];

  // These need to be copied by value, not assigned by reference.
  vna.copy(vns[avn]);
  vnb.copy(vns[bvn]);
  vnc.copy(vns[cvn]);

  // Proper formula: norm(cross(sub(p1, p0), sub(p2, p0)))
  const vnFace = tri.normal;
  vnFace.x = vna.x + vnb.x + vnc.x;
  vnFace.y = vna.y + vnb.y + vnc.y;
  vnFace.z = vna.z + vnb.z + vnc.z;

  // Instead, this averages normals; division by 3 is unecessary given the
  // normalization.
  const invVnMag =
    1.0 /
    Math.sqrt(vnFace.x * vnFace.x + vnFace.y * vnFace.y + vnFace.z * vnFace.z);

  vnFace.x *= invVnMag;
  vnFace.y *= invVnMag;
  vnFace.z *= invVnMag;

  // Set by reference or by value?
  vtLayer[0].copy(vts[avt]);
  vtLayer[1].copy(vts[bvt]);
  vtLayer[2].copy(vts[cvt]);
}

function CapsuleGeometry(
  longitudes = 32,
  latitudes = 16,
  rings = 0,
  depth = 1.0,
  radius = 0.5,
  profile = "ASPECT"
) {
  const geom = new THREE.BufferGeometry();

  // Validate input arguments.
  const verifLons = Math.max(3, longitudes);
  const verifRings = Math.max(0, rings);
  const verifDepth = Math.max(0.000001, depth);
  const verifRad = Math.max(0.000001, radius);

  // Latitudes must be even for symmetry.
  const verifLats =
    latitudes < 2 ? 2 : latitudes % 2 != 0 ? latitudes + 1 : latitudes;

  // Intermediary calculations.
  const calcMiddle = verifRings > 0;
  const halfLats = verifLats / 2;
  const halfLatsN1 = halfLats - 1;
  const halfLatsN2 = halfLats - 2;
  const verifRingsP1 = verifRings + 1;
  const verifLonsP1 = verifLons + 1;
  const lonsHalfLatN1 = halfLatsN1 * verifLons;
  const lonsRingsP1 = verifRingsP1 * verifLons;
  const halfDepth = verifDepth * 0.5;
  const summit = halfDepth + verifRad;

  // Index offsets for coordinates.
  const idxVNEquator = verifLonsP1 + verifLons * halfLatsN2;
  const idxVCyl = idxVNEquator + verifLons;
  const idxVSEquator = calcMiddle ? idxVCyl + verifLons * verifRings : idxVCyl;
  const idxVSouth = idxVSEquator + verifLons;
  const idxVSouthCap = idxVSouth + verifLons * halfLatsN2;
  const idxVSouthPole = idxVSouthCap + verifLons;

  // Index offsets for texture coordinates.
  const idxVtNEquator = verifLons + verifLonsP1 * halfLatsN1;
  const idxVtCyl = idxVtNEquator + verifLonsP1;
  const idxVtSEquator = calcMiddle
    ? idxVtCyl + verifLonsP1 * verifRings
    : idxVtCyl;
  const idxVtSHemi = idxVtSEquator + verifLonsP1;
  const idxVtSPolar = idxVtSHemi + verifLonsP1 * halfLatsN2;
  const idxVtSCap = idxVtSPolar + verifLonsP1;

  // Index offsets for normals.
  const idxVnSouth = idxVNEquator + verifLons;
  const idxVnSouthCap = idxVnSouth + verifLons * halfLatsN2;
  const idxVnSouthPole = idxVnSouthCap + verifLons;

  // Initialize arrays.
  const vs = [];
  const vsLen = idxVSouthPole + 1;
  for (let i = 0; i < vsLen; ++i) {
    vs.push(new THREE.Vector3(0.0, 0.0, 0.0));
  }

  const vts = [];
  const vtsLen = idxVtSCap + verifLons;
  for (let i = 0; i < vtsLen; ++i) {
    vts.push(new THREE.Vector2(0.5, 0.5));
  }

  const vns = [];
  const vnsLen = idxVnSouthPole + 1;
  for (let i = 0; i < vnsLen; ++i) {
    vns.push(new THREE.Vector3(0.0, 1.0, 0.0));
  }

  // North pole.
  vs[0].set(0.0, summit, 0.0);
  vns[0].set(0.0, 1.0, 0.0);

  // South pole.
  vs[idxVSouthPole].set(0.0, -summit, 0.0);
  vns[idxVnSouthPole].set(0.0, -1.0, 0.0);

  // Hemisphere ratios.
  const toTheta = (2.0 * Math.PI) / verifLons;
  const toPhi = Math.PI / verifLats;
  const toTexHorizontal = 1.0 / verifLons;
  const toTexVertical = 1.0 / halfLats;

  // Cache calculations for later use.
  const thetaCartesian = [];
  const rhoThetaCartesian = [];
  const sTexCache = [];

  // Polar coordinates,
  for (let j = 0; j < verifLons; ++j) {
    const theta = j * toTheta;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const rhoCosTheta = verifRad * cosTheta;
    const rhoSinTheta = verifRad * sinTheta;

    thetaCartesian.push({
      x: cosTheta,
      y: sinTheta
    });
    rhoThetaCartesian.push({
      x: rhoCosTheta,
      y: rhoSinTheta
    });

    // Texture coordinates at North and South pole.
    const sTexPolar = (j + 0.5) * toTexHorizontal;
    vts[j].set(sTexPolar, 1.0);
    vts[idxVtSCap + j].set(sTexPolar, 0.0);

    // Set equatorial coordinates. Offset by cylinder depth.
    vs[idxVNEquator + j].set(rhoCosTheta, halfDepth, -rhoSinTheta);
    vs[idxVSEquator + j].set(rhoCosTheta, -halfDepth, -rhoSinTheta);

    // Set equatorial normals.
    vns[idxVNEquator + j].set(cosTheta, 0.0, -sinTheta);
  }

  // Determine texture coordinate aspect ratio.
  let vtAspectRatio = 1.0 / 3.0;
  if (profile === "ASPECT") {
    vtAspectRatio = verifRad / (verifDepth + verifRad + verifRad);
  } else if (profile === "UNIFORM") {
    vtAspectRatio = halfLats / (verifRingsP1 + verifLats);
  }
  const vtAspectNorth = 1.0 - vtAspectRatio;
  const vtAspectSouth = vtAspectRatio;

  // Calculate equatorial texture coordinates.
  for (let j = 0; j < verifLonsP1; ++j) {
    const sTex = j * toTexHorizontal;
    sTexCache[j] = sTex;
    vts[idxVtNEquator + j].set(sTex, vtAspectNorth);
    vts[idxVtSEquator + j].set(sTex, vtAspectSouth);
  }

  // Divide latitudes into hemispheres. Start at i = 1 due to the poles.
  let vHemiOffsetNorth = 1;
  let vHemiOffsetSouth = idxVSouth;
  let vtHemiOffsetNorth = verifLons;
  let vtHemiOffsetSouth = idxVtSHemi;
  let vnHemiOffsetSouth = idxVnSouth;

  for (let i = 1; i < halfLats; ++i) {
    const phi = i * toPhi;
    const sinPhiSouth = Math.sin(phi);
    const cosPhiSouth = Math.cos(phi);

    // Use trigonometric symmetries to avoid calculating another sine and
    // cosine for phi North.
    const sinPhiNorth = -cosPhiSouth;
    const cosPhiNorth = sinPhiSouth;

    // For North coordinates, multiply by radius and offset.
    const rhoCosPhiNorth = verifRad * cosPhiNorth;
    const rhoSinPhiNorth = verifRad * sinPhiNorth;
    const yOffsetNorth = halfDepth - rhoSinPhiNorth;

    // For South coordinates, multiply by radius and offset.
    const rhoCosPhiSouth = verifRad * cosPhiSouth;
    const rhoSinPhiSouth = verifRad * sinPhiSouth;
    const yOffsetSouth = -halfDepth - rhoSinPhiSouth;

    // Coordinates.
    for (let j = 0; j < verifLons; ++j) {
      const tc = thetaCartesian[j];
      const cosTheta = tc.x;
      const sinTheta = tc.y;

      // North coordinate.
      vs[vHemiOffsetNorth].set(
        rhoCosPhiNorth * cosTheta,
        yOffsetNorth,
        -rhoCosPhiNorth * sinTheta
      );

      // North normal.
      vns[vHemiOffsetNorth].set(
        cosPhiNorth * cosTheta,
        -sinPhiNorth,
        -cosPhiNorth * sinTheta
      );

      // South coordinate.
      vs[vHemiOffsetSouth].set(
        rhoCosPhiSouth * cosTheta,
        yOffsetSouth,
        -rhoCosPhiSouth * sinTheta
      );

      // South normal.
      vns[vnHemiOffsetSouth].set(
        cosPhiSouth * cosTheta,
        -sinPhiSouth,
        -cosPhiSouth * sinTheta
      );

      ++vHemiOffsetNorth;
      ++vHemiOffsetSouth;
      ++vnHemiOffsetSouth;
    }

    // For UVs, linear interpolation from North pole to North aspect ratio;
    // and from South pole to South aspect ratio.
    const tTexFac = i * toTexVertical;
    const tTexNorth = 1.0 - tTexFac + tTexFac * vtAspectNorth;
    const tTexSouth = vtAspectSouth * (1.0 - tTexFac);

    // Texture coordinates.
    for (let j = 0; j < verifLonsP1; ++j) {
      const sTex = sTexCache[j];

      vts[vtHemiOffsetNorth].set(sTex, tTexNorth);
      vts[vtHemiOffsetSouth].set(sTex, tTexSouth);

      ++vtHemiOffsetNorth;
      ++vtHemiOffsetSouth;
    }
  }

  // Calculate sections of cylinder in middle.
  if (calcMiddle) {
    // Linear interpolation must exclude the origin (North equator) and the
    // destination (South equator), so step must never equal 0.0 or 1.0 .
    const toFac = 1.0 / verifRingsP1;
    let vCylOffset = idxVCyl;
    let vtCylOffset = idxVtCyl;
    for (const m = 1; m < verifRingsP1; ++m) {
      const fac = m * toFac;
      const cmplFac = 1.0 - fac;

      const elevation = halfDepth - verifDepth * fac;
      const tTex = cmplFac * vtAspectNorth + fac * vtAspectSouth;

      // Coordinates.
      for (let j = 0; j < verifLons; ++j) {
        const rtc = rtc[j];
        vs[vCylOffset].set(rtc.x, elevation, -rtc.y);
        ++vCylOffset;
      }

      // Texture coordinates.
      for (let j = 0; j < verifLonsP1; ++j) {
        const sTex = sTexCache[j];
        vts[vtCylOffset].set(sTex, tTex);
        ++vtCylOffset;
      }
    }
  }

  const idxFsCyl = verifLons + lonsHalfLatN1 * 2;
  const idxFsSouthEquat = idxFsCyl + lonsRingsP1 * 2;
  const idxFsSouthHemi = idxFsSouthEquat + lonsHalfLatN1 * 2;

  const lenIndices = idxFsSouthHemi + verifLons;
  const tris = [];
  const vtLayer = [];

  for (let i = 0; i < lenIndices; ++i) {
    const faceColor = new THREE.Color(1.0, 1.0, 1.0);
    const faceNormal = new THREE.Vector3(0.0, 1.0, 0.0);
    const materialIndex = 0;

    // Each face needs to have its own copy of vertex normals; otherwise the
    // normals go wonky when the geometry is transformed.
    const vertNormals = [
      new THREE.Vector3(0.0, 1.0, 0.0),
      new THREE.Vector3(0.0, 1.0, 0.0),
      new THREE.Vector3(0.0, 1.0, 0.0)
    ];

    // By reference or by value?
    // const vtArr = [null, null, null];
    const vtArr = [
      new THREE.Vector2(0.5, 0.5),
      new THREE.Vector2(0.5, 0.5),
      new THREE.Vector2(0.5, 0.5)
    ];

    // The first three parameters are the coordinate indices. The next
    // parameter either accepts one normal for flat, per-face shading, or an
    // array of normals for smooth, per-vertex shading.
    const tri = new Face3(0, 0, 0, vertNormals, faceColor, materialIndex);

    // Since an array of vertex normals was supplied to the constructor, the
    // per face normal needs to be created.
    tri.normal = faceNormal;

    tris.push(tri);
    vtLayer.push(vtArr);
  }

  // North & South cap indices (always triangles).
  for (let j = 0; j < verifLons; ++j) {
    const jNextVt = j + 1;
    const jNextV = jNextVt % verifLons;
    const jnp1 = 1 + jNextV;
    const south = idxFsSouthHemi + j;

    updateFace(
      tris[j],
      vtLayer[j],
      0,
      j,
      0,
      jNextVt,
      verifLons + j,
      jNextVt,
      jnp1,
      verifLons + jNextVt,
      jnp1,
      vts,
      vns
    );

    updateFace(
      tris[south],
      vtLayer[south],

      idxVSouthPole,
      idxVtSCap + j,
      idxVnSouthPole,

      idxVSouthCap + jNextV,
      idxVtSPolar + jNextVt,
      idxVnSouthCap + jNextV,

      idxVSouthCap + j,
      idxVtSPolar + j,
      idxVnSouthCap + j,

      vts,
      vns
    );
  }

  // Hemisphere indices.
  let fHemiOffsetNorth = verifLons;
  let fHemiOffsetSouth = idxFsSouthEquat;
  for (let i = 0; i < halfLatsN1; ++i) {
    let iLonsCurr = i * verifLons;

    // North coordinate index offset.
    const vCurrLatN = 1 + iLonsCurr;
    const vNextLatN = vCurrLatN + verifLons;

    // South coordinate index offset.
    const vCurrLatS = idxVSEquator + iLonsCurr;
    const vNextLatS = vCurrLatS + verifLons;

    // North texture coordinate index offset.
    const vtCurrLatN = verifLons + i * verifLonsP1;
    const vtNextLatN = vtCurrLatN + verifLonsP1;

    // South texture coordinate index offset.
    const vtCurrLatS = idxVtSEquator + i * verifLonsP1;
    const vtNextLatS = vtCurrLatS + verifLonsP1;

    // North normal index offset.
    const vnCurrLatN = 1 + iLonsCurr;
    const vnNextLatN = vnCurrLatN + verifLons;

    // South normal index offset.
    const vnCurrLatS = idxVNEquator + iLonsCurr;
    const vnNextLatS = vnCurrLatS + verifLons;

    for (let j = 0; j < verifLons; ++j) {
      const jNextVt = j + 1;
      const jNextV = jNextVt % verifLons;

      // North coordinate indices.
      const vn00 = vCurrLatN + j;
      const vn01 = vNextLatN + j;
      const vn11 = vNextLatN + jNextV;
      const vn10 = vCurrLatN + jNextV;

      // South coordinate indices.
      const vs00 = vCurrLatS + j;
      const vs01 = vNextLatS + j;
      const vs11 = vNextLatS + jNextV;
      const vs10 = vCurrLatS + jNextV;

      // North texture coordinate indices.
      const vtn00 = vtCurrLatN + j;
      const vtn01 = vtNextLatN + j;
      const vtn11 = vtNextLatN + jNextVt;
      const vtn10 = vtCurrLatN + jNextVt;

      // South texture coordinate indices.
      const vts00 = vtCurrLatS + j;
      const vts01 = vtNextLatS + j;
      const vts11 = vtNextLatS + jNextVt;
      const vts10 = vtCurrLatS + jNextVt;

      // North normal indices.
      const vnn00 = vnCurrLatN + j;
      const vnn01 = vnNextLatN + j;
      const vnn11 = vnNextLatN + jNextV;
      const vnn10 = vnCurrLatN + jNextV;

      // South normal indices.
      const vns00 = vnCurrLatS + j;
      const vns01 = vnNextLatS + j;
      const vns11 = vnNextLatS + jNextV;
      const vns10 = vnCurrLatS + jNextV;

      // North triangles.
      updateFace(
        tris[fHemiOffsetNorth],
        vtLayer[fHemiOffsetNorth],
        vn00,
        vtn00,
        vnn00,
        vn11,
        vtn11,
        vnn11,
        vn10,
        vtn10,
        vnn10,
        vts,
        vns
      );

      updateFace(
        tris[fHemiOffsetNorth + 1],
        vtLayer[fHemiOffsetNorth + 1],
        vn00,
        vtn00,
        vnn00,
        vn01,
        vtn01,
        vnn01,
        vn11,
        vtn11,
        vnn11,
        vts,
        vns
      );

      // South triangles.
      updateFace(
        tris[fHemiOffsetSouth],
        vtLayer[fHemiOffsetSouth],
        vs00,
        vts00,
        vns00,
        vs11,
        vts11,
        vns11,
        vs10,
        vts10,
        vns10,
        vts,
        vns
      );

      updateFace(
        tris[fHemiOffsetSouth + 1],
        vtLayer[fHemiOffsetSouth + 1],
        vs00,
        vts00,
        vns00,
        vs01,
        vts01,
        vns01,
        vs11,
        vts11,
        vns11,
        vts,
        vns
      );

      fHemiOffsetNorth += 2;
      fHemiOffsetSouth += 2;
    }
  }

  let fCylOffset = idxFsCyl;
  for (let m = 0; m < verifRingsP1; ++m) {
    const vCurrRing = idxVNEquator + m * verifLons;
    const vNextRing = vCurrRing + verifLons;

    const vtCurrRing = idxVtNEquator + m * verifLonsP1;
    const vtNextRing = vtCurrRing + verifLonsP1;

    for (let j = 0; j < verifLons; ++j) {
      const jNextVt = j + 1;
      const jNextV = jNextVt % verifLons;

      // Coordinate corners.
      const v00 = vCurrRing + j;
      const v01 = vNextRing + j;
      const v11 = vNextRing + jNextV;
      const v10 = vCurrRing + jNextV;

      // Texture coordinate corners.
      const vt00 = vtCurrRing + j;
      const vt01 = vtNextRing + j;
      const vt11 = vtNextRing + jNextVt;
      const vt10 = vtCurrRing + jNextVt;

      // Normal corners.
      const vn0 = idxVNEquator + j;
      const vn1 = idxVNEquator + jNextV;

      updateFace(
        tris[fCylOffset],
        vtLayer[fCylOffset],
        v00,
        vt00,
        vn0,
        v11,
        vt11,
        vn1,
        v10,
        vt10,
        vn1,
        vts,
        vns
      );

      updateFace(
        tris[fCylOffset + 1],
        vtLayer[fCylOffset + 1],
        v00,
        vt00,
        vn0,
        v01,
        vt01,
        vn0,
        v11,
        vt11,
        vn1,
        vts,
        vns
      );

      fCylOffset += 2;
    }
  }

  const positions = new Float32Array(vs.length * 3);
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i];
    positions[i*3] = v.x;
    positions[i*3+1] = v.y;
    positions[i*3+2] = v.z;
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  geom.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from(vtLayer), 2));
  const indices = new Uint16Array(tris.length * 3);
  for (let i = 0; i < tris.length; i++) {
    const tri = tris[i];
    indices[i*3] = tri.a;
    indices[i*3+1] = tri.b;
    indices[i*3+2] = tri.c;
  }
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  return geom;
}

export {CapsuleGeometry};
