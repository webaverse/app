const defaultTimeout = 5000;
const notificationsEl = document.getElementById('notifications');

const addNotification = (html, {timeout = defaultTimeout} = {}) => {
  const div = document.createElement('div');
  div.classList.add('notification');
  div.innerHTML = html;
  notificationsEl.appendChild(div);
  if (timeout < Infinity) {
    div.timeout = setTimeout(() => {
      removeNotification(div);
    }, timeout);
  }
  return div;
};
const removeNotification = div => {
  if (Array.from(notificationsEl.childNodes).includes(div)) {
    notificationsEl.removeChild(div);
  }
};

export {
  addNotification,
  defaultTimeout,
  removeNotification,
};