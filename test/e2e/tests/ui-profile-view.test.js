const {launchBrowser, enterScene, closeBrowser, printLog, totalTimeout, getCurrentPage} = require('../utils/utils');

describe('should all ui element on the profile view works', () => {

  beforeAll(async () => {
		await launchBrowser();
		//Todo: define custom functions here
		// await page.evaluate(async () => {
		// 	window.todo = () => {} 
		// })
		await enterScene(`https://local.webaverse.com:3000/`)
	}, totalTimeout)

	afterAll(async () => {
		await closeBrowser()
	}, totalTimeout)

	test('should change character on profile view', async () => {
		printLog("should profile ui view works")
			//Todo: example
			//https://www.tabnine.com/code/javascript/functions/puppeteer/Page/click
			//more details: https://www.tutorialspoint.com/puppeteer/puppeteer_quick_guide.htm
		const page = getCurrentPage()
		const currentAvatarInfo = await page.evaluate(async () => {
			return {
				name: globalWebaverse?.playersManager?.localPlayer?.avatar?.app?.name,
				modelId: globalWebaverse?.playersManager?.localPlayer?.avatar?.model?.uuid
			}
		})
		await page.keyboard.press("Tab")
		await page.waitForSelector("._bigButton_116zf_51", {visible: true, timeout: totalTimeout})
		await page.evaluate(async () => {
			document.querySelector("._bigButton_116zf_51").click()
		})
		await page.waitForTimeout(500)
		await page.waitForSelector("._heading_148no_33", {visible: true, timeout: totalTimeout})
		await page.waitForTimeout(500)
		//Todo: find the button position
		const mousePos = await page.evaluate(async () => {
			const nodeLists = document.querySelectorAll("li._item_148no_119:not(._disabled_148no_169)")
			const randomIndex = Math.floor(Math.random() * nodeLists.length - 1) + 1;
			const nodeElement = nodeLists[randomIndex]
			const rect = nodeElement.getBoundingClientRect()
			const x = (rect.left + rect.right) / 2
			const y = (rect.top + rect.bottom) / 2
			return {
				x,
				y
			}
		})

		await page.mouse.move(mousePos.x, mousePos.y)
		await page.waitForTimeout(500)
		await page.mouse.click(mousePos.x, mousePos.y)
		await page.waitForTimeout(500)
		const isAvatarChanged =  await page.evaluate(async (currentAvatarInfo) => {
			console.error("avatar name:", window.globalWebaverse.playersManager?.localPlayer?.avatar?.name)
			return await window.waitForUntil(() => {
				const avatarName = globalWebaverse.playersManager?.localPlayer?.avatar?.app?.name
				const modelId = globalWebaverse?.playersManager?.localPlayer?.avatar?.model?.uuid
				console.log(avatarName, modelId)
				return avatarName != currentAvatarInfo.name && modelId != currentAvatarInfo.modelId
			}, 180000)
		}, currentAvatarInfo)
		await page.waitForTimeout(500)
		expect(isAvatarChanged).toBeTruthy();
	}, totalTimeout)

	test('should scene switch works', async () => {
		printLog("should profile ui view works")
	}, totalTimeout)
})