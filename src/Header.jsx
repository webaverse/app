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

const characters = [
	{
		name: 'Scillia',
		imgSrc: 'characters/scillia.png',
		class: 'Drop Hunter',
	},
	{
		name: 'Drake',
		imgSrc: 'characters/drake.png',
		class: 'Hacker Supreme',
	},
	{
		name: 'Hyacinth',
		imgSrc: 'characters/hyacinth.png',
		class: 'Beast Painter',
	},
	{
		name: 'Juniper',
		imgSrc: 'characters/juniper.png',
		class: 'Academy Engineer',
	},
	{
		name: 'Anemone',
		imgSrc: 'characters/anemone.png',
		class: 'Lisk Witch',
	},
];

const colors = [
  // [
    0xcd782e,
    0xe5fec0,
  // ],
  // [
    0xc44d31,
    0xfffe83,
  // ],
  // [
    0xab2b44,
    0xfffe60,
  // ],
  // [
    0x912552,
    0xffed4c,
  // ],
  // [
    0x66217a,
    0xffa146,
  // ],
  // [
    0x532b8b,
    0xff7559,
  // ],
  // [
    0x2a3dab,
    0xff4a7d,
  // ],
  // [
    0x1755bb,
    0xf830a5,
  // ],
  // [
    0x0076c4,
    0xa93dec,
  // ],
  // [
    0x009fb4,
    0x5d67fa,
  // ],
  // [
    0x0dafad,
    0x457ffc,
  // ],
  // [
    0x49bf85,
    0x00c0fc,
  // ],
  // [
    0x69c776,
    0x00e8fc,
  // ],
  // [
    0x9bbe58,
    0x22fffe,
  // ],
  // [
    0xafad42,
    0x55fffc ,
  // ],
  // [
    0xc38b34,
    0xb5ffef,
  // ],
];
const Arrow = ({
	arrowPosition,
	arrowDown,
	animation,
	setAnimation,
	setOpen,
	svgData,
	characterPositions,
}) => {
	// const ref = useRef(null);
	const [svgDataBaked, setSvgDataBaked] = useState('');

	/* useEffect(() => {
	  console.log('got ref current', ref.current);
	}, [ref.current]); */

	useEffect(() => {
		if (svgData) {
			const domParser = new DOMParser();
			const doc = domParser.parseFromString(svgData, 'image/svg+xml');
			const gradient = doc.querySelector('linearGradient');
			const stops = Array.from(gradient.querySelectorAll('stop'));
			// console.log('got doc', stops);
			const xmlSerializer = new XMLSerializer();
			
			const arrowTime = 5000;
			const startTime = Date.now();
			let frame;
			const _recurse = () => {
				frame = setTimeout(() => {
					const now = Date.now();
					const fStart = ((now - startTime) % arrowTime) / arrowTime * colors.length;
					const fMid = (fStart + 0.5) % colors.length;
					const fEnd = (fStart + 1) % colors.length;
					const startColorIndex1 = Math.floor(fStart);
					const startColorIndex2 = Math.floor((fStart + 1) % colors.length);
					const startColorOffset = fStart - startColorIndex1;
					const midColorIndex1 = Math.floor(fMid);
					const midColorIndex2 = Math.floor((fMid + 1) % colors.length);
					const midColorOffset = fMid - midColorIndex1;
					const endColorIndex1 = Math.floor(fEnd);
					const endColorIndex2 = Math.floor((fEnd + 1) % colors.length);
					const endColorOffset = fEnd - endColorIndex1;
					
					localColor.setHex(colors[startColorIndex1]);
					localColor2.setHex(colors[startColorIndex2]);
					localColor3.setHex(colors[midColorIndex1]);
					localColor4.setHex(colors[midColorIndex2]);
					localColor5.setHex(colors[endColorIndex1]);
					localColor6.setHex(colors[endColorIndex2]);
					
					const doc2 = doc.cloneNode(true);
					// const linearGradient = doc2.querySelector('linearGradient');
					// window.linearGradient = linearGradient;
					const stops = Array.from(doc2.querySelectorAll('stop'));
					/* window.colors = [
					  localColor,
					  localColor2,
					  localColor3,
					  localColor4,
					  localColor5,
					  localColor6,
						startColorIndex1,
						startColorIndex2,
					]; */
					
					// window.offset = [startColorOffset, midColorOffset, endColorOffset];
					
					stops[0].style.stopColor = localColor.lerp(localColor2, startColorOffset).getStyle();
					stops[1].style.stopColor = localColor3.lerp(localColor4, midColorOffset).getStyle();
					stops[2].style.stopColor = localColor5.lerp(localColor6,endColorOffset).getStyle();
					
					const s = xmlSerializer.serializeToString(doc2);
					setSvgDataBaked(s);

				  _recurse();
					// console.log('set');
				}, 50);
		  };
			_recurse();
			return () => {
			  clearTimeout(frame);
			};
		}
	}, [svgData]);

  if (characterPositions) {
		return (
			<div
				className={styles.arrow + ' ' + (animation ? styles.animate : '')}
				style={{
					marginTop: '-30px',
					// marginLeft: '-100px',
					left: `${characterPositions[arrowPosition].x - 64}px`,
					// transform: arrowDown ? `scale(0.8)` : null,
				}}
				// ref={ref}
			>
			  <div className={styles.perspective} dangerouslySetInnerHTML={{__html: svgDataBaked}}></div>
			</div>
		);
  } else {
	  return null;
	}
};
const Character = ({character, i, animation, open, arrowPosition, setArrowDown, setArrowPosition2, characterPositions, appScriptLoaded}) => {
  const canvasRef = useRef();
	const [renderer, setRenderer] = useState(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			const width = characterPositions[0].width - 3*2;
	    const height = characterPositions[0].height - 3*2;
			setupAppCanvas({
				canvas,
				width,
				height,
			});
		}
	}, [canvasRef.current]);
	
	return (
		<div
			className={
				styles.character + ' ' +
				(arrowPosition === i ? styles.selected : '') + ' ' +
				((arrowPosition === i && animation) ? styles.animate : '') + ' ' +
				((arrowPosition === i && open) ? styles.open : '')
			}
			onMouseMove={() => {setArrowPosition2(i);}}
			onMouseDown={e => {
				setArrowDown(true);
				setTimeout(() => {
					setArrowDown(false);
				}, 200);
			}}
			key={i}
		>
			<div className={styles.inner}>
				<div className={styles.background}/>
				<div className={styles['img-wrap']}>
					<img src={character.imgSrc} />
				</div>
				{(appScriptLoaded && characterPositions) ? <canvas className={styles.canvas} ref={canvasRef} /> : null}
				<div className={styles.wrap}>
					<div className={styles.name}>{character.name}</div>
					<div className={styles.class}>The {character.class}</div>
				</div>
			</div>
		</div>
	);
};
const _formatCountdown = countdown => {
	let seconds = Math.floor(countdown/1000);
	const minutes = Math.floor(seconds/60);
  seconds -= minutes *60;
	return minutes + ':' + (seconds + '').padStart(2, '0');
};
const startCountdown = 10 * 60 * 1000;
export default function Home() {
	// console.log('index 2');
	
	const ref = useRef(null);
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
			/* if (animation) {
			  setAnimation(false);
			  setTimeout(() => {
				  setAnimation(true);
				});
			} else {
			  setAnimation(true);
			} */
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
			/* if (newCountdown > countdown) {
			  debugger;
			} */
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
	}, []);
	/* useEffect(() => {
	  const script = document.createElement('script');
		script.type = 'module';
		script.src = 'dropstorm.js';
		script.onload = () => {
		  setAppScriptLoaded(true);
		};
		document.body.appendChild(script);
	}, []); */
	
  /* const _handleContainerMouseMove = e => {
		setMouse([
		  (e.clientX - window.innerWidth/2) / (window.innerWidth/2),
		  (e.clientY - window.innerHeight/2) / (window.innerHeight/2),
	  ]);
	}; */

	return (
    <div
		  className={styles.container}
		  // onMouseMove={_handleContainerMouseMove}
		>
			<div className={styles.inner}>
				<header className={styles.header}>
				  <img src="images/dropstorm-01.svg" className={styles.logo} />
					<div className={styles.user}>
					  <img src="images/soul.png" className={styles.icon} />
						<div className={styles.name}>Geezer</div>
					</div>
				</header>
				
        {/* <img src="images/dropstorm-01.svg" className={styles.biglogo} /> */}
				
				<div className={styles.countdown}>Starts in {_formatCountdown(countdown)}</div>
				
				<div className={styles.heading}>&gt; Avatar select</div>
				<div className={styles.characterselect}>
					<Arrow
					  arrowPosition={arrowPosition}
						arrowDown={arrowDown}
						animation={animation}
						setAnimation={setAnimation}
						setOpen={setOpen}
						svgData={svgData}
						characterPositions={characterPositions}
				  />
					
					<div className={styles.characters} ref={ref}>
						{characters.map((character, i) => {
							return (
  							<Character
								  character={character}
									i={i}
								  animation={animation}
									open={open}
									arrowPosition={arrowPosition}
									setArrowDown={setArrowDown}
									setArrowPosition2={setArrowPosition2}
									characterPositions={characterPositions}
									appScriptLoaded={appScriptLoaded}
									key={i}
							  />
							);
						})}
					</div>
        </div>
      </div>
    </div>
  )
};