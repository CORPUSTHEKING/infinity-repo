A shell script that appends text to a chosen file. It gets the target from the first argument, falls back to a file picker or manual input, then appends everything typed from standard input into that file.

Line / fragment	Reason	Description

| Column 1 | Column 2 | Column 3 |
|--------|--------|--------|
| #!/bin/bash | Interpreter selection | Shebang. Tells the OS to run the script with Bash. #! marks the interpreter directive; /bin/bash is the program used. |
| source "$TOOLS_ROOT/env.global" | Load shared environment | Sources a configuration file into the current shell so variables, functions, and paths defined there become available here. source executes the file in the current shell process. |
| source | Built-in command | Reads and executes another file in the current shell instead of starting a new process. |
| "$TOOLS_ROOT/env.global" | Config path | File path built from the TOOLS_ROOT variable. Quoted to preserve spaces and special characters. |
| # 1. Determine the filename | Comment | Ignored by Bash. Section label describing the first phase of the script. |
| TARGET_FILE="$1" | Argument capture | Stores the first command-line argument into TARGET_FILE. If the user supplied a filename, this becomes the initial target. |
| TARGET_FILE | Variable | Holds the path of the file to append to. |
| "$1" | Positional parameter | The first argument passed to the script. Quoted for safety. |
| if [ -z "$TARGET_FILE" ]; then | Empty-check branch | Starts a conditional that checks whether TARGET_FILE is empty. If it is empty, the script will try to choose a file interactively. |
| [ | Test command | POSIX shell test built-in/utility syntax used for conditions. |
| -z | Empty string test | Returns true when the string length is zero. |
| "$TARGET_FILE" | Tested value | The current target file value. Quoted to avoid splitting and globbing. |
| then | Branch start | Begins the code block executed when the condition is true. |
| # Filter out common permission-denied areas to avoid "No removable volumes" spam | Comment | Explains the reason for the fallback file search. Ignored by Bash. |
| `TARGET_FILE=$(find . -maxdepth 1 -not -path '/.' 2>/dev/stdout | fzf --prompt="Select file: ")` | Interactive file selection |
| $(...) | Command substitution | Runs the enclosed pipeline and captures its output as text. |
| find . | File search | Searches from the current directory. . means the current working directory. |
| -maxdepth 1 | Depth limit | Limits find to the current directory level only. |
| -not -path '*/.*' | Hidden-path filter | Excludes paths containing hidden names beginning with a dot. |
| '*/.*' | Single-quoted glob pattern | Literal pattern passed to find without shell expansion. Single quotes prevent the shell from interpreting the *. |
| 2>/dev/stdout | Error redirection | Redirects standard error to standard output so fzf receives the list without terminal noise. |
| 2 | stderr file descriptor | Standard error stream. |
| > | Redirection operator | Sends output to a file descriptor or file. |
| /dev/stdout | Output device | Pseudofile representing standard output. |
| ` | ` | Pipe |
| fzf | External command | Fuzzy finder used for interactive selection from a list. |
| --prompt="Select file: " | Fzf option | Sets the visible prompt text shown inside the picker. |
| " | Double quotes | Preserve spaces and allow variable/escape expansion where applicable. |
| fi | End conditional | Closes the if block. |
| if [ -z "$TARGET_FILE" ]; then | Second fallback branch | Checks again whether a file was selected or supplied. If still empty, the script asks the user to type a filename manually. |
| read -p "Enter filename: " TARGET_FILE | Manual input fallback | Prompts the user to type a filename and stores it in TARGET_FILE. |
| read | Built-in command | Reads a line from standard input into a variable. |
| -p | Prompt option | Prints the prompt before waiting for input. |
| "Enter filename: " | Prompt text | Message shown to the user for manual entry. |
| # Final check | Comment | Marks the last validation step before writing. |
| if [ -z "$TARGET_FILE" ]; then | Validation check | Ensures a target file exists before proceeding. If still empty, the script aborts. |
| echo "Usage: catappend [filename]" | Usage message | Prints the expected command form when no filename is available. |
| exit 1 | Failure exit | Stops the script with a non-zero status to indicate an error. |
| # 2. Capture and Append | Comment | Section label for the writing phase. |
| echo "Type your content below. Press Enter then Ctrl+D to save." | User instruction | Tells the user how to enter content and how to finish input. |
| echo "------------------------------------------------------" | Separator line | Prints a visual divider. |
| # We use cat to capture stdin directly into the target file via append | Comment | Explains the append mechanism. Ignored by Bash. |
| cat >> "$TARGET_FILE" << INNER_EOF | Here-document append setup | Opens a here-document whose contents will be appended to TARGET_FILE. >> means append, not overwrite. << INNER_EOF starts a heredoc that ends at the line containing INNER_EOF. |
| cat | External command | Reads from standard input and outputs it unchanged. Here it is used inside command substitution to capture everything typed by the user. |
| >> | Append redirection | Appends output to the target file instead of replacing it. |
| "$TARGET_FILE" | Output path | The file that will receive the appended text. Quoted to preserve spaces and special characters. |
| << | Here-document introducer | Starts a multi-line literal input block for the command. |
| INNER_EOF | Heredoc delimiter | Marker that ends the here-document. Must appear alone on its own line. |
| $(cat) | Command substitution inside heredoc | Captures everything typed on standard input until the heredoc is terminated, then injects that text into the append stream. |
| INNER_EOF | End marker | Closes the heredoc. |
| echo "---" | Completion separator | Prints a short divider after writing is done. |
| echo "Done. Appended to $TARGET_FILE." | Success message | Confirms that the text was appended and reports the target file path. |


Dependencies

Dependency	Reason	Description

| Column 1 | Column 2 | Column 3 |
|--------|--------|--------|
| bash | Script interpreter | Required to run source, [[...]]-style shell behavior, command substitution, and here-doc syntax as written. |
| TOOLS_ROOT | Environment variable | Must be defined by env.global or the script cannot locate "$TOOLS_ROOT/env.global". |
| env.global | Shared config file | Provides environment setup needed before the script continues. |
| find | File search utility | Used to enumerate candidate files in the current directory. |
| fzf | Interactive selector | Provides the file picker fallback when no filename is passed. |
| cat | Input capture command | Used to read user-entered content from standard input. |
| read | Shell built-in | Used for the manual filename fallback. |
| Standard streams | I/O mechanism | The script depends on stdin for user content and on stdout/stderr for prompts, messages, and redirection. |


Key behavior notes

Behavior	Description

| Column 1 | Column 2 | Column 3 |
|--------|--------|--------|
| First argument wins | If a filename is passed as $1, it is used first. |  |
| Interactive fallback | If no filename is passed, the script tries `find |  |
| Manual fallback | If selection fails, the script asks for a filename directly. |  |
| Final guard | The script exits with usage text if no target file is available. |  |
| Append mode | Existing file contents are preserved; new text is added to the end. |  |
| Heredoc capture | The user’s typed content is collected and appended as a block. |  |
| Ctrl+D finish | End-of-input is signaled by EOF on stdin. |  |
| Hidden files excluded in picker | find ignores dot-paths because of -not -path '*/.*'. |  |
