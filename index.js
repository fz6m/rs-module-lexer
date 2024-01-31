"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var path_1 = require("path");
var assert = __importStar(require("assert"));
var pkg = require((0, path_1.join)(__dirname, './package.json'));
var pkgName = pkg.name;
var binaryEnv = pkgName.replace('-', '_').toUpperCase() + '_BINARY_PATH';
var getWasmName = function () {
    var _a, _b, _c, _d;
    if ((_a = pkg === null || pkg === void 0 ? void 0 : pkg.vary) === null || _a === void 0 ? void 0 : _a.wasmName) {
        return pkg.vary.wasmName;
    }
    var packageName = ((_c = (_b = pkg.napi) === null || _b === void 0 ? void 0 : _b.package) === null || _c === void 0 ? void 0 : _c.name) || ((_d = pkg.napi) === null || _d === void 0 ? void 0 : _d.packageName);
    var wasmPkgName = "".concat(packageName, "-wasm");
    return wasmPkgName;
};
var wasmPkgName = getWasmName();
// Allow overrides to the location of the .node binding file
var bindingsOverride = process.env[binaryEnv];
// @ts-ignore
var bindings = (function () {
    var binding;
    try {
        binding = !!bindingsOverride
            ? require((0, path_1.resolve)(bindingsOverride))
            : require('./binding');
        // If native binding loaded successfully, it should return proper target triple constant.
        var triple = binding.getTargetTriple();
        assert.ok(triple, 'Failed to read target triple from native binary.');
        return binding;
    }
    catch (_) {
        binding = require(wasmPkgName);
    }
    finally {
        return binding;
    }
})();
module.exports = bindings;
