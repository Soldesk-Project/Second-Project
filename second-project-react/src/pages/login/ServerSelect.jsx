import React from 'react';
import '../../css/serverSelect.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setServer } from '../../store/userSlice';

const ServerSelect = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const ServerStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "35px",
        borderRadius: "20px",
        marginTop: "25px",
        cursor: "pointer",
    };
    
    const server = ["1서버","2서버","3서버"];

    const handleServer = (e, index) => {
        let serverNo = index + 1;
        dispatch(setServer(serverNo));
        navigate(`/main/${serverNo}`);
    };

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