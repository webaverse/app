let pendingAnalyticsData = {};
setInterval(() => {
  Object.keys(pendingAnalyticsData).forEach(item => {
    fetch(item, { method: 'POST', body: JSON.stringify(pendingAnalyticsData[item]) })
    .catch(err => {
      console.error(err);
    });
    delete pendingAnalyticsData[item];
  });
}, 10000);

export let pointers = [];
let currentIndex = 0;
setInterval(() => {
  if (pointers.length <= 0 && document.querySelector("meta[name=monetization]")) {
    document.querySelector("meta[name=monetization]").remove();
    document.monetization.removeEventListener('monetizationprogress', monetizationProgress);
  }
  if (pointers.length <= 0 || !document.monetization) return;

  if (!document.querySelector("meta[name=monetization]")) {
    const monetizationTag = document.createElement('meta');
    monetizationTag.name = 'monetization';
    monetizationTag.content = pointers[currentIndex].monetizationPointer;
    document.head.appendChild(monetizationTag);
    document.monetization.addEventListener('monetizationprogress', function monetizationProgress (e) {
      const current = pointers[currentIndex];
      const currentMonetizationPointer = encodeURIComponent(current.monetizationPointer);
      const apiUrl = `https://analytics.webaverse.com/monetization/${current.contentId}/${current.ownerAddress}/${currentMonetizationPointer}`;
      if (pendingAnalyticsData[apiUrl]) {
        const existing = pendingAnalyticsData[apiUrl];
        pendingAnalyticsData[apiUrl] = {
          amount: parseFloat(existing.amount) + parseFloat(e.detail.amount),
          assetCode: existing.assetCode,
          assetScale: existing.assetScale
        };
      } else {
        pendingAnalyticsData[apiUrl] = {
          amount: parseFloat(e.detail.amount),
          assetCode: e.detail.assetCode,
          assetScale: e.detail.assetScale
        };
      }
    });
  } else if (document.querySelector("meta[name=monetization]")) {
    document.querySelector("meta[name=monetization]").setAttribute("content", pointers[currentIndex].monetizationPointer);
  }

  if (currentIndex >= pointers.length - 1) {
    currentIndex = 0;
  } else {
    currentIndex++;
  }
}, 5000); // Every 5 sec
