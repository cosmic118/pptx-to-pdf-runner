/* eslint-disable */
const path = require(`path`);
const fs = require(`fs`);
const tsConfig = JSON.parse(fs.readFileSync(`./tsconfig.json`));
const tsConfigPaths = require(`tsconfig-paths`);

const baseUrl = tsConfig.compilerOptions.baseUrl || `.`;
const outDir = tsConfig.compilerOptions.outDir || `.`;
const explicitParams = {
  baseUrl: path.resolve(baseUrl, outDir),
  paths: tsConfig.compilerOptions.paths,
};

console.log(`Explicit params:`, explicitParams);

const cleanup = tsConfigPaths.register(explicitParams);

setTimeout(() => { cleanup() }, 1);