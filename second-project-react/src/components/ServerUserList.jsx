import React, { useState, useEffect, useRef } from "react";

const ServerUserList = ({ server, userId }) => {
  const [users, setUsers] = useState([]); // 현재 서버에 접속한 유저 목록
  const socketRef = useRef(null);

  // 서버 또는 userId가 바뀔 때마다 WebSocket 연결 재설정
  useEffect(() => {
    if (!server || !userId) return;

    // 기존 소켓 연결 종료
    if (socketRef.current) {
      socketRef.current.close();
    }

    // 새 WebSocket 연결
    socketRef.current = new WebSocket("ws://192.168.0.112:9099/ws/server");

    socketRef.current.onopen = () => {
      // 서버 입장 메시지 전송
      socketRef.current.send(
        JSON.stringify({ action: "join", server, userId})
      );
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 서버별 유저 목록 수신 시
      if (data.type === "userList" && data.server === server) {
        setUsers(data.users);
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setUsers([]); // 소켓 종료 시 유저 목록 비우기
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [server, userId]);

  return (
     <div>
      <h3>{`현재 접속 서버: ${server}`}</h3>
      <h4>접속 유저 목록:</h4>
      {users.length > 0 ? (
        <ul>{users.map((u) => <li key={u}>{u}</li>)}</ul>
      ) : (
        <p>현재 접속 유저가 없습니다.</p>
      )}
    </div>
  );
};

export default ServerUserList;
