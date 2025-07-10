import React, { createContext, useRef, useEffect } from "react";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketsRef = useRef({});

  // ✅ JWT에서 userId 추출
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || payload.username;
    } catch (e) {
      console.error("❌ JWT 파싱 오류:", e);
      return null;
    }
  };

  // ✅ room, server 소켓은 항상 고정 연결
  if (!socketsRef.current["room"]) {
    // socketsRef.current["room"] = new WebSocket("ws://localhost:9099/ws/room");
    socketsRef.current["room"] = new WebSocket("ws://192.168.0.112:9099/ws/room");
  }
  if (!socketsRef.current["server"]) {
    socketsRef.current["server"] = new WebSocket("ws://192.168.0.112:9099/ws/server");
    // socketsRef.current["server"] = new WebSocket("ws://localhost:9099/ws/server");
  }

  // ✅ match 소켓은 userId 있을 때만 연결
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      console.warn("⚠️ JWT에서 userId 추출 실패 → match 소켓 연결 생략");
      return;
    }

    if (!socketsRef.current["match"]) {
      socketsRef.current["match"] = new WebSocket(`ws://192.168.0.112:9099/ws/match?userId=${userId}`);
      console.log("✅ match 소켓 연결됨:", userId);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={socketsRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
