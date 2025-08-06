import React, { useState, useEffect, useRef, useContext } from "react";
import UserDetailModal from "./modal/UserDetailModal";
import styles from "../css/ServerUserList.module.css";
import decoStyles from '../css/Decorations.module.css';
import { useSelector } from "react-redux";
import { WebSocketContext } from "../util/WebSocketProvider";
import titleTextMap from "../js/Decorations";
import axios from 'axios';

const ServerUserList = () => {
  const [users, setUsers] = useState([]); // 현재 서버에 접속한 유저 목록
  const { user, server } = useSelector((state) => state.user);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sockets = useContext(WebSocketContext);
  const socketRef = useRef(null);
  const userCache = useRef(new Map()); // userNo 별 캐시
  const shopItems = useSelector(state => state.shop.items);

  const {
    user_nick,
    user_no,
    backgroundItemNo,
    titleItemNo,
    fontcolorItemNo,
    user_profile_img,
    imageFileName
  } = user || {};

  const itemMap = React.useMemo(() => {
    return shopItems.reduce((m, it) => {
      m[it.item_no] = it;
      return m;
    }, {});
  }, [shopItems]);

  useEffect(() => {
    if (!server || !user || !user_nick || !user_no) return;

    const socket = sockets['server'];
    if (!socket) return;

    socketRef.current = socket; // 단순 참조

    const payload = {
      action: "join",
      server,
      userNick: user.user_nick,
      userNo: user.user_no,
      boundaryItemNo: user.boundaryItemNo,
      titleItemNo: user.titleItemNo,
      fontColorItemNo: user.fontcolorItemNo,
      userProfileImg: user.user_profile_img,
    };

    const sendPayload = () => socket.send(JSON.stringify(payload));

    if (socket.readyState === WebSocket.OPEN) {
      sendPayload();
    } else {
      socket.addEventListener('open', sendPayload, { once: true });
    }

    // 메시지 핸들러 분리
    const messageHandler = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "userList" && data.server === server) {
        // 중복 userNo 제거
        const uniqueUserNos = [...new Set(data.users.map(u => u.userNo))];

        // 캐시에 없는 userNo만 호출
        const usersToFetch = uniqueUserNos.filter(no => !userCache.current.has(no));

        // API 호출 후 캐싱
        const fetchedUsers = await Promise.all(
          usersToFetch.map(async (userNo) => {
            const { data: full } = await axios.get(`/user/${userNo}`);
            const detailedUser = {
              userNo: full.user_no,
              userNick: full.user_nick,
              backgroundItemNo: full.backgroundItemNo,
              titleItemNo: full.titleItemNo,
              fontColorItemNo: full.fontColorItemNo,
              userProfileImg: full.user_profile_img,
              imageFileName: full.imageFileName,
            };
            userCache.current.set(userNo, detailedUser);
            return detailedUser;
          })
        );

        // 캐시에서 모든 유저 정보 가져오기
        const detailed = uniqueUserNos.map(no => userCache.current.get(no));

        // 본인 맨 앞으로 정렬
        detailed.sort((a, b) =>
          Number(a.userNo) === Number(user.user_no)
            ? -1
            : Number(b.userNo) === Number(user.user_no)
            ? 1
            : 0
        );

        setUsers(detailed);
        setIsLoading(false);
      }
    };

    socket.addEventListener('message', messageHandler);
    socket.onerror = (e) => console.error("소켓 에러", e);

    // 컴포넌트 언마운트시 이벤트 리스너 제거
    return () => {
      setUsers([]);
      socket.removeEventListener('message', messageHandler);
    };
  }, [server, user_no, user_nick, sockets]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {`${server}서버 - 유저 목록`}
      </div>
      <div className={styles.userList}>
        {isLoading ? (
          <p>로딩중...</p>
        ) : users.length > 0 ? (
          users.map(u => {
            const bg = itemMap[u.backgroundItemNo];
            const tt = itemMap[u.titleItemNo];
            const fc = itemMap[u.fontColorItemNo];

            const bgStyle = bg?.imgUrl
              ? {
                  backgroundImage: `url(${bg.imgUrl})`,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }
              : {};

            return (
              <div
                key={`user-${u.userNo}`}
                className={styles.user}
                style={bgStyle}
                onClick={() => {
                  setSelectedUser(u);
                  setShowModal(true);
                }}
              >
                <div>
                  {tt && titleTextMap[tt.css_class_name] && (
                    <span
                      className={decoStyles[tt.css_class_name]}
                      style={{ marginRight: 5, fontWeight: "bold" }}
                    >
                      [{titleTextMap[tt.css_class_name]}]
                    </span>
                  )}
                  <span
                    className={fc ? decoStyles[fc.css_class_name] : undefined}
                  >
                    {u.userNick}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p>현재 접속 유저가 없습니다.</p>
        )}
      </div>

      {showModal && (
        <UserDetailModal
          user={selectedUser}
          shopItems={shopItems}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default ServerUserList;
