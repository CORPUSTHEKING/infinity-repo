
Global Logging Configuration — CONSTANTS_CAUTION/logging.conf

> Summary: Initializes a per-tool hierarchical logging filesystem, derives the executing script identity and timestamp, creates primary, error, and development log directories, and exposes timestamped log-file paths for downstream commands.



1. Purpose and scope

CONSTANTS_CAUTION/logging.conf is a sourceable Bash configuration fragment for establishing logging infrastructure.

It centralizes:

the global log root;

script identity;

date/time components;

per-script directory structure;

primary log location;

error log location;

development log location.


It also creates the directories and empty files required by the resulting paths.

2. Intended usage

The configuration is intended to be sourced by scripts:

source /data/data/com.termux/files/home/.tools/tools/etc/log/logging.conf

After sourcing, the caller can use:

$TOOLS_LOG
$SCRIPT_NAME
$CURRENT_DATE
$_TS
$BASE_DIR
$PRIMARY_DIR
$ERR_DIR
$DEV_DIR
$LOG_FILE
$ERR_FILE
$DEV_FILE

3. File characteristics

Property	Value

File type	Bash source fragment
Primary purpose	Logging infrastructure initialization
Network access	None
Database access	None
User interaction	None
Filesystem writes	Yes
Directories created	Yes
Files created	Yes
Privilege requirement	User permissions sufficient for the configured log root


4. Global log root

The file sets:

export TOOLS_LOG="/data/data/com.termux/files/home/.tools/tools/log"

All generated logging paths derive from this location.

The value is absolute and Termux-specific.

5. Script identity

The file uses:

SCRIPT_NAME="${SCRIPT_NAME:-$(basename "${0%.*}")}"

The rule is:

1. preserve an already-defined non-empty SCRIPT_NAME;


2. otherwise derive one from $0;


3. strip the final extension from $0;


4. extract the basename.



This permits an invoking script to explicitly define a stable identity before sourcing the configuration.

6. Time model

The file creates:

CURRENT_DATE=$(date +%Y/%m/%d/%H)
_TS=$(date +%H%M%S)

CURRENT_DATE

The value follows:

YYYY/MM/DD/HH

Example:

2026/10/07/16

The hour is therefore part of the directory hierarchy.

_TS

The timestamp follows:

HHMMSS

Example:

165307

It is used as the leading component of generated filenames.

7. Directory hierarchy

The configuration creates three functional paths.

Primary

$TOOLS_LOG/$SCRIPT_NAME/log/$CURRENT_DATE

Error

$TOOLS_LOG/$SCRIPT_NAME/errors/$CURRENT_DATE

Development

$TOOLS_LOG/$SCRIPT_NAME/dev/$CURRENT_DATE

The resulting hierarchy is conceptually:

<TOOLS_LOG>/
└── <SCRIPT_NAME>/
    ├── log/
    │   └── YYYY/MM/DD/HH/
    ├── errors/
    │   └── YYYY/MM/DD/HH/
    └── dev/
        └── YYYY/MM/DD/HH/

8. Infrastructure creation

The command:

mkdir -p "$PRIMARY_DIR" "$ERR_DIR" "$DEV_DIR"

creates all three directories if necessary.

-p permits creation of missing parent directories and avoids failure solely because a directory already exists.

9. File naming policy

The configuration creates:

HHMMSS-SCRIPT_NAME.log
HHMMSS-error.md
HHMMSS-dev.md

through:

LOG_FILE="$PRIMARY_DIR/${_TS}-${SCRIPT_NAME}.log"
ERR_FILE="$ERR_DIR/${_TS}-error.md"
DEV_FILE="$DEV_DIR/${_TS}-dev.md"

It then ensures their existence with:

touch "$LOG_FILE" "$ERR_FILE" "$DEV_FILE"

10. Export semantics

Only TOOLS_LOG is explicitly exported.

The other variables are ordinary shell variables in the current shell unless separately exported elsewhere.

Therefore:

current-shell scripts can use all of them;

child processes inherit only variables that have been exported.


This distinction matters when downstream commands are expected to access the variables through their environment rather than shell expansion.

11. Collision considerations

The timestamp granularity is one second.

Therefore multiple invocations of the same script in the same second can calculate identical paths.

For example:

165307-script.log
165307-error.md
165307-dev.md

can be shared by concurrent or rapid invocations.

touch does not create unique filenames and therefore does not prevent this collision.

Applications requiring concurrency-safe logging should use a higher-resolution timestamp, process identifier, transaction identifier, or another uniqueness mechanism.

12. Initialization semantics

The configuration automatically creates files at source time.

This means that merely sourcing logging.conf has a filesystem side effect even if the consuming script subsequently produces no log output.

13. Error visibility

logging.conf itself does not redirect process output.

The comment at the end demonstrates a possible pattern:

cmd >> "$DEV_FILE" 2>&1

That example sends standard output and standard error from the specified command into the development log.

The configuration does not automatically capture every command executed by the caller.

14. Dependencies

Dependency	Use

Bash	Variable expansion and command substitution
basename	Deriving fallback script identity
date	Timestamp generation
mkdir	Directory creation
touch	Log-file initialization
Writable log root	Required for successful creation


15. Failure modes

Typical operational failures include:

Condition	Result

Log root not writable	Directory/file creation fails
Invalid SCRIPT_NAME	Unexpected directory/file naming
Missing date command	Timestamp generation fails
Missing basename command	Fallback identity generation fails
Concurrent execution within the same second	Log-file path collision
Unexpected $0 value	Fallback script identity may be surprising


16. Security considerations

Log files can contain sensitive operational information when callers redirect complete command output into them.

The configuration itself does not enforce file permissions beyond the operating system's default creation policy.

The log root should therefore be protected according to the sensitivity of the data written there.

17. Auditability

The path structure supports chronological and per-tool auditing:

tool → log class → date → hour → timestamped file

This makes it suitable for operational investigation, debugging, and historical review.

18. Portability

The implementation is strongly tied to Unix-like shell environments and the supplied Termux path.

The logical model is portable, but the absolute path:

/data/data/com.termux/files/home/.tools/tools/log

must be changed for other operating environments.

19. Maintenance requirements

Changes should preserve:

the uniqueness of variable names;

the relationship between SCRIPT_NAME and BASE_DIR;

timestamp compatibility with chronological sorting;

directory separation between log, error, and development output;

writable permissions for the log root.


20. Operational summary

logging.conf is a logging bootstrap layer. It does not implement application-level logging itself; instead, it establishes deterministic locations and filenames into which other scripts may record operational output. 
