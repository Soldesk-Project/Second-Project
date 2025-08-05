import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../css/adminPage/QuestErrRepoManage.module.css';

const PAGE_SIZE = 5;

const QuestErrRepoManage = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [openReportId, setOpenReportId] = useState(null);
  const [editReport, setEditReport] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`/api/getReportQuestion?page=${page}&size=${PAGE_SIZE}`);
        setReports(res.data.items || res.data);
        setTotalReports(res.data.totalCount || (res.data.length || 0));
      } catch (error) {
        console.error('신고 목록 불러오기 실패', error);
        setReports([]);
        setTotalReports(0);
      }
    };
    fetchReports();
  }, [page]);

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
    if (openReportId === id) {
      setEditReport(null);
    }
  };

  const getTotalPages = () => Math.max(1, Math.ceil(totalReports / PAGE_SIZE));

  const modifyQuestion = (report) => {
    setEditReport({
      ...report,
    });
  };

  const handleEditChange = (key, value) => {
    setEditReport((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveEdit = async () => {
    try {
      const res = await axios.post(
        '/admin/editQuestion',
        {
          id: editReport.question_id,
          subject: editReport.subject,
          question_text: editReport.question_text,
          option_1: editReport.option_1,
          option_2: editReport.option_2,
          option_3: editReport.option_3,
          option_4: editReport.option_4,
          correct_answer: editReport.correct_answer
        },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log('수정 데이터 전송:', editReport);
      alert('수정 완료');

      // 수정 후 목록 갱신
      setEditReport(null);
      setOpenReportId(null);
      setPage(1);
    } catch (error) {
      console.error('수정 실패', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  }

  const cancelEdit = () => {
    setEditReport(null);
  };

  return (
    <section className={styles.content}>
      <h1>문제 오류 신고 관리</h1>

      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>문제 내용</li>
        <li>신고자</li>
        <li>신고일</li>
      </ul>

      <ul className={styles.listView}>
        {reports.length > 0 ? (
          reports.map((report, idx) => {
            const isOpen = openReportId === (report.history_id || idx);
            const isEditing = editReport && editReport.history_id === report.history_id;

            return (
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
                    {report.report_at ? new Date(report.report_at).toLocaleDateString() : '-'}
                  </span>
                </div>

                {isOpen && (
                  <div className={styles.detailContentArea}>
                    <div className={styles.detailContent}>
                      <p>{report.reason}</p>
                      <hr />
                      {isEditing ? (
                        <>
                          <textarea
                            rows={4}
                            className={styles.questionText}
                            value={editReport.question_text}
                            onChange={(e) => handleEditChange('question_text', e.target.value)}
                          />

                          {report.image_data_base64 && (
                            <div className={styles.questionImage}>
                              <img src={`data:image/png;base64,${report.image_data_base64}`} alt="문제 이미지" />
                            </div>
                          )}

                          <ul className={styles.optionList}>
                            {[1, 2, 3, 4].map((num) => (
                              <li
                                key={num}
                                className={editReport.correct_answer === num ? styles.correctAnswer : ''}
                              >
                                <input
                                  type="text"
                                  value={editReport[`option_${num}`] || ''}
                                  onChange={(e) => handleEditChange(`option_${num}`, e.target.value)}
                                  style={{ width: '90%' }}
                                />
                                <label style={{ marginLeft: 10 }}>
                                  <input
                                    type="radio"
                                    name={`correct_answer_${report.history_id}`}
                                    checked={editReport.correct_answer === num}
                                    onChange={() => handleEditChange('correct_answer', num)}
                                  />
                                  정답
                                </label>
                              </li>
                            ))}
                          </ul>

                          <button onClick={saveEdit}>저장</button>
                          <button onClick={cancelEdit} style={{ marginLeft: 10 }}>
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <p className={styles.questionText}>
                            {report.question_text || '문제 내용이 없습니다.'}
                          </p>

                          {report.image_data_base64 && (
                            <div className={styles.questionImage}>
                              <img src={`data:image/png;base64,${report.image_data_base64}`} alt="문제 이미지" />
                            </div>
                          )}

                          <ul className={styles.optionList}>
                            {[report.option_1, report.option_2, report.option_3, report.option_4].map(
                              (option, index) => (
                                <li
                                  key={index}
                                  className={report.correct_answer === index + 1 ? styles.correctAnswer : ''}
                                >
                                  {option || '-'}
                                </li>
                              )
                            )}
                          </ul>

                          <button onClick={() => modifyQuestion(report)}>수정</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })
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
