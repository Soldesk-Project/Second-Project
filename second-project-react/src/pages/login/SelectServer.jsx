import React from 'react';
import { Link } from 'react-router-dom';

const SelectServer = () => {
  return (
    <div className='selectServer'>
      <ul>
        <Link to={'/main/1'}><li>1서버</li></Link>
        <Link to={'/main/2'}><li>2서버</li></Link>
        <Link to={'/main/3'}><li>3서버</li></Link>
        <Link to={'/main/4'}><li>4서버</li></Link>
        <Link to={'/main/5'}><li>5서버</li></Link>
        <Link to={'/main/6'}><li>6서버</li></Link>
      </ul>
    </div>
  );
};

export default SelectServer;