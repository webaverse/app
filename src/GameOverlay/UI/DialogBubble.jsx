import React from 'react'
import './DialogBubble.css'

export default ({open}) => {
  const style = {
    margin: open ? "0%" : "-2.5% 0%",
    transition: "opacity 0.5s, margin 0.5s",
  }
  return <div className={`text-white column dialog-background ${open ? "visible" : "invisible"}`} style={style}>
    <div className="fit column dialog-content">
      <div className="relative grow">
        <div className="absolute bottom fit-x center row size-2" style={{transform: "translate(0%,8px)", textShadow: "0px 0px 4px black"}}>
          {/* <div className="dialog-floating click pointer"><i className="down arrow size-2"/></div> */}
          <div className="click pointer neutra-book row center">
            <div style={{marginRight: "0.5rem"}}>
              <i className="arrow side"/>
            </div>
            <h4 style={{margin: 0}}>Yes! Let's do it!</h4>
          </div>
          <div className="click pointer neutra-book row center">
            <div style={{marginRight: "0.5rem"}}>
              <i className="arrow side"/>
            </div>
            <h4 style={{margin: 0}}>Hmmm... I'm not sure</h4>
          </div>
        </div>
        <div className="row neutra-bold size-larger center" style={{color: "#ec407a", paddingBottom: "4px"}}>Speaker</div>
        <div className="dialog-breaker"/>
        <p align="center" className="neutra-bold size-larger" style={{margin: "0", marginBottom: "1.5rem", padding: "4px 0.5rem", paddingTop: "0.5rem"}}>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's 
          standard dummy text ever since the 1500s, when an unknown printer took a 
          galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
          electronic typesetting, remaining essentially unchanged.
        </p>
      </div>
    </div>
  </div>
}