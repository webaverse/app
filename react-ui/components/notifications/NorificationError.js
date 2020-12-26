import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../../web_modules/htm.js';
import css from '../../web_modules/csz.js'

const styles = css`${window.locationSubdirectory}/components/notifications/Notification.css`;
const errorIcon = window.locationSubdirectory + "/images/Notification_Icon_Error.svg";

const html = htm.bind(React.createElement)

const NotificationError = () => {
  console.log("Notification error");
    return html`
        <div className="${styles}">
            <div className="notification">
                <div className="notificationIcon notificationIconError">
                    <img src="${errorIcon}"/>
                </div>
                <div className="notificationDescription">
                    <span className="notificationTitle">An error was encountered.</span>
                    <span className="notificationValue">Something went wrong. Please try your request again.</span>
                </div>
            </div>
        </div>
    `;
  };

export default NotificationError;