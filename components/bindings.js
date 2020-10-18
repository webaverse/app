import { bindUploadFileButton } from '../util.js';

export const setBindings = (appContainer, onclickMap) => {
	if (appContainer) {
		// onclick
		{
			const els = Array.from(appContainer.querySelectorAll('[onclick]'));
			for (const el of els) {
				const handlerName = el.getAttribute('onclick');
				el.removeAttribute('onclick');
				el.onclick = e => {
					const id = el.getAttribute('id');
					const name = el.getAttribute('name');
					const href = el.getAttribute('href');
					onclickMap[handlerName]({
						id,
						name,
						href,
					});
				};
			}
		}
		// file
		{
			const els = Array.from(appContainer.querySelectorAll('input[type=file][onchange]'));
			for (const el of els) {
				const handlerName = el.getAttribute('onchange');
				el.removeAttribute('onchange');
				bindUploadFileButton(el, file => {
					const id = el.getAttribute('id');
					const name = el.getAttribute('name');
					const href = el.getAttribute('href');
					onclickMap[handlerName]({
						id,
						name,
						href,
						file,
					});
				});
			}
		}
		// drag
		const draggableEls = Array.from(appContainer.querySelectorAll('[draggable]'));
		for (const el of draggableEls) {
			el.ondragstart = e => {
				const dragid = el.getAttribute('dragid');
				e.dataTransfer.setData('application/json', JSON.stringify({
					dragid,
				}))
				setTimeout(() => {
					const appContainer = document.getElementById('appContainer');
					appContainer.style.display = 'none';
				});
			};
			el.ondragend = e => {
				const appContainer = document.getElementById('appContainer');
				appContainer.style.display = null;
			};
		}
	}
};