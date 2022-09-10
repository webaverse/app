import React, { useEffect, useRef, useState } from "react";
import { IconCollection } from "./IconCollection";
import styles from "./IconButton.module.css";
import classnames from "classnames";

const defaultIconColor = "#CCCCCC";

async function getSVG(iconName) {
  const icon = IconCollection.find((item) => item.name === iconName);
  console.log("ICON: ", icon)
  return await fetch(icon.file)
    .then((res) => res.text())
    .then((res) => {
      const parser = new DOMParser();
      const svgDom = parser.parseFromString(res, "image/svg+xml");
      return svgDom.firstElementChild;
    });
}

export default function IconButton(props) {
  const { size, icon, className, onClick } = props;
  const svgRef = useRef(null);
  useEffect(() => {
    if (icon) {
      getSVG(icon).then((res) => {
        svgRef.current.innerHTML = "";
        if (res) {
          res.classList.add(styles.icon);
          svgRef.current.append(res);
        }
      });
    }
  }, []);

  return (
    <div className={ classnames(className, styles.iconButtonWrap) } style={{ height: size }} onClick={onClick}>
        <svg width="82" height="72" viewBox="0 0 82 72" className={styles.buttonBackground} xmlns="http://www.w3.org/2000/svg">
            <path 
                d="M5 2H2.8711L3.00389 4.12476L7.00389 68.1248L7.1211 70H9H74H75.9084L75.9978 68.0937L78.9978 4.09365L79.0959 2H77H5Z" 
                className={styles.buttonBackgroundColor}
                stroke="black" 
                strokeWidth="4"/>
        </svg>
        <span ref={svgRef} className={styles.iconWrap}></span>
    </div>
  );
}
