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
      const timeoutFade = setTimeout(() => {
        ref.current.style.opacity = 0;
      }, 3000)
      const timeout = setTimeout(() => {
        ref.current.style.opacity = 0;
        setPopupNotification(null);
      }, 3500)
      return () => {
        clearTimeout(timeout,timeoutFade);
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
