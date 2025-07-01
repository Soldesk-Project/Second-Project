import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ServerSelect = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const ServerStyle = {
        textAlign: "center",
        borderRadius: "20px",
        marginBottom: "15px",
        backgroundColor: "rgba(57, 72, 102, 1)",
    };
    
    const server = ["1서버","2서버","3서버"];

    const handleServer = (e, index) => {
        let serverNo = index + 1;
        navigate(`/main/${serverNo}`, { state: location.state });
    }
    
    return (
        <div className="login-background login-container">
            <div className="login-box">
                <img src='/images/logo.png' alt='로고이미지' className='logo-img'/>
                {
                    server.map( (server, index) => (
                        <div key={index} style={ServerStyle} onClick={(e) => handleServer(e, index)}>
                            {server}
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default ServerSelect;