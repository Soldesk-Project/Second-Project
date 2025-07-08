import React, { useEffect, useState, useMemo } from 'react';
import styles from '../css/achievementsList.module.css';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AchievementsList = () => {
  const [achievementList, setAchievementsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const { user } = useSelector((state) => state.user);
  const { isTop10 } = useSelector((state) => state.ranking);

  const { user_no, user_rank, user_play_count, user_1st_count } = user;

  const filterOptions = [
    { value: 'all', label: '전체' },
    { value: 'tier', label: '티어' },
    { value: 'gamePlay', label: '게임 플레이' },
    { value: 'game1st', label: '게임 1등' },
  ];

  const fetchAchievements = async () => {
    try {
      const { data, status } = await axios.get('/achievements', { params: { user_no } });
      if (status === 200) {
        setAchievementsList(data);
      } else {
        throw new Error('업적 요청 실패');
      }
    } catch (error) {
      console.error('업적 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const isAchievable = (ach) => {
    const { ach_type, ach_content } = ach;

    switch (ach_type) {
      case 'tier':
        return ach_content === 0 ? (user_rank > 800 ? isTop10 : false) : user_rank >= ach_content;
      case 'gamePlay':
        return user_play_count >= ach_content;
      case 'game1st':
        return user_1st_count >= ach_content;
      default:
        return false;
    }
  };

  const rewardButton = async (ach_title, ach_reward) => {
    try {
      const { status } = await axios.post('/achievement/add', {
        ach_title,
        ach_reward,
        user_no,
      });
      if (status === 200) fetchAchievements();
    } catch (error) {
      console.error('업적 리워드 전송 실패:', error);
    }
  };

  const handleAllRewards = () => {
    achievementList.forEach((ach) => {
      if (ach.is_reward === 'false' && isAchievable(ach)) {
        rewardButton(ach.ach_title, ach.ach_reward);
      }
    });
  };

  const hasAvailableRewards = useMemo(
    () => achievementList.some((ach) => ach.is_reward === 'false' && isAchievable(ach)),
    [achievementList, user_rank, user_play_count, user_1st_count, isTop10]
  );

  const filteredAchievements = useMemo(() => {
    return filterType === 'all'
      ? achievementList
      : achievementList.filter((ach) => ach.ach_type === filterType);
  }, [achievementList, filterType]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className={styles.box}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.col_title}>
                업적이름
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ marginLeft: '10px' }}>
                  {filterOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </th>
              <th className={styles.col_content}>업적내용</th>
              <th className={styles.col_reward}>보상 (Point)</th>
              <th className={styles.col_button}>
                <button
                  onClick={handleAllRewards}
                  disabled={!hasAvailableRewards}
                  className={hasAvailableRewards ? styles.allRewardButton : styles.disabledAllRewardButton}
                >
                  모두 받기
                </button>
              </th>
            </tr>
          </thead>
        </table>

        <div className={styles.scrollBody}>
          <table className={styles.table}>
            <tbody>
              {[...filteredAchievements]
                .sort((a, b) => (a.is_reward === 'true') - (b.is_reward === 'true'))
                .map((ach, index) => {
                  const { ach_title, ach_content, ach_reward, ach_type, is_reward } = ach;
                  const rewarded = is_reward === 'true';
                  const achievable = isAchievable(ach);
                  const disabled = rewarded || !achievable;

                  const progress = () => {
                    if (ach_content === 0) return '';
                    if (ach_type === 'tier') return `${user_rank} / ${ach_content}`;
                    if (ach_type === 'gamePlay') return `${user_play_count} / ${ach_content}`;
                    if (ach_type === 'game1st') return `${user_1st_count} / ${ach_content}`;
                    return '';
                  };

                  return (
                    <tr key={index} className={rewarded ? styles.rewardedRow : ''}>
                      <td className={styles.col_title}>{ach_title}</td>
                      <td className={styles.col_content}>{progress()}</td>
                      <td className={styles.col_reward}>{ach_reward}</td>
                      <td className={styles.col_button}>
                        <button
                          onClick={() => rewardButton(ach_title, ach_reward)}
                          disabled={disabled}
                          className={disabled ? styles.disabledButton : styles.button}
                        >
                          받기
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AchievementsList;
