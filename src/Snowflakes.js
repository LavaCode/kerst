import React, { useEffect } from 'react';

const Snowflakes = () => {
  useEffect(() => {
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');
      snowflake.style.left = `${Math.random() * 100}%`;
      snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`;
      document.body.appendChild(snowflake);
      setTimeout(() => snowflake.remove(), 5000);
    };

    const snowflakeInterval = setInterval(createSnowflake, 300);

    return () => {
      clearInterval(snowflakeInterval);
    };
  }, []);

  return null;
};

export default Snowflakes;
