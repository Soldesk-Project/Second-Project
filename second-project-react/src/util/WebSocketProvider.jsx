import React, { createContext, useRef, useEffect, useState } from "react";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketsRef = useRef({});
  const [token, setToken] = useState(localStorage.getItem("token"));

  const MAX_RECONNECT_ATTEMPTS = 5;

  // JWT에서 userId, userNo 추출
  const getUserInfoFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        userId: payload.userId || payload.sub || payload.username || null,
        userNo: payload.userNo || payload.user_no || null,
      };
    } catch (e) {
      console.error("JWT 파싱 오류:", e);
      return null;
    }
  };

  // 자동 재연결을 위한 소켓 연결 함수
  const connectSocket = (name, url, retryCount = 0) => {
    if (socketsRef.current[name]) return;

    const socket = new WebSocket(url);
    socketsRef.current[name] = socket;

    socket.onopen = () => {
      console.log(`✅ [${name}] 연결 성공`);
    };

    socket.onclose = (e) => {
      console.warn(`❌ [${name}] 연결 종료됨:`, e.reason);
      socketsRef.current[name] = null;

      if (retryCount < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          console.log(`🔁 [${name}] 재연결 시도 (${retryCount + 1})`);
          connectSocket(name, url, retryCount + 1);
        }, 2000 * (retryCount + 1));
      } else {
        console.error(`🚫 [${name}] 재연결 실패 (최대 시도 초과)`);
      }
    };

    socket.onerror = (e) => {
      console.error(`⚠️ [${name}] 소켓 오류 발생`, e);
      socket.close();
    };
  };

  // room, server 소켓은 앱 시작 시 항상 연결
  useEffect(() => {
    if(token){
      connectSocket("room", "ws://192.168.0.112:9099/ws/room");
      connectSocket("server", "ws://192.168.0.112:9099/ws/server");
    }
  }, [token]);

  // ⏱️ 주기적으로 token 변경 감지
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== token) {
        setToken(currentToken); // token 변경되면 업데이트
      }
    }, 1000); // 1초마다 확인

    return () => clearInterval(interval);
  }, [token]);

  // match 소켓: token 변경 시 연결 시도
  useEffect(() => {
    const userInfo = getUserInfoFromToken(token);
    if (userInfo?.userId) {
      connectSocket("match", `ws://192.168.0.112:9099/ws/match?userId=${userInfo.userId}`);
    }
  }, [token]);

  // ban 소켓: token 변경 시 연결 시도
  useEffect(() => {
    const userInfo = getUserInfoFromToken(token);
    if (userInfo?.userNo) {
      connectSocket("ban", `ws://192.168.0.112:9099/ws/ban?userNo=${userInfo.userNo}`);
    }
  }, [token]);

  return (
    <WebSocketContext.Provider value={socketsRef}>
      {children}
    </WebSocketContext.Provider>
  );
};
