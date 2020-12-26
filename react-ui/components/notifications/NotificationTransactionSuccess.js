import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../../web_modules/htm.js';
import css from '../../web_modules/csz.js'

const styles = css`${window.locationSubdirectory}/components/notifications/Notification.css`;
const successIcon = window.locationSubdirectory + "/images/Notification_Icon_Success.svg";

const html = htm.bind(React.createElement)

const NotificationTransactionSuccess = () => {
  console.log("Notification error");
    return html`
        <div className="${styles}">
            <div className="notification">
                <div className="notificationIcon notificationIconSuccess">
                    <img src="${successIcon}"/>
                </div>
                <div className="notificationDescription">
                    <span className="notificationTitle">Transaction successful.</span>
                    <span className="notificationValue">Something went wrong. Please try your request again.</span>
                </div>
            </div>
        </div>
    `;
  };

export default NotificationTransactionSuccess;