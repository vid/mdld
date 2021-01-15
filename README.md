
This is a working PoC of using Markdown with versatile quads (subject, predicate, object, source).
Its working name is mdld,
and it's intended to enable using data in notes as a database.
It's based on ideas from Semantic Mediawiki and Linked Data, 
using minor changes to CodiMD 1.6 for all it offers (a lot!).

The work is mainly in the directory mdld, with very minor, 
encapsulated changes to the CodiMD code base (about ten lines of Javascript).

What does it add?

* Markdown can be used to create data, using the format `[tag:predicate](value)`
  * If no tag is used, the subject is the page, otherwise it's sort-of anonymous resource (in progress)
* the ability to organize notes by a path `[:path](/some/path/title)`
  * links are mapped to paths
* The ability to query data 
  * the query syntax is English-like
    * see mdld/src/finder.tests.ts for examples
  * currently, table, count, network graph, gantt chart, and summary output are supported
  * reusable concepts can also be created
  * this is especially useful for project-specific to-dos and definitions within a larger collection of notes
* The ability to search by quads, server text, and path elements using a hotkey or the document path

The quad "database" is in-memory, on the server and the browser, 
so it can only handle thousands of notes / quads without slowing down or exploding.
However, since it runs "alongside" CodiMD, the risk it will corrupt data is low.

As it is, I find it priceless for my own work, but there is lots more to do. 
I am hoping to adapt it to CodiMD 2, well, HedgeDoc, as it emerges.

Happy to hear from anyone interested. 
Thank you.

## Setup mdld

Check out this repo, cd to it, then;
```
$ npm install
$ cd mdld
$ npm install
$ npm run tsc-watch
```
in another terminal
```
$ npm test
```
