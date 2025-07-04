import React from 'react';
import styles from '../css/loading.module.css';

const Loading = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loading}></div>
    </div>
  );
};

export default Loading;