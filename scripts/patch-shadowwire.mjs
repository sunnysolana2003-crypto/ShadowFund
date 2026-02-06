import fs from "fs";
import path from "path";

const root = process.cwd();
const pkgDir = path.join(root, "node_modules", "@radr", "shadowwire");
const wasmDir = path.join(pkgDir, "wasm");
const wasmPkgPath = path.join(wasmDir, "package.json");
const rootPkgPath = path.join(pkgDir, "package.json");
const distDir = path.join(pkgDir, "dist");

function log(message) {
    console.log(`[patch-shadowwire] ${message}`);
}

if (!fs.existsSync(pkgDir)) {
    log("Package not installed, skipping.");
    process.exit(0);
}

if (!fs.existsSync(wasmDir)) {
    log("WASM directory not found, skipping.");
    process.exit(0);
}

function setTypeModule(pkgPath, label) {
    let data = {};
    if (fs.existsSync(pkgPath)) {
        try {
            const raw = fs.readFileSync(pkgPath, "utf8");
            data = raw.trim() ? JSON.parse(raw) : {};
        } catch (error) {
            log(`Failed to parse ${label}, overwriting.`);
            data = {};
        }
    }

    if (data.type === "module") {
        log(`${label} already set to ESM.`);
        return;
    }

    data.type = "module";
    fs.writeFileSync(pkgPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    log(`Applied ESM scope to ${label}.`);
}

if (fs.existsSync(rootPkgPath)) {
    try {
        const raw = fs.readFileSync(rootPkgPath, "utf8");
        const rootPkg = raw.trim() ? JSON.parse(raw) : {};
        if (rootPkg?.name === "@radr/shadowwire" && rootPkg.type === "module") {
            delete rootPkg.type;
            fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
            log("Removed ESM scope from package.json to keep SDK in CJS.");
        }
    } catch {
        log("Failed to adjust root package.json type.");
    }
}

setTypeModule(wasmPkgPath, "wasm/package.json");

function patchZkProofs(filePath) {
    let src = fs.readFileSync(filePath, "utf8");
    if (!src.includes("settler_wasm.js") || !src.includes("require(")) {
        return false;
    }
    if (src.includes("__shadowwire_dynamic_wasm__")) {
        return false;
    }

    const requireRegex = /(const|let|var)\s+(\w+)\s*=\s*require\((['"])([^'"]*settler_wasm\.js)\3\);/;
    const match = src.match(requireRegex);
    if (!match) {
        return false;
    }

    const varName = match[2];
    const relPath = match[4];

    const loader = [
        `// __shadowwire_dynamic_wasm__`,
        `const ${varName}Module = {};`,
        `let ${varName}Ready = import(${match[3]}${relPath}${match[3]}).then((mod) => Object.assign(${varName}Module, mod));`,
        `const ${varName} = new Proxy(${varName}Module, {`,
        `  get(_target, prop) {`,
        `    if (prop in ${varName}Module) return ${varName}Module[prop];`,
        `    return (...args) => ${varName}Ready.then(() => {`,
        `      const value = ${varName}Module[prop];`,
        `      return typeof value === "function" ? value(...args) : value;`,
        `    });`,
        `  }`,
        `});`
    ].join("\n");

    src = src.replace(requireRegex, loader);
    fs.writeFileSync(filePath, src, "utf8");
    return true;
}

if (fs.existsSync(distDir)) {
    let patched = 0;
    for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
        const filePath = path.join(distDir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".js")) {
            if (patchZkProofs(filePath)) patched += 1;
        }
    }
    if (patched > 0) {
        log(`Patched ${patched} zkProofs file(s) for dynamic wasm import.`);
    }
}
