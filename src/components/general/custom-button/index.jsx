import React, { useEffect, useRef, useState } from "react";
import { IconCollection } from "./IconCollection";
import styles from "./CustomButton.module.css";
import classnames from "classnames";

async function getSVG(iconName) {
    const icon = IconCollection.find(item => item.name === iconName);
    console.log("ICON: ", icon);
    return await fetch(icon.file)
        .then(res => res.text())
        .then(res => {
            const parser = new DOMParser();
            const svgDom = parser.parseFromString(res, "image/svg+xml");
            return svgDom.firstElementChild;
        });
}

export default function CustomButton(props) {
    const { size, icon, className, onClick, theme, type, text, onMouseEnter } = props;
    const svgRef = useRef(null);

    useEffect(() => {
        if (icon) {
            getSVG(icon).then(res => {
                svgRef.current.innerHTML = "";
                if (res) {
                    res.classList.add(styles.icon);
                    svgRef.current.append(res);
                }
            });
        }
    }, []);

    if (type && type === "login") {
        return (
            <div
                className={classnames(
                    className,
                    styles.iconButtonWrap,
                    theme && theme === "dark" ? styles.dark : styles.light,
                )}
                style={{ height: size }}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
            >
                <svg
                    width="71"
                    height="67"
                    viewBox="0 0 71 67"
                    className={styles.buttonBackground}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M2 2H68.8452L64.1437 65H2V2Z"
                        className={styles.buttonBackgroundColor}
                        fill="#D9D9D9"
                        stroke="#050B0E"
                        strokeWidth="4"
                    />
                    <path
                        d="M9 9H62L58.2676 58H9V9Z"
                        fill="#050B0E"
                        className={styles.innerBackgroundColor}
                    />
                </svg>
                <span ref={svgRef} className={styles.iconWrap}></span>
            </div>
        );
    } else if (type && type === "icon") {
        return (
            <div
                className={classnames(
                    className,
                    styles.iconButtonWrap,
                    theme && theme === "dark" ? styles.dark : styles.light,
                )}
                style={{ height: size }}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
            >
                <svg
                    className={styles.buttonBackground}
                    width="69"
                    height="63"
                    viewBox="0 0 69 63"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M5 2H2.85562L3.00485 4.13918L6.7903 58.4048L6.9201 60.2656H8.78545H62.6772H64.6178L64.6763 58.3259L66.3135 4.06031L66.3756 2H64.3144H5Z"
                        fill="#efefef"
                        className={styles.buttonBackgroundColor}
                        stroke="black"
                        strokeWidth="4"
                    />
                    <path
                        d="M8.77795 7.28503H61.7957L59.8437 54.7911H11.367L8.77795 7.28503Z"
                        fill="black"
                        className={styles.innerBackgroundColor}
                    />
                </svg>
                <span ref={svgRef} className={styles.iconWrap}></span>
            </div>
        );
    } else {
        return (
            <button
                className={classnames(
                    className,
                    styles.buttonWrap,
                    theme && theme === "dark" ? styles.dark : styles.light,
                )}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
            >
                <div
                    className={styles.innerWrap}
                    style={{ fontSize: size }}
                >
                    {icon && (
                        <span ref={svgRef} className={styles.buttonIconWrap} style={{ height: size, width: size }}></span>
                    )}
                    {text && text}
                </div>
            </button>
        );
    }
}
