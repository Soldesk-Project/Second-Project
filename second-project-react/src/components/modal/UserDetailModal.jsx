import React, { useEffect, useState } from 'react';
import styles from "../../css/UserDetailModal.module.css";
import decoStyles from '../../css/Decorations.module.css'; // 이미 존재하지 않는다면 추가
import titleTextMap from '../../js/Decorations';
import { useSelector } from 'react-redux';
import axios from 'axios';

const UserDetailModal = ({ user, onClose }) => {
    const [profileSrc, setProfileSrc] = useState('/images/profile_default.png');
    const { isTop10 } = useSelector((state) => state.ranking);
    const [stats, setStats] = useState(null);
    useEffect(() => {
        if (!user.user_no) return;
        axios
        .get(`/user/accuracy/${user.user_nick}`)
        .then(res => setStats(res.data))
        
        .catch(err => console.error(err));
    }, [user.user_no]);
    const answerPercent = stats?.[0]?.accuracyPct || 0;
    // console.log(user);
    
    useEffect(() => {
        if (!user?.userProfileImg) return;
        const raw = user.userProfileImg;
        const src = raw.startsWith('/images/')
            ? raw
            : `/images/${raw}`;
        setProfileSrc(src);
    }, [user.userProfileImg]);
    const renderTier = () => {
        const rank = user.user_rank;
        if (rank > 800 && isTop10) return '챌린저';
        if (rank > 800) return '다이아몬드';
        if (rank > 400) return '플래티넘';
        if (rank > 200) return '골드';
        if (rank > 100) return '실버';
        return '브론즈';
    };
    if (!user) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>유저 상세 정보</h2>
        <div className={styles.userInfo_Box_1}>
            <div className={styles.profileWrapper}>
                <img 
                    src={profileSrc} 
                    alt='프로필'  
                    className={styles.profileImg}/>
                {user.imageFileName && (
                <img
                    src={`/images/${user.imageFileName}`}
                    alt="테두리 이미지"
                    className={styles.frameOverlay}
                />
                )}
            </div>

            <div className={styles.userInfo_Name}>
                <p>{user.userNick}</p>
                <p>{renderTier()}</p>
                <div className={styles.bar_set}>
                    <div className={styles.progressLine}>
                        <div
                        className={styles.progressFill}
                        style={{ width: `${answerPercent}%` }}
                        />
                    </div>
                    <div className={styles.label}>{answerPercent}% 정답률</div>
                </div>
            </div>
        </div>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default UserDetailModal;