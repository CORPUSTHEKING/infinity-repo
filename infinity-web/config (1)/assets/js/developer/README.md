# ⚙️ The Executor (/assets/js/developer/)
Contains the Ghost Engine core logic.

## engine.js Mechanics
* **Recursive Argument Resolution**: Deep-dives into objects to find strings starting with `$` and replaces them with mapped paths.
* **Dynamic Compilation**: Uses `new Function()` to convert JSON payload logic into live methods inside the `env.funcs` object.
* **Error Boundaries**: Implements global `try/catch` to handle network failures or malformed JSON logic.
