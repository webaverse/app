import React from "react";
import "./modal.css";

export default class Modal extends React.Component {
  onClose = e => {
    this.props.onClose && this.props.onClose(e);
  };
  render() {
    if (!this.props.show) {
      return null;
    }
    return (
      <div className="modal" id="modal">
        {/* <h2>Modal Window</h2> */}
        <div className="content">{this.props.children}

        {/* <div className="actions">
          <button className="toggle-button" onClick={this.onClose}>
            close
          </button>
        </div> */}
        </div>
      </div>
    );
  }
}