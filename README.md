<img src="docs/banner.jpeg" width=100% />

<p align="center">
    <a href="https://github.com/webaverse/app/graphs/contributors" alt="Contributors">
        <img src="https://img.shields.io/github/contributors/webaverse/app" /></a>
    <a href="https://discord.gg/webaverse">
        <img src="https://img.shields.io/discord/906925486049992755.svg?logo=discord"
            alt="chat on Discord"></a>
    <a href="https://twitter.com/intent/follow?screen_name=webaverse">
        <img src="https://img.shields.io/twitter/follow/webaverse?style=social&logo=twitter"
            alt="follow on Twitter"></a>
</p>
<h1 align="center">Webaverse</h1>
<p align="center">
An open source web3 metaverse game engine that anyone can host. Easy to use, runs in the browser and utilizes open tools and standards like <a href="https://github.com/mrdoob/three.js">three.js</a> and <a href="https://github.com/nodejs/node">Node</a>.
</p>
<p align="center">
Everything you need to get started with building in the Webaverse is contained in this repository.
</p>

## Key Features

- 🎮 A full-featured game engine running in your browser
- ♾️ Infinite procedurally generated world
- 🧑‍🤝‍🧑 Multiplayer with voice and chat
- 🤖 AI-powered non-player characters
- 👓 Supports desktop and VR (mobile coming soon)
- 😊 Expressive, vocal and emotive avatars
- 🔮 Runtime support for user uploads and custom apps
- 🖥️ Completely self-hostable

<p align="center">
<img src="docs/combat.gif" width=30% padding="0" margin="0" align="center" />
<img src="docs/asteroids.gif" width=30% align="center" />
<img src="docs/rug_radio.gif" width=30% align="center" />
</p>
<p align="center">
<img src="docs/rotation.gif" width=91% align="center" />
</p>
<p align="center">
<img src="docs/Uncanny_alley.gif" width=30% align="center" />
<img src="docs/monster_truck.gif" width=30% align="center" />
<img src="docs/plane.gif" width=30% align="center" />
</p>

<h1 align="center">Documentation</h1>
<p align="center">
Developer documentation is <a href="https://docs.webaverse.com">here</a><br />
User documentation is <a href="https://webaverse.notion.site/User-Docs-3a36b223e39b4f94b3d1f6921a4c297a">here</a>
</p>

## Minimum Requirements
- Node.js 18 or greater ([nvm](https://github.com/nvm-sh/nvm) is recommended)
- 10 GB Disk Space
- 8 GB RAM
- 4 Core CPU / vCPUs

## Installation

**Important note before you clone this repo:** This repo uses Git submodules.
You need to install with the `--recurse-submodules` flag or installation will not work. Copy the code below to clone the repository if you aren't sure.

```sh
git clone --recurse-submodules https://github.com/webaverse/app.git
cd app/ # Go into the repository
git pull --recurse-submodules # Pull recursively
npm install # Install dependencies
```

##### Note for Windows Users
We recommend that you use Windows Subsystem for Linux to run Webaverse. This [video](https://www.youtube.com/watch?v=5RTSlby-l9w) shows you how you can set up WSL. Once you've installed it, run `wsl` in your terminal to enter Ubuntu, and then run Webaverse from there.

## Quickstart

Starting the application is as easy as:

```sh
npm run start
```

Once the server has started up, you can visit `https://local.webaverse.com` 

## Let's build it together!

We would love for you to come build with us. First, please review the documentation in it's entirety before contributing. Also join our [Discord](https://discord.gg/webaverse) and introduce yourself.

##### New Issues and Features

Please search Github issues before reporting a new issue or starting a new feature. If you are starting a new feature or bug fix, please write up or reference an issue and indicate that you are working on it.

##### Pull Requests

Please make sure your PRs change as little existing code as is necessary to prevent upstream merge conflicts. When posting a pull request, please document what the PR does and how it can be reviewed and QA'd. PRs will be reviewed and accepted if they conform to our linting and code conventions, don't cause any bugs and don't decrease performance of the app.

<img align="middle" style='margin: 1em' src="/docs/town.jpeg" width=100% />
