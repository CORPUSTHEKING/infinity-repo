
Batch Rename to Markdown — TEMPLATES/renamd

> Summary: Iterates over non-directory entries in the current working directory and renames each selected entry by appending the .md suffix.



1. Purpose and scope

renamd is a minimal batch-renaming utility intended for directories whose files are to be given Markdown filename extensions.

Its transformation is:

original-name
      ↓
original-name.md

It does not inspect file content and does not verify whether an existing name is already a Markdown document.

2. Interface

The script has no formal command-line argument interface.

Execution is implicitly against the current working directory:

./renamd

The active working directory therefore determines the scope of the operation.

3. Selection rule

The script uses:

for file in *; do

The * glob selects non-hidden directory entries according to normal Bash pathname expansion.

Consequently:

hidden entries such as .config are not selected;

regular files are selected;

directories are initially selected but immediately skipped;

other filesystem object types may also be selected.


4. Directory exclusion

The statement:

[[ -d "$file" ]] && continue

skips directory entries.

The script therefore does not intentionally rename directories.

A symlink to a directory may also satisfy the directory test depending on filesystem and shell semantics and can consequently be skipped.

5. Rename operation

The active transformation is:

mv "$file" "${file}.md"

The output name is formed by literal suffix concatenation.

Examples:

report.txt        → report.txt.md
notes             → notes.md
archive.tar.gz    → archive.tar.gz.md

The script does not replace an existing extension.

6. Existing Markdown suffixes

A file already ending in .md becomes:

example.md

→

example.md.md

The script therefore is not idempotent.

Repeated execution can continue to append additional .md suffixes.

7. Hidden files

Because the script uses the standard * glob, hidden files are not selected.

Examples:

.notes
.gitignore
.config

are excluded from normal expansion.

8. Empty directory behavior

When no visible entries match *, Bash normally leaves the literal pattern unchanged unless nullglob has been enabled.

The loop can therefore receive:

*

as a literal item.

The script may subsequently attempt an invalid rename.

This edge case depends on the shell's glob configuration.

9. Name collision behavior

The script performs no explicit destination existence check.

If:

foo
foo.md

both exist, the rename:

mv "foo" "foo.md"

can result in overwrite, refusal, prompting, or another implementation-specific behavior according to the installed mv utility and its invocation environment.

No collision policy is implemented by the script itself.

10. Error handling

The script does not enable:

set -e
set -u
set -o pipefail

Therefore a failed mv does not automatically terminate the entire script.

The loop can continue processing later entries.

11. Dependencies

Dependency	Requirement

Bash	Interpreter and glob/conditional syntax
mv	Rename operation
Writable current directory	Required for successful rename
Appropriate filesystem permissions	Required for source/destination changes


12. Side effects

The script changes filenames in the current working directory.

This is a destructive namespace operation in the sense that the original filenames are replaced by new names.

The file contents are not intentionally modified.

No backup is created.

13. Safety considerations

Before execution, the operator should verify the current working directory:

pwd

and inspect the target set.

The script should not be run blindly in a directory containing mixed-purpose files unless adding .md to every visible non-directory entry is explicitly intended.

14. Portability

The use of:

[[ ... ]]

makes Bash the appropriate interpreter.

The general rename concept is portable across Unix-like filesystems, but filename behavior can still depend on filesystem semantics.

15. Operational summary

renamd is deliberately simple and fast, but it has no collision prevention, extension detection, dry-run mode, confirmation, recursion, or rollback mechanism. 
