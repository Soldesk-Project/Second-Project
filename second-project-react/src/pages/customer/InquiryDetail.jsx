import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../layout/Header';
import styles from '../../css/customer.module.css';
import axios from 'axios';

const InquiryDetail = () => {
  const { id } = useParams();         // URL의 :id
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
    axios.get(`/api/customer/inquiries/${id}`)
      .then(res => setPost(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!post) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.customerServiceCenter}>
        <div className={styles.topNav}><Header/></div>
      <div className={styles.inqueriesBox}>

        <div className={styles.detailBox}>
          <div className='writeData'><span>작성일 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span></div>
          <div className={styles.meta}>
            <h2 className={styles.postTitle}>{post.subject}</h2>
            <span>작성자: {post.user_id}</span>
          </div>
          <div className={styles.content}>
            {/* HTML 태그 포함 본문이라면 */}
            <div dangerouslySetInnerHTML={{ __html: post.message }} />
            {/* 순수 텍스트만 있다면 아래처럼 */}
            {/* <p>{post.content}</p> */}
          </div>
      </div>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            목록으로 돌아가기
          </button>

      </div>
    </div>
  );
}

export default InquiryDetail;
