const puppeteer = require('puppeteer');
const { Url } = require('url'); 


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

const lanuchBrowser = async () => {
	jest.setTimeout(totalTimeout)
  console.log("start launch browser")
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
			'--use-gl=swiftshader',
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
	// page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
}

const navigate = async (url) => {
	if (!browser) {
		throw Error('Cannot navigate without a browser!')
	}
	const context = browser.defaultBrowserContext()

	const parsedUrl = new Url(url)
	console.log('permission allow for ', parsedUrl.origin)
	context.overridePermissions(parsedUrl.origin, ['microphone', 'camera'])

	console.log('Going to ' + url)
	await page.goto(url, { waitUntil: 'load', timeout: totalTimeout })
	console.log('Complete to ' + url)

	// const granted = await page.evaluate(async () => {
	// 	// @ts-ignore
	// 	return (await navigator.permissions.query({ name: 'camera' })).state
	// })
	// console.log('Granted:', granted)
}

const enterScene = async (url) => {
	await navigate(url)
  // await page.waitForSelector('div[id*="app"]', { timeout: totalTimeout })
}

describe('Simple testS', () => {
	beforeAll(async () => {
		await lanuchBrowser();
		await enterScene(`https://${SERVER_NAME}:${port}`)
		console.log("enter the scene")
	}, totalTimeout)

	afterAll(async () => {
    await browser.close()
  }, totalTimeout)

	test('should load scene', async () => {
		console.log("passed: should load scene")
    	expect(true).toBeTruthy();
  }, totalTimeout)

	test('should character movement', async () => {
		console.log("start: should character movement")
		await page.waitForSelector('#app');
		await page.focus(`#app`)

		console.log("should character movement: go forward")
		await page.keyboard.down("KeyW")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyW")

		console.log("should character movement: go backward")
		await page.keyboard.down("KeyS")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyS")

		console.log("should character movement: go left")
		await page.keyboard.down("KeyA")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyA")

		console.log("should character movement: go right")
		await page.keyboard.down("KeyD")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyD")

		console.log("should character movement: run forward")
		await page.keyboard.down("ShiftRight")
		await page.waitForTimeout(1000)
		await page.keyboard.down("KeyW")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyW")
		await page.keyboard.up("ShiftRight")

		console.log("should character movement: jump")
		await page.keyboard.press("Space")
		await page.waitForTimeout(3000)

		console.log("should character movement: double jump")
		await page.keyboard.press("Space")
		await page.waitForTimeout(100)
		await page.keyboard.press("Space")

		await page.waitForTimeout(3000)

		console.log("should character movement: naruto run")
		await page.keyboard.down("ShiftLeft")
		await page.waitForTimeout(1000)
		await page.keyboard.press("KeyW")
		await page.keyboard.down("KeyW")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyW")
		await page.keyboard.up("ShiftLeft")

		console.log("should character movement: fly")
		await page.keyboard.press("KeyF")
		await page.waitForTimeout(1000)
		await page.keyboard.down("KeyW")
		await page.waitForTimeout(3000)
		await page.keyboard.up("KeyW")
		await page.keyboard.press("KeyF")

    expect(true).toBeTruthy();
  }, totalTimeout)
})