const {
  launchBrowser,
  enterScene,
  closeBrowser,
  printLog,
  totalTimeout,
  getCurrentPage,
} = require('../utils/utils');

describe('should all ui element on the profile view works', () => {
  beforeAll(async () => {
    await launchBrowser();
    //Todo: define custom functions here
    // await page.evaluate(async () => {
    // 	window.todo = () => {}
    // })
    await enterScene(`https://local.webaverse.com:3000/`);
  }, totalTimeout);

  afterAll(async () => {
    await closeBrowser();
  }, totalTimeout);

  test(
    'should change character on profile view',
    async () => {
      printLog('should profile ui view works');
      //Todo: example
      //https://www.tabnine.com/code/javascript/functions/puppeteer/Page/click
      //more details: https://www.tutorialspoint.com/puppeteer/puppeteer_quick_guide.htm
      const page = getCurrentPage();
      await page.keyboard.press('Tab');
      await page.waitForSelector('._bigButton_116zf_51', {
        visible: true,
        timeout: totalTimeout,
      });
      await page.evaluate(async () => {
        document.querySelector('._bigButton_116zf_51').click();
      });
      await page.waitForTimeout(500);
      await page.waitForSelector('._heading_148no_33', {
        visible: true,
        timeout: totalTimeout,
      });
      await page.waitForTimeout(500);

      const characterLength = await page.evaluate(async () => {
        const nodeLists = document.querySelectorAll(
          'li._item_148no_119:not(._disabled_148no_169)',
        );
        return nodeLists.length;
      });

      let characterChangedCount = 0;

      for (let index = 0; index < characterLength; index++) {
        if (index != 0) {
          await page.keyboard.press('Tab');
          await page.waitForSelector('._bigButton_116zf_51', {
            visible: true,
            timeout: totalTimeout,
          });
          await page.evaluate(async () => {
            document.querySelector('._bigButton_116zf_51').click();
          });
          await page.waitForTimeout(500);
          await page.waitForSelector('._heading_148no_33', {
            visible: true,
            timeout: totalTimeout,
          });
          await page.waitForTimeout(500);
        }

        const currentAvatarId = await page.evaluate(async () => {
          return globalWebaverse?.playersManager?.localPlayer?.avatar?.app
            ?.uuid;
        });

        //Todo: find the button position
        const mousePos = await page.evaluate(async index => {
          const nodeLists = document.querySelectorAll(
            'li._item_148no_119:not(._disabled_148no_169)',
          );
          const nodeElement = nodeLists[index];
          const rect = nodeElement.getBoundingClientRect();
          const x = (rect.left + rect.right) / 2;
          const y = (rect.top + rect.bottom) / 2;
          return {
            x,
            y,
          };
        }, index);

        await page.mouse.move(mousePos.x, mousePos.y);
        await page.waitForTimeout(500);
        //await preview canvas
        await page.evaluate(async () => {
          return await window.waitForUntil(() => {
            return document.querySelector(
              '._megaHup_1nfvo_1._open_1nfvo_31 > canvas',
            );
          }, 180000);
        });
        await page.mouse.click(mousePos.x, mousePos.y);
        await page.waitForTimeout(500);

        const isAvatarChanged = await page.evaluate(async currentAvatarId => {
          return await window.waitForUntil(() => {
            const appId =
              globalWebaverse?.playersManager?.localPlayer?.avatar?.app?.uuid;
            return appId != currentAvatarId;
          }, 180000);
        }, currentAvatarId);
        if (isAvatarChanged) characterChangedCount++;
        await page.waitForTimeout(500);
      }

      expect(characterChangedCount == characterLength).toBeTruthy();
    },
    totalTimeout,
  );
});
