import React from 'react';

export default ({errors}) => {
  return (
    <div>
      <h1>Browser not supported</h1>
      <p>Your browser is missing the following required features:</p>
      <ul>
        {errors.map((error, i) => {
          return (
            <li key={i}>{error}</li>
          );
        })}
      </ul>
      <p>Supported browsers include Chrome, Safari or Opera.</p>
    </div>
  );
};
