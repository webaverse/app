const {lanuchBrowser, enterScene, closeBrowser, printLog, totalTimeout, getCurrentPage} = require('../utils/utils');

describe('should character movement', () => {
	beforeAll(async () => {
		await lanuchBrowser();
		//Todo: define custom functions here
		// await page.evaluate(async () => {
		// 	window.todo = () => {} 
		// })
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
		const page = getCurrentPage()
		const firstPosition =  await page.evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const keys = ["KeyW", "KeyA", "KeyS", "KeyD"]
		const key = keys[Math.floor(Math.random() * keys.length)];
		await page.keyboard.down(key)
		await page.waitForTimeout(1000)
		const isPlayerWalk =  await page.evaluate(async ({firstPosition, key}) => {
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
		await page.keyboard.up(key)
		await page.waitForTimeout(1000)
		expect(isPlayerWalk).toBeTruthy();
	}, totalTimeout)

	test('should character movement: run', async () => {
		printLog("should character movement: run")
		const page = getCurrentPage()
		const lastPosition =  await page.evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const keys = ["KeyW", "KeyA", "KeyS", "KeyD"]
		const key = keys[Math.floor(Math.random() * keys.length)];
		await page.keyboard.down("ShiftRight")
		await page.waitForTimeout(100)
		await page.keyboard.down(key)
		await page.waitForTimeout(1000)
		const isPlayerRun =  await page.evaluate(async (lastPosition) => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const currentSpeed = avatar.velocity.length()
			const walkRunFactor = avatar.walkRunFactor
			const currentPosition = avatar.lastPosition
			return currentSpeed > 0.5 && walkRunFactor > 0.5 && currentPosition != lastPosition
		}, lastPosition)
		await page.keyboard.up(key)
		await page.keyboard.up("ShiftRight")
		await page.waitForTimeout(1000)
		expect(isPlayerRun).toBeTruthy();
	}, totalTimeout)


	test('should character movement: naruto run', async () => {
		printLog("should character movement: naruto run")
		const page = getCurrentPage()
		await page.keyboard.down("ShiftLeft")
		await page.waitForTimeout(100)
		let repeat = 0
		const timer = setInterval(() => {
			page.keyboard.press("KeyW")
			repeat++
			if (repeat > 10) {
				clearInterval(timer)
			}
		}, 100)
		await page.waitForTimeout(3000)

		const isNarutoRun =  await page.evaluate(async () => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const narutoRunTime = avatar.narutoRunTime
			const narutoRunState = avatar.narutoRunState
			return narutoRunTime > 0 && narutoRunState
		})
		await page.keyboard.up("ShiftLeft")
		await page.waitForTimeout(5000)
		expect(isNarutoRun).toBeTruthy();
	}, totalTimeout)

	test('should character movement: jump', async () => {
		printLog("should character movement: jump")
		const page = getCurrentPage()
		const lastPosition =  await page.evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const isJumpFlags = []
		//ToDO: need to repeat for get average because sometimes page.evaluate takes a few sec
		for (let i = 0; i < 3; i++) {
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			const isJump =  await page.evaluate(async (lastPosition) => {
				const avatar = window.globalWebaverse.playersManager?.localPlayer?.avatar
				const jumpState = avatar.jumpState
				const jumpTime = avatar.jumpTime
				const currentPosition = avatar.lastPosition
				console.log(jumpTime, jumpState, lastPosition, currentPosition)
				return jumpTime > 0 && jumpState && (currentPosition.y - lastPosition.y > 0)
			}, lastPosition)
			isJumpFlags.push(isJump)
			await page.waitForTimeout(2000)
		}
		expect((isJumpFlags[0] || isJumpFlags[1] || isJumpFlags[2])).toBeTruthy();
	}, totalTimeout)
	
	test('should character movement: double jump', async () => {
		printLog("should character movement: double jump")
		const page = getCurrentPage()
		const lastPosition =  await page.evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		const isDoubleJumpFlags = []
		//ToDO: need to repeat for get average because sometimes page.evaluate takes a few sec
		for (let i = 0; i < 3; i++) {
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			const isDoubleJump =  await page.evaluate(async (lastPosition) => {
				const avatar = globalWebaverse.playersManager.localPlayer.avatar
				const doubleJumpState = avatar.doubleJumpState
				const doubleJumpTime = avatar.doubleJumpTime
				const currentPosition = avatar.lastPosition
				console.log(doubleJumpTime, doubleJumpState)
				return doubleJumpTime > 0 && doubleJumpState && (currentPosition.y - lastPosition.y > 0)
			}, lastPosition)
			isDoubleJumpFlags.push(isDoubleJump)
			await page.waitForTimeout(2000)
		}
		expect((isDoubleJumpFlags[0] || isDoubleJumpFlags[1] || isDoubleJumpFlags[2])).toBeTruthy();
	}, totalTimeout)

	test('should character movement: crouch', async () => {
		printLog("should character movement: crouch")
		const page = getCurrentPage()
		const lastPosition =  await page.evaluate(async () => {
			return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
		})
		await page.keyboard.down("ControlLeft")
		await page.keyboard.down("KeyC")
		await page.waitForTimeout(100)
		await page.keyboard.up("ControlLeft")
		await page.keyboard.up("KeyC")
		await page.waitForTimeout(100)
		await page.keyboard.down("KeyW")
		await page.waitForTimeout(1000)
		const isCrouch =  await page.evaluate(async (lastPosition) => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const currentSpeed = avatar.velocity.length()
			const crouchFactor = avatar.crouchFactor
			const currentPosition = avatar.lastPosition
			return currentSpeed > 0 && crouchFactor !== 0 && currentPosition != lastPosition
		}, lastPosition)
		await page.keyboard.up("KeyW")
		await page.keyboard.down("ControlLeft")
		await page.keyboard.down("KeyC")
		await page.waitForTimeout(100)
		await page.keyboard.up("ControlLeft")
		await page.keyboard.up("KeyC")
		expect(isCrouch).toBeTruthy();
	}, totalTimeout)

	test('should character movement: fly', async () => {
		printLog("should character movement: fly")
		const page = getCurrentPage()
		await page.keyboard.press("KeyF")
		await page.keyboard.down("KeyW")
		await page.waitForTimeout(1000)
		const isFly =  await page.evaluate(async () => {
			const avatar = globalWebaverse.playersManager.localPlayer.avatar
			const flyState = avatar.flyState
			const flyTime = avatar.flyTime
			return flyTime > 0 && flyState
		})
		await page.keyboard.up("KeyW")
		await page.keyboard.press("KeyF")
		await page.waitForTimeout(1000)
		expect(isFly).toBeTruthy();
	}, totalTimeout)
	
}, totalTimeout)