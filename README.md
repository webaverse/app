# App Quick Start Guide

## To Use

To clone and run App you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) v.17(which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone --recurse-submodules https://github.com/webaverse/app.git
# Go into the repository
cd app/
# Install dependencies
npm install
# Run the app
npm run dev
# Navigate to the URL mentioned in the terminal

```
:::caution Pay Attention
When cloning App from git, you must include the option **"--recurse-submodules"**. The App repo relies upon and imports other Webaverse repos that are vital to the functioning application.
:::

---

## Development Environment Setup

:::note IDEs

We prefer using [VSCode](https://code.visualstudio.com/download) for development, so the below notes reflect that toolset; however you should be able to adapt this guide to apply to any other IDEs.

:::


### Technologies

The App primarily uses the following technologies

* [NodeJS](https://nodejs.org/)
* [ThreeJS](https://threejs.org/)
* [ViteJS](https://vitejs.dev/)
* [ReactJS](https://reactjs.org/)

---

### Directory Structure

```bash
**Root**
│
├───src <--- React Application Resides Here
	├───Main.jsx <-- Rgisters the routes of the React App and Load Dom
	├───App.jsx <-- Loads Webaverse.js from Root directory
│
├─ index.js <-- This starts the vite server that serves the React App
│
├─ webaverse.js <-- This is the entry point of the Webaverse
│
├─ io-manager.js <-- Controls the input events within the application.
...
```

---

### Setup ESLint

* Within VSCode, go to your extensions tab and search for `ESLINT`

	![enter image description here](/img/VSCodeESLintSetup.png)

	OR From the command line:

	```bash
		npm install eslint -g
		eslint --init
	```

---

### Development Mode

The application uses vite to hot reload itself automatically if there are any changes to any files. To start the App in dev mode, run:

```bash
npm run dev
```
:::note 
Any changes inside the `packages` folder won't recompile automatically and so will require restarting the entire development server by just running again: `npm run dev`
:::

---


