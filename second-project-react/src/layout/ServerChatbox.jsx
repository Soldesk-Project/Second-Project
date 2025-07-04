import React, { useEffect, useRef, useState } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../css/chatbox.css'; // 동일한 CSS 사용 가능
import { useSelector } from 'react-redux';

const ServerChatbox = () => {
    const stompClientInstanceRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isWhisperMode, setIsWhisperMode] = useState(false);
    const [whisperTarget, setWhisperTarget] = useState('');
    const chatLogRef = useRef(null);
    const hasSentAddUserRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false); // 웹소켓 연결 상태를 추적하는 state

    const currentUser = useSelector((state) => state.user.user);
    const userNick = currentUser?.user_nick;
    const userNo = currentUser?.user_no;

    useEffect(() => {
        console.log('--- ServerChatbox useEffect 시작 ---');
        console.log(`현재 Redux 사용자 정보: userNick=${userNick}, userNo=${userNo}`);

        if (!userNick || userNo === undefined || userNo === null) {
            console.log("WebSocket 연결 스킵: 사용자 닉네임 또는 번호 없음.");
            return;
        }

        // 엄격 모드(StrictMode) 대응 및 이미 연결되어 있다면 재연결 시도하지 않음
        if (stompClientInstanceRef.current && isConnected) {
            console.log("STOMP Client 이미 연결됨 (ServerChatbox). 재초기화 스킵.");
            if (!hasSentAddUserRef.current) {
                console.log("Strict Mode (ServerChatbox): SERVER_JOIN 메시지 재전송.");
                stompClientInstanceRef.current.send("/app/serverChat.addUser", {}, JSON.stringify({
                    mType: 'SERVER_JOIN',
                    mSender: userNick,
                    mSenderNo: userNo
                }));
                hasSentAddUserRef.current = true;
            }
            return;
        }

        console.log(`STOMP Client (ServerChatbox) 연결 시도 중... (userNick: ${userNick}, userNo: ${userNo})`);

        const socket = new SockJS('http://192.168.0.112:9099/ws-chat'); // ★ 일반 서버 채팅 엔드포인트
        const client = Stomp.over(() => socket);

        client.connect({}, frame => {
            console.log('STOMP 연결 성공! (ServerChatbox) 프레임:', frame);
            stompClientInstanceRef.current = client;
            setIsConnected(true); // 연결 성공 시 true로 설정
            setMessages([]); // 새로운 연결 시 메시지 목록 초기화
            console.log("stompClientInstanceRef.current (ServerChatbox) 설정됨:", stompClientInstanceRef.current);

            // 공개 채팅방 구독
            client.subscribe('/serverChat/public', message => {
                const receivedMessage = JSON.parse(message.body);
                console.log("공개 메시지 수신 (ServerChatbox):", receivedMessage);
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
            });
            console.log("공개 채팅방 구독 완료 (ServerChatbox): /serverChat/public");

            // 귓속말 채팅방 구독
            client.subscribe(`/user/${userNo}/queue/messages`, message => {
                const receivedMessage = JSON.parse(message.body);
                console.log("귓속말 메시지 수신 (ServerChatbox):", receivedMessage);
                setMessages(prevMessages => [...prevMessages, receivedMessage]);
            });
            console.log(`귓속말 채팅방 구독 완료 (ServerChatbox): /user/${userNo}/queue/messages`);

            // 'addUser' 메시지 전송
            if (!hasSentAddUserRef.current) {
                console.log("SERVER_JOIN 메시지 전송 시도 (ServerChatbox):", { mSender: userNick, mSenderNo: userNo });
                client.send("/app/serverChat.addUser", {}, JSON.stringify({
                    mType: 'SERVER_JOIN',
                    mSender: userNick,
                    mSenderNo: userNo
                }));
                hasSentAddUserRef.current = true;
                console.log("SERVER_JOIN 메시지 전송 완료 (ServerChatbox).");
            } else {
                console.log("SERVER_JOIN 메시지 이미 전송됨 (ServerChatbox). 스킵.");
            }

        }, error => {
            console.error("STOMP 연결 에러 발생 (ServerChatbox):", error);
            alert("서버 연결에 실패했습니다. 새로고침 해주세요.");
            stompClientInstanceRef.current = null; // 에러 시 참조 제거
            setIsConnected(false); // 연결 실패 시 false로 설정
            console.log("STOMP Client 참조 null로 설정됨 (ServerChatbox, 연결 에러).");
        });

        // 클린업 함수
        return () => {
            console.log('--- ServerChatbox useEffect 클린업 함수 실행 ---');
            console.log(`현재 클린업 대상 user: ${userNick}, isConnected: ${isConnected}`);
            const currentClient = stompClientInstanceRef.current;

            if (currentClient && currentClient.connected) {
                console.log("클린업: STOMP Client (ServerChatbox) 연결 해제 시도 중...");
                // SERVER_LEAVE 메시지 전송
                currentClient.send("/app/serverChat.leaveUser", {}, JSON.stringify({
                    mType: 'SERVER_LEAVE',
                    mSender: userNick,
                    mSenderNo: userNo
                }));
                console.log("클린업: SERVER_LEAVE 메시지 전송 완료 (ServerChatbox).");

                currentClient.disconnect(() => {
                    console.log("클린업: STOMP Client (ServerChatbox) 성공적으로 연결 해제됨.");
                    stompClientInstanceRef.current = null; // 연결 해제 후 참조 제거
                    setIsConnected(false); // 연결 해제 시 false로 설정
                });
            } else {
                console.log("클린업: STOMP Client (ServerChatbox)가 연결되어 있지 않거나 이미 해제됨.");
                stompClientInstanceRef.current = null; // 연결되지 않았어도 확실히 null 설정
                setIsConnected(false); // 연결되지 않았어도 state 업데이트
            }
            hasSentAddUserRef.current = false; // 클린업 시 플래그 초기화
            console.log('--- ServerChatbox useEffect 클린업 함수 종료 ---');
        };
    }, [userNick, userNo]); // userNick과 userNo가 변경될 때만 이펙트 다시 실행

    // 메시지 목록이 업데이트될 때마다 스크롤을 최하단으로 이동
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [messages]);

    // 메시지 전송 함수
    const sendMessage = () => {
        console.log('--- sendMessage 함수 호출 (ServerChatbox) ---');
        // console.log(`메시지 내용: "${messageInput.trim()}"`); // 디버깅 시 필요
        // console.log(`현재 userNick: ${userNick}, userNo: ${userNo}`); // 디버깅 시 필요
        // console.log(`STOMP Client 연결 상태: ${stompClientInstanceRef.current?.connected}, isConnected state: ${isConnected}`); // 디버깅 시 필요

        if (stompClientInstanceRef.current && isConnected && messageInput.trim() && userNick && userNo !== undefined && userNo !== null) {
            const now = new Date();
            const timestamp = now.getFullYear() + '-' +
                                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                                String(now.getDate()).padStart(2, '0') + ' ' +
                                String(now.getHours()).padStart(2, '0') + ':' +
                                String(now.getMinutes()).padStart(2, '0') + ':' +
                                String(now.getSeconds()).padStart(2, '0');

            if (isWhisperMode && whisperTarget.trim()) {
                console.log("귓속말 메시지 전송 시도 (ServerChatbox):", { target: whisperTarget, content: messageInput });
                stompClientInstanceRef.current.send("/app/whisperChat.sendMessage", {}, JSON.stringify({
                    mType: 'WHISPER_CHAT',
                    mSender: userNick,
                    mSenderNo: userNo,
                    mContent: messageInput,
                    mReceiver: whisperTarget,
                    mTimestamp: timestamp
                }));
            } else {
                console.log("일반 메시지 전송 시도 (ServerChatbox):", { content: messageInput });
                stompClientInstanceRef.current.send("/app/serverChat.sendMessage", {}, JSON.stringify({
                    mType: 'SERVER_CHAT',
                    mSender: userNick,
                    mSenderNo: userNo,
                    mContent: messageInput,
                    mTimestamp: timestamp
                }));
            }
            setMessageInput('');
            console.log("메시지 전송 완료, 입력 필드 초기화 (ServerChatbox).");
        } else {
            if (!stompClientInstanceRef.current) {
                console.warn("메시지 전송 실패 (ServerChatbox): STOMP Client 인스턴스가 없습니다.");
            } else if (!isConnected) {
                console.warn("메시지 전송 실패 (ServerChatbox): STOMP Client가 연결되어 있지 않습니다.");
            } else if (!messageInput.trim()) {
                console.warn("메시지 전송 실패 (ServerChatbox): 메시지 내용이 비어 있습니다.");
            } else {
                console.warn("메시지 전송 실패 (ServerChatbox): 사용자 정보(닉네임/번호)가 유효하지 않습니다.");
            }
        }
    };

    // Enter 키 입력 처리
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // 귓속말 모드 토글 함수
    const toggleWhisperMode = () => {
        setIsWhisperMode(prev => !prev);
        if (!isWhisperMode) {
            setWhisperTarget('');
        }
        console.log(`귓속말 모드 토글됨 (ServerChatbox): ${!isWhisperMode ? '활성화' : '비활성화'}`);
    };

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
                    <div key={index} className={`chat-message ${msg.mSender === userNick ? 'my-message' : ''} ${msg.mType === 'WHISPER_CHAT' ? 'whisper' : ''} ${msg.mType === 'SERVER_JOIN' || msg.mType === 'SERVER_LEAVE' ? 'system-message' : ''}`}>
                        {msg.mType === 'SERVER_JOIN' || msg.mType === 'SERVER_LEAVE' ? (
                            <span className="system-text">{msg.mContent} <span className="timestamp">[{msg.mTimestamp}]</span></span>
                        ) : msg.mType === 'WHISPER_CHAT' ? (
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
                    disabled={!isConnected}
                />
                <button id="emojiBtn" className="emojiBtn" disabled={!isConnected}>😊</button>
                <button id="sendBtn" className="sendBtn" onClick={sendMessage} disabled={!isConnected}>전달</button>
            </div>
        </div>
    );
};

export default ServerChatbox;