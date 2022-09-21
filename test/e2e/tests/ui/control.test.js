const {lanuchBrowser, enterScene, closeBrowser, printLog, totalTimeout, getCurrentPage} = require('../utils');

describe('should all ui works', () => {

    beforeAll(async () => {
		await lanuchBrowser();
		await enterScene(`https://local.webaverse.com:3000/`)
        await getCurrentPage().click("#root")
    	await getCurrentPage().mouse.wheel({ deltaY: 300 });
	}, totalTimeout)

	afterAll(async () => {
		await closeBrowser()
	}, totalTimeout)


    
    test('should profile ui view works', async () => {
    	printLog("should profile ui view works")
        //Todo: example
        //https://www.tabnine.com/code/javascript/functions/puppeteer/Page/click
        //more details: https://www.tutorialspoint.com/puppeteer/puppeteer_quick_guide.htm
    	expect(true).toBeTruthy();
    }, totalTimeout)
})