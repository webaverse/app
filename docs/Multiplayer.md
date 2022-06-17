# Multiplayer Development
Some notes on the current state of multiplayer development, as well as some quick what-you-need-to-know to get started with developing for multiplayer

## What can I do in multiplayer?
- Jump seamlessly between single and multiplayer
- Switch my avatar, either from an avatar in the world or from the menus
- Speak with my voice
- Switch my voice pack and voice engine
- Have my character's mouth respond to my voice with mouth movement
- Change my name, and see other user's names as a nameplate over their head
- Chat, and have my character speak whatever I chat
- Drop items into the world and use them
- Drop pets and vehicles into the world and activate them
- Pick up weapons and damage mobs
- Die and respawn at current world spawn point

## Application Architecture

### Webaverse
The important, high-touch documents for multiplayer are:
- avatars/avatars.js
- app-manager.js
- character-controller.js
- chat-manager.js
- players-manager.js
- webaverse.js
- universe.js
- world.js

#### Where do I start?
The main entrypoint to the Webaverse app is the Webaverse class in webaverse.js -- this is where everything gets set up and the main loop starts. The world, local and remote players are updated from here.

Multiplayer starts from enterWorld in universe.js

#### How do I get started with players?
The character-controller.js file holds the LocalPlayer, RemotePlayer and the Player base class. Everything related to character state, including transform, movement, actions, wearing, etc is here. NPCs are also a type of player

The actual visual avatar display is largely handled by the Avatars class in the avatars/avatars.js file. The character controller sets the velocity of it's avatar class instance, which then handles the animation update.

Player objects are held in the PlayersManager class in players-manager.js, this is initialized when the client connects to a room. The PlayersManager object is a zjs map of player objects, which are also zjs maps, containing component information that might change. Players sync most things via "actions", but also have information like name, instance ID and their chosen voice engine and voice pack.

Player objects have a playerId, and are stored in the playersArray of the PlayersManager class instance

The instanceId of the avatar can be found inside the player map's avatar key, or through calling CharacterController.getAvatarState()

#### How do I get started with apps?
The AppManager class (app-manager.js) handles setting up, tearing down and updating apps. Apps can be avatars, wearables, buildings, anything that lives in the world with the player. All AppManagers are bound to state, which can be local or networked. world.connectState sets up all of the AppManager bindings locally, while world.connectRoom sets up the bindings globally.

When an app is loaded, it is bound to a map or array in zjs. Each app has an instanceId, which is a 5-digit alphanumeric hash. The instanceId of an object on one client should match the next.

The instanceId is a useful key for getting the app. Each app has a list of components, a contentId and an instanceId (which should be unique).

### Packages

#### zjs
zjs is a purpose-built API-compatible clone of yjs for multiplayer realtime games. Most of the concepts and documentation for yjs applies, so please read before attempting to work on the multiplayer.

The TL;DR is that zjs is a CRDT-backed document store. When changes to the Doc object occur, zjs will handle any conflicts and then send change events with the final state at that moment to all connected clients.

Any object in Webaverse which has a bound state -- players, app managers and tracked apps -- will be subscribed to these change events. This is done using the "observer" pattern, and zjs maps and arrays are observable objects.

#### wsrtc
Actual socket communication is handled by wsrtc, another webaverse project, which moves app data and voice packets over websockets. wsrtc is heavily bound to zjs. Messages received from peers are passed into the server's own zjs instance, where conflicts are handled and final state is passed back out to peers.

An important note about wsrtc is that this will eventually be replaced with redis or a similar distribute key-value store and possibly phased out entirely.

#### totum / metaversefile
Totum (formerly metaversefile, and still called this everywhere) is an API for Webaverse to load composable apps and for said apps to communicate with the Webaverse core. The metaversefileApi contains useful helper functions for initializing and interacting with metaverse apps, or for getting important core data into those apps. A good example would be accessing the local player's app manager, or checking if the scene is loaded.

#### zjs document hierarchy

Z.Doc
- AppManager.appsArray -- all apps in the world
- PlayersManager.playersArray -- a list of all playerMap objects
-- CharacterController.playerMap -- all the data synced about the player, including playerId, apps and transform
-- CharacterController.avatarmap (getAvatarState) -- A map of avatar data 

Here is an example of an app stored as a Z.Map
```json
{
    "instanceId": "rum6g", // shared by all users
    "contentId": "https://webaverse.github.io/silsword/",
    "transform": [ -6, 0.5, 12, 0, 0, 0, 1, 1, 1, 1, 0 ],
    "components": "[]"
}
```

Here is an example of a player stored as a Z.Map -- the player has an avatar and is holding a sword
```js
const examplePlayer = {
    "playerId": "GoK3g",
    "avatar": { "instanceId": "qgboft" },
    "transform": {
        "0": -1.3072199821472168, // position x
        "1": 1.2576431035995483, // y
        "2": 6.1084885597229, // z
        "3": 0, // quaternion x
        "4": 0.10555386543273926, // y
        "5": 0, // z
        "6": 0.9944136142730713, // w
        "7": 16.66699981689453 // time delta
    },
    "actions": {
        "e": [
            {
                "type": "wear",
                "instanceId": "nxAup", // reference to the silsword user is holding
                "actionId": "Hgos0"
            }
        ],
        "i": [ "bafb82" ]
    },
    "apps": {
        "e": [
            { // avatar
                "instanceId": "qgboft",
                "contentId": "./avatars/scillia_drophunter_v15_vian.vrm",
                "transform": {
                    "0": 0, // position x
                    "1": 0, // y
                    "2": 0, // z
                    "3": 0, // quaternion x
                    "4": 0, // y
                    "5": 0, // z
                    "6": 1, // w
                    "7": 1, // scale x
                    "8": 1, // scale y
                    "9": 1, // scale z
                    "10": 0 // time delta
                },
                "components": "[]"
            },
            {
                "instanceId": "nxAup",
                "contentId": "https://webaverse.github.io/silsword/",
                "transform": {
                    "0": -0.9813549518585205, // position x
                    "1": 1.536096215248108,  // y
                    "2": 6.172163963317871, // z
                    "3": 0.9454419016838074, // quaternion x
                    "4": -0.30134329199790955, // y
                    "5": -0.11808272451162338, // z
                    "6": 0.037259675562381744, // w
                    "7": 1, // scale x
                    "8": 1, // scale y
                    "9": 1, // scale z
                    "10": 0 // time delta
                },
                "components": "[]"
            }
        ],
        "i": [ "952bde", "808f75" ]
    }
}
```

### Multiplayer call stack flow

App.jsx Initialization
>> universe.js > enterWorld // user pressed multiplayer button or went to multiplayer room
>> >> world.js > connectRoom()
>> >> >> players-manager.js > playersManager.bindState
>> >> >> >> players-manager.js > bindState.observe(**observePlayersFn**)
>> >> >> character-controller.js > localPlayer.bindState
>> >> >> >> character-controller.js > bindState.observe(**observeAvatarFn**)
>> >> >> character-controller.js > localPlayer.attachState
>> >> >> >> app-manager.js > appManager.bindState
>> >> >> >> >> app-manager.js > bindState.observe(**observeAppsFn**)

player **observeAvatarFn**
>> >> character-controller.js > **observeAvatarFn** > syncAvatar()
>> >> >> character-controller.js > **observeAvatarFn** > transplantApp()

appManager **observeAppsFn**
>> >> app-manager.js **observeAppsFn** > added
>> >> >> app-manager.js **observeAppsFn** > added > if is remote player or world, observe tracked app
>> >> >> >> app-manager.js **observeAppsFn** > added > ??? >> observeTrackedApp()
>> >> >> >> >> app-manager.js observeTrackedApp > **observeTrackedAppFn**


app-manager.js **observeTrackedAppFn**
>> >> (if event contains transform update, update transform)

players-manager.js **observePlayersFn**
>> >> (remote player joins) > new RemoterPlayer()
>> >> >> character-controller.js > remotePlayer.bindState
>> >> >> >> character-controller.js > bindState.observe(**observeAvatarFn**)
>> >> >> character-controller.js > remotePlayer.attachState
>> >> >> >> app-manager.js > appManager.bindState
>> >> >> >> >> app-manager.js > bindState.observe(**observeAppsFn**)