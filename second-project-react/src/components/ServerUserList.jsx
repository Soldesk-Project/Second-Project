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
  const [shopItems, setShopItems] = useState([]);
  const { user, server } = useSelector((state) => state.user);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const sockets = useContext(WebSocketContext);
  const socketRef = useRef(null);
  
  const {
    user_nick,
    user_no,
    backgroundItemNo,
    titleItemNo,
    fontcolorItemNo,
    user_profile_img,
    imageFileName
  } = user;
  
  const itemMap = React.useMemo(() => {
    return shopItems.reduce((m, it) => {
      m[it.item_no] = it;
      return m;
    }, {});
  }, [shopItems]);

	 // 🆕 useEffect: 샵 전체 아이템 한 번만 불러오기
  useEffect(() => {
    const cats = ['테두리','칭호','글자색','명함','말풍선', '유니크'];
    Promise.all(cats.map(cat =>
      axios.get(`/api/shop/items?category=${encodeURIComponent(cat)}`)
    ))
    .then(results => {
      const all = results.flatMap(r =>
        r.data.map(it => ({
          ...it,
          imgUrl: it.imageFileName ? `/images/${it.imageFileName}` : ''
        }))
      );
      setShopItems(all);
    })
    .catch(err => console.error('샵 아이템 로드 실패', err));
  }, []);

  useEffect(() => {
    if (!server || !user || !user_nick || !user_no) return;

    const socket = sockets['server'];
    socketRef.current = socket; // 단순 참조만

    const payload = {
      action: "join",
      server,
      userNick: user.user_nick,       // 백엔드가 userNick 으로 읽습니다
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
    // if (socket.readyState === WebSocket.OPEN) {
    //   socket.send(JSON.stringify(payload));
    // } else {
    //   socket.onopen = () => socket.send(JSON.stringify(payload));
    // }

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "userList" && data.server === server) {
        // 1) WebSocket이 준 userNo 리스트를 상세 정보로 보강
       const detailed = await Promise.all(
         data.users.map(async u => {
           const { data: full } = await axios.get(`/user/${u.userNo}`);
           
           
           return {
             userNo:            full.user_no,
             userNick:          full.user_nick,
             backgroundItemNo:  full.backgroundItemNo,
             titleItemNo:       full.titleItemNo,
             fontColorItemNo:   full.fontcolorItemNo,
             userProfileImg:    full.user_profile_img,
             imageFileName:     full.imageFileName
           };
         })
       );
        
        // 2) 본인 맨 앞으로
        detailed.sort((a,b) => 
          a.user_no === user.user_no ? -1 :
          b.user_no === user.user_no ?  1 : 0
        );
        setUsers(detailed);
      }
      
    };
        

    socket.onerror = (e) => console.error("소켓 에러", e);

    return () => {
      setUsers([]);
    };
  }, [
    server,
    user?.user_no,
    user?.user_nick,
    user?.backgroundItemNo,
    user?.boundaryItemNo,
    user?.titleItemNo,
    user?.fontcolorItemNo,
    user_profile_img,
    imageFileName,
    sockets
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {`${server}서버 - 유저 목록`}
      </div>
      <div className={styles.userList}>
        {users.length > 0 ? (
          users.map(u => {
            // 4) 각 유저의 아이템 객체 가져오기
            const bg = itemMap[u.backgroundItemNo];
            const tt = itemMap[u.titleItemNo];
            const fc = itemMap[u.fontColorItemNo];

            // 5) 배경 스타일 세팅
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
                style={bgStyle}        // ★ 배경 이미지
                onClick={() => {
                  setSelectedUser(u);
                  setShowModal(true);
                }}
              >
                <div>
                  {/* 칭호 */}
                  {tt && titleTextMap[tt.css_class_name] && (
                    <span
                      className={decoStyles[tt.css_class_name]}
                      style={{ marginRight: 5, fontWeight: "bold" }}
                    >
                      [{titleTextMap[tt.css_class_name]}]
                    </span>
                  )}

                  {/* 닉네임(글자색) */}
                  <span
                    className={
                      fc ? decoStyles[fc.css_class_name] : undefined
                    }
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
