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

const addNotificationWrapped = (...args) => {
  const element = addNotification(...args);
  return {element, remove: () => removeNotification(element)};
};

const removeNotification = div => {
  if (Array.from(notificationsEl.childNodes).includes(div)) {
    notificationsEl.removeChild(div);
  }
};

/**
 * Send a default notification.
 *
 * Forms:
 * notify(<text>)
 * notify(<label>,<text>)
 * notify(<label>,<text>,<timeout>)
 */
function notify(...args) {
  const len = args.length;
  const timeout = args[2] || defaultTimeout;

  switch (len) {
    case 0: return null;
    case 1: return addNotificationWrapped(
      `\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=text>
          ${args[0]}
        </div>
        <div class=close-button>✕</div>
      </div>
    `,
      {timeout},
    );
    case 2:
    case 3: return addNotificationWrapped(
      `\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=label>${args[0]}</div>
        <div class=text>
          ${args[1]}
        </div>
        <div class=close-button>✕</div>
      </div>
    `,
      {timeout},
    );
  }
}

export {
  addNotification,
  defaultTimeout,
  notify,
  removeNotification,
};
