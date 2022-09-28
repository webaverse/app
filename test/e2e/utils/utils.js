const puppeteer = require('puppeteer');
const { Url } = require('url');

const totalTimeout = 600 * 1000
const width = 800;
const height = 400;
let browser
let page

const isdebug = false

const printLog = (text, error) => {
	if (isdebug) {
		if (!error) error = ''
		console.log(text, error)
	}
} 

const throwErrors = async (text, isQuit) => {
	if (isQuit) await closeBrowser()
	throw Error(text)
}

const getDimensions = () => {
	return {
		width,
		height
	}
}

const launchBrowser = async () => {
	jest.setTimeout(totalTimeout)
  	printLog("start launch browser")
	if (!browser) {
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
			devtools: true
		})
	}
	page = ( await browser.pages() )[ 0 ];
	await page.setViewport( { width, height } );
	page.on("pageerror", async (err) => {
		printLog("==error==", err)
	});
	// page.on('console', (msg) => printLog('PAGE LOG:', msg.text()));
}

const closeBrowser = async() => {
	await browser.close()
}

const getCurrentPage = () => {
	return page
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
	await defineFunctions()
	const isSceneLoaded =  await page.evaluate(async () => {
		// @ts-ignore
		try {
			if (!window?.globalWebaverse) return
			await window.globalWebaverse.webaverse?.waitForLoad()
			await window.globalWebaverse.universe?.isSceneLoaded()
			return await window.waitForUntil(() => {
				const avatar = window.globalWebaverse.playersManager?.localPlayer?.avatar
				return (avatar?.model && avatar?.model?.visible) || (avatar?.crunchedModel && avatar?.crunchedModel?.visible)
			}, 180000)
		} catch (error) {
			console.error(error)
			return false
		}
	})
	if (!isSceneLoaded) {
		await throwErrors('Cannot load the current scene!', true)
	}
	printLog(`Scene Loaded URL: ${url}`)
}

const defineFunctions = async () => {
	// exposeFunction function does not work well
	// await page.exposeFunction('getAngle', getAngle)
	await page.evaluate(async () => {
		//the interval of exposeFunc does not work
		window.waitForUntil = async (fn, timeout) => {
			return await new Promise((resolve, reject) => {
				const startTime = performance.now()
				let timer = setInterval(() => {
					const flag = fn()
					if (flag) {
						clearInterval(timer)
						resolve(true)
					} else {
						const currentTime = performance.now()
						if (currentTime - startTime > timeout) {
							console.error("wait for until - failed 180s")
							clearInterval(timer)
							reject(false)
						}
					}
				}, 100)
			});
		}
	})
}

module.exports = {
	totalTimeout,
	getCurrentPage,
	launchBrowser,
	closeBrowser,
	enterScene,
	printLog
}