import axios from 'axios';
import React, { useEffect } from 'react';

const ServerUserData = () => {
    const [serverInfo, setServerInfo] = React.useState(null);

    useEffect(() => {
        handelMetaDataFetch();
    }, []);

    const handelMetaDataFetch = async () => {
        // 서버 동적데이터를 가져오는 로직 작성
        try {
            
            const response = await axios.get('/api/admin/ec2-info/dynamic-data');
            if (response.status === 200) {
                console.log('서버 동적데이터:', response.data);
                setServerInfo(response.data);
            } else {
                console.error('서버 동적데이터 가져오기 실패:', response.status);
            }

        } catch (error) {
            
        }
    }

    return (
        <div>
            dynamicData: {serverInfo ? JSON.stringify(serverInfo) : '로딩 중...'}
        </div>
    );
};

export default ServerUserData;