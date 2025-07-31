import React, { useEffect, useRef, useState } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../../css/chatbox.css'; // 동일한 CSS 사용 가능
import { useSelector } from 'react-redux';
import ChatReportModal from '../modal/ChatReportModal';
import ChatBanModal from '../modal/ChatBanModal';

function formatTimestamp(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const ServerChatbox = () => {
    const stompClientInstanceRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const chatLogRef = useRef(null);
    const hasSentAddUserRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false); // 웹소켓 연결 상태를 추적하는 state
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isChatBanModalOpen, setIsChatBanModalOpen] = useState(false);

    const currentUser = useSelector((state) => state.user.user);
    const userNick = currentUser?.user_nick;
    const userNo = currentUser?.user_no;
    const isCurrentUserChatBanned = currentUser?.ischatbanned === 1;
    const currentUserBanTimestamp = currentUser?.banned_timestamp;

    useEffect(() => {

        if (!userNick || userNo === undefined || userNo === null) {
            return;
        }

        // 엄격 모드(StrictMode) 대응 및 이미 연결되어 있다면 재연결 시도하지 않음
        if (stompClientInstanceRef.current && isConnected) {
            if (!hasSentAddUserRef.current) {
                stompClientInstanceRef.current.send("/app/serverChat.addUser", {}, JSON.stringify({
                    mType: 'SERVER_JOIN',
                    mSender: userNick,
                    mSenderNo: userNo
                }));
                hasSentAddUserRef.current = true;
            }
            return;
        }

        const socket = new SockJS('http://192.168.0.112:9099/ws-chat'); // ★ 일반 서버 채팅 엔드포인트
        // const socket = new SockJS('http://localhost:9099/ws-chat'); // ★ 일반 서버 채팅 엔드포인트
        const client = Stomp.over(() => socket);
        client.debug = () => {};  // 아무 출력도 하지 않음

        client.connect({}, frame => {
            stompClientInstanceRef.current = client;
            setIsConnected(true); // 연결 성공 시 true로 설정
            setMessages([]); // 새로운 연결 시 메시지 목록 초기화

            // 공개 채팅방 구독
            client.subscribe('/serverChat/public', message => {
                try{
                    const receivedMessage = JSON.parse(message.body);
                    console.log("🟢 ServerChatbox: 수신된 공개 채팅 메시지:", receivedMessage);
                    console.log("🟢 ServerChatbox: setMessages 호출 전 prevMessages:", messages);
                    setMessages(prevMessages => [...prevMessages, receivedMessage]);
                } catch (e){
                    console.error("🚫 ServerChatbox: 메시지 파싱 오류:", e, "원본 메시지:", message.body);
                }
                
            });

            // 'addUser' 메시지 전송
            if (!hasSentAddUserRef.current) {
                client.send("/app/serverChat.addUser", {}, JSON.stringify({
                    mType: 'SERVER_JOIN',
                    mSender: userNick,
                    mSenderNo: userNo
                }));
                hasSentAddUserRef.current = true;
            } else {
            }

        }, error => {
            alert("서버 연결에 실패했습니다. 새로고침 해주세요.");
            stompClientInstanceRef.current = null; // 에러 시 참조 제거
            setIsConnected(false); // 연결 실패 시 false로 설정
        });

        // 클린업 함수
        return () => {
            const currentClient = stompClientInstanceRef.current;

            if (currentClient && currentClient.connected) {
                // SERVER_LEAVE 메시지 전송
                currentClient.send("/app/serverChat.leaveUser", {}, JSON.stringify({
                    mType: 'SERVER_LEAVE',
                    mSender: userNick,
                    mSenderNo: userNo
                }));

                currentClient.disconnect(() => {
                    stompClientInstanceRef.current = null; // 연결 해제 후 참조 제거
                    setIsConnected(false); // 연결 해제 시 false로 설정
                });
            } else {
                stompClientInstanceRef.current = null; // 연결되지 않았어도 확실히 null 설정
                setIsConnected(false); // 연결되지 않았어도 state 업데이트
            }
            hasSentAddUserRef.current = false; // 클린업 시 플래그 초기화
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
        if (isCurrentUserChatBanned) {
            setIsChatBanModalOpen(true); // 채팅 금지 모달 띄우기
            setMessageInput(''); // 입력창 비우기
            return;
        }

        if (stompClientInstanceRef.current && isConnected && messageInput.trim() && userNick && userNo !== undefined && userNo !== null) {
            const messageToSend = {
                mSender: userNick,
                mSenderNo: userNo,
                mContent: messageInput,
                mTimestamp: Date.now()
            };

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

    //신고처리
    const openReportModal = () => {
        console.log("신고버튼 클릭");
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
    };

    const handleReportSubmit = () => {
        console.log("신고하기 버튼 클릭됨. 다음 채팅 내역이 신고될 수 있습니다:", messages);
        alert("채팅이 신고되었습니다. 관리자가 확인 후 조치할 예정입니다.");
        closeReportModal(); // 신고 처리 후 모달 닫기
    };

    return (
        <div className="chatbox-container">
            <div className="chatbox-log" ref={chatLogRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.mSender === userNick ? 'my-message' : ''} ${msg.mType === 'WHISPER_CHAT' ? 'whisper' : ''} ${msg.mType === 'SERVER_JOIN' || msg.mType === 'SERVER_LEAVE' ? 'system-message' : ''}`}>
                        {msg.mType === 'SERVER_JOIN' || msg.mType === 'SERVER_LEAVE' ? (
                            <span className="system-text">{msg.mContent} <span className="timestamp">[{formatTimestamp(msg.mTimestamp)}]</span></span>
                        ) : msg.mType === 'WHISPER_CHAT' ? (
                            <>
                                <span className="whisper-text">
                                    [귓속말] {msg.mSender === userNick ? `To ${msg.mReceiver}` : `From ${msg.mSender}`}:
                                </span>
                                <span className="message-content">{msg.mContent}</span>
                                <span className="timestamp">[{formatTimestamp(msg.mTimestamp)}]</span>
                                <button id="reportBtn" onClick={openReportModal}> 신고</button>
                            </>
                        ) : (
                            <>
                                <span className="sender">{msg.mSender}:</span>
                                <span className="message-content">{msg.mContent}</span>
                                <span className="timestamp">[{formatTimestamp(msg.mTimestamp)}]</span>
                                <button id="reportBtn" onClick={openReportModal}> 신고</button>
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
                    placeholder="메시지 입력..."
                    disabled={!isConnected}
                />
                <button id="sendBtn" className="sendBtn" onClick={sendMessage} disabled={!isConnected}>전달</button>
            </div>

            {/* ChatReportModal 컴포넌트 */}
            <ChatReportModal
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                onReportSubmit={handleReportSubmit}
                // recentMessages={messages.slice(-5)} // 필요하다면 최근 메시지를 props로 전달
            />
            {/* 채팅 금지 모달 컴포넌트 */}
            <ChatBanModal
                isOpen={isChatBanModalOpen}
                onClose={() => setIsChatBanModalOpen(false)}
                bannedTimestamp={currentUserBanTimestamp} // 모달에 채팅 금지 시간 전달
            />
        </div>
    );
};

export default ServerChatbox;