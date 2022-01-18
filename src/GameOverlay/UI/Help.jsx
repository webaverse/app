import React from 'react'

export default ({open, className, style}) => <div className={`${open ? "visible" : "invisible"} ${className}`} style={style}/>