import React, { useEffect, useState } from 'react';

const ServerStatus = () => {
    const [status, setStatus] = useState({ server1: 0, server2: 0, server3: 0 });
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:9099/ws/server-status");
        ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStatus(data);
        };
        setSocket(ws);

        return () => {
        ws.close();
        };
    }, []);

    const switchServer = (serverNo) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ serverNo }));
        }
    };
    return (
        <div className="p-4 space-y-4">
            <div className="text-xl font-bold">서버별 접속자 수</div>
            <ul>
                <li>서버 1: {status.server1}명</li>
                <li>서버 2: {status.server2}명</li>
                <li>서버 3: {status.server3}명</li>
            </ul>
            <div className="space-x-2 mt-4">
                <button onClick={() => switchServer(1)}>서버 1 접속</button>
                <button onClick={() => switchServer(2)}>서버 2 접속</button>
                <button onClick={() => switchServer(3)}>서버 3 접속</button>
            </div>
        </div>
    );
};

export default ServerStatus;