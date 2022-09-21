const {lanuchBrowser, enterScene, closeBrowser, printLog, totalTimeout, getCurrentPage} = require('../utils');
const { Url } = require('url');


describe('should character movement', () => {
	beforeAll(async () => {
		await lanuchBrowser();
		await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-empty.scn`)
	}, totalTimeout)

	afterAll(async () => {
		await closeBrowser()
	}, totalTimeout)

	test('should character loaded', async () => {
		printLog("should character loaded")
		const isPlayerAvatar =  await getCurrentPage().evaluate(async () => {
			const localPlayer = globalWebaverse.playersManager.localPlayer
			const isPlayerAvatarApp = !!localPlayer.getAvatarApp()
			const isBound = localPlayer.isBound()
			const isLocalPlayer = localPlayer.isLocalPlayer
			const isCharacterSfx = localPlayer.characterSfx && !!localPlayer.characterSfx.player
			const isCharacterHups = localPlayer.characterHups && !!localPlayer.characterHups.player
			const isCharacterFx = localPlayer.characterFx && !!localPlayer.characterFx.player
			const isCharacterHitter = localPlayer.characterHitter && !!localPlayer.characterHitter.player
			const isCharacterBehavior = localPlayer.characterBehavior && !!localPlayer.characterBehavior.player
			const isCharacterPhysic = localPlayer.characterPhysics && localPlayer.characterPhysics.characterHeight > 0 && localPlayer.characterPhysics.lastGrounded
			const isFlag = isPlayerAvatarApp && isBound && isLocalPlayer
											&& isCharacterSfx && isCharacterHups && isCharacterFx
											&& isCharacterHitter && isCharacterBehavior && isCharacterPhysic
			return isFlag
		})
		expect(isPlayerAvatar).toBeTruthy();
	}, totalTimeout)

	test('should character movement: walk', async () => {
		printLog("should character movement: walk")
		const firstPosition =  await getCurrentPage().evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const keys = ["KeyW", "KeyA", "KeyS", "KeyD"]
		const key = keys[Math.floor(Math.random() * keys.length)];
		await getCurrentPage().keyboard.down(key)
		await getCurrentPage().waitForTimeout(1000)
		const isPlayerWalk =  await getCurrentPage().evaluate(async ({firstPosition, key}) => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const currentSpeed = avatar.velocity.length()
			const idleWalkFactor = avatar.idleWalkFactor
			const currentPosition = avatar.lastPosition
			console.log(firstPosition, currentPosition)
			let isCorrectMove = true
			if (key == "KeyW") {
				if (currentPosition.x <= firstPosition.x) isRightMove = false
			} else if (key == "KeyA") {
				if (currentPosition.z >= firstPosition.z) isRightMove = false
			} else if (key == "KeyS") {
				if (currentPosition.x >= firstPosition.x) isRightMove = false
			} else if (key == "KeyD") {
				if (currentPosition.z <= firstPosition.z) isRightMove = false
			}
			return currentSpeed > 0 && idleWalkFactor > 0.5 && currentPosition != firstPosition && isCorrectMove
		}, {firstPosition, key})
		await getCurrentPage().keyboard.up(key)
		await getCurrentPage().waitForTimeout(1000)
		expect(isPlayerWalk).toBeTruthy();
	}, totalTimeout)

	test('should character movement: run', async () => {
		printLog("should character movement: run")
		const lastPosition =  await getCurrentPage().evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const keys = ["KeyW", "KeyA", "KeyS", "KeyD"]
		const key = keys[Math.floor(Math.random() * keys.length)];
		await getCurrentPage().keyboard.down("ShiftRight")
		await getCurrentPage().waitForTimeout(100)
		await getCurrentPage().keyboard.down(key)
		await getCurrentPage().waitForTimeout(1000)
		const isPlayerRun =  await getCurrentPage().evaluate(async (lastPosition) => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const currentSpeed = avatar.velocity.length()
			const walkRunFactor = avatar.walkRunFactor
			const currentPosition = avatar.lastPosition
			return currentSpeed > 0.5 && walkRunFactor > 0.5 && currentPosition != lastPosition
		}, lastPosition)
		await getCurrentPage().keyboard.up(key)
		await getCurrentPage().keyboard.up("ShiftRight")
		await getCurrentPage().waitForTimeout(1000)
		expect(isPlayerRun).toBeTruthy();
	}, totalTimeout)


	test('should character movement: naruto run', async () => {
		printLog("should character movement: naruto run")
		await getCurrentPage().keyboard.down("ShiftLeft")
		await getCurrentPage().waitForTimeout(100)
		let repeat = 0
		const timer = setInterval(() => {
			getCurrentPage().keyboard.press("KeyW")
			repeat++
			if (repeat > 10) {
				clearInterval(timer)
			}
		}, 100)
		await getCurrentPage().waitForTimeout(3000)

		const isNarutoRun =  await getCurrentPage().evaluate(async () => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const narutoRunTime = avatar.narutoRunTime
			const narutoRunState = avatar.narutoRunState
			return narutoRunTime > 0 && narutoRunState
		})
		await getCurrentPage().keyboard.up("ShiftLeft")
		await getCurrentPage().waitForTimeout(5000)
		expect(isNarutoRun).toBeTruthy();
	}, totalTimeout)

	test('should character movement: jump', async () => {
		printLog("should character movement: jump")
		const lastPosition =  await getCurrentPage().evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const isJumpFlags = []
		for (let i = 0; i < 3; i++) {
			await getCurrentPage().keyboard.press("Space")
			await getCurrentPage().waitForTimeout(100)
			const isJump =  await getCurrentPage().evaluate(async (lastPosition) => {
				const avatar = window.globalWebaverse.playersManager?.localPlayer?.avatar
				const jumpState = avatar.jumpState
				const jumpTime = avatar.jumpTime
				const currentPosition = avatar.lastPosition
				console.log(jumpTime, jumpState, lastPosition, currentPosition)
				return jumpTime > 0 && jumpState && (currentPosition.y - lastPosition.y > 0)
			}, lastPosition)
			isJumpFlags.push(isJump)
			await getCurrentPage().waitForTimeout(2000)
		}
		expect((isJumpFlags[0] || isJumpFlags[1] || isJumpFlags[2])).toBeTruthy();
	}, totalTimeout)
	
	test('should character movement: double jump', async () => {
		printLog("should character movement: double jump")
		const lastPosition =  await getCurrentPage().evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const isDoubleJumpFlags = []
		for (let i = 0; i < 3; i++) {
			await getCurrentPage().keyboard.press("Space")
			await getCurrentPage().waitForTimeout(100)
			await getCurrentPage().keyboard.press("Space")
			await getCurrentPage().waitForTimeout(100)
			const isDoubleJump =  await getCurrentPage().evaluate(async (lastPosition) => {
				const avatar = globalWebaverse.playersManager.localPlayer.avatar
				const doubleJumpState = avatar.doubleJumpState
				const doubleJumpTime = avatar.doubleJumpTime
				const currentPosition = avatar.lastPosition
				console.log(doubleJumpTime, doubleJumpState)
				return doubleJumpTime > 0 && doubleJumpState && (currentPosition.y - lastPosition.y > 0)
			}, lastPosition)
			isDoubleJumpFlags.push(isDoubleJump)
			await getCurrentPage().waitForTimeout(2000)
		}
		expect((isDoubleJumpFlags[0] || isDoubleJumpFlags[1] || isDoubleJumpFlags[2])).toBeTruthy();
	}, totalTimeout)

	test('should character movement: crouch', async () => {
		printLog("should character movement: crouch")
		const lastPosition =  await getCurrentPage().evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		await getCurrentPage().keyboard.down("ControlLeft")
		await getCurrentPage().keyboard.down("KeyC")
		await getCurrentPage().waitForTimeout(100)
		await getCurrentPage().keyboard.up("ControlLeft")
		await getCurrentPage().keyboard.up("KeyC")
		await getCurrentPage().waitForTimeout(100)
		await getCurrentPage().keyboard.down("KeyW")
		await getCurrentPage().waitForTimeout(1000)
		const isCrouch =  await getCurrentPage().evaluate(async (lastPosition) => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const currentSpeed = avatar.velocity.length()
			const crouchFactor = avatar.crouchFactor
			const currentPosition = avatar.lastPosition
			return currentSpeed > 0 && crouchFactor !== 0 && currentPosition != lastPosition
		}, lastPosition)
		await getCurrentPage().keyboard.up("KeyW")
		await getCurrentPage().keyboard.down("ControlLeft")
		await getCurrentPage().keyboard.down("KeyC")
		await getCurrentPage().waitForTimeout(100)
		await getCurrentPage().keyboard.up("ControlLeft")
		await getCurrentPage().keyboard.up("KeyC")
		expect(isCrouch).toBeTruthy();
	}, totalTimeout)

	test('should character movement: fly', async () => {
		printLog("should character movement: fly")
		await getCurrentPage().keyboard.press("KeyF")
		await getCurrentPage().keyboard.down("KeyW")
		await getCurrentPage().waitForTimeout(1000)
		const isFly =  await getCurrentPage().evaluate(async () => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const flyState = avatar.flyState
			const flyTime = avatar.flyTime
			return flyTime > 0 && flyState
		})
		await getCurrentPage().keyboard.up("KeyW")
		await getCurrentPage().keyboard.press("KeyF")
		await getCurrentPage().waitForTimeout(1000)
		expect(isFly).toBeTruthy();
	}, totalTimeout)
	
}, totalTimeout)