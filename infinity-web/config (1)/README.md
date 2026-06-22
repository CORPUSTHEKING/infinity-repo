# 🧠 The Brain (/config/)
This directory contains the orchestration logic for the entire engine.

## Files
* **paths.json**: The Rosetta Stone. Every path in the project is mapped to a constant here. This allows you to move folders without breaking the JS logic.
* **manifest.json**: The Master Plan. It defines:
  * **env**: Global constants like the TARGET_NODE.
  * **bootstrap.system_tools**: Critical logic required for the engine to operate.
  * **bootstrap.template_tools**: Logic used to render UI.
  * **sequence**: The chronological order of function execution.

To add a new developer to the **Infinity Ghost Engine**, you don't touch the engine code or the HTML. You simply follow the "Ghost" protocol: **register the file** and **define the data**.
Here is the exact 3-step process.
### Step 1: Create the Data Payload
Create a new JSON file in your data directory (e.g., target_02.json). This file defines who the person is and which "Tool" should render them.
```bash
cat << 'EOF' > ./data/scripts/developer/target_02.json
{
  "meta": { 
    "action": "constructor" 
  },
  "props": {
    "title": "JANE DOE",
    "sub": "Nairobi, Kenya",
    "email": "jane.doe@example.com",
    "bg": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    "color": "linear-gradient(90deg, #11998e, #38ef7d)"
  }
}
EOF

```
### Step 2: Update the Directory Index
The iterator tool is blind; it cannot "see" files on your server. You must tell it that a new file exists by adding it to the list.json.
```bash
cat << 'EOF' > ./data/scripts/developer/list.json
[
  "target_01.json",
  "target_02.json"
]
EOF

```
### Step 3: Refresh
That’s it. When you refresh your browser:
 1. The **Engine** reads the **Manifest**.
 2. The **Manifest** triggers the **Iterator**.
 3. The **Iterator** reads list.json, sees the new target_02.json, and fetches it.
 4. The **Iterator** sees meta.action: "constructor" and passes the data to the **Constructor Tool**.
 5. Jane Doe appears on the screen.
### Why this works (The "Decoupled" Logic)
Because the engine is a "Ghost," it doesn't care if you have 1 developer or 1,000. It simply follows the trail of breadcrumbs left in the JSON files.
| Component | Role in adding a new person |
|---|---|
| **engine.js** | Does nothing (stays silent and ready). |
| **list.json** | Acts as the "Guest List" for the party. |
| **target_x.json** | Acts as the "Identity" of the guest. |
| **constructor.json** | Acts as the "Tailor" who dresses the guest in HTML. |
**Pro-Tip:** If you wanted Jane Doe to look completely different (e.g., a list item instead of a card), you would change her "action" to "list-renderer" and add a new tool to your payloads/TEMPLATES folder.

### 1. Will all targets be rendered on a single page?
**Yes**, by default.
The iterator.json tool is currently configured to loop through every file listed in list.json and append them to the #app-root element. Think of it like a continuous scroll or a gallery.
**How to change this:**
If you wanted separate pages (e.g., a "Profile" page vs. a "Directory" page), you would modify the **Manifest**. Instead of one iterator action, you would define a **Router Tool**. The Engine would then check the URL (e.g., index.html?user=target_01) and only fetch that specific JSON file instead of iterating through the whole list.
### 2. What if I'd like to change the layout?
You have two ways to change the layout, depending on whether you want a **global change** or a **specific change**.
#### A. Global Change (Change everyone's look)
If you want every developer card to look different (e.g., move the image to the left and text to the right), you edit **one file**:
 * **Modify:** ./assets/payloads/TEMPLATES/constructor.json
 * **Result:** Since every data payload points to constructor, updating the "body" of this tool instantly updates every card on the site simultaneously.
#### B. Specific Change (Different looks for different people)
If you want Mike to be a **Card** but Jane to be a **Simple List Item**, you decouple the logic:
 1. **Create a new Tool:** Save a new file at ./assets/payloads/TEMPLATES/list-renderer.json.
 2. **Update the Data:** In jane_doe.json, change the metadata:
   ```json
   "meta": { "action": "list-renderer" }
   
   ```
 3. **The Result:** When the Engine hits Mike, it uses the constructor logic. When it hits Jane, it switches to the list-renderer logic.
### Why this is powerful
In a traditional site, you’d have to write if/else statements or complex CSS classes. In the **Ghost Engine**, the layout is just another variable. The data *chooses* its own template, and the Engine simply executes whatever instructions it is given.

