import React, { useEffect, useState } from 'react';
import styles from '../css/achievementsList.module.css';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AchievementsList = () => {
  const [achievementList, setAchievementsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state) => state.user);
  
  const fetchAchievements = async () => {
        try {
            const { data, status } = await axios.get('/achievements');
            if (status === 200) {
                setAchievementsList(data);
                setLoading(false);
            } else {
                throw new Error('업적 요청 실패');
            }
        } catch (error) {
            console.error('업적 로드 실패:', error);
        }
    };

  useEffect(() => {
      fetchAchievements();
  }, []);
  
  if (loading) return <div>로딩 중...</div>;

  return (
    <div className={styles.box}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.col_title}>업적이름</th>
            <th className={styles.col_content}>업적내용</th>
            <th className={styles.col_reward}>보상</th>
            <th className={styles.col_button}><button>모두 받기</button></th>
          </tr>
        </thead>
        <tbody>
          {achievementList.map(({ ach_title, ach_content, ach_reward }, index) => (
            <tr key={index}>
              <td className={styles.col_title}>{ach_title}</td>
              <td className={styles.col_content}>
                {ach_content !== 0 ? `${user.user_rank} / ${ach_content}` : ''}
              </td>
              <td className={styles.col_reward}>{ach_reward}</td>
              <td className={styles.col_button}><button>받기</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AchievementsList;