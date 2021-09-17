import React, {useState, useEffect, useRef} from 'react'

export default () => {
  return (
    <footer>
      <div className="helper left">
        <div className="loadout" id="loadout">
          {(() => {
            const numItems = 8;
            const items = Array(numItems);
            for (let i = 0; i < numItems; i++) {
              items[i] = (
                <div className="item" key={i}>
                  <div className="box"></div>
                  <div className="label">{i}</div>
                </div>
              );
            }
            return items;
          })()}
        </div>
      </div>
      <div className="helper right">
        <div className="chat" id="chat">
          <div className="messages" id="chat-messages"></div>
          <input type="text" className="input" id="chat-input" />
        </div>
        <div className="keys">
          <div className="label">Move</div>
          <div className="row">
            <div className="key"></div>
            <div className="key">W</div>
            <div className="key"></div>
          </div>
          <div className="row">
            <div className="key">A</div>
            <div className="key">S</div>
            <div className="key">D</div>
          </div>
        </div>
        <div className="keys">
          <div className="row"></div>
          <div className="row">
            <div className="label center">Fly</div>
            <div className="key">F</div>
          </div>
        </div>
        <div className="keys">
          <div className="row"></div>
          <div className="row">
            <div className="label center">Camera</div>
            <div className="key"><i className="far fa-mouse-alt"></i></div>
          </div>
        </div>
        <div className="keys">
          <div className="row"></div>
          <div className="row">
            <div className="label center">Talk</div>
            <div className="key" id="key-t">T</div>
          </div>
        </div>
        <div className="keys">
          <div className="row"></div>
          <div className="row">
            <div className="label center">Upload</div>
            <div className="key" id="key-t">U</div>
          </div>
        </div>
        <div className="keys">
          <div className="row"></div>
          <div className="row">
            <div className="label center">Text chat</div>
            <div className="key" id="key-enter">Enter</div>
          </div>
        </div>
        <nav className="enter-xr-button" id="enter-xr-button" style={{display: 'none'}}>Enter XR</nav>
        <nav className="enter-xr-button disabled" id="no-xr-button">No XR</nav>
      </div>
    </footer>
  );
};