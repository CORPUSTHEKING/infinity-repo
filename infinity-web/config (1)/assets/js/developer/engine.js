(async function GhostEngine() {
    const bootstrapElement = document.currentScript;
    const MANIFEST_PATH = bootstrapElement.dataset.manifest;
    const MAP_PATH = bootstrapElement.dataset.map;
    
    const env = { funcs: {}, paths: {} };

    // Deep Variable Resolver to prevent Argument Overfitting
    const resolveArgs = (arg) => {
        if (typeof arg === 'string') {
            if (arg === '$ENV') return env;
            if (arg.startsWith('$')) {
                const key = arg.slice(1);
                // Return mapped path, standard env var, or fallback to the string
                return env.paths[key] || env[key] || arg; 
            }
        }
        if (Array.isArray(arg)) return arg.map(resolveArgs);
        if (arg !== null && typeof arg === 'object') {
            const resolved = {};
            for (let k in arg) resolved[k] = resolveArgs(arg[k]);
            return resolved;
        }
        return arg;
    };

    const load = async (path) => {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error(`FATAL: Resource missing or invalid JSON at ${path}`, e);
            throw e;
        }
    };

    try {
        const [manifest, pathsMap] = await Promise.all([
            load(MANIFEST_PATH),
            load(MAP_PATH)
        ]);
        
        Object.assign(env.paths, pathsMap);
        Object.assign(env, manifest.env);

        // Load Tools (System & Templates)
        const loadTool = async (tool, typePath) => {
            const def = await load(`${env.paths[typePath]}/${tool}`);
            env.funcs[def.name] = new Function(...def.args, def.body);
        };

        const sysPromises = manifest.bootstrap.system_tools.map(t => loadTool(t, 'INFINITY-ASSETS_PAYLOADS_SYSTEM'));
        const tplPromises = manifest.bootstrap.template_tools.map(t => loadTool(t, 'INFINITY-ASSETS_PAYLOADS_TEMPLATES'));
        
        await Promise.all([...sysPromises, ...tplPromises]);

        // Execute Sequence Chain
        for (const step of manifest.bootstrap.sequence) {
            const action = step.action;
            const args = resolveArgs(step.args);
            
            if (env.funcs[action]) {
                await env.funcs[action](...args);
            } else {
                console.warn(`Engine Skip: Function '${action}' is not defined.`);
            }
        }
    } catch (e) {
        console.error("Engine Halted:", e);
    }
})();
