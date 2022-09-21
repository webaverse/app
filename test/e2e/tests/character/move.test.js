const {lanuchBrowser, enterScene, closeBrowser, printLog, totalTimeout, getCurrentPage} = require('../utils');
const { Url } = require('url');

describe('Simple tests', () => {
	beforeAll(async () => {
		await lanuchBrowser();
		printLog("launch browser")
	}, totalTimeout)

	afterAll(async () => {
    	await closeBrowser()
  	}, totalTimeout)

	describe('should character movement', () => {
		beforeAll(async () => {
			await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-empty.scn`)
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
			// let lastTime = 0
			// let isloop = true
			// let pastDiff = 0
			let repeat = 0
			//repeat until less than doubleTapTime 
			// do {
			// 	await getCurrentPage().keyboard.press("KeyW")
			// 	const currentDiff = performance.now() - lastTime
			// 	isloop = !(currentDiff > 100 && currentDiff < 500) && !(pastDiff > 100 && pastDiff < 500)
			// 	printLog(`doubleTapTime: ${performance.now() - lastTime}`)
			// 	lastTime = performance.now()
			// 	pastDiff = currentDiff
			// 	repeat++
			// 	if (repeat > 10) {
			// 		isloop = false
			// 	}
			// } while (isloop);
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
			await getCurrentPage().waitForTimeout(2000)
			expect(isJump).toBeTruthy();
		}, totalTimeout)
		
		test('should character movement: double jump', async () => {
			printLog("should character movement: double jump")
			await getCurrentPage().keyboard.press("Space")
			await getCurrentPage().waitForTimeout(100)
			await getCurrentPage().keyboard.press("Space")
			await getCurrentPage().waitForTimeout(100)
			const isDoubleJump =  await getCurrentPage().evaluate(async () => {
				const avatar = globalWebaverse.playersManager.localPlayer.avatar
				const doubleJumpState = avatar.doubleJumpState
				const doubleJumpTime = avatar.doubleJumpTime
				return doubleJumpTime > 0 && doubleJumpState
			})
			await getCurrentPage().waitForTimeout(2000)
			expect(isDoubleJump).toBeTruthy();
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

	// describe('should wear and use weapon', () => {

	// 	beforeAll(async () => {
	// 		await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-weapon.scn`)
	// 		await getCurrentPage().click("#root")
	// 		await getCurrentPage().focus("#root")
	// 		await getCurrentPage().mouse.move(width/2, height/2);
	// 		await getCurrentPage().mouse.click(width/2, height/2);
	// 		await getCurrentPage().mouse.wheel({ deltaY: 300 });
	// 	}, totalTimeout)


		
	// 	test('should wear and use weapon: sword', async () => {
	// 		printLog("should wear and use weapon: sword")
	// 		await getCurrentPage().keyboard.down("KeyE")
	// 		await getCurrentPage().waitForTimeout(2000)
	// 		await getCurrentPage().keyboard.up("KeyE")
	// 		await getCurrentPage().mouse.move(width/2, height/2);
	// 		await getCurrentPage().mouse.click(width/2, height/2);
	// 		await getCurrentPage().mouse.down();
	// 		await getCurrentPage().waitForTimeout(5000)
	// 		await getCurrentPage().mouse.up();
	// 		await getCurrentPage().keyboard.press("KeyR")
	// 		await getCurrentPage().waitForTimeout(1000)

	// 		await getCurrentPage().keyboard.down("KeyD")
	// 		await getCurrentPage().waitForTimeout(2800)
	// 		await getCurrentPage().keyboard.up("KeyD")
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)

	// 	test('should wear and use weapon: silsword', async () => {
	// 		await getCurrentPage().keyboard.down("KeyE")
	// 		await getCurrentPage().waitForTimeout(2000)
	// 		await getCurrentPage().keyboard.up("KeyE")
	// 		await getCurrentPage().mouse.move(width/2, height/2);
	// 		await getCurrentPage().mouse.click(width/2, height/2);
	// 		await getCurrentPage().mouse.down();
	// 		await getCurrentPage().waitForTimeout(2000)
	// 		await getCurrentPage().mouse.up();
	// 		await getCurrentPage().keyboard.press("KeyR")
	// 		await getCurrentPage().waitForTimeout(1000)

	// 		await getCurrentPage().keyboard.down("KeyD")
	// 		await getCurrentPage().waitForTimeout(2800)
	// 		await getCurrentPage().keyboard.up("KeyD")
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)

	// 	test('should wear and use weapon: pistol', async () => {
	// 		await getCurrentPage().mouse.move(width/2, height/2);
	// 		await getCurrentPage().keyboard.down("KeyE")
	// 		await getCurrentPage().waitForTimeout(2000)
	// 		await getCurrentPage().keyboard.up("KeyE")
	// 		await getCurrentPage().mouse.down();
	// 		await getCurrentPage().waitForTimeout(2000)
	// 		await getCurrentPage().mouse.up();
	// 		await getCurrentPage().keyboard.press("KeyR")
	// 		await getCurrentPage().waitForTimeout(1000)

	// 		await getCurrentPage().keyboard.down("KeyD")
	// 		await getCurrentPage().waitForTimeout(2800)
	// 		await getCurrentPage().keyboard.up("KeyD")
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)

	// 	test('should wear and use weapon: machine-gun', async () => {
			
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)

	// 	test('should wear and use weapon: uzi', async () => {
			
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)
	// })
})