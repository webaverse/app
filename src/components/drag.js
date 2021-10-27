import React from 'react';
// import PropTypes from 'prop-types';

export const dropEffect = {
  All: 'all',
  Move: 'move',
  Copy: 'copy',
  Link: 'link',
  CopyOrMove: 'copyMove',
  CopyOrLink: 'copyLink',
  LinkOrMove: 'linkMove',
  None: 'none',
};

const draggingStyle = {
  opacity: 0.25,
};

const Draggable = props => {
  const [isDragging, setIsDragging] = React.useState(false);
  const image = React.useRef(null);

  React.useEffect(() => {
    image.current = null;
    if (props.dragImage) {
      image.current = new Image();
      image.current.src = props.dragImage;
    }
  }, [props.dragImage]);

  const startDrag = ev => {
    setIsDragging(true);
    ev.dataTransfer.setData('drag-item', props.dataItem);
    ev.dataTransfer.effectAllowed = props.dropEffect;
    if (image.current) {
      ev.dataTransfer.setDragImage(image.current, 0, 0);
    }
  };

  const dragEnd = () => setIsDragging(false);

  return (
    <div style={isDragging ? draggingStyle : {}} draggable onDragStart={startDrag} onDragEnd={dragEnd}>
      {props.children}
    </div>
  );
};

/* Draggable.propTypes = {
  dataItem: PropTypes.string.isRequired,
  dragImage: PropTypes.string,
  dropEffect: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}; */

Draggable.defaultProps = {
  dragImage: null,
  dropEffect: dropEffect.All,
};

const DropTarget = props => {
  const [isOver, setIsOver] = React.useState(false);

  const dragOver = ev => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = props.dropEffect;
  };

  const drop = ev => {
    const droppedItem = ev.dataTransfer.getData('drag-item');
    if (droppedItem) {
      props.onItemDropped(ev, droppedItem);
    }
    setIsOver(false);
  };

  const dragEnter = ev => {
    ev.dataTransfer.dropEffect = props.dropEffect;
    setIsOver(true);
  };

  const dragLeave = () => setIsOver(false);

  return (
    <div
      onDragOver={dragOver}
      onDrop={drop}
      onDragEnter={dragEnter}
      onDragLeave={dragLeave}
    >
      {props.children}
    </div>
  );
};

/* DropTarget.propTypes = {
  onItemDropped: PropTypes.func.isRequired,
  dropEffect: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
}; */

DropTarget.defaultProps = {
  dropEffect: dropEffect.All,
};

export const Drag = Draggable;
export const Drop = DropTarget;
