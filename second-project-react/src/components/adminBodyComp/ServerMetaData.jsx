import axios from 'axios';
import styles from '../../css/adminPage/ServerData.module.css';
import React, { useEffect, useState } from 'react';

const ServerMetaData = () => {
    const [serverInfo, setServerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        handleMetaDataFetch();
    }, []);

    const handleMetaDataFetch = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/admin/ec2-info/meta-data');
            if (response.status === 200) {
                console.log('서버 메타데이터:', response.data);
                setServerInfo(response.data);
            } else {
                setError(`서버 메타데이터 가져오기 실패: ${response.status}`);
            }
        } catch (err) {
            setError('서버 메타데이터 요청 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
            <h1 className={styles.serverMetaTitle}>서버 메타 데이터</h1>
            <hr className={styles.serverDataHr}/>

            {loading && (
                <div className={styles.metaStatus + ' ' + styles.metaLoading}>메타데이터 로딩 중...</div>
            )}

            {error && (
                <div className={styles.metaStatus + ' ' + styles.metaError}>{error}</div>
            )}

            {!loading && !error && serverInfo && (
                <div className={styles.metaCard}>
                    <div className={styles.metaSummary}>
                        <div>
                            <span className={styles.summaryLabel}>인스턴스 ID</span>
                            <span className={styles.summaryValue}>{serverInfo['instance-id']}</span>
                        </div>
                        <div>
                            <span className={styles.summaryLabel}>타입</span>
                            <span className={styles.summaryValue}>{serverInfo['instance-type']}</span>
                        </div>
                        <div>
                            <span className={styles.summaryLabel}>리전</span>
                            <span className={styles.summaryValue}>{serverInfo['region']}</span>
                        </div>
                    </div>
                    <div className={styles.metaDetailTitle}>전체 메타데이터</div>
                    <div className={styles.metaTableWrapper}>
                        {renderTable()}
                    </div>
                </div>
            )}
            <button className={styles.refreshButton} onClick={handleMetaDataFetch}>새로고침</button>
        </div>
    );
};

export default ServerMetaData;