
Global Termux Environment — CONSTANTS_CAUTION/env.global

> Summary: Defines and exports the canonical Termux development environment, Android SDK/NDK locations, tool paths, locale settings, compiler optimization flags, CupidKE PostgreSQL connection variables, shared-storage location, and optional startup integrations.



1. Purpose and scope

CONSTANTS_CAUTION/env.global is the primary shared shell environment configuration for the user's Termux tooling.

It is intended to be sourced by scripts and interactive shells that require a predictable development environment.

The file establishes:

Android SDK and NDK locations;

canonical tool directories;

executable search paths;

locale settings;

shared Android storage location;

architecture-specific compiler flags;

PostgreSQL connection defaults for CupidKE;

optional auxiliary tooling initialization;

Git filesystem-discovery behavior.


2. File characteristics

Property	Value

File type	Sourceable Bash environment configuration
Intended platform	Termux on Android
Primary consumer	Bash and child processes
Primary side effect	Environment mutation
Filesystem writes	Potentially performed by sourced helper commands
Network access	Not directly performed by assignments
Database connection	Not directly opened by the configuration
User interaction	None inherent to the assignments
Privilege requirement	Normal Termux user privileges are sufficient


3. Required base variables

The file refers to variables that must already exist when it is evaluated.

In particular:

TOOLS_ROOT
PREFIX
HOME
PATH

PREFIX and HOME are normally provided by Termux.

TOOLS_ROOT must already be defined unless an upstream configuration establishes it.

Because this file uses ordinary expansion rather than strict-mode validation, an absent TOOLS_ROOT can result in incomplete derived paths rather than an explicit configuration error.

4. Android SDK configuration

The file defines:

export ANDROID_SDK_ROOT="$TOOLS_ROOT/android/sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"

ANDROID_SDK_ROOT is the canonical SDK location.

ANDROID_HOME is assigned the same path for compatibility with tooling that still reads that environment variable.

The configuration therefore establishes a single SDK root:

$TOOLS_ROOT/android/sdk

5. Android NDK configuration

The NDK path is explicitly defined as:

export ANDROID_NDK="$PREFIX/share/android-ndk-r27b"

This binds the environment to the installed android-ndk-r27b directory under the active Termux prefix.

Changing the installed NDK revision requires updating this value or providing an alternate environment override before sourcing.

6. Tool directory hierarchy

The file defines:

export TOOLS_BIN="$TOOLS_ROOT/bin"
export TOOLS_LIB="$TOOLS_ROOT/lib"
export TOOLS_CONF="$TOOLS_ROOT/config"

These variables define the primary local tools hierarchy.

Variable	Intended role

TOOLS_BIN	Executable scripts and utilities
TOOLS_LIB	Supporting libraries/data
TOOLS_CONF	Configuration files


The configuration assumes this directory convention remains stable.

7. PATH construction

The file prepends:

$TOOLS_BIN
$HOME/.cargo/bin
$ANDROID_SDK_ROOT/platform-tools
$ANDROID_SDK_ROOT/cmdline-tools/latest/bin

before the existing PATH.

The effective construction is:

export PATH="$TOOLS_BIN:$HOME/.cargo/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"

Ordering is significant.

Earlier directories take precedence over later directories when the shell searches for executables.

This can intentionally prioritize user-managed tooling over system-provided alternatives.

8. Locale configuration

The file defines:

export LC_ALL=C.UTF-8
export LANG=C.UTF-8

This establishes a UTF-8 locale based on the C locale semantics.

The configuration therefore aims to provide predictable command behavior together with UTF-8 support.

Not every installed environment is guaranteed to provide C.UTF-8. Consumers should verify locale availability on the target system when portability outside the intended Termux environment is required.

9. Shared Android storage

The variable:

export SHARED="/data/data/com.termux/files/home/storage/shared"

defines the Termux-side path used to access shared Android storage after Termux storage integration has been configured.

The value is an absolute filesystem path.

It is not dynamically derived from $HOME, so relocation of the Termux home directory would require explicit modification.

10. Compiler optimization settings

The file defines:

export CFLAGS="-O3 -march=armv8-a+crc+crypto -mtune=cortex-a55"
export CXXFLAGS="$CFLAGS"
export RUSTFLAGS="-C target-cpu=native -C opt-level=3"

C/C++

The C compiler flags request:

high optimization through -O3;

ARMv8-A ISA targeting;

CRC and cryptographic instruction support;

tuning for Cortex-A55.


CXXFLAGS inherits the exact same value.

Rust

The Rust flags request:

native target CPU selection;

optimization level 3.


These settings are optimization policy rather than functional requirements.

They may reduce portability when artifacts are intended for other CPU architectures or microarchitectures.

11. PostgreSQL defaults

The file defines:

export PGHOST=127.0.0.1
export PGPORT=5432
export PGDATABASE=cupidke
export PGUSER=u0_a1396

These variables are standard PostgreSQL client environment variables.

They define the default connection target for PostgreSQL-aware tooling.

Variable	Current value	Meaning

PGHOST	127.0.0.1	PostgreSQL network endpoint
PGPORT	5432	PostgreSQL TCP port
PGDATABASE	cupidke	Default database
PGUSER	u0_a1396	Default PostgreSQL role/user


No password is defined here.

If password authentication is required, credentials must be supplied through an appropriate credential mechanism rather than hard-coded into this file.

12. Auxiliary startup integrations

The file conditionally invokes:

[ -x "$TOOLS_BIN/detext-apply" ] && "$TOOLS_BIN/detext-apply"

This means detext-apply is executed only if the resolved path is executable.

It also conditionally sources:

"$HOME/detext"

when that file exists.

The file further conditionally sources:

"$TOOLS_ROOT/config/glow_completion.sh"

when present.

These operations are more than passive assignments: they execute or source additional shell content during environment initialization.

Therefore the effective behavior of env.global depends partly on these optional files.

13. Git configuration

The following variable is exported:

export GIT_DISCOVERY_ACROSS_FILESYSTEM=1

This enables Git's cross-filesystem repository discovery behavior when supported by the installed Git implementation.

It is intended to assist repository discovery in environments where Android/Termux storage boundaries are involved.

14. Execution model

The file is intended to be used through:

source /path/to/env.global

Sourcing is important because exported variables must be placed into the current shell environment.

Executing the file as an independent process would not propagate its environment changes back into the parent shell.

15. Side effects

Sourcing can:

overwrite existing environment variables;

prepend directories to PATH;

execute detext-apply if executable;

source $HOME/detext if present;

source glow_completion.sh if present;

alter Git behavior for descendant processes.


It does not intentionally create or delete files in the visible assignment portion of the file, although sourced helper files may perform arbitrary operations.

16. Dependencies

Dependency	Requirement

Bash-compatible shell	Required for the conditional/source syntax
Termux	Expected runtime environment
$TOOLS_ROOT	Required for derived tool paths
$PREFIX	Required for the Android NDK path
Android SDK	Required by tools consuming the exported SDK paths
Android NDK r27b	Required by builds using ANDROID_NDK
Rust/C/C++ toolchains	Required only for consumers of the compiler flags
PostgreSQL client/software	Required only by commands consuming the PG* variables
Optional detext-apply	Executed when present and executable
Optional detext	Sourced when present
Optional Glow completion	Sourced when present


17. Security considerations

This file should be treated as trusted executable configuration because it uses source and invokes additional scripts.

Do not place untrusted content at:

$TOOLS_ROOT/config/glow_completion.sh
$HOME/detext
$TOOLS_BIN/detext-apply

when this environment is sourced in a trusted context.

The PostgreSQL settings expose database names and local connection identity but do not include a password.

18. Portability limitations

This configuration is intentionally platform-specific.

It assumes:

Termux filesystem layout;

Android SDK/NDK layout;

ARMv8-A execution;

Cortex-A55 optimization as an appropriate target;

local PostgreSQL operation;

the specified tools directory hierarchy.


It should not be considered a portable global Unix environment file without adaptation.

19. Operational risks

Missing TOOLS_ROOT

Because TOOLS_ROOT is referenced directly, a missing value may generate paths such as:

/android/sdk
/bin
/lib
/config

depending on the environment.

This can be technically valid strings while being operationally incorrect.

Compiler portability

The following flags may produce binaries unsuitable for unrelated architectures:

-march=armv8-a+crc+crypto
-mtune=cortex-a55

Environment override

Existing values for ANDROID_HOME, PATH, PostgreSQL variables, locale variables, and compiler flags are replaced when this file is sourced.

20. Change control

Any change to this file should be evaluated against:

1. Termux startup behavior.


2. Android SDK/NDK availability.


3. command lookup ordering.


4. compiler portability.


5. PostgreSQL connectivity.


6. optional helper-script behavior.


7. child-process inheritance.



21. Operational summary

env.global is the canonical shared environment bootstrap for the supplied Termux tooling ecosystem. It establishes a reproducible toolchain-oriented shell environment while intentionally remaining platform-specific. 
