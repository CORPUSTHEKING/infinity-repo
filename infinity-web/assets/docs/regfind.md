
Recursive Regex Finder — SYSTEM/regfind

> Summary: A Bash command-line utility that recursively searches a specified path for an extended regular expression using grep, ignores binary files, reports matching lines with filenames and line numbers, and defaults the search root to the current directory.



1. Purpose and scope

regfind provides a compact interface around recursive grep.

Its intended operation is:

regular expression + optional path
        ↓
recursive grep search
        ↓
filename + line number + matching line

The script is primarily intended for source-tree investigation, configuration discovery, and text searching.

2. Interface

Syntax

regfind <regex> [path]

Parameters

Parameter	Required	Meaning

<regex>	Yes	Extended regular expression passed directly to grep -E
[path]	No	Search root; defaults to .


3. Input validation

The script captures:

REGEX="$1"
SEARCH_PATH="${2:-.}"

If REGEX is empty, it prints:

Usage: regfind <regex> [path]

and exits with a failure status.

No explicit validation is performed on:

whether the search path exists;

whether the path is readable;

whether the regular expression is syntactically valid.


Those checks are delegated to grep.

4. Search command

The actual search operation is:

grep -rEnI "$REGEX" "$SEARCH_PATH" 2>/dev/null

The options mean:

Option	Meaning

-r	Recursive search
-E	Extended regular expression syntax
-n	Include line numbers
-I	Ignore binary files
"$REGEX"	User-supplied search expression
"$SEARCH_PATH"	Search root


5. Output format

Matching records are normally emitted in grep's standard form:

path/to/file:line-number:matching-line

For example:

src/config.sh:42:export DATABASE_URL=...

The script does not reformat or annotate matching results.

6. Regular-expression semantics

Because grep -E is used, the supplied expression is interpreted as an Extended Regular Expression.

Examples:

regfind 'TODO|FIXME'

regfind 'export [A-Z_]+='

regfind 'https?://'

The expression is passed as one shell argument when quoted by the user.

7. Search path behavior

When no second argument is supplied:

SEARCH_PATH="${2:-.}"

selects:

.

Therefore the search begins in the current working directory.

If a second path is supplied, that path replaces the default.

8. Binary-file handling

The -I option instructs grep not to treat binary files as ordinary searchable text.

This reduces noisy binary matches while retaining text-oriented recursive searching.

9. Error-stream behavior

The current implementation contains:

2>/dev/null

This redirects standard error to /dev/null.

Consequently, diagnostic messages from grep, including some permission, traversal, or input errors, are suppressed.

This is operationally important:

> A lack of visible diagnostics does not prove that the complete search succeeded.



For high-assurance auditing, callers should be aware that the present implementation intentionally masks grep diagnostics.

10. Exit status

The script does not explicitly normalize grep's exit status.

Therefore the final status generally reflects the grep invocation.

grep commonly distinguishes:

Status	Meaning

0	At least one match
1	No match
2 or another non-zero status	Error condition


Exact behavior depends on the installed grep implementation.

11. Dependencies

Dependency	Requirement

Bash	Script interpreter
grep	Search engine
Readable filesystem path	Search input
Valid ERE expression	Search pattern


No Python, Node.js, database, network, or external service is required.

12. Security considerations

The regular expression and path are supplied by the invoking user.

They are passed as quoted shell arguments, which avoids ordinary shell word splitting and pathname expansion at that stage.

The regex itself remains a search expression interpreted by grep; it is not shell code.

Nevertheless, recursive searches over sensitive trees can disclose confidential file contents to the terminal.

13. Performance considerations

Recursive grep performance depends on:

number of files;

directory depth;

filesystem speed;

pattern complexity;

number of readable text files.


Very broad searches from large roots may be expensive.

14. Limitations

The current implementation does not provide:

include/exclude globs;

case-insensitive mode;

fixed-string mode;

context lines;

result-only filenames;

colorized results;

explicit permission diagnostics;

symlink policy configuration;

maximum recursion depth;

configurable output format.


These remain grep-level or future wrapper responsibilities.

15. Examples

Search recursively for a literal project term:

regfind 'TOOLS_ROOT'

Search a particular tree:

regfind 'PGDATABASE' ~/projects

Search using an alternation:

regfind 'TODO|FIXME|XXX' .

Search for exported variables:

regfind 'export [A-Z_]+=' CONSTANTS_CAUTION

16. Operational summary

regfind is a thin recursive ERE search wrapper. Its primary design goal is convenience and concise invocation, while the underlying grep remains responsible for matching behavior and exit status. 
