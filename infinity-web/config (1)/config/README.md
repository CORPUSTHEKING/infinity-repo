# 🧠 The Brain (/config/)
This directory contains the orchestration logic for the entire engine.

## Files
* **paths.json**: The Rosetta Stone. Every path in the project is mapped to a constant here. This allows you to move folders without breaking the JS logic.
* **manifest.json**: The Master Plan. It defines:
  * **env**: Global constants like the TARGET_NODE.
  * **bootstrap.system_tools**: Critical logic required for the engine to operate.
  * **bootstrap.template_tools**: Logic used to render UI.
  * **sequence**: The chronological order of function execution.
