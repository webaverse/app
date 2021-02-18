# Architecture

---

This document describes the basic architecture of the project in order to facilitate new contributions.

Architectural concepts and caveats which are not expected to change much should be added to this document. Ephemeral or evolving features should not be listed here.

---

### Overview

*TODO: High-level description of application.*

### Concepts

#### No build step

This app avoids a build step. This has architectual implications including:
   
* With few exceptions, external libraries are served locally from [`/lib`](./lib) and not bundled with npm.

### Code Map

[`/lib`](./lib)  
Library folder for locally served packages.

[`/ui`](./ui)  
Mithril UI components.
