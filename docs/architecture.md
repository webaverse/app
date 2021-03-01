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

### Mithril

Mithril is a component-based frontend library. Documentation and best-practices can be found [here](https://mithril.js.org).

#### Organization

The UI code lives in `/ui`.

* Components are organized under `/ui/components`.

* Pages are organized under `/ui/pages`.

* Layouts are organized under `/ui/layouts`.

* Shared models are kept in `/ui/models`.

* Styles are imported hierarchically from `/ui/style.css`. Theming and global variables are defined in the root scope of this document.

* Individual stylesheets are kept in their corresponding component's directory.

Layouts are components which behave as frames and contain pages.  
Pages are components that are meant to be displayed one at a time, and are comprised of child components.  
Components are basic reusable mithril components. They can be grouped under directories containing similar components.

#### Style

* Closure component syntax is used for components.

* Styles are scoped using a modified [BEM](https://getbem.com/introduction/) syntax.

* A style object is used to map selector tags to shorthand property names in order to keep code concise and separate CSS structure from local component structure.

### Code Map

[`/lib`](./lib)  
Libraries and packages. External packages are served from `/lib/external`.

[`/scripts`](./scripts)  
Locally-run scripts for development purposes.

[`/tests`](./tests)  
Test directory for library and frontend code.

[`/ui`](./ui)  
Mithril UI components.
