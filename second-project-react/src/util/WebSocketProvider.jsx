import React, { createContext, useRef } from "react";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketsRef = useRef({});

  // ✅ JWT에서 userId 추출
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token"); // 실제 저장 키 확인 필요
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || payload.username; // 실제 payload 구조에 맞게 수정
    } catch (e) {
      console.error("❌ JWT 파싱 오류:", e);
      return null;
    }
  };

  // 🟡 기존 room, server는 고정 주소 사용
  if (!socketsRef.current["room"]) {
    socketsRef.current["room"] = new WebSocket("ws://localhost:9099/ws/room");
    // socketsRef.current["room"] = new WebSocket("ws://192.168.0.112:9099/ws/room");
  }
  if (!socketsRef.current["server"]) {
    socketsRef.current["server"] = new WebSocket("ws://192.168.0.112:9099/ws/server");
    // socketsRef.current["server"] = new WebSocket("ws://localhost:9099/ws/server");
  }

  // ✅ match 소켓만 userId 포함
  if (!socketsRef.current["match"]) {
    const userId = getUserIdFromToken();
    if (userId) {
      socketsRef.current["match"] = new WebSocket(`ws://192.168.0.112:9099/ws/match?userId=${userId}`);
    } else {
      console.warn("⚠️ JWT에서 userId 추출 실패 → match 소켓 연결 생략");
    }
  }

  return (
    <WebSocketContext.Provider value={socketsRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
