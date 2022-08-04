const notificationsEl = document.getElementById('notifications');

const addNotification = (html, {timeout = 5000} = {}) => {
  const div = document.createElement('div');
  div.classList.add('notification');
  div.innerHTML = html;
  if (notificationsEl) {
    notificationsEl.appendChild(div);
    if (timeout < Infinity) {
      div.timeout = setTimeout(() => {
        removeNotification(div);
      }, timeout);
    }
  }
  return div;
};
const removeNotification = div => {
  if (notificationsEl && Array.from(notificationsEl.childNodes).includes(div)) {
    notificationsEl.removeChild(div);
    clearTimeout(div.timeout);
  }
};

export {
  addNotification,
  removeNotification,
};