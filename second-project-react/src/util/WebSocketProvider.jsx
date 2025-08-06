import React, { createContext, useRef, useEffect } from "react";
export const WebSocketContext = createContext();
export const WebSocketProvider = ({ children }) => {
  const socketsRef = useRef({});
  // :흰색_확인_표시: JWT에서 userId 추출
  const getUserInfoFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId || payload.sub || payload.username || null,
        userNo: payload.userNo || payload.user_no || null
      };
    } catch (e) {
      console.error("JWT 파싱 오류:", e);
      return null;
    }
  };

  // :흰색_확인_표시: room, server 소켓은 항상 고정 연결
  if (!socketsRef.current["room"]) {
    // socketsRef.current["room"] = new WebSocket("ws://localhost:9099/ws/room");
    socketsRef.current["room"] = new WebSocket("ws://192.168.0.112:9099/ws/room");
  }

  useEffect(() => {
    if (!socketsRef.current["server"]) {
      socketsRef.current["server"] = new WebSocket("ws://192.168.0.112:9099/ws/server");
      // socketsRef.current["server"] = new WebSocket("ws://localhost:9099/ws/server");
    }
  }, []);

  // :흰색_확인_표시: match 소켓은 userId 있을 때만 연결
  useEffect(() => {
    const { userId } = getUserInfoFromToken() || {};
    if (!userId) {
      console.warn(":경고: JWT에서 userId 추출 실패 → match 소켓 연결 실패");
      return;
    }
    if (!socketsRef.current["match"]) {
      socketsRef.current["match"] = new WebSocket(`ws://192.168.0.112:9099/ws/match?userId=${userId}`);
    }
  }, []);

  useEffect(() => {
    const { userNo } = getUserInfoFromToken() || {};
    if (!userNo) {
      console.warn(":경고: JWT에서 userNo 추출 실패 → ban 소켓 연결 실패");
      return;
    }
    if (!socketsRef.current["ban"]) {
      socketsRef.current["ban"] = new WebSocket(`ws://192.168.0.112:9099/ws/ban?userNo=${userNo}`);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={socketsRef}>
      {children}
    </WebSocketContext.Provider>
  );
};