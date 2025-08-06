import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WebSocketContext } from "./WebSocketProvider";

const BanListener = () => {
  const socketsRef = useContext(WebSocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("banSocket 폴링 시작");
    const interval = setInterval(() => {
      const banSocket = socketsRef.current["ban"];
      if (banSocket) {
        console.log("banSocket connected:", banSocket);
        banSocket.onmessage = (event) => {
          console.log("banSocket onmessage fired", event.data);
          const data = JSON.parse(event.data);
          if (data.action === "banned") {
            alert(data.message || "관리자에 의해 계정이 정지되었습니다.");
            localStorage.removeItem("token");
            navigate("/");
          }
        };
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [socketsRef, navigate]);

  return null;
};

export default BanListener;