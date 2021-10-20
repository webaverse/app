import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from 'classnames';
import styles from './Tabs.module.css';

class Tab extends Component {
  static propTypes = {
    activeTab: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  onClick = () => {
    const { label, onClick } = this.props;
    onClick(label);
  };

  render() {
    const {
      onClick,
      props: { activeTab, label },
    } = this;

    let className = ["tab-list-item"];

    if (activeTab === label) {
      className.push(" tab-list-active");
    }

    return (
      <li className={classnames(styles[className[0]], styles[className[1]])} onClick={onClick}>
        {label}
      </li>
    );
  }
}

export default Tab;