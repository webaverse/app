# Totum

## Overview

This library lets you compile a URL (https://, ethereum://, and more) into a THREE.js app representing it, written against the Metaversefile API. 

You can use this library to translate your avatars, models, NFTs, web pages (and more) into a collection of `import()`-able little web apps that interoperate with each other.

Totum is intended to be driven by a server framework (like vite.js/rollup.js), and game engine client (like Webaverse) to provide a complete immersive world (or metaverse) to the user.

It is easy to define your own data types and token interpretations by writing your own app template. If you would like to support a new file format or Ethereum Token, we would appreciate a PR.

Although this library does not provide game engine facilities, the API is designed to be easy to hook into game engines, and to be easy to drive using AIs like OpenAI's Codex.

---

## Usage

```js

	let  object;
	try {
		object = await  metaversefileApi.load(url);
	} catch (err) {
		console.warn(err);
	}
	return  object;

```

### Inputs 
* url: {URL of the asset that can be downloadable by the screenshot system} **[Required]**

### Returns 
* Promise: 

### Output
* Object of application

### Supported Assets 
* `VRM`
* `VOX`
* `JS`
* `SCN`
* `IMAGE`
* `HTML`
* `GLB`
* `GIF`

## Motivations

- A system which takes any URL (or token) and manifests it as an object in a 3D MMO
- Totum transmutes data on the backend, serving composable little WASM+JS apps your browser can import()
- Object description language (`.metaversefile`) to declare game presentation. Sword? Wearable loot? Pet is aggro? Think CSS/JSON for the metaverse.
- Totum works completely permissionlessly. It provides a virtual lens into data, and you control the lens.
- Totum supports declaring per-object components, which can have gameplay effects
- Pure open source web tech
- Moddable; make your metaverse look and work the way you want
- Totum integrates into game engines, which provide the game.
- Totum works with 2D ($1K jpg) and 3D ($15K fbx) assets.
- Totum accepts PRs to improve the resolution of the metaverse
- It's called Totum because it snaps together your objects into a total experience

---
## Architecture

### Flow Diagram

![Totum diagram 02](https://user-images.githubusercontent.com/51108458/144339720-354aa56d-aa61-4e96-b49c-bf9e652d1f48.png)



---
