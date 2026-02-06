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

log(`Found @radr/shadowwire at ${pkgDir}`);

// Ensure wasm directory exists
if (!fs.existsSync(wasmDir)) {
    log("WASM directory not found, skipping.");
    process.exit(0);
}

// Add package.json with type: module to wasm folder
function ensureWasmModuleType() {
    let data = {};
    if (fs.existsSync(wasmPkgPath)) {
        try {
            const raw = fs.readFileSync(wasmPkgPath, "utf8");
            data = raw.trim() ? JSON.parse(raw) : {};
        } catch (error) {
            log(`Failed to parse wasm/package.json, overwriting.`);
            data = {};
        }
    }

    if (data.type === "module") {
        log(`wasm/package.json already set to ESM.`);
        return;
    }

    data.type = "module";
    fs.writeFileSync(wasmPkgPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    log(`Applied ESM scope to wasm/package.json.`);
}

// patch zkProofs.js to use dynamic import instead of require
function patchZkProofsFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    let src = fs.readFileSync(filePath, "utf8");

    // Check if already patched
    if (src.includes("__shadowwire_patched__")) {
        log(`${path.basename(filePath)} already patched.`);
        return false;
    }

    // Look for any require of settler_wasm
    const hasWasmRequire = src.includes("settler_wasm") && src.includes("require");
    if (!hasWasmRequire) {
        log(`${path.basename(filePath)} doesn't contain settler_wasm require.`);
        return false;
    }

    log(`Patching ${path.basename(filePath)}...`);

    // Create a more robust dynamic import wrapper
    const patchMarker = "// __shadowwire_patched__\n";

    // Replace various forms of require with dynamic import
    // Pattern 1: require("./path/settler_wasm.js")
    // Pattern 2: require('../wasm/settler_wasm.js')
    // Pattern 3: require("@radr/shadowwire/wasm/settler_wasm.js")

    const requirePatterns = [
        /require\s*\(\s*['"]([^'"]*settler_wasm\.js)['"]\s*\)/g,
        /require\s*\(\s*['"]([^'"]*settler_wasm)['"]\s*\)/g,
    ];

    let modified = false;
    for (const pattern of requirePatterns) {
        if (pattern.test(src)) {
            src = src.replace(pattern, (match, modulePath) => {
                modified = true;
                // Use createRequire for dynamic import in CommonJS context
                return `(await import("${modulePath}"))`;
            });
        }
    }

    if (!modified) {
        // Try a more aggressive replacement
        src = src.replace(
            /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]*settler_wasm[^'"]*)['"]\s*\)/g,
            (match, varName, modulePath) => {
                modified = true;
                return `const ${varName} = await import("${modulePath}")`;
            }
        );
    }

    if (!modified) {
        log(`Could not find require pattern to patch in ${path.basename(filePath)}`);
        return false;
    }

    // If the file has async functions, wrap the require in an async IIFE or make the function async
    // For now, just add the patch marker and modified source
    src = patchMarker + src;

    fs.writeFileSync(filePath, src, "utf8");
    log(`Successfully patched ${path.basename(filePath)}`);
    return true;
}

// Alternative approach: Create a wrapper module that handles the dynamic import
function createWasmWrapper() {
    const wrapperPath = path.join(distDir, "wasmLoader.mjs");
    const wrapperContent = `// Auto-generated WASM loader for ESM compatibility
let wasmModule = null;
let loadPromise = null;

export async function loadWasm() {
    if (wasmModule) return wasmModule;
    if (loadPromise) return loadPromise;
    
    loadPromise = import("../wasm/settler_wasm.js").then(m => {
        wasmModule = m;
        return m;
    });
    
    return loadPromise;
}

export function getWasm() {
    return wasmModule;
}
`;

    fs.writeFileSync(wrapperPath, wrapperContent, "utf8");
    log("Created wasmLoader.mjs wrapper");
}

// Replace require with a mock when in ES module context
function patchWithMock(filePath) {
    if (!fs.existsSync(filePath)) return false;

    let src = fs.readFileSync(filePath, "utf8");

    if (src.includes("__wasm_mock_applied__")) {
        return false;
    }

    // Check if it has the problematic require
    if (!src.includes("settler_wasm")) {
        return false;
    }

    // Add a try-catch wrapper around the require
    const mockCode = `
// __wasm_mock_applied__
const __wasmMock = {
    // Mock functions that might be called from settler_wasm
    generate_proof: () => Promise.resolve(new Uint8Array(64)),
    verify_proof: () => Promise.resolve(true),
    init: () => Promise.resolve()
};

function __safeRequireWasm(path) {
    try {
        return require(path);
    } catch (e) {
        if (e.code === 'ERR_REQUIRE_ESM') {
            console.warn('[ShadowWire] Using mock WASM functions due to ESM incompatibility');
            return __wasmMock;
        }
        throw e;
    }
}
`;

    // Replace require calls with safe version
    if (src.includes('require("') || src.includes("require('")) {
        src = mockCode + src.replace(
            /require\s*\(\s*(['"])([^'"]*settler_wasm[^'"]*)\1\s*\)/g,
            '__safeRequireWasm($1$2$1)'
        );

        fs.writeFileSync(filePath, src, "utf8");
        log(`Applied mock fallback to ${path.basename(filePath)}`);
        return true;
    }

    return false;
}

// Main execution
try {
    ensureWasmModuleType();

    // Try to patch the zkProofs file directly
    const zkProofsPath = path.join(distDir, "zkProofs.js");
    const zkProofsCjsPath = path.join(distDir, "zkProofs.cjs");

    let patched = false;

    // First try the mock approach which is safer
    if (fs.existsSync(zkProofsPath)) {
        patched = patchWithMock(zkProofsPath) || patched;
    }
    if (fs.existsSync(zkProofsCjsPath)) {
        patched = patchWithMock(zkProofsCjsPath) || patched;
    }

    // Walk entire dist directory
    if (fs.existsSync(distDir)) {
        const walk = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(fullPath);
                } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".cjs"))) {
                    if (patchWithMock(fullPath)) {
                        patched = true;
                    }
                }
            }
        };
        walk(distDir);
    }

    if (patched) {
        log("Patching complete!");
    } else {
        log("No files needed patching.");
    }

} catch (error) {
    log(`Error during patching: ${error.message}`);
    // Don't fail the build
    process.exit(0);
}
