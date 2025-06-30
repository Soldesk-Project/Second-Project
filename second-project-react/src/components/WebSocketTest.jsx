import React, { useState, useEffect, useRef } from 'react';

const WebSocketTest = () => {
  const [step, setStep] = useState("login"); // login -> serverSelect -> main
  const [userId, setUserId] = useState("");
  const [server, setServer] = useState(null);
  const [users, setUsers] = useState([]);
  const socketRef = useRef(null);

  // WebSocket 연결 및 메시지 처리
  useEffect(() => {
    if (step === "main" && server) {
      socketRef.current = new WebSocket("ws://localhost:9099/ws/status");

      socketRef.current.onopen = () => {
        console.log("WebSocket 연결 성공");
        // 서버에 join 메시지 전송
        socketRef.current.send(
          JSON.stringify({ action: "join", server, userId })
        );
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "userList" && data.server === server) {
          setUsers(data.users);
        }
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket 연결 종료");
      };

      return () => {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({ action: "leave", server, userId })
          );
          socketRef.current.close();
        }
      };
    }
  }, [step, server, userId]);

  const handleLogin = () => {
    if (userId.trim()) setStep("serverSelect");
  };

  const selectServer = (num) => {
    setServer(num);
    setStep("main");
  };

  if (step === "login")
    return (
      <div>
        <h2>로그인</h2>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="아이디 입력"
        />
        <button onClick={handleLogin}>로그인</button>
      </div>
    );

  if (step === "serverSelect")
    return (
      <div>
        <h2>서버 선택</h2>
        {[1, 2, 3].map((num) => (
          <button key={num} onClick={() => selectServer(num.toString())}>
            {num} 서버
          </button>
        ))}
      </div>
    );

  if (step === "main")
    return (
      <div>
        <h2>{server} 서버에 접속 중</h2>
        <h3>접속 유저 목록</h3>
        <ul>
          {users.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
        <button
          onClick={() => {
            if (socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(
                JSON.stringify({ action: "leave", server, userId })
              );
              socketRef.current.close();
            }
            setStep("serverSelect");
            setUsers([]);
          }}
        >
          서버 나가기
        </button>
      </div>
    );

  return null;
}

export default WebSocketTest;
