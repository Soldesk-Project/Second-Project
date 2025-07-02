import React, { useEffect, useRef, useState } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../css/chatbox.css'; // CSS 파일 경로 확인
import { useSelector } from 'react-redux'; // Redux useSelector 훅 임포트

const Chatbox = () => {
    const stompClientInstanceRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isWhisperMode, setIsWhisperMode] = useState(false);
    const [whisperTarget, setWhisperTarget] = useState('');
    const chatLogRef = useRef(null);

    // 'addUser' 메시지를 서버에 한 번만 전송했는지 추적하는 플래그입니다.
    const hasSentAddUserRef = useRef(false);

    // Redux에서 사용자 정보 가져오기
    const currentUser = useSelector((state) => state.user.user);
    const userNick = currentUser?.user_nick; // 사용자 닉네임
    const userNo = currentUser?.user_no;     // 사용자 번호 (새로 추가)

    // 1. WebSocket 연결 및 구독 로직
    useEffect(() => {
        // userNick 또는 userNo가 없으면 (로그인되지 않은 상태) 연결 시도를 하지 않습니다.
        if (!userNick || userNo === undefined || userNo === null) {
            console.log("User nickname or number not available from Redux. Skipping WebSocket connection.");
            return;
        }

        // --- 중요: StrictMode 대응 로직 시작 ---
        if (stompClientInstanceRef.current && stompClientInstanceRef.current.connected) {
            console.log("STOMP Client already connected for username:", userNick, ". Skipping re-initialization.");
            return;
        }

        if (stompClientInstanceRef.current && !stompClientInstanceRef.current.connected) {
             console.log("Existing STOMP client in ref is not connected, attempting to disconnect for clean start.");
             stompClientInstanceRef.current.disconnect(() => {
                 console.log("Previous STOMP client disconnected for clean start.");
                 stompClientInstanceRef.current = null;
             });
             return; // 다음 렌더링 사이클에서 다시 연결 시도
        }
        // --- StrictMode 대응 로직 끝 ---


        console.log(`Attempting to connect with username: ${userNick}, userNo: ${userNo}`);

        const socket = new SockJS('http://localhost:9099/ws-chat');
        // STOMP.js 경고 해결: SockJS 인스턴스를 팩토리 함수로 전달
        const client = Stomp.over(() => socket); // <--- 이 부분 수정

        client.connect({}, frame => {
            console.log('Connected: ' + frame);
            stompClientInstanceRef.current = client;

            // 공개 채팅방 메시지 수신
            client.subscribe('/topic/public', message => {
                const receivedMessage = JSON.parse(message.body);
                console.log("공개 메시지 수신:", receivedMessage); // 디버깅용
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
            });

            // 귓속말 채팅방 메시지 수신
            // 서버에서 닉네임으로 메시지를 라우팅하기 때문에, 클라이언트 구독도 닉네임 기반으로 유지
            client.subscribe(`/user/${userNick}/queue/whisper`, message => {
                const receivedMessage = JSON.parse(message.body);
                console.log("귓속말 메시지 수신:", receivedMessage); // 디버깅용
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
            });

            // 'addUser' 메시지는 딱 한 번만 서버로 전송합니다.
            if (!hasSentAddUserRef.current) {
                console.log("Sending addUser message for:", userNick, "UserNo:", userNo);
                client.send("/app/chat.addUser", {}, JSON.stringify({
                    mType: 'JOIN',
                    mSender: userNick,
                    mSenderNo: userNo // UserNo 포함하여 전송
                }));
                hasSentAddUserRef.current = true;
            } else {
                console.log("addUser message already sent for:", userNick, ". Skipping.");
            }

        }, error => {
            console.error("STOMP connection error:", error);
            alert("서버 연결에 실패했습니다. 새로고침 해주세요.");
            stompClientInstanceRef.current = null;
        });

        // 클린업 함수
        return () => {
            console.log("Cleanup function called for username:", userNick);
            const currentClient = stompClientInstanceRef.current;
            if (currentClient && currentClient.connected) {
                console.log("Disconnecting STOMP client in cleanup for username:", userNick);
                // LEAVE 메시지 전송 (선택 사항: 서버에서 세션 끊김 감지 시 자동 처리될 수도 있음)
                currentClient.send("/app/chat.addUser", {}, JSON.stringify({
                    mType: 'LEAVE',
                    mSender: userNick,
                    mSenderNo: userNo // UserNo 포함하여 전송
                }));
                currentClient.disconnect(() => {
                    console.log("STOMP client disconnected successfully in cleanup.");
                });
            } else {
                console.log("STOMP client not connected or already disconnected in cleanup for username:", userNick);
            }
            stompClientInstanceRef.current = null;
            hasSentAddUserRef.current = false;
        };
    }, [userNick, userNo]); // userNick과 userNo가 변경될 때만 이펙트가 다시 실행되도록 의존성 설정

    // 메시지 목록이 업데이트될 때마다 스크롤을 최하단으로 이동하는 useEffect 훅입니다.
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [messages]);

    // 2. 메시지 전송 함수
    const sendMessage = () => {
        // userNick과 userNo가 모두 존재하는지 확인
        if (stompClientInstanceRef.current && messageInput.trim() && userNick && userNo !== undefined && userNo !== null) {
            const now = new Date();
            const timestamp = now.getFullYear() + '-' +
                                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                                String(now.getDate()).padStart(2, '0') + ' ' +
                                String(now.getHours()).padStart(2, '0') + ':' +
                                String(now.getMinutes()).padStart(2, '0') + ':' +
                                String(now.getSeconds()).padStart(2, '0');

            if (isWhisperMode && whisperTarget.trim()) {
                stompClientInstanceRef.current.send("/app/chat.sendWhisper", {}, JSON.stringify({
                    mType: 'WHISPER',
                    mSender: userNick,
                    mSenderNo: userNo, // mSenderNo 포함
                    mContent: messageInput,
                    mReceiver: whisperTarget, // mReceiverNo는 서버에서 처리 (닉네임 기반)
                    mTimestamp: timestamp
                }));
            } else {
                stompClientInstanceRef.current.send("/app/chat.sendMessage", {}, JSON.stringify({
                    mType: 'CHAT',
                    mSender: userNick,
                    mSenderNo: userNo, // mSenderNo 포함
                    mContent: messageInput,
                    mTimestamp: timestamp
                }));
            }
            setMessageInput('');
        } else {
            console.warn("메시지 전송 실패: 사용자 닉네임 또는 번호가 유효하지 않거나 메시지 내용이 비어있습니다.");
        }
    };

    // Enter 키 입력 이벤트를 처리하는 함수입니다.
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // 3. 귓속말 모드 토글 함수
    const toggleWhisperMode = () => {
        setIsWhisperMode(prev => !prev);
        if (!isWhisperMode) {
            setWhisperTarget('');
        }
    };

    // 4. 컴포넌트 렌더링 (JSX) 부분
    return (
        <div className="chatbox-container">
            <div className="chatbox-header">
                <div>
                    <button onClick={() => setIsWhisperMode(false)}
                            className={!isWhisperMode ? 'active-mode-btn' : ''}>전체</button>
                    <button onClick={() => setIsWhisperMode(true)}
                            className={isWhisperMode ? 'active-mode-btn' : ''}>귓속말</button>

                    {isWhisperMode && (
                        <input
                            type="text"
                            placeholder="귓속말 대상 (닉네임)"
                            value={whisperTarget}
                            onChange={(e) => setWhisperTarget(e.target.value)}
                            className="whisper-target-input"
                        />
                    )}
                </div>
            </div>

            <div className="chatbox-log" ref={chatLogRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.mSender === userNick ? 'my-message' : ''} ${msg.mType === 'WHISPER' ? 'whisper' : ''} ${msg.mType === 'JOIN' || msg.mType === 'LEAVE' ? 'system-message' : ''}`}>
                        {msg.mType === 'JOIN' || msg.mType === 'LEAVE' ? (
                            <span className="system-text">{msg.mContent} <span className="timestamp">[{msg.mTimestamp}]</span></span>
                        ) : msg.mType === 'WHISPER' ? (
                            <>
                                <span className="whisper-text">
                                    [귓속말] {msg.mSender === userNick ? `To ${msg.mReceiver}` : `From ${msg.mSender}`}:
                                </span>
                                <span className="message-content">{msg.mContent}</span>
                                <span className="timestamp">[{msg.mTimestamp}]</span>
                            </>
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
                    id="chatInput"
                    className="chatInput"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isWhisperMode ? "귓속말 메시지 입력..." : "메시지 입력..."}
                />
                <button id="emojiBtn" className="emojiBtn">😊</button>
                <button id="sendBtn" className="sendBtn" onClick={sendMessage}>전달</button>
            </div>
        </div>
    );
};

export default Chatbox;