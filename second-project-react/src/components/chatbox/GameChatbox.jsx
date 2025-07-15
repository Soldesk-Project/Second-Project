import React, { useEffect, useRef, useState } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import '../../css/chatbox.css'; // 동일한 CSS 사용 가능
// GameChatbox는 Redux 상태를 직접 구독하지 않고, 필요한 정보를 prop으로 받는 것이 좋습니다.
// import { useSelector } from 'react-redux'; // 여기서는 사용하지 않음
import ChatReportModal from './ChatReportModal';

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

const GameChatbox = ({ gameroomNo, userNick, userNo }) => {
    const stompClientInstanceRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const chatLogRef = useRef(null);
        const [isWhisperMode, setIsWhisperMode] = useState(false);
        const [whisperTarget, setWhisperTarget] = useState('');
    const hasSentJoinRef = useRef(false); // 게임방 JOIN 메시지 전송 여부 추적
    const [isConnected, setIsConnected] = useState(false); // 웹소켓 연결 상태를 추적하는 state
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
        client.debug = () => {};  // 아무 출력도 하지 않음

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
        const messageToSend = {
            mType: 'GAME_CHAT',
            mSender: userNick,
            mSenderNo: userNo,
            mContent: messageInput,
            mTimestamp: Date.now(),
            gameroomNo: gameroomNo
        };

        if (isWhisperMode && whisperTarget.trim()) {
            stompClientInstanceRef.current.send("/app/whisperChat.sendMessage", {}, JSON.stringify({
                ...messageToSend,
                mType: 'WHISPER_CHAT',
                mReceiver: whisperTarget,
            }));
            setMessages(prevMessages => [...prevMessages, {
                ...messageToSend,
                mType: 'WHISPER_CHAT',
                mReceiver: whisperTarget
            }]);
        } else {
            stompClientInstanceRef.current.send(`/app/gameChat.sendMessage/${gameroomNo}`, {}, JSON.stringify(messageToSend));
            // 보낸 게임방 메시지를 즉시 로컬 상태에 추가하여 화면에 표시
            setMessages(prevMessages => [...prevMessages, messageToSend]);
        }

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

        // 귓속말 모드 토글 함수
    const toggleWhisperMode = () => {
        setIsWhisperMode(prev => !prev);
        if (!isWhisperMode) {
            setWhisperTarget('');
        }
        console.log(`귓속말 모드 토글됨 (ServerChatbox): ${!isWhisperMode ? '활성화' : '비활성화'}`);
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
            <div className="chatbox-header">
                    <button onClick={() => setIsWhisperMode(false)}
                            className={!isWhisperMode ? 'active-mode-btn' : ''}>전체</button>
                    <button onClick={() => setIsWhisperMode(true)}
                            className={isWhisperMode ? 'active-mode-btn' : ''}>귓속말</button>
            </div>

            <div className="chatbox-log" ref={chatLogRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.mSender === userNick ? 'my-message' : ''} ${msg.mType === 'GAME_JOIN' || msg.mType === 'GAME_LEAVE' ? 'system-message' : ''}`}>
                        {msg.mType === 'GAME_JOIN' || msg.mType === 'GAME_LEAVE' ? (
                            <span className="system-text">{msg.mContent} <span className="timestamp">[{formatTimestamp(msg.mTimestamp)}]</span></span>
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

            {/* ★ 분리된 ChatReportModal 컴포넌트 사용 */}
            <ChatReportModal
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                onReportSubmit={handleReportSubmit}
                // recentMessages={messages.slice(-5)} // 필요하다면 최근 메시지를 props로 전달
            /> 
        </div>
    );
};

export default GameChatbox;