import React, { useState, useEffect, useContext } from "react";
import classnames from "classnames";

import { RenderMirror } from "./RenderMirror";
import { RainFx } from "./RainFx";
import { AppContext } from "../../app";
import { loadingManager } from "../../../../loading-manager";

import styles from "./zone-title-card.module.css";

const logoImages = [
  "images/logos/upstreet1.png",
  "images/logos/upstreet2.png",
  "images/logos/upstreet3.png",
];

const logoImage = logoImages[Math.floor(Math.random() * logoImages.length)];

export const ZoneTitleCard = () => {
  const [detail, setDetail] = useState({});
  const { app } = useContext(AppContext);
  const [open, setOpen] = useState(true);
  // const [logoImage, setLogoImage] = useState(
  //   logoImages[Math.floor(Math.random() * logoImages.length)]
  // );
  const [loadProgress, setLoadProgress] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [isShowOverlay, setOverlay] = useState(true);
  const [isFontLoaded, setFontLoaded] = useState(false);
  const [isImageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    function loadingscreenopen(e) {
      const { isOpen } = e.data;
      if (isOpen !== undefined) {
        setOpen(isOpen);
      }
    }
    function loadingscreenprogress(e) {
      const { progress } = e.data;
      if (progress !== undefined) {
        let loadProgress = (progress / 100) % 1;
        if (progress === 100) loadProgress = 1;
        setLoadProgress(loadProgress);
      }
    }
    function loadingscreenfullloaded() {
      setFullLoaded(true);
    }
    function setDetailEvent(e) {
      e && setDetail(e.data || {});
    }

    document.fonts.ready.then(() => {
      setFontLoaded(true);
    });

    loadingManager.addEventListener("loadingscreenopen", loadingscreenopen);
    loadingManager.addEventListener(
      "loadingscreenprogress",
      loadingscreenprogress
    );
    loadingManager.addEventListener(
      "loadingscreenfullloaded",
      loadingscreenfullloaded
    );
    window.addEventListener("detailChanged", setDetailEvent);
    return () => {
      loadingManager.removeEventListener(
        "loadingscreenopen",
        loadingscreenopen
      );
      loadingManager.removeEventListener(
        "loadingscreenprogress",
        loadingscreenprogress
      );
      loadingManager.removeEventListener(
        "loadingscreenfullloaded",
        loadingscreenfullloaded
      );
      window.removeEventListener("detailChanged", setDetailEvent);
    };
  }, []);

  useEffect(() => {
    if (isFontLoaded && isImageLoaded) {
      setOverlay(false);
    }
  }, [isFontLoaded, isImageLoaded]);

  const title = detail.title || "Webaverse";
  const description = detail.description || "Entering World";
  const comment = detail.comment || "";

  return (
    <>
      <div
        className={classnames(
          styles.zoneTitleCard,
          open && !isShowOverlay ? styles.showZoneTitleCard : null
        )}
      >
        <div className={styles.leftWingWrapper}>
          <div className={styles.leftWing}>
            <div className={styles.block}>
              <img
                className={classnames(
                  styles.logoImage,
                  open && !isShowOverlay && styles.showLogo
                )}
                src={logoImage}
              />
            </div>
            <img
              className={styles.tailImg}
              src="images/snake-tongue.svg"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
        <div className={styles.mainSectionWrapper}>
          <div className={styles.mainSection}>
            <div className={styles.rightSection}>
              {
                <RenderMirror
                  app={app}
                  width={128}
                  enabled={open && fullLoaded}
                />
              }
              <div
                className={classnames(
                  styles.title,
                  open && !isShowOverlay && styles.showTitle
                )}
              >
                <div className={styles.background} />
                <div className={styles.text}>{title}</div>
              </div>
              <div
                className={classnames(
                  styles.description,
                  open && !isShowOverlay && styles.showDescription
                )}
              >
                <div className={styles.background} />
                <div className={styles.text}>{description}</div>
              </div>
              <div
                className={classnames(
                  styles.comment,
                  open && !isShowOverlay && styles.showComment
                )}
              >
                {comment}
              </div>
            </div>
            <div
              className={classnames(
                styles.bottomSection,
                open && !isShowOverlay && styles.showBottomSection
              )}
            >
              <div className={styles.loadingBar}>
                <div className={styles.label}>Loading</div>
                <progress
                  className={styles.loadProgress}
                  value={loadProgress}
                />
                <img
                  src="images/loading-bar.svg"
                  className={styles.loadProgressImage}
                />
              </div>
            </div>
          </div>
        </div>
        {/* <RainFx app={app} enabled={open} /> */}
      </div>
      <div
        className={classnames(
          styles.overlay,
          isShowOverlay ? styles.showOverlay : null
        )}
      ></div>
    </>
  );
};
