import React, { useEffect, useRef, useState, useCallback } from 'react'; // useCallback 추가
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../../css/chatbox.css'; // 동일한 CSS 사용 가능
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

    const GameChatbox = ({ gameroomNo, userNick, userNo, onNewMessage, currentUser }) => {
    // STOMP 클라이언트 인스턴스, 구독 정보, JOIN 메시지 전송 여부를 관리할 useRef
    const stompClientRef = useRef(null); // 이름 변경: stompClientInstanceRef -> stompClientRef
    const subscriptionRef = useRef(null); // 구독 객체 참조 추가

    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isWhisperMode, setIsWhisperMode] = useState(false); // 게임방에서는 귓속말 모드 비활성화 or 서버 기능 필요
    const [whisperTarget, setWhisperTarget] = useState(''); // 게임방에서는 귓속말 대상 불필요
    const chatLogRef = useRef(null);
    const hasSentJoinRef = useRef(false); // hasSentAddUserRef -> hasSentJoinRef (게임방 JOIN 메시지)
    const [isConnected, setIsConnected] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isChatBanModalOpen, setIsChatBanModalOpen] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const [alertMessage, setAlertMessage] = useState('');


    const isCurrentUserChatBanned = currentUser?.ischatbanned === 1;
    const currentUserBanTimestamp = currentUser?.banned_timestamp;

    useEffect(() => {
        // props 유효성 검사
        if (!userNick || userNo == null || !gameroomNo) {
            console.warn("GameChatbox: 필수 props 누락. 연결 시도하지 않음.");
            // 필요한 경우 여기서 기존 연결을 끊는 로직 추가 (아래 cleanupExistingConnection 재활용 가능)
            return;
        }

        // 기존 연결을 정리 함수
        const cleanupExistingConnection = () => {
            const client = stompClientRef.current;
            const subscription = subscriptionRef.current;

            if (subscription) {
                try {
                    subscription.unsubscribe(); // 구독 해제
                } catch (e) {
                    console.warn("GameChatbox: 구독 해제 중 오류 발생:", e);
                }
                subscriptionRef.current = null;
            }

            if (client && client.connected) {
                
                // GAME_LEAVE 메시지 전송
                client.send(`/app/gameChat.leaveUser/${gameroomNo}`, {}, JSON.stringify({
                    mType: 'GAME_LEAVE',
                    mSender: userNick,
                    mSenderNo: userNo,
                    gameroomNo: gameroomNo
                }));

                // 비동기적인 연결 해제를 위해 짧은 지연 후 disconnect
                setTimeout(() => {
                    if (client.connected) { // 혹시 그 사이에 이미 해제되지 않았는지 확인
                        client.disconnect(() => {
                            stompClientRef.current = null;
                            setIsConnected(false);
                            hasSentJoinRef.current = false;
                        });
                    } else {
                    }
                }, 50); // 짧은 지연 (메시지 전송 시간을 벌기 위함)

            } else {
                stompClientRef.current = null;
                setIsConnected(false);
                hasSentJoinRef.current = false;
            }
            setMessages([]); // 연결 해제 시 메시지 목록 초기화
        };

        // 이펙트가 다시 실행될 때마다 기존 연결을 먼저 정리
        cleanupExistingConnection();

        // 새로운 STOMP 연결 시도
        const socket = new SockJS('http://192.168.0.112:9099/ws-game-chat'); // ⭐ 게임방 채팅 엔드포인트 변경
        const client = Stomp.over(() => socket);
        client.debug = () => {};

        client.connect({}, frame => {
            stompClientRef.current = client;
            setIsConnected(true);
            setMessages([]); // 새 연결 성공 시 메시지 목록 초기화
            hasSentJoinRef.current = false; // 새 연결이므로 GAME_JOIN 메시지 보낼 준비

            // 게임방 채팅 구독 (`/serverChat/public` -> `/gameChat/{gameroomNo}`)
            const sub = client.subscribe(`/gameChat/${gameroomNo}`, message => {
                try {
                    const receivedMessage = JSON.parse(message.body);

                    // mContent가 null일 경우 처리
                    if (receivedMessage.mType === 'GAME_LEAVE' && receivedMessage.mContent === null) {
                        receivedMessage.mContent = `${receivedMessage.mSender}님이 퇴장했습니다.`;
                    } else if (receivedMessage.mType === 'GAME_JOIN' && receivedMessage.mContent === null) {
                        receivedMessage.mContent = `${receivedMessage.mSender}님이 입장했습니다.`;
                    }

                    setMessages(prevMessages => [...prevMessages, receivedMessage]);

                    // ⭐ 말풍선 기능: 'GAME_CHAT' 타입 메시지만 onNewMessage를 통해 부모(InPlay.jsx)로 전달
                    if (onNewMessage && receivedMessage.mType === 'GAME_CHAT') {
                        onNewMessage(receivedMessage);
                    }

                } catch (e) {
                    console.error("🚫 GameChatbox: 메시지 파싱 오류:", e, "원본 메시지:", message.body);
                }
            });
            subscriptionRef.current = sub; // 구독 객체 참조 저장

            // 'addUser' (GAME_JOIN) 메시지 전송 (`/app/serverChat.addUser` -> `/app/gameChat.addUser/{gameroomNo}`)
            if (!hasSentJoinRef.current) {
                client.send(`/app/gameChat.addUser/${gameroomNo}`, {}, JSON.stringify({
                    mType: 'GAME_JOIN',
                    mSender: userNick,
                    mSenderNo: userNo,
                    gameroomNo: gameroomNo // 게임방 번호 추가
                }));
                hasSentJoinRef.current = true;
            } else {
            }

        }, error => {
            console.error("GameChatbox: STOMP 서버 연결 실패:", error);
            // alert("게임방 서버 연결에 실패했습니다. 새로고침 해주세요.");
            stompClientRef.current = null;
            setIsConnected(false);
            hasSentJoinRef.current = false;
        });

        // 클린업 함수 (컴포넌트 언마운트 또는 의존성 변경 시 실행)
        return () => {
            cleanupExistingConnection(); // 기존 연결 정리 로직 재사용
        };
    // 의존성 배열에 gameroomNo 추가 (이게 바뀌면 useEffect 재실행)
    // onNewMessage는 InPlay.jsx에서 useCallback으로 감싸져야 함
    }, [gameroomNo, userNick, userNo, onNewMessage, currentUser]);

    // 메시지 목록이 업데이트될 때마다 스크롤을 최하단으로 이동
    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [messages]);

    // 메시지 전송 함수
    const sendMessage = () => {
        if (messageInput.length>1000) {
            setAlertMessage('채팅이 너무 깁니다. 1,000자 이하로 입력해 주세요.');
            setTimeout(() => {
                setAlertMessage('');
            }, 3000);
            setMessageInput('');
            return;
        }
        // 채팅 금지 상태 확인
        if (isCurrentUserChatBanned) {
            setIsChatBanModalOpen(true); // 채팅 금지 모달 띄우기
            setMessageInput(''); // 입력창 비우기
            return; // 메시지 전송 로직 중단
        }

        // 게임방 채팅은 귓속말 없음. 항상 GAME_CHAT 타입
        if (stompClientRef.current && isConnected && messageInput.trim() && userNick && userNo !== undefined && userNo !== null) {
            const messageToSend = {
                mType: 'GAME_CHAT', // 게임방 채팅 메시지 타입 고정
                mSender: userNick,
                mSenderNo: userNo,
                mContent: messageInput,
                mTimestamp: Date.now(),
                gameroomNo: gameroomNo // 게임방 번호 추가
            };

            stompClientRef.current.send(`/app/gameChat.sendMessage/${gameroomNo}`, {}, JSON.stringify(messageToSend)); // ⭐ 전송 주소 변경

            setMessageInput('');
        } else {
            if (!stompClientRef.current) {
                console.warn("메시지 전송 실패 (GameChatbox): STOMP Client 인스턴스가 없습니다.");
            } else if (!isConnected) {
                console.warn("메시지 전송 실패 (GameChatbox): STOMP Client가 연결되어 있지 않습니다.");
            } else if (!messageInput.trim()) {
                console.warn("메시지 전송 실패 (GameChatbox): 메시지 내용이 비어 있습니다.");
            } else {
                console.warn("메시지 전송 실패 (GameChatbox): 사용자 정보(닉네임/번호)가 유효하지 않거나 게임방 번호가 없습니다.");
            }
        }
    };

    // Enter 키 입력 처리 (GameChatbox에서는 handleGameKeyPress로 변경될 수 있음)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // 귓속말 모드 관련 함수들은 게임방에서 사용하지 않으므로 제거하거나 비활성화
    // 여기서는 일단 남겨두지만, 게임방에서는 UI에서 버튼을 제거하거나 disabled 처리 필요
    const toggleWhisperMode = () => {
        // 게임방에서는 귓속말 모드 비활성화
        setIsWhisperMode(false); 
        setWhisperTarget('');
    };

    //신고처리 (기존과 동일)
    const openReportModal = (msg) => {
        setReportMessage(msg)
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
    };

    

    return (
        <div className="chatbox-container">
            <div className="chatbox-log" ref={chatLogRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.mSender === userNick ? 'my-message' : ''} ${msg.mType === 'GAME_JOIN' || msg.mType === 'GAME_LEAVE' ? 'system-message' : ''}`}>
                        {msg.mType === 'GAME_JOIN' || msg.mType === 'GAME_LEAVE' ? (
                            <span className="system-text">{msg.mContent} <span className="timestamp">[{formatTimestamp(msg.mTimestamp)}]</span></span>
                        ) : (
                            <>
                                <span className="sender">{msg.mSender} : </span>
                                <span className="message-content">{msg.mContent}</span>
                                <span className="timestamp">[{formatTimestamp(msg.mTimestamp)}]</span>
                                <button id="reportBtn" onClick={()=>openReportModal(msg)}> 신고</button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="chatbox-alert">
                {alertMessage && <span>{alertMessage}</span>}
            </div>
            <div className="chatbox-input">
                <input
                    type="text"
                    id="gameChatInput" // id 변경
                    className="chatInput"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="게임방 메시지 입력..."
                    disabled={!isConnected}
                />
                <button id="gameSendBtn" className="sendBtn" onClick={sendMessage} disabled={!isConnected}>전달</button>
            </div>

            <ChatReportModal
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                reportMessage={reportMessage}
            />

            <ChatBanModal
                isOpen={isChatBanModalOpen}
                onClose={() => setIsChatBanModalOpen(false)}
                bannedTimestamp={currentUserBanTimestamp} // 모달에 채팅 금지 시간 전달
            />

        </div>
    );
};

export default GameChatbox;