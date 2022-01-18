import React, {useState} from 'react'
import './GUI.css'
import Bar from  './UI/Bar'
import DialogBubble from './UI/DialogBubble'
// import DioramaPrompt from './UI/DioramaPrompt'

export default props=>{
  const [open, setOpen] = useState()

  window.toggle = setOpen

  return <div className="fixed top left fit-screen">
    <div className="relative fit">
      {/* <div className="absolute left fit-y black-tint column-reverse" style={{width: "25vw", color: "white"}}>
        <DioramaPrompt/>
        Account 'A' <br/>
        Character 'Tab' <br/>
        Editor 'E' <br/>
        Help 'Z' <br/> 
      </div> */}

      <div className="absolute row fit-x center bottom left" style={{padding: "5% 20%"}}>
        <DialogBubble open={open}/>
      </div>

      {/* <div className="absolute bottom row fit-x center">
        <Bar color="red"/>
        <Bar color="blue"/>
      </div> */}
    </div>
  </div>
}