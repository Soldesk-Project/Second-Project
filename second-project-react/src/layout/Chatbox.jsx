import React from 'react';
import '../css/chatbox.css';

const Chatbox = () => {
  return (
    <div className="chat-container">
      <button>전체</button>
      <button>귓속말</button>
      <div className="chat-screen">

      </div>
      <div className="chat-input">
        <input type="text" id="chatInput"/>
        <button id="emojiBtn" className="emojiBtn">😊</button>
        <button id="sendBtn" className="sendBtn">전달</button>
      </div>
    </div>
  );
};

export default Chatbox;