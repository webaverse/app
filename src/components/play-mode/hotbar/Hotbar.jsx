
import * as THREE from 'three';
import React, {useState, useRef, useEffect} from 'react';
import styles from './hotbar.module.css';
import {world} from '../../../../world.js';
import {getRenderer} from '../../../../renderer.js';
import easing from '../../../../easing.js';

const cubicBezier = easing(0, 1, 0, 1);

const fullscreenVertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
const fullscreenFragmentShader = `\
  uniform sampler2D uTex;
  uniform float uSelected;
  uniform float uSelectFactor;
  varying vec2 vUv;
  
  struct Tri {
    vec2 a;
    vec2 b;
    vec2 c;
  };

  vec2 rotateCCW(vec2 pos, float angle) { 
    float ca = cos(angle),  sa = sin(angle);
    return pos * mat2(ca, sa, -sa, ca);  
  }
  vec2 rotateCCW(vec2 pos, vec2 around, float angle) { 
    pos -= around;
    pos = rotateCCW(pos, angle);
    pos += around;
    return pos;
  }
  // return 1 if v inside the box, return 0 otherwise
  bool insideAABB(vec2 v, vec2 bottomLeft, vec2 topRight) {
    vec2 s = step(bottomLeft, v) - step(topRight, v);
    return s.x * s.y > 0.;
  }
  bool isPointInTriangle(vec2 point, vec2 a, vec2 b, vec2 c) {
    vec2 v0 = c - a;
    vec2 v1 = b - a;
    vec2 v2 = point - a;

    float dot00 = dot(v0, v0);
    float dot01 = dot(v0, v1);
    float dot02 = dot(v0, v2);
    float dot11 = dot(v1, v1);
    float dot12 = dot(v1, v2);

    float invDenom = 1. / (dot00 * dot11 - dot01 * dot01);
    float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    float v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0.) && (v >= 0.) && (u + v < 1.);
  }
  bool isPointInTriangle(vec2 point, Tri tri) {
    return isPointInTriangle(point, tri.a, tri.b, tri.c);
  }

  void main() {
    // base color
    vec3 baseColor;
    const float borderWidth = 0.02;
    float boxInnerRadius = 0.5 - borderWidth;
    float boxInnerSize = boxInnerRadius * 2.;
    bool isInside = vUv.x >= borderWidth &&
      vUv.x <= 1.-borderWidth &&
      vUv.y >= borderWidth &&
      vUv.y <= 1.-borderWidth;
    bool isBorder = !isInside;
    if (isInside) {
      baseColor = vec3(0.1);
      float distanceToCenter = length(vUv - vec2(0.5));
      float distanceFactor = min(max(distanceToCenter / boxInnerRadius, 0.), 1.);
      baseColor += 0.15 * (1. - distanceFactor);
    } else {
      baseColor = vec3(0.);
    }

    // highlight color
    vec3 highlightColor = baseColor;
    if (isBorder) {
      if (uSelected > 0.) {
        highlightColor.gb = vUv;
      }
    } else {
      const float arrowHeight = 0.25;
      Tri t1 = Tri(
        vec2(borderWidth, borderWidth),
        vec2(0.5, arrowHeight),
        vec2(0.5, borderWidth)
      );
      Tri t2 = Tri(
        vec2(0.5, borderWidth),
        vec2(0.5, arrowHeight),
        vec2(1. - borderWidth, borderWidth)
      );
      float arrowHeightOffset = (-1. + uSelectFactor) * arrowHeight;
      t1.a.y += arrowHeightOffset;
      t1.b.y += arrowHeightOffset;
      t1.c.y += arrowHeightOffset;
      t2.a.y += arrowHeightOffset;
      t2.b.y += arrowHeightOffset;
      t2.c.y += arrowHeightOffset;
      if (
        isPointInTriangle(vUv, t1) ||
        isPointInTriangle(vUv, t2)
      ) {
        highlightColor = vec3(1.);
      }
    }

    // mix
    gl_FragColor.rgb = highlightColor;
    gl_FragColor.a = 1.;
  }
`;
const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();

const _makeHotboxScene = () => {
    const scene = new THREE.Scene();
  
    // full screen quad mesh
    const fullScreenQuadMesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          uTex: {
            value: null,
            needsUpdate: false,
          },
          uSelected: {
            value: 0,
            needsUpdate: true,
          },
          uSelectFactor: {
            value: 0,
            needsUpdate: true,
          },
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: fullscreenFragmentShader,
        depthTest: false,
      }),
    );
    fullScreenQuadMesh.frustumCulled = false;
    scene.add(fullScreenQuadMesh);
    scene.fullScreenQuadMesh = fullScreenQuadMesh;
  
    return scene;
  };

class Hotbox {
    constructor(width, height, selected) {
        this.width = width;
        this.height = height;

        this.scene = _makeHotboxScene();
        this.camera = new THREE.OrthographicCamera(
            -1,
            1,
            1,
            -1,
            0,
            1000
          );
        this.canvases = [];
        this.selected = selected;
        this.selectFactor = +selected;
    }
    addCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        canvas.ctx = ctx;

        this.canvases.push(canvas);
    }
    setSelected(selected) {
        this.selected = selected;
    }
    update(timestamp, timeDiff) {
        const renderer = getRenderer();
        const size = renderer.getSize(localVector2D);
        const pixelRatio = renderer.getPixelRatio();

        if (this.selected) {
            this.selectFactor += timeDiff / 1000;
        } else {
            this.selectFactor -= timeDiff / 1000;
        }
        this.selectFactor = Math.min(Math.max(this.selectFactor, 0), 1);

        const _render = () => {
            // push old state
            const oldRenderTarget = renderer.getRenderTarget();
            const oldViewport = renderer.getViewport(localVector4D);

            {
                const smoothedSelectFactor = this.selected ? cubicBezier(this.selectFactor) : 1-cubicBezier(1-this.selectFactor);

                this.scene.fullScreenQuadMesh.material.uniforms.uSelected.value = +this.selected;
                this.scene.fullScreenQuadMesh.material.uniforms.uSelected.needsUpdate = true;
                this.scene.fullScreenQuadMesh.material.uniforms.uSelectFactor.value = smoothedSelectFactor;
                this.scene.fullScreenQuadMesh.material.uniforms.uSelectFactor.needsUpdate = true;

                renderer.setViewport(0, 0, this.width, this.height);
                renderer.clear();
                renderer.render(this.scene, this.camera);
            }

            // pop old state
            renderer.setRenderTarget(oldRenderTarget);
            renderer.setViewport(oldViewport);
        };
        _render();

        const _copyToCanvases = () => {
            for (const canvas of this.canvases) {
                const {width, height, ctx} = canvas;
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(
                    renderer.domElement,
                    0,
                    size.y * pixelRatio - this.height * pixelRatio,
                    this.width * pixelRatio,
                    this.height * pixelRatio,
                    0,
                    0,
                    width,
                    height
                );
            }
        };
        _copyToCanvases();
    }
    destroy() {
        // XXX
    }
}
const hotboxes = [];
world.appManager.addEventListener('frame', e => {
    const {timestamp, timeDiff} = e.data;
    for (const hotbox of hotboxes) {
        hotbox.update(timestamp, timeDiff);
    }
});

const HotbarItem = props => {
    const [hotbox, setHotbox] = useState(null);
    const canvasRef = useRef();
    
    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            
            const newHotbox = new Hotbox(props.size, props.size, props.selected);
            newHotbox.addCanvas(canvas);
            hotboxes.push(newHotbox);
            setHotbox(newHotbox);
        }
    }, [canvasRef.current]);
    useEffect(() => {
        if (hotbox) {
            hotbox.setSelected(props.selected);
        }
    }, [hotbox, props.selected]);
    useEffect(() => {
        if (hotbox) {
            hotbox.destroy();
            hotboxes.splice(hotboxes.indexOf(hotbox), 1);
        }
    }, []);
    
    const pixelRatio = window.devicePixelRatio;

    return (
        <canvas className={styles.hotbox} width={props.size * pixelRatio} height={props.size * pixelRatio} ref={canvasRef} />
    );
};

export const Hotbar = () => {

    const itemsNum = 8;

    const [hotbarIndex, setHotbarIndex] = useState(0);
    
    useEffect(() => {
        function keydown(e) {
            switch (e.which) {
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                    setHotbarIndex(e.which - 49);
                    break;
            }
        }
        window.addEventListener('keydown', keydown);

        return () => {
          window.removeEventListener('keydown', keydown);
        };
    }, []);

    return (
        <div className={ styles.hotbar } >

            {
                ( () => {

                    const items = Array( itemsNum );

                    for ( let i = 0; i < itemsNum; i ++ ) {

                        items[ i ] = (
                            <div className={ styles.item } key={ i } >
                                <div className={ styles.box } />
                                <div className={ styles.label }>{ i + 1 }</div>
                                <HotbarItem size={60} selected={hotbarIndex === i} />
                            </div>
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
