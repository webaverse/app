import React, { Component } from "react";
import PropTypes from "prop-types";
import Tab from "./Tab";

class Tabs extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Array).isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      activeTab: this.props.children[0].props.label,
    };
  }

  onClickTabItem = (tab) => {
    this.setState({ activeTab: tab });
  };

  render() {
    const {
      onClickTabItem,
      props: { children },
      state: { activeTab },
    } = this;

    return (
        <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gruppo&display=swap');
        @import url("https://fonts.googleapis.com/css?family=Sacramento&display=swap");
          .tab-list {
            font-family: "Gruppo";

            display: flex;
            // border-bottom: 1px solid #ccc;
            padding-left: 20px;
          }
          
          .tab-list-item {

            // border: .5px solid #f1e505;
            border-radius: 10px;
            box-shadow: 1px 1px 25px 10px #f1e505

            color: lightyellow;
            text-shadow:
            0 0 7px #f1e505,
            0 0 10px #f1e505,
            0 0 21px #f1e505,
            0 0 42px #f1e505,
            0 0 82px #f1e505,
            0 0 92px #f1e505,
            0 0 102px #f1e505,
            0 0 151px #f1e505;
            display: inline-block;
            font-size: 20px;
            list-style: none;
            margin-bottom: -1px;
            padding: 0.5rem 0.75rem;
            font-family: "Gruppo";

          }
          
          .tab-list-active {
            border: .5px solid #f1e505;
            font-family: "Gruppo";

            // background-color: white;

          }

              `}
        </style>
      <div className="tabs">
        <ol className="tab-list">
          {children.map((child) => {
            const { label } = child.props;

            return (
              <Tab
                activeTab={activeTab}
                key={label}
                label={label}
                onClick={onClickTabItem}
              />
            );
          })}
        </ol>
        <div className="tab-content">
          {children.map((child) => {
            if (child.props.label !== activeTab) return undefined;
            return child.props.children;
          })}
        </div>
      </div>
      </>
    );
  }
}

export default Tabs;