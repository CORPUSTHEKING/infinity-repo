This is the documentation for the **Infinity Ghost Engine**, a zero-hardcoded, fully decoupled architecture where logic and data are treated as interchangeable JSON payloads.
## 📂 The Directory Blueprint
The following table maps the structural nodes of the repository. Every path is represented as a constant in the system's "Rosetta Stone" (paths.json).
| Path | Mapping Constant | Purpose |
|---|---|---|
| ./config/ | N/A | **The Brain.** Contains the Manifest and the Path Map. |
| ./assets/js/developer/ | INFINITY-ASSETS_JS_DEVELOPER | **The Engine Room.** Houses the Ghost Engine script. |
| ./assets/payloads/SYSTEM/ | INFINITY-ASSETS_PAYLOADS_SYSTEM | **Core Logic.** Standalone functional skeletons for system ops. |
| ./assets/payloads/TEMPLATES/ | INFINITY-ASSETS_PAYLOADS_TEMPLATES | **UI Blueprints.** JSON skeletons that build HTML. |
| ./data/scripts/developer/ | INFINITY-DATA_SCRIPTS_DEVELOPER | **The Content.** JSON data payloads for individual profiles. |
| ./assets/css/developer/ | INFINITY-ASSETS_CSS_DEVELOPER | **The Skin.** Dynamically injected styles. |
| ./components/* | Multiple | **Modules.** Future-proofing for hero, router, and overlay units. |
| ./pages/* | Multiple | **Views.** Directories for developer pages and upload portals. |
| ./tools/* | Multiple | **Utility.** Logic for cards and specific journey trackers. |
## 📄 The File Catalog
Here is the granular breakdown of the **11 core files** that drive the current iteration of the system.
### 1. Configuration & Orchestration
 * **./config/paths.json** The "Rosetta Stone." It maps abstract constants (like $INFINITY-DATA) to real relative paths, allowing the engine to navigate the server without knowing the folder names.
 * **./config/manifest.json** The "Master Plan." It defines the environment, tells the engine which system tools and templates to compile, and sets the execution sequence (e.g., "Inject CSS, then Walk the Data").
### 2. The Execution Core
 * **./assets/js/developer/engine.js** The "Ghost Engine." It is a blind executor. It reads its own HTML data attributes to find the Manifest/Map, resolves recursive arguments, compiles JSON strings into live JavaScript functions, and triggers the boot sequence.
### 3. System Tools (./assets/payloads/SYSTEM/)
 * **cssInjector.json** Fetches the stylesheet and attaches it to the document head. This removes the need for <link> tags in the HTML shell.
 * **iterator.json** The "Path Walker." It fetches a list.json index and loops through data payloads. It features robust try/catch logic to prevent network failures from crashing the app.
 * **listener.json** The "Interactivity Binder." It searches the DOM for data-target-drawer attributes and binds open/close events to the generated UI nodes.
### 4. Template Tools (./assets/payloads/TEMPLATES/)
 * **constructor.json** The "UI Builder." It takes raw developer data and injects it into a specific HTML structure, including "Drawers" for contact information.
### 5. Content & Data (./data/scripts/developer/)
 * **list.json** The "Directory Index." A simple array of filenames that tells the iterator which profiles to fetch.
 * **target_01.json** The "Identity." Contains the name, location, email, and images for a specific developer. It dictates which action (template) should be used to render it.
### 6. Shell & Style
 * **./assets/css/developer/style.css** Standard CSS providing layout, animations for drawers, and the visual theme.
 * **./index.html** The "Portal." A blank canvas containing only the app-root div and the script tag that boots the engine. It includes a strict CSP (Content Security Policy) to balance flexibility with security.
## 🔄 System Flow Summary
 1. **Request:** User hits index.html.
 2. **Mapping:** Engine reads paths.json and manifest.json.
 3. **Styling:** cssInjector paints the page.
 4. **Discovery:** iterator finds list.json.
 5. **Assembly:** constructor builds the nodes using target_01.json.
 6. **Binding:** listener makes the buttons come alive.
> [!IMPORTANT]
> To extend this system, you never need to edit engine.js or index.html. You simply add a new JSON tool to payloads or a new data file to data/scripts and update the Manifest.
> 
