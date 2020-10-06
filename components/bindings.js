import { App, updateProps } from './App.js';

export const setBindings = (appContainer, onclickMap) => {
    if (appContainer) {
    	for (const handlerType of ['click', 'change']) {
		    const els = Array.from(appContainer.querySelectorAll('[on' + handlerType + ']'));
		    for (const el of els) {
		    	const handlerName = el.getAttribute('on' + handlerType);
		    	el.removeAttribute('on' + handlerType);
		    	// console.log('click handler type', handlerType, handlerName);
		    	el.addEventListener(handlerType, e => {
		    		// debugger;
		    		// console.log('click handler type', handlerType, handlerName);
		    		const id = el.getAttribute('id');
		    		const name = el.getAttribute('name');
		            onclickMap[handlerName]({
		            	id,
		                name,
		            });
		  	    });
		    }
		}
		const draggableEls = Array.from(appContainer.querySelectorAll('[draggable]'));
		for (const el of draggableEls) {
			el.addEventListener('dragstart', e => {
				const dragid = el.getAttribute('dragid');
				e.dataTransfer.setData('application/json', JSON.stringify({
					dragid,
				}))
			    setTimeout(() => {
                   const appContainer = document.getElementById('appContainer');
				   appContainer.style.display = 'none';
				});
			});
			el.addEventListener('dragend', e => {
                const appContainer = document.getElementById('appContainer');
				appContainer.style.display = null;
			});
		}
	}
};