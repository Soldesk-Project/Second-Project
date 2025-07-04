import React, { useEffect, useRef, useState } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../css/chatbox.css'; // 동일한 CSS 사용 가능
// GameChatbox는 Redux 상태를 직접 구독하지 않고, 필요한 정보를 prop으로 받는 것이 좋습니다.
// import { useSelector } from 'react-redux'; // 여기서는 사용하지 않음

const GameChatbox = ({ gameroomNo, userNick, userNo }) => {
    const stompClientInstanceRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const chatLogRef = useRef(null);
    const hasSentJoinRef = useRef(false); // 게임방 JOIN 메시지 전송 여부 추적
    const [isConnected, setIsConnected] = useState(false); // 웹소켓 연결 상태를 추적하는 state

    useEffect(() => {

        if (!userNick || userNo === undefined || userNo === null || !gameroomNo) {
            return;
        }

        // 엄격 모드(StrictMode) 대응 및 이미 연결되어 있다면 재연결 시도하지 않음
        if (stompClientInstanceRef.current && isConnected) {
            // 게임방 변경 시 메시지 목록 초기화
            setMessages([]);
            // 만약 StrictMode로 인해 재실행된 것이고, JOIN 메시지를 아직 안보냈다면 보냄
            if (!hasSentJoinRef.current) {
                 stompClientInstanceRef.current.send(`/app/gameChat.addUser/${gameroomNo}`, {}, JSON.stringify({
                     mType: 'GAME_JOIN',
                     mSender: userNick,
                     mSenderNo: userNo,
                     gameroomNo: gameroomNo
                 }));
                 hasSentJoinRef.current = true;
            }
            return;
        }

        // 게임방 전용 STOMP 엔드포인트 사용
        const socket = new SockJS('http://192.168.0.112:9099/ws-game-chat');
        const client = Stomp.over(() => socket);

        client.connect({}, frame => {
            stompClientInstanceRef.current = client;
            setIsConnected(true); // 연결 성공 시 true로 설정
            setMessages([]); // 새로운 연결 시 메시지 목록 초기화

            // 게임방 채팅 수신
            client.subscribe(`/gameChat/${gameroomNo}`, message => {
                const receivedMessage = JSON.parse(message.body);
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
            });

            // 'addUser' (GAME_JOIN) 메시지 전송
            if (!hasSentJoinRef.current) {
                client.send(`/app/gameChat.addUser/${gameroomNo}`, {}, JSON.stringify({
                    mType: 'GAME_JOIN',
                    mSender: userNick,
                    mSenderNo: userNo,
                    gameroomNo: gameroomNo
                }));
                hasSentJoinRef.current = true;
            } else {
                console.log("GAME_JOIN 메시지 이미 전송됨 (GameChatbox). 스킵.");
            }

        }, error => {
            alert("게임방 서버 연결에 실패했습니다. 새로고침 해주세요.");
            stompClientInstanceRef.current = null; // 에러 시 참조 제거
            setIsConnected(false); // 연결 실패 시 false로 설정
        });

        // 클린업 함수
        return () => {
            const currentClient = stompClientInstanceRef.current;

            if (currentClient && currentClient.connected) {
                // GAME_LEAVE 메시지 전송
                currentClient.send(`/app/gameChat.leaveUser/${gameroomNo}`, {}, JSON.stringify({
                    mType: 'GAME_LEAVE',
                    mSender: userNick,
                    mSenderNo: userNo,
                    gameroomNo: gameroomNo
                }));
                console.log(`클린업: GAME_LEAVE 메시지 전송 완료 (GameChatbox): 게임방 ${gameroomNo}.`);

                currentClient.disconnect(() => {
                    stompClientInstanceRef.current = null; // 연결 해제 후 참조 제거
                    setIsConnected(false); // 연결 해제 시 false로 설정
                });
            } else {
                stompClientInstanceRef.current = null; // 연결되지 않았어도 확실히 null 설정
                setIsConnected(false); // 연결되지 않았어도 state 업데이트
            }
            hasSentJoinRef.current = false; // 클린업 시 플래그 초기화
        };
    }, [gameroomNo, userNick, userNo]); // 게임방 번호, 사용자 정보 변경 시 이펙트 다시 실행

    // 메시지 목록이 업데이트될 때마다 스크롤을 최하단으로 이동
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [messages]);

    // 메시지 전송 함수
    const sendGameMessage = () => {


        if (stompClientInstanceRef.current && isConnected && messageInput.trim() && userNick && userNo !== undefined && userNo !== null && gameroomNo) {
            const now = new Date();
            const timestamp = now.getFullYear() + '-' +
                                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                                String(now.getDate()).padStart(2, '0') + ' ' +
                                String(now.getHours()).padStart(2, '0') + ':' +
                                String(now.getMinutes()).padStart(2, '0') + ':' +
                                String(now.getSeconds()).padStart(2, '0');

            stompClientInstanceRef.current.send(`/app/gameChat.sendMessage/${gameroomNo}`, {}, JSON.stringify({
                mType: 'GAME_CHAT', // 서버와 맞춰야 함
                mSender: userNick,
                mSenderNo: userNo,
                mContent: messageInput,
                mTimestamp: timestamp,
                gameroomNo: gameroomNo // 서버에서 게임방 번호를 받을 수 있도록
            }));
            setMessageInput('');
        } else {
            if (!stompClientInstanceRef.current) {
                console.warn("메시지 전송 실패 (GameChatbox): STOMP Client 인스턴스가 없습니다.");
            } else if (!isConnected) {
                console.warn("메시지 전송 실패 (GameChatbox): STOMP Client가 연결되어 있지 않습니다.");
            } else if (!messageInput.trim()) {
                console.warn("메시지 전송 실패 (GameChatbox): 메시지 내용이 비어 있습니다.");
            } else if (!gameroomNo) {
                console.warn("메시지 전송 실패 (GameChatbox): 게임방 번호가 없습니다.");
            } else {
                console.warn("메시지 전송 실패 (GameChatbox): 사용자 정보(닉네임/번호)가 유효하지 않습니다.");
            }
        }
    };

    // Enter 키 입력 처리
    const handleGameKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendGameMessage();
        }
    };

    return (
        <div className="chatbox-container"> {/* 기존 chatbox-container 재활용 */}
            <div className="chatbox-header">
                <div>
                    게임방 채팅 {gameroomNo ? `[${gameroomNo}]` : ''}
                    {isConnected ? (
                        <span style={{ color: 'green', marginLeft: '10px' }}>연결됨</span>
                    ) : (
                        <span style={{ color: 'red', marginLeft: '10px' }}>연결 끊김</span>
                    )}
                </div>
            </div>

            <div className="chatbox-log" ref={chatLogRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.mSender === userNick ? 'my-message' : ''} ${msg.mType === 'GAME_JOIN' || msg.mType === 'GAME_LEAVE' ? 'system-message' : ''}`}>
                        {msg.mType === 'GAME_JOIN' || msg.mType === 'GAME_LEAVE' ? (
                            <span className="system-text">{msg.mContent} <span className="timestamp">[{msg.mTimestamp}]</span></span>
                        ) : (
                            <>
                                <span className="sender">{msg.mSender}:</span>
                                <span className="message-content">{msg.mContent}</span>
                                <span className="timestamp">[{msg.mTimestamp}]</span>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="chatbox-input">
                <input
                    type="text"
                    id="gameChatInput"
                    className="chatInput"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleGameKeyPress}
                    placeholder="게임방 메시지 입력..."
                    disabled={!isConnected}
                />
                <button id="gameSendBtn" className="sendBtn" onClick={sendGameMessage} disabled={!isConnected}>전달</button>
            </div>
        </div>
    );
};

export default GameChatbox;