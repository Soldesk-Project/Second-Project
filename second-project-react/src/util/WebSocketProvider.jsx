import React, { createContext, useRef } from "react";
export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketsRef = useRef({});

  

  // 여러 엔드포인트에 대해 소켓 생성
  if (!socketsRef.current['room']) {
    socketsRef.current['room'] = new WebSocket("ws://192.168.0.112:9099/ws/room");
    // socketsRef.current['room'] = new WebSocket("ws://localhost:9099/ws/room");
  }
  if (!socketsRef.current['server']) {
    socketsRef.current['server'] = new WebSocket("ws://192.168.0.112:9099/ws/server");
    // socketsRef.current['server'] = new WebSocket("ws://localhost:9099/ws/server");
  }

  if(!socketsRef.current['match']){
    socketsRef.current['match'] = new WebSocket("ws://192.168.0.112:9099/ws/match");
  }

  return (
    <WebSocketContext.Provider value={socketsRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
