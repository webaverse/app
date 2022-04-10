# Webaverse client app

Uses NodeJS, with vite.js on the backend, serving up index.js and index.html and other types of imports to the end-client. We also have [Totum](https://github.com/webaverse/Totum/) which accepts requests to decode or load various types of files and represent it as a javascript file, and [wsrtc](https://github.com/webaverse/wsrtc/) handling the multiplayer over websockets. Users can join rooms and share CRDT [z.js](https://github.com/webaverse/zjs) state data to one another across the network. Also utilised by wsrtc are web codecs used to perform voice encoding and decoding. 
Once the app is installed all you need to do is go to localhost:3000 to launch the client. ThreeJS is used as a Renderer, physx-wasm for physics calculations as well as VRM models for avatars.
   

## Client Quick Start

## To Use!


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
## Pay Attention
When cloning App from git, you must include the option **"--recurse-submodules"**. The App repo relies upon and imports other Webaverse repos that are vital to the functioning application.


---

## Development Environment Setup

###IDEs

We prefer using [VSCode](https://code.visualstudio.com/download) for development, so the below notes reflect that toolset; however you should be able to adapt this guide to apply to any other IDEs.




## Technologies

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

![VSCodeESLintSetup](https://user-images.githubusercontent.com/51108458/144331775-2f5363d9-8d3f-4120-bb22-3308047c5605.png)


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

---

### Multiplayer Development

#### zjs
zjs is a purpose-built clone of yjs for multiplayer realtime games. Most of the concepts and documentation for yjs applies, so please read before attempting to work on the multiplayer.

#### wsrtc
Actual socket communication is handled by wsrtc, another webaverse project, which moves app data and voice packets over websockets. zjs handles the data synchornizing of apps, while wsrtc handles the app networking.

#### Overview
The main entrypoint to the Webaverse app is the Webaverse class in webaverse.js -- this is where everything gets set up and the main loop starts.

The character controller.js file holds the LocalPlayer, RemotePlayer and their base classes. Everything related to character state, including transform, movement, actions, wearing, etc is here.

The actual visual avatar display is largely handled by the Avatars class in the avatars/avatars.js file. The character controller sets the velocity of it's avatar class instance, which then handles the animation state. On the local player, the avatar is updated in the main loop. On the remote player, the avatar class is updated when data is received from the network via observer function.

Player objects are held in the PlayersManager class in players-manager.js, this is initialized when the client connects to a room. The PlayersManager object is a zjs map of player objects which are also zjs maps. 

The AppManager class (app-manager.js) handles setting up, tearing down and updating apps. Apps can be avatars, wearables, buildings, anything that lives in the world with the player.

#### zjs document hierarchy

Z.Doc
- AppManager.appsArray -- all apps in the world
- PlayersManager.playersArray -- a list of all playerMap objects
-- CharacterController.playerMap -- all the data synced about the player, including playerId, apps and transform
-- CharacterController.avatarmap (getAvatarState) -- A map of avatar data 

MessageEvent class
MessageEvents are events which can be listened to
frame -- called by the app every time it updates (i.e. every frame)
trackedappadd -- a new instance of the app was created, this is called for all objects that are being tracked on the network
trackedappremove -- an app was removed, for example a player destroyed it
trackedappmigrate -- the app moved from one place to another, for example a player may have picked up an object

Here is an example of an app stored as a Z.Map
{
    "instanceId": "rum6g",
    "contentId": "https://webaverse.github.io/silsword/",
    "position": [ -6, 0.5, 12 ],
    "quaternion": [ 0, 0, 0, 1 ],
    "scale": [ 1, 1, 1 ],
    "components": "[]"
}

Here is an example of a player stored as a Z.Map -- the player has an avatar and is holding a sword
{
    "playerId": "GoK3g",
    "avatar": { "instanceId": "qgboft" },
    "transform": {
        "0": -1.3072199821472168,
        "1": 1.2576431035995483,
        "2": 6.1084885597229,
        "3": 0,
        "4": 0.10555386543273926,
        "5": 0,
        "6": 0.9944136142730713,
        "7": 1,
        "8": 1,
        "9": 1,
        "10": 16.66699981689453
    },
    "actions": {
        "e": [
            {
                "type": "wear",
                "instanceId": "nxAup",
                "actionId": "Hgos0"
            }
        ],
        "i": [ "bafb82" ]
    },
    "apps": {
        "e": [
            {
                "instanceId": "qgboft",
                "contentId": "./avatars/scillia_drophunter_v15_vian.vrm",
                "transform": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 0,
                    "4": 0,
                    "5": 0,
                    "6": 1,
                    "7": 1,
                    "8": 1,
                    "9": 1,
                    "10": 0
                },
                "components": "[]"
            },
            {
                "instanceId": "nxAup",
                "contentId": "https://webaverse.github.io/silsword/",
                "transform": {
                    "0": -0.9813549518585205,
                    "1": 1.536096215248108,
                    "2": 6.172163963317871,
                    "3": 0.9454419016838074,
                    "4": -0.30134329199790955,
                    "5": -0.11808272451162338,
                    "6": 0.037259675562381744,
                    "7": 1,
                    "8": 1,
                    "9": 1,
                    "10": 0
                },
                "components": "\"[]\""
            }
        ],
        "i": [ "952bde", "808f75" ]
    }
}

#### App object
When an app is loaded, it becomes a map of data
Everything is synced using instanceIds, which are 5-digit alphanumeric hashes unique per-object. The instanceId of an object on one client should match the next.

The instanceId is a useful key for getting the app. Each app has a list of components, a contentId and an instanceId (which should be unique).

Player objects have a playerId. The instanceId of the avatar can be found inside the player map's avatar key, or through calling CharacterController.getAvatarState
