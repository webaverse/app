import * as React from "react";
import styles from "./PopupNotification.module.css";
import { AppContext } from "./components/app";

const PopupNotification = function ({
  popupNotification
}) {
  const ref = React.useRef();
  const { setPopupNotification } = React.useContext( AppContext );

  React.useEffect(() => {
  if(popupNotification) {
    ref.current.style.opacity = 1;
  }
}, [popupNotification])

  React.useEffect(() => {
    if(popupNotification) {
      const timeout = setTimeout(() => {
        ref.current.style.opacity = 0;
        setPopupNotification(null);
      }, 5000)
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [popupNotification])
  return (
    <>
      {popupNotification && (
        <div ref={ref} className={styles.popupNotificationWrap}>{popupNotification}</div>
      )}
    </>
  );
};
export { PopupNotification };
