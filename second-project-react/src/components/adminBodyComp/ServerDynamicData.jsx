import axios from 'axios';
import styles from '../../css/adminPage/ServerData.module.css';
import React, { useEffect, useState } from 'react';

const ServerDynamicData = () => {
    const [serverInfo, setServerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        handelDynamicDataFetch();
    }, []);

    const handelDynamicDataFetch = async () => {
        // 서버 동적데이터를 가져오는 로직 작성
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/admin/ec2-info/dynamic-data');
            if (response.status === 200) {
                console.log('서버 동적데이터:', response.data);
                setServerInfo(response.data);
            } else {
                console.error('서버 동적데이터 가져오기 실패:', response.status);
            }

        } catch (err) {
            setError('서버 메타데이터 요청 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    
    const renderTable = () => {
            if (!serverInfo) return null;
    
            return (
                <table className={styles.metaTable}>
                    <thead>
                        <tr>
                            <th>항목</th>
                            <th>값</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(serverInfo).map(([key, value]) => (
                            <tr key={key}>
                                <td className={styles.metaKey}>{key}</td>
                                <td className={styles.metaValue}>
                                    {typeof value === 'object'
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        };

    return (
        <div className={styles.serverMetaContainer}>
                    <h1 className={styles.serverMetaTitle}>서버 동적 데이터</h1>
                    <hr className={styles.serverDataHr}/>
        
                    {loading && (
                        <div className={styles.metaStatus + ' ' + styles.metaLoading}>동적데이터 로딩 중...</div>
                    )}
        
                    {error && (
                        <div className={styles.metaStatus + ' ' + styles.metaError}>{error}</div>
                    )}
        
                    {!loading && !error && serverInfo && (
                        <div className={styles.metaCard}>
                            <div className={styles.metaTableWrapper}>
                                {renderTable()}
                            </div>
                        </div>
                    )}
                    <button className={styles.refreshButton} onClick={handelDynamicDataFetch}>새로고침</button>
                </div>
    );
};

export default ServerDynamicData;