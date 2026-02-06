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

    const helper = [
        "// __shadowwire_dynamic_wasm__",
        "function __shadowwireImport(path) {",
        "  const mod = {};",
        "  const ready = import(path).then((m) => Object.assign(mod, m));",
        "  return new Proxy(mod, {",
        "    get(_target, prop) {",
        "      if (prop in mod) return mod[prop];",
        "      return (...args) => ready.then(() => {",
        "        const value = mod[prop];",
        "        return typeof value === \"function\" ? value(...args) : value;",
        "      });",
        "    }",
        "  });",
        "}",
        ""
    ].join("\n");

    const requireRegex = /require\((['"])([^'"]*settler_wasm\.js)\1\)/g;
    if (!requireRegex.test(src)) {
        return false;
    }

    src = helper + src.replace(requireRegex, (_m, quote, relPath) => `__shadowwireImport(${quote}${relPath}${quote})`);

    fs.writeFileSync(filePath, src, "utf8");
    return true;
}

if (fs.existsSync(distDir)) {
    let patched = 0;
    const walk = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".cjs"))) {
                if (patchZkProofs(fullPath)) patched += 1;
            }
        }
    };
    walk(distDir);
    if (patched > 0) {
        log(`Patched ${patched} zkProofs file(s) for dynamic wasm import.`);
    }
}
