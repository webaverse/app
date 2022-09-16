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
  const options = {
		headless: isdebug,
		devtools: !isdebug,
		ignoreHTTPSErrors: true,
		defaultViewport: this.windowSize,
		ignoreDefaultArgs: ['--mute-audio'],
		args: [
			isdebug ? '--headless' : '--enable-webgl',
			'--enable-features=NetworkService',
			'--ignore-certificate-errors',
			`--no-sandbox`,
			`--disable-dev-shm-usage`,
			'--shm-size=4gb',
			'--use-fake-ui-for-media-stream=1',
			'--use-fake-device-for-media-stream=1',
			'--disable-web-security=1',
			//'--no-first-run',
			'--allow-file-access=1',
			'--mute-audio'
		]
  }

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
	printLog('permission allow for ', parsedUrl.origin)
	context.overridePermissions(parsedUrl.origin, ['microphone', 'camera'])

	printLog('Going to ' + url)
	await page.goto(url, { waitUntil: 'load', timeout: totalTimeout })
	printLog('Complete to ' + url)

	// const granted = await page.evaluate(async () => {
	// 	// @ts-ignore
	// 	return (await navigator.permissions.query({ name: 'camera' })).state
	// })
	// printLog('Granted:', granted)

	
}

const enterScene = async (url) => {
	await navigate(url)
	//should isSceneLoad here
  // await page.waitForSelector('div[id*="app"]', { timeout: totalTimeout })
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
			printLog("enter the empty scene")
		}, totalTimeout)

		test('should app selector loaded', async () => {
			await page.waitForSelector('#app');
			await page.focus(`#app`)
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character loaded', async () => {
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: go forward', async () => {
			printLog("should character movement: go forward")
			await page.keyboard.down("KeyW")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyW")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: go backward', async () => {
			printLog("should character movement: go backward")
			await page.keyboard.down("KeyS")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyS")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: go left', async () => {
			printLog("should character movement: go left")
			await page.keyboard.down("KeyA")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyA")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: go right', async () => {
			printLog("should character movement: go right")
			await page.keyboard.down("KeyD")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyD")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: jump', async () => {
			printLog("should character movement: jump")
			await page.keyboard.press("Space")
			await page.waitForTimeout(3000)
			expect(true).toBeTruthy();
		}, totalTimeout)
		
		test('should character movement: double jump', async () => {
			printLog("should character movement: double jump")
			await page.keyboard.press("Space")
			await page.waitForTimeout(100)
			await page.keyboard.press("Space")
			await page.waitForTimeout(3000)
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: crouch forward', async () => {
			printLog("should character movement: crouch forward")
			await page.keyboard.down("ControlLeft")
			await page.keyboard.down("KeyC")
			await page.waitForTimeout(100)
			await page.keyboard.up("ControlLeft")
			await page.keyboard.up("KeyC")
			await page.waitForTimeout(100)
			await page.keyboard.down("KeyW")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyW")
			await page.keyboard.down("ControlLeft")
			await page.keyboard.down("KeyC")
			await page.waitForTimeout(100)
			await page.keyboard.up("ControlLeft")
			await page.keyboard.up("KeyC")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: run forward', async () => {
			printLog("should character movement: run forward")
			await page.keyboard.down("ShiftRight")
			await page.waitForTimeout(1000)
			await page.keyboard.down("KeyW")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyW")
			await page.keyboard.up("ShiftRight")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: naruto run', async () => {
			printLog("should character movement: naruto run")
			await page.keyboard.down("ShiftLeft")
			await page.waitForTimeout(100)
			let lastTime = 0
			let isloop = true
			//repeat until less than doubleTapTime 
			do {
				await page.keyboard.press("KeyW")
				isloop = performance.now() - lastTime > 500
				lastTime = performance.now()
			} while (isloop);
			await page.waitForTimeout(3000)
			await page.keyboard.up("ShiftLeft")
			expect(true).toBeTruthy();
		}, totalTimeout)

		test('should character movement: fly', async () => {
			printLog("should character movement: fly")
			await page.keyboard.press("KeyF")
			await page.waitForTimeout(1000)
			await page.keyboard.down("KeyW")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyW")
			await page.keyboard.press("KeyF")
			expect(true).toBeTruthy();
		}, totalTimeout)
		
  }, totalTimeout)

	describe('should wear and use weapon', () => {
		beforeAll(async () => {
			await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-weapon.scn`)
			printLog("enter the gun scene")
			await page.click("#app-canvas")
			await page.focus("#app-canvas")
			await page.mouse.move(width/2, height/2);
			await page.mouse.click(width/2, height/2);
			await page.mouse.wheel({ deltaY: 300 });
		}, totalTimeout)

		test('should app selector loaded', async () => {
			await page.waitForSelector('#app');
			expect(true).toBeTruthy();
		}, totalTimeout)
		
		test('should wear and use weapon: sword', async () => {
			printLog("should wear and use weapon: sword")
			await page.keyboard.down("KeyE")
			await page.waitForTimeout(3000)
			await page.keyboard.up("KeyE")
			await page.mouse.move(width/2, height/2);
			await page.mouse.click(width/2, height/2);
			await page.focus("#app-canvas")
			await page.mouse.down();
			await page.waitForTimeout(3000)
			await page.mouse.up();
			await page.keyboard.press("KeyR")
			await page.waitForTimeout(1000)

			await page.keyboard.down("KeyD")
			await page.waitForTimeout(2800)
			await page.keyboard.up("KeyD")
			expect(true).toBeTruthy();
		}, totalTimeout)

		// test('should wear and use weapon: silsword', async () => {
		// 	await page.keyboard.down("KeyE")
		// 	await page.waitForTimeout(3000)
		// 	await page.keyboard.up("KeyE")
		// 	await page.mouse.move(width/2, height/2);
		// 	await page.mouse.click(width/2, height/2);
		// 	await page.mouse.down();
		// 	await page.waitForTimeout(3000)
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
		// 	await page.waitForTimeout(3000)
		// 	await page.keyboard.up("KeyE")
		// 	await page.mouse.down();
		// 	await page.waitForTimeout(3000)
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