import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../css/adminPage/QuestErrRepoManage.module.css';

const PAGE_SIZE = 5;

const QuestErrRepoManage = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [openReportId, setOpenReportId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`/api/getReportQuestion?page=${page}&size=${PAGE_SIZE}`);
        console.log(res.data);

        setReports(res.data.items || res.data); // items 없으면 배열 그대로 사용
        setTotalReports(res.data.totalCount || (res.data.length || 0));
      } catch (error) {
        console.error('신고 목록 불러오기 실패', error);
        setReports([]);
        setTotalReports(0);
      }
    };

    fetchReports();
  }, [page]);

  // 카테고리 변환 함수
  const setKoreanToCategory = (category) => {
    switch (category) {
      case "random": return "랜덤";
      case "cpe": return "정보처리기사";
      case "cpei": return "정보처리산업기사";
      case "cpet": return "정보처리기능사";
      case "lm1": return "리눅스마스터 1급";
      case "lm2": return "리눅스마스터 2급";
      case "icti": return "정보통신산업기사";
      case "ict": return "정보통신기사";
      case "sec": return "정보보안기사";
      case "net1": return "네트워크관리사 1급";
      case "net2": return "네트워크관리사 2급";
      default: return category || "알 수 없음";
    }
  };

  const toggleDetails = (id) => {
    setOpenReportId(openReportId === id ? null : id);
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalReports / PAGE_SIZE));
  };

  return (
    <section className={styles.content}>
      <h2>문제 오류 신고 관리</h2>

      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>문제 내용</li>
        <li>신고자</li>
        <li>신고일</li>
      </ul>

      <ul className={styles.listView}>
        {reports.length > 0 ? (
          reports.map((report, idx) => (
            <li key={report.history_id || idx} className={styles.listItem}>
              <div
                className={styles.listItemHeader}
                onClick={() => toggleDetails(report.history_id || idx)}
                style={{ cursor: 'pointer' }}
              >
                <span className={styles.listItemNo}>{report.history_id || idx + 1}</span>
                <span className={styles.listItemTitle}>
                  [{setKoreanToCategory(report.subject)}] 문제 오류 제보
                </span>
                <span className={styles.listItemAuthor}>{report.user_nick || '익명'}</span>
                <span className={styles.listItemDate}>
                  {report.report_at
                    ? new Date(report.report_at).toLocaleDateString()
                    : '-'}
                </span>
              </div>

              {openReportId === (report.history_id || idx) && (
                <div className={styles.detailContentArea}>
                  <div className={styles.detailContent}>
                    <p>{report.reason}</p>
                    <hr />
                    {/* 문제 텍스트 */}
                    <p className={styles.questionText}>
                      {report.question_text || '문제 내용이 없습니다.'}
                    </p>

                    {/* 문제 이미지 */}
                    {report.image_data_base64 && (
                      <div className={styles.questionImage}>
                        <img src={`data:image/png;base64,${report.image_data_base64}`} alt="문제 이미지"/>
                      </div>
                    )}

                    {/* 보기 4개 */}
                    <ul className={styles.optionList}>
                      {[report.option_1, report.option_2, report.option_3, report.option_4].map(
                        (option, index) => (
                          <li key={index} className={ report.correct_answer === index + 1 ? styles.correctAnswer : '' }>
                            {option || '-'}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          ))
        ) : (
          <li className={styles.noData}>신고된 문제가 없습니다.</li>
        )}
      </ul>

      <div className={styles.listFooter}>
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            이전
          </button>
          <span>{page} / {getTotalPages()}</span>
          <button
            onClick={() => setPage((p) => Math.min(getTotalPages(), p + 1))}
            disabled={page === getTotalPages()}
          >
            다음
          </button>
        </div>
      </div>
    </section>
  );
};

export default QuestErrRepoManage;
