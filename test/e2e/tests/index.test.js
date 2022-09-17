const puppeteer = require('puppeteer');
const { Url } = require('url'); 
// const metaversefileApi = require('metaversefile')



const isProduction = process.argv[2] === '-p';
const port = parseInt(process.env.PORT, 10) || (isProduction ? 443 : 3000);
const domain = process.env.APP_HOST
const SERVER_NAME = 'local.webaverse.com';

const totalTimeout = 600 * 1000
const width = 800;
const height = 400;
const viewScale = 1;
let browser
let page
const isdebug = true

const printLog = (text, error) => {
	if (isdebug) {
		if (!error) error = ''
		console.log(text, error)
	}
} 

const lanuchBrowser = async () => {
	jest.setTimeout(totalTimeout)
  printLog("start launch browser")
  // const options = {
	// 	headless: isdebug,
	// 	devtools: !isdebug,
	// 	ignoreHTTPSErrors: true,
	// 	defaultViewport: this.windowSize,
	// 	ignoreDefaultArgs: ['--mute-audio'],
	// 	args: [
	// 		isdebug ? '--headless' : '--enable-webgl',
	// 		'--enable-features=NetworkService',
	// 		'--ignore-certificate-errors',
	// 		`--no-sandbox`,
	// 		`--disable-dev-shm-usage`,
	// 		'--shm-size=4gb',
	// 		'--use-fake-ui-for-media-stream=1',
	// 		'--use-fake-device-for-media-stream=1',
	// 		'--disable-web-security=1',
	// 		//'--no-first-run',
	// 		'--allow-file-access=1',
	// 		'--mute-audio'
	// 	]
  // }

	browser = await puppeteer.launch( {
		headless: !isdebug,
		args: [
			'--no-sandbox',
			// '--use-gl=egl',
			'--use-gl=swiftshader',
			'--disable-dev-shm-usage',
			'--disable-setuid-sandbox',
			'--no-sandbox',
			'--enable-surface-synchronization',
			'--enable-webgl',
			'--disable-web-security=1',
			'--mute-audio'
		],
		devtools: isdebug
	})
	page = ( await browser.pages() )[ 0 ];
	await page.setViewport( { width: width * viewScale, height: height * viewScale } );
	page.on("pageerror", async (err) => {
		printLog("==error==", err)
	});
	// page.on('console', (msg) => printLog('PAGE LOG:', msg.text()));
}

const navigate = async (url) => {
	if (!browser) {
		throw Error('Cannot navigate without a browser!')
	}
	const context = browser.defaultBrowserContext()

	const parsedUrl = new Url(url)
	printLog('permission allow for ', url)
	context.overridePermissions(url, ['microphone', 'camera'])

	printLog('Going to ' + url)
	await page.goto(url, { waitUntil: 'load', timeout: totalTimeout })
	printLog('Complete to ' + url)

	// const granted = await page.evaluate(async () => {
	// 	// @ts-ignore
	// 	return (await navigator.permissions.query({ name: 'camera' })).state
	// })
	// printLog('Granted:', granted
}

const enterScene = async (url) => {
	await navigate(url)
	const isSceneLoaded =  await page.evaluate(async () => {
		// @ts-ignore
		try {
			if (window && window.globalWebaverse
				&& window.globalWebaverse.webaverse
				&& window.globalWebaverse.universe) {
				await window.globalWebaverse.webaverse.waitForLoad()
				await window.globalWebaverse.universe.isSceneLoaded()
				return true
			}
		} catch (error) {
			return false
		}
		return false
	})
	if (!isSceneLoaded) {
		throw Error('Cannot load the current scene!')
	}
	printLog(`Scene Loaded URL: ${url}`)
}

describe('Simple tests', () => {
	beforeAll(async () => {
		await lanuchBrowser();
		printLog("launch browser")
	}, totalTimeout)

	afterAll(async () => {
    await browser.close()
  }, totalTimeout)

	describe('should character movement', () => {
		beforeAll(async () => {
			await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-empty.scn`)
		}, totalTimeout)

		test('should character loaded', async () => {
			printLog("should character loaded")
			const isPlayerAvatar =  await page.evaluate(async () => {
				const startTime = performance.now()
				let timer = 0
				return await new Promise((resolve, reject) => {
					timer = setInterval(() => {
						if (window
							&& window.globalWebaverse
							&& window.globalWebaverse.playersManager
							&& window.globalWebaverse.playersManager.localPlayer
							&& window.globalWebaverse.playersManager.localPlayer.avatar) {
							clearInterval(timer)
							resolve(true)
						} else {
							const currentTime = performance.now()
							if (currentTime - startTime > 3000) {
								clearInterval(timer)
								reject(false)
							}
						}
					}, 100)
				});
			})

			if (!isPlayerAvatar) {
				throw Error('Cannot load the current avatar!')
			}
			expect(isPlayerAvatar).toBeTruthy();
		}, totalTimeout)

		test('should character movement: walk', async () => {
			printLog("should character movement: walk")
			const lastPosition =  await page.evaluate(async () => {
				return globalWebaverse.playersManager.localPlayer.avatar.lastPosition
			})
			const keys = ["KeyW", "KeyA", "KeyS", "KeyD"]
			const key = keys[Math.floor(Math.random() * keys.length)];
			await page.keyboard.down(key)
			await page.waitForTimeout(1000)
			const isPlayerWalk =  await page.evaluate(async (lastPosition) => {
				const currentSpeed = globalWebaverse.playersManager.localPlayer.avatar.velocity.length()
				const idleWalkFactor = globalWebaverse.playersManager.localPlayer.avatar.idleWalkFactor
				const currentPosition = globalWebaverse.playersManager.localPlayer.avatar.lastPosition
				return currentSpeed > 0 && idleWalkFactor > 0.5 && currentPosition != lastPosition
			}, lastPosition)
			await page.keyboard.up(key)
			await page.waitForTimeout(1000)
			expect(isPlayerWalk).toBeTruthy();
		}, totalTimeout)

		test('should character movement: run', async () => {
			printLog("should character movement: run")
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
				const currentSpeed = globalWebaverse.playersManager.localPlayer.avatar.velocity.length()
				const walkRunFactor = globalWebaverse.playersManager.localPlayer.avatar.walkRunFactor
				const currentPosition = globalWebaverse.playersManager.localPlayer.avatar.lastPosition
				return currentSpeed > 0.5 && walkRunFactor > 0.5 && currentPosition != lastPosition
			}, lastPosition)
			await page.keyboard.up(key)
			await page.keyboard.up("ShiftRight")
			await page.waitForTimeout(1000)
			expect(isPlayerRun).toBeTruthy();
		}, totalTimeout)


		test('should character movement: naruto run', async () => {
			printLog("should character movement: naruto run")
			await page.keyboard.down("ShiftLeft")
			await page.waitForTimeout(100)
			// let lastTime = 0
			// let isloop = true
			// let pastDiff = 0
			let repeat = 0
			//repeat until less than doubleTapTime 
			// do {
			// 	await page.keyboard.press("KeyW")
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
				page.keyboard.press("KeyW")
				repeat++
				if (repeat > 20) {
					clearInterval(timer)
				}
			}, 100)
			await page.waitForTimeout(2500)

			const isNarutoRun =  await page.evaluate(async () => {
				const narutoRunTime = globalWebaverse.playersManager.localPlayer.avatar.narutoRunTime
				const narutoRunState = globalWebaverse.playersManager.localPlayer.avatar.narutoRunState
				return narutoRunTime > 0 && narutoRunState
			})
			await page.keyboard.up("ShiftLeft")
			await page.waitForTimeout(2000)
			expect(isNarutoRun).toBeTruthy();
		}, totalTimeout)

		test('should character movement: jump', async () => {
			printLog("should character movement: jump")
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			const isJump =  await page.evaluate(async () => {
				const jumpState = globalWebaverse.playersManager.localPlayer.avatar.jumpState
				const jumpTime = globalWebaverse.playersManager.localPlayer.avatar.jumpTime
				return jumpTime > 0 && jumpState
			})
			await page.waitForTimeout(2000)
			expect(isJump).toBeTruthy();
		}, totalTimeout)
		
		test('should character movement: double jump', async () => {
			printLog("should character movement: double jump")
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			const isDoubleJump =  await page.evaluate(async () => {
				const doubleJumpState = globalWebaverse.playersManager.localPlayer.avatar.doubleJumpState
				const doubleJumpTime = globalWebaverse.playersManager.localPlayer.avatar.doubleJumpTime
				return doubleJumpTime > 0 && doubleJumpState
			})
			await page.waitForTimeout(2000)
			expect(isDoubleJump).toBeTruthy();
		}, totalTimeout)

		test('should character movement: crouch', async () => {
			printLog("should character movement: crouch")
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
				const currentSpeed = globalWebaverse.playersManager.localPlayer.avatar.velocity.length()
				const crouchFactor = globalWebaverse.playersManager.localPlayer.avatar.crouchFactor
				const currentPosition = globalWebaverse.playersManager.localPlayer.avatar.lastPosition
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
			await page.keyboard.press("KeyF")
			await page.keyboard.down("KeyW")
			await page.waitForTimeout(1000)
			const isFly =  await page.evaluate(async () => {
				const flyState = globalWebaverse.playersManager.localPlayer.avatar.flyState
				const flyTime = globalWebaverse.playersManager.localPlayer.avatar.flyTime
				return flyTime > 0 && flyState
			})
			await page.keyboard.up("KeyW")
			await page.keyboard.press("KeyF")
			await page.waitForTimeout(1000)
			expect(isFly).toBeTruthy();
		}, totalTimeout)
		
  // }, totalTimeout)

	// describe('should wear and use weapon', () => {
	// 	beforeAll(async () => {
	// 		await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-weapon.scn`)
	// 		await page.click("#app-canvas")
	// 		await page.focus("#app-canvas")
	// 		await page.mouse.move(width/2, height/2);
	// 		await page.mouse.click(width/2, height/2);
	// 		await page.mouse.wheel({ deltaY: 300 });
	// 	}, totalTimeout)

	// 	test('should app selector loaded', async () => {
	// 		await page.waitForSelector('#app');
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)
		
	// 	test('should wear and use weapon: sword', async () => {
	// 		printLog("should wear and use weapon: sword")
	// 		await page.keyboard.down("KeyE")
	// 		await page.waitForTimeout(2000)
	// 		await page.keyboard.up("KeyE")
	// 		await page.mouse.move(width/2, height/2);
	// 		await page.mouse.click(width/2, height/2);
	// 		await page.focus("#app-canvas")
	// 		await page.mouse.down();
	// 		await page.waitForTimeout(2000)
	// 		await page.mouse.up();
	// 		await page.keyboard.press("KeyR")
	// 		await page.waitForTimeout(1000)

	// 		await page.keyboard.down("KeyD")
	// 		await page.waitForTimeout(2800)
	// 		await page.keyboard.up("KeyD")
	// 		expect(true).toBeTruthy();
	// 	}, totalTimeout)

		// test('should wear and use weapon: silsword', async () => {
		// 	await page.keyboard.down("KeyE")
		// 	await page.waitForTimeout(2000)
		// 	await page.keyboard.up("KeyE")
		// 	await page.mouse.move(width/2, height/2);
		// 	await page.mouse.click(width/2, height/2);
		// 	await page.mouse.down();
		// 	await page.waitForTimeout(2000)
		// 	await page.mouse.up();
		// 	await page.keyboard.press("KeyR")
		// 	await page.waitForTimeout(1000)

		// 	await page.keyboard.down("KeyD")
		// 	await page.waitForTimeout(2800)
		// 	await page.keyboard.up("KeyD")
		// 	expect(true).toBeTruthy();
		// }, totalTimeout)

		// test('should wear and use weapon: pistol', async () => {
		// 	await page.mouse.move(width/2, height/2);
		// 	await page.keyboard.down("KeyE")
		// 	await page.waitForTimeout(2000)
		// 	await page.keyboard.up("KeyE")
		// 	await page.mouse.down();
		// 	await page.waitForTimeout(2000)
		// 	await page.mouse.up();
		// 	await page.keyboard.press("KeyR")
		// 	await page.waitForTimeout(1000)

		// 	await page.keyboard.down("KeyD")
		// 	await page.waitForTimeout(2800)
		// 	await page.keyboard.up("KeyD")
		// 	expect(true).toBeTruthy();
		// }, totalTimeout)

		// test('should wear and use weapon: machine-gun', async () => {
			
		// 	expect(true).toBeTruthy();
		// }, totalTimeout)

		// test('should wear and use weapon: uzi', async () => {
			
		// 	expect(true).toBeTruthy();
		// }, totalTimeout)
	})
})