import fs from "fs";
import path from "path";

const root = process.cwd();
const pkgDir = path.join(root, "node_modules", "@radr", "shadowwire");
const wasmDir = path.join(pkgDir, "wasm");
const wasmPkgPath = path.join(wasmDir, "package.json");
const rootPkgPath = path.join(pkgDir, "package.json");

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
