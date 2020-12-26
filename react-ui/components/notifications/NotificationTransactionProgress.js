import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../../web_modules/htm.js';
import css from '../../web_modules/csz.js'

const styles = css`${window.locationSubdirectory}/components/notifications/Notification.css`;
const progressIcon = window.locationSubdirectory + "/images/Notification_Icon_Progress.svg";

const html = htm.bind(React.createElement)

const NotificationTransactionProgress = () => {
  console.log("Notification error");
    return html`
        <div className="${styles}">
            <div className="notification">
                <div className="notificationIcon notificationIconProgress">
                    <span></span>
                    <img src="${progressIcon}"/>
                </div>
                <div className="notificationDescription">
                    <span className="notificationTitle">Transaction in progress.</span>
                    <span className="notificationValue">We’ll let you know when the transaction is complete.</span>
                </div>
            </div>
        </div>
    `;
  };

export default NotificationTransactionProgress;