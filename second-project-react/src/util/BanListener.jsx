import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WebSocketContext } from "./WebSocketProvider";
import { clearUser } from "../store/userSlice";
import { useDispatch } from "react-redux";

const BanListener = () => {
  const socketsRef = useContext(WebSocketContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("banSocket 폴링 시작");
    const interval = setInterval(() => {
      const banSocket = socketsRef.current["ban"];
      if (banSocket) {
        banSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.action === "banned") {
            alert("관리자에 의해 계정이 정지되었습니다.");
            localStorage.removeItem("token");
            dispatch(clearUser());
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