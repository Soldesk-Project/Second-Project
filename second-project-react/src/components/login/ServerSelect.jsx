import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServerSelect = () => {
    const navigate = useNavigate();

    const ServerStyle = {
        textAlign: "center",
        
        borderRadius: "20px",
        marginBottom: "10px",
        backgroundColor: "rgba(57, 72, 102, 1)",
    };

    const server = ["1서버","2서버","3서버","4서버","5서버","6서버","7서버","8서버","9서버"];

    const handleServer = (e, index) => {
        let serverNo = index + 1;
        navigate(`/main/${serverNo}`);
        
    }
    return (
        <div className="login-background login-container">
            <div className="login-box">
                <img src='/images/logo.png' alt='로고이미지' className='logoImg' style={{width: '100px', display: 'block', margin: '0 auto'}}/>
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