import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../../css/adminPage/ReportDetails.module.css';

const PAGE_SIZE = 8;

const ReportDetails = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [openReportId, setOpenReportId] = useState(null);
  const [editReport, setEditReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`/chat/getReportHistory?page=${page}&size=${PAGE_SIZE}`);
        console.log(res.data.items);
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

  const toggleDetails = (id) => {
    setOpenReportId(openReportId === id ? null : id);
    if (openReportId === id) {
      setEditReport(null);
    }
  };

  const getTotalPages = () => Math.max(1, Math.ceil(totalReports / PAGE_SIZE));














  return (
    <section className={styles.content}>
      <h1>유저 신고 내역</h1>

      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>신고 사유</li>
        <li>채팅 작성자</li>
        <li>신고일</li>
      </ul>

      <ul className={styles.listView}>
        {reports.length > 0 ? (
          reports.map((report, idx) => (
            <li key={idx} className={styles.listItem}>
              <div
                className={styles.listItemHeader}
                onClick={() => toggleDetails(idx)}
                style={{ cursor: 'pointer' }}
              >
                <span className={styles.listItemNo}>{idx + 1}</span>
                <span className={styles.listItemTitle}>
                  {report.reason || '신고 사유가 없습니다.'}
                </span>
                <span className={styles.listItemAuthor}>{report.reported_user || '익명'}</span>
                <span className={styles.listItemDate}>
                  {report.reported_at
                    ? new Date(report.reported_at).toLocaleDateString()
                    : '-'}  
                </span>
              </div>

              {openReportId === (report.history_id || idx) && (
                <div className={styles.detailContentArea}>
                  <div className={styles.detailContent}>
                    <p className={styles.questionText}>
                      ###작성된 메세지 내용###
                      <br/>
                      {report.message || '메세지 내용이 없습니다.'}
                    </p>
                  </div>
                </div>
              )}
            </li>
          ))
        ) : (
          <li className={styles.noData}>신고된 채팅이 없습니다.</li>
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

export default ReportDetails;