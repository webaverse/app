// import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import styles from './news-reel.module.css';
import version from '../../../../version.json';
import {generateGlyph} from '../../../../glyph-generator.js';

import conceptsJson from './concepts.json';

//

const numGlyphs = 10;
const glyphWidth = 7;

const minTimeoutTime = 4 * 1000;
const maxTimeoutTime = 10 * 1000;

const conceptNaturalWidth = 1024;
const conceptNaturalHeight = 1008;
const conceptWidth = 150;
const conceptHeight = Math.floor(conceptWidth / conceptNaturalWidth * conceptNaturalHeight);
const imageGridWidth = 480;

//

const conceptRate = 0.5;
class ConceptManager {
  constructor({
    concepts = [],
  } = {}) {
    this.concepts = concepts.slice();
  }
  getConcept() {
    const f = Math.random();
    if (f < conceptRate) {
      const conceptIndex = Math.floor(Math.random() * this.concepts.length);
      const concept = this.concepts.splice(conceptIndex, 1)[0];
      return concept;
    } else {
      return null;
    }
  }
  freeConcept(concept) {
    this.concepts.push(concept);
  }
}
const conceptManager = new ConceptManager({
  concepts: conceptsJson,
});

//

const glyphHeight = glyphWidth;
const useGlyphs = (() => {
  let glyphs = null;
  return () => {
    if (!glyphs) {
      glyphs = Array(numGlyphs);
      for (let i = 0; i < numGlyphs; i++) {
        glyphs[i] = generateGlyph(i + '', {
          // width: glyphWidth,
          // height: glyphHeight,
          color: 0x111111,
        });
      }
    }
    return glyphs;
  };
})();

//

const Glyph = ({
  position = [0, 0],
  animationDelay,
  animationDuration,
  scale,
} = {}) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const glyphs = useGlyphs();
      const ctx = canvas.getContext('2d');

      const _render = () => {
        const index = Math.floor(Math.random() * numGlyphs);
        const glyph = glyphs[index];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(glyph, 0, 0, canvas.width, canvas.height);
      };
      _render();
    }
  }, [canvasRef.current]);

  return (
    <div
      className={styles.glyph}
      style={{
        // top: `${position[1]}px`,
        left: `${position[0]}px`,
        animationDelay,
        animationDuration,
        transform: `scale(${scale})`,
      }}
    >
      <canvas
        width={glyphWidth}
        height={glyphHeight}
        className={styles.canvas}
        style={{
          animationDelay,
        }}
        ref={canvasRef}
      />
    </div>
  );
};

const Glyphs = () => {
  const glyphs = Array(numGlyphs);
  for (let i = 0; i < numGlyphs; i++) {
    const x = -conceptWidth + (Math.random() * (imageGridWidth + (conceptWidth * 2)));
    const y = Math.random() * 300;
    const animationDelay = (Math.random() * 1) + 's';
    
    const minDuration = 0.5;
    const maxDuration = 2;
    const animationDuration = (Math.random() * (maxDuration - minDuration)) + minDuration + 's';
    
    const minScale = 0.7;
    const maxScale = 1.3;
    const scale = (Math.random() * (maxScale - minScale)) + minScale;
    glyphs[i] = (
      <Glyph
        position={[x, y]}
        animationDelay={animationDelay}
        animationDuration={animationDuration}
        scale={scale}
        key={i}
      />
    );
  }
  return (
    <>
      {glyphs}
    </>
  );
};

//

const Concept = ({
  // concept: initialConcept,
  // concepts,
  // hovered,
  onMouseEnter,
  onMouseLeave,
  index = -1,
} = {}) => {
  const [concept, setConcept] = useState(null);
  const [flash, setFlash] = useState(false);

  /* hovered={hoveredConceptIndex === index}
  onMouseEnter={() => {
    setHoveredConceptIndex(index);
  }}
  onMouseLeave={() => {
    setHoveredConceptIndex(-1);
  }} */

  let timeout1 = 0;
  useEffect(() => {
    const _render = ({
      flash,
    }) => {
      const oldConcept = concept;
      if (oldConcept) {
        conceptManager.freeConcept(oldConcept);
      }

      const newConcept = conceptManager.getConcept();
      setConcept(newConcept);

      if (flash) {
        setFlash(true);
        timeout1 = setTimeout(() => {
          setFlash(false);
        }, 0);
      }
    };
    _render({
      flash: false,
    });

    let timeout2 = 0;
    const _recurse = () => {
      const timeoutTime = (Math.random() * (maxTimeoutTime - minTimeoutTime)) + minTimeoutTime;
      timeout2 = setTimeout(() => {
        _render({
          flash: true,
        });
        _recurse();
      }, timeoutTime);
    };
    _recurse();
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  const conceptSrc = concept ? `/images/concepts/${concept}` : null;

  return (
    <div
      className={classnames(styles.imageGridItem, flash ? styles.flash : null)}
      style={{
        width: conceptWidth,
        height: conceptHeight,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      key={index}
    >
      <div className={classnames(styles.content, concept ? styles.visible : null)}>
        <div className={styles.text}>Character creator</div>
        {conceptSrc ? (
          <img
            src={conceptSrc}
            className={styles.img}
            style={{
              width: conceptWidth,
              height: conceptHeight,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

//

const NewsImageGrid = ({
  hoveredConcept,
  setHoveredConcept,
}) => {
  // const [concepts, setConcepts] = useState([]);
  const [numConceptsWidth, setNumConceptsWidth] = useState(0);
  const [numConceptsHeight, setNumConceptsHeight] = useState(0);
  const gridRef = useRef();
  
  // console.log('concept height', conceptHeight);

  const _updateConcepts = ({
    force = false,
  } = {}) => {
    const gridEl = gridRef.current;
    if (gridEl) {
      const gridRect = gridEl.getBoundingClientRect();
      const newNumConceptsWidth = Math.floor(gridRect.width / conceptWidth);
      const newNumConceptsHeight = Math.floor(gridRect.height / conceptHeight);
      if (
        (newNumConceptsWidth !== numConceptsWidth || newNumConceptsHeight !== numConceptsHeight) ||
        force
      ) {
        setNumConceptsWidth(newNumConceptsWidth);
        setNumConceptsHeight(newNumConceptsHeight);
      }
    }
  };

  useEffect(() => {
    _updateConcepts();

    function resize(e) {
      _updateConcepts();
    }
    globalThis.addEventListener('resize', resize);
    
    return () => {
      globalThis.removeEventListener('resize', resize);
      // clearInterval(interval);
    };
  }, [gridRef.current, numConceptsWidth, numConceptsHeight]);

  const numConcepts = numConceptsWidth * numConceptsHeight;
  const concepts = Array(numConcepts);
  for (let i = 0; i < numConcepts; i++) {
    concepts[i] = null;
  }

  return (
    <>
      <Glyphs />
      <div className={styles.imageGrid} ref={gridRef}>
        {concepts.map((concept, index) => {
          return (
            <Concept
              // concept={concept}
              // concepts={concepts}
              // hovered={hoveredConceptIndex === index}
              onMouseEnter={() => {
                setHoveredConcept(concept);
              }}
              onMouseLeave={() => {
                setHoveredConcept(null);
              }}
              index={index}
              key={index}
            />
          );
        })}
      </div>
    </>
  );
};

//

export const NewsReel = () => {
  const [hoveredConcept, setHoveredConcept] = useState(null);
  
  return (
    <div className={styles.newsReel}>
      <h2>Offline Dev Alpha {version}</h2>
      {/* <p>The steet is generating!</p>
      <p>Try worlds, weapons, charas, AIs, and unannounced secret features in this pre-season alpha. Webaverse is built in the open.</p>
      <p>Ambition can't wait and your heart is pure? Build on your own instance. Your content will carry over to the multiplayer Street.</p>
      <p>And DW! On your parcels will be able to have your own annoying popups!!</p>
      <p>watch out of bugs, watch out of the lisk ;)</p>
      <sub>signed, lisk</sub> */}
      {/* <img className={styles.background} src="/images/field.png" /> */}
      <NewsImageGrid
        hoveredConcept={hoveredConcept}
        setHoveredConcept={setHoveredConcept}
      />
    </div>
  );
};