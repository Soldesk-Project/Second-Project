import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../css/serverSelect.css';

const ServerSelect = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId } = location.state || {};

    const ServerStyle = {
        textAlign: "center",
        borderRadius: "20px",
        marginTop: "25px",
    };

    const server = ["1서버","2서버","3서버","4서버","5서버"];

    const handleServer = (e, index) => {
        let serverNo = index + 1;
        navigate(`/main/${serverNo}`, { state: { userId } });
    }
    
    return (
        <div className="login-background login-container">
                <img src='images/logo.png' alt='logo'/>
            <div className="server-box">
                {
                    server.map( (server, index) => (
                        <div className='serverselectBtn' key={index} style={ServerStyle} onClick={(e) => handleServer(e, index)}>
                            {server}
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default ServerSelect;