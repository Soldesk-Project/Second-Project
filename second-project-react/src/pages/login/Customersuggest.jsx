import React from 'react';
import Header from '../layout/Header';
import '../css/customer.css';
import { useNavigate } from 'react-router-dom';

const Customersuggest = () => {

  const navigate = useNavigate();

  const Backinquiries = () => {
    
  }

  return (
    <div className='customer-service-center'>
      <div className='top-nav'><Header/></div>

      <div className='inqueries-box'>

        <div className='title'>
          <p>고객 문의</p>
        </div>
        <div>
          <p>간단한 설명</p>
        </div>
        
        <div className='inq-container'>
        <div className='inq-container-two'>
          <div className='inqPw-Box'>
            <p>아이디(db에서 불러오기)</p>
            <p>게시글 비밀번호</p>
            <input></input>
          </div>
          <div className='email'>
            <input
              type="email"
              placeholder="문의 결과 안내받을 외부 이메일"
              required
            />
          </div>

          <div className='inq-text-Box'>
            <div className='inq-title'>
              <p>제목</p>
              <input type='text' placeholder='제목을 입력하세요.'/>
            </div>
            <textarea
              placeholder="1. 문의 내용을 입력하세요."
              defaultValue="문의 내용"
              maxLength={1000}
            />
          </div>
        </div>
          <div className='text-limit'>
            <p>0자 입력 / 최대 1000자</p>
          </div>

        <div>
          <p>사진첨부 (선택)</p>
          <p>업로드</p>
          <p>업로드 관련 제한사항 등 설명, 가능 불가능 확장자 설명</p>
        </div>

        <div>
          <p>개인정보 수집 동의 (필수)</p>
          <p>수집하는 개인정보 항목 : 이메일 주소</p>
          <p>동의 관련 문구 안내</p>
          <p>체크박스</p>
          <p>동의합니다.</p>
        </div>
        
        <div className='inqBtns'>
          <button className='submitBtn'>등록</button>
          <button className='submitBtn' onClick={() => navigate('/inquiries')}>돌아가기</button>
        </div>
        </div>
        
      </div>
    </div>
  );
};

export default Customersuggest;