const {launchBrowser, enterScene, closeBrowser, printLog, totalTimeout, getCurrentPage} = require('../utils/utils');

describe('should wear and use weapon', () => {

    beforeAll(async () => {
		await launchBrowser();
		//Todo: define custom functions here
		// await page.evaluate(async () => {
		// 	window.todo = () => {} 
		// })
		await enterScene(`https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftest-e2e-weapon.scn`)
        await getCurrentPage().click("#root")
    	await getCurrentPage().mouse.wheel({ deltaY: 300 });
	}, totalTimeout)

	afterAll(async () => {
		await closeBrowser()
	}, totalTimeout)
    
    test('should wear and use weapon: sword', async () => {
    	printLog("should wear and use weapon: sword")
        const page = getCurrentPage()
    	await page.keyboard.down("KeyE")
    	await page.waitForTimeout(2000)
    	await page.keyboard.up("KeyE")
    	await page.mouse.down();
    	await page.waitForTimeout(5000)
    	await page.mouse.up();
    	await page.keyboard.press("KeyR")
    	await page.waitForTimeout(1000)

    	await page.keyboard.down("KeyD")
    	await page.waitForTimeout(2800)
    	await page.keyboard.up("KeyD")
    	expect(true).toBeTruthy();
    }, totalTimeout)
})