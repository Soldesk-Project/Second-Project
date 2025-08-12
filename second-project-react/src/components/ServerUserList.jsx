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
  
  const userNoRef = useRef(user_no);
  useEffect(() => {
    userNoRef.current = user_no;
  }, [user_no]);
  
  const itemMap = React.useMemo(() => {
    return shopItems.reduce((m, it) => {
      m[it.item_no] = it;
      return m;
    }, {});
  }, [shopItems]);

  useEffect(() => {
    if (!server || !user || !user_nick || !user_no) return;

    const socket = sockets.current['server'];
    
    if (!socket) return;

    const payload = {
      action: "join",
      server,
      userNick: user.user_nick,
      userNo: user.user_no,
      userRank: user.user_rank,
      bgItemNo: user.backgroundItemNo,
      boundaryItemNo: user.boundaryItemNo,
      titleItemNo: user.titleItemNo,
      fontColorItemNo: user.fontcolorItemNo,
      userProfileImg: user.user_profile_img,
      imageFileName: user.imageFileName
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

         // 유저 캐시 강제 갱신: 닉네임이 바뀐 경우 반영
         
        data.users.forEach((u) => {
          const cached = userCache.current.get(u.userNo) || {};
          userCache.current.set(u.userNo, {
            ...cached,
            userNo: u.userNo,
            userNick: u.userNick,
            userRank: u.userRank,
            backgroundItemNo: u.bgItemNo ?? cached.backgroundItemNo,
            titleItemNo: u.titleItemNo ?? cached.titleItemNo,
            fontColorItemNo: u.fontColorItemNo ?? cached.fontColorItemNo,
            userProfileImg: u.userProfileImg ?? cached.userProfileImg,
            imageFileName: u.imageFileName ?? cached.imageFileName,
          });
        });

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
        const detailed = uniqueUserNos
          .map(no => userCache.current.get(no))
          .filter(u => u);

        const self = detailed.find(u => Number(u.userNo) === Number(userNoRef.current));
        const others = detailed.filter(u => Number(u.userNo) !== Number(userNoRef.current));
        const detailedSorted = self ? [self, ...others] : others;

        setUsers(detailedSorted);
        setIsLoading(false);
      }
      if (data.action === 'updateNick') {
        const { userNo, userNick } = data;

        setUsers((prevUsers) => {
          // 기존 users 중 닉네임 변경 대상 찾아서 갱신
          const newUsers = prevUsers.map(u =>
            Number(u.userNo) === Number(userNo) ? { ...u, userNick } : u
          );
          return newUsers;
        });

        // 만약 userCache도 같이 갱신하고 싶으면
        if (userCache.current.has(userNo)) {
          const cachedUser = userCache.current.get(userNo);
          userCache.current.set(userNo, { ...cachedUser, userNick });
        }
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
