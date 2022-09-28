import React from 'react';
import classnames from 'classnames';
import styles from './modal.module.css';

export default class Modal extends React.Component {
  onClose = e => {
    this.props.onClose && this.props.onClose(e);
  };

  render() {
    const open = this.props.show;

    return (
      <div className={classnames(styles.modal, open ? styles.open : null)}>
        {this.props.children}
      </div>
    );
  }
}
