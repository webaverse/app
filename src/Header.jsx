import React, {useState, useEffect, useRef} from 'react';
// import Head from 'next/head'
import {Color} from './Color.js';
// import Image from 'next/image'
import styles from './Header.module.css'

const localColor = new Color();
const localColor2 = new Color();
const localColor3 = new Color();
const localColor4 = new Color();
const localColor5 = new Color();
const localColor6 = new Color();

// console.log('index 1');

export default function Header() {
	// console.log('index 2');
	
	/* const ref = useRef(null);
  const [arrowPosition, _setArrowPosition] = useState(0);
  const [arrowDown, _setArrowDown] = useState(false);
  const [animation, setAnimation] = useState(false);
  const [open, setOpen] = useState(false);
  // const [mouse, setMouse] = useState([0, 0]);
	const [svgData, setSvgData] = useState('');
	const [countdown, setCountdown] = useState(startCountdown);
	const [characterPositions, setCharacterPositions] = useState(null);
	const [appScriptLoaded, setAppScriptLoaded] = useState(false);
	
	const setArrowPosition = n => {
		if (!open && arrowPosition !== n) {
			_setArrowPosition(n);
			const beep = document.getElementById('beep');
			beep.currentTime = 0;
			beep.play();
		}
	};
	const setArrowPosition2 = n => {
		if (!open && arrowPosition !== n) {
			_setArrowPosition(n);
		}
	};
	const setArrowDown = a => {
		_setArrowDown(a);
		if (!open && a) {
			const scillia = document.getElementById('scillia');
			scillia.currentTime = 0;
			scillia.play();
			const boop = document.getElementById('boop');
			boop.currentTime = 0;
			boop.play();
			setAnimation(true);
			setOpen(true);
		}
	};
	useEffect(() => {
		const keydown = e => {
			if (!open) {
				switch (e.which) {
					case 39: { // right
						let n = arrowPosition + 1;
						if (n >= characters.length) {
							n %= characters.length;
						}
						setArrowPosition(n);
						break;
					}
					case 37: { // left
						let n = arrowPosition - 1;
						if (n < 0) {
							n += characters.length;
						}
						setArrowPosition(n);
						break;
					}
					case 13: { // enter
						setArrowDown(true);
						break;
					}
				}
		  } else {
				switch (e.which) {
					case 27: { // escape
					  setAnimation(false);
					  setOpen(false);
					}
				}
			}
		};
		window.addEventListener('keydown', keydown);
		const keyup = e => {
			switch (e.which) {
			  case 13: {
					setArrowDown(false);
				  break;
				}
			}
		};
		window.addEventListener('keyup', keyup);
		return () => {
			window.removeEventListener('keydown', keydown);
		  window.removeEventListener('keyup', keyup);
		};
  }, [arrowPosition, arrowDown, animation, open]);
	useEffect(async () => {
		const res = await fetch('./images/arrow.svg');
		let text = await res.text();
		setSvgData(text);
	}, []);
	useEffect(async () => {
		const lastTimestamp = Date.now();
		const interval = setInterval(() => {
			const now = Date.now();
			const timeDiff = now - lastTimestamp;
			let newCountdown = countdown - timeDiff;
			// console.log('update', countdown, timeDiff, newCountdown);
			if (newCountdown <= 0) {
				newCountdown += startCountdown;
			}
			setCountdown(newCountdown);
		}, 100);
	  return () => {
		  clearInterval(interval);
		};
	}, []);
	useEffect(async () => {
		const onFocus = e => {
		  const audio = document.getElementById('song');
			// console.log('play', audio);
			if (audio.paused) {
			  audio.play();
			}
			// console.log('got audio', audio);
		};
		window.addEventListener('mousedown', onFocus);
		// window.addEventListener('focus', onFocus);
		window.addEventListener('keydown', onFocus);
		return () => {
      window.removeEventListener('mousedown', onFocus);
      // window.removeEventListener('focus', onFocus);
      window.removeEventListener('keydown', onFocus);
		};
	}, []);
	
	const _updateCharacterPositions = () => {
		const characters = Array.from(ref.current.children);
		if (characters.length > 0) {
			const characterPositions = characters.map(c => c.children[0].getBoundingClientRect());
			setCharacterPositions(characterPositions);
		} else {
			setCharacterPositions(null);
		}
	};
	useEffect(_updateCharacterPositions, [ref.current]);
	useEffect(() => {
		window.addEventListener('resize', _updateCharacterPositions);
		return () => {
		  window.removeEventListener('resize', _updateCharacterPositions);
		};
	}, []); */

	return (
    <div className={styles.container}>
			<div className={styles.inner}>
				<header className={styles.header}>
          <a href="/" className={styles.logo}>
				    <img src="images/arrow-logo.svg" className={styles.image} />
          </a>
					<div className={styles.user}>
					  <img src="images/soul.png" className={styles.icon} />
						<div className={styles.name}>Geezer</div>
					</div>
				</header>
      </div>
    </div>
  )
};