import { useContext, useEffect } from "react";
import { WebSocketContext } from "./WebSocketProvider";
import { useNavigate } from "react-router-dom";

const BanListener = () => {
  const sockets = useContext(WebSocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("banSocket:", sockets["ban"]);
    const banSocket = sockets["ban"];
    if (!banSocket) return;

    banSocket.onmessage = (event) => {
      console.log("banSocket onmessage fired", event.data);
      const data = JSON.parse(event.data);
      if (data.action === "banned") {
        alert(data.message || "관리자에 의해 계정이 정지되었습니다.");
        localStorage.removeItem("token"); // 토큰 제거
        navigate("/"); // 로그인 페이지로 이동
      }
    };

    return () => {
      if (banSocket) banSocket.onmessage = null; // 리스너 정리
    };
  }, [sockets, navigate]);

  return null; // UI 없는 리스너
};

export default BanListener;
