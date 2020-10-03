import { App, updateProps } from './App.js';

export const setBindings = (appContainer, onclickMap) => {
    if (appContainer) {
    	for (const handlerType of ['click', 'change']) {
		    const els = Array.from(appContainer.querySelectorAll('[on' + handlerType + ']'));
		    for (const el of els) {
		    	const handlerName = el.getAttribute('on' + handlerType);
		    	el.removeAttribute('on' + handlerType);
		    	el.addEventListener(handlerType, e => {
		            onclickMap[handlerName](e);
		  	    });
		    }
		}
	}
};