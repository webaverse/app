
import React, {useState, Component, useRef, useEffect} from 'react';

export const Monetization = ({address}) => {
  const pointers = [];
  let currentIndex = 0;
  const pendingAnalyticsData = {};

  //   let event = new CustomEvent('startMonetization',{detail:{instanceId:'instanceId',monetizationPointer:'monetizationPointer',ownerAddress:'ownerAddress'}})

  useEffect(() => {
    const startMonetization = event => {
      const {instanceId, monetizationPointer, ownerAddress} = event.data;
      if (!monetizationPointer) {
        return;
      }

      let monetizationInstance = document[`monetization${instanceId}`];
      if (!monetizationInstance) {
        document[`monetization${instanceId}`] = new EventTarget();
        monetizationInstance = document[`monetization${instanceId}`];
        pointers.push({instanceId, monetizationPointer, ownerAddress});
      }

      const ethereumAddress = address;
      if (ethereumAddress && ethereumAddress === ownerAddress) {
        monetizationInstance.dispatchEvent(new Event('monetizationstart'));
        monetizationInstance.state = 'started';
      } else if (document.monetization && monetizationPointer) {
        monetizationInstance.dispatchEvent(new Event('monetizationstart'));
        monetizationInstance.state = 'started';
      }
    };

    window.document.addEventListener('startMonetization', startMonetization);
    return () => {
      window.document.removeEventListener('startMonetization', startMonetization);
    };
  }, []);

  const monetizationProgress = e => {
    const current = pointers[currentIndex];
    const currentMonetizationPointer = encodeURIComponent(current.monetizationPointer);
    const apiUrl = `https://analytics.webaverse.com/${current.instanceId}/${current.ownerAddress}/${currentMonetizationPointer}`;
    if (pendingAnalyticsData[apiUrl]) {
      const existing = pendingAnalyticsData[apiUrl];
      pendingAnalyticsData[apiUrl] = {
        amount: parseFloat(existing.amount) + parseFloat(e.detail.amount),
        assetCode: existing.assetCode,
        assetScale: existing.assetScale,
      };
    } else {
      pendingAnalyticsData[apiUrl] = {
        amount: parseFloat(e.detail.amount),
        assetCode: e.detail.assetCode,
        assetScale: e.detail.assetScale,
      };
    }
  };

  setInterval(() => {
    if (document.monetization) {
      if (pointers.length <= 0 && document.querySelector('meta[name=monetization]')) {
        document.querySelector('meta[name=monetization]').remove();
        document.monetization.removeEventListener('monetizationprogress', monetizationProgress);
      }
      if (pointers.length <= 0) return;

      if (!document.querySelector('meta[name=monetization]')) {
        const monetizationTag = document.createElement('meta');
        monetizationTag.name = 'monetization';
        monetizationTag.content = pointers[currentIndex].monetizationPointer;
        document.head.appendChild(monetizationTag);
        document.monetization.addEventListener('monetizationprogress', monetizationProgress);
      } else if (document.querySelector('meta[name=monetization]')) {
        document.querySelector('meta[name=monetization]').setAttribute('content', pointers[currentIndex].monetizationPointer);
      }

      if (currentIndex >= pointers.length - 1) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
    }
  }, 5000);

  setInterval(() => {
    Object.keys(pendingAnalyticsData).forEach(item => {
      fetch(item, {method: 'POST', body: JSON.stringify(pendingAnalyticsData[item])})
        .catch(err => {
          console.error(err);
        });
      delete pendingAnalyticsData[item];
    });
  }, 10000);

  return (<></>);
};
