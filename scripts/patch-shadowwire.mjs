import fs from "fs";
import path from "path";

const root = process.cwd();
const pkgDir = path.join(root, "node_modules", "@radr", "shadowwire");
const wasmDir = path.join(pkgDir, "wasm");
const rootPkgPath = path.join(pkgDir, "package.json");
const wasmPkgPath = path.join(wasmDir, "package.json");
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

const wasmCandidates = ["settler_wasm.js", "settler_wasm.mjs"];
const wasmEntry = wasmCandidates.find((name) => fs.existsSync(path.join(wasmDir, name)));
if (!wasmEntry) {
    log("No settler_wasm entry file found, skipping.");
    process.exit(0);
}

const wasmEntryExt = path.extname(wasmEntry);
const wasmEntryPath = path.join(wasmDir, wasmEntry);

// If the wasm entry is .js, make sure the wasm folder is ESM
if (wasmEntryExt === ".js") {
    let wasmPkg = {};
    try {
        if (fs.existsSync(wasmPkgPath)) {
            const raw = fs.readFileSync(wasmPkgPath, "utf8");
            wasmPkg = raw.trim() ? JSON.parse(raw) : {};
        }
    } catch {
        wasmPkg = {};
    }

    if (wasmPkg.type !== "module") {
        wasmPkg.type = "module";
        fs.writeFileSync(wasmPkgPath, JSON.stringify(wasmPkg, null, 2) + "\n", "utf8");
        log("Applied ESM scope to wasm/package.json.");
    }
}

// Keep SDK dist in CJS by removing root ESM scope if present
if (fs.existsSync(rootPkgPath)) {
    try {
        const raw = fs.readFileSync(rootPkgPath, "utf8");
        const rootPkg = raw.trim() ? JSON.parse(raw) : {};
        if (rootPkg?.name === "@radr/shadowwire" && rootPkg.type === "module") {
            delete rootPkg.type;
            fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
            log("Removed ESM scope from @radr/shadowwire/package.json.");
        }
    } catch {
        log("Failed to adjust root package.json type.");
    }
}

function patchWasmEntry(filePath) {
    try {
        let src = fs.readFileSync(filePath, "utf8");
        if (src.includes("__shadowwire_node_shim__")) return false;

        // Only patch when it looks like the module expects Node helpers.
        const looksLikeNode = src.includes("Node.js require not available") || src.includes("require(") || src.includes("__dirname");
        if (!looksLikeNode) return false;

        const shim = [
            "// __shadowwire_node_shim__",
            "import { createRequire as __shadowwireCreateRequire } from \"node:module\";",
            "import { fileURLToPath as __shadowwireFileURLToPath } from \"node:url\";",
            "import { dirname as __shadowwireDirname } from \"node:path\";",
            "const require = typeof globalThis.require === \"function\" ? globalThis.require : __shadowwireCreateRequire(import.meta.url);",
            "const __filename = __shadowwireFileURLToPath(import.meta.url);",
            "const __dirname = __shadowwireDirname(__filename);",
            "",
        ].join("\n");

        src = shim + src;
        fs.writeFileSync(filePath, src, "utf8");
        return true;
    } catch {
        return false;
    }
}

function patchFile(filePath) {
    let src = fs.readFileSync(filePath, "utf8");
    const hasWasm = src.includes("settler_wasm");
    const hasRequire = src.includes("require(");
    const hasSafeRequire = src.includes("__safeRequireWasm");

    if (!hasWasm || (!hasRequire && !hasSafeRequire)) {
        return false;
    }

    const helper = [
        "// __shadowwire_dynamic_wasm__",
        "function __shadowwireImport(specifier) {",
        "  const mod = {};",
        "  const ready = import(specifier).then((m) => Object.assign(mod, m));",
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

    const requireRegex = /require\((['"])([^'"]*settler_wasm(?:\.[a-z]+)?)\1\)/g;
    const safeRequireRegex = /__safeRequireWasm\((['"])([^'"]*settler_wasm(?:\.[a-z]+)?)\1\)/g;
    if (!requireRegex.test(src) && !safeRequireRegex.test(src)) {
        return false;
    }

    if (!src.includes("__shadowwire_dynamic_wasm__")) {
        src = helper + src;
    }

    const replaceToDynamic = (_m, quote, relPath) => {
        let normalized = relPath;
        if (relPath.endsWith("settler_wasm")) {
            normalized = `${relPath}${wasmEntryExt}`;
        } else if (relPath.includes("settler_wasm.") && !relPath.endsWith(wasmEntryExt)) {
            normalized = relPath.replace(/settler_wasm\.[a-z]+$/, `settler_wasm${wasmEntryExt}`);
        }
        return `__shadowwireImport(${quote}${normalized}${quote})`;
    };

    src = src.replace(requireRegex, replaceToDynamic);
    src = src.replace(safeRequireRegex, replaceToDynamic);

    fs.writeFileSync(filePath, src, "utf8");
    return true;
}

let patched = 0;
if (fs.existsSync(distDir)) {
    if (patchWasmEntry(wasmEntryPath)) {
        patched += 1;
        log(`Patched ${path.basename(wasmEntryPath)} with Node shim for require/__dirname.`); 
    }

    const walk = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".cjs") || entry.name.endsWith(".mjs"))) {
                if (patchFile(fullPath)) patched += 1;
            }
        }
    };
    walk(distDir);
}

if (patched > 0) {
    log(`Patched ${patched} file(s) to use dynamic wasm import.`);
} else {
    log("No files needed patching.");
}
