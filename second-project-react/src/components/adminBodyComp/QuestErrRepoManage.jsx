import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../css/adminPage/QuestErrRepoManage.module.css';

const PAGE_SIZE = 5;

const QuestErrRepoManage = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
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

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setEditReport(null);
  };

  const modifyQuestion = () => {
    setEditReport({ ...selectedReport });
  };

  const handleEditChange = (key, value) => {
    setEditReport((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveEdit = async () => {
    try {
      await axios.post(
        'api/admin/editQuestion',
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
      alert('수정 완료');
      setEditReport(null);
    } catch (error) {
      console.error('수정 실패', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const getTotalPages = () => Math.max(1, Math.ceil(totalReports / PAGE_SIZE));

  return (
    <section className={styles.pageContainer}>
      <h1>문제 오류 신고 관리</h1>
      <div className={styles.splitViewContainer}>
        {/* 좌측 리스트 */}
        <div className={styles.leftPanel}>
          <ul className={styles.listHeader}>
            <li>번호</li>
            <li>문제 내용</li>
            <li>신고자</li>
            <li>신고일</li>
          </ul>
          <ul className={styles.listView}>
            {reports.length > 0 ? (
              reports.map((report, idx) => (
                <li
                  key={report.history_id || idx}
                  className={`${styles.listItem} ${
                    selectedReport?.history_id === report.history_id ? styles.selectedRow : ''
                  }`}
                  onClick={() => handleSelectReport(report)}
                >
                  <span>{report.history_id || idx + 1}</span>
                  <span>[{setKoreanToCategory(report.subject)}] 문제 오류 제보</span>
                  <span>{report.user_nick || '익명'}</span>
                  <span>{report.report_at ? new Date(report.report_at).toLocaleDateString() : '-'}</span>
                </li>
              ))
            ) : (
              <li className={styles.noData}>신고된 문제가 없습니다.</li>
            )}
          </ul>
          <div className={styles.pagination}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</button>
            <span>{page} / {getTotalPages()}</span>
            <button onClick={() => setPage((p) => Math.min(getTotalPages(), p + 1))} disabled={page === getTotalPages()}>다음</button>
          </div>
        </div>

        {/* 우측 상세 */}
        <div className={styles.rightPanel}>
          {selectedReport ? (
            <div>
              {editReport ? (
                <>
                  <textarea
                    rows={4}
                    value={editReport.question_text}
                    onChange={(e) => handleEditChange('question_text', e.target.value)}
                  />
                  {selectedReport.image_data_base64 && (
                    <img src={`data:image/png;base64,${selectedReport.image_data_base64}`} alt="문제 이미지" />
                  )}
                  <ul>
                    {[1, 2, 3, 4].map((num) => (
                      <li key={num}>
                        <input
                          type="text"
                          value={editReport[`option_${num}`] || ''}
                          onChange={(e) => handleEditChange(`option_${num}`, e.target.value)}
                        />
                        <label>
                          <input
                            type="radio"
                            name="correct_answer"
                            checked={editReport.correct_answer === num}
                            onChange={() => handleEditChange('correct_answer', num)}
                          />
                          정답
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button onClick={saveEdit}>저장</button>
                  <button onClick={() => setEditReport(null)}>취소</button>
                </>
              ) : (
                <>
                  <p>{selectedReport.reason}</p>
                  <hr />
                  <p>{selectedReport.question_text}</p>
                  {selectedReport.image_data_base64 && (
                    <img src={`data:image/png;base64,${selectedReport.image_data_base64}`} alt="문제 이미지" />
                  )}
                  <ul>
                    {[selectedReport.option_1, selectedReport.option_2, selectedReport.option_3, selectedReport.option_4].map(
                      (opt, idx) => (
                        <li key={idx} style={{ fontWeight: selectedReport.correct_answer === idx + 1 ? 'bold' : 'normal' }}>
                          {opt}
                        </li>
                      )
                    )}
                  </ul>
                  <button onClick={modifyQuestion}>수정</button>
                </>
              )}
            </div>
          ) : (
            <div className={styles.noSelectionMessage}>
              왼쪽 목록에서 문제 신고를 선택하세요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuestErrRepoManage;
