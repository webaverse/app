import THREE from '../../three.module.js';

var __three_vrm__ =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/assign.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/assign.ts":
/*!***********************!*\
  !*** ./src/assign.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var __three_vrm__ = __webpack_require__(/*! . */ "./src/index.ts");
Object.assign(THREE, __three_vrm__);


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./vrm/ */ "./src/vrm/index.ts"));


/***/ }),

/***/ "./src/vrm/VRM.ts":
/*!************************!*\
  !*** ./src/vrm/VRM.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var disposer_1 = __webpack_require__(/*! ./utils/disposer */ "./src/vrm/utils/disposer.ts");
var VRMImporter_1 = __webpack_require__(/*! ./VRMImporter */ "./src/vrm/VRMImporter.ts");
var VRM = (function () {
    function VRM(params) {
        this.scene = params.scene;
        this.humanoid = params.humanoid;
        this.blendShapeProxy = params.blendShapeProxy;
        this.firstPerson = params.firstPerson;
        this.lookAt = params.lookAt;
        this.materials = params.materials;
        this.springBoneManager = params.springBoneManager;
        this.meta = params.meta;
    }
    VRM.from = function (gltf, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, Promise, function () {
            var importer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        importer = new VRMImporter_1.VRMImporter(options);
                        return [4, importer.import(gltf)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    VRM.prototype.update = function (delta) {
        if (this.lookAt) {
            this.lookAt.update(delta);
        }
        if (this.blendShapeProxy) {
            this.blendShapeProxy.update();
        }
        if (this.springBoneManager) {
            this.springBoneManager.lateUpdate(delta);
        }
        if (this.materials) {
            this.materials.forEach(function (material) {
                if (material.updateVRMMaterials) {
                    material.updateVRMMaterials(delta);
                }
            });
        }
    };
    VRM.prototype.dispose = function () {
        var scene = this.scene;
        if (scene) {
            while (scene.children.length > 0) {
                var object = scene.children[scene.children.length - 1];
                disposer_1.deepDispose(object);
                scene.remove(object);
            }
        }
    };
    return VRM;
}());
exports.VRM = VRM;


/***/ }),

/***/ "./src/vrm/VRMImporter.ts":
/*!********************************!*\
  !*** ./src/vrm/VRMImporter.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var blendshape_1 = __webpack_require__(/*! ./blendshape */ "./src/vrm/blendshape/index.ts");
var firstperson_1 = __webpack_require__(/*! ./firstperson */ "./src/vrm/firstperson/index.ts");
var VRMHumanoidImporter_1 = __webpack_require__(/*! ./humanoid/VRMHumanoidImporter */ "./src/vrm/humanoid/VRMHumanoidImporter.ts");
var VRMLookAtImporter_1 = __webpack_require__(/*! ./lookat/VRMLookAtImporter */ "./src/vrm/lookat/VRMLookAtImporter.ts");
var material_1 = __webpack_require__(/*! ./material */ "./src/vrm/material/index.ts");
var reduceBones_1 = __webpack_require__(/*! ./reduceBones */ "./src/vrm/reduceBones.ts");
var VRMSpringBoneImporter_1 = __webpack_require__(/*! ./springbone/VRMSpringBoneImporter */ "./src/vrm/springbone/VRMSpringBoneImporter.ts");
var VRM_1 = __webpack_require__(/*! ./VRM */ "./src/vrm/VRM.ts");
var VRMImporter = (function () {
    function VRMImporter(options) {
        if (options === void 0) { options = {}; }
        this._blendShapeImporter = options.blendShapeImporter || new blendshape_1.VRMBlendShapeImporter();
        this._lookAtImporter = options.lookAtImporter || new VRMLookAtImporter_1.VRMLookAtImporter();
        this._humanoidImporter = options.humanoidImporter || new VRMHumanoidImporter_1.VRMHumanoidImporter();
        this._firstPersonImporter = options.firstPersonImporter || new firstperson_1.VRMFirstPersonImporter();
        this._materialImporter = options.materialImporter || new material_1.VRMMaterialImporter();
        this._springBoneImporter = options.springBoneImporter || new VRMSpringBoneImporter_1.VRMSpringBoneImporter();
    }
    VRMImporter.prototype.import = function (gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, scene, materials, humanoid, firstPerson, _a, blendShapeProxy, lookAt, _b, springBoneManager;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (gltf.parser.json.extensions === undefined || gltf.parser.json.extensions.VRM === undefined) {
                            throw new Error('Could not find VRM extension on the GLTF');
                        }
                        vrmExt = gltf.parser.json.extensions.VRM;
                        scene = gltf.scene;
                        scene.updateMatrixWorld(false);
                        scene.traverse(function (object3d) {
                            if (object3d.isMesh) {
                                object3d.frustumCulled = false;
                            }
                        });
                        reduceBones_1.reduceBones(scene);
                        return [4, this._materialImporter.convertGLTFMaterials(gltf)];
                    case 1:
                        materials = (_c.sent()) || undefined;
                        return [4, this._humanoidImporter.import(gltf)];
                    case 2:
                        humanoid = (_c.sent()) || undefined;
                        if (!humanoid) return [3, 4];
                        return [4, this._firstPersonImporter.import(gltf, humanoid)];
                    case 3:
                        _a = (_c.sent()) || undefined;
                        return [3, 5];
                    case 4:
                        _a = undefined;
                        _c.label = 5;
                    case 5:
                        firstPerson = _a;
                        return [4, this._blendShapeImporter.import(gltf)];
                    case 6:
                        blendShapeProxy = (_c.sent()) || undefined;
                        if (!(firstPerson && blendShapeProxy && humanoid)) return [3, 8];
                        return [4, this._lookAtImporter.import(gltf, firstPerson, blendShapeProxy, humanoid)];
                    case 7:
                        _b = (_c.sent()) || undefined;
                        return [3, 9];
                    case 8:
                        _b = undefined;
                        _c.label = 9;
                    case 9:
                        lookAt = _b;
                        return [4, this._springBoneImporter.import(gltf)];
                    case 10:
                        springBoneManager = (_c.sent()) || undefined;
                        return [2, new VRM_1.VRM({
                                scene: gltf.scene,
                                meta: vrmExt.meta,
                                materials: materials,
                                humanoid: humanoid,
                                firstPerson: firstPerson,
                                blendShapeProxy: blendShapeProxy,
                                lookAt: lookAt,
                                springBoneManager: springBoneManager,
                            })];
                }
            });
        });
    };
    return VRMImporter;
}());
exports.VRMImporter = VRMImporter;


/***/ }),

/***/ "./src/vrm/blendshape/VRMBlendShapeGroup.ts":
/*!**************************************************!*\
  !*** ./src/vrm/blendshape/VRMBlendShapeGroup.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var VRMBlendShapeMaterialValueType;
(function (VRMBlendShapeMaterialValueType) {
    VRMBlendShapeMaterialValueType[VRMBlendShapeMaterialValueType["NUMBER"] = 0] = "NUMBER";
    VRMBlendShapeMaterialValueType[VRMBlendShapeMaterialValueType["VECTOR2"] = 1] = "VECTOR2";
    VRMBlendShapeMaterialValueType[VRMBlendShapeMaterialValueType["VECTOR3"] = 2] = "VECTOR3";
    VRMBlendShapeMaterialValueType[VRMBlendShapeMaterialValueType["VECTOR4"] = 3] = "VECTOR4";
    VRMBlendShapeMaterialValueType[VRMBlendShapeMaterialValueType["COLOR"] = 4] = "COLOR";
})(VRMBlendShapeMaterialValueType || (VRMBlendShapeMaterialValueType = {}));
var _v2 = new THREE.Vector2();
var _v3 = new THREE.Vector3();
var _v4 = new THREE.Vector4();
var _color = new THREE.Color();
var VRMBlendShapeGroup = (function (_super) {
    __extends(VRMBlendShapeGroup, _super);
    function VRMBlendShapeGroup(expressionName) {
        var _this = _super.call(this) || this;
        _this.weight = 0.0;
        _this.isBinary = false;
        _this._binds = [];
        _this._materialValues = [];
        _this.name = "BlendShapeController_" + expressionName;
        _this.type = 'BlendShapeController';
        _this.visible = false;
        return _this;
    }
    VRMBlendShapeGroup.prototype.addBind = function (args) {
        var weight = args.weight / 100;
        this._binds.push({
            meshes: args.meshes,
            morphTargetIndex: args.morphTargetIndex,
            weight: weight,
        });
    };
    VRMBlendShapeGroup.prototype.addMaterialValue = function (args) {
        var material = args.material;
        var propertyName = args.propertyName;
        var value = material[propertyName];
        if (!value) {
            return;
        }
        value = args.defaultValue || value;
        var type;
        var defaultValue;
        var targetValue;
        var deltaValue;
        if (value.isVector2) {
            type = VRMBlendShapeMaterialValueType.VECTOR2;
            defaultValue = value.clone();
            targetValue = new THREE.Vector2().fromArray(args.targetValue);
            deltaValue = targetValue.clone().sub(defaultValue);
        }
        else if (value.isVector3) {
            type = VRMBlendShapeMaterialValueType.VECTOR3;
            defaultValue = value.clone();
            targetValue = new THREE.Vector3().fromArray(args.targetValue);
            deltaValue = targetValue.clone().sub(defaultValue);
        }
        else if (value.isVector4) {
            type = VRMBlendShapeMaterialValueType.VECTOR4;
            defaultValue = value.clone();
            targetValue = new THREE.Vector4().fromArray([
                args.targetValue[2],
                args.targetValue[3],
                args.targetValue[0],
                args.targetValue[1],
            ]);
            deltaValue = targetValue.clone().sub(defaultValue);
        }
        else if (value.isColor) {
            type = VRMBlendShapeMaterialValueType.COLOR;
            defaultValue = value.clone();
            targetValue = new THREE.Color().fromArray(args.targetValue);
            deltaValue = targetValue.clone().sub(defaultValue);
        }
        else {
            type = VRMBlendShapeMaterialValueType.NUMBER;
            defaultValue = value;
            targetValue = args.targetValue[0];
            deltaValue = targetValue - defaultValue;
        }
        this._materialValues.push({
            material: material,
            propertyName: propertyName,
            defaultValue: defaultValue,
            targetValue: targetValue,
            deltaValue: deltaValue,
            type: type,
        });
    };
    VRMBlendShapeGroup.prototype.applyWeight = function () {
        var w = this.isBinary ? (this.weight < 0.5 ? 0.0 : 1.0) : this.weight;
        this._binds.forEach(function (bind) {
            bind.meshes.forEach(function (mesh) {
                if (!mesh.morphTargetInfluences) {
                    return;
                }
                mesh.morphTargetInfluences[bind.morphTargetIndex] += w * bind.weight;
            });
        });
        this._materialValues.forEach(function (materialValue) {
            var prop = materialValue.material[materialValue.propertyName];
            if (prop === undefined) {
                return;
            }
            if (materialValue.type === VRMBlendShapeMaterialValueType.NUMBER) {
                var deltaValue = materialValue.deltaValue;
                materialValue.material[materialValue.propertyName] += deltaValue * w;
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.VECTOR2) {
                var deltaValue = materialValue.deltaValue;
                materialValue.material[materialValue.propertyName].add(_v2.copy(deltaValue).multiplyScalar(w));
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.VECTOR3) {
                var deltaValue = materialValue.deltaValue;
                materialValue.material[materialValue.propertyName].add(_v3.copy(deltaValue).multiplyScalar(w));
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.VECTOR4) {
                var deltaValue = materialValue.deltaValue;
                materialValue.material[materialValue.propertyName].add(_v4.copy(deltaValue).multiplyScalar(w));
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.COLOR) {
                var deltaValue = materialValue.deltaValue;
                materialValue.material[materialValue.propertyName].add(_color.copy(deltaValue).multiplyScalar(w));
            }
            if (typeof materialValue.material.shouldApplyUniforms === 'boolean') {
                materialValue.material.shouldApplyUniforms = true;
            }
        });
    };
    VRMBlendShapeGroup.prototype.clearAppliedWeight = function () {
        this._binds.forEach(function (bind) {
            bind.meshes.forEach(function (mesh) {
                if (!mesh.morphTargetInfluences) {
                    return;
                }
                mesh.morphTargetInfluences[bind.morphTargetIndex] = 0.0;
            });
        });
        this._materialValues.forEach(function (materialValue) {
            var prop = materialValue.material[materialValue.propertyName];
            if (prop === undefined) {
                return;
            }
            if (materialValue.type === VRMBlendShapeMaterialValueType.NUMBER) {
                var defaultValue = materialValue.defaultValue;
                materialValue.material[materialValue.propertyName] = defaultValue;
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.VECTOR2) {
                var defaultValue = materialValue.defaultValue;
                materialValue.material[materialValue.propertyName].copy(defaultValue);
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.VECTOR3) {
                var defaultValue = materialValue.defaultValue;
                materialValue.material[materialValue.propertyName].copy(defaultValue);
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.VECTOR4) {
                var defaultValue = materialValue.defaultValue;
                materialValue.material[materialValue.propertyName].copy(defaultValue);
            }
            else if (materialValue.type === VRMBlendShapeMaterialValueType.COLOR) {
                var defaultValue = materialValue.defaultValue;
                materialValue.material[materialValue.propertyName].copy(defaultValue);
            }
            if (typeof materialValue.material.shouldApplyUniforms === 'boolean') {
                materialValue.material.shouldApplyUniforms = true;
            }
        });
    };
    return VRMBlendShapeGroup;
}(THREE.Object3D));
exports.VRMBlendShapeGroup = VRMBlendShapeGroup;


/***/ }),

/***/ "./src/vrm/blendshape/VRMBlendShapeImporter.ts":
/*!*****************************************************!*\
  !*** ./src/vrm/blendshape/VRMBlendShapeImporter.ts ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(/*! ../types */ "./src/vrm/types/index.ts");
var renameMaterialProperty_1 = __webpack_require__(/*! ../utils/renameMaterialProperty */ "./src/vrm/utils/renameMaterialProperty.ts");
var VRMBlendShapeGroup_1 = __webpack_require__(/*! ./VRMBlendShapeGroup */ "./src/vrm/blendshape/VRMBlendShapeGroup.ts");
var VRMBlendShapeProxy_1 = __webpack_require__(/*! ./VRMBlendShapeProxy */ "./src/vrm/blendshape/VRMBlendShapeProxy.ts");
var VRMBlendShapeImporter = (function () {
    function VRMBlendShapeImporter() {
    }
    VRMBlendShapeImporter.prototype.import = function (gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, schemaBlendShape, blendShape, blendShapeGroups, blendShapePresetMap;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
                        if (!vrmExt) {
                            return [2, null];
                        }
                        schemaBlendShape = vrmExt.blendShapeMaster;
                        if (!schemaBlendShape) {
                            return [2, null];
                        }
                        blendShape = new VRMBlendShapeProxy_1.VRMBlendShapeProxy();
                        blendShapeGroups = schemaBlendShape.blendShapeGroups;
                        if (!blendShapeGroups) {
                            return [2, blendShape];
                        }
                        blendShapePresetMap = {};
                        return [4, Promise.all(blendShapeGroups.map(function (schemaGroup) { return __awaiter(_this, void 0, void 0, function () {
                                var name, presetName, group, materialValues;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    name = schemaGroup.name;
                                    if (name === undefined) {
                                        console.warn('VRMBlendShapeImporter: One of blendShapeGroups has no name');
                                        return [2];
                                    }
                                    if (schemaGroup.presetName &&
                                        schemaGroup.presetName !== types_1.VRMSchema.BlendShapePresetName.Unknown &&
                                        !blendShapePresetMap[schemaGroup.presetName]) {
                                        presetName = schemaGroup.presetName;
                                        blendShapePresetMap[schemaGroup.presetName] = name;
                                    }
                                    group = new VRMBlendShapeGroup_1.VRMBlendShapeGroup(name);
                                    gltf.scene.add(group);
                                    group.isBinary = schemaGroup.isBinary || false;
                                    if (schemaGroup.binds) {
                                        schemaGroup.binds.forEach(function (bind) { return __awaiter(_this, void 0, void 0, function () {
                                            var morphMeshes, primitives, morphTargetIndex;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (bind.mesh === undefined || bind.index === undefined) {
                                                            return [2];
                                                        }
                                                        return [4, gltf.parser.getDependency('mesh', bind.mesh)];
                                                    case 1:
                                                        morphMeshes = _a.sent();
                                                        primitives = morphMeshes.type === 'Group'
                                                            ? morphMeshes.children
                                                            : [morphMeshes];
                                                        morphTargetIndex = bind.index;
                                                        if (!primitives.every(function (primitive) {
                                                            return Array.isArray(primitive.morphTargetInfluences) &&
                                                                morphTargetIndex < primitive.morphTargetInfluences.length;
                                                        })) {
                                                            console.warn("VRMBlendShapeImporter: " + schemaGroup.name + " attempts to index " + morphTargetIndex + "th morph but not found.");
                                                            return [2];
                                                        }
                                                        group.addBind({
                                                            meshes: primitives,
                                                            morphTargetIndex: morphTargetIndex,
                                                            weight: bind.weight || 100,
                                                        });
                                                        return [2];
                                                }
                                            });
                                        }); });
                                    }
                                    materialValues = schemaGroup.materialValues;
                                    if (materialValues) {
                                        materialValues.forEach(function (materialValue) {
                                            if (materialValue.materialName === undefined ||
                                                materialValue.propertyName === undefined ||
                                                materialValue.targetValue === undefined) {
                                                return;
                                            }
                                            var materials = [];
                                            gltf.scene.traverse(function (object) {
                                                if (object.material) {
                                                    var material = object.material;
                                                    if (Array.isArray(material)) {
                                                        materials.push.apply(materials, material.filter(function (mtl) { return mtl.name === materialValue.materialName && materials.indexOf(mtl) === -1; }));
                                                    }
                                                    else if (material.name === materialValue.materialName && materials.indexOf(material) === -1) {
                                                        materials.push(material);
                                                    }
                                                }
                                            });
                                            materials.forEach(function (material) {
                                                group.addMaterialValue({
                                                    material: material,
                                                    propertyName: renameMaterialProperty_1.renameMaterialProperty(materialValue.propertyName),
                                                    targetValue: materialValue.targetValue,
                                                });
                                            });
                                        });
                                    }
                                    blendShape.registerBlendShapeGroup(name, presetName, group);
                                    return [2];
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [2, blendShape];
                }
            });
        });
    };
    return VRMBlendShapeImporter;
}());
exports.VRMBlendShapeImporter = VRMBlendShapeImporter;


/***/ }),

/***/ "./src/vrm/blendshape/VRMBlendShapeProxy.ts":
/*!**************************************************!*\
  !*** ./src/vrm/blendshape/VRMBlendShapeProxy.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var math_1 = __webpack_require__(/*! ../utils/math */ "./src/vrm/utils/math.ts");
var VRMBlendShapeProxy = (function () {
    function VRMBlendShapeProxy() {
        this._blendShapeGroups = {};
        this._blendShapePresetMap = {};
    }
    Object.defineProperty(VRMBlendShapeProxy.prototype, "expressions", {
        get: function () {
            return Object.keys(this._blendShapeGroups);
        },
        enumerable: true,
        configurable: true
    });
    VRMBlendShapeProxy.prototype.getBlendShapeGroup = function (name) {
        var presetName = this._blendShapePresetMap[name];
        var controller = presetName ? this._blendShapeGroups[presetName] : this._blendShapeGroups[name];
        if (!controller) {
            console.warn("no blend shape found by " + name);
            return undefined;
        }
        return controller;
    };
    VRMBlendShapeProxy.prototype.registerBlendShapeGroup = function (name, presetName, controller) {
        this._blendShapeGroups[name] = controller;
        if (presetName) {
            this._blendShapePresetMap[presetName] = name;
        }
    };
    VRMBlendShapeProxy.prototype.getValue = function (name) {
        var controller = this.getBlendShapeGroup(name);
        return (controller && controller.weight) || null;
    };
    VRMBlendShapeProxy.prototype.setValue = function (name, weight) {
        var controller = this.getBlendShapeGroup(name);
        if (controller) {
            controller.weight = math_1.saturate(weight);
        }
    };
    VRMBlendShapeProxy.prototype.getBlendShapeTrackName = function (name) {
        var controller = this.getBlendShapeGroup(name);
        return controller ? controller.name + ".weight" : null;
    };
    VRMBlendShapeProxy.prototype.update = function () {
        var _this = this;
        Object.keys(this._blendShapeGroups).forEach(function (name) {
            var controller = _this._blendShapeGroups[name];
            controller.clearAppliedWeight();
        });
        Object.keys(this._blendShapeGroups).forEach(function (name) {
            var controller = _this._blendShapeGroups[name];
            controller.applyWeight();
        });
    };
    return VRMBlendShapeProxy;
}());
exports.VRMBlendShapeProxy = VRMBlendShapeProxy;


/***/ }),

/***/ "./src/vrm/blendshape/index.ts":
/*!*************************************!*\
  !*** ./src/vrm/blendshape/index.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./VRMBlendShapeGroup */ "./src/vrm/blendshape/VRMBlendShapeGroup.ts"));
__export(__webpack_require__(/*! ./VRMBlendShapeImporter */ "./src/vrm/blendshape/VRMBlendShapeImporter.ts"));
__export(__webpack_require__(/*! ./VRMBlendShapeProxy */ "./src/vrm/blendshape/VRMBlendShapeProxy.ts"));


/***/ }),

/***/ "./src/vrm/debug/VRMDebug.ts":
/*!***********************************!*\
  !*** ./src/vrm/debug/VRMDebug.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var VRM_1 = __webpack_require__(/*! ../VRM */ "./src/vrm/VRM.ts");
var VRMImporterDebug_1 = __webpack_require__(/*! ./VRMImporterDebug */ "./src/vrm/debug/VRMImporterDebug.ts");
var VRMDebug = (function (_super) {
    __extends(VRMDebug, _super);
    function VRMDebug(params, debugOption) {
        if (debugOption === void 0) { debugOption = {}; }
        var _this = _super.call(this, params) || this;
        if (!debugOption.disableBoxHelper) {
            _this.scene.add(new THREE.BoxHelper(_this.scene));
        }
        if (!debugOption.disableSkeletonHelper) {
            _this.scene.add(new THREE.SkeletonHelper(_this.scene));
        }
        return _this;
    }
    VRMDebug.from = function (gltf, options, debugOption) {
        if (options === void 0) { options = {}; }
        if (debugOption === void 0) { debugOption = {}; }
        return __awaiter(this, void 0, Promise, function () {
            var importer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        importer = new VRMImporterDebug_1.VRMImporterDebug(options);
                        return [4, importer.import(gltf, debugOption)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    VRMDebug.prototype.update = function (delta) {
        _super.prototype.update.call(this, delta);
    };
    return VRMDebug;
}(VRM_1.VRM));
exports.VRMDebug = VRMDebug;


/***/ }),

/***/ "./src/vrm/debug/VRMDebugOptions.ts":
/*!******************************************!*\
  !*** ./src/vrm/debug/VRMDebugOptions.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/debug/VRMImporterDebug.ts":
/*!*******************************************!*\
  !*** ./src/vrm/debug/VRMImporterDebug.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var reduceBones_1 = __webpack_require__(/*! ../reduceBones */ "./src/vrm/reduceBones.ts");
var VRMImporter_1 = __webpack_require__(/*! ../VRMImporter */ "./src/vrm/VRMImporter.ts");
var VRMDebug_1 = __webpack_require__(/*! ./VRMDebug */ "./src/vrm/debug/VRMDebug.ts");
var VRMLookAtImporterDebug_1 = __webpack_require__(/*! ./VRMLookAtImporterDebug */ "./src/vrm/debug/VRMLookAtImporterDebug.ts");
var VRMSpringBoneImporterDebug_1 = __webpack_require__(/*! ./VRMSpringBoneImporterDebug */ "./src/vrm/debug/VRMSpringBoneImporterDebug.ts");
var VRMImporterDebug = (function (_super) {
    __extends(VRMImporterDebug, _super);
    function VRMImporterDebug(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        options.lookAtImporter = options.lookAtImporter || new VRMLookAtImporterDebug_1.VRMLookAtImporterDebug();
        options.springBoneImporter = options.springBoneImporter || new VRMSpringBoneImporterDebug_1.VRMSpringBoneImporterDebug();
        _this = _super.call(this, options) || this;
        return _this;
    }
    VRMImporterDebug.prototype.import = function (gltf, debugOptions) {
        if (debugOptions === void 0) { debugOptions = {}; }
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, scene, materials, humanoid, firstPerson, _a, blendShapeProxy, lookAt, _b, springBoneManager;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (gltf.parser.json.extensions === undefined || gltf.parser.json.extensions.VRM === undefined) {
                            throw new Error('Could not find VRM extension on the GLTF');
                        }
                        vrmExt = gltf.parser.json.extensions.VRM;
                        scene = gltf.scene;
                        scene.updateMatrixWorld(false);
                        scene.traverse(function (object3d) {
                            if (object3d.isMesh) {
                                object3d.frustumCulled = false;
                            }
                        });
                        reduceBones_1.reduceBones(scene);
                        return [4, this._materialImporter.convertGLTFMaterials(gltf)];
                    case 1:
                        materials = (_c.sent()) || undefined;
                        return [4, this._humanoidImporter.import(gltf)];
                    case 2:
                        humanoid = (_c.sent()) || undefined;
                        if (!humanoid) return [3, 4];
                        return [4, this._firstPersonImporter.import(gltf, humanoid)];
                    case 3:
                        _a = (_c.sent()) || undefined;
                        return [3, 5];
                    case 4:
                        _a = undefined;
                        _c.label = 5;
                    case 5:
                        firstPerson = _a;
                        return [4, this._blendShapeImporter.import(gltf)];
                    case 6:
                        blendShapeProxy = (_c.sent()) || undefined;
                        if (!(firstPerson && blendShapeProxy && humanoid)) return [3, 8];
                        return [4, this._lookAtImporter.import(gltf, firstPerson, blendShapeProxy, humanoid)];
                    case 7:
                        _b = (_c.sent()) || undefined;
                        return [3, 9];
                    case 8:
                        _b = undefined;
                        _c.label = 9;
                    case 9:
                        lookAt = _b;
                        if (lookAt.setupHelper) {
                            lookAt.setupHelper(scene, debugOptions);
                        }
                        return [4, this._springBoneImporter.import(gltf)];
                    case 10:
                        springBoneManager = (_c.sent()) || undefined;
                        return [2, new VRMDebug_1.VRMDebug({
                                scene: gltf.scene,
                                meta: vrmExt.meta,
                                materials: materials,
                                humanoid: humanoid,
                                firstPerson: firstPerson,
                                blendShapeProxy: blendShapeProxy,
                                lookAt: lookAt,
                                springBoneManager: springBoneManager,
                            }, debugOptions)];
                }
            });
        });
    };
    return VRMImporterDebug;
}(VRMImporter_1.VRMImporter));
exports.VRMImporterDebug = VRMImporterDebug;


/***/ }),

/***/ "./src/vrm/debug/VRMLookAtHeadDebug.ts":
/*!*********************************************!*\
  !*** ./src/vrm/debug/VRMLookAtHeadDebug.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var VRMLookAtHead_1 = __webpack_require__(/*! ../lookat/VRMLookAtHead */ "./src/vrm/lookat/VRMLookAtHead.ts");
var _v3 = new THREE.Vector3();
var VRMLookAtHeadDebug = (function (_super) {
    __extends(VRMLookAtHeadDebug, _super);
    function VRMLookAtHeadDebug() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VRMLookAtHeadDebug.prototype.setupHelper = function (scene, debugOption) {
        if (!debugOption.disableFaceDirectionHelper) {
            this._faceDirectionHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 0.5, 0xff00ff);
            scene.add(this._faceDirectionHelper);
        }
    };
    VRMLookAtHeadDebug.prototype.update = function (delta) {
        _super.prototype.update.call(this, delta);
        if (this._faceDirectionHelper) {
            this.firstPerson.getFirstPersonWorldPosition(this._faceDirectionHelper.position);
            this._faceDirectionHelper.setDirection(this.getLookAtWorldDirection(_v3));
        }
    };
    return VRMLookAtHeadDebug;
}(VRMLookAtHead_1.VRMLookAtHead));
exports.VRMLookAtHeadDebug = VRMLookAtHeadDebug;


/***/ }),

/***/ "./src/vrm/debug/VRMLookAtImporterDebug.ts":
/*!*************************************************!*\
  !*** ./src/vrm/debug/VRMLookAtImporterDebug.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var VRMLookAtImporter_1 = __webpack_require__(/*! ../lookat/VRMLookAtImporter */ "./src/vrm/lookat/VRMLookAtImporter.ts");
var VRMLookAtHeadDebug_1 = __webpack_require__(/*! ./VRMLookAtHeadDebug */ "./src/vrm/debug/VRMLookAtHeadDebug.ts");
var VRMLookAtImporterDebug = (function (_super) {
    __extends(VRMLookAtImporterDebug, _super);
    function VRMLookAtImporterDebug() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VRMLookAtImporterDebug.prototype.import = function (gltf, firstPerson, blendShapeProxy, humanoid) {
        var vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
        if (!vrmExt) {
            return null;
        }
        var schemaFirstPerson = vrmExt.firstPerson;
        if (!schemaFirstPerson) {
            return null;
        }
        var applyer = this._importApplyer(schemaFirstPerson, blendShapeProxy, humanoid);
        return new VRMLookAtHeadDebug_1.VRMLookAtHeadDebug(firstPerson, applyer || undefined);
    };
    return VRMLookAtImporterDebug;
}(VRMLookAtImporter_1.VRMLookAtImporter));
exports.VRMLookAtImporterDebug = VRMLookAtImporterDebug;


/***/ }),

/***/ "./src/vrm/debug/VRMSpringBoneDebug.ts":
/*!*********************************************!*\
  !*** ./src/vrm/debug/VRMSpringBoneDebug.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var springbone_1 = __webpack_require__(/*! ../springbone */ "./src/vrm/springbone/index.ts");
var _v3A = new THREE.Vector3();
var VRMSpringBoneDebug = (function (_super) {
    __extends(VRMSpringBoneDebug, _super);
    function VRMSpringBoneDebug(bone, radius, stiffiness, gravityDir, gravityPower, dragForce, colliders) {
        if (colliders === void 0) { colliders = []; }
        return _super.call(this, bone, radius, stiffiness, gravityDir, gravityPower, dragForce, colliders) || this;
    }
    VRMSpringBoneDebug.prototype.getGizmo = function () {
        if (this._gizmo) {
            return this._gizmo;
        }
        var nextTailRelative = _v3A.copy(this._nextTail).sub(this._worldPosition);
        var nextTailRelativeLength = nextTailRelative.length();
        this._gizmo = new THREE.ArrowHelper(nextTailRelative.normalize(), this._worldPosition, nextTailRelativeLength, 0xffff00, this.radius, this.radius);
        this._gizmo.line.renderOrder = springbone_1.GIZMO_RENDER_ORDER;
        this._gizmo.cone.renderOrder = springbone_1.GIZMO_RENDER_ORDER;
        this._gizmo.line.material.depthTest = false;
        this._gizmo.line.material.transparent = true;
        this._gizmo.cone.material.depthTest = false;
        this._gizmo.cone.material.transparent = true;
        return this._gizmo;
    };
    VRMSpringBoneDebug.prototype.update = function (delta) {
        _super.prototype.update.call(this, delta);
        this._updateGizmo();
    };
    VRMSpringBoneDebug.prototype._updateGizmo = function () {
        if (!this._gizmo) {
            return;
        }
        var nextTailRelative = _v3A.copy(this._currentTail).sub(this._worldPosition);
        var nextTailRelativeLength = nextTailRelative.length();
        this._gizmo.setDirection(nextTailRelative.normalize());
        this._gizmo.setLength(nextTailRelativeLength, this.radius, this.radius);
        this._gizmo.position.copy(this._worldPosition);
    };
    return VRMSpringBoneDebug;
}(springbone_1.VRMSpringBone));
exports.VRMSpringBoneDebug = VRMSpringBoneDebug;


/***/ }),

/***/ "./src/vrm/debug/VRMSpringBoneImporterDebug.ts":
/*!*****************************************************!*\
  !*** ./src/vrm/debug/VRMSpringBoneImporterDebug.ts ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var VRMSpringBoneImporter_1 = __webpack_require__(/*! ../springbone/VRMSpringBoneImporter */ "./src/vrm/springbone/VRMSpringBoneImporter.ts");
var VRMSpringBoneDebug_1 = __webpack_require__(/*! ./VRMSpringBoneDebug */ "./src/vrm/debug/VRMSpringBoneDebug.ts");
var VRMSpringBoneImporterDebug = (function (_super) {
    __extends(VRMSpringBoneImporterDebug, _super);
    function VRMSpringBoneImporterDebug() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(VRMSpringBoneImporterDebug.prototype, "_isColiderMeshVisible", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    VRMSpringBoneImporterDebug.prototype._createSpringBone = function (gltf, bone, hitRadius, stiffiness, gravityDir, gravityPower, dragForce, colliders) {
        if (colliders === void 0) { colliders = []; }
        var springBone = new VRMSpringBoneDebug_1.VRMSpringBoneDebug(bone, hitRadius, stiffiness, gravityDir, gravityPower, dragForce, colliders);
        gltf.scene.add(springBone.getGizmo());
        return springBone;
    };
    return VRMSpringBoneImporterDebug;
}(VRMSpringBoneImporter_1.VRMSpringBoneImporter));
exports.VRMSpringBoneImporterDebug = VRMSpringBoneImporterDebug;


/***/ }),

/***/ "./src/vrm/debug/index.ts":
/*!********************************!*\
  !*** ./src/vrm/debug/index.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./VRMDebugOptions */ "./src/vrm/debug/VRMDebugOptions.ts"));
__export(__webpack_require__(/*! ./VRMDebug */ "./src/vrm/debug/VRMDebug.ts"));
__export(__webpack_require__(/*! ./VRMSpringBoneDebug */ "./src/vrm/debug/VRMSpringBoneDebug.ts"));
__export(__webpack_require__(/*! ./VRMSpringBoneImporterDebug */ "./src/vrm/debug/VRMSpringBoneImporterDebug.ts"));


/***/ }),

/***/ "./src/vrm/firstperson/VRMFirstPerson.ts":
/*!***********************************************!*\
  !*** ./src/vrm/firstperson/VRMFirstPerson.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var math_1 = __webpack_require__(/*! ../utils/math */ "./src/vrm/utils/math.ts");
var VECTOR3_FRONT = Object.freeze(new THREE.Vector3(0.0, 0.0, -1.0));
var _quat = new THREE.Quaternion();
var FirstPersonFlag;
(function (FirstPersonFlag) {
    FirstPersonFlag[FirstPersonFlag["Auto"] = 0] = "Auto";
    FirstPersonFlag[FirstPersonFlag["Both"] = 1] = "Both";
    FirstPersonFlag[FirstPersonFlag["ThirdPersonOnly"] = 2] = "ThirdPersonOnly";
    FirstPersonFlag[FirstPersonFlag["FirstPersonOnly"] = 3] = "FirstPersonOnly";
})(FirstPersonFlag || (FirstPersonFlag = {}));
var VRMRendererFirstPersonFlags = (function () {
    function VRMRendererFirstPersonFlags(firstPersonFlag, mesh) {
        this.firstPersonFlag = VRMRendererFirstPersonFlags._parseFirstPersonFlag(firstPersonFlag);
        this.mesh = mesh;
    }
    VRMRendererFirstPersonFlags._parseFirstPersonFlag = function (firstPersonFlag) {
        switch (firstPersonFlag) {
            case 'Both':
                return FirstPersonFlag.Both;
            case 'ThirdPersonOnly':
                return FirstPersonFlag.ThirdPersonOnly;
            case 'FirstPersonOnly':
                return FirstPersonFlag.FirstPersonOnly;
            default:
                return FirstPersonFlag.Auto;
        }
    };
    return VRMRendererFirstPersonFlags;
}());
exports.VRMRendererFirstPersonFlags = VRMRendererFirstPersonFlags;
var VRMFirstPerson = (function () {
    function VRMFirstPerson(firstPersonBone, firstPersonBoneOffset, meshAnnotations) {
        this._meshAnnotations = [];
        this._firstPersonOnlyLayer = VRMFirstPerson._DEFAULT_FIRSTPERSON_ONLY_LAYER;
        this._thirdPersonOnlyLayer = VRMFirstPerson._DEFAULT_THIRDPERSON_ONLY_LAYER;
        this._initialized = false;
        this._firstPersonBone = firstPersonBone;
        this._firstPersonBoneOffset = firstPersonBoneOffset;
        this._meshAnnotations = meshAnnotations;
    }
    Object.defineProperty(VRMFirstPerson.prototype, "firstPersonBone", {
        get: function () {
            return this._firstPersonBone;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VRMFirstPerson.prototype, "meshAnnotations", {
        get: function () {
            return this._meshAnnotations;
        },
        enumerable: true,
        configurable: true
    });
    VRMFirstPerson.prototype.getFirstPersonWorldDirection = function (target) {
        return target.copy(VECTOR3_FRONT).applyQuaternion(math_1.getWorldQuaternionLite(this._firstPersonBone, _quat));
    };
    Object.defineProperty(VRMFirstPerson.prototype, "firstPersonOnlyLayer", {
        get: function () {
            return this._firstPersonOnlyLayer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VRMFirstPerson.prototype, "thirdPersonOnlyLayer", {
        get: function () {
            return this._thirdPersonOnlyLayer;
        },
        enumerable: true,
        configurable: true
    });
    VRMFirstPerson.prototype.getFirstPersonBoneOffset = function (target) {
        return target.copy(this._firstPersonBoneOffset);
    };
    VRMFirstPerson.prototype.getFirstPersonWorldPosition = function (v3) {
        var offset = this._firstPersonBoneOffset;
        var v4 = new THREE.Vector4(offset.x, offset.y, offset.z, 1.0);
        v4.applyMatrix4(this._firstPersonBone.matrixWorld);
        return v3.set(v4.x, v4.y, v4.z);
    };
    VRMFirstPerson.prototype.setup = function (_a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.firstPersonOnlyLayer, firstPersonOnlyLayer = _c === void 0 ? VRMFirstPerson._DEFAULT_FIRSTPERSON_ONLY_LAYER : _c, _d = _b.thirdPersonOnlyLayer, thirdPersonOnlyLayer = _d === void 0 ? VRMFirstPerson._DEFAULT_THIRDPERSON_ONLY_LAYER : _d;
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        this._firstPersonOnlyLayer = firstPersonOnlyLayer;
        this._thirdPersonOnlyLayer = thirdPersonOnlyLayer;
        this._meshAnnotations.forEach(function (item) {
            if (item.firstPersonFlag === FirstPersonFlag.FirstPersonOnly) {
                item.mesh.layers.set(_this._firstPersonOnlyLayer);
                item.mesh.traverse(function (child) { return child.layers.set(_this._firstPersonOnlyLayer); });
            }
            else if (item.firstPersonFlag === FirstPersonFlag.ThirdPersonOnly) {
                item.mesh.layers.set(_this._thirdPersonOnlyLayer);
                item.mesh.traverse(function (child) { return child.layers.set(_this._thirdPersonOnlyLayer); });
            }
            else if (item.firstPersonFlag === FirstPersonFlag.Auto) {
                _this._createHeadlessModel(item.mesh);
            }
        });
    };
    VRMFirstPerson.prototype._excludeTriangles = function (triangles, bws, skinIndex, exclude) {
        var count = 0;
        if (bws != null && bws.length > 0) {
            for (var i = 0; i < triangles.length; i += 3) {
                var a = triangles[i];
                var b = triangles[i + 1];
                var c = triangles[i + 2];
                var bw0 = bws[a];
                var skin0 = skinIndex[a];
                if (bw0[0] > 0 && exclude.includes(skin0[0]))
                    continue;
                if (bw0[1] > 0 && exclude.includes(skin0[1]))
                    continue;
                if (bw0[2] > 0 && exclude.includes(skin0[2]))
                    continue;
                if (bw0[3] > 0 && exclude.includes(skin0[3]))
                    continue;
                var bw1 = bws[b];
                var skin1 = skinIndex[b];
                if (bw1[0] > 0 && exclude.includes(skin1[0]))
                    continue;
                if (bw1[1] > 0 && exclude.includes(skin1[1]))
                    continue;
                if (bw1[2] > 0 && exclude.includes(skin1[2]))
                    continue;
                if (bw1[3] > 0 && exclude.includes(skin1[3]))
                    continue;
                var bw2 = bws[c];
                var skin2 = skinIndex[c];
                if (bw2[0] > 0 && exclude.includes(skin2[0]))
                    continue;
                if (bw2[1] > 0 && exclude.includes(skin2[1]))
                    continue;
                if (bw2[2] > 0 && exclude.includes(skin2[2]))
                    continue;
                if (bw2[3] > 0 && exclude.includes(skin2[3]))
                    continue;
                triangles[count++] = a;
                triangles[count++] = b;
                triangles[count++] = c;
            }
        }
        return count;
    };
    VRMFirstPerson.prototype._createErasedMesh = function (src, erasingBonesIndex) {
        var dst = new THREE.SkinnedMesh(src.geometry.clone(), src.material);
        dst.name = src.name + "(erase)";
        dst.frustumCulled = src.frustumCulled;
        dst.layers.set(this._firstPersonOnlyLayer);
        var geometry = dst.geometry;
        var skinIndexAttr = geometry.getAttribute('skinIndex').array;
        var skinIndex = [];
        for (var i = 0; i < skinIndexAttr.length; i += 4) {
            skinIndex.push([skinIndexAttr[i], skinIndexAttr[i + 1], skinIndexAttr[i + 2], skinIndexAttr[i + 3]]);
        }
        var skinWeightAttr = geometry.getAttribute('skinWeight').array;
        var skinWeight = [];
        for (var i = 0; i < skinWeightAttr.length; i += 4) {
            skinWeight.push([skinWeightAttr[i], skinWeightAttr[i + 1], skinWeightAttr[i + 2], skinWeightAttr[i + 3]]);
        }
        var oldTriangles = Array.from(geometry.getIndex().array);
        var count = this._excludeTriangles(oldTriangles, skinWeight, skinIndex, erasingBonesIndex);
        var newTriangle = [];
        for (var i = 0; i < count; i++) {
            newTriangle[i] = oldTriangles[i];
        }
        geometry.setIndex(newTriangle);
        if (src.onBeforeRender) {
            dst.onBeforeRender = src.onBeforeRender;
        }
        dst.bind(new THREE.Skeleton(src.skeleton.bones, src.skeleton.boneInverses), new THREE.Matrix4());
        return dst;
    };
    VRMFirstPerson.prototype._createHeadlessModelForSkinnedMesh = function (parent, mesh) {
        var _this = this;
        var eraseBoneIndexes = [];
        mesh.skeleton.bones.forEach(function (bone, index) {
            if (_this._isEraseTarget(bone))
                eraseBoneIndexes.push(index);
        });
        if (!eraseBoneIndexes.length) {
            mesh.layers.enable(this._thirdPersonOnlyLayer);
            mesh.layers.enable(this._firstPersonOnlyLayer);
            return;
        }
        mesh.layers.set(this._thirdPersonOnlyLayer);
        var newMesh = this._createErasedMesh(mesh, eraseBoneIndexes);
        parent.add(newMesh);
    };
    VRMFirstPerson.prototype._createHeadlessModel = function (node) {
        var _this = this;
        if (node.type === 'Group') {
            node.layers.set(this._thirdPersonOnlyLayer);
            if (this._isEraseTarget(node)) {
                node.traverse(function (child) { return child.layers.set(_this._thirdPersonOnlyLayer); });
            }
            else {
                var parent_1 = new THREE.Group();
                parent_1.name = "_headless_" + node.name;
                parent_1.layers.set(this._firstPersonOnlyLayer);
                node.parent.add(parent_1);
                node.children
                    .filter(function (child) { return child.type === 'SkinnedMesh'; })
                    .forEach(function (child) {
                    _this._createHeadlessModelForSkinnedMesh(parent_1, child);
                });
            }
        }
        else if (node.type === 'SkinnedMesh') {
            this._createHeadlessModelForSkinnedMesh(node.parent, node);
        }
        else {
            if (this._isEraseTarget(node)) {
                node.layers.set(this._thirdPersonOnlyLayer);
                node.traverse(function (child) { return child.layers.set(_this._thirdPersonOnlyLayer); });
            }
        }
    };
    VRMFirstPerson.prototype._isEraseTarget = function (bone) {
        if (bone.name === this._firstPersonBone.name) {
            return true;
        }
        else if (!bone.parent) {
            return false;
        }
        else {
            return this._isEraseTarget(bone.parent);
        }
    };
    VRMFirstPerson._DEFAULT_FIRSTPERSON_ONLY_LAYER = 9;
    VRMFirstPerson._DEFAULT_THIRDPERSON_ONLY_LAYER = 10;
    return VRMFirstPerson;
}());
exports.VRMFirstPerson = VRMFirstPerson;


/***/ }),

/***/ "./src/vrm/firstperson/VRMFirstPersonImporter.ts":
/*!*******************************************************!*\
  !*** ./src/vrm/firstperson/VRMFirstPersonImporter.ts ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var types_1 = __webpack_require__(/*! ../types */ "./src/vrm/types/index.ts");
var VRMFirstPerson_1 = __webpack_require__(/*! ./VRMFirstPerson */ "./src/vrm/firstperson/VRMFirstPerson.ts");
var VRMFirstPersonImporter = (function () {
    function VRMFirstPersonImporter() {
    }
    VRMFirstPersonImporter.prototype.import = function (gltf, humanoid) {
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, schemaFirstPerson, firstPersonBoneIndex, firstPersonBone, firstPersonBoneOffset, meshAnnotations, meshes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
                        if (!vrmExt) {
                            return [2, null];
                        }
                        schemaFirstPerson = vrmExt.firstPerson;
                        if (!schemaFirstPerson) {
                            return [2, null];
                        }
                        firstPersonBoneIndex = schemaFirstPerson.firstPersonBone;
                        if (!(firstPersonBoneIndex === undefined || firstPersonBoneIndex === -1)) return [3, 1];
                        firstPersonBone = humanoid.getBoneNode(types_1.VRMSchema.HumanoidBoneName.Head);
                        return [3, 3];
                    case 1: return [4, gltf.parser.getDependency('node', firstPersonBoneIndex)];
                    case 2:
                        firstPersonBone = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!firstPersonBone) {
                            console.warn('VRMFirstPersonImporter: Could not find firstPersonBone of the VRM');
                            return [2, null];
                        }
                        firstPersonBoneOffset = schemaFirstPerson.firstPersonBoneOffset
                            ? new THREE.Vector3(schemaFirstPerson.firstPersonBoneOffset.x, schemaFirstPerson.firstPersonBoneOffset.y, schemaFirstPerson.firstPersonBoneOffset.z)
                            : new THREE.Vector3(0.0, 0.06, 0.0);
                        meshAnnotations = [];
                        return [4, gltf.parser.getDependencies('mesh')];
                    case 4:
                        meshes = _a.sent();
                        meshes.forEach(function (mesh, meshIndex) {
                            var flag = schemaFirstPerson.meshAnnotations
                                ? schemaFirstPerson.meshAnnotations.find(function (a) { return a.mesh === meshIndex; })
                                : undefined;
                            meshAnnotations.push(new VRMFirstPerson_1.VRMRendererFirstPersonFlags(flag && flag.firstPersonFlag, mesh));
                        });
                        return [2, new VRMFirstPerson_1.VRMFirstPerson(firstPersonBone, firstPersonBoneOffset, meshAnnotations)];
                }
            });
        });
    };
    return VRMFirstPersonImporter;
}());
exports.VRMFirstPersonImporter = VRMFirstPersonImporter;


/***/ }),

/***/ "./src/vrm/firstperson/index.ts":
/*!**************************************!*\
  !*** ./src/vrm/firstperson/index.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./VRMFirstPerson */ "./src/vrm/firstperson/VRMFirstPerson.ts"));
__export(__webpack_require__(/*! ./VRMFirstPersonImporter */ "./src/vrm/firstperson/VRMFirstPersonImporter.ts"));


/***/ }),

/***/ "./src/vrm/humanoid/VRMHumanBone.ts":
/*!******************************************!*\
  !*** ./src/vrm/humanoid/VRMHumanBone.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var VRMHumanBone = (function () {
    function VRMHumanBone(node, humanLimit) {
        this.node = node;
        this.humanLimit = humanLimit;
    }
    return VRMHumanBone;
}());
exports.VRMHumanBone = VRMHumanBone;


/***/ }),

/***/ "./src/vrm/humanoid/VRMHumanBones.ts":
/*!*******************************************!*\
  !*** ./src/vrm/humanoid/VRMHumanBones.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/humanoid/VRMHumanDescription.ts":
/*!*************************************************!*\
  !*** ./src/vrm/humanoid/VRMHumanDescription.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/humanoid/VRMHumanLimit.ts":
/*!*******************************************!*\
  !*** ./src/vrm/humanoid/VRMHumanLimit.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/humanoid/VRMHumanoid.ts":
/*!*****************************************!*\
  !*** ./src/vrm/humanoid/VRMHumanoid.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(/*! ../types */ "./src/vrm/types/index.ts");
var VRMHumanoid = (function () {
    function VRMHumanoid(boneArray, humanDescription) {
        this.humanBones = this._createHumanBones(boneArray);
        this.humanDescription = humanDescription;
        this.restPose = this.getPose();
    }
    VRMHumanoid.prototype.getPose = function () {
        var _this = this;
        var pose = {};
        Object.keys(this.humanBones).forEach(function (vrmBoneName) {
            var node = _this.getBoneNode(vrmBoneName);
            if (!node) {
                return;
            }
            if (pose[vrmBoneName]) {
                return;
            }
            pose[vrmBoneName] = {
                position: node.position.toArray(),
                rotation: node.quaternion.toArray(),
            };
        }, {});
        return pose;
    };
    VRMHumanoid.prototype.setPose = function (poseObject) {
        var _this = this;
        Object.keys(poseObject).forEach(function (boneName) {
            var state = poseObject[boneName];
            var node = _this.getBoneNode(boneName);
            if (!node) {
                return;
            }
            var restState = _this.restPose[boneName];
            if (!restState) {
                return;
            }
            if (state.position) {
                node.position.set(restState.position[0] + state.position[0], restState.position[1] + state.position[1], restState.position[2] + state.position[2]);
            }
            if (state.rotation) {
                node.quaternion.fromArray(state.rotation);
            }
        });
    };
    VRMHumanoid.prototype.getBone = function (name) {
        return this.humanBones[name][0] || undefined;
    };
    VRMHumanoid.prototype.getBones = function (name) {
        return this.humanBones[name];
    };
    VRMHumanoid.prototype.getBoneNode = function (name) {
        return (this.humanBones[name][0] && this.humanBones[name][0].node) || null;
    };
    VRMHumanoid.prototype.getBoneNodes = function (name) {
        return this.humanBones[name].map(function (bone) { return bone.node; });
    };
    VRMHumanoid.prototype._createHumanBones = function (boneArray) {
        var bones = Object.values(types_1.VRMSchema.HumanoidBoneName).reduce(function (accum, name) {
            accum[name] = [];
            return accum;
        }, {});
        boneArray.forEach(function (bone) {
            bones[bone.name].push(bone.bone);
        });
        return bones;
    };
    return VRMHumanoid;
}());
exports.VRMHumanoid = VRMHumanoid;


/***/ }),

/***/ "./src/vrm/humanoid/VRMHumanoidImporter.ts":
/*!*************************************************!*\
  !*** ./src/vrm/humanoid/VRMHumanoidImporter.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var VRMHumanBone_1 = __webpack_require__(/*! ./VRMHumanBone */ "./src/vrm/humanoid/VRMHumanBone.ts");
var VRMHumanoid_1 = __webpack_require__(/*! ./VRMHumanoid */ "./src/vrm/humanoid/VRMHumanoid.ts");
var VRMHumanoidImporter = (function () {
    function VRMHumanoidImporter() {
    }
    VRMHumanoidImporter.prototype.import = function (gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, schemaHumanoid, humanBoneArray, humanDescription;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
                        if (!vrmExt) {
                            return [2, null];
                        }
                        schemaHumanoid = vrmExt.humanoid;
                        if (!schemaHumanoid) {
                            return [2, null];
                        }
                        humanBoneArray = [];
                        if (!schemaHumanoid.humanBones) return [3, 2];
                        return [4, Promise.all(schemaHumanoid.humanBones.map(function (bone) { return __awaiter(_this, void 0, void 0, function () {
                                var node;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!bone.bone || !bone.node) {
                                                return [2];
                                            }
                                            return [4, gltf.parser.getDependency('node', bone.node)];
                                        case 1:
                                            node = _a.sent();
                                            humanBoneArray.push({
                                                name: bone.bone,
                                                bone: new VRMHumanBone_1.VRMHumanBone(node, {
                                                    axisLength: bone.axisLength,
                                                    center: bone.center && new THREE.Vector3(bone.center.x, bone.center.y, bone.center.z),
                                                    max: bone.max && new THREE.Vector3(bone.max.x, bone.max.y, bone.max.z),
                                                    min: bone.min && new THREE.Vector3(bone.min.x, bone.min.y, bone.min.z),
                                                    useDefaultValues: bone.useDefaultValues,
                                                }),
                                            });
                                            return [2];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        humanDescription = {
                            armStretch: schemaHumanoid.armStretch,
                            legStretch: schemaHumanoid.legStretch,
                            upperArmTwist: schemaHumanoid.upperArmTwist,
                            lowerArmTwist: schemaHumanoid.lowerArmTwist,
                            upperLegTwist: schemaHumanoid.upperLegTwist,
                            lowerLegTwist: schemaHumanoid.lowerLegTwist,
                            feetSpacing: schemaHumanoid.feetSpacing,
                            hasTranslationDoF: schemaHumanoid.hasTranslationDoF,
                        };
                        return [2, new VRMHumanoid_1.VRMHumanoid(humanBoneArray, humanDescription)];
                }
            });
        });
    };
    return VRMHumanoidImporter;
}());
exports.VRMHumanoidImporter = VRMHumanoidImporter;


/***/ }),

/***/ "./src/vrm/humanoid/index.ts":
/*!***********************************!*\
  !*** ./src/vrm/humanoid/index.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./VRMHumanBone */ "./src/vrm/humanoid/VRMHumanBone.ts"));
__export(__webpack_require__(/*! ./VRMHumanBones */ "./src/vrm/humanoid/VRMHumanBones.ts"));
__export(__webpack_require__(/*! ./VRMHumanDescription */ "./src/vrm/humanoid/VRMHumanDescription.ts"));
__export(__webpack_require__(/*! ./VRMHumanLimit */ "./src/vrm/humanoid/VRMHumanLimit.ts"));
__export(__webpack_require__(/*! ./VRMHumanoid */ "./src/vrm/humanoid/VRMHumanoid.ts"));
__export(__webpack_require__(/*! ./VRMHumanoidImporter */ "./src/vrm/humanoid/VRMHumanoidImporter.ts"));


/***/ }),

/***/ "./src/vrm/index.ts":
/*!**************************!*\
  !*** ./src/vrm/index.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./VRM */ "./src/vrm/VRM.ts"));
__export(__webpack_require__(/*! ./VRMImporter */ "./src/vrm/VRMImporter.ts"));
__export(__webpack_require__(/*! ./reduceBones */ "./src/vrm/reduceBones.ts"));
__export(__webpack_require__(/*! ./blendshape */ "./src/vrm/blendshape/index.ts"));
__export(__webpack_require__(/*! ./debug */ "./src/vrm/debug/index.ts"));
__export(__webpack_require__(/*! ./firstperson */ "./src/vrm/firstperson/index.ts"));
__export(__webpack_require__(/*! ./humanoid */ "./src/vrm/humanoid/index.ts"));
__export(__webpack_require__(/*! ./lookat */ "./src/vrm/lookat/index.ts"));
__export(__webpack_require__(/*! ./springbone */ "./src/vrm/springbone/index.ts"));
__export(__webpack_require__(/*! ./types */ "./src/vrm/types/index.ts"));
__export(__webpack_require__(/*! ./material */ "./src/vrm/material/index.ts"));


/***/ }),

/***/ "./src/vrm/lookat/CurveMapper.ts":
/*!***************************************!*\
  !*** ./src/vrm/lookat/CurveMapper.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var hermiteSpline = function (y0, y1, t0, t1, x) {
    var xc = x * x * x;
    var xs = x * x;
    var dy = y1 - y0;
    var h01 = -2.0 * xc + 3.0 * xs;
    var h10 = xc - 2.0 * xs + x;
    var h11 = xc - xs;
    return y0 + dy * h01 + t0 * h10 + t1 * h11;
};
var evaluateCurve = function (arr, x) {
    if (arr.length < 8) {
        throw new Error('evaluateCurve: Invalid curve detected! (Array length must be 8 at least)');
    }
    if (arr.length % 4 !== 0) {
        throw new Error('evaluateCurve: Invalid curve detected! (Array length must be multiples of 4');
    }
    var outNode;
    for (outNode = 0;; outNode++) {
        if (arr.length <= 4 * outNode) {
            return arr[4 * outNode - 3];
        }
        else if (x <= arr[4 * outNode]) {
            break;
        }
    }
    var inNode = outNode - 1;
    if (inNode < 0) {
        return arr[4 * inNode + 5];
    }
    var x0 = arr[4 * inNode];
    var x1 = arr[4 * outNode];
    var xHermite = (x - x0) / (x1 - x0);
    var y0 = arr[4 * inNode + 1];
    var y1 = arr[4 * outNode + 1];
    var t0 = arr[4 * inNode + 3];
    var t1 = arr[4 * outNode + 2];
    return hermiteSpline(y0, y1, t0, t1, xHermite);
};
var CurveMapper = (function () {
    function CurveMapper(xRange, yRange, curve) {
        this.curve = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0];
        this.curveXRangeDegree = 90.0;
        this.curveYRangeDegree = 10.0;
        if (xRange !== undefined) {
            this.curveXRangeDegree = xRange;
        }
        if (yRange !== undefined) {
            this.curveYRangeDegree = yRange;
        }
        if (curve !== undefined) {
            this.curve = curve;
        }
    }
    CurveMapper.prototype.map = function (src) {
        var clampedSrc = Math.min(Math.max(src, 0.0), this.curveXRangeDegree);
        var x = clampedSrc / this.curveXRangeDegree;
        return this.curveYRangeDegree * evaluateCurve(this.curve, x);
    };
    return CurveMapper;
}());
exports.CurveMapper = CurveMapper;


/***/ }),

/***/ "./src/vrm/lookat/VRMLookAtApplyer.ts":
/*!********************************************!*\
  !*** ./src/vrm/lookat/VRMLookAtApplyer.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var VRMLookAtApplyer = (function () {
    function VRMLookAtApplyer() {
    }
    return VRMLookAtApplyer;
}());
exports.VRMLookAtApplyer = VRMLookAtApplyer;


/***/ }),

/***/ "./src/vrm/lookat/VRMLookAtBlendShapeApplyer.ts":
/*!******************************************************!*\
  !*** ./src/vrm/lookat/VRMLookAtBlendShapeApplyer.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(/*! ../types */ "./src/vrm/types/index.ts");
var VRMLookAtApplyer_1 = __webpack_require__(/*! ./VRMLookAtApplyer */ "./src/vrm/lookat/VRMLookAtApplyer.ts");
var VRMLookAtBlendShapeApplyer = (function (_super) {
    __extends(VRMLookAtBlendShapeApplyer, _super);
    function VRMLookAtBlendShapeApplyer(blendShapeProxy, curveHorizontal, curveVerticalDown, curveVerticalUp) {
        var _this = _super.call(this) || this;
        _this.type = types_1.VRMSchema.FirstPersonLookAtTypeName.BlendShape;
        _this._curveHorizontal = curveHorizontal;
        _this._curveVerticalDown = curveVerticalDown;
        _this._curveVerticalUp = curveVerticalUp;
        _this._blendShapeProxy = blendShapeProxy;
        return _this;
    }
    VRMLookAtBlendShapeApplyer.prototype.name = function () {
        return types_1.VRMSchema.FirstPersonLookAtTypeName.BlendShape;
    };
    VRMLookAtBlendShapeApplyer.prototype.lookAt = function (euler) {
        var srcX = euler.x;
        var srcY = euler.y;
        if (srcX < 0.0) {
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookup, 0.0);
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookdown, this._curveVerticalDown.map(-srcX));
        }
        else {
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookdown, 0.0);
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookup, this._curveVerticalUp.map(srcX));
        }
        if (srcY < 0.0) {
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookleft, 0.0);
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookright, this._curveHorizontal.map(-srcY));
        }
        else {
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookright, 0.0);
            this._blendShapeProxy.setValue(types_1.VRMSchema.BlendShapePresetName.Lookleft, this._curveHorizontal.map(srcY));
        }
    };
    return VRMLookAtBlendShapeApplyer;
}(VRMLookAtApplyer_1.VRMLookAtApplyer));
exports.VRMLookAtBlendShapeApplyer = VRMLookAtBlendShapeApplyer;


/***/ }),

/***/ "./src/vrm/lookat/VRMLookAtBoneApplyer.ts":
/*!************************************************!*\
  !*** ./src/vrm/lookat/VRMLookAtBoneApplyer.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var types_1 = __webpack_require__(/*! ../types */ "./src/vrm/types/index.ts");
var VRMLookAtApplyer_1 = __webpack_require__(/*! ./VRMLookAtApplyer */ "./src/vrm/lookat/VRMLookAtApplyer.ts");
var VRMLookAtHead_1 = __webpack_require__(/*! ./VRMLookAtHead */ "./src/vrm/lookat/VRMLookAtHead.ts");
var _euler = new THREE.Euler(0.0, 0.0, 0.0, VRMLookAtHead_1.VRMLookAtHead.EULER_ORDER);
var VRMLookAtBoneApplyer = (function (_super) {
    __extends(VRMLookAtBoneApplyer, _super);
    function VRMLookAtBoneApplyer(humanoid, curveHorizontalInner, curveHorizontalOuter, curveVerticalDown, curveVerticalUp) {
        var _this = _super.call(this) || this;
        _this.type = types_1.VRMSchema.FirstPersonLookAtTypeName.Bone;
        _this._curveHorizontalInner = curveHorizontalInner;
        _this._curveHorizontalOuter = curveHorizontalOuter;
        _this._curveVerticalDown = curveVerticalDown;
        _this._curveVerticalUp = curveVerticalUp;
        _this._leftEye = humanoid.getBoneNode(types_1.VRMSchema.HumanoidBoneName.LeftEye);
        _this._rightEye = humanoid.getBoneNode(types_1.VRMSchema.HumanoidBoneName.RightEye);
        return _this;
    }
    VRMLookAtBoneApplyer.prototype.lookAt = function (euler) {
        var srcX = euler.x;
        var srcY = euler.y;
        if (this._leftEye) {
            if (srcX < 0.0) {
                _euler.x = -this._curveVerticalDown.map(-srcX);
            }
            else {
                _euler.x = this._curveVerticalUp.map(srcX);
            }
            if (srcY < 0.0) {
                _euler.y = -this._curveHorizontalInner.map(-srcY);
            }
            else {
                _euler.y = this._curveHorizontalOuter.map(srcY);
            }
            this._leftEye.quaternion.setFromEuler(_euler);
        }
        if (this._rightEye) {
            if (srcX < 0.0) {
                _euler.x = -this._curveVerticalDown.map(-srcX);
            }
            else {
                _euler.x = this._curveVerticalUp.map(srcX);
            }
            if (srcY < 0.0) {
                _euler.y = -this._curveHorizontalOuter.map(-srcY);
            }
            else {
                _euler.y = this._curveHorizontalInner.map(srcY);
            }
            this._rightEye.quaternion.setFromEuler(_euler);
        }
    };
    return VRMLookAtBoneApplyer;
}(VRMLookAtApplyer_1.VRMLookAtApplyer));
exports.VRMLookAtBoneApplyer = VRMLookAtBoneApplyer;


/***/ }),

/***/ "./src/vrm/lookat/VRMLookAtHead.ts":
/*!*****************************************!*\
  !*** ./src/vrm/lookat/VRMLookAtHead.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var math_1 = __webpack_require__(/*! ../utils/math */ "./src/vrm/utils/math.ts");
var VECTOR3_FRONT = Object.freeze(new THREE.Vector3(0.0, 0.0, -1.0));
var _v3A = new THREE.Vector3();
var _v3B = new THREE.Vector3();
var _v3C = new THREE.Vector3();
var _quat = new THREE.Quaternion();
var VRMLookAtHead = (function () {
    function VRMLookAtHead(firstPerson, applyer) {
        this.autoUpdate = true;
        this._euler = new THREE.Euler(0.0, 0.0, 0.0, VRMLookAtHead.EULER_ORDER);
        this.firstPerson = firstPerson;
        this.applyer = applyer;
    }
    VRMLookAtHead.prototype.getLookAtWorldDirection = function (target) {
        var rot = math_1.getWorldQuaternionLite(this.firstPerson.firstPersonBone, _quat);
        return target
            .copy(VECTOR3_FRONT)
            .applyEuler(this._euler)
            .applyQuaternion(rot);
    };
    VRMLookAtHead.prototype.lookAt = function (position) {
        this._calcEuler(this._euler, position);
        if (this.applyer) {
            this.applyer.lookAt(this._euler);
        }
    };
    VRMLookAtHead.prototype.update = function (delta) {
        if (this.target && this.autoUpdate) {
            this.lookAt(this.target.getWorldPosition(_v3A));
            if (this.applyer) {
                this.applyer.lookAt(this._euler);
            }
        }
    };
    VRMLookAtHead.prototype._calcEuler = function (target, position) {
        var headPosition = this.firstPerson.getFirstPersonWorldPosition(_v3B);
        var lookAtDir = _v3C
            .copy(position)
            .sub(headPosition)
            .normalize();
        lookAtDir.applyQuaternion(math_1.getWorldQuaternionLite(this.firstPerson.firstPersonBone, _quat).inverse());
        target.x = Math.atan2(lookAtDir.y, Math.sqrt(lookAtDir.x * lookAtDir.x + lookAtDir.z * lookAtDir.z));
        target.y = Math.atan2(-lookAtDir.x, -lookAtDir.z);
        return target;
    };
    VRMLookAtHead.EULER_ORDER = 'YXZ';
    return VRMLookAtHead;
}());
exports.VRMLookAtHead = VRMLookAtHead;


/***/ }),

/***/ "./src/vrm/lookat/VRMLookAtImporter.ts":
/*!*********************************************!*\
  !*** ./src/vrm/lookat/VRMLookAtImporter.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var types_1 = __webpack_require__(/*! ../types */ "./src/vrm/types/index.ts");
var CurveMapper_1 = __webpack_require__(/*! ./CurveMapper */ "./src/vrm/lookat/CurveMapper.ts");
var VRMLookAtBlendShapeApplyer_1 = __webpack_require__(/*! ./VRMLookAtBlendShapeApplyer */ "./src/vrm/lookat/VRMLookAtBlendShapeApplyer.ts");
var VRMLookAtBoneApplyer_1 = __webpack_require__(/*! ./VRMLookAtBoneApplyer */ "./src/vrm/lookat/VRMLookAtBoneApplyer.ts");
var VRMLookAtHead_1 = __webpack_require__(/*! ./VRMLookAtHead */ "./src/vrm/lookat/VRMLookAtHead.ts");
var VRMLookAtImporter = (function () {
    function VRMLookAtImporter() {
    }
    VRMLookAtImporter.prototype.import = function (gltf, firstPerson, blendShapeProxy, humanoid) {
        var vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
        if (!vrmExt) {
            return null;
        }
        var schemaFirstPerson = vrmExt.firstPerson;
        if (!schemaFirstPerson) {
            return null;
        }
        var applyer = this._importApplyer(schemaFirstPerson, blendShapeProxy, humanoid);
        return new VRMLookAtHead_1.VRMLookAtHead(firstPerson, applyer || undefined);
    };
    VRMLookAtImporter.prototype._importApplyer = function (schemaFirstPerson, blendShapeProxy, humanoid) {
        var lookAtHorizontalInner = schemaFirstPerson.lookAtHorizontalInner;
        var lookAtHorizontalOuter = schemaFirstPerson.lookAtHorizontalOuter;
        var lookAtVerticalDown = schemaFirstPerson.lookAtVerticalDown;
        var lookAtVerticalUp = schemaFirstPerson.lookAtVerticalUp;
        switch (schemaFirstPerson.lookAtTypeName) {
            case types_1.VRMSchema.FirstPersonLookAtTypeName.Bone: {
                if (lookAtHorizontalInner === undefined ||
                    lookAtHorizontalOuter === undefined ||
                    lookAtVerticalDown === undefined ||
                    lookAtVerticalUp === undefined) {
                    return null;
                }
                else {
                    return new VRMLookAtBoneApplyer_1.VRMLookAtBoneApplyer(humanoid, this._importCurveMapperBone(lookAtHorizontalInner), this._importCurveMapperBone(lookAtHorizontalOuter), this._importCurveMapperBone(lookAtVerticalDown), this._importCurveMapperBone(lookAtVerticalUp));
                }
            }
            case types_1.VRMSchema.FirstPersonLookAtTypeName.BlendShape: {
                if (lookAtHorizontalOuter === undefined || lookAtVerticalDown === undefined || lookAtVerticalUp === undefined) {
                    return null;
                }
                else {
                    return new VRMLookAtBlendShapeApplyer_1.VRMLookAtBlendShapeApplyer(blendShapeProxy, this._importCurveMapperBlendShape(lookAtHorizontalOuter), this._importCurveMapperBlendShape(lookAtVerticalDown), this._importCurveMapperBlendShape(lookAtVerticalUp));
                }
            }
            default: {
                return null;
            }
        }
    };
    VRMLookAtImporter.prototype._importCurveMapperBone = function (map) {
        return new CurveMapper_1.CurveMapper(typeof map.xRange === 'number' ? THREE.Math.DEG2RAD * map.xRange : undefined, typeof map.yRange === 'number' ? THREE.Math.DEG2RAD * map.yRange : undefined, map.curve);
    };
    VRMLookAtImporter.prototype._importCurveMapperBlendShape = function (map) {
        return new CurveMapper_1.CurveMapper(typeof map.xRange === 'number' ? THREE.Math.DEG2RAD * map.xRange : undefined, map.yRange, map.curve);
    };
    return VRMLookAtImporter;
}());
exports.VRMLookAtImporter = VRMLookAtImporter;


/***/ }),

/***/ "./src/vrm/lookat/index.ts":
/*!*********************************!*\
  !*** ./src/vrm/lookat/index.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./CurveMapper */ "./src/vrm/lookat/CurveMapper.ts"));
__export(__webpack_require__(/*! ./VRMLookAtApplyer */ "./src/vrm/lookat/VRMLookAtApplyer.ts"));
__export(__webpack_require__(/*! ./VRMLookAtBlendShapeApplyer */ "./src/vrm/lookat/VRMLookAtBlendShapeApplyer.ts"));
__export(__webpack_require__(/*! ./VRMLookAtBoneApplyer */ "./src/vrm/lookat/VRMLookAtBoneApplyer.ts"));
__export(__webpack_require__(/*! ./VRMLookAtHead */ "./src/vrm/lookat/VRMLookAtHead.ts"));
__export(__webpack_require__(/*! ./VRMLookAtImporter */ "./src/vrm/lookat/VRMLookAtImporter.ts"));


/***/ }),

/***/ "./src/vrm/material/MToonMaterial.ts":
/*!*******************************************!*\
  !*** ./src/vrm/material/MToonMaterial.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var getTexelDecodingFunction_1 = __webpack_require__(/*! ./getTexelDecodingFunction */ "./src/vrm/material/getTexelDecodingFunction.ts");
var mtoon_vert_1 = __webpack_require__(/*! ./shaders/mtoon.vert */ "./src/vrm/material/shaders/mtoon.vert");
var mtoon_frag_1 = __webpack_require__(/*! ./shaders/mtoon.frag */ "./src/vrm/material/shaders/mtoon.frag");
var TAU = 2.0 * Math.PI;
var MToonMaterialCullMode;
(function (MToonMaterialCullMode) {
    MToonMaterialCullMode[MToonMaterialCullMode["Off"] = 0] = "Off";
    MToonMaterialCullMode[MToonMaterialCullMode["Front"] = 1] = "Front";
    MToonMaterialCullMode[MToonMaterialCullMode["Back"] = 2] = "Back";
})(MToonMaterialCullMode = exports.MToonMaterialCullMode || (exports.MToonMaterialCullMode = {}));
var MToonMaterialDebugMode;
(function (MToonMaterialDebugMode) {
    MToonMaterialDebugMode[MToonMaterialDebugMode["None"] = 0] = "None";
    MToonMaterialDebugMode[MToonMaterialDebugMode["Normal"] = 1] = "Normal";
    MToonMaterialDebugMode[MToonMaterialDebugMode["LitShadeRate"] = 2] = "LitShadeRate";
    MToonMaterialDebugMode[MToonMaterialDebugMode["UV"] = 3] = "UV";
})(MToonMaterialDebugMode = exports.MToonMaterialDebugMode || (exports.MToonMaterialDebugMode = {}));
var MToonMaterialOutlineColorMode;
(function (MToonMaterialOutlineColorMode) {
    MToonMaterialOutlineColorMode[MToonMaterialOutlineColorMode["FixedColor"] = 0] = "FixedColor";
    MToonMaterialOutlineColorMode[MToonMaterialOutlineColorMode["MixedLighting"] = 1] = "MixedLighting";
})(MToonMaterialOutlineColorMode = exports.MToonMaterialOutlineColorMode || (exports.MToonMaterialOutlineColorMode = {}));
var MToonMaterialOutlineWidthMode;
(function (MToonMaterialOutlineWidthMode) {
    MToonMaterialOutlineWidthMode[MToonMaterialOutlineWidthMode["None"] = 0] = "None";
    MToonMaterialOutlineWidthMode[MToonMaterialOutlineWidthMode["WorldCoordinates"] = 1] = "WorldCoordinates";
    MToonMaterialOutlineWidthMode[MToonMaterialOutlineWidthMode["ScreenCoordinates"] = 2] = "ScreenCoordinates";
})(MToonMaterialOutlineWidthMode = exports.MToonMaterialOutlineWidthMode || (exports.MToonMaterialOutlineWidthMode = {}));
var MToonMaterialRenderMode;
(function (MToonMaterialRenderMode) {
    MToonMaterialRenderMode[MToonMaterialRenderMode["Opaque"] = 0] = "Opaque";
    MToonMaterialRenderMode[MToonMaterialRenderMode["Cutout"] = 1] = "Cutout";
    MToonMaterialRenderMode[MToonMaterialRenderMode["Transparent"] = 2] = "Transparent";
    MToonMaterialRenderMode[MToonMaterialRenderMode["TransparentWithZWrite"] = 3] = "TransparentWithZWrite";
})(MToonMaterialRenderMode = exports.MToonMaterialRenderMode || (exports.MToonMaterialRenderMode = {}));
var MToonMaterial = (function (_super) {
    __extends(MToonMaterial, _super);
    function MToonMaterial(colorSpaceGamma, parameters) {
        var _this = _super.call(this) || this;
        _this.isMToonMaterial = true;
        _this.cutoff = 0.5;
        _this.color = new THREE.Vector4(1.0, 1.0, 1.0, 1.0);
        _this.shadeColor = new THREE.Vector4(0.97, 0.81, 0.86, 1.0);
        _this.map = null;
        _this.mainTex_ST = new THREE.Vector4(0.0, 0.0, 1.0, 1.0);
        _this.shadeTexture = null;
        _this.bumpScale = 1.0;
        _this.normalMap = null;
        _this.receiveShadowRate = 1.0;
        _this.receiveShadowTexture = null;
        _this.shadingGradeRate = 1.0;
        _this.shadingGradeTexture = null;
        _this.shadeShift = 0.0;
        _this.shadeToony = 0.9;
        _this.lightColorAttenuation = 0.0;
        _this.indirectLightIntensity = 0.1;
        _this.rimTexture = null;
        _this.rimColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
        _this.rimLightingMix = 0.0;
        _this.rimFresnelPower = 1.0;
        _this.rimLift = 0.0;
        _this.sphereAdd = null;
        _this.emissionColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
        _this.emissiveMap = null;
        _this.outlineWidthTexture = null;
        _this.outlineWidth = 0.5;
        _this.outlineScaledMaxDistance = 1.0;
        _this.outlineColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
        _this.outlineLightingMix = 1.0;
        _this.uvAnimMaskTexture = null;
        _this.uvAnimScrollX = 0.0;
        _this.uvAnimScrollY = 0.0;
        _this.uvAnimRotation = 0.0;
        _this.shouldApplyUniforms = true;
        _this._debugMode = MToonMaterialDebugMode.None;
        _this._blendMode = MToonMaterialRenderMode.Opaque;
        _this._outlineWidthMode = MToonMaterialOutlineWidthMode.None;
        _this._outlineColorMode = MToonMaterialOutlineColorMode.FixedColor;
        _this._cullMode = MToonMaterialCullMode.Back;
        _this._outlineCullMode = MToonMaterialCullMode.Front;
        _this._isOutline = false;
        _this._uvAnimOffsetX = 0.0;
        _this._uvAnimOffsetY = 0.0;
        _this._uvAnimPhase = 0.0;
        _this._colorSpaceGamma = colorSpaceGamma;
        if (parameters === undefined) {
            parameters = {};
        }
        [
            'mToonVersion',
            'shadeTexture_ST',
            'bumpMap_ST',
            'receiveShadowTexture_ST',
            'shadingGradeTexture_ST',
            'sphereAdd_ST',
            'emissionMap_ST',
            'outlineWidthTexture_ST',
            'srcBlend',
            'dstBlend',
        ].forEach(function (key) {
            if (parameters[key] !== undefined) {
                delete parameters[key];
            }
        });
        parameters.fog = true;
        parameters.lights = true;
        parameters.clipping = true;
        parameters.skinning = parameters.skinning || false;
        parameters.morphTargets = parameters.morphTargets || false;
        parameters.morphNormals = parameters.morphNormals || false;
        parameters.uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.normalmap,
            THREE.UniformsLib.emissivemap,
            THREE.UniformsLib.fog,
            THREE.UniformsLib.lights,
            {
                cutoff: { value: 0.5 },
                color: { value: new THREE.Color(1.0, 1.0, 1.0) },
                colorAlpha: { value: 1.0 },
                shadeColor: { value: new THREE.Color(0.97, 0.81, 0.86) },
                mainTex_ST: { value: new THREE.Vector4(0.0, 0.0, 1.0, 1.0) },
                shadeTexture: { value: null },
                bumpScale: { value: 1.0 },
                receiveShadowRate: { value: 1.0 },
                receiveShadowTexture: { value: null },
                shadingGradeRate: { value: 1.0 },
                shadingGradeTexture: { value: null },
                shadeShift: { value: 0.0 },
                shadeToony: { value: 0.9 },
                lightColorAttenuation: { value: 0.0 },
                indirectLightIntensity: { value: 0.1 },
                rimTexture: { value: null },
                rimColor: { value: new THREE.Color(0.0, 0.0, 0.0) },
                rimLightingMix: { value: 0.0 },
                rimFresnelPower: { value: 1.0 },
                rimLift: { value: 0.0 },
                sphereAdd: { value: null },
                emissionColor: { value: new THREE.Color(0.0, 0.0, 0.0) },
                outlineWidthTexture: { value: null },
                outlineWidth: { value: 0.5 },
                outlineScaledMaxDistance: { value: 1.0 },
                outlineColor: { value: new THREE.Color(0.0, 0.0, 0.0) },
                outlineLightingMix: { value: 1.0 },
                uvAnimMaskTexture: { value: null },
                uvAnimOffsetX: { value: 0.0 },
                uvAnimOffsetY: { value: 0.0 },
                uvAnimTheta: { value: 0.0 },
            },
        ]);
        _this.setValues(parameters);
        _this._updateShaderCode();
        _this._applyUniforms();
        return _this;
    }
    Object.defineProperty(MToonMaterial.prototype, "mainTex", {
        get: function () {
            return this.map;
        },
        set: function (t) {
            this.map = t;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "bumpMap", {
        get: function () {
            return this.normalMap;
        },
        set: function (t) {
            this.normalMap = t;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "emissionMap", {
        get: function () {
            return this.emissiveMap;
        },
        set: function (t) {
            this.emissiveMap = t;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "blendMode", {
        get: function () {
            return this._blendMode;
        },
        set: function (m) {
            this._blendMode = m;
            this.depthWrite = this._blendMode !== MToonMaterialRenderMode.Transparent;
            this.transparent =
                this._blendMode === MToonMaterialRenderMode.Transparent ||
                    this._blendMode === MToonMaterialRenderMode.TransparentWithZWrite;
            this._updateShaderCode();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "debugMode", {
        get: function () {
            return this._debugMode;
        },
        set: function (m) {
            this._debugMode = m;
            this._updateShaderCode();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "outlineWidthMode", {
        get: function () {
            return this._outlineWidthMode;
        },
        set: function (m) {
            this._outlineWidthMode = m;
            this._updateShaderCode();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "outlineColorMode", {
        get: function () {
            return this._outlineColorMode;
        },
        set: function (m) {
            this._outlineColorMode = m;
            this._updateShaderCode();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "cullMode", {
        get: function () {
            return this._cullMode;
        },
        set: function (m) {
            this._cullMode = m;
            this._updateCullFace();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "outlineCullMode", {
        get: function () {
            return this._outlineCullMode;
        },
        set: function (m) {
            this._outlineCullMode = m;
            this._updateCullFace();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "zWrite", {
        get: function () {
            return this.depthWrite ? 1 : 0;
        },
        set: function (i) {
            this.depthWrite = 0.5 <= i;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MToonMaterial.prototype, "isOutline", {
        get: function () {
            return this._isOutline;
        },
        set: function (b) {
            this._isOutline = b;
            this._updateShaderCode();
            this._updateCullFace();
        },
        enumerable: true,
        configurable: true
    });
    MToonMaterial.prototype.updateVRMMaterials = function (delta) {
        this._uvAnimOffsetX = this._uvAnimOffsetX + delta * this.uvAnimScrollX;
        this._uvAnimOffsetY = this._uvAnimOffsetY + delta * this.uvAnimScrollY;
        this._uvAnimPhase = this._uvAnimPhase + delta * this.uvAnimRotation;
        this._applyUniforms();
    };
    MToonMaterial.prototype.copy = function (source) {
        _super.prototype.copy.call(this, source);
        this.cutoff = source.cutoff;
        this.color.copy(source.color);
        this.shadeColor.copy(source.shadeColor);
        this.map = source.map;
        this.mainTex_ST.copy(source.mainTex_ST);
        this.shadeTexture = source.shadeTexture;
        this.bumpScale = source.bumpScale;
        this.normalMap = source.normalMap;
        this.receiveShadowRate = source.receiveShadowRate;
        this.receiveShadowTexture = source.receiveShadowTexture;
        this.shadingGradeRate = source.shadingGradeRate;
        this.shadingGradeTexture = source.shadingGradeTexture;
        this.shadeShift = source.shadeShift;
        this.shadeToony = source.shadeToony;
        this.lightColorAttenuation = source.lightColorAttenuation;
        this.indirectLightIntensity = source.indirectLightIntensity;
        this.rimTexture = source.rimTexture;
        this.rimColor.copy(source.rimColor);
        this.rimLightingMix = source.rimLightingMix;
        this.rimFresnelPower = source.rimFresnelPower;
        this.rimLift = source.rimLift;
        this.sphereAdd = source.sphereAdd;
        this.emissionColor.copy(source.emissionColor);
        this.emissiveMap = source.emissiveMap;
        this.outlineWidthTexture = source.outlineWidthTexture;
        this.outlineWidth = source.outlineWidth;
        this.outlineScaledMaxDistance = source.outlineScaledMaxDistance;
        this.outlineColor.copy(source.outlineColor);
        this.outlineLightingMix = source.outlineLightingMix;
        this.uvAnimMaskTexture = source.uvAnimMaskTexture;
        this.uvAnimScrollX = source.uvAnimScrollX;
        this.uvAnimScrollY = source.uvAnimScrollY;
        this.uvAnimRotation = source.uvAnimRotation;
        this.debugMode = source.debugMode;
        this.blendMode = source.blendMode;
        this.outlineWidthMode = source.outlineWidthMode;
        this.outlineColorMode = source.outlineColorMode;
        this.cullMode = source.cullMode;
        this.outlineCullMode = source.outlineCullMode;
        this.isOutline = source.isOutline;
        return this;
    };
    MToonMaterial.prototype._applyUniforms = function () {
        this.uniforms.uvAnimOffsetX.value = this._uvAnimOffsetX;
        this.uniforms.uvAnimOffsetY.value = this._uvAnimOffsetY;
        this.uniforms.uvAnimTheta.value = TAU * this._uvAnimPhase;
        if (!this.shouldApplyUniforms) {
            return;
        }
        this.shouldApplyUniforms = false;
        this.uniforms.cutoff.value = this.cutoff;
        this.uniforms.color.value.setRGB(this.color.x, this.color.y, this.color.z);
        if (!this._colorSpaceGamma) {
            this.uniforms.color.value.convertSRGBToLinear();
        }
        this.uniforms.colorAlpha.value = this.color.w;
        this.uniforms.shadeColor.value.setRGB(this.shadeColor.x, this.shadeColor.y, this.shadeColor.z);
        if (!this._colorSpaceGamma) {
            this.uniforms.shadeColor.value.convertSRGBToLinear();
        }
        this.uniforms.map.value = this.map;
        this.uniforms.mainTex_ST.value.copy(this.mainTex_ST);
        this.uniforms.shadeTexture.value = this.shadeTexture;
        this.uniforms.bumpScale.value = this.bumpScale;
        this.uniforms.normalMap.value = this.normalMap;
        this.uniforms.receiveShadowRate.value = this.receiveShadowRate;
        this.uniforms.receiveShadowTexture.value = this.receiveShadowTexture;
        this.uniforms.shadingGradeRate.value = this.shadingGradeRate;
        this.uniforms.shadingGradeTexture.value = this.shadingGradeTexture;
        this.uniforms.shadeShift.value = this.shadeShift;
        this.uniforms.shadeToony.value = this.shadeToony;
        this.uniforms.lightColorAttenuation.value = this.lightColorAttenuation;
        this.uniforms.indirectLightIntensity.value = this.indirectLightIntensity;
        this.uniforms.rimTexture.value = this.rimTexture;
        this.uniforms.rimColor.value.setRGB(this.rimColor.x, this.rimColor.y, this.rimColor.z);
        if (!this._colorSpaceGamma) {
            this.uniforms.rimColor.value.convertSRGBToLinear();
        }
        this.uniforms.rimLightingMix.value = this.rimLightingMix;
        this.uniforms.rimFresnelPower.value = this.rimFresnelPower;
        this.uniforms.rimLift.value = this.rimLift;
        this.uniforms.sphereAdd.value = this.sphereAdd;
        this.uniforms.emissionColor.value.setRGB(this.emissionColor.x, this.emissionColor.y, this.emissionColor.z);
        if (!this._colorSpaceGamma) {
            this.uniforms.emissionColor.value.convertSRGBToLinear();
        }
        this.uniforms.emissiveMap.value = this.emissiveMap;
        this.uniforms.outlineWidthTexture.value = this.outlineWidthTexture;
        this.uniforms.outlineWidth.value = this.outlineWidth;
        this.uniforms.outlineScaledMaxDistance.value = this.outlineScaledMaxDistance;
        this.uniforms.outlineColor.value.setRGB(this.outlineColor.x, this.outlineColor.y, this.outlineColor.z);
        if (!this._colorSpaceGamma) {
            this.uniforms.outlineColor.value.convertSRGBToLinear();
        }
        this.uniforms.outlineLightingMix.value = this.outlineLightingMix;
        this.uniforms.uvAnimMaskTexture.value = this.uvAnimMaskTexture;
        this._updateCullFace();
    };
    MToonMaterial.prototype._updateShaderCode = function () {
        this.defines = {
            OUTLINE: this._isOutline,
            BLENDMODE_OPAQUE: this._blendMode === MToonMaterialRenderMode.Opaque,
            BLENDMODE_CUTOUT: this._blendMode === MToonMaterialRenderMode.Cutout,
            BLENDMODE_TRANSPARENT: this._blendMode === MToonMaterialRenderMode.Transparent ||
                this._blendMode === MToonMaterialRenderMode.TransparentWithZWrite,
            USE_SHADETEXTURE: this.shadeTexture !== null,
            USE_RECEIVESHADOWTEXTURE: this.receiveShadowTexture !== null,
            USE_SHADINGGRADETEXTURE: this.shadingGradeTexture !== null,
            USE_RIMTEXTURE: this.rimTexture !== null,
            USE_SPHEREADD: this.sphereAdd !== null,
            USE_OUTLINEWIDTHTEXTURE: this.outlineWidthTexture !== null,
            USE_UVANIMMASKTEXTURE: this.uvAnimMaskTexture !== null,
            DEBUG_NORMAL: this._debugMode === MToonMaterialDebugMode.Normal,
            DEBUG_LITSHADERATE: this._debugMode === MToonMaterialDebugMode.LitShadeRate,
            DEBUG_UV: this._debugMode === MToonMaterialDebugMode.UV,
            OUTLINE_WIDTH_WORLD: this._outlineWidthMode === MToonMaterialOutlineWidthMode.WorldCoordinates,
            OUTLINE_WIDTH_SCREEN: this._outlineWidthMode === MToonMaterialOutlineWidthMode.ScreenCoordinates,
            OUTLINE_COLOR_FIXED: this._outlineColorMode === MToonMaterialOutlineColorMode.FixedColor,
            OUTLINE_COLOR_MIXED: this._outlineColorMode === MToonMaterialOutlineColorMode.MixedLighting,
        };
        var encodings = (this.shadeTexture !== null
            ? getTexelDecodingFunction_1.getTexelDecodingFunction('shadeTextureTexelToLinear', this.shadeTexture.encoding) + '\n'
            : '') +
            (this.sphereAdd !== null
                ? getTexelDecodingFunction_1.getTexelDecodingFunction('sphereAddTexelToLinear', this.sphereAdd.encoding) + '\n'
                : '');
        this.vertexShader = mtoon_vert_1.default;
        this.fragmentShader = encodings + mtoon_frag_1.default;
        this.needsUpdate = true;
    };
    MToonMaterial.prototype._updateCullFace = function () {
        if (!this.isOutline) {
            if (this.cullMode === MToonMaterialCullMode.Off) {
                this.side = THREE.DoubleSide;
            }
            else if (this.cullMode === MToonMaterialCullMode.Front) {
                this.side = THREE.BackSide;
            }
            else if (this.cullMode === MToonMaterialCullMode.Back) {
                this.side = THREE.FrontSide;
            }
        }
        else {
            if (this.outlineCullMode === MToonMaterialCullMode.Off) {
                this.side = THREE.DoubleSide;
            }
            else if (this.outlineCullMode === MToonMaterialCullMode.Front) {
                this.side = THREE.BackSide;
            }
            else if (this.outlineCullMode === MToonMaterialCullMode.Back) {
                this.side = THREE.FrontSide;
            }
        }
    };
    return MToonMaterial;
}(THREE.ShaderMaterial));
exports.MToonMaterial = MToonMaterial;


/***/ }),

/***/ "./src/vrm/material/VRMMaterialImporter.ts":
/*!*************************************************!*\
  !*** ./src/vrm/material/VRMMaterialImporter.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var MToonMaterial_1 = __webpack_require__(/*! ./MToonMaterial */ "./src/vrm/material/MToonMaterial.ts");
var VRMUnlitMaterial_1 = __webpack_require__(/*! ./VRMUnlitMaterial */ "./src/vrm/material/VRMUnlitMaterial.ts");
var VRMMaterialImporter = (function () {
    function VRMMaterialImporter(options) {
        if (options === void 0) { options = {}; }
        this._colorSpaceGamma = options.colorSpaceGamma || true;
        this._requestEnvMap = options.requestEnvMap;
    }
    VRMMaterialImporter.prototype.convertGLTFMaterials = function (gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, materialProperties, meshesMap, materialList, materials;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
                        if (!vrmExt) {
                            return [2, null];
                        }
                        materialProperties = vrmExt.materialProperties;
                        if (!materialProperties) {
                            return [2, null];
                        }
                        return [4, gltf.parser.getDependencies('mesh')];
                    case 1:
                        meshesMap = _a.sent();
                        materialList = {};
                        materials = [];
                        return [4, Promise.all(meshesMap.map(function (mesh, meshIndex) { return __awaiter(_this, void 0, void 0, function () {
                                var primitives;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            primitives = mesh.type === 'Group' ? mesh.children : [mesh];
                                            return [4, Promise.all(primitives.map(function (primitive, primitiveIndex) { return __awaiter(_this, void 0, void 0, function () {
                                                    var vrmMaterialIndex, props, vrmMaterials;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                if (!Array.isArray(primitive.material)) {
                                                                    primitive.material = [primitive.material];
                                                                    primitive.geometry.addGroup(0, primitive.geometry.index.count, 0);
                                                                }
                                                                vrmMaterialIndex = gltf.parser.json.meshes[meshIndex].primitives[primitiveIndex].material;
                                                                props = materialProperties[vrmMaterialIndex];
                                                                if (!props) {
                                                                    console.warn("VRMMaterialImporter: There are no material definition for material #" + vrmMaterialIndex + " on VRM extension.");
                                                                    props = { shader: 'VRM_USE_GLTFSHADER' };
                                                                }
                                                                if (!materialList[vrmMaterialIndex]) return [3, 1];
                                                                vrmMaterials = materialList[vrmMaterialIndex];
                                                                return [3, 3];
                                                            case 1: return [4, this.createVRMMaterials(primitive.material[0], props, gltf)];
                                                            case 2:
                                                                vrmMaterials = _a.sent();
                                                                materialList[vrmMaterialIndex] = vrmMaterials;
                                                                materials.push(vrmMaterials.surface);
                                                                if (vrmMaterials.outline) {
                                                                    materials.push(vrmMaterials.outline);
                                                                }
                                                                _a.label = 3;
                                                            case 3:
                                                                primitive.material[0] = vrmMaterials.surface;
                                                                if (this._requestEnvMap) {
                                                                    this._requestEnvMap().then(function (envMap) {
                                                                        vrmMaterials.surface.envMap = envMap;
                                                                        vrmMaterials.surface.needsUpdate = true;
                                                                    });
                                                                }
                                                                primitive.renderOrder = props.renderQueue || 2000;
                                                                if (vrmMaterials.outline) {
                                                                    primitive.material[1] = vrmMaterials.outline;
                                                                    primitive.geometry.addGroup(0, primitive.geometry.index.count, 1);
                                                                }
                                                                return [2];
                                                        }
                                                    });
                                                }); }))];
                                        case 1:
                                            _a.sent();
                                            return [2];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.sent();
                        return [2, materials];
                }
            });
        });
    };
    VRMMaterialImporter.prototype.createVRMMaterials = function (originalMaterial, vrmProps, gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var newSurface, newOutline, params_1, params, params, params, params;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(vrmProps.shader === 'VRM/MToon')) return [3, 2];
                        return [4, this._extractMaterialProperties(originalMaterial, vrmProps, gltf)];
                    case 1:
                        params_1 = _a.sent();
                        ['srcBlend', 'dstBlend', 'isFirstSetup'].forEach(function (name) {
                            if (params_1[name] !== undefined) {
                                delete params_1[name];
                            }
                        });
                        ['mainTex', 'shadeTexture', 'emission', 'sphereAdd'].forEach(function (name) {
                            if (params_1[name] !== undefined) {
                                params_1[name].encoding = _this._colorSpaceGamma ? THREE.LinearEncoding : THREE.sRGBEncoding;
                            }
                        });
                        newSurface = new MToonMaterial_1.MToonMaterial(this._colorSpaceGamma, params_1);
                        if (params_1.outlineWidthMode !== MToonMaterial_1.MToonMaterialOutlineWidthMode.None) {
                            params_1.isOutline = true;
                            newOutline = new MToonMaterial_1.MToonMaterial(this._colorSpaceGamma, params_1);
                        }
                        return [3, 11];
                    case 2:
                        if (!(vrmProps.shader === 'VRM/UnlitTexture')) return [3, 4];
                        return [4, this._extractMaterialProperties(originalMaterial, vrmProps, gltf)];
                    case 3:
                        params = _a.sent();
                        params.renderType = VRMUnlitMaterial_1.VRMUnlitMaterialRenderType.Opaque;
                        newSurface = new VRMUnlitMaterial_1.VRMUnlitMaterial(params);
                        return [3, 11];
                    case 4:
                        if (!(vrmProps.shader === 'VRM/UnlitCutout')) return [3, 6];
                        return [4, this._extractMaterialProperties(originalMaterial, vrmProps, gltf)];
                    case 5:
                        params = _a.sent();
                        params.renderType = VRMUnlitMaterial_1.VRMUnlitMaterialRenderType.Cutout;
                        newSurface = new VRMUnlitMaterial_1.VRMUnlitMaterial(params);
                        return [3, 11];
                    case 6:
                        if (!(vrmProps.shader === 'VRM/UnlitTransparent')) return [3, 8];
                        return [4, this._extractMaterialProperties(originalMaterial, vrmProps, gltf)];
                    case 7:
                        params = _a.sent();
                        params.renderType = VRMUnlitMaterial_1.VRMUnlitMaterialRenderType.Transparent;
                        newSurface = new VRMUnlitMaterial_1.VRMUnlitMaterial(params);
                        return [3, 11];
                    case 8:
                        if (!(vrmProps.shader === 'VRM/UnlitTransparentZWrite')) return [3, 10];
                        return [4, this._extractMaterialProperties(originalMaterial, vrmProps, gltf)];
                    case 9:
                        params = _a.sent();
                        params.renderType = VRMUnlitMaterial_1.VRMUnlitMaterialRenderType.TransparentWithZWrite;
                        newSurface = new VRMUnlitMaterial_1.VRMUnlitMaterial(params);
                        return [3, 11];
                    case 10:
                        if (vrmProps.shader !== 'VRM_USE_GLTFSHADER') {
                            console.warn("Unknown shader detected: \"" + vrmProps.shader + "\"");
                        }
                        newSurface = this._convertGLTFMaterial(originalMaterial.clone());
                        _a.label = 11;
                    case 11:
                        newSurface.name = originalMaterial.name;
                        newSurface.userData = JSON.parse(JSON.stringify(originalMaterial.userData));
                        newSurface.userData.vrmMaterialProperties = vrmProps;
                        if (newOutline) {
                            newOutline.name = originalMaterial.name + ' (Outline)';
                            newOutline.userData = JSON.parse(JSON.stringify(originalMaterial.userData));
                            newOutline.userData.vrmMaterialProperties = vrmProps;
                        }
                        return [2, {
                                surface: newSurface,
                                outline: newOutline,
                            }];
                }
            });
        });
    };
    VRMMaterialImporter.prototype._renameMaterialProperty = function (name) {
        if (name[0] !== '_') {
            console.warn("VRMMaterials: Given property name \"" + name + "\" might be invalid");
            return name;
        }
        name = name.substring(1);
        if (!/[A-Z]/.test(name[0])) {
            console.warn("VRMMaterials: Given property name \"" + name + "\" might be invalid");
            return name;
        }
        return name[0].toLowerCase() + name.substring(1);
    };
    VRMMaterialImporter.prototype._convertGLTFMaterial = function (material) {
        if (material.isMeshStandardMaterial) {
            var mtl = material;
            if (this._colorSpaceGamma) {
                if (mtl.map) {
                    mtl.map.encoding = THREE.LinearEncoding;
                }
                if (mtl.emissiveMap) {
                    mtl.emissiveMap.encoding = THREE.LinearEncoding;
                }
            }
            else {
                mtl.color.convertSRGBToLinear();
                mtl.emissive.convertSRGBToLinear();
            }
        }
        if (material.isMeshBasicMaterial) {
            var mtl = material;
            if (this._colorSpaceGamma) {
                if (mtl.map) {
                    mtl.map.encoding = THREE.LinearEncoding;
                }
            }
            else {
                mtl.color.convertSRGBToLinear();
            }
        }
        return material;
    };
    VRMMaterialImporter.prototype._extractMaterialProperties = function (originalMaterial, vrmProps, gltf) {
        var taskList = [];
        var params = {};
        if (vrmProps.textureProperties) {
            var _loop_1 = function (name) {
                var newName = this_1._renameMaterialProperty(name);
                var textureIndex = vrmProps.textureProperties[name];
                taskList.push(gltf.parser.getDependency('texture', textureIndex).then(function (texture) {
                    params[newName] = texture;
                }));
            };
            var this_1 = this;
            for (var _i = 0, _a = Object.keys(vrmProps.textureProperties); _i < _a.length; _i++) {
                var name = _a[_i];
                _loop_1(name);
            }
        }
        if (vrmProps.floatProperties) {
            for (var _b = 0, _c = Object.keys(vrmProps.floatProperties); _b < _c.length; _b++) {
                var name = _c[_b];
                var newName = this._renameMaterialProperty(name);
                params[newName] = vrmProps.floatProperties[name];
            }
        }
        if (vrmProps.vectorProperties) {
            var _loop_2 = function (name) {
                var _a;
                var newName = this_2._renameMaterialProperty(name);
                var isTextureST = [
                    '_MainTex',
                    '_ShadeTexture',
                    '_BumpMap',
                    '_ReceiveShadowTexture',
                    '_ShadingGradeTexture',
                    '_SphereAdd',
                    '_EmissionMap',
                    '_OutlineWidthTexture',
                ].some(function (textureName) { return name === textureName; });
                if (isTextureST) {
                    newName += '_ST';
                }
                params[newName] = new ((_a = THREE.Vector4).bind.apply(_a, [void 0].concat(vrmProps.vectorProperties[name])))();
            };
            var this_2 = this;
            for (var _d = 0, _e = Object.keys(vrmProps.vectorProperties); _d < _e.length; _d++) {
                var name = _e[_d];
                _loop_2(name);
            }
        }
        if (vrmProps.keywordMap._ALPHATEST_ON && params.blendMode === MToonMaterial_1.MToonMaterialRenderMode.Opaque) {
            params.blendMode = MToonMaterial_1.MToonMaterialRenderMode.Cutout;
        }
        params.skinning = originalMaterial.skinning || false;
        params.morphTargets = originalMaterial.morphTargets || false;
        params.morphNormals = originalMaterial.morphNormals || false;
        return Promise.all(taskList).then(function () { return params; });
    };
    return VRMMaterialImporter;
}());
exports.VRMMaterialImporter = VRMMaterialImporter;


/***/ }),

/***/ "./src/vrm/material/VRMUnlitMaterial.ts":
/*!**********************************************!*\
  !*** ./src/vrm/material/VRMUnlitMaterial.ts ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var unlit_vert_1 = __webpack_require__(/*! ./shaders/unlit.vert */ "./src/vrm/material/shaders/unlit.vert");
var unlit_frag_1 = __webpack_require__(/*! ./shaders/unlit.frag */ "./src/vrm/material/shaders/unlit.frag");
var VRMUnlitMaterialRenderType;
(function (VRMUnlitMaterialRenderType) {
    VRMUnlitMaterialRenderType[VRMUnlitMaterialRenderType["Opaque"] = 0] = "Opaque";
    VRMUnlitMaterialRenderType[VRMUnlitMaterialRenderType["Cutout"] = 1] = "Cutout";
    VRMUnlitMaterialRenderType[VRMUnlitMaterialRenderType["Transparent"] = 2] = "Transparent";
    VRMUnlitMaterialRenderType[VRMUnlitMaterialRenderType["TransparentWithZWrite"] = 3] = "TransparentWithZWrite";
})(VRMUnlitMaterialRenderType = exports.VRMUnlitMaterialRenderType || (exports.VRMUnlitMaterialRenderType = {}));
var VRMUnlitMaterial = (function (_super) {
    __extends(VRMUnlitMaterial, _super);
    function VRMUnlitMaterial(parameters) {
        var _this = _super.call(this) || this;
        _this.isVRMUnlitMaterial = true;
        _this.cutoff = 0.5;
        _this.map = null;
        _this.mainTex_ST = new THREE.Vector4(0.0, 0.0, 1.0, 1.0);
        _this._renderType = VRMUnlitMaterialRenderType.Opaque;
        _this.shouldApplyUniforms = true;
        if (parameters === undefined) {
            parameters = {};
        }
        parameters.fog = true;
        parameters.clipping = true;
        parameters.skinning = parameters.skinning || false;
        parameters.morphTargets = parameters.morphTargets || false;
        parameters.morphNormals = parameters.morphNormals || false;
        parameters.uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.fog,
            {
                cutoff: { value: 0.5 },
                mainTex_ST: { value: new THREE.Vector4(0.0, 0.0, 1.0, 1.0) },
            },
        ]);
        _this.setValues(parameters);
        _this._updateShaderCode();
        _this._applyUniforms();
        return _this;
    }
    Object.defineProperty(VRMUnlitMaterial.prototype, "mainTex", {
        get: function () {
            return this.map;
        },
        set: function (t) {
            this.map = t;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VRMUnlitMaterial.prototype, "renderType", {
        get: function () {
            return this._renderType;
        },
        set: function (t) {
            this._renderType = t;
            this.depthWrite = this._renderType !== VRMUnlitMaterialRenderType.Transparent;
            this.transparent =
                this._renderType === VRMUnlitMaterialRenderType.Transparent ||
                    this._renderType === VRMUnlitMaterialRenderType.TransparentWithZWrite;
            this._updateShaderCode();
        },
        enumerable: true,
        configurable: true
    });
    VRMUnlitMaterial.prototype.updateVRMMaterials = function (delta) {
        this._applyUniforms();
    };
    VRMUnlitMaterial.prototype.copy = function (source) {
        _super.prototype.copy.call(this, source);
        this.cutoff = source.cutoff;
        this.map = source.map;
        this.mainTex_ST.copy(source.mainTex_ST);
        this.renderType = source.renderType;
        return this;
    };
    VRMUnlitMaterial.prototype._applyUniforms = function () {
        if (!this.shouldApplyUniforms) {
            return;
        }
        this.shouldApplyUniforms = false;
        this.uniforms.cutoff.value = this.cutoff;
        this.uniforms.map.value = this.map;
        this.uniforms.mainTex_ST.value.copy(this.mainTex_ST);
    };
    VRMUnlitMaterial.prototype._updateShaderCode = function () {
        this.defines = {
            RENDERTYPE_OPAQUE: this._renderType === VRMUnlitMaterialRenderType.Opaque,
            RENDERTYPE_CUTOUT: this._renderType === VRMUnlitMaterialRenderType.Cutout,
            RENDERTYPE_TRANSPARENT: this._renderType === VRMUnlitMaterialRenderType.Transparent ||
                this._renderType === VRMUnlitMaterialRenderType.TransparentWithZWrite,
        };
        this.vertexShader = unlit_vert_1.default;
        this.fragmentShader = unlit_frag_1.default;
        this.needsUpdate = true;
    };
    return VRMUnlitMaterial;
}(THREE.ShaderMaterial));
exports.VRMUnlitMaterial = VRMUnlitMaterial;


/***/ }),

/***/ "./src/vrm/material/getTexelDecodingFunction.ts":
/*!******************************************************!*\
  !*** ./src/vrm/material/getTexelDecodingFunction.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
exports.getEncodingComponents = function (encoding) {
    switch (encoding) {
        case THREE.LinearEncoding:
            return ['Linear', '( value )'];
        case THREE.sRGBEncoding:
            return ['sRGB', '( value )'];
        case THREE.RGBEEncoding:
            return ['RGBE', '( value )'];
        case THREE.RGBM7Encoding:
            return ['RGBM', '( value, 7.0 )'];
        case THREE.RGBM16Encoding:
            return ['RGBM', '( value, 16.0 )'];
        case THREE.RGBDEncoding:
            return ['RGBD', '( value, 256.0 )'];
        case THREE.GammaEncoding:
            return ['Gamma', '( value, float( GAMMA_FACTOR ) )'];
        default:
            throw new Error('unsupported encoding: ' + encoding);
    }
};
exports.getTexelDecodingFunction = function (functionName, encoding) {
    var components = exports.getEncodingComponents(encoding);
    return 'vec4 ' + functionName + '( vec4 value ) { return ' + components[0] + 'ToLinear' + components[1] + '; }';
};


/***/ }),

/***/ "./src/vrm/material/index.ts":
/*!***********************************!*\
  !*** ./src/vrm/material/index.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./MToonMaterial */ "./src/vrm/material/MToonMaterial.ts"));
__export(__webpack_require__(/*! ./VRMMaterialImporter */ "./src/vrm/material/VRMMaterialImporter.ts"));
__export(__webpack_require__(/*! ./VRMUnlitMaterial */ "./src/vrm/material/VRMUnlitMaterial.ts"));


/***/ }),

/***/ "./src/vrm/material/shaders/mtoon.frag":
/*!*********************************************!*\
  !*** ./src/vrm/material/shaders/mtoon.frag ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("// #define PHONG\n\n#ifdef BLENDMODE_CUTOUT\n  uniform float cutoff;\n#endif\n\nuniform vec3 color;\nuniform float colorAlpha;\nuniform vec3 shadeColor;\n#ifdef USE_SHADETEXTURE\n  uniform sampler2D shadeTexture;\n#endif\n\nuniform float receiveShadowRate;\n#ifdef USE_RECEIVESHADOWTEXTURE\n  uniform sampler2D receiveShadowTexture;\n#endif\n\nuniform float shadingGradeRate;\n#ifdef USE_SHADINGGRADETEXTURE\n  uniform sampler2D shadingGradeTexture;\n#endif\n\nuniform float shadeShift;\nuniform float shadeToony;\nuniform float lightColorAttenuation;\nuniform float indirectLightIntensity;\n\n#ifdef USE_RIMTEXTURE\n  uniform sampler2D rimTexture;\n#endif\nuniform vec3 rimColor;\nuniform float rimLightingMix;\nuniform float rimFresnelPower;\nuniform float rimLift;\n\n#ifdef USE_SPHEREADD\n  uniform sampler2D sphereAdd;\n#endif\n\nuniform vec3 emissionColor;\n\nuniform vec3 outlineColor;\nuniform float outlineLightingMix;\n\n#ifdef USE_UVANIMMASKTEXTURE\n  uniform sampler2D uvAnimMaskTexture;\n#endif\n\nuniform float uvAnimOffsetX;\nuniform float uvAnimOffsetY;\nuniform float uvAnimTheta;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n\n// #include <uv_pars_fragment>\n#if defined( USE_MAP ) || defined( USE_SHADETEXTURE ) || defined( USE_NORMALMAP ) || defined( USE_RECEIVESHADOWTEXTURE ) || defined( USE_SHADINGGRADETEXTURE ) || defined( USE_RIMTEXTURE ) || defined( USE_EMISSIVEMAP ) || defined( USE_OUTLINEWIDTHTEXTURE ) || defined( USE_UVANIMMASKTEXTURE )\n  varying vec2 vUv;\n#endif\n\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n// #include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n// #include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n// #include <envmap_pars_fragment>\n// #include <gradientmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n\n// #include <lights_phong_pars_fragment>\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n  varying vec3 vNormal;\n#endif\n\n#define Material_LightProbeLOD( material ) (0)\n\n#include <shadowmap_pars_fragment>\n// #include <bumpmap_pars_fragment>\n\n// #include <normalmap_pars_fragment>\n#ifdef USE_NORMALMAP\n  uniform sampler2D normalMap;\n  uniform float bumpScale;\n\n  // this number is very random, this is still a 対処療法\n  #define UV_DERIVATIVE_EPSILON 1E-6\n\n  // Per-Pixel Tangent Space Normal Mapping\n  // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html\n  vec3 perturbNormal2Arb( vec2 uv, vec3 eye_pos, vec3 surf_norm ) {\n    // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988\n    vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\n    vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\n    vec2 st0 = dFdx( uv.st );\n    vec2 st1 = dFdy( uv.st );\n\n    float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude\n    vec3 S = ( q0 * st1.t - q1 * st0.t ) * scale;\n    vec3 T = ( - q0 * st1.s + q1 * st0.s ) * scale;\n\n    // Workaround for the issue that happens when delta of uv = 0.0\n    if ( length( S ) == 0.0 || length( T ) == 0.0 ) {\n      return surf_norm;\n    }\n\n    S = normalize( S );\n    T = normalize( T );\n    vec3 N = normalize( surf_norm );\n\n    vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;\n\n    mapN.xy *= bumpScale;\n\n    #ifdef DOUBLE_SIDED\n      // Workaround for Adreno GPUs gl_FrontFacing bug. See #15850 and #10331\n      // http://hacksoflife.blogspot.com/2009/11/per-pixel-tangent-space-normal-mapping.html?showComment=1522254677437#c5087545147696715943\n      vec3 NfromST = cross( S, T );\n      if( dot( NfromST, N ) > 0.0 ) {\n        S *= -1.0;\n        T *= -1.0;\n      }\n    #else\n      mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n    #endif\n\n    mat3 tsn = mat3( S, T, N );\n\n    return normalize( tsn * mapN );\n  }\n#endif\n\n// #include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\n// == lighting stuff ===========================================================\nfloat getLightIntensity(\n  const in IncidentLight directLight,\n  const in GeometricContext geometry,\n  const in float shadow,\n  const in float shadingGrade\n) {\n  float lightIntensity = dot( geometry.normal, directLight.direction );\n  lightIntensity = 0.5 + 0.5 * lightIntensity;\n  lightIntensity = lightIntensity * shadow;\n  lightIntensity = lightIntensity * shadingGrade;\n  lightIntensity = lightIntensity * 2.0 - 1.0;\n  return smoothstep( shadeShift, shadeShift + ( 1.0 - shadeToony ), lightIntensity );\n}\n\nvec3 getLighting( const in vec3 lightColor ) {\n  vec3 lighting = lightColor;\n  lighting = mix(\n    lighting,\n    vec3( max( 0.001, max( lighting.x, max( lighting.y, lighting.z ) ) ) ),\n    lightColorAttenuation\n  );\n\n  #ifndef PHYSICALLY_CORRECT_LIGHTS\n    lighting *= PI;\n  #endif\n\n  return lighting;\n}\n\nvec3 getDiffuse(\n  const in vec3 lit,\n  const in vec3 shade,\n  const in float lightIntensity,\n  const in vec3 lighting\n) {\n  #ifdef DEBUG_LITSHADERATE\n    return vec3( BRDF_Diffuse_Lambert( lightIntensity * lighting ) );\n  #endif\n\n  return lighting * BRDF_Diffuse_Lambert( mix( shade, lit, lightIntensity ) );\n}\n\nvec3 calcDirectDiffuse(\n  const in vec2 uv,\n  const in vec3 lit,\n  const in vec3 shade,\n  in GeometricContext geometry,\n  inout ReflectedLight reflectedLight\n) {\n  IncidentLight directLight;\n  vec3 lightingSum = vec3( 0.0 );\n\n  float shadingGrade = 1.0;\n  #ifdef USE_SHADINGGRADETEXTURE\n    shadingGrade = 1.0 - shadingGradeRate * ( 1.0 - texture2D( shadingGradeTexture, uv ).r );\n  #endif\n\n  float receiveShadow = receiveShadowRate;\n  #ifdef USE_RECEIVESHADOWTEXTURE\n    receiveShadow *= texture2D( receiveShadowTexture, uv ).a;\n  #endif\n\n  #if ( NUM_POINT_LIGHTS > 0 )\n    PointLight pointLight;\n\n    #pragma unroll_loop\n    for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n      pointLight = pointLights[ i ];\n      getPointDirectLightIrradiance( pointLight, geometry, directLight );\n\n      float atten = 1.0;\n      #ifdef USE_SHADOWMAP\n        atten = all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n      #endif\n\n      float shadow = 1.0 - receiveShadow * ( 1.0 - ( 0.5 + 0.5 * atten ) );\n      float lightIntensity = getLightIntensity( directLight, geometry, shadow, shadingGrade );\n      vec3 lighting = getLighting( directLight.color );\n      reflectedLight.directDiffuse += getDiffuse( lit, shade, lightIntensity, lighting );\n      lightingSum += lighting;\n    }\n  #endif\n\n  #if ( NUM_SPOT_LIGHTS > 0 )\n    SpotLight spotLight;\n\n    #pragma unroll_loop\n    for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n      spotLight = spotLights[ i ];\n      getSpotDirectLightIrradiance( spotLight, geometry, directLight );\n\n      float atten = 1.0;\n      #ifdef USE_SHADOWMAP\n        atten = all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n      #endif\n\n      float shadow = 1.0 - receiveShadow * ( 1.0 - ( 0.5 + 0.5 * atten ) );\n      float lightIntensity = getLightIntensity( directLight, geometry, shadow, shadingGrade );\n      vec3 lighting = getLighting( directLight.color );\n      reflectedLight.directDiffuse += getDiffuse( lit, shade, lightIntensity, lighting );\n      lightingSum += lighting;\n    }\n  #endif\n\n  #if ( NUM_DIR_LIGHTS > 0 )\n    DirectionalLight directionalLight;\n\n    #pragma unroll_loop\n    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n      directionalLight = directionalLights[ i ];\n      getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );\n\n      float atten = 1.0;\n      #ifdef USE_SHADOWMAP\n        atten = all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n      #endif\n\n      float shadow = 1.0 - receiveShadow * ( 1.0 - ( 0.5 + 0.5 * atten ) );\n      float lightIntensity = getLightIntensity( directLight, geometry, shadow, shadingGrade );\n      vec3 lighting = getLighting( directLight.color );\n      reflectedLight.directDiffuse += getDiffuse( lit, shade, lightIntensity, lighting );\n      lightingSum += lighting;\n    }\n  #endif\n\n  return lightingSum;\n}\n\n// == post correction ==========================================================\nvoid postCorrection() {\n  #include <tonemapping_fragment>\n  #include <encodings_fragment>\n  #include <fog_fragment>\n  #include <premultiplied_alpha_fragment>\n  #include <dithering_fragment>\n}\n\n// == main procedure ===========================================================\nvoid main() {\n  #include <clipping_planes_fragment>\n\n  vec2 uv = vec2(0.5, 0.5);\n\n  #if defined( USE_MAP ) || defined( USE_SHADETEXTURE ) || defined( USE_NORMALMAP ) || defined( USE_RECEIVESHADOWTEXTURE ) || defined( USE_SHADINGGRADETEXTURE ) || defined( USE_RIMTEXTURE ) || defined( USE_EMISSIVEMAP ) || defined( USE_OUTLINEWIDTHTEXTURE ) || defined( USE_UVANIMMASKTEXTURE )\n    uv = vUv;\n\n    float uvAnimMask = 1.0;\n    #ifdef USE_UVANIMMASKTEXTURE\n      uvAnimMask = texture2D( uvAnimMaskTexture, uv ).x;\n    #endif\n\n    uv = uv + vec2( uvAnimOffsetX, uvAnimOffsetY ) * uvAnimMask;\n    float uvRotCos = cos( uvAnimTheta * uvAnimMask );\n    float uvRotSin = sin( uvAnimTheta * uvAnimMask );\n    uv = mat2( uvRotCos, uvRotSin, -uvRotSin, uvRotCos ) * ( uv - 0.5 ) + 0.5;\n  #endif\n\n  #ifdef DEBUG_UV\n    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n    #if defined( USE_MAP ) || defined( USE_SHADETEXTURE ) || defined( USE_NORMALMAP ) || defined( USE_RECEIVESHADOWTEXTURE ) || defined( USE_SHADINGGRADETEXTURE ) || defined( USE_RIMTEXTURE ) || defined( USE_EMISSIVEMAP ) || defined( USE_OUTLINEWIDTHTEXTURE ) || defined( USE_UVANIMMASKTEXTURE )\n      gl_FragColor = vec4( uv, 0.0, 1.0 );\n    #endif\n    return;\n  #endif\n\n  vec4 diffuseColor = vec4( color, colorAlpha );\n  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n  vec3 totalEmissiveRadiance = emissionColor;\n\n  #include <logdepthbuf_fragment>\n\n  // #include <map_fragment>\n  #ifdef USE_MAP\n    diffuseColor *= mapTexelToLinear( texture2D( map, uv ) );\n  #endif\n\n  #include <color_fragment>\n  // #include <alphamap_fragment>\n\n  // -- MToon: alpha -----------------------------------------------------------\n  // #include <alphatest_fragment>\n  #ifdef BLENDMODE_CUTOUT\n    if ( diffuseColor.a <= cutoff ) { discard; }\n    diffuseColor.a = 1.0;\n  #endif\n\n  #ifdef BLENDMODE_OPAQUE\n    diffuseColor.a = 1.0;\n  #endif\n\n  #if defined( OUTLINE ) && defined( OUTLINE_COLOR_FIXED ) // omitting DebugMode\n    gl_FragColor = vec4( outlineColor, diffuseColor.a );\n    postCorrection();\n    return;\n  #endif\n\n  // #include <specularmap_fragment>\n  #include <normal_fragment_begin>\n\n  #ifdef OUTLINE\n    normal *= -1.0;\n  #endif\n\n  // #include <normal_fragment_maps>\n  #ifdef USE_NORMALMAP\n    normal = perturbNormal2Arb( uv, -vViewPosition, normal );\n  #endif\n\n  // #include <emissivemap_fragment>\n  #ifdef USE_EMISSIVEMAP\n    totalEmissiveRadiance *= emissiveMapTexelToLinear( texture2D( emissiveMap, uv ) ).rgb;\n  #endif\n\n  #ifdef DEBUG_NORMAL\n    gl_FragColor = vec4( 0.5 + 0.5 * normal, 1.0 );\n    return;\n  #endif\n\n  // -- MToon: lighting --------------------------------------------------------\n  // accumulation\n  // #include <lights_phong_fragment>\n  // #include <lights_fragment_begin>\n  vec3 lit = diffuseColor.rgb;\n  vec3 shade = shadeColor;\n  #ifdef USE_SHADETEXTURE\n    shade *= shadeTextureTexelToLinear( texture2D( shadeTexture, uv ) ).rgb;\n  #endif\n\n  GeometricContext geometry;\n\n  geometry.position = - vViewPosition;\n  geometry.normal = normal;\n  geometry.viewDir = normalize( vViewPosition );\n\n  vec3 lighting = calcDirectDiffuse( uv, diffuseColor.rgb, shade, geometry, reflectedLight );\n\n  vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n  #if ( NUM_HEMI_LIGHTS > 0 )\n    #pragma unroll_loop\n    for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n      irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\n    }\n  #endif\n\n  // #include <lights_fragment_maps>\n  #ifdef USE_LIGHTMAP\n    vec3 lightMapIrradiance = texture2D( lightMap, vUv2 ).rgb * lightMapIntensity;\n    #ifndef PHYSICALLY_CORRECT_LIGHTS\n      lightMapIrradiance *= PI; // factor of PI should not be present; included here to prevent breakage\n    #endif\n    irradiance += lightMapIrradiance;\n  #endif\n\n  // #include <lights_fragment_end>\n  reflectedLight.indirectDiffuse += indirectLightIntensity * irradiance * BRDF_Diffuse_Lambert( lit );\n\n  // modulation\n  #include <aomap_fragment>\n\n  vec3 col = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n\n  #if defined( OUTLINE ) && defined( OUTLINE_COLOR_MIXED ) // omitting DebugMode\n    gl_FragColor = vec4(\n      outlineColor.rgb * mix( vec3( 1.0 ), col, outlineLightingMix ),\n      diffuseColor.a\n    );\n    postCorrection();\n    return;\n  #endif\n\n  // -- MToon: parametric rim lighting -----------------------------------------\n  vec3 viewDir = normalize( vViewPosition );\n  vec3 rimMix = mix(vec3(1.0), lighting + indirectLightIntensity * irradiance, rimLightingMix);\n  vec3 rim = rimColor * pow( saturate( 1.0 - dot( viewDir, normal ) + rimLift ), rimFresnelPower );\n  #ifdef USE_RIMTEXTURE\n    rim *= texture2D( rimTexture, uv ).rgb;\n  #endif\n  col += rim;\n\n  // -- MToon: additive matcap -------------------------------------------------\n  #ifdef USE_SPHEREADD\n    {\n      vec3 x = normalize( vec3( viewDir.z, 0.0, -viewDir.x ) );\n      vec3 y = cross( viewDir, x ); // guaranteed to be normalized\n      vec2 sphereUv = 0.5 + 0.5 * vec2( dot( x, normal ), -dot( y, normal ) );\n      vec3 matcap = sphereAddTexelToLinear( texture2D( sphereAdd, sphereUv ) ).xyz;\n      col += matcap;\n    }\n  #endif\n\n  // -- MToon: Emission --------------------------------------------------------\n  col += totalEmissiveRadiance;\n\n  // #include <envmap_fragment>\n\n  // -- Almost done! -----------------------------------------------------------\n  gl_FragColor = vec4( col, diffuseColor.a );\n  postCorrection();\n}");

/***/ }),

/***/ "./src/vrm/material/shaders/mtoon.vert":
/*!*********************************************!*\
  !*** ./src/vrm/material/shaders/mtoon.vert ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("// #define PHONG\n\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n  varying vec3 vNormal;\n#endif\n\n#include <common>\n\n// #include <uv_pars_vertex>\n#if defined( USE_MAP ) || defined( USE_SHADETEXTURE ) || defined( USE_NORMALMAP ) || defined( USE_RECEIVESHADOWTEXTURE ) || defined( USE_SHADINGGRADETEXTURE ) || defined( USE_RIMTEXTURE ) || defined( USE_EMISSIVEMAP ) || defined( USE_OUTLINEWIDTHTEXTURE ) || defined( USE_UVANIMMASKTEXTURE )\n  varying vec2 vUv;\n  uniform vec4 mainTex_ST;\n#endif\n\n#include <uv2_pars_vertex>\n// #include <displacementmap_pars_vertex>\n// #include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\n#ifdef USE_OUTLINEWIDTHTEXTURE\n  uniform sampler2D outlineWidthTexture;\n#endif\n\nuniform float outlineWidth;\nuniform float outlineScaledMaxDistance;\n\nvoid main() {\n\n  // #include <uv_vertex>\n  #if defined( USE_MAP ) || defined( USE_SHADETEXTURE ) || defined( USE_NORMALMAP ) || defined( USE_RECEIVESHADOWTEXTURE ) || defined( USE_SHADINGGRADETEXTURE ) || defined( USE_RIMTEXTURE ) || defined( USE_EMISSIVEMAP ) || defined( USE_OUTLINEWIDTHTEXTURE ) || defined( USE_UVANIMMASKTEXTURE )\n    vUv = vec2( mainTex_ST.p * uv.x + mainTex_ST.s, mainTex_ST.q * uv.y + mainTex_ST.t );\n  #endif\n\n  #include <uv2_vertex>\n  #include <color_vertex>\n\n  #include <beginnormal_vertex>\n  #include <morphnormal_vertex>\n  #include <skinbase_vertex>\n  #include <skinnormal_vertex>\n  #include <defaultnormal_vertex>\n\n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n    vNormal = normalize( transformedNormal );\n  #endif\n\n  #include <begin_vertex>\n\n  #include <morphtarget_vertex>\n  #include <skinning_vertex>\n  // #include <displacementmap_vertex>\n  #include <project_vertex>\n  #include <logdepthbuf_vertex>\n  #include <clipping_planes_vertex>\n\n  vViewPosition = - mvPosition.xyz;\n\n  float outlineTex = 1.0;\n\n  #ifdef OUTLINE\n    #ifdef USE_OUTLINEWIDTHTEXTURE\n      outlineTex = texture2D( outlineWidthTexture, vUv ).r;\n    #endif\n\n    #ifdef OUTLINE_WIDTH_WORLD\n      vec3 outlineOffset = 0.01 * outlineWidth * outlineTex * normalize( objectNormal );\n      gl_Position += projectionMatrix * modelViewMatrix * vec4( outlineOffset, 0.0 );\n    #endif\n\n    #ifdef OUTLINE_WIDTH_SCREEN\n      vec3 clipNormal = ( projectionMatrix * modelViewMatrix * vec4( normalize( objectNormal ), 0.0 ) ).xyz;\n      vec2 projectedNormal = normalize( clipNormal.xy );\n      projectedNormal *= min( gl_Position.w, outlineScaledMaxDistance );\n      projectedNormal.x *= projectionMatrix[ 0 ].x / projectionMatrix[ 1 ].y;\n      gl_Position.xy += 0.01 * outlineWidth * outlineTex * projectedNormal.xy;\n    #endif\n\n    gl_Position.z += 1E-6 * gl_Position.w; // anti-artifact magic\n  #endif\n\n  #include <worldpos_vertex>\n  // #include <envmap_vertex>\n  #include <shadowmap_vertex>\n  #include <fog_vertex>\n\n}");

/***/ }),

/***/ "./src/vrm/material/shaders/unlit.frag":
/*!*********************************************!*\
  !*** ./src/vrm/material/shaders/unlit.frag ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("#ifdef RENDERTYPE_CUTOUT\n  uniform float cutoff;\n#endif\n\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n// #include <alphamap_pars_fragment>\n// #include <aomap_pars_fragment>\n// #include <lightmap_pars_fragment>\n// #include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n// #include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\n// == main procedure ===========================================================\nvoid main() {\n  #include <clipping_planes_fragment>\n\n  vec4 diffuseColor = vec4( 1.0 );\n\n  #include <logdepthbuf_fragment>\n\n  // #include <map_fragment>\n  #ifdef USE_MAP\n    diffuseColor *= mapTexelToLinear( texture2D( map, vUv ) );\n  #endif\n\n  #include <color_fragment>\n  // #include <alphamap_fragment>\n\n  // MToon: alpha\n  // #include <alphatest_fragment>\n  #ifdef RENDERTYPE_CUTOUT\n    if ( diffuseColor.a <= cutoff ) { discard; }\n    diffuseColor.a = 1.0;\n  #endif\n\n  #ifdef RENDERTYPE_OPAQUE\n    diffuseColor.a = 1.0;\n  #endif\n\n  // #include <specularmap_fragment>\n\n  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\n  // accumulation (baked indirect lighting only)\n  #ifdef USE_LIGHTMAP\n    reflectedLight.indirectDiffuse += texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n  #else\n    reflectedLight.indirectDiffuse += vec3( 1.0 );\n  #endif\n\n  // modulation\n  // #include <aomap_fragment>\n\n  reflectedLight.indirectDiffuse *= diffuseColor.rgb;\n  vec3 outgoingLight = reflectedLight.indirectDiffuse;\n\n  // #include <envmap_fragment>\n\n  gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n  #include <premultiplied_alpha_fragment>\n  #include <tonemapping_fragment>\n  #include <encodings_fragment>\n  #include <fog_fragment>\n}");

/***/ }),

/***/ "./src/vrm/material/shaders/unlit.vert":
/*!*********************************************!*\
  !*** ./src/vrm/material/shaders/unlit.vert ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("#include <common>\n\n// #include <uv_pars_vertex>\n#ifdef USE_MAP\n  varying vec2 vUv;\n  uniform vec4 mainTex_ST;\n#endif\n\n#include <uv2_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvoid main() {\n\n  // #include <uv_vertex>\n  #ifdef USE_MAP\n    vUv = vec2( mainTex_ST.p * uv.x + mainTex_ST.s, mainTex_ST.q * uv.y + mainTex_ST.t );\n  #endif\n\n  #include <uv2_vertex>\n  #include <color_vertex>\n  #include <skinbase_vertex>\n\n  #ifdef USE_ENVMAP\n\n  #include <beginnormal_vertex>\n  #include <morphnormal_vertex>\n  #include <skinnormal_vertex>\n  #include <defaultnormal_vertex>\n\n  #endif\n\n  #include <begin_vertex>\n  #include <morphtarget_vertex>\n  #include <skinning_vertex>\n  #include <project_vertex>\n  #include <logdepthbuf_vertex>\n\n  #include <worldpos_vertex>\n  #include <clipping_planes_vertex>\n  #include <envmap_vertex>\n  #include <fog_vertex>\n\n}");

/***/ }),

/***/ "./src/vrm/reduceBones.ts":
/*!********************************!*\
  !*** ./src/vrm/reduceBones.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
function reduceBones(root) {
    root.traverse(function (obj) {
        if (obj.type !== 'SkinnedMesh') {
            return;
        }
        var mesh = obj;
        var geometry = mesh.geometry.clone();
        mesh.geometry = geometry;
        var attribute = geometry.getAttribute('skinIndex');
        var bones = [];
        var boneInverses = [];
        var boneIndexMap = {};
        var array = attribute.array.map(function (index) {
            if (boneIndexMap[index] === undefined) {
                boneIndexMap[index] = bones.length;
                bones.push(mesh.skeleton.bones[index]);
                boneInverses.push(mesh.skeleton.boneInverses[index]);
            }
            return boneIndexMap[index];
        });
        geometry.removeAttribute('skinIndex');
        geometry.addAttribute('skinIndex', new THREE.BufferAttribute(array, 4, false));
        mesh.bind(new THREE.Skeleton(bones, boneInverses), new THREE.Matrix4());
    });
}
exports.reduceBones = reduceBones;


/***/ }),

/***/ "./src/vrm/springbone/VRMSpringBone.ts":
/*!*********************************************!*\
  !*** ./src/vrm/springbone/VRMSpringBone.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var math_1 = __webpack_require__(/*! ../utils/math */ "./src/vrm/utils/math.ts");
exports.GIZMO_RENDER_ORDER = 10000;
var IDENTITY_MATRIX4 = Object.freeze(new THREE.Matrix4());
var IDENTITY_QUATERNION = Object.freeze(new THREE.Quaternion());
var _v3A = new THREE.Vector3();
var _v3B = new THREE.Vector3();
var _v3C = new THREE.Vector3();
var _quatA = new THREE.Quaternion();
var _matA = new THREE.Matrix4();
var _matB = new THREE.Matrix4();
var VRMSpringBone = (function () {
    function VRMSpringBone(bone, radius, stiffiness, gravityDir, gravityPower, dragForce, colliders) {
        var _this = this;
        if (colliders === void 0) { colliders = []; }
        this.bone = bone;
        this.bone.matrixAutoUpdate = false;
        this.radius = radius;
        this.stiffnessForce = stiffiness;
        this.gravityDir = gravityDir;
        this.gravityPower = gravityPower;
        this.dragForce = dragForce;
        this.colliders = colliders;
        this._worldPosition = new THREE.Vector3().setFromMatrixPosition(this.bone.matrixWorld);
        this._parentWorldRotation = new THREE.Quaternion();
        this._initialLocalMatrix = this.bone.matrix.clone();
        this._initialLocalRotation = this.bone.quaternion.clone();
        this._initialLocalChildPosition = (function () {
            if (_this.bone.children.length === 0) {
                return _this.bone.position
                    .clone()
                    .normalize()
                    .multiplyScalar(0.07);
            }
            else {
                var firstChild = _this.bone.children[0];
                return firstChild.position.clone();
            }
        })();
        this._currentTail = this.bone.localToWorld(this._initialLocalChildPosition.clone());
        this._prevTail = this._currentTail.clone();
        this._nextTail = this._currentTail.clone();
        this._boneAxis = this._initialLocalChildPosition.clone().normalize();
        this._worldBoneLength = this.bone
            .localToWorld(_v3A.copy(this._initialLocalChildPosition))
            .sub(this._worldPosition)
            .length();
    }
    VRMSpringBone.prototype.reset = function () {
        this.bone.matrix.copy(this._initialLocalMatrix);
        this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition));
        this._prevTail.copy(this._currentTail);
        this._nextTail.copy(this._currentTail);
        this.bone.updateMatrix();
        this.bone.matrixWorld.multiplyMatrices(this._getParentMatrixWorld(), this.bone.matrix);
        this._worldPosition.setFromMatrixPosition(this.bone.matrixWorld);
    };
    VRMSpringBone.prototype.update = function (delta) {
        if (delta <= 0)
            return;
        this.bone.matrixWorld.multiplyMatrices(this._getParentMatrixWorld(), this.bone.matrix);
        if (this.bone.parent) {
            math_1.getWorldQuaternionLite(this.bone.parent, this._parentWorldRotation);
        }
        else {
            this._parentWorldRotation.copy(IDENTITY_QUATERNION);
        }
        this._worldPosition.setFromMatrixPosition(this.bone.matrixWorld);
        var stiffness = this.stiffnessForce * delta;
        var external = _v3B.copy(this.gravityDir).multiplyScalar(this.gravityPower * delta);
        this._nextTail
            .copy(this._currentTail)
            .add(_v3A
            .copy(this._currentTail)
            .sub(this._prevTail)
            .multiplyScalar(1 - this.dragForce))
            .add(_v3A
            .copy(this._boneAxis)
            .applyMatrix4(this._initialLocalMatrix)
            .applyMatrix4(this._getParentMatrixWorld())
            .sub(this._worldPosition)
            .normalize()
            .multiplyScalar(stiffness))
            .add(external);
        this._nextTail
            .sub(this._worldPosition)
            .normalize()
            .multiplyScalar(this._worldBoneLength)
            .add(this._worldPosition);
        this._collision(this._nextTail);
        this._prevTail.copy(this._currentTail);
        this._currentTail.copy(this._nextTail);
        var initialWorldMatrixInv = _matA.getInverse(_matB.copy(this._getParentMatrixWorld()).multiply(this._initialLocalMatrix));
        var applyRotation = _quatA.setFromUnitVectors(this._boneAxis, _v3A
            .copy(this._nextTail)
            .applyMatrix4(initialWorldMatrixInv)
            .normalize());
        this.bone.quaternion.copy(this._initialLocalRotation).multiply(applyRotation);
        this.bone.updateMatrix();
        this.bone.matrixWorld.multiplyMatrices(this._getParentMatrixWorld(), this.bone.matrix);
    };
    VRMSpringBone.prototype._collision = function (tail) {
        var _this = this;
        this.colliders.forEach(function (collider) {
            var colliderWorldPosition = _v3A.setFromMatrixPosition(collider.matrixWorld);
            var colliderRadius = collider.geometry.boundingSphere.radius;
            var r = _this.radius + colliderRadius;
            if (tail.distanceToSquared(colliderWorldPosition) <= r * r) {
                var normal = _v3B.subVectors(tail, colliderWorldPosition).normalize();
                var posFromCollider = _v3C.addVectors(colliderWorldPosition, normal.multiplyScalar(r));
                tail.copy(posFromCollider
                    .sub(_this._worldPosition)
                    .normalize()
                    .multiplyScalar(_this._worldBoneLength)
                    .add(_this._worldPosition));
            }
        });
    };
    VRMSpringBone.prototype._getParentMatrixWorld = function () {
        return this.bone.parent ? this.bone.parent.matrixWorld : IDENTITY_MATRIX4;
    };
    return VRMSpringBone;
}());
exports.VRMSpringBone = VRMSpringBone;


/***/ }),

/***/ "./src/vrm/springbone/VRMSpringBoneColliderGroup.ts":
/*!**********************************************************!*\
  !*** ./src/vrm/springbone/VRMSpringBoneColliderGroup.ts ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/springbone/VRMSpringBoneImporter.ts":
/*!*****************************************************!*\
  !*** ./src/vrm/springbone/VRMSpringBoneImporter.ts ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
var VRMSpringBone_1 = __webpack_require__(/*! ./VRMSpringBone */ "./src/vrm/springbone/VRMSpringBone.ts");
var VRMSpringBoneManager_1 = __webpack_require__(/*! ./VRMSpringBoneManager */ "./src/vrm/springbone/VRMSpringBoneManager.ts");
var VRMSpringBoneImporter = (function () {
    function VRMSpringBoneImporter() {
    }
    VRMSpringBoneImporter.prototype.import = function (gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var colliderGroups, springBoneGroupList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!gltf.parser.json.extensions ||
                            !gltf.parser.json.extensions.VRM ||
                            !gltf.parser.json.extensions.VRM.secondaryAnimation) {
                            return [2, null];
                        }
                        return [4, this._getColliderMeshGroups(gltf)];
                    case 1:
                        colliderGroups = _a.sent();
                        colliderGroups.forEach(function (group) {
                            var _a;
                            return (_a = gltf.scene).add.apply(_a, group.colliders);
                        });
                        return [4, this._getSpringBoneGroupList(gltf, colliderGroups)];
                    case 2:
                        springBoneGroupList = _a.sent();
                        return [2, new VRMSpringBoneManager_1.VRMSpringBoneManager(springBoneGroupList)];
                }
            });
        });
    };
    Object.defineProperty(VRMSpringBoneImporter.prototype, "_isColiderMeshVisible", {
        get: function () {
            return false;
        },
        enumerable: true,
        configurable: true
    });
    VRMSpringBoneImporter.prototype._createSpringBone = function (gltf, bone, hitRadius, stiffiness, gravityDir, gravityPower, dragForce, colliders) {
        if (colliders === void 0) { colliders = []; }
        return new VRMSpringBone_1.VRMSpringBone(bone, hitRadius, stiffiness, gravityDir, gravityPower, dragForce, colliders);
    };
    VRMSpringBoneImporter.prototype._getSpringBoneGroupList = function (gltf, colliderGroups) {
        return __awaiter(this, void 0, Promise, function () {
            var springBoneGroups, springBoneGroupList;
            var _this = this;
            return __generator(this, function (_a) {
                springBoneGroups = gltf.parser.json.extensions.VRM.secondaryAnimation
                    .boneGroups;
                springBoneGroupList = [];
                springBoneGroups.forEach(function (vrmBoneGroup) {
                    if (vrmBoneGroup.stiffiness === undefined ||
                        vrmBoneGroup.gravityDir === undefined ||
                        vrmBoneGroup.gravityDir.x === undefined ||
                        vrmBoneGroup.gravityDir.y === undefined ||
                        vrmBoneGroup.gravityDir.z === undefined ||
                        vrmBoneGroup.gravityPower === undefined ||
                        vrmBoneGroup.dragForce === undefined ||
                        vrmBoneGroup.hitRadius === undefined ||
                        vrmBoneGroup.colliderGroups === undefined ||
                        vrmBoneGroup.bones === undefined) {
                        return;
                    }
                    var stiffiness = vrmBoneGroup.stiffiness;
                    var gravityDir = new THREE.Vector3(vrmBoneGroup.gravityDir.x, vrmBoneGroup.gravityDir.y, vrmBoneGroup.gravityDir.z);
                    var gravityPower = vrmBoneGroup.gravityPower;
                    var dragForce = vrmBoneGroup.dragForce;
                    var hitRadius = vrmBoneGroup.hitRadius;
                    var colliders = [];
                    vrmBoneGroup.colliderGroups.forEach(function (colliderIndex) {
                        colliders.push.apply(colliders, colliderGroups[colliderIndex].colliders);
                    });
                    var springBoneGroup = [];
                    vrmBoneGroup.bones.forEach(function (nodeIndex) { return __awaiter(_this, void 0, void 0, function () {
                        var springRootBone;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, gltf.parser.getDependency('node', nodeIndex)];
                                case 1:
                                    springRootBone = _a.sent();
                                    if (!springRootBone) {
                                        return [2];
                                    }
                                    springRootBone.traverse(function (bone) {
                                        var springBone = _this._createSpringBone(gltf, bone, hitRadius, stiffiness, gravityDir, gravityPower, dragForce, colliders);
                                        springBoneGroup.push(springBone);
                                    });
                                    return [2];
                            }
                        });
                    }); });
                    springBoneGroupList.push(springBoneGroup);
                });
                return [2, springBoneGroupList];
            });
        });
    };
    VRMSpringBoneImporter.prototype._getColliderMeshGroups = function (gltf) {
        return __awaiter(this, void 0, Promise, function () {
            var vrmExt, secondaryAnimation, vrmColliderGroups, colliderGroups;
            var _this = this;
            return __generator(this, function (_a) {
                vrmExt = gltf.parser.json.extensions && gltf.parser.json.extensions.VRM;
                if (vrmExt === undefined) {
                    return [2, []];
                }
                secondaryAnimation = vrmExt.secondaryAnimation;
                if (secondaryAnimation === undefined) {
                    return [2, []];
                }
                vrmColliderGroups = secondaryAnimation.colliderGroups;
                if (vrmColliderGroups === undefined) {
                    return [2, []];
                }
                colliderGroups = [];
                vrmColliderGroups.forEach(function (colliderGroup) { return __awaiter(_this, void 0, void 0, function () {
                    var bone, colliders, colliderMeshGroup;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (colliderGroup.node === undefined || colliderGroup.colliders === undefined) {
                                    return [2];
                                }
                                return [4, gltf.parser.getDependency('node', colliderGroup.node)];
                            case 1:
                                bone = _a.sent();
                                colliders = [];
                                colliderGroup.colliders.forEach(function (collider) {
                                    if (collider.offset === undefined ||
                                        collider.offset.x === undefined ||
                                        collider.offset.y === undefined ||
                                        collider.offset.z === undefined ||
                                        collider.radius === undefined) {
                                        return;
                                    }
                                    var offsetMatrix = new THREE.Matrix4().makeTranslation(collider.offset.x, collider.offset.y, -collider.offset.z);
                                    var visible = _this._isColiderMeshVisible;
                                    var colliderMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(collider.radius, 8, 4), new THREE.MeshBasicMaterial({
                                        color: 0xff00ff,
                                        visible: visible,
                                        wireframe: true,
                                        transparent: true,
                                        depthTest: false,
                                    }));
                                    colliderMesh.material.renderOrder = VRMSpringBone_1.GIZMO_RENDER_ORDER;
                                    colliderMesh.name = 'vrmColliderSphere';
                                    colliderMesh.geometry.computeBoundingSphere();
                                    colliderMesh.updateMatrixWorld = function () {
                                        colliderMesh.matrixWorld.copy(bone.matrixWorld).multiply(offsetMatrix);
                                    };
                                    colliders.push(colliderMesh);
                                });
                                colliderMeshGroup = {
                                    node: colliderGroup.node,
                                    colliders: colliders,
                                };
                                colliderGroups.push(colliderMeshGroup);
                                return [2];
                        }
                    });
                }); });
                return [2, colliderGroups];
            });
        });
    };
    return VRMSpringBoneImporter;
}());
exports.VRMSpringBoneImporter = VRMSpringBoneImporter;


/***/ }),

/***/ "./src/vrm/springbone/VRMSpringBoneManager.ts":
/*!****************************************************!*\
  !*** ./src/vrm/springbone/VRMSpringBoneManager.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var VRMSpringBoneManager = (function () {
    function VRMSpringBoneManager(springBoneGroupList) {
        this.springBoneGroupList = [];
        this.springBoneGroupList = springBoneGroupList;
    }
    VRMSpringBoneManager.prototype.lateUpdate = function (delta) {
        this.springBoneGroupList.forEach(function (springBoneGroup) {
            springBoneGroup.forEach(function (springBone) {
                springBone.update(delta);
            });
        });
    };
    VRMSpringBoneManager.prototype.reset = function () {
        this.springBoneGroupList.forEach(function (springBoneGroup) {
            springBoneGroup.forEach(function (springBone) {
                springBone.reset();
            });
        });
    };
    return VRMSpringBoneManager;
}());
exports.VRMSpringBoneManager = VRMSpringBoneManager;


/***/ }),

/***/ "./src/vrm/springbone/index.ts":
/*!*************************************!*\
  !*** ./src/vrm/springbone/index.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./VRMSpringBone */ "./src/vrm/springbone/VRMSpringBone.ts"));
__export(__webpack_require__(/*! ./VRMSpringBoneColliderGroup */ "./src/vrm/springbone/VRMSpringBoneColliderGroup.ts"));
__export(__webpack_require__(/*! ./VRMSpringBoneImporter */ "./src/vrm/springbone/VRMSpringBoneImporter.ts"));
__export(__webpack_require__(/*! ./VRMSpringBoneManager */ "./src/vrm/springbone/VRMSpringBoneManager.ts"));


/***/ }),

/***/ "./src/vrm/types/GLTFSchema.ts":
/*!*************************************!*\
  !*** ./src/vrm/types/GLTFSchema.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/types/VRMSchema.ts":
/*!************************************!*\
  !*** ./src/vrm/types/VRMSchema.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var VRMSchema;
(function (VRMSchema) {
    var BlendShapePresetName;
    (function (BlendShapePresetName) {
        BlendShapePresetName["A"] = "a";
        BlendShapePresetName["Angry"] = "angry";
        BlendShapePresetName["Blink"] = "blink";
        BlendShapePresetName["BlinkL"] = "blink_l";
        BlendShapePresetName["BlinkR"] = "blink_r";
        BlendShapePresetName["E"] = "e";
        BlendShapePresetName["Fun"] = "fun";
        BlendShapePresetName["I"] = "i";
        BlendShapePresetName["Joy"] = "joy";
        BlendShapePresetName["Lookdown"] = "lookdown";
        BlendShapePresetName["Lookleft"] = "lookleft";
        BlendShapePresetName["Lookright"] = "lookright";
        BlendShapePresetName["Lookup"] = "lookup";
        BlendShapePresetName["Neutral"] = "neutral";
        BlendShapePresetName["O"] = "o";
        BlendShapePresetName["Sorrow"] = "sorrow";
        BlendShapePresetName["U"] = "u";
        BlendShapePresetName["Unknown"] = "unknown";
    })(BlendShapePresetName = VRMSchema.BlendShapePresetName || (VRMSchema.BlendShapePresetName = {}));
    var FirstPersonLookAtTypeName;
    (function (FirstPersonLookAtTypeName) {
        FirstPersonLookAtTypeName["BlendShape"] = "BlendShape";
        FirstPersonLookAtTypeName["Bone"] = "Bone";
    })(FirstPersonLookAtTypeName = VRMSchema.FirstPersonLookAtTypeName || (VRMSchema.FirstPersonLookAtTypeName = {}));
    var HumanoidBoneName;
    (function (HumanoidBoneName) {
        HumanoidBoneName["Chest"] = "chest";
        HumanoidBoneName["Head"] = "head";
        HumanoidBoneName["Hips"] = "hips";
        HumanoidBoneName["Jaw"] = "jaw";
        HumanoidBoneName["LeftEye"] = "leftEye";
        HumanoidBoneName["LeftFoot"] = "leftFoot";
        HumanoidBoneName["LeftHand"] = "leftHand";
        HumanoidBoneName["LeftIndexDistal"] = "leftIndexDistal";
        HumanoidBoneName["LeftIndexIntermediate"] = "leftIndexIntermediate";
        HumanoidBoneName["LeftIndexProximal"] = "leftIndexProximal";
        HumanoidBoneName["LeftLittleDistal"] = "leftLittleDistal";
        HumanoidBoneName["LeftLittleIntermediate"] = "leftLittleIntermediate";
        HumanoidBoneName["LeftLittleProximal"] = "leftLittleProximal";
        HumanoidBoneName["LeftLowerArm"] = "leftLowerArm";
        HumanoidBoneName["LeftLowerLeg"] = "leftLowerLeg";
        HumanoidBoneName["LeftMiddleDistal"] = "leftMiddleDistal";
        HumanoidBoneName["LeftMiddleIntermediate"] = "leftMiddleIntermediate";
        HumanoidBoneName["LeftMiddleProximal"] = "leftMiddleProximal";
        HumanoidBoneName["LeftRingDistal"] = "leftRingDistal";
        HumanoidBoneName["LeftRingIntermediate"] = "leftRingIntermediate";
        HumanoidBoneName["LeftRingProximal"] = "leftRingProximal";
        HumanoidBoneName["LeftShoulder"] = "leftShoulder";
        HumanoidBoneName["LeftThumbDistal"] = "leftThumbDistal";
        HumanoidBoneName["LeftThumbIntermediate"] = "leftThumbIntermediate";
        HumanoidBoneName["LeftThumbProximal"] = "leftThumbProximal";
        HumanoidBoneName["LeftToes"] = "leftToes";
        HumanoidBoneName["LeftUpperArm"] = "leftUpperArm";
        HumanoidBoneName["LeftUpperLeg"] = "leftUpperLeg";
        HumanoidBoneName["Neck"] = "neck";
        HumanoidBoneName["RightEye"] = "rightEye";
        HumanoidBoneName["RightFoot"] = "rightFoot";
        HumanoidBoneName["RightHand"] = "rightHand";
        HumanoidBoneName["RightIndexDistal"] = "rightIndexDistal";
        HumanoidBoneName["RightIndexIntermediate"] = "rightIndexIntermediate";
        HumanoidBoneName["RightIndexProximal"] = "rightIndexProximal";
        HumanoidBoneName["RightLittleDistal"] = "rightLittleDistal";
        HumanoidBoneName["RightLittleIntermediate"] = "rightLittleIntermediate";
        HumanoidBoneName["RightLittleProximal"] = "rightLittleProximal";
        HumanoidBoneName["RightLowerArm"] = "rightLowerArm";
        HumanoidBoneName["RightLowerLeg"] = "rightLowerLeg";
        HumanoidBoneName["RightMiddleDistal"] = "rightMiddleDistal";
        HumanoidBoneName["RightMiddleIntermediate"] = "rightMiddleIntermediate";
        HumanoidBoneName["RightMiddleProximal"] = "rightMiddleProximal";
        HumanoidBoneName["RightRingDistal"] = "rightRingDistal";
        HumanoidBoneName["RightRingIntermediate"] = "rightRingIntermediate";
        HumanoidBoneName["RightRingProximal"] = "rightRingProximal";
        HumanoidBoneName["RightShoulder"] = "rightShoulder";
        HumanoidBoneName["RightThumbDistal"] = "rightThumbDistal";
        HumanoidBoneName["RightThumbIntermediate"] = "rightThumbIntermediate";
        HumanoidBoneName["RightThumbProximal"] = "rightThumbProximal";
        HumanoidBoneName["RightToes"] = "rightToes";
        HumanoidBoneName["RightUpperArm"] = "rightUpperArm";
        HumanoidBoneName["RightUpperLeg"] = "rightUpperLeg";
        HumanoidBoneName["Spine"] = "spine";
        HumanoidBoneName["UpperChest"] = "upperChest";
    })(HumanoidBoneName = VRMSchema.HumanoidBoneName || (VRMSchema.HumanoidBoneName = {}));
    var MetaAllowedUserName;
    (function (MetaAllowedUserName) {
        MetaAllowedUserName["Everyone"] = "Everyone";
        MetaAllowedUserName["ExplicitlyLicensedPerson"] = "ExplicitlyLicensedPerson";
        MetaAllowedUserName["OnlyAuthor"] = "OnlyAuthor";
    })(MetaAllowedUserName = VRMSchema.MetaAllowedUserName || (VRMSchema.MetaAllowedUserName = {}));
    var MetaUssageName;
    (function (MetaUssageName) {
        MetaUssageName["Allow"] = "Allow";
        MetaUssageName["Disallow"] = "Disallow";
    })(MetaUssageName = VRMSchema.MetaUssageName || (VRMSchema.MetaUssageName = {}));
    var MetaLicenseName;
    (function (MetaLicenseName) {
        MetaLicenseName["Cc0"] = "CC0";
        MetaLicenseName["CcBy"] = "CC_BY";
        MetaLicenseName["CcByNc"] = "CC_BY_NC";
        MetaLicenseName["CcByNcNd"] = "CC_BY_NC_ND";
        MetaLicenseName["CcByNcSa"] = "CC_BY_NC_SA";
        MetaLicenseName["CcByNd"] = "CC_BY_ND";
        MetaLicenseName["CcBySa"] = "CC_BY_SA";
        MetaLicenseName["Other"] = "Other";
        MetaLicenseName["RedistributionProhibited"] = "Redistribution_Prohibited";
    })(MetaLicenseName = VRMSchema.MetaLicenseName || (VRMSchema.MetaLicenseName = {}));
})(VRMSchema = exports.VRMSchema || (exports.VRMSchema = {}));


/***/ }),

/***/ "./src/vrm/types/index.ts":
/*!********************************!*\
  !*** ./src/vrm/types/index.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./GLTFSchema */ "./src/vrm/types/GLTFSchema.ts"));
__export(__webpack_require__(/*! ./VRMSchema */ "./src/vrm/types/VRMSchema.ts"));
__export(__webpack_require__(/*! ./types */ "./src/vrm/types/types.ts"));


/***/ }),

/***/ "./src/vrm/types/types.ts":
/*!********************************!*\
  !*** ./src/vrm/types/types.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),

/***/ "./src/vrm/utils/disposer.ts":
/*!***********************************!*\
  !*** ./src/vrm/utils/disposer.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function disposeMaterial(material) {
    Object.keys(material).forEach(function (propertyName) {
        if (!!material[propertyName] && typeof material[propertyName].dispose === 'function') {
            material[propertyName].dispose();
        }
    });
    material.dispose();
    material = undefined;
}
function dispose(object3D) {
    if (object3D.geometry) {
        object3D.geometry.dispose();
        object3D.geometry = undefined;
    }
    if (!!object3D.material && Array.isArray(object3D.material)) {
        object3D.material.forEach(function (material) { return disposeMaterial(material); });
    }
    else if (object3D.material) {
        disposeMaterial(object3D.material);
    }
}
function deepDispose(object3D) {
    object3D.traverse(dispose);
}
exports.deepDispose = deepDispose;


/***/ }),

/***/ "./src/vrm/utils/math.ts":
/*!*******************************!*\
  !*** ./src/vrm/utils/math.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __webpack_require__(/*! three */ "three");
function saturate(value) {
    return Math.max(Math.min(value, 1.0), 0.0);
}
exports.saturate = saturate;
function linstep(x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    return (x - min) / (max - min);
}
exports.linstep = linstep;
var _position = new THREE.Vector3();
var _scale = new THREE.Vector3();
var _rotation = new THREE.Quaternion();
function getWorldPositionLite(object, out) {
    object.matrixWorld.decompose(out, _rotation, _scale);
    return out;
}
exports.getWorldPositionLite = getWorldPositionLite;
function getWorldScaleLite(object, out) {
    object.matrixWorld.decompose(_position, _rotation, out);
    return out;
}
exports.getWorldScaleLite = getWorldScaleLite;
function getWorldQuaternionLite(object, out) {
    object.matrixWorld.decompose(_position, out, _scale);
    return out;
}
exports.getWorldQuaternionLite = getWorldQuaternionLite;


/***/ }),

/***/ "./src/vrm/utils/renameMaterialProperty.ts":
/*!*************************************************!*\
  !*** ./src/vrm/utils/renameMaterialProperty.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function renameMaterialProperty(name) {
    if (name[0] !== '_') {
        console.warn("renameMaterialProperty: Given property name \"" + name + "\" might be invalid");
        return name;
    }
    name = name.substring(1);
    if (!/[A-Z]/.test(name[0])) {
        console.warn("renameMaterialProperty: Given property name \"" + name + "\" might be invalid");
        return name;
    }
    return name[0].toLowerCase() + name.substring(1);
}
exports.renameMaterialProperty = renameMaterialProperty;


/***/ }),

/***/ "three":
/*!************************!*\
  !*** external "THREE" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = THREE;

/***/ })

/******/ });