
Hardcoded Markdown Table Converter — tables.hardcoded.py

> Summary: Converts aligned plain-text blocks that resemble tabular data into GitHub/Markdown-compatible tables, preserves non-table text, recognizes selected headings, supports file/directory/stdin operation, and writes converted output either to stdout or .tables.md files.



1. Purpose and scope

tables.hardcoded.py is a Python text-conversion utility designed for documentation cleanup.

Its primary purpose is to transform text that uses:

pipes;

tabs;

multiple spaces;


as implicit table separators into explicit Markdown table syntax.

It also attempts to preserve headings and non-table text instead of converting every block indiscriminately.

2. Interface

Command-line syntax

tables.hardcoded.py [path] [-o OUTPUT]

Positional path

path may be:

omitted;

a file;

a directory.


When omitted, the script reads standard input.

Output option

-o OUTPUT
--output OUTPUT

is accepted when processing a single file.

3. Dependencies

Dependency	Requirement

Python	3.10+ for `Path
argparse	Standard-library argument parser
re	Standard-library regular expressions
sys	Standard-library stream handling
pathlib	Standard-library filesystem abstraction


No external Python package is required by the supplied implementation.

4. Character encoding

Input and output files are handled explicitly as:

UTF-8

through:

path.read_text(encoding="utf-8")
path.write_text(converted, encoding="utf-8")

This makes the expected file encoding unambiguous.

5. Table separator detection

The script defines:

COL_SPLIT_RE = re.compile(r"\t| {3,}")

This treats either:

one or more tab characters;

three or more consecutive spaces;


as column separators.

The three-space threshold is deliberately used to reduce accidental splitting of ordinary prose or code fragments.

6. Markdown separator-row recognition

The script defines:

SEP_ROW_RE = re.compile(r"^\s*\|?[-:\s|]+\|?\s*$")

This detects rows consisting primarily of:

hyphens;

colons;

whitespace;

pipe characters.


Such lines are treated as Markdown table separator rows and are not retained as ordinary input rows.

7. Header detection hints

The following values are treated as evidence that a row is a table header:

Reason
Meaning
What happens
What it does here
Description
Effect
Explanation

Header recognition is therefore heuristic rather than schema-driven.

8. Section-title detection

A line is treated as a heading when it matches one of the configured section names or a heading-like pattern.

Recognized explicit section names include:

Symbol and syntax table
Line-by-line execution flow
Important behavior details
Execution flow

Markdown headings beginning with # are also preserved.

A bare filename ending in .md is also recognized as a heading-like line.

9. Pipe-row parsing

parse_pipe_row() expects a line that:

1. begins with |;


2. ends with |;


3. contains at least two columns.



The line between the outer pipes is split on literal | characters.

This parser is therefore suitable for ordinary Markdown-like rows.

It can be problematic where a cell legitimately contains an unescaped pipe character.

10. Plain aligned-row parsing

parse_plain_row() is used for non-pipe rows.

It first rejects:

blank lines;

separator rows.


It then uses the configured regular expression to split tabs or runs of three or more spaces.

Only blocks producing at least two resulting fields are treated as table-like.

11. Row normalization

normalize_row() performs three operations:

1. attempt pipe-row parsing;


2. otherwise attempt aligned-text parsing;


3. normalize the result to a stable three-column representation where possible.



When more than three columns are detected, columns after the second are merged into the third cell.

When fewer than three columns exist, empty fields are appended.

This is a deliberate normalization policy rather than a general-purpose arbitrary-width table model.

12. Markdown escaping

The function:

escape_md(cell)

escapes:

\
|

to reduce accidental Markdown structure changes inside generated cells.

Leading and trailing whitespace is also stripped.

13. Table rendering

render_table() uses the first row as the header when header hints indicate that it is a header.

Otherwise it creates generic headers:

Column 1
Column 2
Column 3

The generated structure is:

| Header 1 | Header 2 | Header 3 |
|---|---|---|
| Data | Data | Data |

14. Block-oriented processing

The converter operates on blocks separated by blank lines.

Conceptually:

non-empty lines
      ↓
table/heading detection
      ↓
blank line
      ↓
next block

This means two tabular regions separated by blank lines are processed independently.

15. Non-table preservation

If a block does not contain at least two recognizable table rows, the original block is preserved rather than converted.

This prevents every paragraph from being transformed into a table.

16. File processing modes

16.1 Standard input

When no path is supplied:

sys.stdout.write(convert_text(sys.stdin.read()))

The script reads from stdin and writes converted text to stdout.

No automatic file is created in this mode.

16.2 Single file

When a file path is supplied, it is converted and written to:

<input stem>.tables.md

unless -o/--output is supplied.

Example:

notes.md

becomes:

notes.tables.md

16.3 Explicit output

For a single file:

python3 tables.hardcoded.py notes.md -o converted.md

writes to the requested output path.

16.4 Directory

When a directory is supplied, the script processes:

sorted(p.glob("*.md"))

and creates a .tables.md file for each Markdown file.

17. Directory-processing recursion risk

The directory mode uses:

p.glob("*.md")

and therefore includes files that already end in .tables.md.

A repeated execution can consequently process generated outputs as new inputs and create names such as:

notes.tables.md
notes.tables.tables.md

This behavior is a significant operational limitation of the current implementation.

18. Output path policy

The helper:

output_path_for(input_path)

constructs:

<input stem>.tables.md

using the input file's stem.

This strips the final suffix only.

For example:

archive.tar.md

has a stem of:

archive.tar

and therefore produces:

archive.tar.tables.md

19. Error handling

For an unsupported filesystem path:

raise SystemExit("Path Error")

The process terminates with a non-zero status and emits the supplied message according to normal Python SystemExit behavior.

No custom exception hierarchy is implemented.

20. CLI argument behavior

argparse handles malformed options, missing option arguments, and help output.

The positional path is optional.

The -o/--output parameter is intended for single-file processing and has no special protection against being supplied in directory mode.

21. Examples

Convert stdin

cat source.md | python3 tables.hardcoded.py > converted.md

Convert one file

python3 tables.hardcoded.py source.md

Result:

source.tables.md

Convert to a specified output

python3 tables.hardcoded.py source.md --output documentation.md

Convert every Markdown file in a directory

python3 tables.hardcoded.py docs/

22. Correctness limitations

The implementation is heuristic.

Important cases requiring attention include:

Condition	Potential effect

Literal `	` inside content
Two-space alignment	Not treated as a separator
More than three columns	Columns beyond the second are merged into column three
Weak header semantics	Generic headers may be generated
Heading-like filename lines	May be promoted unexpectedly
Generated .tables.md files	May be reprocessed on later directory runs
Complex Markdown	May not preserve all Markdown semantics
Embedded code containing aligned spaces	May be classified as a table
Irregular rows	Normalization may introduce empty columns


23. Security considerations

The script processes text as data and does not execute the input as Python or shell code.

Nevertheless:

output filenames are derived from filesystem paths;

files are overwritten when the target path resolves to an existing file;

directory-wide processing can affect many documents.


Operators should verify input/output paths before batch conversion.

24. Performance considerations

Processing is fundamentally linear with respect to the amount of input text for ordinary cases.

Directory mode additionally performs one conversion for every matched Markdown file.

Very large documents are read into memory as complete strings:

text = path.read_text(...)

The implementation is therefore not a streaming converter for file inputs.

25. Maintenance requirements

Changes to parsing logic should preserve:

1. UTF-8 handling;


2. blank-line block semantics;


3. Markdown escaping;


4. stable table width behavior;


5. deterministic directory ordering;


6. explicit output naming.



Tests should include:

pipe tables;

tab-separated tables;

three-space-separated tables;

paragraphs;

headings;

separator rows;

embedded pipe characters;

filenames containing multiple suffixes;

repeated directory execution.


26. Operational summary

tables.hardcoded.py is a heuristic documentation-normalization utility rather than a full Markdown parser. It is effective for the aligned documentation format represented by the supplied source material, but it should not be treated as a general Markdown AST converter. 
