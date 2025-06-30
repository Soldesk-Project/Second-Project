import React, { useState, useEffect, useRef } from "react";

const ServerUserList = () => {
  const [server, setServer] = useState(null); // 선택된 서버 (예: "1", "2", "3")
  const [userId, setUserId] = useState(""); // 로그인한 유저 아이디 입력용
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
    socketRef.current = new WebSocket("ws://localhost:9099/ws/server");

    socketRef.current.onopen = () => {
      // 서버 입장 메시지 전송
      socketRef.current.send(
        JSON.stringify({ action: "join", server: server, userId: userId })
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
    <div style={{ padding: 20 }}>
      <h2>서버 접속 유저 확인</h2>

      {/* 유저 아이디 입력 */}
      <div>
        <input
          type="text"
          placeholder="유저 아이디 입력"
          value={userId}
          onChange={(e) => setUserId(e.target.value.trim())}
          style={{ marginRight: 10 }}
        />
      </div>

      {/* 서버 선택 버튼 */}
      <div style={{ margin: "10px 0" }}>
        <button onClick={() => setServer("1")} disabled={server === "1"}>
          서버 1
        </button>
        <button onClick={() => setServer("2")} disabled={server === "2"} style={{ marginLeft: 10 }}>
          서버 2
        </button>
        <button onClick={() => setServer("3")} disabled={server === "3"} style={{ marginLeft: 10 }}>
          서버 3
        </button>
      </div>

      {/* 현재 접속 서버 및 유저 목록 표시 */}
      {server ? (
        <>
          <h3>{`현재 접속 서버: ${server}`}</h3>
          <h4>접속 유저 목록:</h4>
          {users.length > 0 ? (
            <ul>
              {users.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p>현재 접속 유저가 없습니다.</p>
          )}
        </>
      ) : (
        <p>서버를 선택하세요.</p>
      )}
    </div>
  );
};

export default ServerUserList;
