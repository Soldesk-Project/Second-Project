import React from 'react';
import Header from '../layout/Header';
import '../css/customer.css';
import { useNavigate } from 'react-router-dom';

const CustomerCenterNew = () => {

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
        
        <div>
          <p>아이디(db에서 불러오기)</p>
          {/* 이메일 입력필드 */}
          <input
            type="email"
            placeholder="문의 결과 안내받을 외부 이메일"
            required
          />

          {/* 문의 내용 텍스트 에어리어 */}
          <textarea
            placeholder="1. 문의 내용을 입력하세요."
            defaultValue="문의 내용"
            maxLength={1000}
          />
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
  );
};

export default CustomerCenterNew;