
Table-Markdown Rename Utility — renameback2md

> Summary: Initializes terminal/logging-related variables, displays a startup/usage interface, and renames every *.tables.md file in the current directory to the corresponding filename without the .tables component.



1. Purpose and scope

renameback2md is intended to normalize generated documentation filenames.

Its transformation is:

name.tables.md
      ↓
name.md

The rename operation is limited to files matching:

*.tables.md

in the current working directory.

It does not recurse into subdirectories.

2. Interpreter and initialization

The script begins with:

#!/usr/bin/env bash

and sources:

/data/data/com.termux/files/home/.tools/tools/etc/log/logging.conf

This imports the shared logging infrastructure.

However, the active rename operation does not directly use LOG_FILE, ERR_FILE, or DEV_FILE.

3. Terminal definitions

The script defines:

COLUMNS=$(tput cols)
BLUE="\033[1;34m"
GREEN="\033[1;32m"
RED="\033[1;31m"
BOLD="\033[1m"
NC="\033[0m"

These are intended as terminal formatting variables.

Variable	Intended role

COLUMNS	Current terminal column count
BLUE	Bold blue
GREEN	Bold green
RED	Bold red
BOLD	Bold formatting
NC	No-color/reset formatting


COLUMNS is assigned but not otherwise used by the current rename operation.

4. Script identity variables

The script contains:

SCRIPT_NAME="${SCRIPT_NAME:-$(basename "${0%.*}")}"

but later uses:

${SCRIPTNAME}

instead of:

${SCRIPT_NAME}

These are different variable names.

Unless SCRIPTNAME is provided externally, Bash expands it as an empty value in the current non-strict execution mode.

This is an implementation inconsistency and should be treated as a documentation-significant limitation.

5. Startup interface

The startup messages are:

echo -e "${BLUE}[SYSTEM]${NC} Initializing $LABEL..."
echo -ne "${GREEN}Processing:${NC}"${SCRIPTNAME}""

They are intended to provide terminal status output.

Because LABEL and SCRIPTNAME are derived using the inconsistent variable naming described above, the displayed identity may be incomplete.

6. Usage handling

The script checks:

if [[ "$1" == "-h" || -z "$1" ]]; then

Therefore it enters the usage branch when:

the first argument is -h; or

no first argument was supplied.


It then prints a usage line and explanatory text and exits successfully.

7. Usage syntax

The documented interface is conceptually:

renameback2md <directory>

However, the active rename command does not use the supplied directory argument.

The actual operation is still performed against the current working directory.

This creates a mismatch between the advertised interface and operational behavior.

8. Active rename transformation

The core operation is:

for f in *.tables.md; do
    mv -- "$f" "${f%.tables.md}.md"
done

The parameter expansion:

${f%.tables.md}

removes the shortest matching .tables.md suffix from the filename.

For example:

alpha.tables.md

becomes:

alpha

and the appended .md produces:

alpha.md

9. Scope

The glob:

*.tables.md

is evaluated only in the current directory.

Subdirectories are not recursively traversed.

Hidden filenames generally do not participate in a normal * match unless shell configuration explicitly changes glob behavior and the name meets the pattern.

10. Existing destination behavior

No destination preflight check is performed.

For example:

alpha.tables.md
alpha.md

may result in behavior determined by the installed mv implementation.

The script has no interactive confirmation and no explicit overwrite policy.

11. No-match behavior

If no file matches:

*.tables.md

the shell may preserve the literal pattern.

The script can consequently attempt to rename a non-existent file.

No nullglob safeguard is enabled.

12. Error handling

The script does not enable strict Bash mode.

Therefore rename failures do not automatically imply complete script termination.

Errors may be followed by further loop iterations.

13. Dependencies

Dependency	Purpose

Bash	Interpreter
logging.conf	Startup logging/configuration source
basename	Logging configuration fallback identity
date	Logging configuration
mkdir	Logging configuration
touch	Logging configuration
tput	Terminal width discovery
mv	Rename operation


14. Side effects

Sourcing the logging configuration creates logging directories/files.

Executing the rename loop changes filenames in the current directory.

Terminal formatting variables affect only generated display text.

15. Correctness limitations

The major implementation-level limitations are:

Issue	Effect

SCRIPT_NAME vs SCRIPTNAME mismatch	Startup labels may be blank
Advertised directory argument	Not actually used for the rename
No recursion	Subdirectories are ignored
No collision preflight	Destination conflicts are not explicitly managed
No-match glob handling	Literal-pattern failure is possible
No strict mode	Errors do not automatically terminate execution
No dry run	Rename effects occur immediately
No rollback	No automatic restoration mechanism


16. Operational summary

renameback2md is best understood as a current-directory filename-normalization tool with an inherited logging bootstrap and a partially inconsistent user interface. 
